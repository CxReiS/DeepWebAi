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

declare class FeatureFlagService {
    private manager;
    initialize(): Promise<void>;
    isFeatureEnabled(flagName: string, userId: string, userAttributes?: any): Promise<boolean>;
    getAllFeatures(userId: string, userAttributes?: any): Promise<Record<string, boolean>>;
    getFeatureValue<T>(flagName: string, userId: string, defaultValue: T, userAttributes?: any): Promise<T>;
    trackFeatureEvent(eventName: string, userId: string, properties?: Record<string, any>): Promise<void>;
    canUseNewChatUI(userId: string, userAttributes?: any): Promise<boolean>;
    canUseAIStreaming(userId: string, userAttributes?: any): Promise<boolean>;
    canUsePremiumModels(userId: string, userAttributes?: any): Promise<boolean>;
    canUseFileUpload(userId: string, userAttributes?: any): Promise<boolean>;
    canUseRealtimeCollaboration(userId: string, userAttributes?: any): Promise<boolean>;
    destroy(): Promise<void>;
}
export declare const featureFlagService: FeatureFlagService;
export {};
