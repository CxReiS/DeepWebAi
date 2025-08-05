# @deepwebai/caching

Advanced caching infrastructure for DeepWebAi with Redis/DragonflyDB support and multi-layer caching strategy.

## Features

- **Multi-layer caching**: Memory (node-cache) + Redis/DragonflyDB
- **Smart cache strategies**: API responses, DB queries, sessions, file content, AI responses
- **Automatic compression**: For large payloads to optimize storage
- **Cache middleware**: Automatic response caching for Elysia.js
- **TTL management**: Flexible expiration policies
- **Pattern invalidation**: Bulk cache invalidation by patterns and tags
- **Connection pooling**: Robust Redis connection management with reconnection
- **Monitoring & metrics**: Real-time cache performance tracking
- **Event system**: Listen to cache operations (hits, misses, errors, etc.)
- **Conditional requests**: ETag and If-None-Match support
- **Fallback strategies**: Memory fallback when Redis is unavailable

## Installation

```bash
pnpm add @deepwebai/caching
```

## Dependencies

- `ioredis` - Redis client with connection pooling
- `node-cache` - In-memory caching
- `zod` - Configuration validation

## Quick Start

### Basic Usage

```typescript
import { CacheService, getCacheConfig } from '@deepwebai/caching';

// Initialize with environment-based config
const config = getCacheConfig();
const cache = new CacheService(config);

// Basic operations
await cache.set('user:123', { name: 'John', email: 'john@example.com' });
const result = await cache.get('user:123');

if (result.hit) {
  console.log('Cache hit:', result.value);
  console.log('Source:', result.source); // 'memory' or 'redis'
} else {
  console.log('Cache miss');
}

// Get or set pattern
const userData = await cache.getOrSet(
  'user:123:profile',
  async () => {
    // This function only runs on cache miss
    return await fetchUserFromDatabase(123);
  },
  { 
    strategy: 'db_query', 
    ttl: 900 // 15 minutes
  }
);
```

### Cache Strategies

The caching system supports different strategies with optimized settings:

```typescript
// API Response caching (5 min TTL, memory + Redis, compression)
await cache.set('api:users', data, { strategy: 'api_response' });

// Database query caching (15 min TTL, memory + Redis)
await cache.set('query:users:active', data, { strategy: 'db_query' });

// Session caching (24 hours TTL, Redis only)
await cache.set('session:abc123', data, { strategy: 'session' });

// File content caching (1 hour TTL, Redis only, compression)
await cache.set('file:123:content', data, { strategy: 'file_content' });

// AI response caching (30 min TTL, memory + Redis, compression)
await cache.set('ai:response:hash', data, { strategy: 'ai_response' });
```

### Elysia.js Middleware

```typescript
import { Elysia } from 'elysia';
import { 
  createCacheMiddleware,
  createCacheInvalidationRoutes,
  apiCache 
} from '@deepwebai/caching';

const app = new Elysia()
  // Use pre-configured API cache middleware
  .use(apiCache(cache))
  
  // Or create custom middleware
  .use(createCacheMiddleware(cache, {
    strategy: 'api_response',
    ttl: 300,
    varyHeaders: ['authorization', 'accept'],
    excludePaths: ['/api/auth'],
    enableConditionalRequests: true
  }))
  
  // Cache management routes
  .use(createCacheInvalidationRoutes(cache))
  
  .get('/api/users', async () => {
    // This response will be automatically cached
    return await getUsersFromDatabase();
  });
```

### Configuration

#### Environment Variables

```bash
# Redis/DragonflyDB Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_USERNAME=your_username
REDIS_DB=0
CACHE_KEY_PREFIX=deepwebai:

# Memory Cache Settings
MEMORY_CACHE_MAX_KEYS=1000
MEMORY_CACHE_TTL=600

# Strategy-specific TTLs (seconds)
CACHE_API_RESPONSE_TTL=300
CACHE_DB_QUERY_TTL=900
CACHE_SESSION_TTL=86400
CACHE_FILE_CONTENT_TTL=3600
CACHE_AI_RESPONSE_TTL=1800

# Monitoring
CACHE_ENABLE_METRICS=true
CACHE_LOG_HITS=false
CACHE_LOG_MISSES=false
CACHE_LOG_ERRORS=true
```

#### Programmatic Configuration

```typescript
import { createCacheConfig, validateCacheConfig } from '@deepwebai/caching';

const config = createCacheConfig({
  REDIS_HOST: 'my-redis-server',
  REDIS_PORT: '6379',
  CACHE_API_RESPONSE_TTL: '300'
});

// Or create from connection string
import { createConfigFromConnectionString } from '@deepwebai/caching';

const config = createConfigFromConnectionString(
  'redis://username:password@localhost:6379/0'
);
```

## Advanced Features

### Pattern-based Invalidation

```typescript
// Invalidate all user-related cache entries
await cache.invalidateByPattern('user:123:*');

// Invalidate by tags
await cache.invalidateByTags(['posts', 'category:tech']);
```

### Cache Warming

```typescript
// Pre-load critical data
await cache.warm('config:app', async () => {
  return await loadAppConfiguration();
});

// Batch warming
const warmingTasks = [
  cache.warm('users:popular', loadPopularUsers),
  cache.warm('config:system', loadSystemConfig),
  cache.warm('categories:all', loadCategories)
];

await Promise.all(warmingTasks);
```

