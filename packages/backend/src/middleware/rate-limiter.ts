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

import { Elysia } from "elysia";
import { sql } from "../lib/neon-client.js";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: any) => string;
  onLimitReached?: (request: any) => any;
  store?: 'memory' | 'database';
}

// In-memory store for development
class MemoryStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map();
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
    this.cleanup();
  }

  async increment(key: string): Promise<{ totalHits: number; timeUntilReset: number }> {
    const now = Date.now();
    const resetTime = now + this.windowMs;
    
    const current = this.hits.get(key);
    
    if (!current || current.resetTime <= now) {
      this.hits.set(key, { count: 1, resetTime });
      return { totalHits: 1, timeUntilReset: this.windowMs };
    }
    
    current.count++;
    this.hits.set(key, current);
    
    return {
      totalHits: current.count,
      timeUntilReset: current.resetTime - now
    };
  }

  private cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.hits.entries()) {
        if (value.resetTime <= now) {
          this.hits.delete(key);
        }
      }
    }, this.windowMs);
  }
}

// Database store for production
class DatabaseStore {
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; timeUntilReset: number }> {
    const windowStart = new Date(Math.floor(Date.now() / this.windowMs) * this.windowMs);
    const resetTime = windowStart.getTime() + this.windowMs;
    
    try {
      // Use the rate limit function from database
      const result = await sql`
        SELECT check_rate_limit(
          ${key}::uuid,
          ${key.split(':')[1] || '/api'},
          100,
          ${Math.floor(this.windowMs / 1000)}
        ) as allowed
      `;
      
      // Get current count
      const countResult = await sql`
        SELECT COALESCE(request_count, 0) as count
        FROM rate_limits
        WHERE user_id = ${key}::uuid
          AND endpoint = ${key.split(':')[1] || '/api'}
          AND window_start = ${windowStart.toISOString()}
      `;
      
      const totalHits = countResult[0]?.count || 0;
      const timeUntilReset = resetTime - Date.now();
      
      return { totalHits, timeUntilReset };
    } catch (error) {
      console.error('Database rate limit error:', error);
      // Fallback to allowing request if database fails
      return { totalHits: 0, timeUntilReset: this.windowMs };
    }
  }
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator = (request: any) => {
      // Try to get user ID from auth, fallback to IP
      const userId = request.headers?.['x-user-id'] || request.headers?.['authorization']?.split(' ')[1];
      const ip = request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'] || 'unknown';
      return userId || ip;
    },
    store = process.env.NODE_ENV === 'production' ? 'database' : 'memory'
  } = config;

  const rateLimitStore = store === 'database' 
    ? new DatabaseStore(windowMs)
    : new MemoryStore(windowMs);

  return new Elysia({ name: 'rate-limiter' })
    .derive(async ({ request, set }) => {
      const key = keyGenerator(request);
      const endpoint = new URL(request.url).pathname;
      const rateLimitKey = `${key}:${endpoint}`;
      
      try {
        const { totalHits, timeUntilReset } = await rateLimitStore.increment(rateLimitKey);
        
        // Set rate limit headers
        set.headers = {
          ...set.headers,
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - totalHits).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + timeUntilReset).toISOString(),
          'X-RateLimit-Window': windowMs.toString()
        } as any;
        
        // Check if limit exceeded
        if (totalHits > maxRequests) {
          set.status = 429;
          
          if (config.onLimitReached) {
            return config.onLimitReached(request);
          }
          
          return {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds.`,
            retryAfter: Math.ceil(timeUntilReset / 1000)
          };
        }
        
        return { rateLimitInfo: { totalHits, remaining: maxRequests - totalHits, resetTime: timeUntilReset } };
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Continue request if rate limiting fails
        return { rateLimitInfo: null };
      }
    });
}

// Predefined rate limiters for different use cases
export const apiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipFailedRequests: true
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Stricter for auth endpoints
  skipSuccessfulRequests: true
});

export const chatRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Chat messages per minute
  keyGenerator: (request: any) => {
    const userId = request.headers?.['x-user-id'];
    return userId ? `chat:${userId}` : request.headers?.['x-forwarded-for'] || 'unknown';
  }
});

export const aiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // AI requests per minute
  keyGenerator: (request: any) => {
    const userId = request.headers?.['x-user-id'];
    return userId ? `ai:${userId}` : request.headers?.['x-forwarded-for'] || 'unknown';
  }
});

// Per-user quota limiter
export function createQuotaLimiter(quotaType: 'tokens' | 'requests' | 'cost') {
  return new Elysia({ name: 'quota-limiter' })
    .derive(async ({ request, set }) => {
      const userId = request.headers?.['x-user-id'];
      
      if (!userId) {
        // Skip quota check for unauthenticated requests
        return { quotaInfo: null };
      }
      
      try {
        // Check user quotas
        const quotas = await sql`
          SELECT quota_type, period, limit_value, used_value, reset_at
          FROM usage_quotas
          WHERE user_id = ${userId}
            AND quota_type = ${quotaType}
            AND reset_at > NOW()
        `;
        
        for (const quota of quotas) {
          if (quota.used_value >= quota.limit_value) {
            set.status = 429;
            return {
              error: 'Quota Exceeded',
              message: `${quotaType} quota exceeded for ${quota.period} period.`,
              quota: {
                type: quota.quota_type,
                period: quota.period,
                limit: quota.limit_value,
                used: quota.used_value,
                resetAt: quota.reset_at
              }
            };
          }
        }
        
        return { quotaInfo: quotas };
      } catch (error) {
        console.error('Quota check error:', error);
        return { quotaInfo: null };
      }
    });
}

// Smart rate limiter that adapts based on user role
export const smartRateLimit = new Elysia({ name: 'smart-rate-limit' })
  .derive(async ({ request, set }) => {
    const userId = request.headers?.['x-user-id'];
    const userRole = request.headers?.['x-user-role'] || 'user';
    
    // Different limits based on user role
    const limits = {
      admin: { windowMs: 60 * 1000, maxRequests: 1000 },
      developer: { windowMs: 60 * 1000, maxRequests: 500 },
      premium: { windowMs: 60 * 1000, maxRequests: 200 },
      user: { windowMs: 60 * 1000, maxRequests: 60 }
    };
    
    const config = limits[userRole as keyof typeof limits] || limits.user;
    
    const limiter = createRateLimiter({
      ...config,
      keyGenerator: () => userId || request.headers?.['x-forwarded-for'] || 'unknown'
    });
    
    return limiter;
  });

export default {
  apiRateLimit,
  authRateLimit,
  chatRateLimit,
  aiRateLimit,
  createRateLimiter,
  createQuotaLimiter,
  smartRateLimit
};
