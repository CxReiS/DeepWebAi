"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartRateLimit = exports.aiRateLimit = exports.chatRateLimit = exports.authRateLimit = exports.apiRateLimit = void 0;
exports.createRateLimiter = createRateLimiter;
exports.createQuotaLimiter = createQuotaLimiter;
const elysia_1 = require("elysia");
const neon_client_js_1 = require("../lib/neon-client.js");
// In-memory store for development
class MemoryStore {
    hits = new Map();
    windowMs;
    constructor(windowMs) {
        this.windowMs = windowMs;
        this.cleanup();
    }
    async increment(key) {
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
    cleanup() {
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
    windowMs;
    constructor(windowMs) {
        this.windowMs = windowMs;
    }
    async increment(key) {
        const windowStart = new Date(Math.floor(Date.now() / this.windowMs) * this.windowMs);
        const resetTime = windowStart.getTime() + this.windowMs;
        try {
            // Use the rate limit function from database
            const result = await (0, neon_client_js_1.sql) `
        SELECT check_rate_limit(
          ${key}::uuid,
          ${key.split(':')[1] || '/api'},
          100,
          ${Math.floor(this.windowMs / 1000)}
        ) as allowed
      `;
            // Get current count
            const countResult = await (0, neon_client_js_1.sql) `
        SELECT COALESCE(request_count, 0) as count
        FROM rate_limits
        WHERE user_id = ${key}::uuid
          AND endpoint = ${key.split(':')[1] || '/api'}
          AND window_start = ${windowStart.toISOString()}
      `;
            const totalHits = countResult[0]?.count || 0;
            const timeUntilReset = resetTime - Date.now();
            return { totalHits, timeUntilReset };
        }
        catch (error) {
            console.error('Database rate limit error:', error);
            // Fallback to allowing request if database fails
            return { totalHits: 0, timeUntilReset: this.windowMs };
        }
    }
}
function createRateLimiter(config) {
    const { windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, skipFailedRequests = false, skipSuccessfulRequests = false, keyGenerator = (request) => {
        // Try to get user ID from auth, fallback to IP
        const userId = request.headers?.['x-user-id'] || request.headers?.['authorization']?.split(' ')[1];
        const ip = request.headers?.['x-forwarded-for'] || request.headers?.['x-real-ip'] || 'unknown';
        return userId || ip;
    }, store = process.env.NODE_ENV === 'production' ? 'database' : 'memory' } = config;
    const rateLimitStore = store === 'database'
        ? new DatabaseStore(windowMs)
        : new MemoryStore(windowMs);
    return new elysia_1.Elysia({ name: 'rate-limiter' })
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
            };
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
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            // Continue request if rate limiting fails
            return { rateLimitInfo: null };
        }
    });
}
// Predefined rate limiters for different use cases
exports.apiRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipFailedRequests: true
});
exports.authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Stricter for auth endpoints
    skipSuccessfulRequests: true
});
exports.chatRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Chat messages per minute
    keyGenerator: (request) => {
        const userId = request.headers?.['x-user-id'];
        return userId ? `chat:${userId}` : request.headers?.['x-forwarded-for'] || 'unknown';
    }
});
exports.aiRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // AI requests per minute
    keyGenerator: (request) => {
        const userId = request.headers?.['x-user-id'];
        return userId ? `ai:${userId}` : request.headers?.['x-forwarded-for'] || 'unknown';
    }
});
// Per-user quota limiter
function createQuotaLimiter(quotaType) {
    return new elysia_1.Elysia({ name: 'quota-limiter' })
        .derive(async ({ request, set }) => {
        const userId = request.headers?.['x-user-id'];
        if (!userId) {
            // Skip quota check for unauthenticated requests
            return { quotaInfo: null };
        }
        try {
            // Check user quotas
            const quotas = await (0, neon_client_js_1.sql) `
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
        }
        catch (error) {
            console.error('Quota check error:', error);
            return { quotaInfo: null };
        }
    });
}
// Smart rate limiter that adapts based on user role
exports.smartRateLimit = new elysia_1.Elysia({ name: 'smart-rate-limit' })
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
    const config = limits[userRole] || limits.user;
    const limiter = createRateLimiter({
        ...config,
        keyGenerator: () => userId || request.headers?.['x-forwarded-for'] || 'unknown'
    });
    return limiter;
});
exports.default = {
    apiRateLimit: exports.apiRateLimit,
    authRateLimit: exports.authRateLimit,
    chatRateLimit: exports.chatRateLimit,
    aiRateLimit: exports.aiRateLimit,
    createRateLimiter,
    createQuotaLimiter,
    smartRateLimit: exports.smartRateLimit
};