### Event Monitoring

```typescript
cache.addEventListener((event) => {
  switch (event.type) {
    case 'hit':
      console.log(`Cache hit: ${event.key} from ${event.source}`);
      break;
    case 'miss':
      console.log(`Cache miss: ${event.key}`);
      break;
    case 'error':
      console.error(`Cache error: ${event.key}`, event.error);
      break;
    case 'connect':
      console.log('Redis connected');
      break;
    case 'disconnect':
      console.warn('Redis disconnected');
      break;
  }
});
```

### Response Caching with ETags

```typescript
import { ResponseCache } from '@deepwebai/caching';

const responseCache = new ResponseCache(cache, {
  varyHeaders: ['authorization', 'accept-encoding'],
  enableConditionalRequests: true
});

// Cache response with automatic ETag generation
await responseCache.set(
  'GET',
  '/api/users',
  200,
  { 'content-type': 'application/json' },
  { users: [...] }
);

// Check for conditional requests
const cached = await responseCache.get('GET', '/api/users');
if (cached.hit) {
  const etag = responseCache.generateETag(cached.data.body);
  const ifNoneMatch = request.headers['if-none-match'];
  
  if (responseCache.checkIfNoneMatch(etag, ifNoneMatch)) {
    return new Response(null, { status: 304 });
  }
}
```

### Cache Statistics and Health

```typescript
// Get detailed statistics
const stats = await cache.getStats();
console.log({
  memory: stats.memory, // { keys, size, hits, misses }
  redis: stats.redis,   // { connected, memory, hits, misses }
  overall: stats.overall // { hitRate, totalRequests, avgResponseTime }
});

// Get real-time metrics
const metrics = cache.getMetrics();
console.log({
  hits: metrics.hits,
  misses: metrics.misses,
  errors: metrics.errors,
  hitRate: metrics.hits / (metrics.hits + metrics.misses)
});

// Health check
import { getCacheHealth } from './cache';

const health = await getCacheHealth();
if (!health.redis.connected) {
  console.warn('Redis connection is down');
}
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

The package includes comprehensive tests for:
- Basic cache operations (get, set, delete, TTL)
- Multi-operations (mget, mset)
- Strategy-based caching
- Response caching with ETags
- Pattern invalidation
- Event handling
- Error scenarios

## Performance Considerations

### Memory Cache
- Use for frequently accessed, small data
- Automatic cleanup based on TTL and max keys
- Fast access (nanoseconds)

### Redis Cache
- Use for larger data, longer TTL, shared across instances
- Network latency (milliseconds)
- Persistent across restarts

### Compression
- Automatically enabled for large payloads (>1KB)
- Reduces memory/network usage
- Small CPU overhead for compression/decompression

### Best Practices

1. **Use appropriate strategies**: Match cache strategy to data type and access patterns
2. **Set reasonable TTLs**: Balance freshness vs. performance
3. **Monitor hit rates**: Aim for >80% hit rate for frequently accessed data
4. **Use pattern invalidation**: Efficiently clear related cache entries
5. **Handle errors gracefully**: Cache should degrade gracefully when Redis is unavailable
6. **Warm critical caches**: Pre-load important data during startup

## DragonflyDB Support

DragonflyDB is a Redis-compatible in-memory store with better performance characteristics. Simply point the Redis configuration to your DragonflyDB instance:

```bash
DRAGONFLY_HOST=localhost
DRAGONFLY_PORT=6379
DRAGONFLY_PASSWORD=your_password
```

The caching library will work seamlessly with DragonflyDB's enhanced features like better memory efficiency and multi-threading.

## Integration Examples

See `/packages/backend/src/examples/cache-integration.ts` for comprehensive examples including:
- API endpoint caching
- Database query caching
- User-specific caching
- AI response caching
- Cache warming strategies
- Admin cache management

## API Reference

### CacheService

Main caching service class with multi-layer caching support.

#### Methods

- `get<T>(key: string, options?: CacheOptions): Promise<CacheResult<T>>`
- `set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>`
- `del(key: string, options?: CacheOptions): Promise<boolean>`
- `exists(key: string, options?: CacheOptions): Promise<boolean>`
- `ttl(key: string, options?: CacheOptions): Promise<number>`
- `expire(key: string, ttlSeconds: number, options?: CacheOptions): Promise<boolean>`
- `mget<T>(keys: string[], options?: CacheOptions): Promise<Record<string, CacheResult<T>>>`
- `mset<T>(keyValues: Record<string, T>, options?: CacheOptions): Promise<boolean>`
- `getOrSet<T>(key: string, loader: () => Promise<T>, options?: CacheOptions): Promise<T>`
- `invalidateByPattern(pattern: string): Promise<number>`
- `invalidateByTags(tags: string[]): Promise<number>`
- `warm(key: string, loader: () => Promise<any>, options?: CacheOptions): Promise<boolean>`
- `getStats(): Promise<CacheStats>`
- `getMetrics(): CacheMetrics`
- `flush(): Promise<void>`
- `close(): Promise<void>`

### ResponseCache

HTTP response caching with ETag and conditional request support.

### Middleware

Elysia.js middleware for automatic response caching with configurable strategies.

## License

MIT License - see LICENSE file for details.
