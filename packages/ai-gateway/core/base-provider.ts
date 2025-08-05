import type { 
  AIProvider, 
  ProviderType, 
  ProviderConfig, 
  ProviderMetrics, 
  AIRequest, 
  AIResponse, 
  StreamChunk,
  ProviderError,
  RetryConfig,
  LogContext
} from '@deepwebai/shared-types';

export abstract class BaseProvider implements AIProvider {
  abstract readonly type: ProviderType;
  abstract readonly name: string;
  abstract readonly supportedModels: string[];
  abstract readonly supportsStreaming: boolean;

  protected config?: ProviderConfig;
  protected metrics: ProviderMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageLatency: 0,
    tokensUsed: 0,
    lastRequestTime: 0
  };

  protected retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['rate_limit', 'network', 'server_error']
  };

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    if (config.retryAttempts) {
      this.retryConfig.maxAttempts = config.retryAttempts;
    }
    if (config.retryDelay) {
      this.retryConfig.initialDelay = config.retryDelay;
    }
    await this.validateConfig();
  }

  abstract chat(request: AIRequest): Promise<AIResponse>;
  abstract chatStream(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown>;

  validateModel(model: string): boolean {
    return this.supportedModels.includes(model);
  }

  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  abstract isHealthy(): Promise<boolean>;

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: LogContext
  ): Promise<T> {
    let lastError: ProviderError | null = null;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        
        this.updateMetrics(Date.now() - startTime, false);
        this.log('success', context, { attempt });
        
        return result;
      } catch (error) {
        const providerError = this.normalizeError(error);
        lastError = providerError;
        
        this.updateMetrics(0, true);
        this.log('error', context, { attempt, error: providerError });

        if (attempt === this.retryConfig.maxAttempts || !this.shouldRetry(providerError)) {
          break;
        }

        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  protected shouldRetry(error: ProviderError): boolean {
    return error.retryable && this.retryConfig.retryableErrors.includes(error.type);
  }

  protected normalizeError(error: any): ProviderError {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          type: 'rate_limit',
          details: error.response.data,
          retryable: true
        };
      }
      if (status === 401 || status === 403) {
        return {
          code: 'AUTHENTICATION',
          message: 'Authentication failed',
          type: 'authentication',
          details: error.response.data,
          retryable: false
        };
      }
      if (status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'Server error',
          type: 'server_error',
          details: error.response.data,
          retryable: true
        };
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        type: 'network',
        details: error.message,
        retryable: true
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      type: 'server_error',
      details: error,
      retryable: true
    };
  }

  protected updateMetrics(latency: number, isError: boolean): void {
    this.metrics.requestCount++;
    this.metrics.lastRequestTime = Date.now();
    
    if (isError) {
      this.metrics.errorCount++;
    } else {
      const totalLatency = this.metrics.averageLatency * (this.metrics.requestCount - 1) + latency;
      this.metrics.averageLatency = totalLatency / this.metrics.requestCount;
    }
  }

  protected updateTokenUsage(tokens: number): void {
    this.metrics.tokensUsed += tokens;
  }

  protected log(_level: 'info' | 'error' | 'warn' | 'success', _context: LogContext, _data?: any): void {
    // Log entry recorded to monitoring system
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected abstract validateConfig(): Promise<void>;

  protected ensureConfig(): ProviderConfig {
    if (!this.config) {
      throw new Error(`Provider ${this.type} not initialized`);
    }
    return this.config;
  }
}
