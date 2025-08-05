import * as Sentry from "@sentry/node";
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
export declare function initSentry(config?: Partial<SentryConfig>): void;
export declare class SentryErrorTracker {
    static captureException(error: Error, context?: {
        user?: {
            id: string;
            email?: string;
        };
        tags?: Record<string, string>;
        extra?: Record<string, any>;
        level?: Sentry.SeverityLevel;
    }): string;
    static captureMessage(message: string, context?: {
        level?: Sentry.SeverityLevel;
        tags?: Record<string, string>;
        extra?: Record<string, any>;
    }): string;
    static startTransaction(name: string, operation: string): Sentry.Transaction;
    static setUser(user: {
        id: string;
        email?: string;
        username?: string;
    }): void;
    static addBreadcrumb(breadcrumb: {
        message: string;
        category?: string;
        level?: Sentry.SeverityLevel;
        data?: Record<string, any>;
    }): void;
    static monitorDatabaseQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T>;
    static monitorAPICall<T>(apiName: string, apiFn: () => Promise<T>): Promise<T>;
}
export declare function createSentryMiddleware(): {
    requestHandler: any;
    tracingHandler: any;
    errorHandler: any;
};
export declare function getSentryHealth(): {
    status: 'healthy' | 'unhealthy';
    lastEventId?: string;
    hub?: string;
};
export { Sentry };
declare const _default: {
    initSentry: typeof initSentry;
    SentryErrorTracker: typeof SentryErrorTracker;
    createSentryMiddleware: typeof createSentryMiddleware;
    getSentryHealth: typeof getSentryHealth;
    Sentry: any;
};
export default _default;
