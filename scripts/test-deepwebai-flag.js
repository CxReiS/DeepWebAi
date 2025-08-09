#!/usr/bin/env node

/**
 * DeepWebAI Flag Test Script
 * GrowthBook "DeepWebAi-Flag" feature flag'ini test eder
 */

import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE = process.env.API_BASE || 'http://localhost:8000';
const TEST_USER_ID = 'test-user-123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': TEST_USER_ID,
      'X-User-Role': 'user',
      'X-User-Email': 'test@deepwebai.com'
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, mergedOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

// Test functions
async function testFlagStatus() {
  log('\n🎯 Testing DeepWebAI Flag Status...', 'blue');
  
  try {
    const result = await apiRequest('/api/deepwebai/status');
    
    if (result.ok) {
      log('✅ Flag status retrieved successfully', 'green');
      log(`   Flag Enabled: ${result.data.flagEnabled}`, 'cyan');
      log(`   Flag Value: ${result.data.flagValue}`, 'cyan');
      log(`   Message: ${result.data.message}`, 'cyan');
      
      if (result.data.flagEnabled) {
        log('🎉 DeepWebAI Flag is ENABLED!', 'green');
      } else {
        log('⚫ DeepWebAI Flag is DISABLED', 'yellow');
      }
    } else {
      log('❌ Failed to get flag status', 'red');
      log(`   Status: ${result.status}`, 'red');
      log(`   Error: ${JSON.stringify(result.data, null, 2)}`, 'red');
    }
    
    return result.data.flagEnabled;
  } catch (error) {
    log(`❌ Flag status test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDashboard() {
  log('\n📊 Testing Dashboard Endpoint...', 'blue');
  
  try {
    const result = await apiRequest('/api/deepwebai/dashboard');
    
    if (result.ok) {
      log('✅ Dashboard data retrieved successfully', 'green');
      log(`   Dashboard Type: ${result.data.dashboard.type}`, 'cyan');
      log(`   Features Count: ${result.data.dashboard.features.length}`, 'cyan');
      log(`   Features: ${result.data.dashboard.features.join(', ')}`, 'cyan');
      
      if (result.data.dashboard.specialFeatures) {
        log('🎉 Special Features Available:', 'green');
        log(`   AI Models: ${result.data.dashboard.specialFeatures.aiModels?.join(', ')}`, 'magenta');
        log(`   Collaboration: ${result.data.dashboard.specialFeatures.collaboration}`, 'magenta');
      }
    } else {
      log('❌ Failed to get dashboard', 'red');
      log(`   Status: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Dashboard test failed: ${error.message}`, 'red');
  }
}

async function testPremiumFeatures() {
  log('\n🎉 Testing Premium Features Access...', 'blue');
  
  try {
    const result = await apiRequest('/api/deepwebai/premium-features');
    
    if (result.ok) {
      log('✅ Premium features accessed successfully', 'green');
      log(`   Message: ${result.data.message}`, 'cyan');
      
      if (result.data.features) {
        log('🚀 Available Premium Features:', 'green');
        Object.entries(result.data.features).forEach(([key, value]) => {
          log(`   ${key}: ${JSON.stringify(value, null, 4).replace(/\n/g, '\n     ')}`, 'magenta');
        });
      }
    } else if (result.status === 403) {
      log('⚫ Premium features not available (Flag disabled)', 'yellow');
      log(`   Error: ${result.data.error}`, 'yellow');
    } else {
      log('❌ Failed to access premium features', 'red');
      log(`   Status: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Premium features test failed: ${error.message}`, 'red');
  }
}

async function testPremiumChat() {
  log('\n🤖 Testing Premium Chat...', 'blue');
  
  const chatMessage = "What are the advantages of DeepWebAI premium features?";
  
  try {
    const result = await apiRequest('/api/deepwebai/premium-chat', {
      method: 'POST',
      body: JSON.stringify({
        message: chatMessage,
        model: 'gpt-4-turbo',
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          useAdvancedFeatures: true
        }
      })
    });
    
    if (result.ok) {
      log('✅ Premium chat response received', 'green');
      log(`   Model: ${result.data.model}`, 'cyan');
      log(`   Response: ${result.data.response}`, 'cyan');
      log(`   Cost: $${result.data.usage?.cost}`, 'cyan');
      log(`   Tokens: ${result.data.usage?.inputTokens} input, ${result.data.usage?.outputTokens} output`, 'cyan');
    } else if (result.status === 403) {
      log('⚫ Premium chat not available (Flag disabled)', 'yellow');
    } else {
      log('❌ Premium chat failed', 'red');
      log(`   Status: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Premium chat test failed: ${error.message}`, 'red');
  }
}

async function testAnalytics() {
  log('\n📈 Testing Premium Analytics...', 'blue');
  
  try {
    const result = await apiRequest('/api/deepwebai/premium-analytics?timeRange=7d');
    
    if (result.ok) {
      log('✅ Premium analytics data retrieved', 'green');
      
      if (result.data.analytics?.overview) {
        const overview = result.data.analytics.overview;
        log('📊 Analytics Overview:', 'cyan');
        log(`   Total Queries: ${overview.totalQueries}`, 'magenta');
        log(`   Tokens Used: ${overview.tokensUsed}`, 'magenta');
        log(`   Cost Savings: $${overview.costSavings}`, 'magenta');
        log(`   Response Time: ${overview.responseTime}ms`, 'magenta');
      }
      
      if (result.data.analytics?.models) {
        log('🤖 Model Usage:', 'cyan');
        Object.entries(result.data.analytics.models).forEach(([model, stats]) => {
          log(`   ${model}: ${stats.usage}% usage, $${stats.cost} cost`, 'magenta');
        });
      }
    } else if (result.status === 403) {
      log('⚫ Premium analytics not available (Flag disabled)', 'yellow');
    } else {
      log('❌ Analytics test failed', 'red');
      log(`   Status: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Analytics test failed: ${error.message}`, 'red');
  }
}

async function testFeedback() {
  log('\n💬 Testing Feature Feedback...', 'blue');
  
  try {
    const result = await apiRequest('/api/deepwebai/feedback', {
      method: 'POST',
      body: JSON.stringify({
        feature: 'premium-chat',
        rating: 5,
        comment: 'Excellent premium chat feature! Very responsive and helpful.',
        category: 'improvement'
      })
    });
    
    if (result.ok) {
      log('✅ Feedback sent successfully', 'green');
      log(`   Message: ${result.data.message}`, 'cyan');
    } else {
      log('❌ Feedback failed', 'red');
      log(`   Status: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Feedback test failed: ${error.message}`, 'red');
  }
}

async function testAllFeatureFlags() {
  log('\n🎛️ Testing All Feature Flags...', 'blue');
  
  try {
    const result = await apiRequest(`/api/feature-flags?userId=${TEST_USER_ID}`);
    
    if (result.ok) {
      log('✅ All feature flags retrieved', 'green');
      log('🎯 Feature Flags Status:', 'cyan');
      
      Object.entries(result.data.features).forEach(([flag, enabled]) => {
        const status = enabled ? '✅' : '❌';
        const color = enabled ? 'green' : 'red';
        log(`   ${status} ${flag}: ${enabled}`, color);
      });
    } else {
      log('❌ Failed to get feature flags', 'red');
      log(`   Status: ${result.status}`, 'red');
    }
  } catch (error) {
    log(`❌ Feature flags test failed: ${error.message}`, 'red');
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting DeepWebAI Flag Tests...', 'blue');
  log(`📍 API Base: ${API_BASE}`, 'cyan');
  log(`👤 Test User ID: ${TEST_USER_ID}`, 'cyan');
  log('═'.repeat(60), 'blue');
  
  try {
    // Test feature flags system
    await testAllFeatureFlags();
    
    // Test specific DeepWebAI flag
    const flagEnabled = await testFlagStatus();
    
    // Test dashboard (works regardless of flag)
    await testDashboard();
    
    // Test premium features (flag dependent)
    await testPremiumFeatures();
    await testPremiumChat();
    await testAnalytics();
    
    // Test feedback system
    await testFeedback();
    
    log('\n' + '═'.repeat(60), 'blue');
    
    if (flagEnabled) {
      log('🎉 ALL TESTS COMPLETED - DeepWebAI Flag is ACTIVE!', 'green');
      log('✅ Premium features are available and working', 'green');
    } else {
      log('⚫ ALL TESTS COMPLETED - DeepWebAI Flag is INACTIVE', 'yellow');
      log('ℹ️  Enable the flag in GrowthBook to access premium features', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'all';

switch (command) {
  case 'status':
    await testFlagStatus();
    break;
  case 'dashboard':
    await testDashboard();
    break;
  case 'premium':
    await testPremiumFeatures();
    break;
  case 'chat':
    await testPremiumChat();
    break;
  case 'analytics':
    await testAnalytics();
    break;
  case 'feedback':
    await testFeedback();
    break;
  case 'flags':
    await testAllFeatureFlags();
    break;
  case 'all':
  default:
    await runAllTests();
    break;
}

log('\n🏁 Test execution completed.', 'blue');
