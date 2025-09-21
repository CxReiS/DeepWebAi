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

import React from 'react';
import { useFeatureFlag } from '../hooks/useFeatureFlags';

interface FeatureFlagProps {
  flag: string;
  userId?: string;
  userAttributes?: Record<string, any>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  onEnabled?: () => void;
  onDisabled?: () => void;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  userId,
  userAttributes,
  fallback = null,
  children,
  onEnabled,
  onDisabled
}) => {
  const { isEnabled, loading, track } = useFeatureFlag(flag, {
    userId,
    userAttributes
  });

  React.useEffect(() => {
    if (!loading) {
      if (isEnabled) {
        onEnabled?.();
        track(); // Track that the feature was shown
      } else {
        onDisabled?.();
      }
    }
  }, [isEnabled, loading, onEnabled, onDisabled, track]);

  if (loading) {
    return <>{fallback}</>;
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// Wrapper component for conditional rendering based on feature flags
interface ConditionalFeatureProps {
  flag: string;
  userId?: string;
  userAttributes?: Record<string, any>;
  enabled?: React.ReactNode;
  disabled?: React.ReactNode;
}

export const ConditionalFeature: React.FC<ConditionalFeatureProps> = ({
  flag,
  userId,
  userAttributes,
  enabled = null,
  disabled = null
}) => {
  const { isEnabled, loading } = useFeatureFlag(flag, {
    userId,
    userAttributes
  });

  if (loading) {
    return <>{disabled}</>;
  }

  return isEnabled ? <>{enabled}</> : <>{disabled}</>;
};

// HOC for feature flag wrapping
export function withFeatureFlag<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flagName: string,
  fallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P & {
    userId?: string;
    userAttributes?: Record<string, any>;
  }) {
    const { userId, userAttributes, ...componentProps } = props;
    const { isEnabled, loading } = useFeatureFlag(flagName, {
      userId,
      userAttributes
    });

    if (loading || !isEnabled) {
      // JSX'te bileşen ismi büyük harfle başlamalıdır; runtime'da değişkene atayıp kullanıyoruz.
      // In JSX, component names must start with uppercase; assign to a variable first.
      const Fallback = fallbackComponent;
      return Fallback ? <Fallback {...(componentProps as P)} /> : null;
    }

    return <WrappedComponent {...(componentProps as P)} />;
  };
}

// Example usage components
export const NewChatUIFeature: React.FC<{
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ userId, children, fallback }) => (
  <FeatureFlag
    flag="new-chat-ui"
    userId={userId}
    fallback={fallback}
  >
    {children}
  </FeatureFlag>
);

export const PremiumModelsFeature: React.FC<{
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ userId, children, fallback }) => (
  <FeatureFlag
    flag="premium-models"
    userId={userId}
    fallback={fallback}
  >
    {children}
  </FeatureFlag>
);

export const FileUploadFeature: React.FC<{
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ userId, children, fallback }) => (
  <FeatureFlag
    flag="file-upload"
    userId={userId}
    fallback={fallback}
  >
    {children}
  </FeatureFlag>
);
