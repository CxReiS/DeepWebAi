import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../../utils/analytics.js';

interface AnalyticsMetrics {
  totalPageViews: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  conversionRate: number;
  errors: number;
}

interface Provider {
  name: string;
  enabled: boolean;
  status: 'healthy' | 'error' | 'warning';
}

export function AnalyticsDashboard() {
  const { trackFeatureAccess } = useAnalytics();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackFeatureAccess('analytics_dashboard');
    fetchAnalyticsData();
  }, [trackFeatureAccess]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics health status
      const healthResponse = await fetch('/api/analytics/health');
      if (!healthResponse.ok) throw new Error('Failed to fetch analytics health');
      
      const healthData = await healthResponse.json();
      
      // Transform providers data
      const providersData: Provider[] = [
        {
          name: 'Vercel Analytics',
          enabled: healthData.providers.vercel,
          status: healthData.providers.vercel ? 'healthy' : 'warning'
        },
        {
          name: 'Plausible Analytics',
          enabled: healthData.providers.plausible,
          status: healthData.providers.plausible ? 'healthy' : 'warning'
        },
        {
          name: 'Google Analytics',
          enabled: healthData.providers.googleAnalytics,
          status: healthData.providers.googleAnalytics ? 'healthy' : 'warning'
        },
        {
          name: 'Mixpanel',
          enabled: healthData.providers.mixpanel,
          status: healthData.providers.mixpanel ? 'healthy' : 'warning'
        }
      ];
      
      setProviders(providersData);
      
      // Mock metrics data (replace with real analytics API)
      const mockMetrics: AnalyticsMetrics = {
        totalPageViews: 12543,
        uniqueUsers: 1876,
        averageSessionDuration: 245,
        topPages: [
          { path: '/', views: 4521 },
          { path: '/chat', views: 3876 },
          { path: '/dashboard', views: 2187 },
          { path: '/settings', views: 987 },
          { path: '/docs', views: 672 }
        ],
        conversionRate: 3.2,
        errors: 23
      };
      
      setMetrics(mockMetrics);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    try {
      await fetch('/api/analytics/flush', { method: 'POST' });
      await fetchAnalyticsData();
    } catch (err) {
      setError('Failed to refresh analytics');
    }
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-state">
          <h3>Analytics Error</h3>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>Analytics Dashboard</h2>
        <button onClick={refreshAnalytics} className="refresh-button">
          Refresh Data
        </button>
      </div>

      {/* Provider Status */}
      <div className="providers-section">
        <h3>Analytics Providers</h3>
        <div className="providers-grid">
          {providers.map((provider) => (
            <div key={provider.name} className={`provider-card ${provider.status}`}>
              <h4>{provider.name}</h4>
              <div className="status-indicator">
                <span className={`status-dot ${provider.status}`}></span>
                <span className="status-text">
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="metrics-section">
          <h3>Key Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Total Page Views</h4>
              <p className="metric-value">{metrics.totalPageViews.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <h4>Unique Users</h4>
              <p className="metric-value">{metrics.uniqueUsers.toLocaleString()}</p>
            </div>
            <div className="metric-card">
              <h4>Avg. Session Duration</h4>
              <p className="metric-value">{Math.floor(metrics.averageSessionDuration / 60)}m {metrics.averageSessionDuration % 60}s</p>
            </div>
            <div className="metric-card">
              <h4>Conversion Rate</h4>
              <p className="metric-value">{metrics.conversionRate}%</p>
            </div>
            <div className="metric-card">
              <h4>Errors</h4>
              <p className="metric-value error">{metrics.errors}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Pages */}
      {metrics && (
        <div className="top-pages-section">
          <h3>Top Pages</h3>
          <div className="pages-list">
            {metrics.topPages.map((page, index) => (
              <div key={page.path} className="page-item">
                <span className="rank">#{index + 1}</span>
                <span className="path">{page.path}</span>
                <span className="views">{page.views.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .analytics-dashboard {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #1a1a1a;
        }

        .refresh-button, .retry-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .refresh-button:hover, .retry-button:hover {
          background: #0056b3;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state {
          text-align: center;
          padding: 48px 24px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .error-state h3 {
          color: #dc3545;
          margin-bottom: 16px;
        }

        .providers-section, .metrics-section, .top-pages-section {
          margin-bottom: 32px;
        }

        .providers-section h3, .metrics-section h3, .top-pages-section h3 {
          margin-bottom: 16px;
          color: #1a1a1a;
        }

        .providers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .provider-card {
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          background: white;
        }

        .provider-card.healthy {
          border-color: #28a745;
          background: #f8fff8;
        }

        .provider-card.warning {
          border-color: #ffc107;
          background: #fffef7;
        }

        .provider-card h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.healthy {
          background: #28a745;
        }

        .status-dot.warning {
          background: #ffc107;
        }

        .status-dot.error {
          background: #dc3545;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric-card {
          padding: 20px;
          background: white;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          text-align: center;
        }

        .metric-card h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          color: #1a1a1a;
        }

        .metric-value.error {
          color: #dc3545;
        }

        .pages-list {
          background: white;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          overflow: hidden;
        }

        .page-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f3f4;
        }

        .page-item:last-child {
          border-bottom: none;
        }

        .rank {
          font-weight: bold;
          color: #6c757d;
          margin-right: 16px;
          width: 24px;
        }

        .path {
          flex: 1;
          font-family: monospace;
          color: #1a1a1a;
        }

        .views {
          color: #6c757d;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default AnalyticsDashboard;
