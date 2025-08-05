"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagsRouter = void 0;
const elysia_1 = require("elysia");
const feature_flags_service_1 = require("./feature-flags.service");
const zod_1 = require("zod");
exports.featureFlagsRouter = new elysia_1.Elysia({ name: 'feature-flags' })
    // Get all feature flags for a user
    .get('/api/feature-flags', async ({ query, set }) => {
    const { userId, ...userAttributes } = query;
    if (!userId) {
        set.status = 400;
        return { error: 'userId is required' };
    }
    try {
        const features = await feature_flags_service_1.featureFlagService.getAllFeatures(userId, userAttributes);
        return {
            userId,
            features,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error getting feature flags:', error);
        set.status = 500;
        return { error: 'Internal server error' };
    }
})
    // Check specific feature flag
    .get('/api/feature-flags/:flagName', async ({ params, query, set }) => {
    const { flagName } = params;
    const { userId, ...userAttributes } = query;
    if (!userId) {
        set.status = 400;
        return { error: 'userId is required' };
    }
    try {
        const isEnabled = await feature_flags_service_1.featureFlagService.isFeatureEnabled(flagName, userId, userAttributes);
        return {
            flagName,
            isEnabled,
            userId,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error(`Error checking feature flag ${flagName}:`, error);
        set.status = 500;
        return { error: 'Internal server error' };
    }
})
    // Track feature flag event
    .post('/api/feature-flags/track', async ({ body, set }) => {
    const trackEventSchema = zod_1.z.object({
        eventName: zod_1.z.string(),
        userId: zod_1.z.string().uuid(),
        properties: zod_1.z.record(zod_1.z.any()).optional()
    });
    const result = trackEventSchema.safeParse(body);
    if (!result.success) {
        set.status = 400;
        return { error: 'Invalid request body', details: result.error.errors };
    }
    const { eventName, userId, properties } = result.data;
    try {
        await feature_flags_service_1.featureFlagService.trackFeatureEvent(eventName, userId, properties);
        return { success: true, timestamp: new Date().toISOString() };
    }
    catch (error) {
        console.error('Error tracking feature event:', error);
        set.status = 500;
        return { error: 'Internal server error' };
    }
})
    // Admin endpoints for managing feature flags (database provider only)
    .post('/api/admin/feature-flags', async ({ body, set, headers }) => {
    // Add authentication check here
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'Unauthorized' };
    }
    const createFlagSchema = zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        description: zod_1.z.string().optional(),
        isEnabled: zod_1.z.boolean(),
        rolloutPercentage: zod_1.z.number().min(0).max(100).default(0),
        environment: zod_1.z.enum(['development', 'staging', 'production', 'all']).default('all'),
        targetGroups: zod_1.z.array(zod_1.z.string()).default([]),
        conditions: zod_1.z.record(zod_1.z.any()).default({})
    });
    const result = createFlagSchema.safeParse(body);
    if (!result.success) {
        set.status = 400;
        return { error: 'Invalid request body', details: result.error.errors };
    }
    try {
        // This would need to be implemented in the service
        // await featureFlagService.createFeatureFlag(result.data);
        return { success: true, flag: result.data };
    }
    catch (error) {
        console.error('Error creating feature flag:', error);
        set.status = 500;
        return { error: 'Internal server error' };
    }
})
    // Health check for feature flags
    .get('/api/feature-flags/health', () => {
    return {
        status: 'healthy',
        provider: process.env.FEATURE_FLAG_PROVIDER || 'database',
        timestamp: new Date().toISOString()
    };
});
