import axios, { AxiosInstance } from 'axios';
import type { 
  AIRequest, 
  AIResponse, 
  StreamChunk, 
  ProviderType,
  LogContext 
} from '@deepwebai/shared-types';
import { BaseProvider } from '../../core/base-provider';

interface LlamaResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LocalLlamaProvider extends BaseProvider {
  readonly type: ProviderType = 'local-llama';
  readonly name = 'Local Llama';
  readonly supportedModels = [
    'llama-2-7b-chat',
    'llama-2-13b-chat',
    'llama-2-70b-chat',
    'codellama-7b',
    'codellama-13b',
    'codellama-34b',
    'mistral-7b',
    'mixtral-8x7b'
  ];
  readonly supportsStreaming = true;

  private client?: AxiosInstance;
  private defaultBaseUrl = 'http://localhost:11434/v1';

  protected async validateConfig(): Promise<void> {
    const config = this.ensureConfig();
    
    this.client = axios.create({
      baseURL: config.baseUrl || this.defaultBaseUrl,
      timeout: config.timeout || 60000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const client = this.ensureClient();
    const context: LogContext = {
      provider: this.type,
      model: request.model,
      requestId: crypto.randomUUID(),
      timestamp: Date.now()
    };

    return this.executeWithRetry(async () => {
      const response = await client.post<LlamaResponse>('/chat/completions', {
        model: request.model,
        messages: request.messages,
        temperature: request.config?.temperature || 0.7,
        max_tokens: request.config?.maxTokens || 2048,
        top_p: request.config?.topP,
        stop: request.config?.stopSequences,
        stream: false
      });

      const choice = response.data.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in Local Llama response');
      }

      const usage = response.data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };
      this.updateTokenUsage(usage.total_tokens);

      return {
        content: choice.message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        model: response.data.model,
        finishReason: choice.finish_reason as any || 'stop',
        id: response.data.id || crypto.randomUUID(),
        timestamp: Date.now()
      };
    }, context);
  }

  async *chatStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const client = this.ensureClient();
    const context: LogContext = {
      provider: this.type,
      model: request.model,
      requestId: crypto.randomUUID(),
      timestamp: Date.now()
    };

    try {
      const response = await client.post('/chat/completions', {
        model: request.model,
        messages: request.messages,
        temperature: request.config?.temperature || 0.7,
        max_tokens: request.config?.maxTokens || 2048,
        top_p: request.config?.topP,
        stop: request.config?.stopSequences,
        stream: true
      }, {
        responseType: 'stream'
      });

      let totalTokens = 0;
      let buffer = '';

      const stream = response.data;
      
      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield {
              content: '',
              done: true,
              usage: totalTokens > 0 ? {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens
              } : undefined
            };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const choice = parsed.choices?.[0];
            if (!choice) continue;

            const content = choice.delta?.content || '';
            const done = choice.finish_reason !== null && choice.finish_reason !== undefined;

            if (parsed.usage) {
              totalTokens = parsed.usage.total_tokens;
              this.updateTokenUsage(totalTokens);
            }

            yield {
              content,
              done,
              usage: done && totalTokens > 0 ? {
                promptTokens: parsed.usage?.prompt_tokens || 0,
                completionTokens: parsed.usage?.completion_tokens || 0,
                totalTokens
              } : undefined
            };

            if (done) break;
          } catch (error) {
            console.warn('Failed to parse Local Llama stream chunk:', error);
          }
        }
      }

      this.updateMetrics(Date.now() - context.timestamp, false);
      this.log('success', context, { streaming: true, tokens: totalTokens });
    } catch (error) {
      this.updateMetrics(0, true);
      this.log('error', context, { streaming: true, error });
      throw this.normalizeError(error);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const client = this.ensureClient();
      await client.get('/models');
      return true;
    } catch {
      return false;
    }
  }

  validateModel(model: string): boolean {
    return this.supportedModels.includes(model) || model.includes('llama') || model.includes('mistral');
  }

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      throw new Error('Local Llama client not initialized');
    }
    return this.client;
  }
}
