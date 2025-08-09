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

// Development Server
// Database bağlantısı olmadan çalışabilen basit development server

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { createServer } from 'http';
import { developmentConfig, shouldSkipDatabase, isDevelopment } from './config/development.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Initialize feature flags (GrowthBook only, no database needed)
let featureFlagService: any = null;

async function initializeFeatureFlags() {
  try {
    if (!isDevelopment()) return;
    
    log('🎛️  Initializing GrowthBook feature flags...', 'blue');
    
    // Mock feature flag service for development
    featureFlagService = {
      async isFeatureEnabled(flagName: string, userId: string) {
        // Always enable DeepWebAI flag in development
        if (flagName === 'DeepWebAi-Flag') {
          return true;
        }
        return Math.random() > 0.5; // Random for other flags
      },
      
      async getAllFeatures(userId: string) {
        return {
          'DeepWebAi-Flag': true,
          'premium_models': true,
          'file_ocr': true,
          'real_time_chat': true,
          'advanced_analytics': false,
          'beta_features': true
        };
      },
      
      async getFeatureValue(flagName: string, userId: string, defaultValue: any) {
        if (flagName === 'DeepWebAi-Flag') return true;
        return defaultValue;
      },
      
      async trackFeatureEvent(eventName: string, userId: string, properties?: any) {
        log(`📊 Feature event: ${eventName} for user ${userId}`, 'cyan');
      }
    };
    
    log('✅ Feature flags initialized (development mode)', 'green');
  } catch (error) {
    log(`⚠️  Feature flags initialization failed: ${error}`, 'yellow');
  }
}

// Create simple development server
const app = new Elysia()
  // Basic CORS
  .use(cors({
    origin: developmentConfig.corsOrigin,
    credentials: true
  }))
  
  // Basic logging middleware
  .onBeforeHandle(({ request, path }) => {
    log(`📥 ${request.method} ${path}`, 'cyan');
  })
  
  // Health check
  .get('/health', () => {
    return {
      status: 'ok',
      mode: 'development',
      timestamp: new Date().toISOString(),
      features: {
        database: 'mocked',
        featureFlags: 'growthbook',
        fileProcessing: 'disabled',
        analytics: 'disabled'
      }
    };
  })
  
  // Mock auth endpoint
  .get('/api/auth/me', ({ headers }) => {
    const userId = headers['x-user-id'] || 'dev-user-123';
    return {
      user: {
        id: userId,
        email: 'dev@deepwebai.com',
        username: 'devuser',
        displayName: 'Development User',
        role: 'user'
      }
    };
  })
  
  // Feature flags endpoints
  .get('/api/feature-flags', async ({ query }) => {
    const userId = query.userId as string || 'dev-user-123';
    const features = await featureFlagService?.getAllFeatures(userId) || {};
    
    return {
      userId,
      features,
      timestamp: new Date().toISOString()
    };
  })
  
  .get('/api/feature-flags/:flagName', async ({ params, query }) => {
    const { flagName } = params;
    const userId = query.userId as string || 'dev-user-123';
    const isEnabled = await featureFlagService?.isFeatureEnabled(flagName, userId) || false;
    
    return {
      flagName,
      isEnabled,
      userId,
      timestamp: new Date().toISOString()
    };
  })
  
  // DeepWebAI Features - inline implementation for dev
  .get('/api/deepwebai/status', async ({ query, headers }) => {
    const userId = headers['x-user-id'] || query.userId as string || 'dev-user-123';
    const isEnabled = await featureFlagService?.isFeatureEnabled('DeepWebAi-Flag', userId) || true;
    
    return {
      flagEnabled: isEnabled,
      flagValue: isEnabled,
      user: userId,
      message: isEnabled 
        ? 'DeepWebAI advanced features are available!' 
        : 'DeepWebAI advanced features are not available',
      timestamp: new Date().toISOString()
    };
  })
  
  .get('/api/deepwebai/dashboard', async ({ query, headers }) => {
    const userId = headers['x-user-id'] || query.userId as string || 'dev-user-123';
    const isEnabled = await featureFlagService?.isFeatureEnabled('DeepWebAi-Flag', userId) || true;
    
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
    
    return {
      user: userId,
      dashboard: isEnabled ? advancedDashboard : basicDashboard,
      flagEnabled: isEnabled,
      timestamp: new Date().toISOString()
    };
  })
  
  .get('/api/deepwebai/premium-features', async ({ query, headers }) => {
    const userId = headers['x-user-id'] || query.userId as string || 'dev-user-123';
    const isEnabled = await featureFlagService?.isFeatureEnabled('DeepWebAi-Flag', userId) || true;
    
    if (!isEnabled) {
      return {
        error: 'FEATURE_NOT_AVAILABLE',
        message: 'This feature is not available for your account',
        featureFlag: 'DeepWebAi-Flag'
      };
    }
    
    return {
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
    };
  })
  
  .post('/api/deepwebai/premium-chat', async ({ body, query, headers }) => {
    const userId = headers['x-user-id'] || query.userId as string || 'dev-user-123';
    const isEnabled = await featureFlagService?.isFeatureEnabled('DeepWebAi-Flag', userId) || true;
    
    if (!isEnabled) {
      return {
        error: 'FEATURE_NOT_AVAILABLE',
        message: 'Premium chat requires DeepWebAI flag'
      };
    }
    
    const chatBody = body as any;
    const message = chatBody?.message || 'Hello';
    const model = chatBody?.model || 'gpt-4-turbo';
    
    return {
      response: `[DEV PREMIUM AI - ${model.toUpperCase()}] This is a development premium AI response to: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`,
      model,
      features: {
        enhancedReasoning: true,
        codeExecution: true,
        multimodalSupport: true
      },
      usage: {
        inputTokens: Math.floor(message.length / 4),
        outputTokens: Math.floor(100 + Math.random() * 400),
        cost: Math.round((Math.random() * 0.05 + 0.01) * 100) / 100
      },
      user: userId,
      timestamp: new Date().toISOString()
    };
  })
  
  // Mock file upload
  .post('/api/files/upload', ({ body }) => {
    log('📄 File upload (mocked)', 'blue');
    return {
      status: 'uploaded',
      id: 'mock-file-' + Math.random().toString(36).substr(2, 9),
      filename: 'mock-document.pdf',
      size: 1024000,
      message: 'File uploaded successfully (development mock)'
    };
  })
  
  // Catch all for development
  .get('*', ({ path }) => {
    return {
      message: `Development server - endpoint ${path} not implemented`,
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
        'POST /api/files/upload'
      ]
    };
  })
  
  // Error handler
  .onError(({ error, code }) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`❌ Error ${code}: ${errorMessage}`, 'red');
    return {
      error: errorMessage,
      code,
      timestamp: new Date().toISOString()
    };
  });

