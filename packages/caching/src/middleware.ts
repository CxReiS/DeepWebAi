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

// Note: This middleware requires Elysia to be installed in the consuming package
import { ResponseCache, ResponseCacheOptions } from './response-cache.js';
import { CacheService } from './cache.service.js';

export interface CacheMiddlewareOptions extends ResponseCacheOptions {
  enableConditionalRequests?: boolean;
  enableVaryHeader?: boolean;
  defaultCacheControl?: string;
  bypassHeader?: string;
  debugHeader?: boolean;
}

export function createCacheMiddleware(
  cache: CacheService,
  options: CacheMiddlewareOptions = {}
) {
  const responseCache = new ResponseCache(cache, options);
  
  const middlewareOptions = {
    enableConditionalRequests: true,
    enableVaryHeader: true,
    defaultCacheControl: 'public, max-age=300',
    bypassHeader: 'x-cache-bypass',
    debugHeader: false,
    ...options
  };

  // Return a factory function that can be used with any framework
  return function createElysiaMiddleware() {
    // This requires the Elysia package to be available
    const Elysia = require('elysia').Elysia;
    
    return new Elysia({ name: 'cache-middleware' })
      .derive(async (context: any) => {
        const { request, set } = context;
        const method = request.method;
        const url = new URL(request.url);
        const path = url.pathname;
        const queryString = url.search.slice(1);
        
        // Convert Headers to plain object
        const headers: Record<string, string> = {};
        request.headers.forEach((value: string, key: string) => {
          headers[key.toLowerCase()] = value;
        });

        // Check for cache bypass
        const shouldBypass = headers[middlewareOptions.bypassHeader!] === 'true';
        
        // Extract user ID from request (implement based on your auth strategy)
        const userId = headers['authorization'] ? 
          extractUserIdFromAuth(headers['authorization']) : undefined;

        let cacheResult: any = null;
        let cacheKey: string | null = null;

        // Try to get cached response
        if (!shouldBypass && ['GET', 'HEAD'].includes(method.toUpperCase())) {
          cacheResult = await responseCache.get(method, path, queryString, headers, userId);
          cacheKey = responseCache.generateCacheKey(method, path, queryString, headers, userId);

          if (cacheResult.hit && cacheResult.data) {
            // Handle conditional requests
            if (middlewareOptions.enableConditionalRequests) {
              const etag = responseCache.generateETag(cacheResult.data.body);
              const ifNoneMatch = headers['if-none-match'];
              
              if (responseCache.checkIfNoneMatch(etag, ifNoneMatch)) {
                set.status = 304;
                set.headers = {
                  'etag': etag,
                  'cache-control': cacheResult.data.headers['cache-control'] || middlewareOptions.defaultCacheControl!,
                  'x-cache': `HIT-${cacheResult.source?.toUpperCase()}`,
                  'x-cache-key': middlewareOptions.debugHeader ? cacheKey : undefined
                };
                return new Response(null, { status: 304, headers: set.headers });
              }
            }

            // Return cached response
            set.status = cacheResult.data.statusCode;
            set.headers = {
              ...cacheResult.data.headers,
              'x-cache': `HIT-${cacheResult.source?.toUpperCase()}`,
              'x-cache-key': middlewareOptions.debugHeader ? cacheKey : undefined
            };

            if (middlewareOptions.enableConditionalRequests) {
              set.headers['etag'] = responseCache.generateETag(cacheResult.data.body);
            }

            if (middlewareOptions.enableVaryHeader && middlewareOptions.varyHeaders?.length) {
              set.headers['vary'] = middlewareOptions.varyHeaders.join(', ');
            }

            return cacheResult.data.body;
          }
        }

        return {
          cacheContext: {
            method,
            path,
            queryString,
            headers,
            userId,
            shouldBypass,
            cacheKey,
            cacheHit: cacheResult?.hit || false
          }
        };
      })
      .onAfterHandle(async (context: any) => {
        const { cacheContext, response, set } = context;
        
        if (!cacheContext || cacheContext.shouldBypass || cacheContext.cacheHit) {
          return;
        }

        const { method, path, queryString, headers, userId } = cacheContext;

        try {
          // Only cache successful responses
          if (set.status && set.status >= 200 && set.status < 300) {
            const responseHeaders = { ...set.headers };
            
            // Set default cache control if not present
            if (!responseHeaders['cache-control']) {
              responseHeaders['cache-control'] = middlewareOptions.defaultCacheControl!;
            }

            // Add ETag if conditional requests are enabled
            if (middlewareOptions.enableConditionalRequests && response) {
              responseHeaders['etag'] = responseCache.generateETag(response);
            }

            // Add Vary header if enabled
            if (middlewareOptions.enableVaryHeader && middlewareOptions.varyHeaders?.length) {
              responseHeaders['vary'] = middlewareOptions.varyHeaders.join(', ');
            }

            // Cache the response
            const cached = await responseCache.set(
              method,
              path,
              set.status,
              responseHeaders,
              response,
              queryString,
              headers,
              userId
            );

            // Add cache headers
            set.headers = {
              ...set.headers,
              ...responseHeaders,
              'x-cache': 'MISS',
              'x-cache-stored': cached ? 'true' : 'false',
              'x-cache-key': middlewareOptions.debugHeader ? cacheContext.cacheKey : undefined
            };
          } else {
            // Add miss header for non-cacheable responses
            set.headers = {
              ...set.headers,
              'x-cache': 'BYPASS',
              'x-cache-reason': 'status-code'
            };
          }
        } catch (error) {
          console.error('Cache middleware error:', error);
          
          // Add error header
          set.headers = {
            ...set.headers,
            'x-cache': 'ERROR',
            'x-cache-error': error instanceof Error ? error.message : 'unknown'
          };
        }
      });
  };
}

