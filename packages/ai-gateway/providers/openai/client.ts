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

import OpenAI from 'openai';
import type { 
  AIRequest, 
  AIResponse, 
  StreamChunk, 
  ProviderType,
  LogContext 
} from '@deepwebai/shared-types';
import { BaseProvider } from '../../core/base-provider';

export class OpenAIProvider extends BaseProvider {
  readonly type: ProviderType = 'openai';
  readonly name = 'OpenAI';
  readonly supportedModels = [
    'gpt-4',
    'gpt-4-1106-preview',
    'gpt-4-vision-preview',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-16k'
  ];
  readonly supportsStreaming = true;

  private client?: OpenAI;

  protected async validateConfig(): Promise<void> {
    const config = this.ensureConfig();
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
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
      const response = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxTokens,
        top_p: request.config?.topP,
        stop: request.config?.stopSequences,
        presence_penalty: request.config?.presencePenalty,
        frequency_penalty: request.config?.frequencyPenalty,
        stream: false
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      const usage = response.usage;
      if (usage) {
        this.updateTokenUsage(usage.total_tokens);
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0
        },
        model: response.model,
        finishReason: choice.finish_reason as any || 'stop',
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
      const stream = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxTokens,
        top_p: request.config?.topP,
        stop: request.config?.stopSequences,
        presence_penalty: request.config?.presencePenalty,
        frequency_penalty: request.config?.frequencyPenalty,
        stream: true
      });

      let totalTokens = 0;
      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;

        const content = choice.delta?.content || '';
        const done = choice.finish_reason !== null;

        if (done && chunk.usage) {
          totalTokens = chunk.usage.total_tokens;
          this.updateTokenUsage(totalTokens);
        }

        yield {
          content,
          done,
          usage: done ? {
            promptTokens: chunk.usage?.prompt_tokens || 0,
            completionTokens: chunk.usage?.completion_tokens || 0,
            totalTokens: chunk.usage?.total_tokens || 0
          } : undefined
        };

        if (done) break;
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
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  private ensureClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }
    return this.client;
  }
}
