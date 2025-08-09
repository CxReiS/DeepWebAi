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
