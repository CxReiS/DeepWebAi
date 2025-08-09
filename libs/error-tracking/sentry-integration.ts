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

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Sentry configuration
export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate: number;
  profilesSampleRate: number;
  tracesSampleRate: number;
  attachStacktrace: boolean;
  debug: boolean;
  integrations?: Sentry.Integration[];
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

// Default Sentry configuration
const defaultConfig: Partial<SentryConfig> = {
  sampleRate: 1.0,
  profilesSampleRate: 0.1,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  attachStacktrace: true,
  debug: process.env.NODE_ENV === 'development',
};

// Initialize Sentry
export function initSentry(config?: Partial<SentryConfig>): void {
  const sentryConfig = {
    ...defaultConfig,
    ...config,
    dsn: config?.dsn || process.env.SENTRY_DSN,
    environment: config?.environment || process.env.NODE_ENV || 'development',
    release: config?.release || process.env.npm_package_version || '1.0.0'
  };

  if (!sentryConfig.dsn) {
    console.warn('⚠️  Sentry DSN not provided. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    sampleRate: sentryConfig.sampleRate,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    profilesSampleRate: sentryConfig.profilesSampleRate,
    attachStacktrace: sentryConfig.attachStacktrace,
    debug: sentryConfig.debug,
    
    integrations: [
      // Default integrations
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined }),
      nodeProfilingIntegration(),
      
      // Custom integrations
      ...(sentryConfig.integrations || [])
    ],

    beforeSend: (event, hint) => {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Skip validation errors in production
        if (sentryConfig.environment === 'production' && 
            error.message.includes('validation')) {
          return null;
        }
        
        // Skip rate limit errors
        if (error.message.includes('Rate limit') || 
            error.message.includes('Too many requests')) {
          return null;
        }
      }

      // Apply custom beforeSend if provided
      if (sentryConfig.beforeSend) {
        return sentryConfig.beforeSend(event);
      }

      return event;
    },

    beforeSendTransaction: (event) => {
      // Filter out health check transactions
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    }
  });

  console.log(`✅ Sentry initialized for ${sentryConfig.environment} environment`);
}

// Enhanced error capturing
export class SentryErrorTracker {
  
  // Capture exception with additional context
  static captureException(error: Error, context?: {
    user?: { id: string; email?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }): string {
    return Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }
      
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      if (context?.level) {
        scope.setLevel(context.level);
      }
      
      return Sentry.captureException(error);
    });
  }

  // Capture message with context
  static captureMessage(message: string, context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }): string {
    return Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      
      return Sentry.captureMessage(message, context?.level || 'info');
    });
  }

  // Start transaction for performance monitoring
  static startTransaction(name: string, operation: string): Sentry.Transaction {
    return Sentry.startTransaction({
      name,
      op: operation
    });
  }

  // Set user context
  static setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser(user);
  }

  // Add breadcrumb for debugging
  static addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }): void {
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
      timestamp: Date.now() / 1000
    });
  }

  // Performance monitoring for database queries
  static async monitorDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'db.query',
      description: queryName
    });

    try {
      const result = await queryFn();
      span?.setStatus('ok');
      return result;
    } catch (error) {
      span?.setStatus('internal_error');
      throw error;
    } finally {
      span?.finish();
    }
  }

  // Performance monitoring for API calls
  static async monitorAPICall<T>(
    apiName: string,
    apiFn: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const span = transaction?.startChild({
      op: 'http.client',
      description: apiName
    });

    try {
      const result = await apiFn();
      span?.setStatus('ok');
      return result;
    } catch (error) {
      span?.setStatus('internal_error');
      throw error;
    } finally {
      span?.finish();
    }
  }
}

// Middleware for Express/Elysia integration
export function createSentryMiddleware() {
  return {
    // Request handler
    requestHandler: Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'username'],
      ip: true,
      request: ['method', 'url', 'headers', 'query']
    }),
    
    // Tracing handler
    tracingHandler: Sentry.Handlers.tracingHandler(),
    
    // Error handler
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError: (error: any) => {
        // Only handle 4xx and 5xx errors
        return error.status >= 400;
      }
    })
  };
}

// Health check for Sentry
export function getSentryHealth(): {
  status: 'healthy' | 'unhealthy';
  lastEventId?: string;
  hub?: string;
} {
  try {
    const hub = Sentry.getCurrentHub();
    const client = hub.getClient();
    
    if (!client) {
      return { status: 'unhealthy' };
    }
    
    return {
      status: 'healthy',
      hub: 'connected'
    };
  } catch (error) {
    return { status: 'unhealthy' };
  }
}

// Export Sentry for direct use
export { Sentry };

export default {
  initSentry,
  SentryErrorTracker,
  createSentryMiddleware,
  getSentryHealth,
  Sentry
};
