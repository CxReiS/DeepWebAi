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

// Development Configuration
// Database olmadan development environment için basit config

export const developmentConfig = {
  // Skip database connections in development
  skipDatabase: process.env.SKIP_DB_CONNECTION === 'true' || !process.env.DATABASE_URL?.includes('neon.tech'),
  
  // Skip heavy operations
  skipMigrations: process.env.SKIP_MIGRATIONS === 'true',
  skipAnalytics: process.env.SKIP_ANALYTICS === 'true', 
  skipSentry: process.env.SKIP_SENTRY === 'true',
  
  // Mock services for development
  useMockDatabase: true,
  useMockAuth: false, // Keep auth for testing
  useMockFeatureFlags: false, // Keep feature flags (GrowthBook)
  
  // Development defaults
  port: parseInt(process.env.PORT || '8000'),
  host: process.env.HOST || 'localhost',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Default secrets for development
  jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret-32-characters-long',
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'development-nextauth-secret-32-characters-long',
  
  // Mock API keys
  openaiApiKey: process.env.OPENAI_API_KEY || 'sk-mock-openai-key-for-development',
  
  // GrowthBook (real keys)
  growthbookClientKey: process.env.GROWTHBOOK_CLIENT_KEY || 'sdk-CijMaMxaByGXrUoN',
  growthbookApiKey: process.env.GROWTHBOOK_API_KEY || ''
};

// Mock database operations for development
export const mockDatabase = {
  async query(sql: string, params?: any[]) {
    console.log(`[MOCK DB] Query: ${sql}`);
    
    // Mock responses for common queries
    if (sql.includes('SELECT') && sql.includes('users')) {
      return {
        rows: [
          {
            id: 'dev-user-123',
            email: 'dev@deepwebai.com',
            username: 'devuser',
            role: 'user'
          }
        ]
      };
    }
    
    if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
      return { rowCount: 1 };
    }
    
    return { rows: [] };
  },
  
  async connect() {
    console.log('[MOCK DB] Connected');
  },
  
  async end() {
    console.log('[MOCK DB] Disconnected');
  }
};

// Check if we're in development mode
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
};

export const shouldSkipDatabase = () => {
  return isDevelopment() && developmentConfig.skipDatabase;
};
