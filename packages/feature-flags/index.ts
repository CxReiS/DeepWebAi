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

import { FeatureFlagProvider, FeatureFlagConfig, UserContext } from './src/types';
import { DatabaseFeatureFlagProvider } from './src/database-provider';
import { GrowthBookFeatureFlagProvider } from './src/growthbook-provider';

export class FeatureFlagManager {
  private provider: FeatureFlagProvider;
  private config: FeatureFlagConfig;

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    
    switch (config.provider) {
      case 'growthbook':
        if (!config.growthbookClientKey) {
          throw new Error('GrowthBook client key is required when using GrowthBook provider');
        }
        this.provider = new GrowthBookFeatureFlagProvider(config);
        break;
      case 'database':
      default:
        if (!config.databaseUrl) {
          throw new Error('Database URL is required when using database provider');
        }
        this.provider = new DatabaseFeatureFlagProvider(config);
        break;
    }
  }

  async initialize(): Promise<void> {
    return this.provider.initialize();
  }

  async isFeatureEnabled(flagName: string, userContext: UserContext): Promise<boolean> {
    return this.provider.isFeatureEnabled(flagName, userContext);
  }

  async getAllFeatures(userContext: UserContext): Promise<Record<string, boolean>> {
    return this.provider.getAllFeatures(userContext);
  }

  async getFeatureValue<T>(flagName: string, userContext: UserContext, defaultValue: T): Promise<T> {
    return this.provider.getFeatureValue(flagName, userContext, defaultValue);
  }

  async trackEvent(eventName: string, userContext: UserContext, properties?: Record<string, any>): Promise<void> {
    return this.provider.trackEvent(eventName, userContext, properties);
  }

  async destroy(): Promise<void> {
    return this.provider.destroy();
  }

  // Utility methods for common patterns
  async withFeatureFlag<T>(
    flagName: string, 
    userContext: UserContext, 
    enabledCallback: () => Promise<T>, 
    disabledCallback: () => Promise<T>
  ): Promise<T> {
    const isEnabled = await this.isFeatureEnabled(flagName, userContext);
    return isEnabled ? enabledCallback() : disabledCallback();
  }

  async createUserContext(userId: string, attributes?: Partial<UserContext>): Promise<UserContext> {
    return {
      id: userId,
      email: attributes?.email,
      role: attributes?.role,
      plan: attributes?.plan,
      country: attributes?.country,
      customAttributes: attributes?.customAttributes || {}
    };
  }
}

// Default feature flag names (extend as needed)
export const FEATURE_FLAGS = {
  NEW_CHAT_UI: 'new-chat-ui',
  AI_STREAMING: 'ai-streaming',
  ADVANCED_ANALYTICS: 'advanced-analytics',
  BETA_FEATURES: 'beta-features',
  REALTIME_COLLABORATION: 'realtime-collaboration',
  PREMIUM_MODELS: 'premium-models',
  FILE_UPLOAD: 'file-upload',
  CUSTOM_THEMES: 'custom-themes',
} as const;

// Export types and providers
export * from './src/types';
export { DatabaseFeatureFlagProvider } from './src/database-provider';
export { GrowthBookFeatureFlagProvider } from './src/growthbook-provider';
