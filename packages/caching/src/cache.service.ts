import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { RedisClient } from './redis-client.js';
import { MemoryCache } from './memory-cache.js';
import { 
  CacheConfig, 
  CacheOptions, 
  CacheResult, 
  CacheStrategy, 
  CacheStats, 
  CacheMetrics,
  CacheEventListener,
  CacheEvent
} from './types.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class CacheService {
  private redis: RedisClient;
  private memory: MemoryCache;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private eventListeners: CacheEventListener[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.redis = new RedisClient(config.redis);
    this.memory = new MemoryCache(config.memory);
    
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      memoryUsage: 0,
      redisConnected: false,
      lastResetAt: Date.now()
    };

    this.setupEventListeners();
    
    if (config.monitoring.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  private setupEventListeners(): void {
    const handleEvent = (event: CacheEvent) => {
      this.updateMetrics(event);
      this.emitEvent(event);
      
      if (this.config.monitoring.logCacheHits && event.type === 'hit') {
        // Cache hit logged to metrics
      }
      
      if (this.config.monitoring.logCacheMisses && event.type === 'miss') {
        // Cache miss logged to metrics
      }
      
      if (this.config.monitoring.logErrors && event.type === 'error') {
        console.error(`Cache error: ${event.key}`, event.error);
      }
    };

    this.redis.addEventListener(handleEvent);
    this.memory.addEventListener(handleEvent);
  }

  private updateMetrics(event: CacheEvent): void {
    switch (event.type) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'set':
        this.metrics.sets++;
        break;
      case 'delete':
        this.metrics.deletes++;
        break;
      case 'error':
        this.metrics.errors++;
        break;
      case 'connect':
        this.metrics.redisConnected = true;
        break;
      case 'disconnect':
        this.metrics.redisConnected = false;
        break;
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMemoryUsage();
    }, this.config.monitoring.metricsInterval);
  }

  private updateMemoryUsage(): void {
    const memStats = this.memory.getStats();
    this.metrics.memoryUsage = memStats.ksize || 0;
  }

  public addEventListener(listener: CacheEventListener): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: CacheEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emitEvent(event: CacheEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Cache event listener error:', error);
      }
    });
  }

  private getStrategyConfig(strategy: CacheStrategy) {
    return this.config.strategies[strategy];
  }

  private async compress(data: string): Promise<Buffer> {
    return await gzipAsync(Buffer.from(data, 'utf8'));
  }

  private async decompress(data: Buffer): Promise<string> {
    const decompressed = await gunzipAsync(data);
    return decompressed.toString('utf8');
  }

  private serializeValue(value: any, useCompression = false): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const serialized = JSON.stringify(value);
        
        if (useCompression && serialized.length > 1024) {
          const compressed = await this.compress(serialized);
          resolve(`__compressed__${compressed.toString('base64')}`);
        } else {
          resolve(serialized);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private deserializeValue<T>(serialized: string): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        if (serialized.startsWith('__compressed__')) {
          const compressedData = serialized.replace('__compressed__', '');
          const buffer = Buffer.from(compressedData, 'base64');
          const decompressed = await this.decompress(buffer);
          resolve(JSON.parse(decompressed));
        } else {
          resolve(JSON.parse(serialized));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public async get<T = any>(key: string, options: CacheOptions = {}): Promise<CacheResult<T>> {
    const strategy = options.strategy || 'api_response';
    const strategyConfig = this.getStrategyConfig(strategy);
    
    const useMemory = options.useMemory ?? strategyConfig.useMemory;
    const useRedis = options.useRedis ?? strategyConfig.useRedis;

    let result: CacheResult<T> = {
      value: null,
      hit: false,
      source: null
    };

    // Try memory cache first
    if (useMemory) {
      const memoryValue = this.memory.get<string>(key);
      if (memoryValue !== null) {
        try {
          const value = await this.deserializeValue<T>(memoryValue);
          result = {
            value,
            hit: true,
            source: 'memory',
            ttl: this.memory.ttl(key),
            createdAt: Date.now()
          };
          return result;
        } catch (error) {
          // If deserialization fails, remove from memory cache
          this.memory.del(key);
        }
      }
    }

    // Try Redis cache
    if (useRedis) {
      const redisValue = await this.redis.get(key);
      if (redisValue !== null) {
        try {
          const value = await this.deserializeValue<T>(redisValue);
          result = {
            value,
            hit: true,
            source: 'redis',
            ttl: await this.redis.ttl(key),
            createdAt: Date.now()
          };

          // Backfill memory cache if enabled
          if (useMemory) {
            const memoryTtl = Math.min(strategyConfig.ttl, 300); // Max 5 minutes in memory
            this.memory.set(key, redisValue, memoryTtl);
          }

          return result;
        } catch (error) {
          // If deserialization fails, remove from Redis cache
          this.redis.del(key);
        }
      }
    }

    return result;
  }

  public async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const strategy = options.strategy || 'api_response';
    const strategyConfig = this.getStrategyConfig(strategy);
    
    const ttl = options.ttl ?? strategyConfig.ttl;
    const useMemory = options.useMemory ?? strategyConfig.useMemory;
    const useRedis = options.useRedis ?? strategyConfig.useRedis;
    const useCompression = options.compression ?? strategyConfig.compression;

    try {
      const serializedValue = await this.serializeValue(value, useCompression);
      let memorySuccess = true;
      let redisSuccess = true;

      // Set in memory cache
      if (useMemory) {
        const memoryTtl = Math.min(ttl, 600); // Max 10 minutes in memory
        memorySuccess = this.memory.set(key, serializedValue, memoryTtl);
      }

      // Set in Redis cache
      if (useRedis) {
        redisSuccess = await this.redis.set(key, serializedValue, ttl);
      }

      return memorySuccess && redisSuccess;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        error: error as Error,
        metadata: { operation: 'set', strategy }
      });
      return false;
    }
  }

  public async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const strategy = options.strategy || 'api_response';
    const strategyConfig = this.getStrategyConfig(strategy);
    
    const useMemory = options.useMemory ?? strategyConfig.useMemory;
    const useRedis = options.useRedis ?? strategyConfig.useRedis;

    let memorySuccess = true;
    let redisSuccess = true;

    if (useMemory) {
      memorySuccess = this.memory.del(key);
    }

    if (useRedis) {
      redisSuccess = await this.redis.del(key);
    }

    return memorySuccess || redisSuccess;
  }

  public async mget<T = any>(
    keys: string[], 
    options: CacheOptions = {}
  ): Promise<Record<string, CacheResult<T>>> {
    const results: Record<string, CacheResult<T>> = {};
    
    // Get all values concurrently
    const promises = keys.map(async (key) => {
      const result = await this.get<T>(key, options);
      return { key, result };
    });

    const resolved = await Promise.all(promises);
    
    resolved.forEach(({ key, result }) => {
      results[key] = result;
    });

    return results;
  }

  public async mset<T = any>(
    keyValues: Record<string, T>, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const promises = Object.entries(keyValues).map(([key, value]) =>
      this.set(key, value, options)
    );

    const results = await Promise.all(promises);
    return results.every(result => result);
  }

  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const strategy = options.strategy || 'api_response';
    const strategyConfig = this.getStrategyConfig(strategy);
    
    const useMemory = options.useMemory ?? strategyConfig.useMemory;
    const useRedis = options.useRedis ?? strategyConfig.useRedis;

    if (useMemory && this.memory.has(key)) {
      return true;
    }

    if (useRedis) {
      return await this.redis.exists(key);
    }

    return false;
  }

  public async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    const strategy = options.strategy || 'api_response';
    const strategyConfig = this.getStrategyConfig(strategy);
    
    const useMemory = options.useMemory ?? strategyConfig.useMemory;
    const useRedis = options.useRedis ?? strategyConfig.useRedis;

    if (useMemory && this.memory.has(key)) {
      return this.memory.ttl(key);
    }

    if (useRedis) {
      return await this.redis.ttl(key);
    }

    return -1;
  }

  public async expire(key: string, ttlSeconds: number, options: CacheOptions = {}): Promise<boolean> {
    const strategy = options.strategy || 'api_response';
    const strategyConfig = this.getStrategyConfig(strategy);
    
    const useMemory = options.useMemory ?? strategyConfig.useMemory;
    const useRedis = options.useRedis ?? strategyConfig.useRedis;

    let memorySuccess = true;
    let redisSuccess = true;

    if (useMemory) {
      memorySuccess = this.memory.expire(key, ttlSeconds);
    }

    if (useRedis) {
      redisSuccess = await this.redis.expire(key, ttlSeconds);
    }

    return memorySuccess || redisSuccess;
  }

  public async invalidateByPattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    // Invalidate memory cache
    const memoryKeys = this.memory.keys();
    const matchingMemoryKeys = memoryKeys.filter(key => 
      new RegExp(pattern.replace(/\*/g, '.*')).test(key)
    );
    
    matchingMemoryKeys.forEach(key => {
      if (this.memory.del(key)) {
        deletedCount++;
      }
    });

    // Invalidate Redis cache
    if (this.redis.isReady()) {
      const redisKeys = await this.redis.keys(pattern);
      for (const key of redisKeys) {
        if (await this.redis.del(key)) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  public async invalidateByTags(tags: string[]): Promise<number> {
    // This would require a tag-to-key mapping stored separately
    // For now, we'll implement a simple pattern-based approach
    let deletedCount = 0;
    
    for (const tag of tags) {
      const pattern = `*:${tag}:*`;
      deletedCount += await this.invalidateByPattern(pattern);
    }

    return deletedCount;
  }

  public async warm(key: string, loader: () => Promise<any>, options: CacheOptions = {}): Promise<boolean> {
    const exists = await this.exists(key, options);
    if (!exists) {
      try {
        const value = await loader();
        return await this.set(key, value, options);
      } catch (error) {
        this.emitEvent({
          type: 'error',
          key,
          timestamp: Date.now(),
          error: error as Error,
          metadata: { operation: 'warm' }
        });
        return false;
      }
    }
    return true;
  }

  public async getOrSet<T = any>(
    key: string,
    loader: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const result = await this.get<T>(key, options);
    
    if (result.hit && result.value !== null) {
      return result.value;
    }

    try {
      const value = await loader();
      await this.set(key, value, options);
      return value;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        error: error as Error,
        metadata: { operation: 'getOrSet' }
      });
      throw error;
    }
  }

  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  public async getStats(): Promise<CacheStats> {
    const memoryStats = this.memory.getStats();
    const redisStats = this.redis.getStats();
    
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    let redisInfo = {};
    if (this.redis.isReady()) {
      try {
        const info = await this.redis.info('memory');
        const lines = info.split('\r\n');
        const memoryLine = lines.find(line => line.startsWith('used_memory:'));
        if (memoryLine) {
          redisInfo = { memory: parseInt(memoryLine.split(':')[1]) };
        }
      } catch (error) {
        // Ignore errors when getting Redis info
      }
    }

    return {
      memory: {
        keys: memoryStats.keys || 0,
        size: memoryStats.ksize || 0,
        hits: memoryStats.hits,
        misses: memoryStats.misses
      },
      redis: {
        connected: redisStats.connected,
        hits: 0, // Redis doesn't track hits/misses internally
        misses: 0,
        ...redisInfo
      },
      overall: {
        hitRate,
        totalRequests,
        averageResponseTime: 0 // Would need to track timing
      }
    };
  }

  public resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      memoryUsage: 0,
      redisConnected: this.redis.isReady(),
      lastResetAt: Date.now()
    };
  }

  public async flush(): Promise<void> {
    this.memory.flushAll();
    if (this.redis.isReady()) {
      await this.redis.flushdb();
    }
  }

  public async close(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.memory.close();
    await this.redis.disconnect();
  }
}
