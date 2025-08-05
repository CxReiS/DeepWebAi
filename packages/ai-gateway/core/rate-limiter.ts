import type { RateLimiter, ProviderType } from '@deepwebai/shared-types';

interface RateLimitState {
  requests: number[];
  tokens: number[];
  lastReset: number;
}

export class TokenBucketRateLimiter implements RateLimiter {
  private limits = new Map<ProviderType, RateLimitState>();
  private readonly windowMs = 60 * 1000; // 1 minute

  private defaultLimits = {
    openai: { requestsPerMinute: 500, tokensPerMinute: 90000 },
    anthropic: { requestsPerMinute: 1000, tokensPerMinute: 100000 },
    gemini: { requestsPerMinute: 300, tokensPerMinute: 32000 },
    deepseek: { requestsPerMinute: 200, tokensPerMinute: 50000 },
    'local-llama': { requestsPerMinute: 100, tokensPerMinute: 10000 }
  };

  async checkLimit(provider: ProviderType): Promise<boolean> {
    const state = this.getOrCreateState(provider);
    const now = Date.now();
    
    this.cleanOldRequests(state, now);
    
    const limit = this.defaultLimits[provider];
    return state.requests.length < limit.requestsPerMinute;
  }

  recordRequest(provider: ProviderType, tokens = 0): void {
    const state = this.getOrCreateState(provider);
    const now = Date.now();
    
    this.cleanOldRequests(state, now);
    
    state.requests.push(now);
    if (tokens > 0) {
      state.tokens.push(now);
    }
  }

  getRemainingRequests(provider: ProviderType): number {
    const state = this.getOrCreateState(provider);
    const now = Date.now();
    
    this.cleanOldRequests(state, now);
    
    const limit = this.defaultLimits[provider];
    return Math.max(0, limit.requestsPerMinute - state.requests.length);
  }

  reset(provider: ProviderType): void {
    this.limits.delete(provider);
  }

  private getOrCreateState(provider: ProviderType): RateLimitState {
    if (!this.limits.has(provider)) {
      this.limits.set(provider, {
        requests: [],
        tokens: [],
        lastReset: Date.now()
      });
    }
    return this.limits.get(provider)!;
  }

  private cleanOldRequests(state: RateLimitState, now: number): void {
    const cutoff = now - this.windowMs;
    state.requests = state.requests.filter(timestamp => timestamp > cutoff);
    state.tokens = state.tokens.filter(timestamp => timestamp > cutoff);
  }
}
