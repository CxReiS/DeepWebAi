/**
 * Simple Node.js script to test Feature Flags API endpoints
 */

const http = require('http');
const https = require('https');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data,
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testFeatureFlagsAPI() {
  log('\n🧪 Testing Feature Flags API Data Flow\n', colors.bold);
  
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  // Test scenarios
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/feature-flags/health`,
      method: 'GET',
      description: 'Check if feature flags service is running'
    },
    {
      name: 'Get All Features (Premium User)',
      url: `${baseUrl}/api/feature-flags?userId=${testUserId}&plan=premium&role=admin`,
      method: 'GET',
      description: 'Fetch all feature flags for a premium admin user'
    },
    {
      name: 'Get All Features (Free User)',
      url: `${baseUrl}/api/feature-flags?userId=${testUserId}&plan=free&role=user`,
      method: 'GET',
      description: 'Fetch all feature flags for a free user'
    },
    {
      name: 'Check New Chat UI Feature',
      url: `${baseUrl}/api/feature-flags/new-chat-ui?userId=${testUserId}&plan=premium`,
      method: 'GET',
      description: 'Check if new chat UI is enabled for premium user'
    },
    {
      name: 'Check Premium Models Feature',
      url: `${baseUrl}/api/feature-flags/premium-models?userId=${testUserId}&plan=free`,
      method: 'GET',
      description: 'Check if premium models are enabled for free user (should be false)'
    },
    {
      name: 'Track Feature Usage',
      url: `${baseUrl}/api/feature-flags/track`,
      method: 'POST',
      body: {
        eventName: 'feature_test_usage',
        userId: testUserId,
        properties: {
          feature: 'new-chat-ui',
          action: 'api_test',
          timestamp: new Date().toISOString()
        }
      },
      description: 'Track feature flag usage event'
    },
    {
      name: 'Invalid Request (Missing userId)',
      url: `${baseUrl}/api/feature-flags`,
      method: 'GET',
      description: 'Test error handling with missing userId'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    log(`${i + 1}. Testing: ${test.name}`, colors.blue);
    log(`   Description: ${test.description}`, colors.yellow);
    log(`   URL: ${test.url}`);
    
    try {
      const options = {
        method: test.method,
        body: test.body
      };
      
      const response = await makeRequest(test.url, options);
      
      if (response.ok || (test.name.includes('Invalid') && response.status === 400)) {
        log(`   ✅ Success: ${response.status} ${response.statusText}`, colors.green);
        
        try {
          const jsonData = JSON.parse(response.data);
          log(`   📊 Response preview: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}...`);
          
          // Specific validations
          if (test.name.includes('All Features')) {
            if (jsonData.features && typeof jsonData.features === 'object') {
              log(`   🎯 Found ${Object.keys(jsonData.features).length} features`, colors.green);
            }
          } else if (test.name.includes('Check') && jsonData.hasOwnProperty('isEnabled')) {
            log(`   🎯 Feature status: ${jsonData.isEnabled ? 'ENABLED' : 'DISABLED'}`, colors.green);
          } else if (test.name.includes('Track') && jsonData.success) {
            log(`   🎯 Event tracked successfully`, colors.green);
          }
        } catch (parseError) {
          log(`   📊 Raw response: ${response.data.substring(0, 100)}...`);
        }
        
        successCount++;
      } else {
        log(`   ❌ Failed: ${response.status} ${response.statusText}`, colors.red);
        log(`   📊 Error response: ${response.data.substring(0, 200)}...`);
      }
    } catch (error) {
      log(`   ❌ Network error: ${error.message}`, colors.red);
      if (error.code === 'ECONNREFUSED') {
        log(`   🔧 Make sure the backend server is running on ${baseUrl}`, colors.yellow);
      }
    }
    
    log(''); // Empty line for readability
  }

  // Summary
  log('📊 Test Summary:', colors.bold);
  log(`   Total tests: ${totalTests}`);
  log(`   Successful: ${successCount}`, successCount === totalTests ? colors.green : colors.yellow);
  log(`   Failed: ${totalTests - successCount}`, totalTests - successCount === 0 ? colors.green : colors.red);
  
  if (successCount === totalTests) {
    log('\n🎉 All tests passed! Feature flags data flow is working correctly.', colors.green);
  } else {
    log('\n⚠️  Some tests failed. Check the backend server and database connection.', colors.yellow);
  }
}

async function testFrontendIntegration() {
  log('\n🖥️  Frontend Integration Test Simulation', colors.bold);
  
  // Simulate frontend hook behavior
  const mockFetch = async (url, options) => {
    log(`   Frontend would call: ${options?.method || 'GET'} ${url}`, colors.blue);
    
    try {
      const response = await makeRequest(url, options);
      return {
        ok: response.ok,
        status: response.status,
        json: async () => JSON.parse(response.data)
      };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: error.message })
      };
    }
  };

  log('\n   Simulating useFeatureFlags hook behavior:');
  
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  try {
    // Simulate initial load
    log('   1. Initial load - fetching all features...', colors.yellow);
    const allFeaturesUrl = `${baseUrl}/api/feature-flags?userId=${userId}&plan=premium&role=user`;
    const allFeaturesResponse = await mockFetch(allFeaturesUrl);
    
    if (allFeaturesResponse.ok) {
      const allFeaturesData = await allFeaturesResponse.json();
      log('      ✅ Features loaded successfully', colors.green);
      log(`      📊 Available features: ${Object.keys(allFeaturesData.features || {}).join(', ')}`);
    } else {
      log('      ❌ Failed to load features', colors.red);
    }

    // Simulate specific feature check
    log('   2. Checking specific feature...', colors.yellow);
    const specificFeatureUrl = `${baseUrl}/api/feature-flags/new-chat-ui?userId=${userId}`;
    const specificResponse = await mockFetch(specificFeatureUrl);
    
    if (specificResponse.ok) {
      const specificData = await specificResponse.json();
      log(`      ✅ Feature check: new-chat-ui is ${specificData.isEnabled ? 'ENABLED' : 'DISABLED'}`, colors.green);
    }

    // Simulate tracking
    log('   3. Tracking feature usage...', colors.yellow);
    const trackingUrl = `${baseUrl}/api/feature-flags/track`;
    const trackingResponse = await mockFetch(trackingUrl, {
      method: 'POST',
      body: {
        eventName: 'frontend_simulation',
        userId: userId,
        properties: { test: true }
      }
    });
    
    if (trackingResponse.ok) {
      log('      ✅ Usage tracked successfully', colors.green);
    }

    log('\n   🎯 Frontend integration simulation completed!', colors.green);
    
  } catch (error) {
    log(`   ❌ Frontend simulation error: ${error.message}`, colors.red);
  }
}

// Main execution
async function main() {
  try {
    await testFeatureFlagsAPI();
    await testFrontendIntegration();
    
    log('\n🎯 Complete data flow test finished!', colors.bold);
    log('\nNext steps:', colors.blue);
    log('   1. Start the backend server: pnpm --filter=backend dev');
    log('   2. Run database migrations to set up feature flags tables');
    log('   3. Execute setup-test-data.sql to create test data');
    log('   4. Re-run this test script to verify full functionality');
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
