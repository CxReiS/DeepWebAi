import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MFAService, MFAType } from '../../../packages/backend/src/auth/mfa.js';
import { AuthService } from '../../../packages/backend/src/auth/index.js';
import { sql } from '../../../packages/backend/lib/neon-client.js';
import speakeasy from 'speakeasy';

// Mock external dependencies
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockqrcode')
  }
}));

describe('MFA Service', () => {
  let testUser: any;
  let testUserId: string;

  beforeEach(async () => {
    // Clean up test data
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%mfatest%'`;

    // Create test user
    const userData = {
      email: 'mfatest@test.com',
      username: 'mfatest',
      password: 'TestPassword123!',
      displayName: 'MFA Test User'
    };

    testUser = await AuthService.register(userData);
    testUserId = testUser.user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%mfatest%'`;
  });

  describe('TOTP Setup', () => {
    it('should generate TOTP secret and QR code', async () => {
      const result = await MFAService.generateTOTPSecret(testUserId, 'TestApp');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeUrl');
      expect(result).toHaveProperty('manualEntryKey');
      expect(result.secret).toMatch(/^[A-Z2-7]{32}$/); // Base32 format
      expect(result.qrCodeUrl).toBe('data:image/png;base64,mockqrcode');
      expect(result.manualEntryKey).toBe(result.secret);

      // Verify secret is stored in database
      const secretResult = await sql`
        SELECT secret, enabled FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;

      expect(secretResult).toHaveLength(1);
      expect(secretResult[0].secret).toBe(result.secret);
      expect(secretResult[0].enabled).toBe(false);
    });

    it('should enable TOTP with valid token', async () => {
      // Generate secret
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const secret = secretResult.secret;

      // Generate valid TOTP token
      const token = speakeasy.totp({
        secret,
        encoding: 'base32'
      });

      // Enable TOTP
      const backupCodes = await MFAService.enableTOTP({
        userId: testUserId,
        token
      });

      expect(backupCodes).toHaveLength(10);
      expect(backupCodes[0]).toMatch(/^[A-F0-9]{8}$/);

      // Verify TOTP is enabled
      const mfaResult = await sql`
        SELECT enabled, backup_codes FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;

      expect(mfaResult[0].enabled).toBe(true);
      expect(JSON.parse(mfaResult[0].backup_codes)).toEqual(backupCodes);

      // Verify user is marked as MFA enabled
      const userResult = await sql`
        SELECT mfa_enabled FROM users WHERE id = ${testUserId}
      `;

      expect(userResult[0].mfa_enabled).toBe(true);
    });

    it('should reject TOTP enablement with invalid token', async () => {
      // Generate secret
      await MFAService.generateTOTPSecret(testUserId);

      // Try to enable with invalid token
      await expect(MFAService.enableTOTP({
        userId: testUserId,
        token: '123456'
      })).rejects.toThrow('Invalid TOTP token');
    });

    it('should reject TOTP enablement without setup', async () => {
      await expect(MFAService.enableTOTP({
        userId: testUserId,
        token: '123456'
      })).rejects.toThrow('No TOTP setup found');
    });
  });

  describe('TOTP Verification', () => {
    let totpSecret: string;

    beforeEach(async () => {
      // Setup TOTP for tests
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      totpSecret = secretResult.secret;

      const token = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      await MFAService.enableTOTP({
        userId: testUserId,
        token
      });
    });

    it('should verify valid TOTP token', async () => {
      const token = speakeasy.totp({
        secret: totpSecret,
        encoding: 'base32'
      });

      const result = await MFAService.verifyTOTP(testUserId, token);
      expect(result).toBe(true);

      // Verify last_used_at is updated
      const secretResult = await sql`
        SELECT last_used_at FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;

      expect(secretResult[0].last_used_at).toBeTruthy();
    });

    it('should reject invalid TOTP token', async () => {
      const result = await MFAService.verifyTOTP(testUserId, '123456');
      expect(result).toBe(false);
    });

    it('should reject TOTP verification for non-enabled user', async () => {
      // Create another user without MFA
      const userData2 = {
        email: 'nomfa@test.com',
        username: 'nomfa',
        password: 'TestPassword123!'
      };

      const user2 = await AuthService.register(userData2);

      await expect(MFAService.verifyTOTP(user2.user.id, '123456'))
        .rejects.toThrow('TOTP not enabled for this user');
    });
  });

  describe('Backup Codes', () => {
    let backupCodes: string[];

    beforeEach(async () => {
      // Setup TOTP with backup codes
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });

      backupCodes = await MFAService.enableTOTP({
        userId: testUserId,
        token
      });
    });

    it('should verify valid backup code', async () => {
      const validCode = backupCodes[0];
      const result = await MFAService.verifyBackupCode(testUserId, validCode);
      expect(result).toBe(true);

      // Verify code is removed from list
      const secretResult = await sql`
        SELECT backup_codes FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;

      const remainingCodes = JSON.parse(secretResult[0].backup_codes);
      expect(remainingCodes).not.toContain(validCode);
      expect(remainingCodes).toHaveLength(9);
    });

    it('should reject invalid backup code', async () => {
      const result = await MFAService.verifyBackupCode(testUserId, 'INVALID1');
      expect(result).toBe(false);
    });

    it('should reject used backup code', async () => {
      const code = backupCodes[0];
      
      // Use the code once
      await MFAService.verifyBackupCode(testUserId, code);
      
      // Try to use it again
      const result = await MFAService.verifyBackupCode(testUserId, code);
      expect(result).toBe(false);
    });

    it('should regenerate backup codes', async () => {
      const newCodes = await MFAService.regenerateBackupCodes(testUserId);

      expect(newCodes).toHaveLength(10);
      expect(newCodes).not.toEqual(backupCodes);

      // Verify old codes don't work
      const result = await MFAService.verifyBackupCode(testUserId, backupCodes[0]);
      expect(result).toBe(false);

      // Verify new codes work
      const newResult = await MFAService.verifyBackupCode(testUserId, newCodes[0]);
      expect(newResult).toBe(true);
    });
  });

  describe('SMS MFA', () => {
    it('should enable SMS MFA with valid phone number', async () => {
      const phoneNumber = '+1234567890';

      await expect(MFAService.enableSMSMFA({
        userId: testUserId,
        phoneNumber
      })).resolves.not.toThrow();

      // Verify SMS MFA is stored
      const smsResult = await sql`
        SELECT secret, enabled FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.SMS}
      `;

      expect(smsResult).toHaveLength(1);
      expect(smsResult[0].secret).toBe(phoneNumber);
      expect(smsResult[0].enabled).toBe(false);
    });

    it('should reject invalid phone number format', async () => {
      await expect(MFAService.enableSMSMFA({
        userId: testUserId,
        phoneNumber: '123456789' // Missing country code
      })).rejects.toThrow();
    });

    it('should verify SMS code (mock implementation)', async () => {
      const result = await MFAService.verifySMS(testUserId, '123456');
      expect(result).toBe(true);

      const invalidResult = await MFAService.verifySMS(testUserId, 'abc123');
      expect(invalidResult).toBe(false);
    });
  });

  describe('MFA Status and Management', () => {
    it('should get MFA status for user without MFA', async () => {
      const status = await MFAService.getMFAStatus(testUserId);

      expect(status.enabled).toBe(false);
      expect(status.methods).toHaveLength(0);
    });

    it('should get MFA status for user with TOTP', async () => {
      // Enable TOTP
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUserId, token });

      const status = await MFAService.getMFAStatus(testUserId);

      expect(status.enabled).toBe(true);
      expect(status.methods).toHaveLength(1);
      expect(status.methods[0].type).toBe(MFAType.TOTP);
      expect(status.methods[0].enabled).toBe(true);
    });

    it('should check if user requires MFA', async () => {
      // Initially no MFA required
      let requiresMFA = await MFAService.requiresMFA(testUserId);
      expect(requiresMFA).toBe(false);

      // Enable TOTP
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUserId, token });

      // Now MFA is required
      requiresMFA = await MFAService.requiresMFA(testUserId);
      expect(requiresMFA).toBe(true);
    });

    it('should disable MFA', async () => {
      // Enable TOTP first
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUserId, token });

      // Verify MFA is enabled
      let status = await MFAService.getMFAStatus(testUserId);
      expect(status.enabled).toBe(true);

      // Disable MFA
      await MFAService.disableMFA(testUserId, MFAType.TOTP);

      // Verify MFA is disabled
      status = await MFAService.getMFAStatus(testUserId);
      expect(status.enabled).toBe(false);
      expect(status.methods).toHaveLength(0);

      // Verify user is marked as MFA disabled
      const userResult = await sql`
        SELECT mfa_enabled FROM users WHERE id = ${testUserId}
      `;
      expect(userResult[0].mfa_enabled).toBe(false);
    });
  });

  describe('MFA Challenge System', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Enable TOTP for challenge tests
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUserId, token });

      sessionId = testUser.session.id;
    });

    it('should create MFA challenge', async () => {
      const challenge = await MFAService.createMFAChallenge(testUserId, sessionId);

      expect(challenge).toHaveProperty('challengeId');
      expect(challenge).toHaveProperty('availableMethods');
      expect(challenge.challengeId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(challenge.availableMethods).toContain(MFAType.TOTP);
      expect(challenge.availableMethods).toContain(MFAType.BACKUP_CODES);

      // Verify challenge is stored in database
      const challengeResult = await sql`
        SELECT user_id, session_id, verified FROM mfa_challenges 
        WHERE id = ${challenge.challengeId}
      `;

      expect(challengeResult).toHaveLength(1);
      expect(challengeResult[0].user_id).toBe(testUserId);
      expect(challengeResult[0].session_id).toBe(sessionId);
      expect(challengeResult[0].verified).toBe(false);
    });

    it('should verify MFA challenge with valid TOTP', async () => {
      const challenge = await MFAService.createMFAChallenge(testUserId, sessionId);

      // Generate valid TOTP token
      const secretResult = await sql`
        SELECT secret FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;
      const secret = secretResult[0].secret;
      const token = speakeasy.totp({ secret, encoding: 'base32' });

      const result = await MFAService.verifyMFAChallenge(
        challenge.challengeId,
        token,
        MFAType.TOTP
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBe(testUserId);
      expect(result.sessionId).toBe(sessionId);

      // Verify challenge is marked as verified
      const challengeResult = await sql`
        SELECT verified, verified_at FROM mfa_challenges 
        WHERE id = ${challenge.challengeId}
      `;

      expect(challengeResult[0].verified).toBe(true);
      expect(challengeResult[0].verified_at).toBeTruthy();
    });

    it('should reject invalid challenge ID', async () => {
      await expect(MFAService.verifyMFAChallenge(
        'invalid-challenge-id',
        '123456',
        MFAType.TOTP
      )).rejects.toThrow('Invalid or expired MFA challenge');
    });

    it('should reject expired challenge', async () => {
      const challenge = await MFAService.createMFAChallenge(testUserId, sessionId);

      // Manually expire the challenge
      await sql`
        UPDATE mfa_challenges 
        SET expires_at = NOW() - INTERVAL '1 minute'
        WHERE id = ${challenge.challengeId}
      `;

      await expect(MFAService.verifyMFAChallenge(
        challenge.challengeId,
        '123456',
        MFAType.TOTP
      )).rejects.toThrow('MFA challenge has expired');
    });

    it('should reject used challenge', async () => {
      const challenge = await MFAService.createMFAChallenge(testUserId, sessionId);

      // Mark challenge as already verified
      await sql`
        UPDATE mfa_challenges 
        SET verified = true, verified_at = NOW()
        WHERE id = ${challenge.challengeId}
      `;

      await expect(MFAService.verifyMFAChallenge(
        challenge.challengeId,
        '123456',
        MFAType.TOTP
      )).rejects.toThrow('Invalid or expired MFA challenge');
    });
  });

  describe('MFA Utility Functions', () => {
    it('should generate backup codes', () => {
      const codes = MFAService.generateBackupCodes();

      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      });

      // Ensure codes are unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should generate custom number of backup codes', () => {
      const codes = MFAService.generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('should generate SMS code', () => {
      const code = MFAService.generateSMSCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate email code', () => {
      const code = MFAService.generateEmailCode();
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe('Generic MFA Verification', () => {
    beforeEach(async () => {
      // Setup TOTP for generic tests
      const secretResult = await MFAService.generateTOTPSecret(testUserId);
      const token = speakeasy.totp({
        secret: secretResult.secret,
        encoding: 'base32'
      });
      await MFAService.enableTOTP({ userId: testUserId, token });
    });

    it('should verify MFA with TOTP type', async () => {
      const secretResult = await sql`
        SELECT secret FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;
      const secret = secretResult[0].secret;
      const token = speakeasy.totp({ secret, encoding: 'base32' });

      const result = await MFAService.verifyMFA({
        userId: testUserId,
        token,
        type: MFAType.TOTP
      });

      expect(result).toBe(true);
    });

    it('should verify MFA with backup code type', async () => {
      const backupCodesResult = await sql`
        SELECT backup_codes FROM user_mfa_secrets 
        WHERE user_id = ${testUserId} AND type = ${MFAType.TOTP}
      `;
      const backupCodes = JSON.parse(backupCodesResult[0].backup_codes);
      const validCode = backupCodes[0];

      const result = await MFAService.verifyMFA({
        userId: testUserId,
        token: validCode,
        type: MFAType.BACKUP_CODES
      });

      expect(result).toBe(true);
    });

    it('should verify MFA with SMS type', async () => {
      const result = await MFAService.verifyMFA({
        userId: testUserId,
        token: '123456',
        type: MFAType.SMS
      });

      expect(result).toBe(true);
    });

    it('should reject unsupported MFA type', async () => {
      await expect(MFAService.verifyMFA({
        userId: testUserId,
        token: '123456',
        type: 'unsupported' as MFAType
      })).rejects.toThrow('Unsupported MFA type');
    });
  });
});
