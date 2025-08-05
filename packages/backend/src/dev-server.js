#!/usr/bin/env node

/**
 * Simple Development Server for DeepWebAI
 * Runs without database, only with GrowthBook flag testing
 */

import { createServer } from 'http';
import { URL } from 'url';

// Simple request parser
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// Simple router
const routes = new Map();

function addRoute(method, path, handler) {
  routes.set(`${method}:${path}`, handler);
}

function handleRequest(req, res, url, body) {
  const key = `${req.method}:${url.pathname}`;
  
  // Try exact match first
  if (routes.has(key)) {
    return routes.get(key)(req, res, url, body);
  }
  
  // Try pattern match for params
  for (const [routeKey, handler] of routes.entries()) {
    const [routeMethod, routePath] = routeKey.split(':');
    if (routeMethod === req.method && routePath.includes(':')) {
      const pathParts = url.pathname.split('/');
      const routeParts = routePath.split('/');
      
      if (pathParts.length === routeParts.length) {
        const params = {};
        let match = true;
        
        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(':')) {
            params[routeParts[i].slice(1)] = pathParts[i];
          } else if (routeParts[i] !== pathParts[i]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          req.params = params;
          return handler(req, res, url, body);
        }
      }
    }
  }
  
  // Default handler
  return routes.get('GET:*')(req, res, url, body);
}
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// CORS helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Role, X-User-Email');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// JSON response helper
function sendJson(res, data, status = 200) {
  setCorsHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Mock feature flag service
const mockFeatureFlags = {
  'DeepWebAi-Flag': true,
  'premium_models': true,
  'file_ocr': true,
  'real_time_chat': true,
  'advanced_analytics': false,
  'beta_features': true
};

// Health check
addRoute('GET', '/health', (req, res) => {
  sendJson(res, {
    status: 'ok',
    mode: 'development',
    timestamp: new Date().toISOString(),
    features: {
      database: 'mocked',
      featureFlags: 'mocked',
      fileProcessing: 'disabled',
      analytics: 'disabled'
    }
  });
});

// Mock auth
addRoute('GET', '/api/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] || 'dev-user-123';
  sendJson(res, {
    user: {
      id: userId,
      email: 'dev@deepwebai.com',
      username: 'devuser',
      displayName: 'Development User',
      role: 'user'
    }
  });
});

// Feature flags endpoints
addRoute('GET', '/api/feature-flags', (req, res, url) => {
  const userId = url.searchParams.get('userId') || 'dev-user-123';
  
  sendJson(res, {
    userId,
    features: mockFeatureFlags,
    timestamp: new Date().toISOString()
  });
});

addRoute('GET', '/api/feature-flags/:flagName', (req, res, url) => {
  const { flagName } = req.params;
  const userId = url.searchParams.get('userId') || 'dev-user-123';
  const isEnabled = mockFeatureFlags[flagName] || false;
  
  sendJson(res, {
    flagName,
    isEnabled,
    userId,
    timestamp: new Date().toISOString()
  });
});

// DeepWebAI Flag endpoints
addRoute('GET', '/api/deepwebai/status', (req, res, url) => {
  const userId = req.headers['x-user-id'] || url.searchParams.get('userId') || 'dev-user-123';
  const isEnabled = mockFeatureFlags['DeepWebAi-Flag'];
  
  sendJson(res, {
    flagEnabled: isEnabled,
    flagValue: isEnabled,
    user: userId,
    message: isEnabled 
      ? 'DeepWebAI advanced features are available!' 
      : 'DeepWebAI advanced features are not available',
    timestamp: new Date().toISOString()
  });
});

addRoute('GET', '/api/deepwebai/dashboard', (req, res, url) => {
  const userId = req.headers['x-user-id'] || url.searchParams.get('userId') || 'dev-user-123';
  const isEnabled = mockFeatureFlags['DeepWebAi-Flag'];
  
  const basicDashboard = {
    type: 'basic',
    features: ['chat', 'file-upload', 'basic-analytics'],
    message: 'Standard dashboard view'
  };

  const advancedDashboard = {
    type: 'advanced',
    features: ['chat', 'file-upload', 'basic-analytics', 'advanced-ai', 'premium-models', 'real-time-collaboration', 'advanced-analytics'],
    message: 'Advanced dashboard with premium features',
    specialFeatures: {
      aiModels: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
      collaboration: true,
      customBranding: true,
      prioritySupport: true
    }
  };
  
  sendJson(res, {
    user: userId,
    dashboard: isEnabled ? advancedDashboard : basicDashboard,
    flagEnabled: isEnabled,
    timestamp: new Date().toISOString()
  });
});

addRoute('GET', '/api/deepwebai/premium-features', (req, res, url) => {
  const userId = req.headers['x-user-id'] || url.searchParams.get('userId') || 'dev-user-123';
  const isEnabled = mockFeatureFlags['DeepWebAi-Flag'];
  
  if (!isEnabled) {
    return sendJson(res, {
      error: 'FEATURE_NOT_AVAILABLE',
      message: 'This feature is not available for your account',
      featureFlag: 'DeepWebAi-Flag'
    }, 403);
  }
  
  sendJson(res, {
    message: 'Welcome to DeepWebAI Premium Features! (Development)',
    features: {
      advancedAI: {
        models: ['gpt-4-turbo', 'claude-3-opus', 'gemini-ultra'],
        features: ['function-calling', 'code-interpreter', 'vision-analysis']
      },
      collaboration: {
        realTimeEditing: true,
        sharedWorkspaces: true,
        teamAnalytics: true
      },
      analytics: {
        detailedReports: true,
        customDashboards: true,
        exportOptions: ['pdf', 'csv', 'json']
      },
      support: {
        prioritySupport: true,
        dedicatedAccount: true,
        slaDuration: '4 hours'
      }
    },
    user: userId,
    timestamp: new Date().toISOString()
  });
});

