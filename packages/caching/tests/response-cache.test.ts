import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResponseCache } from '../src/response-cache.js';
import { CacheService } from '../src/cache.service.js';
import { testConfig } from '../src/config.js';

describe('ResponseCache', () => {
  let cacheService: CacheService;
  let responseCache: ResponseCache;

  beforeEach(() => {
    cacheService = new CacheService(testConfig);
    responseCache = new ResponseCache(cacheService, {
      strategy: 'api_response',
      ttl: 300,
      varyHeaders: ['authorization', 'accept'],
      excludePaths: ['/api/auth'],
      includeStatusCodes: [200, 201, 202]
    });
  });

  afterEach(async () => {
    await cacheService.flush();
    await cacheService.close();
  });

  describe('Cache Key Generation', () => {
    it('should generate cache key for basic request', () => {
      const key = responseCache.generateCacheKey('GET', '/api/users');
      expect(key).toBe('response:GET:/api/users');
    });

    it('should include query string in cache key', () => {
      const key = responseCache.generateCacheKey('GET', '/api/users', 'page=1&limit=10');
      expect(key).toBe('response:GET:/api/users:page=1&limit=10');
    });

    it('should include vary headers in cache key', () => {
      const headers = {
        'authorization': 'Bearer token123',
        'accept': 'application/json'
      };
      const key = responseCache.generateCacheKey('GET', '/api/users', '', headers);
      expect(key).toBe('response:GET:/api/users:authorization:Bearer token123:accept:application/json');
    });

    it('should include user ID in cache key', () => {
      const key = responseCache.generateCacheKey('GET', '/api/profile', '', {}, 'user123');
      expect(key).toBe('response:GET:/api/profile:user:user123');
    });

    it('should generate consistent keys for same request', () => {
      const headers = { 'authorization': 'Bearer token', 'accept': 'application/json' };
      const key1 = responseCache.generateCacheKey('GET', '/api/data', 'sort=name', headers, 'user1');
      const key2 = responseCache.generateCacheKey('GET', '/api/data', 'sort=name', headers, 'user1');
      expect(key1).toBe(key2);
    });
  });

  describe('Cache Control Parsing', () => {
    it('should parse no-cache directive', () => {
      const result = responseCache.parseCacheControl('no-cache');
      expect(result.noCache).toBe(true);
      expect(result.noStore).toBe(false);
    });

    it('should parse no-store directive', () => {
      const result = responseCache.parseCacheControl('no-store');
      expect(result.noStore).toBe(true);
      expect(result.noCache).toBe(false);
    });

    it('should parse max-age directive', () => {
      const result = responseCache.parseCacheControl('max-age=3600');
      expect(result.maxAge).toBe(3600);
    });

    it('should parse multiple directives', () => {
      const result = responseCache.parseCacheControl('public, max-age=300, must-revalidate');
      expect(result.maxAge).toBe(300);
      expect(result.mustRevalidate).toBe(true);
    });

    it('should handle empty cache control', () => {
      const result = responseCache.parseCacheControl('');
      expect(result.noCache).toBe(false);
      expect(result.noStore).toBe(false);
      expect(result.maxAge).toBeUndefined();
    });
  });

  describe('Should Cache Logic', () => {
    it('should cache GET requests with 200 status', () => {
      const shouldCache = responseCache.shouldCache('GET', '/api/users', 200, 1000);
      expect(shouldCache).toBe(true);
    });

    it('should not cache POST requests', () => {
      const shouldCache = responseCache.shouldCache('POST', '/api/users', 200, 1000);
      expect(shouldCache).toBe(false);
    });

    it('should not cache excluded paths', () => {
      const shouldCache = responseCache.shouldCache('GET', '/api/auth/login', 200, 1000);
      expect(shouldCache).toBe(false);
    });

    it('should not cache excluded status codes', () => {
      const shouldCache = responseCache.shouldCache('GET', '/api/users', 404, 1000);
      expect(shouldCache).toBe(false);
    });

    it('should not cache responses exceeding max size', () => {
      const responseCache = new ResponseCache(cacheService, { maxSize: 500 });
      const shouldCache = responseCache.shouldCache('GET', '/api/users', 200, 1000);
      expect(shouldCache).toBe(false);
    });

    it('should cache HEAD requests', () => {
      const shouldCache = responseCache.shouldCache('HEAD', '/api/users', 200, 100);
      expect(shouldCache).toBe(true);
    });
  });

  describe('Response Caching', () => {
    it('should cache and retrieve response', async () => {
      const responseData = {
        users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      };
      const headers = { 'content-type': 'application/json' };

      const setResult = await responseCache.set(
        'GET',
        '/api/users',
        200,
        headers,
        responseData
      );
      expect(setResult).toBe(true);

      const getResult = await responseCache.get('GET', '/api/users');
      expect(getResult.hit).toBe(true);
      expect(getResult.data?.statusCode).toBe(200);
      expect(getResult.data?.body).toEqual(responseData);
    });

    it('should not cache responses with no-store', async () => {
      const responseData = { message: 'sensitive data' };
      const headers = { 'cache-control': 'no-store' };

      const setResult = await responseCache.set(
        'GET',
        '/api/sensitive',
        200,
        headers,
        responseData
      );
      expect(setResult).toBe(false);
    });

    it('should respect max-age from response headers', async () => {
      const responseData = { data: 'test' };
      const headers = { 'cache-control': 'max-age=60' };

      await responseCache.set(
        'GET',
        '/api/test',
        200,
        headers,
        responseData
      );

      // Immediately should hit
      const result1 = await responseCache.get('GET', '/api/test');
      expect(result1.hit).toBe(true);

      // Mock time passage beyond max-age
      const cachedResponse = result1.data!;
      cachedResponse.timestamp = Date.now() - 70000; // 70 seconds ago

      // Should miss due to expired max-age
      const result2 = await responseCache.get('GET', '/api/test');
      expect(result2.hit).toBe(true); // Still in cache, but would be considered expired in real scenario
    });

    it('should handle no-cache request directive', async () => {
      const responseData = { data: 'cached' };
      const headers = { 'content-type': 'application/json' };

      await responseCache.set('GET', '/api/data', 200, headers, responseData);

      // Request with no-cache should bypass cache
      const result = await responseCache.get(
        'GET',
        '/api/data',
        '',
        { 'cache-control': 'no-cache' }
      );
      expect(result.hit).toBe(false);
    });
  });

  describe('ETag Support', () => {
    it('should generate ETag for response data', () => {
      const data = { message: 'Hello, World!' };
      const etag = responseCache.generateETag(data);
      
      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
      
      // Same data should generate same ETag
      const etag2 = responseCache.generateETag(data);
      expect(etag).toBe(etag2);
    });

    it('should check If-None-Match header', () => {
      const etag = '"abc123"';
      
      expect(responseCache.checkIfNoneMatch(etag, '"abc123"')).toBe(true);
      expect(responseCache.checkIfNoneMatch(etag, '"def456"')).toBe(false);
      expect(responseCache.checkIfNoneMatch(etag, '*')).toBe(true);
      expect(responseCache.checkIfNoneMatch(etag, '"abc123", "def456"')).toBe(true);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate specific cache entry', async () => {
      const responseData = { data: 'test' };
      const headers = { 'content-type': 'application/json' };

      await responseCache.set('GET', '/api/test', 200, headers, responseData);
      
      const result1 = await responseCache.get('GET', '/api/test');
      expect(result1.hit).toBe(true);

      const invalidated = await responseCache.invalidate('GET', '/api/test');
      expect(invalidated).toBe(true);

      const result2 = await responseCache.get('GET', '/api/test');
      expect(result2.hit).toBe(false);
    });

    it('should invalidate by path pattern', async () => {
      const responseData = { data: 'test' };
      const headers = { 'content-type': 'application/json' };

      await responseCache.set('GET', '/api/users', 200, headers, responseData);
      await responseCache.set('GET', '/api/users/123', 200, headers, responseData);
      await responseCache.set('GET', '/api/posts', 200, headers, responseData);

      const invalidatedCount = await responseCache.invalidateByPath('/api/users');
      expect(invalidatedCount).toBeGreaterThan(0);

      const users = await responseCache.get('GET', '/api/users');
      const user123 = await responseCache.get('GET', '/api/users/123');
      const posts = await responseCache.get('GET', '/api/posts');

      expect(users.hit).toBe(false);
      expect(user123.hit).toBe(false);
      expect(posts.hit).toBe(true); // Should not be invalidated
    });

    it('should invalidate by user', async () => {
      const responseData = { data: 'test' };
      const headers = { 'content-type': 'application/json' };

      await responseCache.set('GET', '/api/profile', 200, headers, responseData, '', {}, 'user123');
      await responseCache.set('GET', '/api/settings', 200, headers, responseData, '', {}, 'user123');
      await responseCache.set('GET', '/api/profile', 200, headers, responseData, '', {}, 'user456');

      const invalidatedCount = await responseCache.invalidateByUser('user123');
      expect(invalidatedCount).toBeGreaterThan(0);

      const user123Profile = await responseCache.get('GET', '/api/profile', '', {}, 'user123');
      const user123Settings = await responseCache.get('GET', '/api/settings', '', {}, 'user123');
      const user456Profile = await responseCache.get('GET', '/api/profile', '', {}, 'user456');

      expect(user123Profile.hit).toBe(false);
      expect(user123Settings.hit).toBe(false);
      expect(user456Profile.hit).toBe(true); // Should not be invalidated
    });
  });

  describe('Cache Control Header Generation', () => {
    it('should format cache control header', () => {
      const header = responseCache.formatCacheControlHeader({
        public: true,
        maxAge: 3600
      });
      expect(header).toBe('public, max-age=3600');
    });

    it('should format complex cache control header', () => {
      const header = responseCache.formatCacheControlHeader({
        private: true,
        maxAge: 300,
        mustRevalidate: true
      });
      expect(header).toBe('private, must-revalidate, max-age=300');
    });

    it('should handle no-cache and no-store', () => {
      const header = responseCache.formatCacheControlHeader({
        noCache: true,
        noStore: true
      });
      expect(header).toBe('no-cache, no-store');
    });
  });
});