function extractUserIdFromAuth(authHeader: string): string | undefined {
  try {
    // Implement based on your authentication strategy
    // This is just an example for JWT tokens
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // You would decode the JWT token here
      // For now, just use a hash of the token as user ID
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// Utility function to create cache invalidation routes
export function createCacheInvalidationRoutes(cache: CacheService) {
  return function createElysiaRoutes() {
    const Elysia = require('elysia').Elysia;
    
    return new Elysia({ name: 'cache-invalidation' })
      .post('/api/cache/invalidate', async (context: any) => {
        const { body } = context;
        const { pattern, tags, paths } = body as {
          pattern?: string;
          tags?: string[];
          paths?: string[];
        };

        let invalidatedCount = 0;

        if (pattern) {
          invalidatedCount += await cache.invalidateByPattern(pattern);
        }

        if (tags?.length) {
          invalidatedCount += await cache.invalidateByTags(tags);
        }

        if (paths?.length) {
          const responseCache = new ResponseCache(cache);
          for (const path of paths) {
            invalidatedCount += await responseCache.invalidateByPath(path);
          }
        }

        return {
          success: true,
          invalidatedCount
        };
      })
      .delete('/api/cache/flush', async () => {
        await cache.flush();
        return { success: true };
      })
      .get('/api/cache/stats', async () => {
        return await cache.getStats();
      })
      .get('/api/cache/metrics', () => {
        return cache.getMetrics();
      });
  };
}

// Pre-configured middleware with common settings
export const apiCache = (cache: CacheService) => createCacheMiddleware(cache, {
  strategy: 'api_response',
  ttl: 300, // 5 minutes
  varyHeaders: ['authorization', 'accept'],
  excludePaths: ['/api/auth', '/api/admin', '/api/cache'],
  includeStatusCodes: [200, 201, 202],
  enableConditionalRequests: true,
  enableVaryHeader: true,
  debugHeader: process.env.NODE_ENV === 'development'
});

export const dbQueryCache = (cache: CacheService) => createCacheMiddleware(cache, {
  strategy: 'db_query',
  ttl: 900, // 15 minutes
  varyHeaders: ['authorization'],
  includePaths: ['/api/data', '/api/search'],
  enableConditionalRequests: false,
  compression: true
});

export const staticContentCache = (cache: CacheService) => createCacheMiddleware(cache, {
  strategy: 'file_content',
  ttl: 3600, // 1 hour
  includePaths: ['/assets', '/static'],
  enableConditionalRequests: true,
  compression: true,
  defaultCacheControl: 'public, max-age=3600, immutable'
});
