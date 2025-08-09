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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../src/cache.service.js';
import { testConfig } from '../src/config.js';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService(testConfig);
  });

  afterEach(async () => {
    await cacheService.flush();
    await cacheService.close();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test:key';
      const value = { message: 'Hello, World!' };

      const setResult = await cacheService.set(key, value);
      expect(setResult).toBe(true);

      const getResult = await cacheService.get(key);
      expect(getResult.hit).toBe(true);
      expect(getResult.value).toEqual(value);
      expect(getResult.source).toBeDefined();
    });

    it('should return cache miss for non-existent key', async () => {
      const result = await cacheService.get('non:existent:key');
      expect(result.hit).toBe(false);
      expect(result.value).toBeNull();
    });

    it('should delete a key', async () => {
      const key = 'test:delete';
      const value = 'to be deleted';

      await cacheService.set(key, value);
      const deleteResult = await cacheService.del(key);
      expect(deleteResult).toBe(true);

      const getResult = await cacheService.get(key);
      expect(getResult.hit).toBe(false);
    });

    it('should check if key exists', async () => {
      const key = 'test:exists';
      const value = 'exists';

      expect(await cacheService.exists(key)).toBe(false);

      await cacheService.set(key, value);
      expect(await cacheService.exists(key)).toBe(true);
    });
  });

  describe('TTL Operations', () => {
    it('should set TTL with value', async () => {
      const key = 'test:ttl';
      const value = 'with ttl';
      const ttl = 5; // 5 seconds

      await cacheService.set(key, value, { ttl });
      
      const ttlResult = await cacheService.ttl(key);
      expect(ttlResult).toBeGreaterThan(0);
      expect(ttlResult).toBeLessThanOrEqual(ttl);
    });

    it('should expire key after TTL', async () => {
      const key = 'test:expire';
      const value = 'will expire';
      const ttl = 1; // 1 second

      await cacheService.set(key, value, { ttl });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await cacheService.get(key);
      expect(result.hit).toBe(false);
    });

    it('should update TTL for existing key', async () => {
      const key = 'test:update:ttl';
      const value = 'update ttl';

      await cacheService.set(key, value, { ttl: 100 });
      
      const expireResult = await cacheService.expire(key, 200);
      expect(expireResult).toBe(true);
      
      const ttlResult = await cacheService.ttl(key);
      expect(ttlResult).toBeGreaterThan(100);
    });
  });

  describe('Multi Operations', () => {
    it('should get multiple values', async () => {
      const data = {
        'multi:1': { id: 1, name: 'First' },
        'multi:2': { id: 2, name: 'Second' },
        'multi:3': { id: 3, name: 'Third' }
      };

      // Set values
      for (const [key, value] of Object.entries(data)) {
        await cacheService.set(key, value);
      }

      const results = await cacheService.mget(Object.keys(data));
      
      expect(Object.keys(results)).toHaveLength(3);
      Object.entries(data).forEach(([key, expectedValue]) => {
        expect(results[key].hit).toBe(true);
        expect(results[key].value).toEqual(expectedValue);
      });
    });

    it('should set multiple values', async () => {
      const data = {
        'mset:1': 'value1',
        'mset:2': 'value2',
        'mset:3': 'value3'
      };

      const setResult = await cacheService.mset(data);
      expect(setResult).toBe(true);

      // Verify all values were set
      for (const [key, expectedValue] of Object.entries(data)) {
        const result = await cacheService.get(key);
        expect(result.hit).toBe(true);
        expect(result.value).toBe(expectedValue);
      }
    });
  });

  describe('Strategies', () => {
    it('should use api_response strategy settings', async () => {
      const key = 'api:test';
      const value = { data: 'api response' };

      await cacheService.set(key, value, { strategy: 'api_response' });
      const result = await cacheService.get(key, { strategy: 'api_response' });
      
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(value);
    });

    it('should use db_query strategy settings', async () => {
      const key = 'db:query:users';
      const value = [{ id: 1, name: 'User' }];

      await cacheService.set(key, value, { strategy: 'db_query' });
      const result = await cacheService.get(key, { strategy: 'db_query' });
      
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(value);
    });

    it('should use session strategy settings', async () => {
      const key = 'session:user123';
      const value = { userId: 123, data: 'session data' };

      await cacheService.set(key, value, { strategy: 'session' });
      const result = await cacheService.get(key, { strategy: 'session' });
      
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(value);
    });
  });

  describe('Compression', () => {
    it('should handle large objects with compression', async () => {
      const key = 'test:large:object';
      const largeValue = {
        data: 'x'.repeat(2000), // Large string to trigger compression
        metadata: { compressed: true }
      };

      await cacheService.set(key, largeValue, { compression: true });
      const result = await cacheService.get(key);
      
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(largeValue);
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate keys by pattern', async () => {
      const keys = [
        'user:123:profile',
        'user:123:settings',
        'user:456:profile',
        'admin:config'
      ];

      // Set values
      for (const key of keys) {
        await cacheService.set(key, `value for ${key}`);
      }

      // Invalidate user:123:* pattern
      const invalidatedCount = await cacheService.invalidateByPattern('user:123:*');
      expect(invalidatedCount).toBeGreaterThan(0);

      // Check that user:123 keys are deleted
      const user123Profile = await cacheService.get('user:123:profile');
      const user123Settings = await cacheService.get('user:123:settings');
      expect(user123Profile.hit).toBe(false);
      expect(user123Settings.hit).toBe(false);

      // Check that other keys still exist
      const user456Profile = await cacheService.get('user:456:profile');
      const adminConfig = await cacheService.get('admin:config');
      expect(user456Profile.hit).toBe(true);
      expect(adminConfig.hit).toBe(true);
    });
  });

  describe('GetOrSet', () => {
    it('should get existing value without calling loader', async () => {
      const key = 'test:getOrSet:existing';
      const existingValue = 'existing value';
      const loaderSpy = vi.fn().mockResolvedValue('new value');

      await cacheService.set(key, existingValue);
      
      const result = await cacheService.getOrSet(key, loaderSpy);
      
      expect(result).toBe(existingValue);
      expect(loaderSpy).not.toHaveBeenCalled();
    });

    it('should call loader for missing value', async () => {
      const key = 'test:getOrSet:missing';
      const newValue = 'new value from loader';
      const loaderSpy = vi.fn().mockResolvedValue(newValue);

      const result = await cacheService.getOrSet(key, loaderSpy);
      
      expect(result).toBe(newValue);
      expect(loaderSpy).toHaveBeenCalledOnce();

      // Verify value was cached
      const cachedResult = await cacheService.get(key);
      expect(cachedResult.hit).toBe(true);
      expect(cachedResult.value).toBe(newValue);
    });

    it('should propagate loader errors', async () => {
      const key = 'test:getOrSet:error';
      const error = new Error('Loader error');
      const loaderSpy = vi.fn().mockRejectedValue(error);

      await expect(cacheService.getOrSet(key, loaderSpy)).rejects.toThrow('Loader error');
      expect(loaderSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Metrics', () => {
    it('should track cache metrics', async () => {
      const key = 'metrics:test';
      const value = 'test value';

      // Reset metrics
      cacheService.resetMetrics();
      
      // Perform operations
      await cacheService.set(key, value);
      await cacheService.get(key); // hit
      await cacheService.get('non:existent'); // miss
      await cacheService.del(key);

      const metrics = cacheService.getMetrics();
      
      expect(metrics.sets).toBeGreaterThan(0);
      expect(metrics.hits).toBeGreaterThan(0);
      expect(metrics.misses).toBeGreaterThan(0);
      expect(metrics.deletes).toBeGreaterThan(0);
    });

    it('should get cache stats', async () => {
      const stats = await cacheService.getStats();
      
      expect(stats).toHaveProperty('memory');
      expect(stats).toHaveProperty('redis');
      expect(stats).toHaveProperty('overall');
      expect(stats.memory).toHaveProperty('keys');
      expect(stats.memory).toHaveProperty('hits');
      expect(stats.memory).toHaveProperty('misses');
    });
  });

  describe('Event Handling', () => {
    it('should emit cache events', async () => {
      const events: any[] = [];
      const listener = (event: any) => events.push(event);
      
      cacheService.addEventListener(listener);
      
      await cacheService.set('event:test', 'value');
      await cacheService.get('event:test');
      await cacheService.get('event:miss');
      
      // Wait a bit for events to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(events.length).toBeGreaterThan(0);
      
      const setEvents = events.filter(e => e.type === 'set');
      const hitEvents = events.filter(e => e.type === 'hit');
      const missEvents = events.filter(e => e.type === 'miss');
      
      expect(setEvents.length).toBeGreaterThan(0);
      expect(hitEvents.length).toBeGreaterThan(0);
      expect(missEvents.length).toBeGreaterThan(0);
      
      cacheService.removeEventListener(listener);
    });
  });
});
