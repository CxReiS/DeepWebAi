import { GrowthBook } from '@growthbook/growthbook';
import { FeatureFlagProvider, UserContext, FeatureFlagConfig } from './types';

export class GrowthBookFeatureFlagProvider implements FeatureFlagProvider {
  private growthbook: GrowthBook;
  private config: FeatureFlagConfig;

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.growthbook = new GrowthBook({
      apiHost: config.growthbookApiUrl || 'https://cdn.growthbook.io',
      clientKey: config.growthbookClientKey!,
      enableDevMode: config.environment === 'development',
      subscribeToChanges: true,
      trackingCallback: (experiment, result) => {
        // Analytics tracking handled by external service
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Load features from GrowthBook
      await this.growthbook.loadFeatures();
      // GrowthBook initialized successfully
    } catch (error) {
      console.error('Failed to initialize GrowthBook feature flag provider:', error);
      throw error;
    }
  }

  async isFeatureEnabled(flagName: string, userContext: UserContext): Promise<boolean> {
    // Set user attributes for targeting
    this.growthbook.setAttributes({
      id: userContext.id,
      email: userContext.email,
      role: userContext.role,
      plan: userContext.plan,
      country: userContext.country,
      ...userContext.customAttributes
    });

    return this.growthbook.isOn(flagName);
  }

  async getAllFeatures(userContext: UserContext): Promise<Record<string, boolean>> {
    // Set user attributes
    this.growthbook.setAttributes({
      id: userContext.id,
      email: userContext.email,
      role: userContext.role,
      plan: userContext.plan,
      country: userContext.country,
      ...userContext.customAttributes
    });

    const features: Record<string, boolean> = {};
    const allFeatures = this.growthbook.getFeatures();
    
    Object.keys(allFeatures).forEach(key => {
      features[key] = this.growthbook.isOn(key);
    });

    return features;
  }

  async getFeatureValue<T>(
    flagName: string, 
    userContext: UserContext, 
    defaultValue: T
  ): Promise<T> {
    // Set user attributes
    this.growthbook.setAttributes({
      id: userContext.id,
      email: userContext.email,
      role: userContext.role,
      plan: userContext.plan,
      country: userContext.country,
      ...userContext.customAttributes
    });

    return this.growthbook.getFeatureValue(flagName, defaultValue) as T;
  }

  async trackEvent(
    eventName: string, 
    userContext: UserContext, 
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableAnalytics) return;

    // GrowthBook handles tracking automatically through experiments
    // For custom events, you would integrate with your analytics provider
  }

  async destroy(): Promise<void> {
    this.growthbook.destroy();
  }
}
