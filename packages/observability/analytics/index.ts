import { logger } from '../../../libs/error-tracking/custom-logger.js';

// Analytics event types
export enum AnalyticsEventType {
  // User events
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATED = 'user_profile_updated',
  
  // AI/Chat events
  CONVERSATION_STARTED = 'conversation_started',
  MESSAGE_SENT = 'message_sent',
  AI_RESPONSE_GENERATED = 'ai_response_generated',
  MODEL_SWITCHED = 'model_switched',
  
  // Feature usage
  FEATURE_USED = 'feature_used',
  FILE_UPLOADED = 'file_uploaded',
  FILE_PROCESSED = 'file_processed',
  
  // Performance events
  API_REQUEST = 'api_request',
  PAGE_VIEW = 'page_view',
  ERROR_OCCURRED = 'error_occurred',
  
  // Business events
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  QUOTA_EXCEEDED = 'quota_exceeded'
}

// Analytics event interface
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  properties: Record<string, any>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    platform?: string;
    version?: string;
  };
}

// Analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  providers: {
    vercel?: {
      enabled: boolean;
      analyticsId?: string;
    };
    plausible?: {
      enabled: boolean;
      domain?: string;
      apiHost?: string;
    };
    mixpanel?: {
      enabled: boolean;
      token?: string;
    };
    googleAnalytics?: {
      enabled: boolean;
      measurementId?: string;
    };
    custom?: {
      enabled: boolean;
      endpoint?: string;
    };
  };
  sampling: {
    rate: number; // 0.0 to 1.0
    events?: Partial<Record<AnalyticsEventType, number>>;
  };
  privacy: {
    anonymizeIp: boolean;
    excludePaths: string[];
    respectDoNotTrack: boolean;
  };
}

// Default analytics configuration
const defaultConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  providers: {
    vercel: {
      enabled: !!process.env.VERCEL_ANALYTICS_ID,
      analyticsId: process.env.VERCEL_ANALYTICS_ID
    },
    plausible: {
      enabled: !!process.env.PLAUSIBLE_DOMAIN,
      domain: process.env.PLAUSIBLE_DOMAIN,
      apiHost: process.env.PLAUSIBLE_API_HOST || 'plausible.io'
    },
    mixpanel: {
      enabled: !!process.env.MIXPANEL_TOKEN,
      token: process.env.MIXPANEL_TOKEN
    },
    googleAnalytics: {
      enabled: !!process.env.GA_MEASUREMENT_ID,
      measurementId: process.env.GA_MEASUREMENT_ID
    },
    custom: {
      enabled: !!process.env.CUSTOM_ANALYTICS_ENDPOINT,
      endpoint: process.env.CUSTOM_ANALYTICS_ENDPOINT
    }
  },
  sampling: {
    rate: parseFloat(process.env.ANALYTICS_SAMPLING_RATE || '1.0'),
    events: {
      [AnalyticsEventType.API_REQUEST]: 0.1, // Sample 10% of API requests
      [AnalyticsEventType.PAGE_VIEW]: 1.0    // Sample all page views
    }
  },
  privacy: {
    anonymizeIp: true,
    excludePaths: ['/health', '/metrics', '/favicon.ico'],
    respectDoNotTrack: true
  }
};

