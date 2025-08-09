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

// Main exports for AI Gateway
export * from './core/base-provider';
export * from './core/provider-registry';
export * from './core/rate-limiter';

export * from './providers/openai/client';
export * from './providers/anthropic/client';
export * from './providers/gemini/client';
export * from './providers/deepseek/client';
export * from './providers/local-llama/client';

export * from './gateway';
export * from './config-manager';

// Re-export shared types for convenience
export type {
  AIProvider,
  ProviderType,
  AIRequest,
  AIResponse,
  StreamChunk,
  ProviderConfig,
  ProviderMetrics,
  ProviderError,
  AIMessage,
  AIModelConfig,
  TokenUsage,
  RateLimiter,
  ProviderRegistry
} from '@deepwebai/shared-types';
