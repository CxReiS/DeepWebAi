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

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  FeatureFlagManager,
  FeatureFlagConfig,
  UserContext,
  FEATURE_FLAGS,
} from "../../../packages/feature-flags";

describe("Feature Flags", () => {
  let featureFlagManager: FeatureFlagManager;
  let mockConfig: FeatureFlagConfig;
  let mockUserContext: UserContext;

  beforeEach(() => {
    mockConfig = {
      provider: "database",
      environment: "development",
      databaseUrl: "postgres://test:test@localhost:5432/test",
      enableAnalytics: false,
      cacheTimeout: 60,
    };

    mockUserContext = {
      id: "test-user-123",
      email: "test@example.com",
      role: "user",
      plan: "free",
      customAttributes: {},
    };
  });

  afterEach(async () => {
    if (featureFlagManager) {
      // In test env DatabaseFeatureFlagProvider uses a no-op pool
      await featureFlagManager.destroy();
    }
  });

  describe("FeatureFlagManager", () => {
    it("should create a database provider by default", () => {
      featureFlagManager = new FeatureFlagManager(mockConfig);
      expect(featureFlagManager).toBeDefined();
    });

    it("should create a GrowthBook provider when specified", () => {
      const growthbookConfig: FeatureFlagConfig = {
        ...mockConfig,
        provider: "growthbook",
        growthbookClientKey: "test-key",
      };

      featureFlagManager = new FeatureFlagManager(growthbookConfig);
      expect(featureFlagManager).toBeDefined();
    });

    it("should throw error when database URL is missing for database provider", () => {
      const configWithoutDb = { ...mockConfig, databaseUrl: undefined };

      expect(() => {
        new FeatureFlagManager(configWithoutDb);
      }).toThrow("Database URL is required when using database provider");
    });

    it("should throw error when GrowthBook key is missing for GrowthBook provider", () => {
      const configWithoutKey: FeatureFlagConfig = {
        ...mockConfig,
        provider: "growthbook",
        growthbookClientKey: undefined,
      };

      expect(() => {
        new FeatureFlagManager(configWithoutKey);
      }).toThrow(
        "GrowthBook client key is required when using GrowthBook provider"
      );
    });
  });

  describe("Utility Methods", () => {
    beforeEach(() => {
      featureFlagManager = new FeatureFlagManager(mockConfig);
    });

    it("should create user context correctly", async () => {
      const userContext = await featureFlagManager.createUserContext(
        "user-123",
        {
          email: "user@example.com",
          role: "admin",
          customAttributes: { premium: true },
        }
      );

      expect(userContext).toEqual({
        id: "user-123",
        email: "user@example.com",
        role: "admin",
        plan: undefined,
        country: undefined,
        customAttributes: { premium: true },
      });
    });
  });

  describe("Feature Flag Constants", () => {
    it("should have predefined feature flags", () => {
      expect(FEATURE_FLAGS.NEW_CHAT_UI).toBe("new-chat-ui");
      expect(FEATURE_FLAGS.AI_STREAMING).toBe("ai-streaming");
      expect(FEATURE_FLAGS.PREMIUM_MODELS).toBe("premium-models");
      expect(FEATURE_FLAGS.FILE_UPLOAD).toBe("file-upload");
      expect(FEATURE_FLAGS.REALTIME_COLLABORATION).toBe(
        "realtime-collaboration"
      );
    });
  });
});

// Integration tests (would require actual database)
describe("Feature Flags Integration", () => {
  it.skip("should evaluate feature flags against database", async () => {
    // This would require a test database setup
    // Implementation would test actual database queries
  });

  it.skip("should cache feature flag results", async () => {
    // Test caching mechanism
  });

  it.skip("should track analytics events", async () => {
    // Test analytics tracking
  });
});
