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

// Database seeding script
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: join(__dirname, '../.env') });

interface UserCountResult {
  count: number;
}

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding database...');
    
    // Check if DATABASE_URL is provided
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found. Skipping seeding in development mode.');
      process.exit(0);
    }

    // Import neon client
    const { sql } = await import('../database/neon-config.js');
    
    // Check if already seeded
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users` as UserCountResult[];
    if (existingUsers[0].count > 0) {
      console.log('📊 Database already has data. Skipping seed.');
      return;
    }

    console.log('📝 Running seed data...');

    // Create admin user
    const adminId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, username, role, display_name, is_verified, created_at)
      VALUES (
        ${adminId},
        'admin@deepwebai.com',
        'admin',
        'admin',
        'System Administrator',
        true,
        NOW()
      )
    `;

    // Create test user
    const testUserId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, email, username, role, display_name, is_verified, created_at)
      VALUES (
        ${testUserId},
        'test@deepwebai.com',
        'testuser',
        'user',
        'Test User',
        true,
        NOW()
      )
    `;

    // Create sample conversation
    const conversationId = crypto.randomUUID();
    await sql`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (
        ${conversationId},
        ${testUserId},
        'Welcome to DeepWebAI',
        NOW(),
        NOW()
      )
    `;

    // Create sample messages
    const messageId1 = crypto.randomUUID();
    const messageId2 = crypto.randomUUID();
    
    await sql`
      INSERT INTO messages (id, conversation_id, role, content, token_count, created_at)
      VALUES 
        (
          ${messageId1},
          ${conversationId},
          'user',
          'Hello! What can you help me with?',
          8,
          NOW()
        ),
        (
          ${messageId2},
          ${conversationId},
          'assistant',
          'Hello! I''m DeepWebAI, your AI assistant. I can help you with various tasks including answering questions, writing, analysis, and more. What would you like to explore today?',
          35,
          NOW()
        )
    `;

    console.log('✅ Admin user created: admin@deepwebai.com');
    console.log('✅ Test user created: test@deepwebai.com');
    console.log('✅ Sample conversation created');
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Seeding failed:', errorMessage);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
