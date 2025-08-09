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

import { z } from 'zod';
import { CacheConfig, CacheConfigSchema } from './types.js';

export function createCacheConfig(env: Record<string, string | undefined> = process.env): CacheConfig {
  const config = {
    redis: {
      host: env.REDIS_HOST || env.DRAGONFLY_HOST || 'localhost',
      port: parseInt(env.REDIS_PORT || env.DRAGONFLY_PORT || '6379'),
      password: env.REDIS_PASSWORD || env.DRAGONFLY_PASSWORD,
      username: env.REDIS_USERNAME || env.DRAGONFLY_USERNAME,
      db: parseInt(env.REDIS_DB || '0'),
      keyPrefix: env.CACHE_KEY_PREFIX || 'deepwebai:',
      maxRetriesPerRequest: parseInt(env.REDIS_MAX_RETRIES || '3'),
      retryDelayOnFailover: parseInt(env.REDIS_RETRY_DELAY || '100'),
      enableReadyCheck: env.REDIS_READY_CHECK !== 'false',
      lazyConnect: env.REDIS_LAZY_CONNECT !== 'false',
      keepAlive: parseInt(env.REDIS_KEEP_ALIVE || '30000'),
      family: (env.REDIS_FAMILY === '6' ? 6 : 4) as 4 | 6,
      connectTimeout: parseInt(env.REDIS_CONNECT_TIMEOUT || '10000'),
      commandTimeout: parseInt(env.REDIS_COMMAND_TIMEOUT || '5000'),
      maxMemoryPolicy: (env.REDIS_MAX_MEMORY_POLICY || 'allkeys-lru') as any
    },
    memory: {
      max: parseInt(env.MEMORY_CACHE_MAX_KEYS || '1000'),
      ttl: parseInt(env.MEMORY_CACHE_TTL || '600'),
      checkperiod: parseInt(env.MEMORY_CACHE_CHECK_PERIOD || '120'),
      useClones: env.MEMORY_CACHE_USE_CLONES === 'true',
      deleteOnExpire: env.MEMORY_CACHE_DELETE_ON_EXPIRE !== 'false'
    },
    strategies: {
      api_response: {
        ttl: parseInt(env.CACHE_API_RESPONSE_TTL || '300'),
        useMemory: env.CACHE_API_RESPONSE_USE_MEMORY !== 'false',
        useRedis: env.CACHE_API_RESPONSE_USE_REDIS !== 'false',
        compression: env.CACHE_API_RESPONSE_COMPRESSION === 'true'
      },
      db_query: {
        ttl: parseInt(env.CACHE_DB_QUERY_TTL || '900'),
        useMemory: env.CACHE_DB_QUERY_USE_MEMORY !== 'false',
        useRedis: env.CACHE_DB_QUERY_USE_REDIS !== 'false',
        compression: env.CACHE_DB_QUERY_COMPRESSION !== 'true'
      },
      session: {
        ttl: parseInt(env.CACHE_SESSION_TTL || '86400'),
        useMemory: env.CACHE_SESSION_USE_MEMORY === 'true',
        useRedis: env.CACHE_SESSION_USE_REDIS !== 'false',
        compression: env.CACHE_SESSION_COMPRESSION !== 'true'
      },
      file_content: {
        ttl: parseInt(env.CACHE_FILE_CONTENT_TTL || '3600'),
        useMemory: env.CACHE_FILE_CONTENT_USE_MEMORY === 'true',
        useRedis: env.CACHE_FILE_CONTENT_USE_REDIS !== 'false',
        compression: env.CACHE_FILE_CONTENT_COMPRESSION !== 'false'
      },
      ai_response: {
        ttl: parseInt(env.CACHE_AI_RESPONSE_TTL || '1800'),
        useMemory: env.CACHE_AI_RESPONSE_USE_MEMORY !== 'false',
        useRedis: env.CACHE_AI_RESPONSE_USE_REDIS !== 'false',
        compression: env.CACHE_AI_RESPONSE_COMPRESSION !== 'false'
      }
    },
    fallback: {
      enableMemoryFallback: env.CACHE_ENABLE_MEMORY_FALLBACK !== 'false',
      enableFileFallback: env.CACHE_ENABLE_FILE_FALLBACK === 'true',
      fileFallbackPath: env.CACHE_FILE_FALLBACK_PATH
    },
    monitoring: {
      enableMetrics: env.CACHE_ENABLE_METRICS !== 'false',
      metricsInterval: parseInt(env.CACHE_METRICS_INTERVAL || '60000'),
      logCacheHits: env.CACHE_LOG_HITS === 'true',
      logCacheMisses: env.CACHE_LOG_MISSES === 'true',
      logErrors: env.CACHE_LOG_ERRORS !== 'false'
    }
  };

  return CacheConfigSchema.parse(config);
}

export const defaultConfig: CacheConfig = createCacheConfig({});

// Environment-specific configurations
export const developmentConfig: CacheConfig = createCacheConfig({
  CACHE_LOG_HITS: 'true',
  CACHE_LOG_MISSES: 'true',
  CACHE_ENABLE_METRICS: 'true',
  MEMORY_CACHE_MAX_KEYS: '500',
  CACHE_API_RESPONSE_TTL: '60', // Shorter TTL in development
  REDIS_LAZY_CONNECT: 'true'
});

export const productionConfig: CacheConfig = createCacheConfig({
  CACHE_LOG_HITS: 'false',
  CACHE_LOG_MISSES: 'false',
  CACHE_LOG_ERRORS: 'true',
  MEMORY_CACHE_MAX_KEYS: '5000',
  CACHE_API_RESPONSE_TTL: '300',
  CACHE_DB_QUERY_TTL: '1800',
  CACHE_AI_RESPONSE_COMPRESSION: 'true',
  REDIS_MAX_RETRIES: '5',
  REDIS_CONNECT_TIMEOUT: '15000'
});

export const testConfig: CacheConfig = createCacheConfig({
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6380', // Different port for tests
  REDIS_DB: '15', // Test database
  MEMORY_CACHE_MAX_KEYS: '100',
  CACHE_API_RESPONSE_TTL: '10',
  CACHE_ENABLE_METRICS: 'false',
  CACHE_LOG_HITS: 'false',
  CACHE_LOG_MISSES: 'false',
  CACHE_LOG_ERRORS: 'false'
});

export function getCacheConfig(environment: string = process.env.NODE_ENV || 'development'): CacheConfig {
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Helper function to validate cache configuration
export function validateCacheConfig(config: any): CacheConfig {
  try {
    return CacheConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Cache configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid cache configuration');
  }
}

// Connection string parser for Redis/DragonflyDB
export function parseRedisConnectionString(connectionString: string): Partial<CacheConfig['redis']> {
  try {
    const url = new URL(connectionString);
    
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      db: url.pathname ? parseInt(url.pathname.slice(1)) : 0
    };
  } catch (error) {
    throw new Error(`Invalid Redis connection string: ${connectionString}`);
  }
}

// Create configuration from connection string
export function createConfigFromConnectionString(
  connectionString: string,
  overrides: Partial<CacheConfig> = {}
): CacheConfig {
  const redisConfig = parseRedisConnectionString(connectionString);
  
  const baseConfig = createCacheConfig();
  
  return CacheConfigSchema.parse({
    ...baseConfig,
    redis: {
      ...baseConfig.redis,
      ...redisConfig
    },
    ...overrides
  });
}
