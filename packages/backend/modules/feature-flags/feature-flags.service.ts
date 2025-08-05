import { FeatureFlagManager, FeatureFlagConfig, UserContext, FEATURE_FLAGS } from 'feature-flags';
import { config } from '../../src/elysia.config';

class FeatureFlagService {
  private manager: FeatureFlagManager | null = null;

  async initialize(): Promise<void> {
    const featureFlagConfig: FeatureFlagConfig = {
      provider: (process.env.FEATURE_FLAG_PROVIDER as 'database' | 'growthbook') || 'database',
      environment: config.env as 'development' | 'staging' | 'production',
      databaseUrl: process.env.DATABASE_URL,
      growthbookApiKey: process.env.GROWTHBOOK_API_KEY,
      growthbookClientKey: process.env.GROWTHBOOK_CLIENT_KEY,
      growthbookApiUrl: process.env.GROWTHBOOK_API_URL,
      enableAnalytics: config.env !== 'development',
      cacheTimeout: parseInt(process.env.FEATURE_FLAG_CACHE_TIMEOUT || '300'),
    };

    this.manager = new FeatureFlagManager(featureFlagConfig);
    await this.manager.initialize();
    console.log(`Feature flags initialized with ${featureFlagConfig.provider} provider`);
  }

  async isFeatureEnabled(flagName: string, userId: string, userAttributes?: any): Promise<boolean> {
    if (!this.manager) {
      console.warn('Feature flag manager not initialized, returning false');
      return false;
    }

    const userContext: UserContext = {
      id: userId,
      ...userAttributes,
      customAttributes: userAttributes?.customAttributes || {}
    };

    try {
      return await this.manager.isFeatureEnabled(flagName, userContext);
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      return false;
    }
  }

  async getAllFeatures(userId: string, userAttributes?: any): Promise<Record<string, boolean>> {
    if (!this.manager) {
      console.warn('Feature flag manager not initialized, returning empty object');
      return {};
    }

    const userContext: UserContext = {
      id: userId,
      ...userAttributes,
      customAttributes: userAttributes?.customAttributes || {}
    };

    try {
      return await this.manager.getAllFeatures(userContext);
    } catch (error) {
      console.error('Error getting all features:', error);
      return {};
    }
  }

  async getFeatureValue<T>(
    flagName: string, 
    userId: string, 
    defaultValue: T, 
    userAttributes?: any
  ): Promise<T> {
    if (!this.manager) {
      return defaultValue;
    }

    const userContext: UserContext = {
      id: userId,
      ...userAttributes,
      customAttributes: userAttributes?.customAttributes || {}
    };

    try {
      return await this.manager.getFeatureValue(flagName, userContext, defaultValue);
    } catch (error) {
      console.error(`Error getting feature value ${flagName}:`, error);
      return defaultValue;
    }
  }

  async trackFeatureEvent(
    eventName: string, 
    userId: string, 
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.manager) return;

    const userContext: UserContext = { id: userId };

    try {
      await this.manager.trackEvent(eventName, userContext, properties);
    } catch (error) {
      console.error(`Error tracking feature event ${eventName}:`, error);
    }
  }

  // Convenience methods for common feature flags
  async canUseNewChatUI(userId: string, userAttributes?: any): Promise<boolean> {
    return this.isFeatureEnabled(FEATURE_FLAGS.NEW_CHAT_UI, userId, userAttributes);
  }

  async canUseAIStreaming(userId: string, userAttributes?: any): Promise<boolean> {
    return this.isFeatureEnabled(FEATURE_FLAGS.AI_STREAMING, userId, userAttributes);
  }

  async canUsePremiumModels(userId: string, userAttributes?: any): Promise<boolean> {
    return this.isFeatureEnabled(FEATURE_FLAGS.PREMIUM_MODELS, userId, userAttributes);
  }

  async canUseFileUpload(userId: string, userAttributes?: any): Promise<boolean> {
    return this.isFeatureEnabled(FEATURE_FLAGS.FILE_UPLOAD, userId, userAttributes);
  }

  async canUseRealtimeCollaboration(userId: string, userAttributes?: any): Promise<boolean> {
    return this.isFeatureEnabled(FEATURE_FLAGS.REALTIME_COLLABORATION, userId, userAttributes);
  }

  async destroy(): Promise<void> {
    if (this.manager) {
      await this.manager.destroy();
    }
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();
