import { chromium, FullConfig } from '@playwright/test';
import { sql } from './test-db-client.js';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Environment Setup...');

  try {
    // Database setup
    console.log('📄 Setting up test database...');
    
    // Clean up any existing test data
    await sql`DELETE FROM feature_flag_events WHERE 1=1`;
    await sql`DELETE FROM feature_flag_targets WHERE 1=1`;
    await sql`DELETE FROM feature_flags WHERE flag_key LIKE '%test%'`;
    await sql`DELETE FROM file_processing_jobs WHERE 1=1`;
    await sql`DELETE FROM file_metadata WHERE 1=1`;
    await sql`DELETE FROM uploaded_files WHERE 1=1`;
    await sql`DELETE FROM ai_requests WHERE 1=1`;
    await sql`DELETE FROM ai_cache WHERE 1=1`;
    await sql`DELETE FROM rate_limits WHERE 1=1`;
    await sql`DELETE FROM chat_messages WHERE 1=1`;
    await sql`DELETE FROM chat_rooms WHERE 1=1`;
    await sql`DELETE FROM notifications WHERE 1=1`;
    await sql`DELETE FROM websocket_connections WHERE 1=1`;
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%test%'`;

    console.log('✅ Database cleaned up');

    // Create test admin user for admin operations
    const adminUser = {
      email: 'admin@test.com',
      username: 'admin',
      password: 'AdminPassword123!',
      displayName: 'Test Admin',
      role: 'admin'
    };

    const adminResult = await sql`
      INSERT INTO users (email, username, password_hash, display_name, role, email_verified, created_at)
      VALUES (${adminUser.email}, ${adminUser.username}, 'hashed_password', ${adminUser.displayName}, ${adminUser.role}, true, NOW())
      RETURNING id
    `;
    
    console.log(`✅ Created admin user: ${adminUser.email}`);

    // Set up feature flags for testing
    const testFlags = [
      {
        key: 'e2e-testing-enabled',
        name: 'E2E Testing Enabled',
        description: 'Enable features for E2E testing',
        enabled: true,
        environment: 'test'
      },
      {
        key: 'file-processing-mock',
        name: 'Mock File Processing',
        description: 'Use mock file processing for faster tests',
        enabled: true,
        environment: 'test'
      },
      {
        key: 'ai-gateway-mock',
        name: 'Mock AI Gateway',
        description: 'Use mock AI responses for testing',
        enabled: true,
        environment: 'test'
      }
    ];

    for (const flag of testFlags) {
      await sql`
        INSERT INTO feature_flags (flag_key, name, description, enabled, environment, created_at)
        VALUES (${flag.key}, ${flag.name}, ${flag.description}, ${flag.enabled}, ${flag.environment}, NOW())
        ON CONFLICT (flag_key, environment) DO UPDATE SET
          enabled = ${flag.enabled},
          updated_at = NOW()
      `;
    }

    console.log('✅ Created test feature flags');

    // Wait for services to be ready
    console.log('⏳ Waiting for services to start...');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Wait for backend health check
    let backendReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!backendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:8080/health');
        if (response.ok()) {
          console.log('✅ Backend service ready');
          backendReady = true;
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for backend... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!backendReady) {
      throw new Error('Backend service failed to start within timeout');
    }

    // Wait for frontend
    let frontendReady = false;
    attempts = 0;
    
    while (!frontendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:3000');
        if (response.ok()) {
          console.log('✅ Frontend service ready');
          frontendReady = true;
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for frontend... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!frontendReady) {
      throw new Error('Frontend service failed to start within timeout');
    }

    await browser.close();

    // Store global test data
    process.env.E2E_ADMIN_USER_ID = adminResult[0].id;
    process.env.E2E_SETUP_COMPLETE = 'true';

    console.log('🎉 E2E Test Environment Setup Complete!');
    
  } catch (error) {
    console.error('❌ E2E Setup Failed:', error);
    throw error;
  }
}

export default globalSetup;
