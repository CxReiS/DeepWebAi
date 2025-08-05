import { Elysia } from 'elysia';
import { 
  cacheService, 
  apiCacheMiddleware, 
  dbCacheMiddleware,
  cacheRoutes,
  cacheDbQuery,
  cacheApiResponse,
  cacheAiResponse,
  invalidateUserCache,
  getCacheHealth
} from '../cache.js';

// Example of a fully cached API server
export const cachedApiExample = new Elysia({ name: 'cached-api-example' })
  // Global cache middleware for all routes
  .use(apiCacheMiddleware)
  
  // Cache management routes (admin only)
  .use(cacheRoutes)
  
  // Health check with cache status
  .get('/health', async () => {
    const cacheHealth = await getCacheHealth();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      cache: cacheHealth
    };
  })

  // Example: Cached database query
  .get('/api/users', async () => {
    return await cacheDbQuery(
      'users:all',
      async () => {
        // Simulate database query
        console.log('Fetching users from database...');
        return [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ];
      },
      900 // 15 minutes TTL
    );
  })

  // Example: User-specific cached data
  .get('/api/profile', async ({ headers }) => {
    const userId = extractUserIdFromHeaders(headers);
    if (!userId) {
      throw new Error('Unauthorized');
    }

    return await cacheDbQuery(
      `user:${userId}:profile`,
      async () => {
        console.log(`Fetching profile for user ${userId}...`);
        return {
          id: userId,
          name: 'User Name',
          email: 'user@example.com',
          preferences: { theme: 'dark', language: 'en' }
        };
      },
      1800 // 30 minutes TTL
    );
  })

  // Example: AI response caching
  .post('/api/ai/chat', async ({ body }) => {
    const { message, model = 'gpt-3.5-turbo' } = body as { message: string; model?: string };
    
    // Create cache key based on message and model
    const cacheKey = `ai:chat:${model}:${hashString(message)}`;
    
    return await cacheAiResponse(
      cacheKey,
      async () => {
        console.log('Calling AI service...');
        // Simulate AI API call
        return {
          response: `AI response to: ${message}`,
          model,
          tokens: 150,
          timestamp: new Date().toISOString()
        };
      },
      3600 // 1 hour TTL for AI responses
    );
  })

  // Example: Manual cache warming endpoint
  .post('/api/cache/warm', async () => {
    const warmingTasks = [
      // Warm frequently accessed data
      cacheService.warm('config:app', async () => {
        return {
          appName: 'DeepWebAi',
          version: '1.0.0',
          features: ['ai', 'caching', 'file-processing']
        };
      }),
      
      // Warm popular users data
      cacheService.warm('users:popular', async () => {
        return [
          { id: 1, name: 'Popular User 1' },
          { id: 2, name: 'Popular User 2' }
        ];
      }),
      
      // Warm system settings
      cacheService.warm('settings:system', async () => {
        return {
          maintenance: false,
          maxUploadSize: '10MB',
          supportedFormats: ['.pdf', '.doc', '.txt']
        };
      })
    ];

    await Promise.all(warmingTasks);
    
    return {
      success: true,
      warmedItems: warmingTasks.length,
      timestamp: new Date().toISOString()
    };
  })

  // Example: Cache invalidation on data changes
  .put('/api/users/:id', async ({ params, body }) => {
    const userId = params.id;
    
    // Update user data (simulate)
    console.log(`Updating user ${userId}...`);
    
    // Invalidate related cache entries
    await Promise.all([
      cacheService.del(`user:${userId}:profile`),
      cacheService.del('users:all'),
      invalidateUserCache(userId)
    ]);
    
    return {
      success: true,
      userId,
      cacheInvalidated: true
    };
  })

  // Example: Conditional caching based on user role
  .get('/api/admin/stats', async ({ headers }) => {
    const userId = extractUserIdFromHeaders(headers);
    const userRole = await getUserRole(userId);
    
    if (userRole !== 'admin') {
      throw new Error('Forbidden');
    }

    // Shorter cache for admin data
    return await cacheApiResponse(
      'admin:stats',
      async () => {
        return {
          totalUsers: 1000,
          activeUsers: 850,
          totalFiles: 5000,
          storageUsed: '2.5GB',
          cacheStats: await cacheService.getStats()
        };
      },
      60 // 1 minute TTL for admin stats
    );
  })

  // Example: Cache with tags for grouped invalidation
  .get('/api/posts', async ({ query }) => {
    const { category = 'all', page = '1' } = query;
    const cacheKey = `posts:${category}:page:${page}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`Fetching posts for category ${category}, page ${page}...`);
        return {
          posts: [
            { id: 1, title: 'Post 1', category },
            { id: 2, title: 'Post 2', category }
          ],
          pagination: { page: parseInt(page), total: 10 }
        };
      },
      {
        strategy: 'db_query',
        ttl: 600,
        tags: [`posts:${category}`, 'posts:all']
      }
    );
  })

  // Example: File content caching
  .get('/api/files/:id/content', async ({ params }) => {
    const fileId = params.id;
    
    return await cacheService.getOrSet(
      `file:${fileId}:content`,
      async () => {
        console.log(`Loading file content for ${fileId}...`);
        // Simulate file loading
        return {
          id: fileId,
          content: 'File content here...',
          size: 1024,
          type: 'text/plain'
        };
      },
      {
        strategy: 'file_content',
        ttl: 3600,
        compression: true
      }
    );
  })

  // Example: Real-time cache statistics
  .get('/api/cache/realtime-stats', async () => {
    const [stats, metrics] = await Promise.all([
      cacheService.getStats(),
      Promise.resolve(cacheService.getMetrics())
    ]);

    return {
      timestamp: new Date().toISOString(),
      stats,
      metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  });

// Utility functions
function extractUserIdFromHeaders(headers: Record<string, unknown>): string | null {
  const authHeader = headers.authorization as string;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract user ID from token (simplified)
  const token = authHeader.slice(7);
  return token.split('.')[1] || null; // Simplified JWT payload extraction
}

async function getUserRole(userId: string | null): Promise<string> {
  if (!userId) return 'guest';
  
  // Simulate user role lookup with caching
  return await cacheService.getOrSet(
    `user:${userId}:role`,
    async () => {
      // Simulate database lookup
      return userId === 'admin123' ? 'admin' : 'user';
    },
    {
      strategy: 'session',
      ttl: 3600 // 1 hour
    }
  );
}

function hashString(str: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing cache service...');
  await cacheService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing cache service...');
  await cacheService.close();
  process.exit(0);
});
