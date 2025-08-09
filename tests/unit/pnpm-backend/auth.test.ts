import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthJSService, RegisterSchema } from '../../../packages/backend/src/auth/index.js';
import { sql } from '../../../packages/backend/src/lib/neon-client.js';

// NextAuth.js (AuthJS) entegrasyonu ile kimlik doğrulama testleri
// Lucia Auth yerine NextAuth.js 5.0.0-beta.26 kullanılıyor
// API uyumluluğu korunarak mevcut test mantığı NextAuth.js'e uyarlandı
describe('NextAuth.js Authentication Service', () => {
  beforeEach(async () => {
    // Test verileri temizleme - NextAuth.js tabloları
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%test%'`;
  });

  afterEach(async () => {
    // Test sonrası temizlik - NextAuth.js tabloları
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%test%'`;
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Yeni kullanıcı kaydı - NextAuth.js ile
      const userData = testUtils.createTestUser({
        email: 'newuser@test.com',
        username: 'newuser'
      });

      const result = await AuthJSService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user.role).toBe('user');
      expect(result.user.isVerified).toBe(false);
    });

    it('should hash the password correctly', async () => {
      // Şifre hashleme testi - NextAuth.js bcrypt entegrasyonu
      const userData = testUtils.createTestUser({
        email: 'hashtest@test.com',
        username: 'hashtest'
      });

      await AuthJSService.register(userData);

      // Check that password is hashed in database
      const dbUser = await sql`
        SELECT password_hash FROM users WHERE email = ${userData.email}
      `;

      expect(dbUser[0].password_hash).not.toBe(userData.password);
      expect(dbUser[0].password_hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt format
    });

    it('should reject registration with duplicate email', async () => {
      // Duplicate email kontrolü - NextAuth.js ile
      const userData = testUtils.createTestUser({
        email: 'duplicate@test.com',
        username: 'user1'
      });

      await AuthJSService.register(userData);

      // Try to register with same email but different username
      const duplicateData = { ...userData, username: 'user2' };

      await expect(AuthJSService.register(duplicateData))
        .rejects.toThrow('User with this email or username already exists');
    });

    it('should reject registration with duplicate username', async () => {
      // Duplicate username kontrolü - NextAuth.js ile  
      const userData = testUtils.createTestUser({
        email: 'user1@test.com',
        username: 'duplicate'
      });

      await AuthJSService.register(userData);

      // Try to register with same username but different email
      const duplicateData = { ...userData, email: 'user2@test.com' };

      await expect(AuthJSService.register(duplicateData))
        .rejects.toThrow('User with this email or username already exists');
    });

    it('should validate registration data with schema', () => {
      // Schema validasyon testi - NextAuth.js ile
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
      
      testUser = await AuthJSService.register(userData);
    });

    it('should login with correct credentials', async () => {
      // Doğru kimlik bilgileri ile giriş - NextAuth.js ile
      const loginData = {
        email: 'logintest@test.com',
        password: 'TestPassword123!'
      };

      const result = await AuthJSService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginData.email);
    });

    it('should reject login with incorrect email', async () => {
      // Yanlış email ile giriş denemesi - NextAuth.js ile
      const loginData = {
        email: 'wrong@test.com',
        password: 'TestPassword123!'
      };

      await expect(AuthJSService.login(loginData))
        .rejects.toThrow('Invalid email or password');
    });

    it('should reject login with incorrect password', async () => {
      // Yanlış şifre ile giriş denemesi - NextAuth.js ile
      const loginData = {
        email: 'logintest@test.com',
        password: 'WrongPassword123!'
      };

      await expect(AuthJSService.login(loginData))
        .rejects.toThrow('Invalid email or password');
    });

    it('should update last login timestamp', async () => {
      // Son giriş zamanı güncelleme - NextAuth.js ile
      const loginData = {
        email: 'logintest@test.com',
        password: 'TestPassword123!'
      };

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
    let testUser: any;
    let sessionToken: string;

    beforeEach(async () => {
      const userData = testUtils.createTestUser({
        email: 'sessiontest@test.com',
        username: 'sessiontest'
      });
      
      testUser = await AuthJSService.register(userData);
      sessionToken = testUser.token; // NextAuth.js token yerine session.id kullanımı
    });

    it('should validate active session', async () => {
      // Aktif session doğrulama - NextAuth.js token ile
      const result = await AuthJSService.validateSession(sessionToken);

      expect(result).not.toBeNull();
      expect(result!.user.id).toBe(testUser.user.id);
      expect(result!.session).toBeDefined();
    });

    it('should invalidate session on logout', async () => {
      // Çıkış sonrası session geçersizliği - NextAuth.js ile
      await AuthJSService.logout();

      const result = await AuthJSService.validateSession(sessionToken);
      expect(result).toBeNull();
    });

    it('should return null for invalid session token', async () => {
      // Geçersiz session token kontrolü - NextAuth.js ile
      const result = await AuthJSService.validateSession('invalid-session-token');
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
      
      testUser = await AuthJSService.register(userData);
    });

    it('should change password with correct current password', async () => {
      // Şifre değiştirme işlemi - NextAuth.js ile
      const changeData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewPassword456!'
      };

      await expect(AuthJSService.changePassword(testUser.user.id, changeData))
        .resolves.not.toThrow();

      // Verify old password no longer works
      await expect(AuthJSService.login({
        email: 'passwordtest@test.com',
        password: 'TestPassword123!'
      })).rejects.toThrow('Invalid email or password');

      // Verify new password works
      const result = await AuthJSService.login({
        email: 'passwordtest@test.com',
        password: 'NewPassword456!'
      });

      expect(result.user.email).toBe('passwordtest@test.com');
    });

    it('should reject password change with incorrect current password', async () => {
      // Yanlış mevcut şifre ile değiştirme denemesi - NextAuth.js ile
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
        email: 'profiletest@test.com',
        username: 'profiletest'
      });
      
      testUser = await AuthJSService.register(userData);
    });

    it('should update user profile', async () => {
      // Kullanıcı profil güncelleme - NextAuth.js ile
      const updates = {
        displayName: 'Updated Display Name',
        bio: 'Updated bio text',
        preferences: { theme: 'dark', language: 'en' }
      };

      const result = await AuthJSService.updateProfile(testUser.user.id, updates);

      expect(result.displayName).toBe(updates.displayName);
      expect(result.preferences).toEqual(updates.preferences);
    });

    it('should get user by ID', async () => {
      // ID ile kullanıcı getirme - NextAuth.js ile
      const user = await AuthJSService.getUserById(testUser.user.id);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(testUser.user.id);
      expect(user!.email).toBe('profiletest@test.com');
    });

    it('should return null for non-existent user ID', async () => {
      // Var olmayan kullanıcı ID kontrolü - NextAuth.js ile
      const user = await AuthJSService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('JWT Token Management', () => {
    it('should generate valid JWT token', () => {
      // JWT token üretimi - NextAuth.js ile
      const userId = 'test-user-id';
      const sessionId = 'test-session-id';

      const token = AuthJSService.generateJWT(userId, sessionId);

      expect(token).toBeTypeOf('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should verify valid JWT token', () => {
      // JWT token doğrulama - NextAuth.js ile
      const userId = 'test-user-id';
      const sessionId = 'test-session-id';

      const token = AuthJSService.generateJWT(userId, sessionId);
      const payload = AuthJSService.verifyJWT(token);

      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(userId);
      expect(payload!.sessionId).toBe(sessionId);
    });

    it('should reject invalid JWT token', () => {
      // Geçersiz JWT token kontrolü - NextAuth.js ile
      const payload = AuthJSService.verifyJWT('invalid-token');
      expect(payload).toBeNull();
    });
  });
});
