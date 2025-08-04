import { RateLimiterRedis } from "rate-limiter-flexible";

export class AdvancedRateLimiter {
  private limiters = {
    // API endpoint bazlı limitler
    api: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "api",
      points: 100, // 100 istek
      duration: 60, // 60 saniye
    }),

    // AI model bazlı limitler
    ai: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ai",
      points: 50,
      duration: 3600, // 1 saat
    }),

    // Kullanıcı bazlı token limitleri
    tokens: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "tokens",
      points: 100000, // 100k token
      duration: 86400, // 24 saat
    }),
  };

  async checkLimit(type: string, identifier: string) {
    try {
      await this.limiters[type].consume(identifier);
      return true;
    } catch (rejRes) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rejRes.msBeforeNext}ms`
      );
    }
  }
}
