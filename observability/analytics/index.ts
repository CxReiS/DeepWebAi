// Analytics module for tracking events
import { logger } from '../../libs/error-tracking/custom-logger.js';

export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  API_CALL = 'api_call',
  ERROR = 'error',
  USER_ACTION = 'user_action'
}

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

class Analytics {
  private events: AnalyticsEvent[] = [];

  track(event: AnalyticsEvent): void {
    this.events.push(event);
    logger.info('Analytics event tracked', { event });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const analytics = new Analytics();
