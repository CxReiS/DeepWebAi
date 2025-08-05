import { z } from 'zod';

export const CacheConfigSchema = z.object({
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    username: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().default('deepwebai:'),
    maxRetriesPerRequest: z.number().default(3),
    retryDelayOnFailover: z.number().default(100),
    enableReadyCheck: z.boolean().default(true),
    lazyConnect: z.boolean().default(true),
    keepAlive: z.number().default(30000),
    family: z.union([z.literal(4), z.literal(6)]).default(4),
    connectTimeout: z.number().default(10000),
    commandTimeout: z.number().default(5000),
    maxMemoryPolicy: z.enum(['noeviction', 'allkeys-lru', 'volatile-lru', 'allkeys-random', 'volatile-random', 'volatile-ttl']).default('allkeys-lru')
  }),
  memory: z.object({
    max: z.number().default(1000),
    ttl: z.number().default(600), // 10 minutes
    checkperiod: z.number().default(120), // 2 minutes
    useClones: z.boolean().default(false),
    deleteOnExpire: z.boolean().default(true)
  }),
  strategies: z.object({
    api_response: z.object({
      ttl: z.number().default(300), // 5 minutes
      useMemory: z.boolean().default(true),
      useRedis: z.boolean().default(true),
      compression: z.boolean().default(true)
    }),
    db_query: z.object({
      ttl: z.number().default(900), // 15 minutes
      useMemory: z.boolean().default(true),
      useRedis: z.boolean().default(true),
      compression: z.boolean().default(false)
    }),
    session: z.object({
      ttl: z.number().default(86400), // 24 hours
      useMemory: z.boolean().default(false),
      useRedis: z.boolean().default(true),
      compression: z.boolean().default(false)
    }),
    file_content: z.object({
      ttl: z.number().default(3600), // 1 hour
      useMemory: z.boolean().default(false),
      useRedis: z.boolean().default(true),
      compression: z.boolean().default(true)
    }),
    ai_response: z.object({
      ttl: z.number().default(1800), // 30 minutes
      useMemory: z.boolean().default(true),
      useRedis: z.boolean().default(true),
      compression: z.boolean().default(true)
    })
  }),
  fallback: z.object({
    enableMemoryFallback: z.boolean().default(true),
    enableFileFallback: z.boolean().default(false),
    fileFallbackPath: z.string().optional()
  }),
  monitoring: z.object({
    enableMetrics: z.boolean().default(true),
    metricsInterval: z.number().default(60000), // 1 minute
    logCacheHits: z.boolean().default(false),
    logCacheMisses: z.boolean().default(false),
    logErrors: z.boolean().default(true)
  })
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: number;
  expiresAt?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  memoryUsage: number;
  redisConnected: boolean;
  lastResetAt: number;
}

export interface CacheStats {
  memory: {
    keys: number;
    size: number;
    hits: number;
    misses: number;
  };
  redis: {
    connected: boolean;
    keys?: number;
    memory?: number;
    hits: number;
    misses: number;
  };
  overall: {
    hitRate: number;
    totalRequests: number;
    averageResponseTime: number;
  };
}

export type CacheStrategy = 'api_response' | 'db_query' | 'session' | 'file_content' | 'ai_response';

export interface CacheOptions {
  ttl?: number;
  useMemory?: boolean;
  useRedis?: boolean;
  compression?: boolean;
  tags?: string[];
  strategy?: CacheStrategy;
  metadata?: Record<string, any>;
}

export interface CacheResult<T = any> {
  value: T | null;
  hit: boolean;
  source: 'memory' | 'redis' | 'fallback' | null;
  ttl?: number;
  createdAt?: number;
  metadata?: Record<string, any>;
}

export type CacheEventType = 'hit' | 'miss' | 'set' | 'delete' | 'expire' | 'error' | 'connect' | 'disconnect';

export interface CacheEvent {
  type: CacheEventType;
  key?: string;
  source?: 'memory' | 'redis';
  timestamp: number;
  metadata?: Record<string, any>;
  error?: Error;
}

export type CacheEventListener = (event: CacheEvent) => void;
