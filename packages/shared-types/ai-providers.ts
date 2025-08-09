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

// Shared types for AI provider integrations

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'local-llama';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  usage: TokenUsage;
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
  id: string;
  timestamp: number;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
}

export interface ProviderError {
  code: string;
  message: string;
  type: 'rate_limit' | 'authentication' | 'model_not_found' | 'network' | 'server_error' | 'invalid_request';
  details?: any;
  retryable: boolean;
}

export interface AIRequest {
  messages: AIMessage[];
  model: string;
  stream?: boolean;
  config?: Partial<AIModelConfig>;
}

export interface ProviderMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  tokensUsed: number;
  lastRequestTime: number;
}

export interface AIProvider {
  readonly type: ProviderType;
  readonly name: string;
  readonly supportedModels: string[];
  readonly supportsStreaming: boolean;
  
  initialize(config: ProviderConfig): Promise<void>;
  chat(request: AIRequest): Promise<AIResponse>;
  chatStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown>;
  validateModel(model: string): boolean;
  getMetrics(): ProviderMetrics;
  isHealthy(): Promise<boolean>;
}

export interface ProviderRegistry {
  register(provider: AIProvider): void;
  getProvider(type: ProviderType): AIProvider | undefined;
  listProviders(): ProviderType[];
  isProviderAvailable(type: ProviderType): boolean;
}

export interface RateLimiter {
  checkLimit(provider: ProviderType): Promise<boolean>;
  recordRequest(provider: ProviderType, tokens?: number): void;
  getRemainingRequests(provider: ProviderType): number;
  reset(provider: ProviderType): void;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface LogContext {
  provider: ProviderType;
  model: string;
  requestId: string;
  userId?: string;
  timestamp: number;
}
