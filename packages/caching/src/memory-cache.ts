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

import NodeCache from 'node-cache';
import { CacheConfig, CacheEvent, CacheEventListener } from './types.js';

export class MemoryCache {
  private cache: NodeCache;
  private config: CacheConfig['memory'];
  private eventListeners: CacheEventListener[] = [];
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  constructor(config: CacheConfig['memory']) {
    this.config = config;
    this.cache = new NodeCache({
      stdTTL: config.ttl,
      checkperiod: config.checkperiod,
      useClones: config.useClones,
      deleteOnExpire: config.deleteOnExpire,
      maxKeys: config.max,
      enableLegacyCallbacks: false
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.cache.on('set', (key: string, value: any) => {
      this.stats.sets++;
      this.emitEvent({
        type: 'set',
        key,
        source: 'memory',
        timestamp: Date.now(),
        metadata: { size: this.getValueSize(value) }
      });
    });

    this.cache.on('del', (key: string, _value: any) => {
      this.stats.deletes++;
      this.emitEvent({
        type: 'delete',
        key,
        source: 'memory',
        timestamp: Date.now()
      });
    });

    this.cache.on('expired', (key: string, _value: any) => {
      this.emitEvent({
        type: 'expire',
        key,
        source: 'memory',
        timestamp: Date.now()
      });
    });

    this.cache.on('flush', () => {
      this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    });
  }

  private getValueSize(value: any): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 0;
    }
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

  public get<T = any>(key: string): T | null {
    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      this.emitEvent({
        type: 'hit',
        key,
        source: 'memory',
        timestamp: Date.now()
      });
      return value;
    } else {
      this.stats.misses++;
      this.emitEvent({
        type: 'miss',
        key,
        source: 'memory',
        timestamp: Date.now()
      });
      return null;
    }
  }

  public set<T = any>(key: string, value: T, ttl?: number): boolean {
    try {
      const success = this.cache.set(key, value, ttl || this.config.ttl);
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

  public del(key: string): boolean {
    try {
      const deleted = this.cache.del(key);
      return deleted > 0;
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

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public keys(): string[] {
    return this.cache.keys();
  }

  public mget<T = any>(keys: string[]): Record<string, T> {
    const result: Record<string, T> = {};
    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    });
    return result;
  }

  public mset<T = any>(keyValues: Record<string, T>, ttl?: number): boolean {
    try {
      let allSuccess = true;
      Object.entries(keyValues).forEach(([key, value]) => {
        const success = this.set(key, value, ttl);
        if (!success) allSuccess = false;
      });
      return allSuccess;
    } catch (error) {
      return false;
    }
  }

  public ttl(key: string): number {
    return this.cache.getTtl(key) || -1;
  }

  public expire(key: string, ttlSeconds: number): boolean {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        return this.cache.set(key, value, ttlSeconds);
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public flushAll(): void {
    this.cache.flushAll();
  }

  public getStats(): NodeCache.Stats & { 
    hits: number; 
    misses: number; 
    sets: number; 
    deletes: number;
    hitRate: number;
  } {
    const nodeStats = this.cache.getStats();
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      ...nodeStats,
      ...this.stats,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0
    };
  }

  public close(): void {
    this.cache.close();
  }
}
