#!/usr/bin/env ts-node
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

/**
 * Demo script showing feature flags in action
 * This simulates real-world usage scenarios
 */

import { createInterface, Interface } from 'readline';

interface Colors {
  green: string;
  red: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  reset: string;
  bold: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  role: string;
  attributes: Record<string, any>;
}

interface TestUser {
  id: string;
  hash: number;
}

interface FeatureFlags {
  [key: string]: boolean;
}

const colors: Colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoFeatureFlagsDataFlow(): Promise<void> {
  log('\n🎭 Feature Flags Demo - Real Data Flow Simulation\n', colors.bold);
  
  // Demo user scenarios
  const users: User[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Alice (Admin)',
      email: 'alice@company.com',
      plan: 'enterprise',
      role: 'admin',
      attributes: { 
        beta_tester: true, 
        department: 'engineering',
        country: 'US'
      }
    },
    {
      id: '456e7890-e89b-12d3-a456-426614174000',
      name: 'Bob (Premium User)',
      email: 'bob@startup.com',
      plan: 'premium',
      role: 'user',
      attributes: { 
        company_size: 'small',
        country: 'CA'
      }
    },
    {
      id: '789e1234-e89b-12d3-a456-426614174000',
      name: 'Carol (Free User)',
      email: 'carol@personal.com',
      plan: 'free',
      role: 'user',
      attributes: { 
        referral_source: 'google',
        country: 'UK'
      }
    }
  ];

  // Feature flags we're testing
  const features: string[] = [
    'new-chat-ui',
    'ai-streaming', 
    'premium-models',
    'file-upload',
    'realtime-collaboration',
    'advanced-analytics',
    'beta-features',
    'custom-themes'
  ];

  log('👥 Demo Users:', colors.cyan);
  users.forEach(user => {
    log(`   ${user.name} - ${user.plan} plan, ${user.role} role`);
  });

  log('\n🏗️ Simulating Application Startup...', colors.blue);
  log('   1. Initialize feature flag service');
  log('   2. Connect to database');
  log('   3. Load feature flag configurations');
  await delay(1000);
  log('   ✅ Feature flags service ready\n', colors.green);

  // Simulate different user journeys
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    log(`\n${i + 1}. 👤 User Journey: ${user.name}`, colors.bold);
    log(`   📧 Email: ${user.email}`);
    log(`   📋 Plan: ${user.plan}, Role: ${user.role}`);
    
    await delay(500);

    // Step 1: User logs in - fetch all features
    log('\n   🔐 User Login Event', colors.yellow);
    log('   → Frontend calls: GET /api/feature-flags');
    log('   → Backend queries database for user features');
    log('   → Evaluates rollout percentages and user attributes');
    
    await delay(300);
    
    // Simulate the response
    const mockAllFeatures: FeatureFlags = {};
    features.forEach(feature => {
      // Simulate different enabling logic based on user type
      let isEnabled = false;
      
      switch (feature) {
        case 'new-chat-ui':
          isEnabled = true; // Available to all
          break;
        case 'ai-streaming':
          isEnabled = user.plan !== 'free'; // Premium+ only
          break;
        case 'premium-models':
          isEnabled = user.plan === 'premium' || user.plan === 'enterprise';
          break;
        case 'file-upload':
          isEnabled = user.plan === 'enterprise' || user.attributes.beta_tester;
          break;
        case 'realtime-collaboration':
          isEnabled = user.plan === 'enterprise';
          break;
        case 'advanced-analytics':
          isEnabled = user.role === 'admin' || user.plan === 'enterprise';
          break;
        case 'beta-features':
          isEnabled = user.attributes.beta_tester || user.role === 'admin';
          break;
        case 'custom-themes':
          isEnabled = user.plan !== 'free';
          break;
      }
      
      mockAllFeatures[feature] = isEnabled;
    });
    
    log('   ✅ Features loaded:', colors.green);
    Object.entries(mockAllFeatures).forEach(([feature, enabled]) => {
      const status = enabled ? '🟢 ENABLED' : '🔴 DISABLED';
      log(`      ${feature}: ${status}`);
    });

    // Step 2: User interacts with features
    log('\n   🖱️  User Interactions', colors.yellow);
    
    const enabledFeatures = Object.entries(mockAllFeatures)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
    
    if (enabledFeatures.length > 0) {
      const randomFeature = enabledFeatures[Math.floor(Math.random() * enabledFeatures.length)];
      log(`   → User clicks on feature: ${randomFeature}`);
      log('   → Frontend calls: POST /api/feature-flags/track');
      log('   → Backend logs usage analytics');
      
      await delay(200);
      log('   ✅ Usage tracked successfully', colors.green);
    }

    // Step 3: Feature-specific behavior
    log('\n   🎯 Feature-Specific Logic', colors.yellow);
    
    if (mockAllFeatures['premium-models']) {
      log('   → Loading premium AI models (GPT-4, Claude)');
      log('   → Enhanced model selection UI shown');
    } else {
      log('   → Standard models only (GPT-3.5)');
      log('   → Upgrade prompt displayed');
    }
    
    if (mockAllFeatures['new-chat-ui']) {
      log('   → New chat interface rendered');
      log('   → Advanced features available');
    } else {
      log('   → Legacy chat interface');
      log('   → Basic functionality only');
    }

    await delay(300);
    log(`   🎉 ${user.name}'s session complete`, colors.green);
  }

  // Simulate A/B testing scenario
  log('\n\n🧪 A/B Testing Simulation', colors.bold);
  log('   Feature: new-chat-ui (50% rollout)', colors.cyan);
  
  const testUsers: TestUser[] = Array.from({ length: 10 }, (_, i) => ({
    id: `test-user-${i}`,
    hash: Math.random() * 100
  }));
  
  log('\n   User Hash Distribution:');
  testUsers.forEach(user => {
    const inRollout = user.hash < 50; // 50% rollout
    const status = inRollout ? '🟢 ENABLED' : '🔴 DISABLED';
    log(`   ${user.id}: hash=${Math.floor(user.hash)} → ${status}`);
  });
  
  const enabledCount = testUsers.filter(u => u.hash < 50).length;
  log(`\n   📊 Results: ${enabledCount}/10 users (${enabledCount * 10}%) got the new feature`, colors.green);

  // Simulate real-time updates
  log('\n\n🔄 Real-time Feature Updates', colors.bold);
  log('   Admin updates feature flag in dashboard...', colors.yellow);
  await delay(500);
  log('   → Database updated: premium-models rollout 25% → 50%');
  await delay(300);
  log('   → Cache invalidated for affected users');
  await delay(300);
  log('   → Next API calls will reflect new settings');
  log('   ✅ Live update complete', colors.green);

  // Simulate error handling
  log('\n\n⚠️  Error Handling Demo', colors.bold);
  log('   Simulating database connection issue...', colors.yellow);
  await delay(300);
  log('   → Feature flag evaluation fails');
  log('   → Graceful fallback to default values');
  log('   → Error logged for monitoring');
  log('   → User experience remains smooth', colors.green);

  // Performance demonstration
  log('\n\n⚡ Performance Demonstration', colors.bold);
  log('   Simulating high-traffic scenario...', colors.yellow);
  await delay(300);
  log('   → 1000 concurrent feature flag requests');
  log('   → Cache hit rate: 95%');
  log('   → Average response time: 15ms');
  log('   → Database queries minimized');
  log('   ✅ System performing optimally', colors.green);

  // Analytics summary
  log('\n\n📊 Analytics Summary', colors.bold);
  log('   Daily feature flag evaluations: 50,000', colors.cyan);
  log('   Most used feature: new-chat-ui (80% engagement)');
  log('   Best performing rollout: ai-streaming (25% conversion)');
  log('   User satisfaction: 94% (beta features)');

  log('\n\n🎉 Feature Flags Demo Complete!', colors.bold);
  log('\n💡 Key Benefits Demonstrated:', colors.green);
  log('   ✅ Gradual rollouts reduce risk');
  log('   ✅ User targeting enables personalization');
  log('   ✅ Real-time updates without deployments');
  log('   ✅ A/B testing drives data-driven decisions');
  log('   ✅ Graceful error handling maintains reliability');
  log('   ✅ Analytics provide actionable insights');
  
  log('\n🚀 Ready for Production!', colors.bold);
}

