// Simple monitoring and logging for backend
import { Elysia } from "elysia";

// Basic logger implementation
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error?.message || '', meta ? JSON.stringify(meta) : '');
    console.error(error?.stack || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  close: async () => {
    // No-op for simple logger
  }
};

// Basic analytics implementation
export const analytics = {
  track: (event: string, properties?: any) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Analytics event', { event, properties });
    }
  },
  shutdown: async () => {
    logger.info('Analytics service shutting down');
  }
};

// Simple Sentry initialization (fallback)
export const initSentry = (config?: any) => {
  if (config?.dsn) {
    logger.info('Sentry would be initialized here with DSN');
  } else {
    logger.info('No Sentry DSN provided, using console logging');
  }
};

// Monitoring middleware for Elysia
export const monitoringMiddleware = new Elysia({ name: 'monitoring' })
  .derive(({ request }) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url).pathname;
    
    return {
      monitoring: {
        startTime,
        method,
        url,
        logRequest: (statusCode: number, error?: Error) => {
          const duration = Date.now() - startTime;
          
          if (error) {
            logger.error(`${method} ${url} ${statusCode} - ${duration}ms`, error);
            analytics.track('api_error', {
              method,
              url,
              statusCode,
              duration,
              error: error.message
            });
          } else {
            logger.info(`${method} ${url} ${statusCode} - ${duration}ms`);
            analytics.track('api_request', {
              method,
              url,
              statusCode,
              duration
            });
          }
        }
      }
    };
  })
  .onResponse(({ monitoring, set }) => {
    monitoring.logRequest(set.status || 200);
  })
  .onError(({ error, monitoring, set }) => {
    const statusCode = set.status || 500;
    monitoring.logRequest(statusCode, error);
    return {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    };
  });

// Health check with monitoring
export const healthCheck = new Elysia({ name: 'health' })
  .get('/health', async () => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    // Basic database health check
    try {
      const { sql } = await import('./lib/neon-client.js');
      await sql`SELECT 1 as health`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'degraded';
      logger.error('Database health check failed', error as Error);
    }
    
    return health;
  });

// Metrics endpoint
export const metricsEndpoint = new Elysia({ name: 'metrics' })
  .get('/metrics', async () => {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
    
    return metrics;
  });

export default {
  logger,
  analytics,
  initSentry,
  monitoringMiddleware,
  healthCheck,
  metricsEndpoint
};
