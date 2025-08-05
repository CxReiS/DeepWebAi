#!/usr/bin/env node

/**
 * Database Seed Script for DeepWebAI
 * Populates database with sample data for development/testing
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Database client
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

/**
 * Seed sample data
 */
async function seedDatabase() {
  log('🌱 Starting database seeding...', 'blue');
  
  try {
    await client.connect();
    log('✅ Connected to database', 'green');
    
    // Check if data already exists
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const existingUsers = parseInt(userCount.rows[0].count);
    
    if (existingUsers > 0) {
      log(`⚠️  Database already contains ${existingUsers} users. Skipping seed.`, 'yellow');
      log('Use --force flag to seed anyway', 'yellow');
      return;
    }
    
    // Seed data
    await seedUsers();
    await seedFeatureFlags();
    await seedConversations();
    await seedAnalytics();
    
    log('🎉 Database seeding completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Seeding failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Seed users
 */
async function seedUsers() {
  log('👥 Seeding users...', 'blue');
  
  const users = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@deepwebai.com',
      username: 'admin',
      password_hash: '$2b$10$8K1p/a0dRTOfSxWOHqtUrOBjNp.Jm9KN9z9R8X.qQ0YG5Y8X9K0K.',
      display_name: 'System Administrator',
      role: 'admin',
      is_verified: true
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'demo@deepwebai.com',
      username: 'demo',
      password_hash: '$2b$10$9L2q/b1eSTQgTyXPJruvVPCkOq.Km0LO0a0S9Y.rR1ZH6Z9Y0L1L.',
      display_name: 'Demo User',
      role: 'user',
      is_verified: true
    }
  ];
  
  for (const user of users) {
    await client.query(`
      INSERT INTO users (id, email, username, password_hash, display_name, role, is_verified, email_verified_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING
    `, [user.id, user.email, user.username, user.password_hash, user.display_name, user.role, user.is_verified]);
  }
  
  log('✅ Users seeded', 'green');
}

/**
 * Seed feature flags
 */
async function seedFeatureFlags() {
  log('🎛️  Seeding feature flags...', 'blue');
  
  const flags = [
    { key: 'premium_models', name: 'Premium AI Models', is_enabled: false, rollout_percentage: 0 },
    { key: 'file_ocr', name: 'File OCR Processing', is_enabled: true, rollout_percentage: 100 },
    { key: 'real_time_chat', name: 'Real-time Chat', is_enabled: true, rollout_percentage: 100 },
    { key: 'advanced_analytics', name: 'Advanced Analytics', is_enabled: false, rollout_percentage: 25 },
    { key: 'beta_features', name: 'Beta Features', is_enabled: false, rollout_percentage: 10 }
  ];
  
  for (const flag of flags) {
    await client.query(`
      INSERT INTO feature_flags (key, name, is_enabled, rollout_percentage)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO NOTHING
    `, [flag.key, flag.name, flag.is_enabled, flag.rollout_percentage]);
  }
  
  log('✅ Feature flags seeded', 'green');
}

/**
 * Seed conversations
 */
async function seedConversations() {
  log('💬 Seeding conversations...', 'blue');
  
  // Create a sample conversation for demo user
  await client.query(`
    INSERT INTO conversations (id, user_id, title, model, system_prompt)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
  `, [
    '660e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'Welcome to DeepWebAI',
    'gpt-3.5-turbo',
    'You are a helpful AI assistant for DeepWebAI platform.'
  ]);
  
  // Add sample messages
  const messages = [
    {
      conversation_id: '660e8400-e29b-41d4-a716-446655440000',
      role: 'user',
      content: 'Hello! What can DeepWebAI help me with?',
      token_count: 15
    },
    {
      conversation_id: '660e8400-e29b-41d4-a716-446655440000',
      role: 'assistant',
      content: 'Welcome! DeepWebAI can help you with document analysis, AI chat, and much more.',
      token_count: 25
    }
  ];
  
  for (const message of messages) {
    await client.query(`
      INSERT INTO messages (conversation_id, role, content, token_count)
      VALUES ($1, $2, $3, $4)
    `, [message.conversation_id, message.role, message.content, message.token_count]);
  }
  
  log('✅ Conversations seeded', 'green');
}

/**
 * Seed analytics data
 */
async function seedAnalytics() {
  log('📊 Seeding analytics...', 'blue');
  
  // Sample analytics events
  const events = [
    { user_id: '550e8400-e29b-41d4-a716-446655440001', event_type: 'user', event_name: 'login' },
    { user_id: '550e8400-e29b-41d4-a716-446655440001', event_type: 'conversation', event_name: 'created' },
    { user_id: '550e8400-e29b-41d4-a716-446655440000', event_type: 'admin', event_name: 'login' }
  ];
  
  for (const event of events) {
    await client.query(`
      INSERT INTO analytics_events (user_id, event_type, event_name, properties)
      VALUES ($1, $2, $3, $4)
    `, [event.user_id, event.event_type, event.event_name, '{}']);
  }
  
  log('✅ Analytics seeded', 'green');
}

/**
 * Clear all data (for --reset flag)
 */
async function clearDatabase() {
  log('🗑️  Clearing database...', 'yellow');
  
  const tables = [
    'analytics_events',
    'api_usage', 
    'ai_provider_usage',
    'messages',
    'conversations',
    'file_content',
    'file_processing_jobs',
    'files',
    'user_feature_flags',
    'feature_flags',
    'mfa_secrets',
    'password_reset_tokens',
    'email_verification_tokens',
    'oauth_accounts',
    'sessions',
    'users'
  ];
  
  for (const table of tables) {
    await client.query(`DELETE FROM ${table}`);
  }
  
  log('✅ Database cleared', 'green');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const reset = args.includes('--reset');
  
  try {
    await client.connect();
    
    if (reset) {
      await clearDatabase();
    }
    
    if (reset || force) {
      await seedUsers();
      await seedFeatureFlags();
      await seedConversations();
      await seedAnalytics();
      log('🎉 Database seeding completed!', 'green');
    } else {
      await seedDatabase();
    }
    
  } catch (error) {
    log(`❌ Seed script failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled rejection: ${error.message}`, 'red');
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log(`❌ Seed script failed: ${error.message}`, 'red');
  process.exit(1);
});
