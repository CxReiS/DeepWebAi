/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { 
  AIRequest, 
  AIResponse, 
  StreamChunk, 
  ProviderType,
  LogContext 
} from '@deepwebai/shared-types';
import { BaseProvider } from '../../core/base-provider';

export class AnthropicProvider extends BaseProvider {
  readonly type: ProviderType = 'anthropic';
  readonly name = 'Anthropic Claude';
  readonly supportedModels = [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ];
  readonly supportsStreaming = true;

  private client?: Anthropic;

  protected async validateConfig(): Promise<void> {
    const config = this.ensureConfig();
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000
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
      const { system, messages } = this.formatMessages(request.messages);

      const response = await client.messages.create({
        model: request.model,
        max_tokens: request.config?.maxTokens || 4000,
        temperature: request.config?.temperature,
        top_p: request.config?.topP,
        top_k: request.config?.topK,
        stop_sequences: request.config?.stopSequences,
        system,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        stream: false
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      this.updateTokenUsage(response.usage.output_tokens + response.usage.input_tokens);

      return {
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        model: response.model,
        finishReason: response.stop_reason as any || 'stop',
        id: response.id,
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
      const { system, messages } = this.formatMessages(request.messages);

      const stream = client.messages.stream({
        model: request.model,
        max_tokens: request.config?.maxTokens || 4000,
        temperature: request.config?.temperature,
        top_p: request.config?.topP,
        top_k: request.config?.topK,
        stop_sequences: request.config?.stopSequences,
        system,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            content: chunk.delta.text,
            done: false
          };
        } else if (chunk.type === 'message_start') {
          inputTokens = chunk.message.usage.input_tokens;
        } else if (chunk.type === 'message_delta') {
          outputTokens = chunk.usage.output_tokens;
        }
      }

      const totalTokens = inputTokens + outputTokens;
      this.updateTokenUsage(totalTokens);

      yield {
        content: '',
        done: true,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
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
      await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch {
      return false;
    }
  }

  private formatMessages(messages: Array<{ role: string; content: string }>) {
    let system = '';
    const formattedMessages = [];

    for (const message of messages) {
      if (message.role === 'system') {
        system = message.content;
      } else {
        formattedMessages.push(message);
      }
    }

    return { system, messages: formattedMessages };
  }

  private ensureClient(): Anthropic {
    if (!this.client) {
      throw new Error('Anthropic client not initialized');
    }
    return this.client;
  }
}
