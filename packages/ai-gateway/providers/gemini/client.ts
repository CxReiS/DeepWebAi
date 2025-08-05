import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { 
  AIRequest, 
  AIResponse, 
  StreamChunk, 
  ProviderType,
  LogContext 
} from '@deepwebai/shared-types';
import { BaseProvider } from '../../core/base-provider';

export class GeminiProvider extends BaseProvider {
  readonly type: ProviderType = 'gemini';
  readonly name = 'Google Gemini';
  readonly supportedModels = [
    'gemini-pro',
    'gemini-pro-vision',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ];
  readonly supportsStreaming = true;

  private client?: GoogleGenerativeAI;

  protected async validateConfig(): Promise<void> {
    const config = this.ensureConfig();
    if (!config.apiKey) {
      throw new Error('Google AI API key is required');
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    this.ensureClient();
    const context: LogContext = {
      provider: this.type,
      model: request.model,
      requestId: crypto.randomUUID(),
      timestamp: Date.now()
    };

    return this.executeWithRetry(async () => {
      const model = this.getModel(request.model, request.config);
      const { prompt, history } = this.formatMessages(request.messages);

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      const response = await result.response;

      const text = response.text();
      if (!text) {
        throw new Error('No content in Gemini response');
      }

      const usage = (response as any).usageMetadata;
      const totalTokens = (usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0);
      this.updateTokenUsage(totalTokens);

      return {
        content: text,
        usage: {
          promptTokens: usage?.promptTokenCount || 0,
          completionTokens: usage?.candidatesTokenCount || 0,
          totalTokens
        },
        model: request.model,
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
    }, context);
  }

  async *chatStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown> {
    this.ensureClient();
    const context: LogContext = {
      provider: this.type,
      model: request.model,
      requestId: crypto.randomUUID(),
      timestamp: Date.now()
    };

    try {
      const model = this.getModel(request.model, request.config);
      const { prompt, history } = this.formatMessages(request.messages);

      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(prompt);

      let totalTokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of result.stream) {
        const text = chunk.text();
        
        yield {
          content: text,
          done: false
        };
      }

      const finalResponse = await result.response;
      const usage = (finalResponse as any).usageMetadata;
      
      if (usage) {
        promptTokens = usage.promptTokenCount || 0;
        completionTokens = usage.candidatesTokenCount || 0;
        totalTokens = promptTokens + completionTokens;
        this.updateTokenUsage(totalTokens);
      }

      yield {
        content: '',
        done: true,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens
        }
      };

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
      const model = client.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('test');
      return true;
    } catch {
      return false;
    }
  }

  private getModel(modelName: string, config?: any): GenerativeModel {
    const client = this.ensureClient();
    
    const generationConfig: any = {};
    if (config?.temperature !== undefined) generationConfig.temperature = config.temperature;
    if (config?.maxTokens !== undefined) generationConfig.maxOutputTokens = config.maxTokens;
    if (config?.topP !== undefined) generationConfig.topP = config.topP;
    if (config?.topK !== undefined) generationConfig.topK = config.topK;
    if (config?.stopSequences) generationConfig.stopSequences = config.stopSequences;

    return client.getGenerativeModel({ 
      model: modelName,
      generationConfig
    });
  }

  private formatMessages(messages: Array<{ role: string; content: string }>) {
    const history = [];
    let systemInstruction = '';
    let lastMessage = '';

    for (const message of messages) {
      if (message.role === 'system') {
        systemInstruction = message.content;
      } else if (message.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: message.content }]
        });
        lastMessage = message.content;
      } else if (message.role === 'assistant') {
        history.push({
          role: 'model',
          parts: [{ text: message.content }]
        });
      }
    }

    // Remove the last user message to use as prompt
    if (history.length > 0 && history[history.length - 1].role === 'user') {
      history.pop();
    }

    const prompt = systemInstruction ? `${systemInstruction}\n\n${lastMessage}` : lastMessage;

    return { prompt, history };
  }

  private mapFinishReason(reason: any): 'stop' | 'length' | 'content_filter' | 'tool_calls' {
    switch (reason) {
      case 'STOP': return 'stop';
      case 'MAX_TOKENS': return 'length';
      case 'SAFETY': return 'content_filter';
      default: return 'stop';
    }
  }

  private ensureClient(): GoogleGenerativeAI {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }
    return this.client;
  }
}
