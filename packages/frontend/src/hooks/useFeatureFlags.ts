import { useState, useEffect, useCallback } from 'react';
import { atom, useAtom } from 'jotai';

// Feature flags state
const featureFlagsAtom = atom<Record<string, boolean>>({});
const loadingAtom = atom<boolean>(false);
const errorAtom = atom<Error | null>(null);

interface UseFeatureFlagsOptions {
  userId?: string;
  userAttributes?: Record<string, any>;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useFeatureFlags = (options: UseFeatureFlagsOptions = {}) => {
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);

  const {
    userId,
    userAttributes = {},
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const fetchFeatureFlags = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId,
        ...userAttributes
      });

      const response = await fetch(`/api/feature-flags?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
      }

      const data = await response.json();
      setFeatureFlags(data.features || {});
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userAttributes, setFeatureFlags, setLoading, setError]);

  const checkFeatureFlag = useCallback(async (flagName: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const params = new URLSearchParams({
        userId,
        ...userAttributes
      });

      const response = await fetch(`/api/feature-flags/${flagName}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check feature flag: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update local state
      setFeatureFlags(prev => ({
        ...prev,
        [flagName]: data.isEnabled
      }));

      return data.isEnabled;
    } catch (err) {
      console.error(`Error checking feature flag ${flagName}:`, err);
      return false;
    }
  }, [userId, userAttributes, setFeatureFlags]);

  const trackFeatureEvent = useCallback(async (
    eventName: string,
    properties?: Record<string, any>
  ) => {
    if (!userId) return;

    try {
      await fetch('/api/feature-flags/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          userId,
          properties
        })
      });
    } catch (err) {
      console.error(`Error tracking feature event ${eventName}:`, err);
    }
  }, [userId]);

  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    return featureFlags[flagName] || false;
  }, [featureFlags]);

  const getFeatureValue = useCallback(<T,>(
    flagName: string,
    defaultValue: T
  ): T => {
    const value = featureFlags[flagName];
    return value !== undefined ? value as T : defaultValue;
  }, [featureFlags]);

  // Auto-refresh effect
  useEffect(() => {
    if (userId) {
      fetchFeatureFlags();
    }
  }, [userId, fetchFeatureFlags]);

  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(fetchFeatureFlags, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, userId, refreshInterval, fetchFeatureFlags]);

  return {
    featureFlags,
    loading,
    error,
    isFeatureEnabled,
    getFeatureValue,
    checkFeatureFlag,
    trackFeatureEvent,
    refetch: fetchFeatureFlags
  };
};

// Hook for checking a specific feature flag
export const useFeatureFlag = (flagName: string, options: UseFeatureFlagsOptions = {}) => {
  const { isFeatureEnabled, checkFeatureFlag, trackFeatureEvent, loading, error } = useFeatureFlags(options);
  
  const isEnabled = isFeatureEnabled(flagName);

  const track = useCallback((properties?: Record<string, any>) => {
    trackFeatureEvent(`feature_${flagName}_used`, properties);
  }, [flagName, trackFeatureEvent]);

  return {
    isEnabled,
    loading,
    error,
    track,
    refresh: () => checkFeatureFlag(flagName)
  };
};

// Predefined feature flag hooks
export const useNewChatUI = (options?: UseFeatureFlagsOptions) => 
  useFeatureFlag('new-chat-ui', options);

export const useAIStreaming = (options?: UseFeatureFlagsOptions) => 
  useFeatureFlag('ai-streaming', options);

export const usePremiumModels = (options?: UseFeatureFlagsOptions) => 
  useFeatureFlag('premium-models', options);

export const useFileUpload = (options?: UseFeatureFlagsOptions) => 
  useFeatureFlag('file-upload', options);

export const useRealtimeCollaboration = (options?: UseFeatureFlagsOptions) => 
  useFeatureFlag('realtime-collaboration', options);
