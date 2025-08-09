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

import { CacheService } from './cache.service.js';
import { CacheOptions } from './types.js';

export interface ResponseCacheOptions extends CacheOptions {
  varyHeaders?: string[];
  excludePaths?: string[];
  includePaths?: string[];
  excludeStatusCodes?: number[];
  includeStatusCodes?: number[];
  maxSize?: number;
  skipCacheOnError?: boolean;
}

export class ResponseCache {
  private cache: CacheService;
  private options: ResponseCacheOptions;

  constructor(cache: CacheService, options: ResponseCacheOptions = {}) {
    this.cache = cache;
    this.options = {
      strategy: 'api_response',
      ttl: 300, // 5 minutes default
      varyHeaders: ['accept', 'accept-encoding', 'authorization'],
      excludePaths: ['/api/auth', '/api/admin'],
      includeStatusCodes: [200, 201, 202, 203, 204],
      maxSize: 1024 * 1024, // 1MB default
      skipCacheOnError: true,
      ...options
    };
  }

  public generateCacheKey(
    method: string,
    path: string,
    queryString: string = '',
    headers: Record<string, string> = {},
    userId?: string
  ): string {
    const varyParts: string[] = [];
    
    // Add vary headers to key
    this.options.varyHeaders?.forEach(headerName => {
      const headerValue = headers[headerName.toLowerCase()];
      if (headerValue) {
        varyParts.push(`${headerName}:${headerValue}`);
      }
    });

    // Add user context if available
    if (userId) {
      varyParts.push(`user:${userId}`);
    }

    const varyString = varyParts.length > 0 ? `:${varyParts.join(':')}` : '';
    const queryPart = queryString ? `:${queryString}` : '';
    
    return `response:${method}:${path}${queryPart}${varyString}`;
  }

  public shouldCache(
    method: string,
    path: string,
    statusCode: number,
    responseSize: number
  ): boolean {
    // Only cache GET and HEAD requests
    if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
      return false;
    }

    // Check path exclusions
    if (this.options.excludePaths?.some(excludePath => 
      path.startsWith(excludePath)
    )) {
      return false;
    }

    // Check path inclusions (if specified)
    if (this.options.includePaths && this.options.includePaths.length > 0 && 
        !this.options.includePaths.some(includePath => 
          path.startsWith(includePath)
        )) {
      return false;
    }

    // Check status code exclusions
    if (this.options.excludeStatusCodes && this.options.excludeStatusCodes.includes(statusCode)) {
      return false;
    }

    // Check status code inclusions
    if (this.options.includeStatusCodes && this.options.includeStatusCodes.length > 0 && 
        !this.options.includeStatusCodes.includes(statusCode)) {
      return false;
    }

    // Check response size
    if (this.options.maxSize && responseSize > this.options.maxSize) {
      return false;
    }

