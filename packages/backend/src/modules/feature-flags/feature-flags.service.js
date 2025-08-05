"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagService = void 0;
const feature_flags_1 = require("feature-flags");
const elysia_config_1 = require("../../src/elysia.config");
class FeatureFlagService {
    manager = null;
    async initialize() {
        const featureFlagConfig = {
            provider: process.env.FEATURE_FLAG_PROVIDER || 'database',
            environment: elysia_config_1.config.env,
            databaseUrl: process.env.DATABASE_URL,
            growthbookApiKey: process.env.GROWTHBOOK_API_KEY,
            growthbookClientKey: process.env.GROWTHBOOK_CLIENT_KEY,
            growthbookApiUrl: process.env.GROWTHBOOK_API_URL,
            enableAnalytics: elysia_config_1.config.env !== 'development',
            cacheTimeout: parseInt(process.env.FEATURE_FLAG_CACHE_TIMEOUT || '300'),
        };
        this.manager = new feature_flags_1.FeatureFlagManager(featureFlagConfig);
        await this.manager.initialize();
        console.log(`Feature flags initialized with ${featureFlagConfig.provider} provider`);
    }
    async isFeatureEnabled(flagName, userId, userAttributes) {
        if (!this.manager) {
            console.warn('Feature flag manager not initialized, returning false');
            return false;
        }
        const userContext = {
            id: userId,
            ...userAttributes,
            customAttributes: userAttributes?.customAttributes || {}
        };
        try {
            return await this.manager.isFeatureEnabled(flagName, userContext);
        }
        catch (error) {
            console.error(`Error checking feature flag ${flagName}:`, error);
            return false;
        }
    }
    async getAllFeatures(userId, userAttributes) {
        if (!this.manager) {
            console.warn('Feature flag manager not initialized, returning empty object');
            return {};
        }
        const userContext = {
            id: userId,
            ...userAttributes,
            customAttributes: userAttributes?.customAttributes || {}
        };
        try {
            return await this.manager.getAllFeatures(userContext);
        }
        catch (error) {
            console.error('Error getting all features:', error);
            return {};
        }
    }
    async getFeatureValue(flagName, userId, defaultValue, userAttributes) {
        if (!this.manager) {
            return defaultValue;
        }
        const userContext = {
            id: userId,
            ...userAttributes,
            customAttributes: userAttributes?.customAttributes || {}
        };
        try {
            return await this.manager.getFeatureValue(flagName, userContext, defaultValue);
        }
        catch (error) {
            console.error(`Error getting feature value ${flagName}:`, error);
            return defaultValue;
        }
    }
    async trackFeatureEvent(eventName, userId, properties) {
        if (!this.manager)
            return;
        const userContext = { id: userId };
        try {
            await this.manager.trackEvent(eventName, userContext, properties);
        }
        catch (error) {
            console.error(`Error tracking feature event ${eventName}:`, error);
        }
    }
    // Convenience methods for common feature flags
    async canUseNewChatUI(userId, userAttributes) {
        return this.isFeatureEnabled(feature_flags_1.FEATURE_FLAGS.NEW_CHAT_UI, userId, userAttributes);
    }
    async canUseAIStreaming(userId, userAttributes) {
        return this.isFeatureEnabled(feature_flags_1.FEATURE_FLAGS.AI_STREAMING, userId, userAttributes);
    }
    async canUsePremiumModels(userId, userAttributes) {
        return this.isFeatureEnabled(feature_flags_1.FEATURE_FLAGS.PREMIUM_MODELS, userId, userAttributes);
    }
    async canUseFileUpload(userId, userAttributes) {
        return this.isFeatureEnabled(feature_flags_1.FEATURE_FLAGS.FILE_UPLOAD, userId, userAttributes);
    }
    async canUseRealtimeCollaboration(userId, userAttributes) {
        return this.isFeatureEnabled(feature_flags_1.FEATURE_FLAGS.REALTIME_COLLABORATION, userId, userAttributes);
    }
    async destroy() {
        if (this.manager) {
            await this.manager.destroy();
        }
    }
}
// Export singleton instance
exports.featureFlagService = new FeatureFlagService();
