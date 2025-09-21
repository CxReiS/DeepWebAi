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
        logRequest: (statusCode: number, error?: unknown) => {
          const duration = Date.now() - startTime;

          const err = error instanceof Error ? error : undefined;
          if (err) {
            logger.error(`${method} ${url} ${statusCode} - ${duration}ms`, err);
            analytics.track('api_error', {
              method,
              url,
              statusCode,
              duration,
              error: err.message
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
  // Türkçe Açıklama: Elysia v1.3.x ile 'onResponse' yerine 'onAfterResponse' kullanılmalıdır.
  .onAfterResponse(({ monitoring, set }) => {
    const s = typeof set.status === 'number' ? set.status : 200;
    monitoring.logRequest(s);
  })
  .onError(({ error, monitoring, set }) => {
    const statusCode = typeof set.status === 'number' ? set.status : 500;
    monitoring.logRequest(statusCode, error);
    return {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    };
  });

// Health check with monitoring
export const healthCheck = new Elysia({ name: 'health' })
  .get('/health', async () => {
    const health: { status: 'ok' | 'degraded'; timestamp: string; environment: string; uptime: number; memory: NodeJS.MemoryUsage; database?: string } = {
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
