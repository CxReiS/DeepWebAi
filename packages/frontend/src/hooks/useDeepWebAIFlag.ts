// DeepWebAI Flag Hook - GrowthBook feature flag icin React hook

import React, { useState, useEffect, useCallback } from "react";
import { useFeatureFlag } from "./useFeatureFlags";

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
    features: null,
  });

  // Temel feature flag hook kullan
  const {
    isEnabled: baseFlagEnabled,
    isLoading: baseFlagLoading,
    error: baseFlagError,
    value: baseFlagValue,
  } = useFeatureFlag("DeepWebAi-Flag");

  // Flag durumunu guncelle
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isEnabled: baseFlagEnabled,
      isLoading: baseFlagLoading,
      error: baseFlagError,
      flagValue: baseFlagValue,
      features: baseFlagEnabled ? getDeepWebAIFeatures() : null,
    }));
  }, [baseFlagEnabled, baseFlagLoading, baseFlagError, baseFlagValue]);

  // DeepWebAI ozelliklerini al
  const getDeepWebAIFeatures = useCallback((): DeepWebAIFeatures => {
    return {
      advancedAI: true,
      premiumModels: true,
      realTimeCollaboration: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customBranding: true,
    };
  }, []);

  return {
    isEnabled: state.isEnabled,
    isLoading: state.isLoading,
    error: state.error,
    flagValue: state.flagValue,
    features: state.features,
  };
};

// React component icin flag durumu gosterici
export const DeepWebAIFlagIndicator = () => {
  const { isEnabled, isLoading, error } = useDeepWebAIFlag();

  if (isLoading) {
    return React.createElement(
      "div",
      { className: "text-yellow-500" },
      "Loading..."
    );
  }

  if (error) {
    return React.createElement(
      "div",
      { className: "text-red-500" },
      "Error: " + error
    );
  }

  return React.createElement(
    "div",
    {
      className: `flex items-center gap-2 ${
        isEnabled ? "text-green-500" : "text-gray-500"
      }`,
    },
    React.createElement("span", null, isEnabled ? "ON" : "OFF"),
    React.createElement(
      "span",
      null,
      `DeepWebAI Features: ${isEnabled ? "Enabled" : "Disabled"}`
    )
  );
};
