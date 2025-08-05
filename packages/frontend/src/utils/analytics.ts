// Frontend analytics integration
import { inject } from '@vercel/analytics';
import { track } from '@vercel/analytics/react';

// Initialize Vercel Analytics
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  inject();
}

// Plausible Analytics
declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
  }
}

// Initialize Plausible Analytics
if (typeof window !== 'undefined' && import.meta.env.VITE_PLAUSIBLE_DOMAIN) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = `https://${import.meta.env.VITE_PLAUSIBLE_API_HOST || 'plausible.io'}/js/script.js`;
  script.setAttribute('data-domain', import.meta.env.VITE_PLAUSIBLE_DOMAIN);
  document.head.appendChild(script);
}

// Analytics event types for frontend
export enum FrontendEventType {
  // Page events
  PAGE_VIEW = 'page_view',
  PAGE_LEAVE = 'page_leave',
  
  // User interactions
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  LINK_CLICK = 'link_click',
  
  // Chat interactions
  CHAT_OPENED = 'chat_opened',
  MESSAGE_SENT = 'message_sent',
  MODEL_SELECTED = 'model_selected',
  CONVERSATION_CREATED = 'conversation_created',
  
  // File operations
  FILE_UPLOAD_STARTED = 'file_upload_started',
  FILE_UPLOAD_COMPLETED = 'file_upload_completed',
  FILE_UPLOAD_FAILED = 'file_upload_failed',
  
  // Feature usage
  FEATURE_ACCESSED = 'feature_accessed',
  SEARCH_PERFORMED = 'search_performed',
  SETTINGS_CHANGED = 'settings_changed',
  
  // Errors
  CLIENT_ERROR = 'client_error',
  API_ERROR = 'api_error',
  
  // Performance
  SLOW_INTERACTION = 'slow_interaction',
  COMPONENT_RENDERED = 'component_rendered'
}

// Frontend analytics configuration
interface FrontendAnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  apiEndpoint?: string;
  userId?: string;
  sessionId?: string;
}

// Default configuration
const defaultConfig: FrontendAnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production' || process.env.VITE_ENABLE_ANALYTICS === 'true',
  debug: process.env.NODE_ENV === 'development',
  apiEndpoint: process.env.VITE_API_URL || 'http://localhost:3001'
};

// Frontend Analytics Service
class FrontendAnalyticsService {
  private config: FrontendAnalyticsConfig;
  private userId?: string;
  private sessionId: string;
  private startTime: number;

