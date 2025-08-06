import { Elysia } from 'elysia';
import { analytics, AnalyticsEventType } from '../../../observability/analytics/index.js';
import { logger } from '../../../../libs/error-tracking/custom-logger.js';

// Middleware to automatically track API requests
export const analyticsMiddleware = (app: Elysia) => 
  app
    .onRequest(({ request, headers }) => {
      // Track API request start
      const startTime = Date.now();
      request.startTime = startTime;
    })
    
    .onAfterHandle(({ request, headers, response, path }) => {
      try {
        const startTime = request.startTime || Date.now();
        const duration = Date.now() - startTime;
        const statusCode = response.status || 200;

        // Skip health checks and other excluded paths
        const excludedPaths = ['/health', '/metrics', '/favicon.ico', '/api/analytics'];
        if (excludedPaths.some(excluded => path.startsWith(excluded))) {
          return;
        }

        // Extract user context if available
        const authHeader = headers.authorization;
        let userId: string | undefined;
        
        if (authHeader?.startsWith('Bearer ')) {
          try {
            // You might want to decode JWT here to get userId
            // For now, we'll use a placeholder
            userId = 'authenticated_user';
          } catch (error) {
            // JWT decode error, user remains undefined
          }
        }

        // Track API request
        analytics.trackAPIRequest(
          request.method,
          path,
          statusCode,
          duration,
          userId
        );

        // Track slow requests
        if (duration > 1000) {
          analytics.track(AnalyticsEventType.API_REQUEST, {
            endpoint: path,
            method: request.method,
            duration,
            statusCode,
            slow: true
          }, {
            userId,
            userAgent: headers['user-agent'],
            ip: headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
          });
        }

      } catch (error) {
        logger.error('Analytics middleware error', error as Error);
      }
    })
    
    .onError(({ error, request, path, headers }) => {
      try {
        // Track API errors
        const statusCode = error.status || 500;
        const duration = request.startTime ? Date.now() - request.startTime : 0;

        analytics.trackError(error, {
          endpoint: path,
          method: request.method,
          statusCode,
          duration
        });

      } catch (trackingError) {
        logger.error('Analytics error tracking failed', trackingError as Error);
      }
    });

// Extend Request interface to include startTime
declare global {
  namespace Elysia {
    interface Request {
      startTime?: number;
    }
  }
}
