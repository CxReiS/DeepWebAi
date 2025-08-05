import { Elysia } from "elysia";
import { corsMiddleware } from "../middleware/cors.js";
import { securityMiddleware } from "../middleware/helmet.js";
import { apiRateLimit } from "../middleware/rate-limiter.js";

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // Security
  jwtSecret: process.env.JWT_SECRET!,
  luciaSecret: process.env.LUCIA_SECRET!,
  
  // AI Providers
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // Ably WebSocket
  ablyApiKey: process.env.ABLY_API_KEY,
  
  // Storage
  storageType: process.env.STORAGE_TYPE || 'local',
  storagePath: process.env.STORAGE_PATH || '/uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  
  // Redis
  redisUrl: process.env.REDIS_URL,
  
  // Monitoring
  sentryDsn: process.env.SENTRY_DSN,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Features
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
};

// Validate required configuration
function validateConfig() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'LUCIA_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (!config.openaiApiKey && !config.anthropicApiKey && !config.deepseekApiKey) {
    console.warn('⚠️  No AI provider API keys configured. Some features may not work.');
  }
  

}

// Base Elysia app configuration
export function createBaseApp() {
  const app = new Elysia({
    name: 'deepweb-api',
    serve: {
      port: config.port,
      hostname: config.host
    }
  });

  // Global error handler
  app.onError(({ error, set, request }) => {
    console.error('Global error handler:', error);
    
    // Log error details
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      headers: request.headers,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error details:', errorInfo);
    
    // Set appropriate error response
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      set.status = 401;
      return {
        error: 'Unauthorized',
        message: 'Authentication required'
      };
    }
    
    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      set.status = 403;
      return {
        error: 'Forbidden',
        message: 'Insufficient permissions'
      };
    }
    
    if (error.message.includes('not found')) {
      set.status = 404;
      return {
        error: 'Not Found',
        message: 'Resource not found'
      };
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      set.status = 400;
      return {
        error: 'Bad Request',
        message: error.message
      };
    }
    
    // Default server error
    set.status = 500;
    return {
      error: 'Internal Server Error',
      message: config.env === 'development' ? error.message : 'Something went wrong'
    };
  });

  // Global request lifecycle hooks
  app
    .onStart(() => {
      console.log(`🚀 DeepWebAI API starting on ${config.host}:${config.port}`);
      console.log(`📊 Environment: ${config.env}`);
      console.log(`🔒 Security features enabled`);
      console.log(`⚡ Rate limiting: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs}ms`);
    })
    .onStop(() => {
      console.log('🛑 DeepWebAI API shutting down...');
    })
    .onRequest(({ request }) => {
      // Request logging handled by middleware
    })
    .onResponse(({ request, set }) => {
      // Response logging handled by middleware
    });

  return app;
}

// Security middleware setup
export function addSecurityMiddleware(app: Elysia) {
  return app
    .use(corsMiddleware)
    .use(securityMiddleware)
    .use(apiRateLimit);
}

// Development-specific middleware
export function addDevelopmentMiddleware(app: Elysia) {
  if (config.env !== 'development') return app;
  
  return app
    .derive(({ request }) => {
      // Development middleware active
      return {};
    });
}

// Production-specific middleware
export function addProductionMiddleware(app: Elysia) {
  if (config.env !== 'production') return app;
  
  return app
    .derive(({ request, set }) => {
      // Production-only security enhancements
      set.headers = {
        ...set.headers,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Production': 'true'
      };
      return {};
    });
}

// Health check endpoint
export function addHealthCheck(app: Elysia) {
  return app.get('/health', async ({ set }) => {
    try {
      // Check database connectivity
      const { checkDatabaseHealth } = await import('../lib/neon-client.js');
      const dbHealthy = await checkDatabaseHealth();
      
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbHealthy ? 'connected' : 'disconnected',
        services: {
          database: dbHealthy,
          redis: !!config.redisUrl,
          ai_providers: {
            openai: !!config.openaiApiKey,
            anthropic: !!config.anthropicApiKey,
            deepseek: !!config.deepseekApiKey,
            gemini: !!config.geminiApiKey
          },
          ably: !!config.ablyApiKey
        }
      };
      
      if (!dbHealthy) {
        set.status = 503;
        health.status = 'degraded';
      }
      
      return health;
    } catch (error) {
      set.status = 503;
      return {
        status: 'error',
        message: 'Health check failed',
        error: config.env === 'development' ? error.message : undefined
      };
    }
  });
}

// Swagger documentation setup
export function addSwaggerDocs(app: Elysia) {
  if (!config.enableSwagger) return app;
  
  return app.get('/docs', () => {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DeepWebAI API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/docs/json',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ]
          });
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  });
}

// Export configuration and utilities
export { config, validateConfig };
export default {
  config,
  validateConfig,
  createBaseApp,
  addSecurityMiddleware,
  addDevelopmentMiddleware,
  addProductionMiddleware,
  addHealthCheck,
  addSwaggerDocs
};
