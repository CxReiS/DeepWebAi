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
