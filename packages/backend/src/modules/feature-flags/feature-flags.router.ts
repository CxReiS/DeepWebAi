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

import { Elysia } from 'elysia';
import { featureFlagService } from './feature-flags.service';
import { z } from 'zod';

export const featureFlagsRouter = new Elysia({ name: 'feature-flags' })
  // Get all feature flags for a user
  .get('/api/feature-flags', async ({ query, set }) => {
    const { userId, ...userAttributes } = query;
    
    if (!userId) {
      set.status = 400;
      return { error: 'userId is required' };
    }

    try {
      const features = await featureFlagService.getAllFeatures(
        userId as string, 
        userAttributes
      );
      
      return {
        userId,
        features,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
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
      const isEnabled = await featureFlagService.isFeatureEnabled(
        flagName, 
        userId as string, 
        userAttributes
      );
      
      return {
        flagName,
        isEnabled,
        userId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Track feature flag event
  .post('/api/feature-flags/track', async ({ body, set }) => {
    const trackEventSchema = z.object({
      eventName: z.string(),
      userId: z.string().uuid(),
      properties: z.record(z.any()).optional()
    });

    const result = trackEventSchema.safeParse(body);
    if (!result.success) {
      set.status = 400;
      return { error: 'Invalid request body', details: result.error.errors };
    }

    const { eventName, userId, properties } = result.data;

    try {
      await featureFlagService.trackFeatureEvent(eventName, userId, properties);
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
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

    const createFlagSchema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      isEnabled: z.boolean(),
      rolloutPercentage: z.number().min(0).max(100).default(0),
      environment: z.enum(['development', 'staging', 'production', 'all']).default('all'),
      targetGroups: z.array(z.string()).default([]),
      conditions: z.record(z.any()).default({})
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
    } catch (error) {
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
