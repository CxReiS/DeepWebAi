import { Elysia, t } from 'elysia';
import { analytics, AnalyticsEventType } from '../../../../observability/analytics/index.js';
import { logger } from '../../../../../libs/error-tracking/custom-logger.js';

// Analytics router for backend tracking endpoints
export const analyticsRouter = new Elysia({ prefix: '/analytics' })
  .post('/track', async ({ body, headers, request }) => {
    try {
      const { eventType, properties } = body as {
        eventType: AnalyticsEventType;
        properties: Record<string, any>;
      };

      // Extract context from request
      const context = {
        userId: properties.userId,
        sessionId: properties.sessionId,
        userAgent: headers['user-agent'],
        ip: headers['x-forwarded-for'] || 
            headers['x-real-ip'] || 
            request.headers.get('cf-connecting-ip') ||
            'unknown',
        referrer: headers.referer || headers.referrer
      };

      // Track the event
      analytics.track(eventType, properties, context);

      return { success: true, message: 'Event tracked successfully' };
    } catch (error) {
      logger.error('Failed to track analytics event', error as Error);
      return { success: false, error: 'Failed to track event' };
    }
  }, {
    body: t.Object({
      eventType: t.String(),
      properties: t.Record(t.String(), t.Any())
    })
  })
  
  .get('/health', () => {
    return { 
      status: 'healthy', 
      enabled: analytics.config?.enabled || false,
      providers: {
        vercel: !!process.env.VERCEL_ANALYTICS_ID,
        plausible: !!process.env.PLAUSIBLE_DOMAIN,
        mixpanel: !!process.env.MIXPANEL_TOKEN,
        googleAnalytics: !!process.env.GA_MEASUREMENT_ID
      }
    };
  })

  .post('/flush', async () => {
    try {
      await analytics.flush();
      return { success: true, message: 'Events flushed successfully' };
    } catch (error) {
      logger.error('Failed to flush analytics events', error as Error);
      return { success: false, error: 'Failed to flush events' };
    }
  });
