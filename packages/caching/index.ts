export * from './src/types.js';
export * from './src/redis-client.js';
export * from './src/memory-cache.js';
export * from './src/cache.service.js';
export * from './src/response-cache.js';
export * from './src/middleware.js';
export * from './src/config.js';

// Re-export main classes for convenience
export { CacheService } from './src/cache.service.js';
export { ResponseCache } from './src/response-cache.js';
export { RedisClient } from './src/redis-client.js';
export { MemoryCache } from './src/memory-cache.js';

// Factory functions
export { 
  createCacheMiddleware, 
  createCacheInvalidationRoutes,
  apiCache,
  dbQueryCache,
  staticContentCache
} from './src/middleware.js';

export { 
  createCacheConfig, 
  getCacheConfig, 
  validateCacheConfig,
  createConfigFromConnectionString,
  defaultConfig,
  developmentConfig,
  productionConfig,
  testConfig
} from './src/config.js';

// Types
export type {
  CacheConfig,
  CacheOptions,
  CacheResult,
  CacheStrategy,
  CacheMetrics,
  CacheStats,
  CacheEvent,
  CacheEventListener,
  CacheEntry
} from './src/types.js';

export type {
  CacheMiddlewareOptions
} from './src/middleware.js';

export type { ResponseCacheOptions } from './src/response-cache.js';
