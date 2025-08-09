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

import { 
  CacheService, 
  getCacheConfig, 
  createCacheMiddleware,
  createCacheInvalidationRoutes,
  apiCache,
  dbQueryCache
} from '@deepwebai/caching';

// Initialize cache service with environment-based configuration
const cacheConfig = getCacheConfig(process.env.NODE_ENV);
export const cacheService = new CacheService(cacheConfig);

// Pre-configured middleware
export const apiCacheMiddleware = apiCache(cacheService);
export const dbCacheMiddleware = dbQueryCache(cacheService);

// Cache invalidation routes for admin/management
export const cacheRoutes = createCacheInvalidationRoutes(cacheService);

// Helper functions for common caching patterns

export async function cacheDbQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl = 900 // 15 minutes
): Promise<T> {
  return await cacheService.getOrSet(key, queryFn, {
    strategy: 'db_query',
    ttl,
    compression: false
  });
}

export async function cacheApiResponse<T>(
  key: string,
  responseFn: () => Promise<T>,
  ttl = 300 // 5 minutes
): Promise<T> {
  return await cacheService.getOrSet(key, responseFn, {
    strategy: 'api_response',
    ttl,
    compression: true
  });
}

export async function cacheAiResponse<T>(
  key: string,
  aiFn: () => Promise<T>,
  ttl = 1800 // 30 minutes
): Promise<T> {
  return await cacheService.getOrSet(key, aiFn, {
    strategy: 'ai_response',
    ttl,
    compression: true
  });
}

export async function cacheSessionData<T>(
  userId: string,
  sessionFn: () => Promise<T>,
  ttl = 86400 // 24 hours
): Promise<T> {
  const key = `session:${userId}`;
  return await cacheService.getOrSet(key, sessionFn, {
    strategy: 'session',
    ttl,
    useMemory: false // Sessions only in Redis
  });
}

export async function invalidateUserCache(userId: string): Promise<number> {
  const patterns = [
    `session:${userId}*`,
    `user:${userId}:*`,
    `response:*:user:${userId}*`
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    totalInvalidated += await cacheService.invalidateByPattern(pattern);
  }
  
  return totalInvalidated;
}

export async function warmCache(): Promise<void> {
  // Warm critical data that's accessed frequently
  // Add your specific cache warming logic here
  
  // Example: Pre-load configuration data
  // await cacheService.warm('app:config', async () => {
  //   return await loadAppConfiguration();
  // });
}

// Cache health check
export async function getCacheHealth(): Promise<{
  redis: { connected: boolean; latency?: number };
  memory: { keys: number; size: number };
  overall: { hitRate: number; errors: number };
}> {
  const stats = await cacheService.getStats();
  const metrics = cacheService.getMetrics();
  
  // Test Redis latency
  let redisLatency: number | undefined;
  try {
    const start = Date.now();
    await cacheService.get('health:ping');
    redisLatency = Date.now() - start;
  } catch {
    redisLatency = undefined;
  }
  
  return {
    redis: {
      connected: stats.redis.connected,
      latency: redisLatency
    },
    memory: {
      keys: stats.memory.keys,
      size: stats.memory.size
    },
    overall: {
      hitRate: stats.overall.hitRate,
      errors: metrics.errors
    }
  };
}

// Graceful shutdown
export async function closeCacheService(): Promise<void> {
  await cacheService.close();
}

// Event listeners for monitoring
cacheService.addEventListener((event) => {
  if (event.type === 'error') {
    console.error(`Cache error: ${event.key}`, event.error);
  }
  
  if (event.type === 'connect') {
    console.log('Redis connected');
  }
  
  if (event.type === 'disconnect') {
    console.warn('Redis disconnected');
  }
});
