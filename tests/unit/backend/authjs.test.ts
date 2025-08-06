import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthJSService, LoginSchema, RegisterSchema } from '../../../packages/backend/src/auth/authjs-service.js';
import { sql } from '../../../packages/backend/src/lib/neon-client.js';
import * as testUtils from '../../helpers/test-utils.js';

// Mock NextAuth
vi.mock('next-auth', () => ({
  NextAuth: () => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn()
  })
}));

// Mock auth functions
const mockAuth = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../../../packages/backend/src/auth/authjs-service.js', async () => {
  const actual = await vi.importActual('../../../packages/backend/src/auth/authjs-service.js');
  return {
    ...actual,
    auth: mockAuth,
    signIn: mockSignIn,
    signOut: mockSignOut
  };
});

describe('Auth.js Service', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%authjs%'`;
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%authjs%'`;
  });

  describe('User Registration', () => {
    it('should register a new user successfully with Auth.js', async () => {
      const userData = testUtils.createTestUser({
        email: 'authjs@test.com',
        username: 'authjs_user'
      });

      // Mock successful sign in
      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: userData.email,
          name: userData.displayName
        }
      });

      const result = await AuthJSService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.role).toBe('user');
      expect(result.user.isVerified).toBe(false);

      // Verify user was created in database
      const dbUser = await sql`
        SELECT email, username, password_hash FROM users WHERE email = ${userData.email}
      `;
      
      expect(dbUser).toHaveLength(1);
      expect(dbUser[0].email).toBe(userData.email);
      expect(dbUser[0].password_hash).not.toBe(userData.password);
    });

    it('should hash password correctly', async () => {
      const userData = testUtils.createTestUser({
        email: 'hash_authjs@test.com',
        username: 'hash_authjs'
      });

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: 'test-id', email: userData.email }
      });

      await AuthJSService.register(userData);

      const dbUser = await sql`
        SELECT password_hash FROM users WHERE email = ${userData.email}
      `;

      expect(dbUser[0].password_hash).not.toBe(userData.password);
      expect(dbUser[0].password_hash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('should reject duplicate email registration', async () => {
      const userData = testUtils.createTestUser({
        email: 'duplicate_authjs@test.com',
        username: 'user1'
      });

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: 'test-id', email: userData.email }
      });

      await AuthJSService.register(userData);

      // Try to register with same email
      const duplicateData = { ...userData, username: 'user2' };
      
      await expect(AuthJSService.register(duplicateData))
        .rejects.toThrow('User with this email or username already exists');
    });

    it('should reject duplicate username registration', async () => {
      const userData = testUtils.createTestUser({
        email: 'user1_authjs@test.com',
        username: 'duplicate_authjs'
      });

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: 'test-id', email: userData.email }
      });

      await AuthJSService.register(userData);

      // Try to register with same username
      const duplicateData = { ...userData, email: 'user2_authjs@test.com' };
      
      await expect(AuthJSService.register(duplicateData))
        .rejects.toThrow('User with this email or username already exists');
    });
  });

  describe('User Login', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'login_authjs@test.com',
        username: 'login_authjs'
      });

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', email: userData.email }
      });

      testUser = await AuthJSService.register(userData);
    });

    it('should login with correct credentials using Auth.js', async () => {
      const loginData = {
        email: 'login_authjs@test.com',
        password: 'TestPassword123!'
      };

      // Mock successful Auth.js login
      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: {
          id: testUser.user.id,
          email: loginData.email,
          name: 'Test User'
        }
      });

      const result = await AuthJSService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginData.email);
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: loginData.email,
        password: loginData.password,
        redirect: false
      });
    });

    it('should reject login with Auth.js error', async () => {
      const loginData = {
        email: 'login_authjs@test.com',
        password: 'WrongPassword123!'
      };

      // Mock Auth.js error
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' });

      await expect(AuthJSService.login(loginData))
        .rejects.toThrow('Invalid email or password');
    });

    it('should handle failed session creation', async () => {
      const loginData = {
        email: 'login_authjs@test.com',
        password: 'TestPassword123!'
      };

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue(null); // No session

      await expect(AuthJSService.login(loginData))
        .rejects.toThrow('Failed to create session');
    });

    it('should update last login timestamp', async () => {
      const loginData = {
        email: 'login_authjs@test.com',
        password: 'TestPassword123!'
      };

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: testUser.user.id, email: loginData.email }
      });

      const beforeLogin = new Date();
      await AuthJSService.login(loginData);

      const user = await sql`
        SELECT last_login_at FROM users WHERE email = ${loginData.email}
      `;

      expect(new Date(user[0].last_login_at)).toBeInstanceOf(Date);
      expect(new Date(user[0].last_login_at).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('Session Management', () => {
    it('should validate active session with Auth.js', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'session_authjs@test.com',
          name: 'Test User'
        }
      };

      mockAuth.mockResolvedValue(mockSession);

      const result = await AuthJSService.validateSession('dummy-token');

      expect(result).not.toBeNull();
      expect(result!.user.id).toBe(mockSession.user.id);
      expect(result!.session).toBe(mockSession);
    });

    it('should return null for invalid session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await AuthJSService.validateSession('invalid-token');
      expect(result).toBeNull();
    });

    it('should handle session validation errors', async () => {
      mockAuth.mockRejectedValue(new Error('Session error'));

      const result = await AuthJSService.validateSession('error-token');
      expect(result).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should logout using Auth.js signOut', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await expect(AuthJSService.logout()).resolves.not.toThrow();
      expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    });
  });

  describe('Password Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'password_authjs@test.com',
        username: 'password_authjs'
      });

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', email: userData.email }
      });

      testUser = await AuthJSService.register(userData);
    });

    it('should change password and sign out', async () => {
      const changeData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewPassword456!'
      };

      mockSignOut.mockResolvedValue(undefined);

      await expect(AuthJSService.changePassword(testUser.user.id, changeData))
        .resolves.not.toThrow();

      // Verify password was changed in database
      const user = await sql`
        SELECT password_hash FROM users WHERE id = ${testUser.user.id}
      `;

      // Verify new password hash is different
      const isNewPassword = await AuthJSService.verifyPassword(
        changeData.newPassword, 
        user[0].password_hash
      );
      expect(isNewPassword).toBe(true);

      // Verify old password no longer works
      const isOldPassword = await AuthJSService.verifyPassword(
        changeData.currentPassword, 
        user[0].password_hash
      );
      expect(isOldPassword).toBe(false);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should reject password change with incorrect current password', async () => {
      const changeData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!'
      };

      await expect(AuthJSService.changePassword(testUser.user.id, changeData))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('Profile Management', () => {
    let testUser: any;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'profile_authjs@test.com',
        username: 'profile_authjs'
      });

      mockSignIn.mockResolvedValue({ error: null });
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', email: userData.email }
      });

      testUser = await AuthJSService.register(userData);
    });

    it('should update user profile', async () => {
      const updates = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
        preferences: { theme: 'dark' }
      };

      const result = await AuthJSService.updateProfile(testUser.user.id, updates);

      expect(result.displayName).toBe(updates.displayName);
      expect(result.preferences).toEqual(updates.preferences);
    });

    it('should get user by ID', async () => {
      const user = await AuthJSService.getUserById(testUser.user.id);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(testUser.user.id);
      expect(user!.email).toBe('profile_authjs@test.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await AuthJSService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('JWT Token Compatibility', () => {
    it('should generate compatibility token', () => {
      const userId = 'test-user-id';
      const token = AuthJSService.generateJWT(userId);

      expect(token).toBeTypeOf('string');
      expect(token).toContain('authjs_');
      expect(token).toContain(userId);
    });

    it('should verify compatibility token', () => {
      const userId = 'test-user-id';
      const token = AuthJSService.generateJWT(userId);
      const payload = AuthJSService.verifyJWT(token);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(userId);
    });

    it('should reject invalid compatibility token', () => {
      const payload = AuthJSService.verifyJWT('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('Password Utilities', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthJSService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthJSService.hashPassword(password);

      const isValid = await AuthJSService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthJSService.verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Schema Validation', () => {
    it('should validate registration schema', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        displayName: 'Test User'
      };

      expect(() => RegisterSchema.parse(validData)).not.toThrow();

      const invalidData = {
        email: 'invalid-email',
        username: 'ab',
        password: '123'
      };

      expect(() => RegisterSchema.parse(invalidData)).toThrow();
    });

    it('should validate login schema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password'
      };

      expect(() => LoginSchema.parse(validData)).not.toThrow();

      const invalidData = {
        email: 'invalid-email',
        password: ''
      };

      expect(() => LoginSchema.parse(invalidData)).toThrow();
    });
  });
});