// Interactive demo mode
async function interactiveDemo(): Promise<void> {
  const rl: Interface = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function question(prompt: string): Promise<string> {
    return new Promise(resolve => rl.question(prompt, resolve));
  }

  log('\n🎮 Interactive Feature Flags Demo', colors.bold);
  
  try {
    const userName = await question('Enter your name: ');
    const userPlan = await question('Choose plan (free/premium/enterprise): ');
    const userRole = await question('Choose role (user/admin): ');
    
    log(`\n👤 Welcome ${userName}!`, colors.green);
    log(`📋 Plan: ${userPlan}, Role: ${userRole}`);
    
    const mockFeatures: FeatureFlags = {
      'new-chat-ui': true,
      'ai-streaming': userPlan !== 'free',
      'premium-models': userPlan === 'premium' || userPlan === 'enterprise',
      'file-upload': userPlan === 'enterprise',
      'realtime-collaboration': userPlan === 'enterprise',
      'admin-panel': userRole === 'admin'
    };
    
    log('\n🎯 Your Available Features:', colors.cyan);
    Object.entries(mockFeatures).forEach(([feature, enabled]) => {
      const status = enabled ? '🟢 ENABLED' : '🔴 DISABLED';
      log(`   ${feature}: ${status}`);
    });
    
    const continueDemo = await question('\nRun full demo? (y/n): ');
    if (continueDemo.toLowerCase() === 'y') {
      rl.close();
      await demoFeatureFlagsDataFlow();
    } else {
      log('\n👋 Demo ended. Thanks for trying feature flags!', colors.green);
      rl.close();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`\n❌ Error: ${errorMessage}`, colors.red);
    rl.close();
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive')) {
    await interactiveDemo();
  } else {
    await demoFeatureFlagsDataFlow();
  }
}

// Check if this is the main module (ES modules equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