    return true;
  }

  public parseCacheControl(cacheControlHeader?: string): {
    noCache: boolean;
    noStore: boolean;
    maxAge?: number;
    mustRevalidate: boolean;
  } {
    const result = {
      noCache: false,
      noStore: false,
      maxAge: undefined as number | undefined,
      mustRevalidate: false
    };

    if (!cacheControlHeader) {
      return result;
    }

    const directives = cacheControlHeader.toLowerCase().split(',')
      .map(d => d.trim());

    directives.forEach(directive => {
      if (directive === 'no-cache') {
        result.noCache = true;
      } else if (directive === 'no-store') {
        result.noStore = true;
      } else if (directive === 'must-revalidate') {
        result.mustRevalidate = true;
      } else if (directive.startsWith('max-age=')) {
        const maxAge = parseInt(directive.split('=')[1]);
        if (!isNaN(maxAge)) {
          result.maxAge = maxAge;
        }
      }
    });

    return result;
  }

  public async get(
    method: string,
    path: string,
    queryString?: string,
    headers: Record<string, string> = {},
    userId?: string
  ): Promise<{
    hit: boolean;
    data?: {
      statusCode: number;
      headers: Record<string, string>;
      body: any;
      timestamp: number;
    };
    source?: 'memory' | 'redis' | 'fallback';
  }> {
    // Check if request has no-cache directive
    const cacheControl = this.parseCacheControl(headers['cache-control']);
    if (cacheControl.noCache || cacheControl.noStore) {
      return { hit: false };
    }

    const cacheKey = this.generateCacheKey(method, path, queryString, headers, userId);
    const result = await this.cache.get(cacheKey, this.options);

    if (result.hit && result.value) {
      // Check if cached response is still valid
      const cachedData = result.value as any;
      const now = Date.now();
      
      // Check max-age from original response
      if (cachedData.headers['cache-control']) {
        const cachedCacheControl = this.parseCacheControl(cachedData.headers['cache-control']);
        if (cachedCacheControl.maxAge) {
          const ageInSeconds = (now - cachedData.timestamp) / 1000;
          if (ageInSeconds > cachedCacheControl.maxAge) {
            // Cache expired based on max-age
            await this.cache.del(cacheKey, this.options);
            return { hit: false };
          }
        }
      }

      return {
        hit: true,
        data: cachedData,
        source: result.source ?? undefined
      };
    }

    return { hit: false };
  }

  public async set(
    method: string,
    path: string,
    statusCode: number,
    headers: Record<string, string>,
    body: any,
    queryString?: string,
    requestHeaders: Record<string, string> = {},
    userId?: string
  ): Promise<boolean> {
    // Check if response should be cached
    const bodySize = JSON.stringify(body).length;
    
    if (!this.shouldCache(method, path, statusCode, bodySize)) {
      return false;
    }

    // Check response cache-control directives
    const cacheControl = this.parseCacheControl(headers['cache-control']);
    if (cacheControl.noStore) {
      return false;
    }

    const cacheKey = this.generateCacheKey(method, path, queryString, requestHeaders, userId);
    
    const cacheData = {
      statusCode,
      headers: { ...headers },
      body,
      timestamp: Date.now()
    };

    // Determine TTL from cache-control header or use default
    let ttl = this.options.ttl!;
    if (cacheControl.maxAge !== undefined) {
      ttl = Math.min(cacheControl.maxAge, ttl);
    }

    const cacheOptions = {
      ...this.options,
      ttl
    };

    return await this.cache.set(cacheKey, cacheData, cacheOptions);
  }

  public async invalidate(
    method: string,
    path: string,
    queryString?: string,
    headers: Record<string, string> = {},
    userId?: string
  ): Promise<boolean> {
    const cacheKey = this.generateCacheKey(method, path, queryString, headers, userId);
    return await this.cache.del(cacheKey, this.options);
  }

  public async invalidateByPath(path: string): Promise<number> {
    const pattern = `response:*:${path}*`;
    return await this.cache.invalidateByPattern(pattern);
  }

  public async invalidateByUser(userId: string): Promise<number> {
    const pattern = `response:*:user:${userId}*`;
    return await this.cache.invalidateByPattern(pattern);
  }

  public generateETag(data: any): string {
    const hash = require('crypto').createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }

  public checkIfNoneMatch(etag: string, ifNoneMatch?: string): boolean {
    if (!ifNoneMatch) {
      return false;
    }

    // Handle multiple ETags in If-None-Match header
    const etags = ifNoneMatch.split(',').map(tag => tag.trim());
    return etags.includes(etag) || etags.includes('*');
  }

  public formatCacheControlHeader(options: {
    maxAge?: number;
    public?: boolean;
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
  }): string {
    const directives: string[] = [];

    if (options.public) directives.push('public');
    if (options.private) directives.push('private');
    if (options.noCache) directives.push('no-cache');
    if (options.noStore) directives.push('no-store');
    if (options.mustRevalidate) directives.push('must-revalidate');
    if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);

    return directives.join(', ');
  }

  public async getStats(): Promise<{
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    avgResponseSize: number;
  }> {
    // This would require additional tracking in a real implementation
    // For now, return basic stats from the cache service
    const cacheStats = await this.cache.getStats();
    
    return {
      totalRequests: cacheStats.overall.totalRequests,
      cacheHits: cacheStats.memory.hits + cacheStats.redis.hits,
      cacheMisses: cacheStats.memory.misses + cacheStats.redis.misses,
      hitRate: cacheStats.overall.hitRate,
      avgResponseSize: 0 // Would need to track this separately
    };
  }
}
