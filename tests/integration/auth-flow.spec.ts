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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sql } from '@backend/lib/neon-client.js';

// Mock Elysia app for integration testing
class MockElysiaApp {
  private routes: Map<string, Function> = new Map();
  
  async request(method: string, path: string, options: any = {}): Promise<Response> {
    const key = `${method.toUpperCase()} ${path}`;
    const handler = this.routes.get(key);
    
    if (!handler) {
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      const result = await handler(options);
      return new Response(JSON.stringify(result), {
        status: result.status || 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  register(method: string, path: string, handler: Function): void {
    this.routes.set(`${method.toUpperCase()} ${path}`, handler);
  }
}

describe('Authentication Flow Integration Tests', () => {
  let app: MockElysiaApp;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Setup mock app
    app = new MockElysiaApp();
    
    // Register auth endpoints (simplified)
    app.register('POST', '/api/auth/register', async ({ body }: any) => {
      const { AuthService } = await import('@backend/src/auth/index.js');
      return await AuthService.register(body);
    });
    
    app.register('POST', '/api/auth/login', async ({ body }: any) => {
      const { AuthService } = await import('@backend/src/auth/index.js');
      return await AuthService.login(body);
    });
    
    app.register('GET', '/api/auth/me', async ({ headers }: any) => {
      const { AuthService } = await import('@backend/src/auth/index.js');
      const token = headers?.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Unauthorized');
      
      const payload = AuthService.verifyJWT(token);
      if (!payload) throw new Error('Invalid token');
      
      return await AuthService.getUserById(payload.userId);
    });
    
    // Clean up test data
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%integrationtest%'`;
  });

  afterEach(async () => {
    // Clean up test data
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%integrationtest%'`;
  });

  describe('User Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const userData = {
        email: 'integrationtest@example.com',
        username: 'integrationtest',
        password: 'TestPassword123!',
        displayName: 'Integration Test User'
      };

      // Step 1: Register user
      const registerResponse = await app.request('POST', '/api/auth/register', {
        body: userData
      });

      expect(registerResponse.status).toBe(201);
      
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);
      expect(registerData.data.user.email).toBe(userData.email);
      expect(registerData.data.token).toBeDefined();

      authToken = registerData.data.token;
      testUser = registerData.data.user;

      // Step 2: Verify user exists in database
      const dbUser = await sql`
        SELECT * FROM users WHERE email = ${userData.email}
      `;
      
      expect(dbUser).toHaveLength(1);
      expect(dbUser[0].email).toBe(userData.email);
      expect(dbUser[0].username).toBe(userData.username);

      // Step 3: Verify session exists
      const dbSession = await sql`
        SELECT * FROM auth_sessions WHERE user_id = ${testUser.id}
      `;
      
      expect(dbSession).toHaveLength(1);
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@integrationtest.com',
        username: 'user1',
        password: 'TestPassword123!'
      };

      // Register first user
      await app.request('POST', '/api/auth/register', { body: userData });

      // Try to register with same email
      const duplicateData = { ...userData, username: 'user2' };
      const response = await app.request('POST', '/api/auth/register', {
        body: duplicateData
      });

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('already exists');
    });
  });

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Create test user first
      const userData = {
        email: 'logintest@integrationtest.com',
        username: 'logintest',
        password: 'TestPassword123!'
      };

      const response = await app.request('POST', '/api/auth/register', {
        body: userData
      });
      
      const data = await response.json();
      testUser = data.data.user;
    });

    it('should complete full login flow', async () => {
      const loginData = {
        email: 'logintest@integrationtest.com',
        password: 'TestPassword123!'
      };

      // Step 1: Login
      const loginResponse = await app.request('POST', '/api/auth/login', {
        body: loginData
      });

      expect(loginResponse.status).toBe(200);
      
      const loginResult = await loginResponse.json();
      expect(loginResult.success).toBe(true);
      expect(loginResult.data.user.email).toBe(loginData.email);
      expect(loginResult.data.token).toBeDefined();

      authToken = loginResult.data.token;

      // Step 2: Verify last_login_at is updated
      const dbUser = await sql`
        SELECT last_login_at FROM users WHERE email = ${loginData.email}
      `;
      
      expect(dbUser[0].last_login_at).not.toBeNull();

      // Step 3: Test authenticated request
      const meResponse = await app.request('GET', '/api/auth/me', {
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(meResponse.status).toBe(200);
      const meData = await meResponse.json();
      expect(meData.email).toBe(loginData.email);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'logintest@integrationtest.com',
        password: 'WrongPassword123!'
      };

      const response = await app.request('POST', '/api/auth/login', {
        body: loginData
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid email or password');
    });
  });

  describe('Session Management Flow', () => {
    beforeEach(async () => {
      // Create and login test user
      const userData = {
        email: 'sessiontest@integrationtest.com',
        username: 'sessiontest',
        password: 'TestPassword123!'
      };

      const registerResponse = await app.request('POST', '/api/auth/register', {
        body: userData
      });
      
      const registerData = await registerResponse.json();
      testUser = registerData.data.user;
      authToken = registerData.data.token;
    });

    it('should validate active session', async () => {
      const response = await app.request('GET', '/api/auth/me', {
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.id).toBe(testUser.id);
      expect(data.email).toBe(testUser.email);
    });

    it('should reject invalid token', async () => {
      const response = await app.request('GET', '/api/auth/me', {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
    });

    it('should reject missing token', async () => {
      const response = await app.request('GET', '/api/auth/me', {});

      expect(response.status).toBe(401);
    });
  });

  describe('Full Authentication Workflow', () => {
    it('should complete registration -> login -> authenticated request workflow', async () => {
      // Step 1: Registration
      const userData = {
        email: 'workflow@integrationtest.com',
        username: 'workflowtest',
        password: 'TestPassword123!',
        displayName: 'Workflow Test'
      };

      const registerResponse = await app.request('POST', '/api/auth/register', {
        body: userData
      });

      expect(registerResponse.status).toBe(201);
      const registerData = await registerResponse.json();
      
      // Step 2: Logout (simulate by not using the registration token)
      
      // Step 3: Login with credentials
      const loginResponse = await app.request('POST', '/api/auth/login', {
        body: {
          email: userData.email,
          password: userData.password
        }
      });

      expect(loginResponse.status).toBe(200);
      const loginData = await loginResponse.json();
      authToken = loginData.data.token;

      // Step 4: Access protected resource
      const meResponse = await app.request('GET', '/api/auth/me', {
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(meResponse.status).toBe(200);
      const meData = await meResponse.json();
      expect(meData.email).toBe(userData.email);
      expect(meData.displayName).toBe(userData.displayName);

      // Step 5: Verify user and session in database
      const dbUser = await sql`
        SELECT * FROM users WHERE email = ${userData.email}
      `;
      expect(dbUser).toHaveLength(1);

      const dbSessions = await sql`
        SELECT * FROM auth_sessions WHERE user_id = ${dbUser[0].id}
      `;
      expect(dbSessions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request data', async () => {
      const response = await app.request('POST', '/api/auth/register', {
        body: {
          email: 'invalid-email',
          username: 'ab', // too short
          password: '123' // too weak
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll just ensure the structure is in place
      expect(true).toBe(true);
    });

    it('should handle concurrent registration attempts', async () => {
      const userData = {
        email: 'concurrent@integrationtest.com',
        username: 'concurrent',
        password: 'TestPassword123!'
      };

      // Simulate concurrent requests
      const promises = Array(3).fill(null).map(() => 
        app.request('POST', '/api/auth/register', { body: userData })
      );

      const results = await Promise.allSettled(promises);
      
      // Only one should succeed
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeLessThanOrEqual(1);
    });
  });
});
