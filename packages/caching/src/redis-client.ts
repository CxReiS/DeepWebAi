import Redis, { RedisOptions } from 'ioredis';
import { CacheConfig, CacheEvent, CacheEventListener } from './types.js';

export class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;
  private config: CacheConfig['redis'];
  private eventListeners: CacheEventListener[] = [];
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig['redis']) {
    this.config = config;
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      const options: RedisOptions = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        username: this.config.username,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        // retryDelayOnFailover: this.config.retryDelayOnFailover, // Removed - not available in current ioredis
        enableReadyCheck: this.config.enableReadyCheck,
        lazyConnect: this.config.lazyConnect,
        keepAlive: this.config.keepAlive,
        family: this.config.family,
        connectTimeout: this.config.connectTimeout,
        commandTimeout: this.config.commandTimeout,
        
        // Connection pooling
        enableAutoPipelining: true,
        
        // Disable offline queue to prevent memory leaks
        enableOfflineQueue: false
      };

      this.client = new Redis(options);

      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.emitEvent({
          type: 'connect',
          timestamp: Date.now(),
          metadata: { host: this.config.host, port: this.config.port }
        });
      });

      this.client.on('ready', () => {
        this.configureRedis();
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.emitEvent({
          type: 'error',
          timestamp: Date.now(),
          error,
          metadata: { context: 'redis_connection' }
        });
        this.handleReconnection();
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.emitEvent({
          type: 'disconnect',
          timestamp: Date.now(),
          metadata: { context: 'redis_close' }
        });
      });

      this.client.on('reconnecting', () => {
        this.connectionAttempts++;
      });

      // Test connection if not lazy
      if (!this.config.lazyConnect) {
        await this.client.ping();
      }

    } catch (error) {
      this.isConnected = false;
      this.emitEvent({
        type: 'error',
        timestamp: Date.now(),
        error: error as Error,
        metadata: { context: 'redis_initial_connection' }
      });
      this.handleReconnection();
    }
  }

  private async configureRedis(): Promise<void> {
    if (!this.client || !this.isConnected) return;

    try {
      // Set memory policy
      await this.client.config('SET', 'maxmemory-policy', this.config.maxMemoryPolicy);
      
      // Enable keyspace notifications for expiry events
      await this.client.config('SET', 'notify-keyspace-events', 'Ex');
      
    } catch (error) {
      // Ignore configuration errors in restricted environments
      console.warn('Redis configuration warning:', error);
    }
  }

  private handleReconnection(): void {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error(`Redis connection failed after ${this.maxConnectionAttempts} attempts`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
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

  public isReady(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isReady()) return null;
    
    try {
      const result = await this.client!.get(key);
      this.emitEvent({
        type: result ? 'hit' : 'miss',
        key,
        source: 'redis',
        timestamp: Date.now()
      });
      return result;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        error: error as Error,
        metadata: { operation: 'get' }
      });
      return null;
    }
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      let result: string;
      if (ttlSeconds) {
        result = await this.client!.setex(key, ttlSeconds, value);
      } else {
        result = await this.client!.set(key, value);
      }
      
      const success = result === 'OK';
      if (success) {
        this.emitEvent({
          type: 'set',
          key,
          source: 'redis',
          timestamp: Date.now(),
          metadata: { ttl: ttlSeconds }
        });
      }
      return success;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        error: error as Error,
        metadata: { operation: 'set' }
      });
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const result = await this.client!.del(key);
      const success = result > 0;
      if (success) {
        this.emitEvent({
          type: 'delete',
          key,
          source: 'redis',
          timestamp: Date.now()
        });
      }
      return success;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        key,
        timestamp: Date.now(),
        error: error as Error,
        metadata: { operation: 'delete' }
      });
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    if (!this.isReady()) return -1;

    try {
      return await this.client!.ttl(key);
    } catch (error) {
      return -1;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const result = await this.client!.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  public async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isReady() || keys.length === 0) return [];

    try {
      return await this.client!.mget(...keys);
    } catch (error) {
      return new Array(keys.length).fill(null);
    }
  }

  public async mset(keyValues: Record<string, string>): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const pairs: string[] = [];
      Object.entries(keyValues).forEach(([key, value]) => {
        pairs.push(key, value);
      });
      
      const result = await this.client!.mset(pairs);
      return result === 'OK';
    } catch (error) {
      return false;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.isReady()) return [];

    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      return [];
    }
  }

  public async flushdb(): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await this.client!.flushdb();
      return true;
    } catch (error) {
      return false;
    }
  }

  public async info(section?: string): Promise<string> {
    if (!this.isReady()) return '';

    try {
      if (section) {
        return await this.client!.info(section);
      } else {
        return await this.client!.info();
      }
    } catch (error) {
      return '';
    }
  }

  public async pipeline(): Promise<any> {
    if (!this.isReady()) return null;
    return this.client!.pipeline();
  }

  public async multi(): Promise<any> {
    if (!this.isReady()) return null;
    return this.client!.multi();
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    
    this.isConnected = false;
  }

  public getStats(): { connected: boolean; connectionAttempts: number } {
    return {
      connected: this.isConnected,
      connectionAttempts: this.connectionAttempts
    };
  }
}
