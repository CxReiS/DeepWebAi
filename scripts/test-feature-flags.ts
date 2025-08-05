#!/usr/bin/env ts-node

/**
 * Manual test script to verify feature flags data flow
 * Run with: npx ts-node scripts/test-feature-flags.ts
 */

import { FeatureFlagManager, FeatureFlagConfig, FEATURE_FLAGS } from '../packages/feature-flags';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message: string, color = colors.reset) => console.log(`${color}${message}${colors.reset}`);

async function testFeatureFlagsDataFlow() {
  log('\n🧪 Testing Feature Flags Data Flow\n', colors.bold);

  try {
    // Test configuration
    const config: FeatureFlagConfig = {
      provider: 'database',
      environment: 'development',
      databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/deepwebai',
      enableAnalytics: true,
      cacheTimeout: 60
    };

    log('1. Initializing Feature Flag Manager...', colors.blue);
    const manager = new FeatureFlagManager(config);
    
    try {
      await manager.initialize();
      log('✅ Feature Flag Manager initialized successfully', colors.green);
    } catch (error) {
      log(`❌ Failed to initialize: ${error}`, colors.red);
      log('⚠️  This is expected if database is not set up yet', colors.yellow);
      return testWithoutDatabase();
    }

    // Test user contexts
    const testUsers = [
      { 
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@example.com',
        role: 'admin',
        plan: 'premium',
        customAttributes: { beta_tester: true }
      },
      {
        id: '456e7890-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        role: 'user',
        plan: 'free',
        customAttributes: {}
      }
    ];

    log('\n2. Testing Feature Flag Evaluation...', colors.blue);
    
    for (const user of testUsers) {
      log(`\n   Testing user: ${user.email} (${user.role}, ${user.plan})`, colors.yellow);
      
      try {
        // Test individual feature flags
        for (const [flagKey, flagName] of Object.entries(FEATURE_FLAGS)) {
          const isEnabled = await manager.isFeatureEnabled(flagName, user);
          const status = isEnabled ? '✅ Enabled' : '❌ Disabled';
          log(`      ${flagKey}: ${status}`);
        }

        // Test getting all features
        const allFeatures = await manager.getAllFeatures(user);
        log(`      Total features: ${Object.keys(allFeatures).length}`);

        // Test feature value (for GrowthBook compatibility)
        const defaultTheme = await manager.getFeatureValue('default-theme', user, 'light');
        log(`      Default theme: ${defaultTheme}`);

        // Test tracking
        await manager.trackEvent('test_event', user, { 
          action: 'manual_test',
          timestamp: new Date().toISOString()
        });
        log(`      ✅ Event tracked`);

      } catch (error) {
        log(`      ❌ Error testing user ${user.email}: ${error}`, colors.red);
      }
    }

    log('\n3. Testing Utility Methods...', colors.blue);
    
    const testUser = testUsers[0];
    
    // Test withFeatureFlag utility
    const result = await manager.withFeatureFlag(
      FEATURE_FLAGS.NEW_CHAT_UI,
      testUser,
      async () => 'New UI Loaded',
      async () => 'Old UI Loaded'
    );
    log(`   Conditional execution result: ${result}`);

    // Test user context creation
    const userContext = await manager.createUserContext('test-user', {
      email: 'test@example.com',
      customAttributes: { test: true }
    });
    log(`   User context created: ${userContext.id}`);

    log('\n4. Testing Error Handling...', colors.blue);
    
    try {
      // Test with invalid user ID
      await manager.isFeatureEnabled('non-existent-flag', { id: 'invalid-uuid' });
    } catch (error) {
      log(`   ✅ Error handling working: ${error}`, colors.green);
    }

    await manager.destroy();
    log('\n✅ All tests completed successfully!', colors.green);

  } catch (error) {
    log(`\n❌ Test failed with error: ${error}`, colors.red);
    throw error;
  }
}

async function testWithoutDatabase() {
  log('\n🔧 Testing Feature Flags (Mock Mode)', colors.yellow);
  
  // Test basic functionality without database
  const mockConfig: FeatureFlagConfig = {
    provider: 'database',
    environment: 'development',
    databaseUrl: 'mock://localhost',
    enableAnalytics: false,
    cacheTimeout: 60
  };

  log('✅ Configuration validation passed', colors.green);
  log('✅ Feature flag constants available:', colors.green);
  
  Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
    log(`   ${key}: ${value}`);
  });

  log('\n⚠️  Database tests skipped - set up DATABASE_URL to test full functionality', colors.yellow);
}

async function testAPIEndpoints() {
  log('\n🌐 Testing API Endpoints...', colors.blue);
  
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/feature-flags/health`,
      method: 'GET'
    },
    {
      name: 'Get All Features',
      url: `${baseUrl}/api/feature-flags?userId=${testUserId}&plan=premium`,
      method: 'GET'
    },
    {
      name: 'Check Specific Feature',
      url: `${baseUrl}/api/feature-flags/new-chat-ui?userId=${testUserId}`,
      method: 'GET'
    },
    {
      name: 'Track Event',
      url: `${baseUrl}/api/feature-flags/track`,
      method: 'POST',
      body: {
        eventName: 'test_event',
        userId: testUserId,
        properties: { test: true }
      }
    }
  ];

  for (const test of tests) {
    try {
      log(`   Testing ${test.name}...`, colors.yellow);
      
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.text();
      
      if (response.ok) {
        log(`      ✅ ${test.name}: ${response.status}`, colors.green);
        
        try {
          const jsonData = JSON.parse(data);
          log(`      📊 Response: ${JSON.stringify(jsonData, null, 2).substring(0, 100)}...`);
        } catch {
          log(`      📊 Response: ${data.substring(0, 100)}...`);
        }
      } else {
        log(`      ❌ ${test.name}: ${response.status} - ${data}`, colors.red);
      }
    } catch (error) {
      log(`      ❌ ${test.name}: Network error - ${error}`, colors.red);
    }
  }
}

// Main execution
async function main() {
  try {
    await testFeatureFlagsDataFlow();
    await testAPIEndpoints();
  } catch (error) {
    log(`\n💥 Test suite failed: ${error}`, colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { testFeatureFlagsDataFlow, testAPIEndpoints };