addRoute('POST', '/api/deepwebai/premium-chat', (req, res, url, body) => {
  const userId = req.headers['x-user-id'] || url.searchParams.get('userId') || 'dev-user-123';
  const isEnabled = mockFeatureFlags['DeepWebAi-Flag'];
  
  if (!isEnabled) {
    return sendJson(res, {
      error: 'FEATURE_NOT_AVAILABLE',
      message: 'Premium chat requires DeepWebAI flag'
    }, 403);
  }
  
  const { message, model = 'gpt-4-turbo' } = body;
  
  sendJson(res, {
    response: `[DEV PREMIUM AI - ${model.toUpperCase()}] This is a development premium AI response to: "${(message || 'Hello').slice(0, 50)}${(message || 'Hello').length > 50 ? '...' : ''}"`,
    model,
    features: {
      enhancedReasoning: true,
      codeExecution: true,
      multimodalSupport: true
    },
    usage: {
      inputTokens: Math.floor((message || 'Hello').length / 4),
      outputTokens: Math.floor(100 + Math.random() * 400),
      cost: Math.round((Math.random() * 0.05 + 0.01) * 100) / 100
    },
    user: userId,
    timestamp: new Date().toISOString()
  });
});

addRoute('GET', '/api/deepwebai/premium-analytics', (req, res, url) => {
  const userId = req.headers['x-user-id'] || url.searchParams.get('userId') || 'dev-user-123';
  const isEnabled = mockFeatureFlags['DeepWebAi-Flag'];
  
  if (!isEnabled) {
    return sendJson(res, {
      error: 'FEATURE_NOT_AVAILABLE',
      message: 'Analytics requires DeepWebAI flag'
    }, 403);
  }
  
  sendJson(res, {
    analytics: {
      overview: {
        totalQueries: Math.floor(Math.random() * 1000 + 500),
        tokensUsed: Math.floor(Math.random() * 50000 + 10000),
        costSavings: Math.round((Math.random() * 50 + 10) * 100) / 100,
        responseTime: Math.round((Math.random() * 500 + 200) * 100) / 100
      },
      models: {
        'gpt-4-turbo': { usage: 45, cost: 12.50 },
        'claude-3-opus': { usage: 30, cost: 8.75 },
        'gemini-ultra': { usage: 25, cost: 6.25 }
      },
      features: {
        codeExecution: { used: 15, successRate: 92 },
        visionAnalysis: { used: 8, successRate: 88 },
        functionCalling: { used: 22, successRate: 95 }
      }
    },
    timeRange: url.searchParams.get('timeRange') || '7d',
    user: userId,
    timestamp: new Date().toISOString()
  });
});

addRoute('POST', '/api/deepwebai/feedback', (req, res, url, body) => {
  const userId = req.headers['x-user-id'] || url.searchParams.get('userId') || 'dev-user-123';
  const { feature, rating, comment, category } = body;
  
  log(`💬 Feedback: ${feature} rated ${rating}/5 by ${userId}`, 'cyan');
  
  sendJson(res, {
    message: 'Thank you for your feedback!',
    feedback: { feature, rating, comment, category },
    user: userId,
    timestamp: new Date().toISOString()
  });
});

// Mock file upload
addRoute('POST', '/api/files/upload', (req, res) => {
  log('📄 File upload (mocked)', 'blue');
  sendJson(res, {
    status: 'uploaded',
    id: 'mock-file-' + Math.random().toString(36).substr(2, 9),
    filename: 'mock-document.pdf',
    size: 1024000,
    message: 'File uploaded successfully (development mock)'
  });
});

// Handle CORS preflight
addRoute('OPTIONS', '*', (req, res) => {
  setCorsHeaders(res);
  res.writeHead(204);
  res.end();
});

// Catch all
addRoute('GET', '*', (req, res, url) => {
  sendJson(res, {
    message: `Development server - endpoint ${url.pathname} not implemented`,
    availableEndpoints: [
      'GET /health',
      'GET /api/auth/me', 
      'GET /api/feature-flags',
      'GET /api/feature-flags/:flagName',
      'GET /api/deepwebai/status',
      'GET /api/deepwebai/dashboard',
      'GET /api/deepwebai/premium-features',
      'POST /api/deepwebai/premium-chat',
      'GET /api/deepwebai/premium-analytics',
      'POST /api/deepwebai/feedback',
      'POST /api/files/upload'
    ]
  });
});

// Create and start server
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  try {
    const body = await parseBody(req);
    handleRequest(req, res, url, body);
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    sendJson(res, {
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

server.listen(PORT, HOST, () => {
  log('═'.repeat(60), 'blue');
  log('🚀 DeepWebAI Development Server Started!', 'green');
  log(`🌐 Server: http://${HOST}:${PORT}`, 'green');
  log(`🔗 Health: http://${HOST}:${PORT}/health`, 'green');
  log(`🎯 Flag Demo: http://${HOST}:${PORT}/api/deepwebai/status`, 'green');
  log('═'.repeat(60), 'blue');
  
  // Test the flag
  setTimeout(() => {
    const flagStatus = mockFeatureFlags['DeepWebAi-Flag'];
    if (flagStatus) {
      log('✅ DeepWebAI Flag is ENABLED in development!', 'green');
    } else {
      log('⚫ DeepWebAI Flag is disabled', 'yellow'); 
    }
  }, 1000);
});

// Handle shutdown
process.on('SIGINT', () => {
  log('\n🛑 Shutting down development server...', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Shutting down development server...', 'yellow');
  process.exit(0);
});
