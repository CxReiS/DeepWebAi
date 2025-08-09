// DeepWebAI Flag Hook
// GrowthBook "DeepWebAi-Flag" feature flag'ini React'te kullanmak için

import { useState, useEffect, useCallback } from 'react';
import { useFeatureFlag } from './useFeatureFlag';

interface DeepWebAIFlagState {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  flagValue: any;
  features: DeepWebAIFeatures | null;
}

interface DeepWebAIFeatures {
  advancedAI: boolean;
  premiumModels: boolean;
  realTimeCollaboration: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export const useDeepWebAIFlag = () => {
  const [state, setState] = useState<DeepWebAIFlagState>({
    isEnabled: false,
    isLoading: true,
    error: null,
    flagValue: null,
    features: null
  });

  // Temel feature flag hook'unu kullan
  const { 
    isEnabled: baseFlagEnabled, 
    isLoading: baseFlagLoading, 
    error: baseFlagError,
    value: baseFlagValue 
  } = useFeatureFlag('DeepWebAi-Flag');

  // Flag durumunu güncelle
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isEnabled: baseFlagEnabled,
      isLoading: baseFlagLoading,
      error: baseFlagError,
      flagValue: baseFlagValue,
      features: baseFlagEnabled ? getDeepWebAIFeatures() : null
    }));
  }, [baseFlagEnabled, baseFlagLoading, baseFlagError, baseFlagValue]);

  // DeepWebAI özelliklerini al
  const getDeepWebAIFeatures = useCallback((): DeepWebAIFeatures => {
    return {
      advancedAI: true,
      premiumModels: true,
      realTimeCollaboration: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: true
    };
  }, []);

  // API'den flag durumunu kontrol et
  const checkFlagStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/deepwebai/status', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isEnabled: data.flagEnabled,
        flagValue: data.flagValue,
        features: data.flagEnabled ? getDeepWebAIFeatures() : null,
        isLoading: false
      }));

      if (data.flagEnabled) {
        console.log('✅ DeepWebAI Flag is enabled!', data);
      } else {
        console.log('⚫ DeepWebAI Flag is disabled', data);
      }

    } catch (error) {
      console.error('❌ Error checking DeepWebAI flag:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [getDeepWebAIFeatures]);

  // Dashboard verilerini al
  const getDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/deepwebai/dashboard', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
      }

      const data = await response.json();
      return data.dashboard;

    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
      throw error;
    }
  }, []);

  // Premium özellikler erişimi
  const accessPremiumFeatures = useCallback(async () => {
    if (!state.isEnabled) {
      throw new Error('DeepWebAI flag is not enabled');
    }

    try {
      const response = await fetch('/api/deepwebai/premium-features', {
        credentials: 'include'
      });

      if (response.status === 403) {
        throw new Error('Premium features not available');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Error accessing premium features:', error);
      throw error;
    }
  }, [state.isEnabled]);

  // Premium AI Chat
  const sendPremiumChat = useCallback(async (
    message: string, 
    model: 'gpt-4-turbo' | 'claude-3-opus' | 'gemini-ultra' = 'gpt-4-turbo',
    options?: {
      temperature?: number;
      maxTokens?: number;
      useAdvancedFeatures?: boolean;
    }
  ) => {
    if (!state.isEnabled) {
      throw new Error('Premium chat requires DeepWebAI flag');
    }

    try {
      const response = await fetch('/api/deepwebai/premium-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          model,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Premium chat failed: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Premium chat error:', error);
      throw error;
    }
  }, [state.isEnabled]);

  // Feature feedback gönder
  const sendFeedback = useCallback(async (
    feature: string,
    rating: number,
    comment?: string,
    category?: 'bug' | 'improvement' | 'new-feature'
  ) => {
    try {
      const response = await fetch('/api/deepwebai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          feature,
          rating,
          comment,
          category
        })
      });

      if (!response.ok) {
        throw new Error(`Feedback failed: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Feedback error:', error);
      throw error;
    }
  }, []);

  // Analytics verileri al
  const getAnalytics = useCallback(async (timeRange: string = '7d') => {
    if (!state.isEnabled) {
      throw new Error('Analytics requires DeepWebAI flag');
    }

    try {
      const response = await fetch(`/api/deepwebai/premium-analytics?timeRange=${timeRange}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Analytics failed: ${response.status}`);
      }

      const data = await response.json();
      return data.analytics;

    } catch (error) {
      console.error('❌ Analytics error:', error);
      throw error;
    }
  }, [state.isEnabled]);

  return {
    // State
    isEnabled: state.isEnabled,
    isLoading: state.isLoading,
    error: state.error,
    flagValue: state.flagValue,
    features: state.features,

    // Actions
    checkFlagStatus,
    getDashboard,
    accessPremiumFeatures,
    sendPremiumChat,
    sendFeedback,
    getAnalytics,

    // Helper booleans
    canAccessPremium: state.isEnabled && !state.isLoading && !state.error,
    hasAdvancedAI: state.features?.advancedAI || false,
    hasPremiumModels: state.features?.premiumModels || false,
    hasRealTimeCollab: state.features?.realTimeCollaboration || false,
    hasAdvancedAnalytics: state.features?.advancedAnalytics || false
  };
};

// React component için flag durumu gösterici
export const DeepWebAIFlagIndicator = () => {
  const { isEnabled, isLoading, error } = useDeepWebAIFlag();

  if (isLoading) {
    return <div className="text-yellow-500">🔄 Checking DeepWebAI features...</div>;
  }

  if (error) {
    return <div className="text-red-500">❌ Error: {error}</div>;
  }

  return (
    <div className={`flex items-center gap-2 ${isEnabled ? 'text-green-500' : 'text-gray-500'}`}>
      <span>{isEnabled ? '✅' : '⚫'}</span>
      <span>DeepWebAI Features: {isEnabled ? 'Enabled' : 'Disabled'}</span>
    </div>
  );
};

// Conditional rendering component
export const WithDeepWebAIFlag = ({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { isEnabled, isLoading } = useDeepWebAIFlag();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback || null}</>;
};
