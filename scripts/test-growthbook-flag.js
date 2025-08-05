#!/usr/bin/env node

/**
 * GrowthBook Flag Direct Test
 * Backend olmadan direkt GrowthBook SDK ile "DeepWebAi-Flag" test eder
 */

import { GrowthBook } from '@growthbook/growthbook';

// Test configuration
const GROWTHBOOK_CLIENT_KEY = process.env.GROWTHBOOK_CLIENT_KEY || 'sdk-CijMaMxaByGXrUoN';
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

async function testGrowthBookFlag() {
  log('🚀 Testing GrowthBook "DeepWebAi-Flag" directly...', 'blue');
  log(`🔑 Client Key: ${GROWTHBOOK_CLIENT_KEY}`, 'cyan');
  log(`👤 Test User: ${TEST_USER_ID}`, 'cyan');
  log('═'.repeat(60), 'blue');

  // Initialize GrowthBook
  const growthbook = new GrowthBook({
    apiHost: 'https://cdn.growthbook.io',
    clientKey: GROWTHBOOK_CLIENT_KEY,
    enableDevMode: true,
    subscribeToChanges: true,
    trackingCallback: (experiment, result) => {
      log(`📊 Experiment tracked: ${experiment.key} -> ${result.value}`, 'magenta');
    }
  });

  try {
    // Load features from GrowthBook
    log('📥 Loading features from GrowthBook...', 'blue');
    await growthbook.loadFeatures();
    log('✅ Features loaded successfully', 'green');

    // Set user attributes
    growthbook.setAttributes({
      id: TEST_USER_ID,
      email: 'test@deepwebai.com',
      role: 'user',
      plan: 'free',
      country: 'TR',
      customAttributes: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });

    log('\n🎯 Testing "DeepWebAi-Flag"...', 'blue');

    // Test the flag
    const isDeepWebAIFlagEnabled = growthbook.isOn('DeepWebAi-Flag');
    
    if (isDeepWebAIFlagEnabled) {
      console.log("Feature is enabled!")
      log('🎉 DeepWebAI Flag is ENABLED!', 'green');
      log('✅ Premium features would be available', 'green');
    } else {
      log('⚫ DeepWebAI Flag is DISABLED', 'yellow');
      log('ℹ️  Premium features would not be available', 'yellow');
    }

    // Get flag value (if it has a value)
    const flagValue = growthbook.getFeatureValue('DeepWebAi-Flag', false);
    log(`📄 Flag value: ${flagValue}`, 'cyan');

    // Test other common flags
    log('\n🎛️ Testing other common flags...', 'blue');
    const commonFlags = [
      'premium_models',
      'file_ocr', 
      'real_time_chat',
      'advanced_analytics',
      'beta_features'
    ];

    commonFlags.forEach(flag => {
      const enabled = growthbook.isOn(flag);
      const status = enabled ? '✅' : '❌';
      const color = enabled ? 'green' : 'red';
      log(`   ${status} ${flag}: ${enabled}`, color);
    });

    // Get all features
    log('\n📋 All available features:', 'blue');
    const allFeatures = growthbook.getFeatures();
    Object.keys(allFeatures).forEach(key => {
      const enabled = growthbook.isOn(key);
      const status = enabled ? '✅' : '❌';
      const color = enabled ? 'green' : 'red';
      log(`   ${status} ${key}: ${enabled}`, color);
    });

    // Test with different user attributes
    log('\n👥 Testing with different user types...', 'blue');
    
    const userTypes = [
      { label: 'Premium User', attributes: { plan: 'premium', role: 'premium' } },
      { label: 'Admin User', attributes: { plan: 'enterprise', role: 'admin' } },
      { label: 'Beta User', attributes: { plan: 'free', role: 'beta-tester' } },
      { label: 'Enterprise User', attributes: { plan: 'enterprise', role: 'enterprise' } }
    ];

    for (const userType of userTypes) {
      growthbook.setAttributes({
        id: `test-${userType.label.toLowerCase().replace(' ', '-')}`,
        ...userType.attributes
      });

      const enabled = growthbook.isOn('DeepWebAi-Flag');
      const status = enabled ? '✅' : '❌';
      const color = enabled ? 'green' : 'red';
      log(`   ${status} ${userType.label}: ${enabled}`, color);
    }

    log('\n' + '═'.repeat(60), 'blue');
    log('🎉 GrowthBook flag test completed successfully!', 'green');

    // Final status
    growthbook.setAttributes({ id: TEST_USER_ID });
    const finalStatus = growthbook.isOn('DeepWebAi-Flag');
    
    if (finalStatus) {
      log('\n✅ RESULT: DeepWebAI Flag is ACTIVE for test user', 'green');
      log('🚀 You can now test premium features in the application', 'green');
    } else {
      log('\n⚫ RESULT: DeepWebAI Flag is INACTIVE for test user', 'yellow');
      log('💡 Enable the flag in GrowthBook dashboard to activate premium features', 'yellow');
    }

  } catch (error) {
    log(`❌ Error testing GrowthBook flag: ${error.message}`, 'red');
    console.error('Full error:', error);
  } finally {
    // Cleanup
    growthbook.destroy();
  }
}

// Run the test
await testGrowthBookFlag();
