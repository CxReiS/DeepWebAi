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