  constructor(config?: Partial<FrontendAnalyticsConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    if (this.config.enabled) {
      this.initializeTracking();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent(FrontendEventType.PAGE_LEAVE, {
            timeOnPage: Date.now() - this.startTime
          });
        }
      });
    }

    // Track errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(new Error(event.reason), {
          type: 'unhandled_promise_rejection'
        });
      });
    }

    this.log('Frontend analytics initialized');
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.debug('[Analytics]', message, data);
    }
  }

  private getPageInfo() {
    if (typeof window === 'undefined') return {};
    
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private async sendToBackend(eventType: FrontendEventType, properties: Record<string, any>): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`${this.config.apiEndpoint}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          eventType,
          properties: {
            ...properties,
            ...this.getPageInfo(),
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      this.log('Failed to send analytics to backend', error);
    }
  }

  // Set user context
  setUser(userId: string): void {
    this.userId = userId;
    this.config.userId = userId;
    this.log('User context set', { userId });
  }

  // Track an event
  trackEvent(eventType: FrontendEventType, properties: Record<string, any> = {}): void {
    if (!this.config.enabled) return;

    const eventData = {
      ...properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.log('Event tracked', { eventType, properties: eventData });

    // Send to Vercel Analytics
    if (typeof window !== 'undefined') {
      track(eventType, eventData);
    }

    // Send to Plausible Analytics
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(eventType, { props: eventData });
    }

    // Send to backend
    this.sendToBackend(eventType, eventData);
  }

  // Track page view
  trackPageView(path?: string): void {
    const pageInfo = this.getPageInfo();
    
    this.trackEvent(FrontendEventType.PAGE_VIEW, {
      path: path || pageInfo.path,
      ...pageInfo
    });
  }

  // Track user interactions
  trackClick(element: string, properties: Record<string, any> = {}): void {
    this.trackEvent(FrontendEventType.BUTTON_CLICK, {
      element,
      ...properties
    });
  }

  trackFormSubmit(formName: string, properties: Record<string, any> = {}): void {
    this.trackEvent(FrontendEventType.FORM_SUBMIT, {
      formName,
      ...properties
    });
  }

  // Track chat interactions
  trackChatOpened(): void {
    this.trackEvent(FrontendEventType.CHAT_OPENED, {});
  }

  trackMessageSent(messageLength: number, conversationId?: string): void {
    this.trackEvent(FrontendEventType.MESSAGE_SENT, {
      messageLength,
      conversationId
    });
  }

  trackModelSelected(modelId: string, modelName: string): void {
    this.trackEvent(FrontendEventType.MODEL_SELECTED, {
      modelId,
      modelName
    });
  }

  trackConversationCreated(conversationId: string, modelId?: string): void {
    this.trackEvent(FrontendEventType.CONVERSATION_CREATED, {
      conversationId,
      modelId
    });
  }

  // Track file operations
  trackFileUpload(fileName: string, fileSize: number, fileType: string): void {
    this.trackEvent(FrontendEventType.FILE_UPLOAD_STARTED, {
      fileName,
      fileSize,
      fileType
    });
  }

  trackFileUploadCompleted(fileName: string, duration: number): void {
    this.trackEvent(FrontendEventType.FILE_UPLOAD_COMPLETED, {
      fileName,
      duration
    });
  }

  trackFileUploadFailed(fileName: string, error: string): void {
    this.trackEvent(FrontendEventType.FILE_UPLOAD_FAILED, {
      fileName,
      error
    });
  }

  // Track feature usage
  trackFeatureAccess(feature: string, properties: Record<string, any> = {}): void {
    this.trackEvent(FrontendEventType.FEATURE_ACCESSED, {
      feature,
      ...properties
    });
  }

  trackSearch(query: string, resultsCount?: number): void {
    this.trackEvent(FrontendEventType.SEARCH_PERFORMED, {
      query: query.substring(0, 100), // Truncate for privacy
      queryLength: query.length,
      resultsCount
    });
  }

  trackSettingsChange(setting: string, oldValue: any, newValue: any): void {
    this.trackEvent(FrontendEventType.SETTINGS_CHANGED, {
      setting,
      oldValue,
      newValue
    });
  }

  // Track errors
  trackError(error: Error, context: Record<string, any> = {}): void {
    this.trackEvent(FrontendEventType.CLIENT_ERROR, {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.substring(0, 500),
      ...context
    });
  }

  trackAPIError(endpoint: string, status: number, error: string): void {
    this.trackEvent(FrontendEventType.API_ERROR, {
      endpoint,
      status,
      error
    });
  }

  // Track performance
  trackSlowInteraction(interaction: string, duration: number): void {
    if (duration > 1000) { // Only track if slower than 1 second
      this.trackEvent(FrontendEventType.SLOW_INTERACTION, {
        interaction,
        duration
      });
    }
  }

  trackComponentRender(componentName: string, renderTime: number): void {
    if (this.config.debug) {
      this.trackEvent(FrontendEventType.COMPONENT_RENDERED, {
        componentName,
        renderTime
      });
    }
  }

  // Performance timing wrapper
  timeInteraction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.trackSlowInteraction(name, duration);
    
    return result;
  }

  // Async performance timing wrapper
  async timeAsyncInteraction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.trackSlowInteraction(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackSlowInteraction(name, duration);
      throw error;
    }
  }
}

// Create default analytics instance
export const analytics = new FrontendAnalyticsService();

// React hooks for analytics
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackFormSubmit: analytics.trackFormSubmit.bind(analytics),
    trackChatOpened: analytics.trackChatOpened.bind(analytics),
    trackMessageSent: analytics.trackMessageSent.bind(analytics),
    trackModelSelected: analytics.trackModelSelected.bind(analytics),
    trackFeatureAccess: analytics.trackFeatureAccess.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    setUser: analytics.setUser.bind(analytics),
    timeInteraction: analytics.timeInteraction.bind(analytics),
    timeAsyncInteraction: analytics.timeAsyncInteraction.bind(analytics)
  };
}

// HOC for tracking page views
export function withPageTracking<P extends {}>(
  Component: React.ComponentType<P>,
  pageName?: string
) {
  return function TrackedComponent(props: P) {
    React.useEffect(() => {
      analytics.trackPageView(pageName);
    }, []);

    return React.createElement(Component, props);
  };
}

// Utility functions
export const track = {
  pageView: (path?: string) => analytics.trackPageView(path),
  click: (element: string, properties?: Record<string, any>) => analytics.trackClick(element, properties),
  error: (error: Error, context?: Record<string, any>) => analytics.trackError(error, context),
  feature: (feature: string, properties?: Record<string, any>) => analytics.trackFeatureAccess(feature, properties)
};

export default {
  FrontendAnalyticsService,
  FrontendEventType,
  analytics,
  useAnalytics,
  withPageTracking,
  track
};
