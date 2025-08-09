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

export declare enum AnalyticsEventType {
    USER_REGISTERED = "user_registered",
    USER_LOGIN = "user_login",
    USER_LOGOUT = "user_logout",
    USER_PROFILE_UPDATED = "user_profile_updated",
    CONVERSATION_STARTED = "conversation_started",
    MESSAGE_SENT = "message_sent",
    AI_RESPONSE_GENERATED = "ai_response_generated",
    MODEL_SWITCHED = "model_switched",
    FEATURE_USED = "feature_used",
    FILE_UPLOADED = "file_uploaded",
    FILE_PROCESSED = "file_processed",
    API_REQUEST = "api_request",
    PAGE_VIEW = "page_view",
    ERROR_OCCURRED = "error_occurred",
    SUBSCRIPTION_STARTED = "subscription_started",
    SUBSCRIPTION_CANCELLED = "subscription_cancelled",
    QUOTA_EXCEEDED = "quota_exceeded"
}
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
        rate: number;
        events?: Partial<Record<AnalyticsEventType, number>>;
    };
    privacy: {
        anonymizeIp: boolean;
        excludePaths: string[];
        respectDoNotTrack: boolean;
    };
}
export declare class AnalyticsService {
    private config;
    private eventQueue;
    private flushInterval?;
    constructor(config?: Partial<AnalyticsConfig>);
    private startFlushInterval;
    private shouldSample;
    private anonymizeIp;
    private sendToVercel;
    private sendToPlausible;
    private sendToMixpanel;
    private sendToGoogleAnalytics;
    private sendToCustomEndpoint;
    track(eventType: AnalyticsEventType, properties?: Record<string, any>, context?: {
        userId?: string;
        sessionId?: string;
        userAgent?: string;
        ip?: string;
        referrer?: string;
    }): void;
    flush(): Promise<void>;
    trackUserRegistration(userId: string, properties?: Record<string, any>): void;
    trackUserLogin(userId: string, method?: string): void;
    trackConversationStarted(userId: string, modelId: string, conversationId: string): void;
    trackMessageSent(userId: string, conversationId: string, messageLength: number, tokens?: number): void;
    trackAIResponse(userId: string, conversationId: string, modelId: string, tokens: number, duration: number, cost?: number): void;
    trackFeatureUsage(userId: string, feature: string, context?: Record<string, any>): void;
    trackAPIRequest(method: string, endpoint: string, statusCode: number, duration: number, userId?: string): void;
    trackError(error: Error, context?: Record<string, any>, userId?: string): void;
    shutdown(): Promise<void>;
}
export declare const analytics: AnalyticsService;
export declare const trackEvent: (eventType: AnalyticsEventType, properties?: Record<string, any>, context?: any) => void;
export declare const trackUser: {
    registration: (userId: string, properties?: Record<string, any>) => void;
    login: (userId: string, method?: string) => void;
    logout: (userId: string) => void;
};
export declare const trackAI: {
    conversationStarted: (userId: string, modelId: string, conversationId: string) => void;
    messageSent: (userId: string, conversationId: string, messageLength: number, tokens?: number) => void;
    responseGenerated: (userId: string, conversationId: string, modelId: string, tokens: number, duration: number, cost?: number) => void;
};
declare const _default: {
    AnalyticsService: typeof AnalyticsService;
    AnalyticsEventType: typeof AnalyticsEventType;
    analytics: AnalyticsService;
    trackEvent: (eventType: AnalyticsEventType, properties?: Record<string, any>, context?: any) => void;
    trackUser: {
        registration: (userId: string, properties?: Record<string, any>) => void;
        login: (userId: string, method?: string) => void;
        logout: (userId: string) => void;
    };
    trackAI: {
        conversationStarted: (userId: string, modelId: string, conversationId: string) => void;
        messageSent: (userId: string, conversationId: string, messageLength: number, tokens?: number) => void;
        responseGenerated: (userId: string, conversationId: string, modelId: string, tokens: number, duration: number, cost?: number) => void;
    };
};
export default _default;
