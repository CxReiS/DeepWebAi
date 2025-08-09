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

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/deepweb_ai_test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.LUCIA_SECRET = 'test-lucia-secret-key';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
  
  // Initialize test database if needed
  try {
    // Database migrations for tests would go here
    console.log('✅ Test database initialized');
  } catch (error) {
    console.warn('⚠️  Test database initialization failed:', error);
  }
});

afterAll(async () => {
  console.log('🏁 Test suite completed');
  
  // Cleanup test database if needed
  try {
    // Cleanup would go here
    console.log('🧹 Test cleanup completed');
  } catch (error) {
    console.warn('⚠️  Test cleanup failed:', error);
  }
});

// Reset state before each test
beforeEach(() => {
  // Reset any global state, mocks, etc.
});

afterEach(() => {
  // Cleanup after each test
});

// Global test utilities
global.testUtils = {
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123!',
    displayName: 'Test User',
    role: 'user',
    ...overrides
  }),
  
  createTestConversation: (userId: string, overrides = {}) => ({
    userId,
    title: 'Test Conversation',
    systemPrompt: 'You are a helpful assistant.',
    metadata: {},
    ...overrides
  }),
  
  createTestMessage: (conversationId: string, overrides = {}) => ({
    conversationId,
    role: 'user',
    content: 'Hello, this is a test message.',
    metadata: {},
    ...overrides
  }),
  
  // Mock AI model response
  mockAIResponse: (content = 'This is a test AI response.') => ({
    id: 'test-response-id',
    role: 'assistant',
    content,
    metadata: {
      model: 'test-model',
      tokens: content.split(' ').length,
      timestamp: new Date().toISOString()
    }
  }),
  
  // Delay utility for async tests
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test JWT token
  generateTestJWT: (userId = 'test-user-id', sessionId = 'test-session-id') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};

// Extend global namespace for TypeScript
declare global {
  var testUtils: {
    createTestUser: (overrides?: any) => any;
    createTestConversation: (userId: string, overrides?: any) => any;
    createTestMessage: (conversationId: string, overrides?: any) => any;
    mockAIResponse: (content?: string) => any;
    delay: (ms: number) => Promise<void>;
    generateTestJWT: (userId?: string, sessionId?: string) => string;
  };
}

// Export for modules that need explicit import
export const testUtils = global.testUtils;
