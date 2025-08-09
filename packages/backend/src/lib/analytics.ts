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

// Lightweight analytics helper local to backend to avoid cross-package imports

export enum AnalyticsEventType {
  API_REQUEST = 'api_request',
  ERROR_OCCURRED = 'error_occurred',
  PAGE_VIEW = 'page_view',
}

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

class SimpleAnalytics {
  public config = {
    enabled: process.env.ANALYTICS_ENABLED === 'true' || false,
  };

  private queue: AnalyticsEvent[] = [];

  track(eventType: AnalyticsEventType, properties: Record<string, any> = {}, context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    ip?: string;
    referrer?: string;
  }): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      eventType,
      userId: context?.userId,
      sessionId: context?.sessionId,
      timestamp: new Date().toISOString(),
      properties,
      metadata: {
        userAgent: context?.userAgent,
        ip: context?.ip,
        referrer: context?.referrer,
      },
    };

    this.queue.push(event);

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics] event queued', { eventType, properties });
    }

    if (this.queue.length >= 100) void this.flush();
  }

  trackAPIRequest(method: string, endpoint: string, statusCode: number, duration: number, userId?: string): void {
    this.track(AnalyticsEventType.API_REQUEST, { method, endpoint, statusCode, duration }, { userId });
  }

  trackError(error: unknown, context?: Record<string, any>, userId?: string): void {
    const err = error as any;
    this.track(
      AnalyticsEventType.ERROR_OCCURRED,
      {
        errorName: err?.name,
        errorMessage: err?.message,
        stack: typeof err?.stack === 'string' ? err.stack.substring(0, 500) : undefined,
        ...context,
      },
      { userId }
    );
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const events = [...this.queue];
    this.queue = [];
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[analytics] flushed ${events.length} events`);
    }
  }
}

export const analytics = new SimpleAnalytics();

export default {
  analytics,
  AnalyticsEventType,
};
