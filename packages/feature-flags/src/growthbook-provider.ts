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
        if (this.config.enableAnalytics) {
          console.log('GrowthBook experiment tracked:', {
            experiment: experiment.key,
            variation: result.variationId,
            result: result.value
          });
        }
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      // Load features from GrowthBook
      await this.growthbook.loadFeatures();
      console.log('GrowthBook feature flag provider initialized');
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

    return this.growthbook.getFeatureValue(flagName, defaultValue);
  }

  async trackEvent(
    eventName: string, 
    userContext: UserContext, 
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableAnalytics) return;

    // GrowthBook handles tracking automatically through experiments
    // For custom events, you would integrate with your analytics provider
    console.log('Custom event tracked:', {
      event: eventName,
      userId: userContext.id,
      properties
    });
  }

  async destroy(): Promise<void> {
    this.growthbook.destroy();
  }
}
