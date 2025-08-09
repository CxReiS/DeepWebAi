import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthJSService } from '../../packages/backend/src/auth/index.js';
import { MFAService, MFAType } from '../../packages/backend/src/auth/mfa.js';
import { OAuthService, OAuthProvider } from '../../packages/backend/src/auth/oauth.js';
import { sql } from '../../packages/backend/lib/neon-client.js';
import speakeasy from 'speakeasy';

// Mock external dependencies
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrcode')
  }
}));

// NextAuth.js + MFA + OAuth entegrasyon test akÄ±ÅŸÄ±
// NextAuth.js 5.0.0-beta.26 kullanÄ±lÄ±yor
// API uyumluluÄŸu korunarak kimlik doÄŸrulama, MFA ve OAuth akÄ±ÅŸlarÄ± test ediliyor
describe('NextAuth.js + MFA + OAuth Integration Flow', () => {
  beforeEach(async () => {
    // Clean up all test data
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%integrationtest%'`;

    mockFetch.mockReset();
  });

  afterEach(async () => {
    // Clean up all test data
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%integrationtest%'`;
  });

  describe('Complete User Registration with MFA Setup', () => {
    it('should complete full user registration with TOTP setup', async () => {
      // 1. KullanÄ±cÄ± kaydÄ± - NextAuth.js ile kayÄ±t iÅŸlemi
      const userData = {
        email: 'integrationtest@test.com',
        username: 'integrationtest',
        password: 'TestPassword123!',
        displayName: 'Integration Test User'
      };

      const registerResult = await AuthJSService.register(userData);
      expect(registerResult.user.email).toBe(userData.email);
      expect(registerResult.token).toBeDefined();

      const userId = registerResult.user.id;

      // 2. Generate TOTP secret
      const totpSetup = await MFAService.generateTOTPSecret(userId, 'IntegrationTest');
      expect(totpSetup.secret).toBeDefined();
      expect(totpSetup.qrCodeUrl).toBe('data:image/png;base64,mockqrcode');

      // 3. Enable TOTP with valid token
      const token = speakeasy.totp({
        secret: totpSetup.secret,
        encoding: 'base32'
      });

      const backupCodes = await MFAService.enableTOTP({
        userId,
        token
      });

      expect(backupCodes).toHaveLength(10);

      // 4. Verify MFA is enabled
      const mfaStatus = await MFAService.getMFAStatus(userId);
      expect(mfaStatus.enabled).toBe(true);
      expect(mfaStatus.methods).toHaveLength(1);
      expect(mfaStatus.methods[0].type).toBe(MFAType.TOTP);

      // 5. Verify user requires MFA
      const requiresMFA = await MFAService.requiresMFA(userId);
      expect(requiresMFA).toBe(true);
    });

    it('should handle user registration with immediate OAuth linking', async () => {
      // 1. Mock GitHub OAuth response for new user
      const mockGitHubUser = {
        id: 12345,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'integrationtest@github.com',
        avatar_url: 'https://github.com/avatar.png'
      };

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'github_token' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { email: 'integrationtest@github.com', primary: true }
          ])
        }));

      // 2. Complete OAuth flow
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const oauthResult = await OAuthService.handleGitHubCallback('test_code', state);

      expect(oauthResult.isNewUser).toBe(true);
      expect(oauthResult.user.email).toBe('integrationtest@github.com');
      expect(oauthResult.user.isVerified).toBe(true); // OAuth users are auto-verified

      // 3. Verify OAuth account is linked
      const oauthAccounts = await OAuthService.getUserOAuthAccounts(oauthResult.user.id);
      expect(oauthAccounts).toHaveLength(1);
      expect(oauthAccounts[0].provider).toBe(OAuthProvider.GITHUB);

      // 4. Setup MFA for OAuth user
      const totpSetup = await MFAService.generateTOTPSecret(oauthResult.user.id);
      const token = speakeasy.totp({
        secret: totpSetup.secret,
        encoding: 'base32'
      });

      const backupCodes = await MFAService.enableTOTP({
        userId: oauthResult.user.id,
        token
      });

      expect(backupCodes).toHaveLength(10);

      // 5. Verify OAuth user now has MFA enabled
      const mfaStatus = await MFAService.getMFAStatus(oauthResult.user.id);
      expect(mfaStatus.enabled).toBe(true);
    });
  });

  describe('Login Flow with MFA Challenge', () => {
    let testUser: any;
    let totpSecret: string;

    beforeEach(async () => {
      // Setup user with MFA
      const userData = {
        email: 'mfalogintest@test.com',
        username: 'mfalogintest',
        password: 'TestPassword123!'
      };

      testUser = await AuthJSService.register(userData);

      // Enable TOTP
      const secretResult = await MFAService.generateTOTPSecret(testUser.user.id);
      totpSecret = secretResult.secret;

      const token = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      await MFAService.enableTOTP({
        userId: testUser.user.id,
        token
      });
    });

    it('should complete login flow with MFA challenge', async () => {
      // 1. Initial login (should succeed but not create full session due to MFA)
      const loginData = {
        email: 'mfalogintest@test.com',
        password: 'TestPassword123!'
      };

      const loginResult = await AuthJSService.login(loginData);
      expect(loginResult.user.id).toBe(testUser.user.id);

      // 2. Check if user requires MFA
      const requiresMFA = await MFAService.requiresMFA(testUser.user.id);
      expect(requiresMFA).toBe(true);

      // 3. Create MFA challenge
      const mfaChallenge = await MFAService.createMFAChallenge(
        testUser.user.id,
        loginResult.session.id
      );

      expect(mfaChallenge.challengeId).toBeDefined();
      expect(mfaChallenge.availableMethods).toContain(MFAType.TOTP);
      expect(mfaChallenge.availableMethods).toContain(MFAType.BACKUP_CODES);

      // 4. Verify MFA challenge with TOTP
      const mfaToken = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      const challengeResult = await MFAService.verifyMFAChallenge(
        mfaChallenge.challengeId,
        mfaToken,
        MFAType.TOTP
      );

      expect(challengeResult.success).toBe(true);
      expect(challengeResult.userId).toBe(testUser.user.id);
      expect(challengeResult.sessionId).toBe(loginResult.session.id);

      // 5. NextAuth.js session doğrulama - token ile
      const sessionValidation = await AuthJSService.validateSession(loginResult.token);
      expect(sessionValidation).not.toBeNull();
      expect(sessionValidation!.user.id).toBe(testUser.user.id);
    });

    it('should handle MFA challenge with backup code', async () => {
      // 1. Login user
      const loginResult = await AuthJSService.login({
        email: 'mfalogintest@test.com',
        password: 'TestPassword123!'
      });

      // 2. Get backup codes
      const mfaStatus = await MFAService.getMFAStatus(testUser.user.id);
      const secretResult = await sql`
        SELECT backup_codes FROM user_mfa_secrets 
        WHERE user_id = ${testUser.user.id} AND type = ${MFAType.TOTP}
      `;
      const backupCodes = JSON.parse(secretResult[0].backup_codes);

      // 3. Create and verify MFA challenge with backup code
      const mfaChallenge = await MFAService.createMFAChallenge(
        testUser.user.id,
        loginResult.session.id
      );

      const challengeResult = await MFAService.verifyMFAChallenge(
        mfaChallenge.challengeId,
        backupCodes[0],
        MFAType.BACKUP_CODES
      );

      expect(challengeResult.success).toBe(true);

      // 4. Verify backup code is consumed
      const updatedSecretResult = await sql`
        SELECT backup_codes FROM user_mfa_secrets 
        WHERE user_id = ${testUser.user.id} AND type = ${MFAType.TOTP}
      `;
      const remainingCodes = JSON.parse(updatedSecretResult[0].backup_codes);
      expect(remainingCodes).not.toContain(backupCodes[0]);
      expect(remainingCodes).toHaveLength(9);
    });

    it('should reject expired MFA challenge', async () => {
      // 1. Login and create MFA challenge
      const loginResult = await AuthJSService.login({
        email: 'mfalogintest@test.com',
        password: 'TestPassword123!'
      });

      const mfaChallenge = await MFAService.createMFAChallenge(
        testUser.user.id,
        loginResult.session.id
      );

      // 2. Manually expire the challenge
      await sql`
        UPDATE mfa_challenges 
        SET expires_at = NOW() - INTERVAL '1 minute'
        WHERE id = ${mfaChallenge.challengeId}
      `;

      // 3. Try to verify expired challenge
      const mfaToken = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      await expect(MFAService.verifyMFAChallenge(
        mfaChallenge.challengeId,
        mfaToken,
        MFAType.TOTP
      )).rejects.toThrow('MFA challenge has expired');
    });
  });

  describe('OAuth Login with MFA', () => {
    let oauthUser: any;
    let totpSecret: string;

    beforeEach(async () => {
      // 1. Create OAuth user
      const mockGitHubUser = {
        id: 54321,
        login: 'oauthmfauser',
        name: 'OAuth MFA User',
        email: 'oauthmfatest@github.com',
        avatar_url: 'https://github.com/avatar.png'
      };

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'github_token' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { email: 'oauthmfatest@github.com', primary: true }
          ])
        }));

      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      oauthUser = await OAuthService.handleGitHubCallback('test_code', state);

      // 2. Enable MFA for OAuth user
      const secretResult = await MFAService.generateTOTPSecret(oauthUser.user.id);
      totpSecret = secretResult.secret;

      const token = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      await MFAService.enableTOTP({
        userId: oauthUser.user.id,
        token
      });
    });

    it('should handle OAuth login with MFA enabled', async () => {
      // 1. Mock subsequent OAuth login
      const mockGitHubUser = {
        id: 54321,
        login: 'oauthmfauser',
        name: 'OAuth MFA User',
        email: 'oauthmfatest@github.com',
        avatar_url: 'https://github.com/avatar.png'
      };

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'github_token_2' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { email: 'oauthmfatest@github.com', primary: true }
          ])
        }));

      // 2. OAuth login should succeed but require MFA
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const loginResult = await OAuthService.handleGitHubCallback('test_code_2', state);

      expect(loginResult.isNewUser).toBe(false);
      expect(loginResult.user.id).toBe(oauthUser.user.id);

      // 3. Check MFA requirement
      const requiresMFA = await MFAService.requiresMFA(loginResult.user.id);
      expect(requiresMFA).toBe(true);

      // 4. Complete MFA challenge
      const mfaChallenge = await MFAService.createMFAChallenge(
        loginResult.user.id,
        loginResult.session.id
      );

      const mfaToken = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      const challengeResult = await MFAService.verifyMFAChallenge(
        mfaChallenge.challengeId,
        mfaToken,
        MFAType.TOTP
      );

      expect(challengeResult.success).toBe(true);
    });
  });

  describe('Account Linking with MFA', () => {
    let passwordUser: any;
    let totpSecret: string;

    beforeEach(async () => {
      // Create password-based user with MFA
      const userData = {
        email: 'linkingtest@test.com',
        username: 'linkingtest',
        password: 'TestPassword123!'
      };

      passwordUser = await AuthJSService.register(userData);

      // Enable MFA
      const secretResult = await MFAService.generateTOTPSecret(passwordUser.user.id);
      totpSecret = secretResult.secret;

      const token = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      await MFAService.enableTOTP({
        userId: passwordUser.user.id,
        token
      });
    });

    it('should link OAuth account to existing user with MFA', async () => {
      // 1. Mock OAuth login with same email as existing user
      const mockGitHubUser = {
        id: 99999,
        login: 'linkinguser',
        name: 'Linking User',
        email: 'linkingtest@test.com', // Same email as password user
        avatar_url: 'https://github.com/avatar.png'
      };

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'github_token' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { email: 'linkingtest@test.com', primary: true }
          ])
        }));

      // 2. OAuth callback should link to existing user
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const oauthResult = await OAuthService.handleGitHubCallback('test_code', state);

      expect(oauthResult.isNewUser).toBe(false);
      expect(oauthResult.user.id).toBe(passwordUser.user.id);

      // 3. Verify OAuth account is linked
      const oauthAccounts = await OAuthService.getUserOAuthAccounts(passwordUser.user.id);
      expect(oauthAccounts).toHaveLength(1);
      expect(oauthAccounts[0].provider).toBe(OAuthProvider.GITHUB);

      // 4. Verify MFA is still required
      const requiresMFA = await MFAService.requiresMFA(passwordUser.user.id);
      expect(requiresMFA).toBe(true);

      // 5. Test MFA still works after OAuth linking
      const mfaChallenge = await MFAService.createMFAChallenge(
        passwordUser.user.id,
        oauthResult.session.id
      );

      const mfaToken = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      const challengeResult = await MFAService.verifyMFAChallenge(
        mfaChallenge.challengeId,
        mfaToken,
        MFAType.TOTP
      );

      expect(challengeResult.success).toBe(true);
    });

    it('should prevent unlinking OAuth when it would leave only password auth', async () => {
      // 1. Link OAuth account
      await OAuthService.linkOAuthAccount({
        userId: passwordUser.user.id,
        provider: OAuthProvider.DISCORD,
        providerUserId: 'discord_123',
        providerEmail: 'linkingtest@discord.com'
      });

      // 2. Verify both auth methods exist
      const oauthAccounts = await OAuthService.getUserOAuthAccounts(passwordUser.user.id);
      expect(oauthAccounts).toHaveLength(1);

      // 3. Should be able to unlink OAuth (password auth remains)
      await expect(OAuthService.unlinkOAuthAccount(
        passwordUser.user.id,
        OAuthProvider.DISCORD
      )).resolves.not.toThrow();

      // 4. Verify OAuth is unlinked
      const remainingAccounts = await OAuthService.getUserOAuthAccounts(passwordUser.user.id);
      expect(remainingAccounts).toHaveLength(0);

      // 5. Verify MFA still works with password auth
      const loginResult = await AuthJSService.login({
        email: 'linkingtest@test.com',
        password: 'TestPassword123!'
      });

      const mfaChallenge = await MFAService.createMFAChallenge(
        passwordUser.user.id,
        loginResult.session.id
      );

      const mfaToken = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      const challengeResult = await MFAService.verifyMFAChallenge(
        mfaChallenge.challengeId,
        mfaToken,
        MFAType.TOTP
      );

      expect(challengeResult.success).toBe(true);
    });
  });

  describe('MFA Disable and Recovery', () => {
    let testUser: any;
    let backupCodes: string[];

    beforeEach(async () => {
      // Setup user with MFA and backup codes
      const userData = {
        email: 'recoverytest@test.com',
        username: 'recoverytest',
        password: 'TestPassword123!'
      };

      testUser = await AuthJSService.register(userData);

      const secretResult = await MFAService.generateTOTPSecret(testUser.user.id);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });

      backupCodes = await MFAService.enableTOTP({
        userId: testUser.user.id,
        token
      });
    });

    it('should disable MFA and allow normal login', async () => {
      // 1. Verify MFA is initially enabled
      let requiresMFA = await MFAService.requiresMFA(testUser.user.id);
      expect(requiresMFA).toBe(true);

      // 2. Disable MFA
      await MFAService.disableMFA(testUser.user.id, MFAType.TOTP);

      // 3. Verify MFA is disabled
      requiresMFA = await MFAService.requiresMFA(testUser.user.id);
      expect(requiresMFA).toBe(false);

      const mfaStatus = await MFAService.getMFAStatus(testUser.user.id);
      expect(mfaStatus.enabled).toBe(false);
      expect(mfaStatus.methods).toHaveLength(0);

      // 4. Verify normal login works without MFA
      const loginResult = await AuthJSService.login({
        email: 'recoverytest@test.com',
        password: 'TestPassword123!'
      });

      expect(loginResult.user.id).toBe(testUser.user.id);
      expect(loginResult.session).toBeDefined();
      expect(loginResult.token).toBeDefined();

      // 5. Verify session is immediately valid (no MFA challenge needed)
      const sessionValidation = await AuthJSService.validateSession(loginResult.session.id);
      expect(sessionValidation).not.toBeNull();
    });

    it('should regenerate backup codes', async () => {
      // 1. Verify initial backup codes work
      const initialCode = backupCodes[0];
      let result = await MFAService.verifyBackupCode(testUser.user.id, initialCode);
      expect(result).toBe(true);

      // 2. Regenerate backup codes
      const newBackupCodes = await MFAService.regenerateBackupCodes(testUser.user.id);
      expect(newBackupCodes).toHaveLength(10);
      expect(newBackupCodes).not.toEqual(backupCodes);

      // 3. Verify old codes no longer work
      result = await MFAService.verifyBackupCode(testUser.user.id, backupCodes[1]);
      expect(result).toBe(false);

      // 4. Verify new codes work
      result = await MFAService.verifyBackupCode(testUser.user.id, newBackupCodes[0]);
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent MFA challenges', async () => {
      // 1. Setup user with MFA
      const userData = {
        email: 'concurrenttest@test.com',
        username: 'concurrenttest',
        password: 'TestPassword123!'
      };

      const testUser = await AuthJSService.register(userData);
      const secretResult = await MFAService.generateTOTPSecret(testUser.user.id);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUser.user.id, token });

      // 2. Login and create multiple sessions
      const login1 = await AuthJSService.login({
        email: 'concurrenttest@test.com',
        password: 'TestPassword123!'
      });

      const login2 = await AuthJSService.login({
        email: 'concurrenttest@test.com',
        password: 'TestPassword123!'
      });

      // 3. Create multiple MFA challenges
      const challenge1 = await MFAService.createMFAChallenge(
        testUser.user.id,
        login1.session.id
      );

      const challenge2 = await MFAService.createMFAChallenge(
        testUser.user.id,
        login2.session.id
      );

      expect(challenge1.challengeId).not.toBe(challenge2.challengeId);

      // 4. Verify both challenges work independently
      const mfaToken1 = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });

      const result1 = await MFAService.verifyMFAChallenge(
        challenge1.challengeId,
        mfaToken1,
        MFAType.TOTP
      );

      expect(result1.success).toBe(true);
      expect(result1.sessionId).toBe(login1.session.id);

      // Second challenge should still be valid
      const mfaToken2 = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });

      const result2 = await MFAService.verifyMFAChallenge(
        challenge2.challengeId,
        mfaToken2,
        MFAType.TOTP
      );

      expect(result2.success).toBe(true);
      expect(result2.sessionId).toBe(login2.session.id);
    });

    it('should handle OAuth callback with invalid state gracefully', async () => {
      // Mock GitHub OAuth response
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'token' })
      }));

      // Should reject with invalid state
      await expect(OAuthService.handleGitHubCallback('code', 'invalid_state'))
        .rejects.toThrow('Invalid OAuth state');

      // Verify no user was created
      const userCount = await sql`
        SELECT COUNT(*) as count FROM users WHERE email LIKE '%github%'
      `;
      expect(parseInt(userCount[0].count)).toBe(0);
    });

    it('should handle user deletion with cleanup', async () => {
      // 1. Create user with MFA and OAuth
      const userData = {
        email: 'deletetest@test.com',
        username: 'deletetest',
        password: 'TestPassword123!'
      };

      const testUser = await AuthJSService.register(userData);

      // Setup MFA
      const secretResult = await MFAService.generateTOTPSecret(testUser.user.id);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUser.user.id, token });

      // Link OAuth
      await OAuthService.linkOAuthAccount({
        userId: testUser.user.id,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_delete_test',
        providerEmail: 'deletetest@github.com'
      });

      // 2. Verify data exists
      let mfaSecrets = await sql`
        SELECT COUNT(*) as count FROM user_mfa_secrets WHERE user_id = ${testUser.user.id}
      `;
      let oauthAccounts = await sql`
        SELECT COUNT(*) as count FROM user_oauth_accounts WHERE user_id = ${testUser.user.id}
      `;

      expect(parseInt(mfaSecrets[0].count)).toBe(1);
      expect(parseInt(oauthAccounts[0].count)).toBe(1);

      // 3. Delete user (cascade should clean up related data)
      await sql`DELETE FROM users WHERE id = ${testUser.user.id}`;

      // 4. Verify cleanup
      mfaSecrets = await sql`
        SELECT COUNT(*) as count FROM user_mfa_secrets WHERE user_id = ${testUser.user.id}
      `;
      oauthAccounts = await sql`
        SELECT COUNT(*) as count FROM user_oauth_accounts WHERE user_id = ${testUser.user.id}
      `;

      expect(parseInt(mfaSecrets[0].count)).toBe(0);
      expect(parseInt(oauthAccounts[0].count)).toBe(0);
    });
  });
});
