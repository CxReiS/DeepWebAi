// DeepWebAI Flag Demo Component
// GrowthBook "DeepWebAi-Flag" feature flag'ini test etmek için demo bileşeni

import React, { useState, useEffect } from 'react';
import { useDeepWebAIFlag, DeepWebAIFlagIndicator, WithDeepWebAIFlag } from '../hooks/useDeepWebAIFlag';

export const DeepWebAIFlagDemo: React.FC = () => {
  const {
    isEnabled,
    isLoading,
    error,
    features,
    checkFlagStatus,
    getDashboard,
    accessPremiumFeatures,
    sendPremiumChat,
    sendFeedback,
    getAnalytics,
    canAccessPremium
  } = useDeepWebAIFlag();

  const [dashboard, setDashboard] = useState<any>(null);
  const [premiumFeatures, setPremiumFeatures] = useState<any>(null);
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('Hello, what are the premium features?');
  const [feedback, setFeedback] = useState({ feature: 'premium-chat', rating: 5, comment: 'Great feature!' });

  // Component mount'ta flag durumunu kontrol et
  useEffect(() => {
    checkFlagStatus();
  }, [checkFlagStatus]);

  // Dashboard verilerini yükle
  const loadDashboard = async () => {
    try {
      const dashboardData = await getDashboard();
      setDashboard(dashboardData);
      console.log('📊 Dashboard loaded:', dashboardData);
    } catch (error) {
      console.error('Dashboard error:', error);
    }
  };

  // Premium özellikleri yükle
  const loadPremiumFeatures = async () => {
    try {
      const premiumData = await accessPremiumFeatures();
      setPremiumFeatures(premiumData);
      console.log('🎉 Premium features loaded:', premiumData);
    } catch (error) {
      console.error('Premium features error:', error);
    }
  };

  // Premium chat test et
  const testPremiumChat = async () => {
    try {
      const response = await sendPremiumChat(chatMessage, 'gpt-4-turbo', {
        temperature: 0.7,
        maxTokens: 1000,
        useAdvancedFeatures: true
      });
      setChatResponse(response);
      console.log('🤖 Premium chat response:', response);
    } catch (error) {
      console.error('Premium chat error:', error);
    }
  };

  // Analytics yükle
  const loadAnalytics = async () => {
    try {
      const analyticsData = await getAnalytics('7d');
      setAnalytics(analyticsData);
      console.log('📈 Analytics loaded:', analyticsData);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  // Feedback gönder
  const submitFeedback = async () => {
    try {
      const result = await sendFeedback(
        feedback.feature,
        feedback.rating,
        feedback.comment,
        'improvement'
      );
      console.log('💬 Feedback sent:', result);
      alert('Feedback sent successfully!');
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 DeepWebAI Flag Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Bu demo GrowthBook'taki "DeepWebAi-Flag" feature flag'ini test eder.
        </p>
        
        {/* Flag Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Flag Status</h2>
          <DeepWebAIFlagIndicator />
          
          {isLoading && (
            <div className="mt-2 text-blue-500">🔄 Loading flag status...</div>
          )}
          
          {error && (
            <div className="mt-2 text-red-500">❌ Error: {error}</div>
          )}
          
          {features && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Available Features:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Advanced AI: {features.advancedAI ? '✅' : '❌'}</div>
                <div>Premium Models: {features.premiumModels ? '✅' : '❌'}</div>
                <div>Real-time Collaboration: {features.realTimeCollaboration ? '✅' : '❌'}</div>
                <div>Advanced Analytics: {features.advancedAnalytics ? '✅' : '❌'}</div>
                <div>Priority Support: {features.prioritySupport ? '✅' : '❌'}</div>
                <div>Custom Branding: {features.customBranding ? '✅' : '❌'}</div>
              </div>
            </div>
          )}
          
          <button
            onClick={checkFlagStatus}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Refresh Flag Status
          </button>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Dashboard Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📊 Dashboard Test</h3>
            <button
              onClick={loadDashboard}
              className="mb-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Load Dashboard
            </button>
            {dashboard && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <div><strong>Type:</strong> {dashboard.type}</div>
                <div><strong>Features:</strong> {dashboard.features.length}</div>
                <div><strong>Message:</strong> {dashboard.message}</div>
                {dashboard.specialFeatures && (
                  <div className="mt-2">
                    <strong>Special Features:</strong>
                    <ul className="list-disc list-inside">
                      <li>AI Models: {dashboard.specialFeatures.aiModels?.join(', ')}</li>
                      <li>Collaboration: {dashboard.specialFeatures.collaboration ? 'Yes' : 'No'}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Premium Features Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">🎉 Premium Features</h3>
            <WithDeepWebAIFlag
              fallback={<div className="text-gray-500">Premium features not available</div>}
            >
              <button
                onClick={loadPremiumFeatures}
                className="mb-3 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={!canAccessPremium}
              >
                Access Premium Features
              </button>
              {premiumFeatures && (
                <div className="mt-3 p-3 bg-purple-50 rounded text-sm">
                  <div><strong>Message:</strong> {premiumFeatures.message}</div>
                  <div className="mt-2">
                    <strong>AI Models:</strong> {premiumFeatures.features?.advancedAI?.models?.join(', ')}
                  </div>
                </div>
              )}
            </WithDeepWebAIFlag>
          </div>

          {/* Premium Chat Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">🤖 Premium Chat</h3>
            <WithDeepWebAIFlag
              fallback={<div className="text-gray-500">Premium chat not available</div>}
            >
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="w-full p-2 border rounded mb-3"
                rows={3}
                placeholder="Enter your message..."
              />
              <button
                onClick={testPremiumChat}
                className="mb-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!canAccessPremium}
              >
                Send Premium Chat
              </button>
              {chatResponse && (
                <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                  <div><strong>Model:</strong> {chatResponse.model}</div>
                  <div><strong>Response:</strong> {chatResponse.response}</div>
                  <div><strong>Cost:</strong> ${chatResponse.usage?.cost}</div>
                </div>
              )}
            </WithDeepWebAIFlag>
          </div>

          {/* Analytics Test */}
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📈 Analytics</h3>
            <WithDeepWebAIFlag
              fallback={<div className="text-gray-500">Analytics not available</div>}
            >
              <button
                onClick={loadAnalytics}
                className="mb-3 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                disabled={!canAccessPremium}
              >
                Load Analytics
              </button>
              {analytics && (
                <div className="mt-3 p-3 bg-orange-50 rounded text-sm">
                  <div><strong>Total Queries:</strong> {analytics.overview?.totalQueries}</div>
                  <div><strong>Tokens Used:</strong> {analytics.overview?.tokensUsed}</div>
                  <div><strong>Cost Savings:</strong> ${analytics.overview?.costSavings}</div>
                </div>
              )}
            </WithDeepWebAIFlag>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-8 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">💬 Feature Feedback</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={feedback.feature}
              onChange={(e) => setFeedback(prev => ({ ...prev, feature: e.target.value }))}
              className="p-2 border rounded"
              placeholder="Feature name"
            />
            <select
              value={feedback.rating}
              onChange={(e) => setFeedback(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
              className="p-2 border rounded"
            >
              <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
              <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
              <option value={3}>⭐⭐⭐ (3 stars)</option>
              <option value={2}>⭐⭐ (2 stars)</option>
              <option value={1}>⭐ (1 star)</option>
            </select>
            <textarea
              value={feedback.comment}
              onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              className="p-2 border rounded"
              placeholder="Your feedback..."
            />
          </div>
          <button
            onClick={submitFeedback}
            className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Send Feedback
          </button>
        </div>

        {/* Console Log Section */}
        <div className="mt-8 p-4 bg-gray-900 text-green-400 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📝 Console Output</h3>
          <div className="text-sm font-mono">
            Check browser console for detailed logs and responses.
            <br />
            All API calls and responses are logged for debugging.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepWebAIFlagDemo;
