import { FullConfig } from '@playwright/test';
import { sql } from './test-db-client.js';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E Test Environment Cleanup...');

  try {
    // Clean up test data
    console.log('📄 Cleaning up test database...');
    
    await sql`DELETE FROM feature_flag_events WHERE 1=1`;
    await sql`DELETE FROM feature_flag_targets WHERE 1=1`;
    await sql`DELETE FROM feature_flags WHERE flag_key LIKE '%test%' OR environment = 'test'`;
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

    console.log('✅ Test database cleaned up');

    // Clean up test files
    const fs = require('fs');
    const path = require('path');
    
    const testFilesDir = path.join(__dirname, 'fixtures');
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
      console.log('✅ Test files cleaned up');
    }

    // Clean up environment variables
    delete process.env.E2E_ADMIN_USER_ID;
    delete process.env.E2E_SETUP_COMPLETE;

    console.log('🎉 E2E Test Environment Cleanup Complete!');
    
  } catch (error) {
    console.error('❌ E2E Cleanup Failed:', error);
    // Don't throw - cleanup failures shouldn't fail the build
  }
}

export default globalTeardown;
