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
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { useFeatureFlag, useFeatureFlags } from '../../packages/frontend/src/hooks/useFeatureFlags';
import { FeatureFlag, ConditionalFeature } from '../../packages/frontend/src/components/FeatureFlag';

// Mock fetch globally
global.fetch = vi.fn();

// Test Components
const TestComponent = ({ userId }: { userId: string }) => {
  const { isEnabled, loading, track } = useFeatureFlag('new-chat-ui', { userId });
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <div data-testid="feature-status">
        {isEnabled ? 'Feature Enabled' : 'Feature Disabled'}
      </div>
      <button onClick={() => track({ action: 'clicked' })}>
        Track Usage
      </button>
    </div>
  );
};

const AllFeaturesComponent = ({ userId }: { userId: string }) => {
  const { featureFlags, loading, isFeatureEnabled } = useFeatureFlags({ userId });
  
  if (loading) return <div>Loading all features...</div>;
  
  return (
    <div>
      <div data-testid="feature-count">
        Features: {Object.keys(featureFlags).length}
      </div>
      <div data-testid="new-chat-ui">
        New Chat UI: {isFeatureEnabled('new-chat-ui') ? 'Yes' : 'No'}
      </div>
      <div data-testid="premium-models">
        Premium Models: {isFeatureEnabled('premium-models') ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

describe('Feature Flags Frontend Integration', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockFetch = fetch as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useFeatureFlag Hook', () => {
    it('should fetch and display single feature flag', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'new-chat-ui',
          isEnabled: true,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      render(<TestComponent userId={mockUserId} />);

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for API call and state update
      await waitFor(() => {
        expect(screen.getByTestId('feature-status')).toHaveTextContent('Feature Enabled');
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/feature-flags/new-chat-ui?userId=' + mockUserId)
      );
    });

    it('should handle feature flag disabled state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'new-chat-ui',
          isEnabled: false,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      render(<TestComponent userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('feature-status')).toHaveTextContent('Feature Disabled');
      });
    });

    it('should track feature usage', async () => {
      // Mock feature flag response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'new-chat-ui',
          isEnabled: true,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      // Mock tracking response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          timestamp: new Date().toISOString()
        })
      });

      render(<TestComponent userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('feature-status')).toHaveTextContent('Feature Enabled');
      });

      // Click track button
      const trackButton = screen.getByText('Track Usage');
      await userEvent.click(trackButton);

      // Verify tracking API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/feature-flags/track',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('new-chat-ui')
          })
        );
      });
    });
  });

  describe('useFeatureFlags Hook', () => {
    it('should fetch and display all feature flags', async () => {
      const mockFeatureFlags = {
        'new-chat-ui': true,
        'premium-models': false,
        'file-upload': true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: mockUserId,
          features: mockFeatureFlags,
          timestamp: new Date().toISOString()
        })
      });

      render(<AllFeaturesComponent userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('feature-count')).toHaveTextContent('Features: 3');
        expect(screen.getByTestId('new-chat-ui')).toHaveTextContent('New Chat UI: Yes');
        expect(screen.getByTestId('premium-models')).toHaveTextContent('Premium Models: No');
      });

      // Verify API was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/feature-flags?userId=' + mockUserId)
      );
    });
  });

  describe('FeatureFlag Component', () => {
    it('should conditionally render content based on feature flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'new-chat-ui',
          isEnabled: true,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      render(
        <FeatureFlag 
          flag="new-chat-ui" 
          userId={mockUserId}
          fallback={<div>Old UI</div>}
        >
          <div>New UI</div>
        </FeatureFlag>
      );

      await waitFor(() => {
        expect(screen.getByText('New UI')).toBeInTheDocument();
        expect(screen.queryByText('Old UI')).not.toBeInTheDocument();
      });
    });

    it('should show fallback when feature is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'new-chat-ui',
          isEnabled: false,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      render(
        <FeatureFlag 
          flag="new-chat-ui" 
          userId={mockUserId}
          fallback={<div>Old UI</div>}
        >
          <div>New UI</div>
        </FeatureFlag>
      );

      await waitFor(() => {
        expect(screen.getByText('Old UI')).toBeInTheDocument();
        expect(screen.queryByText('New UI')).not.toBeInTheDocument();
      });
    });
  });

  describe('ConditionalFeature Component', () => {
    it('should render correct content based on feature state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'premium-models',
          isEnabled: true,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      render(
        <ConditionalFeature
          flag="premium-models"
          userId={mockUserId}
          enabled={<div>Premium Features Available</div>}
          disabled={<div>Upgrade to Premium</div>}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Features Available')).toBeInTheDocument();
        expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<TestComponent userId={mockUserId} />);

      // Should eventually show disabled state (fallback)
      await waitFor(() => {
        expect(screen.getByTestId('feature-status')).toHaveTextContent('Feature Disabled');
      });
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      render(<TestComponent userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('feature-status')).toHaveTextContent('Feature Disabled');
      });
    });
  });

  describe('Real Data Flow Simulation', () => {
    it('should simulate complete user interaction flow', async () => {
      console.log('🎯 Simulating Frontend Data Flow...');

      // Step 1: Initial load - fetch all features
      const mockAllFeatures = {
        'new-chat-ui': true,
        'premium-models': true,
        'file-upload': false,
        'realtime-collaboration': true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: mockUserId,
          features: mockAllFeatures,
          timestamp: new Date().toISOString()
        })
      });

      const { rerender } = render(<AllFeaturesComponent userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('feature-count')).toHaveTextContent('Features: 4');
      });

      console.log('✅ Step 1: All features loaded');

      // Step 2: Check specific feature
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          flagName: 'new-chat-ui',
          isEnabled: true,
          userId: mockUserId,
          timestamp: new Date().toISOString()
        })
      });

      rerender(<TestComponent userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('feature-status')).toHaveTextContent('Feature Enabled');
      });

      console.log('✅ Step 2: Specific feature checked');

      // Step 3: Track usage
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          timestamp: new Date().toISOString()
        })
      });

      const trackButton = screen.getByText('Track Usage');
      await userEvent.click(trackButton);

      console.log('✅ Step 3: Usage tracked');

      // Verify all API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(3);
      console.log('✅ Complete frontend data flow simulation successful!');
    });
  });
});
