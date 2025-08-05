import { logger } from '../../../libs/error-tracking/custom-logger.js';
// Analytics event types
export var AnalyticsEventType;
(function (AnalyticsEventType) {
    // User events
    AnalyticsEventType["USER_REGISTERED"] = "user_registered";
    AnalyticsEventType["USER_LOGIN"] = "user_login";
    AnalyticsEventType["USER_LOGOUT"] = "user_logout";
    AnalyticsEventType["USER_PROFILE_UPDATED"] = "user_profile_updated";
    // AI/Chat events
    AnalyticsEventType["CONVERSATION_STARTED"] = "conversation_started";
    AnalyticsEventType["MESSAGE_SENT"] = "message_sent";
    AnalyticsEventType["AI_RESPONSE_GENERATED"] = "ai_response_generated";
    AnalyticsEventType["MODEL_SWITCHED"] = "model_switched";
    // Feature usage
    AnalyticsEventType["FEATURE_USED"] = "feature_used";
    AnalyticsEventType["FILE_UPLOADED"] = "file_uploaded";
    AnalyticsEventType["FILE_PROCESSED"] = "file_processed";
    // Performance events
    AnalyticsEventType["API_REQUEST"] = "api_request";
    AnalyticsEventType["PAGE_VIEW"] = "page_view";
    AnalyticsEventType["ERROR_OCCURRED"] = "error_occurred";
    // Business events
    AnalyticsEventType["SUBSCRIPTION_STARTED"] = "subscription_started";
    AnalyticsEventType["SUBSCRIPTION_CANCELLED"] = "subscription_cancelled";
    AnalyticsEventType["QUOTA_EXCEEDED"] = "quota_exceeded";
})(AnalyticsEventType || (AnalyticsEventType = {}));
// Default analytics configuration
const defaultConfig = {
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
            [AnalyticsEventType.PAGE_VIEW]: 1.0 // Sample all page views
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
    config;
    eventQueue = [];
    flushInterval;
    constructor(config) {
        this.config = { ...defaultConfig, ...config };
        this.startFlushInterval();
    }
    startFlushInterval() {
        if (this.config.enabled) {
            this.flushInterval = setInterval(() => {
                this.flush();
            }, 30000); // Flush every 30 seconds
        }
    }
    shouldSample(eventType) {
        const eventSamplingRate = this.config.sampling.events?.[eventType];
        const rate = eventSamplingRate !== undefined ? eventSamplingRate : this.config.sampling.rate;
        return Math.random() < rate;
    }
    anonymizeIp(ip) {
        if (!this.config.privacy.anonymizeIp)
            return ip;
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
    async sendToVercel(event) {
        if (!this.config.providers.vercel?.enabled)
            return;
        try {
            // Vercel Analytics integration would go here
            logger.debug('Sending event to Vercel Analytics', { eventType: event.eventType });
        }
        catch (error) {
            logger.error('Failed to send event to Vercel Analytics', error);
        }
    }
    async sendToPlausible(event) {
        if (!this.config.providers.plausible?.enabled || !this.config.providers.plausible.domain)
            return;
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
        }
        catch (error) {
            logger.error('Failed to send event to Plausible', error);
        }
    }
    async sendToMixpanel(event) {
        if (!this.config.providers.mixpanel?.enabled || !this.config.providers.mixpanel.token)
            return;
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
        }
        catch (error) {
            logger.error('Failed to send event to Mixpanel', error);
        }
    }
    async sendToGoogleAnalytics(event) {
        if (!this.config.providers.googleAnalytics?.enabled || !this.config.providers.googleAnalytics.measurementId)
            return;
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
        }
        catch (error) {
            logger.error('Failed to send event to Google Analytics', error);
        }
    }
    async sendToCustomEndpoint(event) {
        if (!this.config.providers.custom?.enabled || !this.config.providers.custom.endpoint)
            return;
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
        }
        catch (error) {
            logger.error('Failed to send event to custom endpoint', error);
        }
    }
    // Track an analytics event
    track(eventType, properties = {}, context) {
        if (!this.config.enabled)
            return;
        // Check sampling
        if (!this.shouldSample(eventType))
            return;
        // Check privacy settings
        if (this.config.privacy.respectDoNotTrack && context?.userAgent?.includes('DNT=1')) {
            return;
        }
        const event = {
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
    async flush() {
        if (this.eventQueue.length === 0)
            return;
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
            }
            catch (error) {
                logger.error('Failed to send analytics event', error, { eventType: event.eventType });
            }
        });
        await Promise.allSettled(promises);
        if (events.length > 0) {
            logger.debug(`Flushed ${events.length} analytics events`);
        }
    }
    // User-specific tracking methods
    trackUserRegistration(userId, properties = {}) {
        this.track(AnalyticsEventType.USER_REGISTERED, {
            userId,
            ...properties
        }, { userId });
    }
    trackUserLogin(userId, method = 'email') {
        this.track(AnalyticsEventType.USER_LOGIN, {
            method
        }, { userId });
    }
    trackConversationStarted(userId, modelId, conversationId) {
        this.track(AnalyticsEventType.CONVERSATION_STARTED, {
            modelId,
            conversationId
        }, { userId });
    }
    trackMessageSent(userId, conversationId, messageLength, tokens) {
        this.track(AnalyticsEventType.MESSAGE_SENT, {
            conversationId,
            messageLength,
            tokens
        }, { userId });
    }
    trackAIResponse(userId, conversationId, modelId, tokens, duration, cost) {
        this.track(AnalyticsEventType.AI_RESPONSE_GENERATED, {
            conversationId,
            modelId,
            tokens,
            duration,
            cost
        }, { userId });
    }
    trackFeatureUsage(userId, feature, context) {
        this.track(AnalyticsEventType.FEATURE_USED, {
            feature,
            ...context
        }, { userId });
    }
    trackAPIRequest(method, endpoint, statusCode, duration, userId) {
        this.track(AnalyticsEventType.API_REQUEST, {
            method,
            endpoint,
            statusCode,
            duration
        }, { userId });
    }
    trackError(error, context, userId) {
        this.track(AnalyticsEventType.ERROR_OCCURRED, {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack?.substring(0, 500), // Truncate stack trace
            ...context
        }, { userId });
    }
    // Graceful shutdown
    async shutdown() {
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
export const trackEvent = (eventType, properties, context) => analytics.track(eventType, properties, context);
export const trackUser = {
    registration: (userId, properties) => analytics.trackUserRegistration(userId, properties),
    login: (userId, method) => analytics.trackUserLogin(userId, method),
    logout: (userId) => analytics.track(AnalyticsEventType.USER_LOGOUT, {}, { userId })
};
export const trackAI = {
    conversationStarted: (userId, modelId, conversationId) => analytics.trackConversationStarted(userId, modelId, conversationId),
    messageSent: (userId, conversationId, messageLength, tokens) => analytics.trackMessageSent(userId, conversationId, messageLength, tokens),
    responseGenerated: (userId, conversationId, modelId, tokens, duration, cost) => analytics.trackAIResponse(userId, conversationId, modelId, tokens, duration, cost)
};
export default {
    AnalyticsService,
    AnalyticsEventType,
    analytics,
    trackEvent,
    trackUser,
    trackAI
};