// Analytics service
export class AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.startFlushInterval();
  }

  private startFlushInterval(): void {
    if (this.config.enabled) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, 30000); // Flush every 30 seconds
    }
  }

  private shouldSample(eventType: AnalyticsEventType): boolean {
    const eventSamplingRate = this.config.sampling.events?.[eventType];
    const rate = eventSamplingRate !== undefined ? eventSamplingRate : this.config.sampling.rate;
    return Math.random() < rate;
  }

  private anonymizeIp(ip: string): string {
    if (!this.config.privacy.anonymizeIp) return ip;
    
    // IPv4: Remove last octet
    if (ip.includes('.')) {
      return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    
    // IPv6: Remove last 64 bits
    if (ip.includes(':')) {
      return ip.split(':').slice(0, 4).join(':') + '::';
    }
    
    return 'anonymous';
  }

  private async sendToVercel(event: AnalyticsEvent): Promise<void> {
    if (!this.config.providers.vercel?.enabled) return;

    try {
      // Vercel Analytics integration would go here
      logger.debug('Sending event to Vercel Analytics', { eventType: event.eventType });
    } catch (error) {
      logger.error('Failed to send event to Vercel Analytics', error as Error);
    }
  }

  private async sendToPlausible(event: AnalyticsEvent): Promise<void> {
    if (!this.config.providers.plausible?.enabled || !this.config.providers.plausible.domain) return;

    try {
      const apiHost = this.config.providers.plausible.apiHost || 'plausible.io';
      
      const payload = {
        name: event.eventType,
        url: event.metadata?.referrer || `https://${this.config.providers.plausible.domain}`,
        domain: this.config.providers.plausible.domain,
        props: {
          ...event.properties,
          userId: event.userId,
          sessionId: event.sessionId,
          platform: event.metadata?.platform
        }
      };

      const response = await fetch(`https://${apiHost}/api/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': event.metadata?.userAgent || 'DeepWebAI-Analytics/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Plausible API error: ${response.status}`);
      }

      logger.debug('Event sent to Plausible', { eventType: event.eventType });
    } catch (error) {
      logger.error('Failed to send event to Plausible', error as Error);
    }
  }

  private async sendToMixpanel(event: AnalyticsEvent): Promise<void> {
    if (!this.config.providers.mixpanel?.enabled || !this.config.providers.mixpanel.token) return;

    try {
      const payload = {
        event: event.eventType,
        properties: {
          ...event.properties,
          time: new Date(event.timestamp).getTime(),
          distinct_id: event.userId || event.sessionId || 'anonymous',
          $insert_id: `${event.eventType}_${event.timestamp}_${event.userId || 'anon'}`,
          ...event.metadata
        }
      };

      const response = await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: Buffer.from(JSON.stringify(payload)).toString('base64'),
          api_key: this.config.providers.mixpanel.token
        })
      });

      if (!response.ok) {
        throw new Error(`Mixpanel API error: ${response.status}`);
      }

      logger.debug('Event sent to Mixpanel', { eventType: event.eventType });
    } catch (error) {
      logger.error('Failed to send event to Mixpanel', error as Error);
    }
  }

  private async sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
    if (!this.config.providers.googleAnalytics?.enabled || !this.config.providers.googleAnalytics.measurementId) return;

    try {
      const payload = {
        client_id: event.userId || event.sessionId || 'anonymous',
        events: [{
          name: event.eventType,
          params: {
            ...event.properties,
            ...event.metadata
          }
        }]
      };

      const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${this.config.providers.googleAnalytics.measurementId}&api_secret=${process.env.GA_API_SECRET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Google Analytics API error: ${response.status}`);
      }

      logger.debug('Event sent to Google Analytics', { eventType: event.eventType });
    } catch (error) {
      logger.error('Failed to send event to Google Analytics', error as Error);
    }
  }

  private async sendToCustomEndpoint(event: AnalyticsEvent): Promise<void> {
    if (!this.config.providers.custom?.enabled || !this.config.providers.custom.endpoint) return;

    try {
      const response = await fetch(this.config.providers.custom.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DeepWebAI-Analytics/1.0.0'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Custom analytics API error: ${response.status}`);
      }

      logger.debug('Event sent to custom endpoint', { eventType: event.eventType });
    } catch (error) {
      logger.error('Failed to send event to custom endpoint', error as Error);
    }
  }

  // Track an analytics event
  track(
    eventType: AnalyticsEventType,
    properties: Record<string, any> = {},
    context?: {
      userId?: string;
      sessionId?: string;
      userAgent?: string;
      ip?: string;
      referrer?: string;
    }
  ): void {
    if (!this.config.enabled) return;
    
    // Check sampling
    if (!this.shouldSample(eventType)) return;

    // Check privacy settings
    if (this.config.privacy.respectDoNotTrack && context?.userAgent?.includes('DNT=1')) {
      return;
    }

    const event: AnalyticsEvent = {
      eventType,
      userId: context?.userId,
      sessionId: context?.sessionId,
      timestamp: new Date().toISOString(),
      properties,
      metadata: {
        userAgent: context?.userAgent,
        ip: context?.ip ? this.anonymizeIp(context.ip) : undefined,
        referrer: context?.referrer,
        platform: 'web',
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    // Add to queue
    this.eventQueue.push(event);

    // Log event
    logger.info('Analytics event tracked', {
      eventType,
      userId: context?.userId,
      properties
    });

    // Flush if queue is getting large
    if (this.eventQueue.length >= 100) {
      this.flush();
    }
  }

  // Flush events to providers
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const promises = events.map(async (event) => {
      try {
        await Promise.all([
          this.sendToVercel(event),
          this.sendToPlausible(event),
          this.sendToMixpanel(event),
          this.sendToGoogleAnalytics(event),
          this.sendToCustomEndpoint(event)
        ]);
      } catch (error) {
        logger.error('Failed to send analytics event', error as Error, { eventType: event.eventType });
      }
    });

    await Promise.allSettled(promises);
    
    if (events.length > 0) {
      logger.debug(`Flushed ${events.length} analytics events`);
    }
  }

  // User-specific tracking methods
  trackUserRegistration(userId: string, properties: Record<string, any> = {}): void {
    this.track(AnalyticsEventType.USER_REGISTERED, {
      userId,
      ...properties
    }, { userId });
  }

  trackUserLogin(userId: string, method: string = 'email'): void {
    this.track(AnalyticsEventType.USER_LOGIN, {
      method
    }, { userId });
  }

  trackConversationStarted(userId: string, modelId: string, conversationId: string): void {
    this.track(AnalyticsEventType.CONVERSATION_STARTED, {
      modelId,
      conversationId
    }, { userId });
  }

  trackMessageSent(userId: string, conversationId: string, messageLength: number, tokens?: number): void {
    this.track(AnalyticsEventType.MESSAGE_SENT, {
      conversationId,
      messageLength,
      tokens
    }, { userId });
  }

  trackAIResponse(userId: string, conversationId: string, modelId: string, tokens: number, duration: number, cost?: number): void {
    this.track(AnalyticsEventType.AI_RESPONSE_GENERATED, {
      conversationId,
      modelId,
      tokens,
      duration,
      cost
    }, { userId });
  }

  trackFeatureUsage(userId: string, feature: string, context?: Record<string, any>): void {
    this.track(AnalyticsEventType.FEATURE_USED, {
      feature,
      ...context
    }, { userId });
  }

  trackAPIRequest(method: string, endpoint: string, statusCode: number, duration: number, userId?: string): void {
    this.track(AnalyticsEventType.API_REQUEST, {
      method,
      endpoint,
      statusCode,
      duration
    }, { userId });
  }

  trackError(error: Error, context?: Record<string, any>, userId?: string): void {
    this.track(AnalyticsEventType.ERROR_OCCURRED, {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.substring(0, 500), // Truncate stack trace
      ...context
    }, { userId });
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    await this.flush();
    logger.info('Analytics service shut down');
  }
}

// Create default analytics instance
export const analytics = new AnalyticsService();

// Convenience functions
export const trackEvent = (eventType: AnalyticsEventType, properties?: Record<string, any>, context?: any) => 
  analytics.track(eventType, properties, context);

export const trackUser = {
  registration: (userId: string, properties?: Record<string, any>) => 
    analytics.trackUserRegistration(userId, properties),
  login: (userId: string, method?: string) => 
    analytics.trackUserLogin(userId, method),
  logout: (userId: string) => 
    analytics.track(AnalyticsEventType.USER_LOGOUT, {}, { userId })
};

export const trackAI = {
  conversationStarted: (userId: string, modelId: string, conversationId: string) =>
    analytics.trackConversationStarted(userId, modelId, conversationId),
  messageSent: (userId: string, conversationId: string, messageLength: number, tokens?: number) =>
    analytics.trackMessageSent(userId, conversationId, messageLength, tokens),
  responseGenerated: (userId: string, conversationId: string, modelId: string, tokens: number, duration: number, cost?: number) =>
    analytics.trackAIResponse(userId, conversationId, modelId, tokens, duration, cost)
};

export default {
  AnalyticsService,
  AnalyticsEventType,
  analytics,
  trackEvent,
  trackUser,
  trackAI
};