// Start server
async function startServer() {
  try {
    log('🚀 Starting DeepWebAI Development Server...', 'blue');
    log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan');
    
    if (shouldSkipDatabase()) {
      log('⚠️  Database connection skipped (development mode)', 'yellow');
    }
    
    // Initialize feature flags
    await initializeFeatureFlags();
    
    // Start the server using Node.js HTTP since Bun is not available
    const server = createServer(async (req, res) => {
      // Get request body for POST/PUT requests
      let body: string | undefined;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = Buffer.concat(chunks).toString();
      }

      const request = new Request(`http://localhost:${developmentConfig.port}${req.url}`, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: body
      });
      const response = await app.handle(request);
      
      // Set response headers
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      res.statusCode = response.status;
      
      // Stream response body
      if (response.body) {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      res.end();
    });
    
    server.listen(developmentConfig.port, developmentConfig.host);
    
    log('═'.repeat(60), 'blue');
    log('🎉 Development server started successfully!', 'green');
    log(`🌐 Server: http://${developmentConfig.host}:${developmentConfig.port}`, 'green');
    log(`🔗 Health: http://${developmentConfig.host}:${developmentConfig.port}/health`, 'green');
    log(`🎯 Flag Demo: http://${developmentConfig.host}:${developmentConfig.port}/api/deepwebai/status`, 'green');
    log('═'.repeat(60), 'blue');
    
    // Test the DeepWebAI flag
    setTimeout(async () => {
      if (featureFlagService) {
        const isEnabled = await featureFlagService.isFeatureEnabled('DeepWebAi-Flag', 'dev-user-123');
        if (isEnabled) {
          log('✅ DeepWebAI Flag is ENABLED in development!', 'green');
        } else {
          log('⚫ DeepWebAI Flag is disabled', 'yellow');
        }
      }
    }, 1000);
    
  } catch (error) {
    log(`❌ Failed to start development server: ${error}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  log('\n🛑 Shutting down development server...', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n🛑 Shutting down development server...', 'yellow'); 
  process.exit(0);
});

// Start the server
startServer();
