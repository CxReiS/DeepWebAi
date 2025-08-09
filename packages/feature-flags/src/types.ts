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

import { z } from 'zod';

// Feature Flag Definition Schema
export const FeatureFlagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isEnabled: z.boolean(),
  conditions: z.record(z.any()).default({}),
  rolloutPercentage: z.number().min(0).max(100).default(0),
  targetGroups: z.array(z.string()).default([]),
  environment: z.enum(['development', 'staging', 'production', 'all']).default('all'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

// User Context Schema
export const UserContextSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  plan: z.string().optional(),
  country: z.string().optional(),
  customAttributes: z.record(z.any()).default({}),
});

export type UserContext = z.infer<typeof UserContextSchema>;

// Feature Flag Evaluation Result
export const EvaluationResultSchema = z.object({
  flagName: z.string(),
  isEnabled: z.boolean(),
  reason: z.enum(['default', 'rollout', 'override', 'targeting', 'disabled']),
  metadata: z.record(z.any()).default({}),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// Feature Flag Provider Interface
export interface FeatureFlagProvider {
  initialize(): Promise<void>;
  isFeatureEnabled(flagName: string, userContext: UserContext): Promise<boolean>;
  getAllFeatures(userContext: UserContext): Promise<Record<string, boolean>>;
  getFeatureValue<T>(flagName: string, userContext: UserContext, defaultValue: T): Promise<T>;
  trackEvent(eventName: string, userContext: UserContext, properties?: Record<string, any>): Promise<void>;
  destroy(): Promise<void>;
}

// Configuration
export const FeatureFlagConfigSchema = z.object({
  provider: z.enum(['database', 'growthbook']).default('database'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  // Database provider config
  databaseUrl: z.string().optional(),
  // GrowthBook config
  growthbookApiKey: z.string().optional(),
  growthbookClientKey: z.string().optional(),
  growthbookApiUrl: z.string().optional(),
  // General config
  enableAnalytics: z.boolean().default(true),
  cacheTimeout: z.number().default(300), // 5 minutes
});

export type FeatureFlagConfig = z.infer<typeof FeatureFlagConfigSchema>;
