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
import { AuthService, RegisterSchema, LoginSchema } from '@backend/src/auth/index.js';
import { sql } from '@backend/lib/neon-client.js';

describe('Authentication Service', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%test%'`;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%test%'`;
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = testUtils.createTestUser({
        email: 'newuser@test.com',
        username: 'newuser'
      });

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.role).toBe('user');
      expect(result.user.isVerified).toBe(false);
    });

    it('should hash the password correctly', async () => {
      const userData = testUtils.createTestUser({
        email: 'hashtest@test.com',
        username: 'hashtest'
      });

      await AuthService.register(userData);

      // Check that password is hashed in database
      const dbUser = await sql`
        SELECT password_hash FROM users WHERE email = ${userData.email}
      `;

      expect(dbUser[0].password_hash).not.toBe(userData.password);
      expect(dbUser[0].password_hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should reject registration with duplicate email', async () => {
      const userData = testUtils.createTestUser({
        email: 'duplicate@test.com',
        username: 'user1'
      });

      await AuthService.register(userData);

      // Try to register with same email but different username
      const duplicateData = { ...userData, username: 'user2' };

      await expect(AuthService.register(duplicateData))
        .rejects.toThrow('User with this email or username already exists');
    });

    it('should reject registration with duplicate username', async () => {
      const userData = testUtils.createTestUser({
        email: 'user1@test.com',
        username: 'duplicate'
      });

      await AuthService.register(userData);

      // Try to register with same username but different email
      const duplicateData = { ...userData, email: 'user2@test.com' };

      await expect(AuthService.register(duplicateData))
        .rejects.toThrow('User with this email or username already exists');
    });

    it('should validate registration data with schema', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab', // too short
        password: '123' // too weak
      };

      expect(() => RegisterSchema.parse(invalidData))
        .toThrow();
    });
  });

  describe('User Login', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = testUtils.createTestUser({
        email: 'logintest@test.com',
        username: 'logintest'
      });
      
      testUser = await AuthService.register(userData);
    });

    it('should login with correct credentials', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'TestPassword123!'
      };

      const result = await AuthService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginData.email);
    });

    it('should reject login with incorrect email', async () => {
      const loginData = {
        email: 'wrong@test.com',
        password: 'TestPassword123!'
      };

      await expect(AuthService.login(loginData))
        .rejects.toThrow('Invalid email or password');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'WrongPassword123!'
      };

      await expect(AuthService.login(loginData))
        .rejects.toThrow('Invalid email or password');
    });

    it('should update last login timestamp', async () => {
      const loginData = {
        email: 'logintest@test.com',
        password: 'TestPassword123!'
      };

      const beforeLogin = new Date();
      await AuthService.login(loginData);

      const user = await sql`
        SELECT last_login_at FROM users WHERE email = ${loginData.email}
      `;

      expect(new Date(user[0].last_login_at)).toBeInstanceOf(Date);
      expect(new Date(user[0].last_login_at).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('Session Management', () => {
    let testUser: any;
    let sessionId: string;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'sessiontest@test.com',
        username: 'sessiontest'
      });
      
      testUser = await AuthService.register(userData);
      sessionId = testUser.session.id;
    });

    it('should validate active session', async () => {
      const result = await AuthService.validateSession(sessionId);

      expect(result).not.toBeNull();
      expect(result!.user.id).toBe(testUser.user.id);
      expect(result!.session.id).toBe(sessionId);
    });

    it('should invalidate session on logout', async () => {
      await AuthService.logout(sessionId);

      const result = await AuthService.validateSession(sessionId);
      expect(result).toBeNull();
    });

    it('should return null for invalid session ID', async () => {
      const result = await AuthService.validateSession('invalid-session-id');
      expect(result).toBeNull();
    });
  });

  describe('Password Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'passwordtest@test.com',
        username: 'passwordtest'
      });
      
      testUser = await AuthService.register(userData);
    });

    it('should change password with correct current password', async () => {
      const changeData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewPassword456!'
      };

      await expect(AuthService.changePassword(testUser.user.id, changeData))
        .resolves.not.toThrow();

      // Verify old password no longer works
      await expect(AuthService.login({
        email: 'passwordtest@test.com',
        password: 'TestPassword123!'
      })).rejects.toThrow('Invalid email or password');

      // Verify new password works
      const result = await AuthService.login({
        email: 'passwordtest@test.com',
        password: 'NewPassword456!'
      });

      expect(result.user.email).toBe('passwordtest@test.com');
    });

    it('should reject password change with incorrect current password', async () => {
      const changeData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!'
      };

      await expect(AuthService.changePassword(testUser.user.id, changeData))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('Profile Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'profiletest@test.com',
        username: 'profiletest'
      });
      
      testUser = await AuthService.register(userData);
    });

    it('should update user profile', async () => {
      const updates = {
        displayName: 'Updated Display Name',
        bio: 'Updated bio text',
        preferences: { theme: 'dark', language: 'en' }
      };

      const result = await AuthService.updateProfile(testUser.user.id, updates);

      expect(result.displayName).toBe(updates.displayName);
      expect(result.preferences).toEqual(updates.preferences);
    });

    it('should get user by ID', async () => {
      const user = await AuthService.getUserById(testUser.user.id);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(testUser.user.id);
      expect(user!.email).toBe('profiletest@test.com');
    });

    it('should return null for non-existent user ID', async () => {
      const user = await AuthService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('JWT Token Management', () => {
    it('should generate valid JWT token', () => {
      const userId = 'test-user-id';
      const sessionId = 'test-session-id';

      const token = AuthService.generateJWT(userId, sessionId);

      expect(token).toBeTypeOf('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should verify valid JWT token', () => {
      const userId = 'test-user-id';
      const sessionId = 'test-session-id';

      const token = AuthService.generateJWT(userId, sessionId);
      const payload = AuthService.verifyJWT(token);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(userId);
      expect(payload!.sessionId).toBe(sessionId);
    });

    it('should reject invalid JWT token', () => {
      const payload = AuthService.verifyJWT('invalid-token');
      expect(payload).toBeNull();
    });
  });
});
