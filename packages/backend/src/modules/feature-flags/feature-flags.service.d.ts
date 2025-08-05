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
