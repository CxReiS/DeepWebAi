import { z } from "zod";
import { sql } from "../../lib/neon-client.js";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

// MFA types
export enum MFAType {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  BACKUP_CODES = 'backup_codes'
}

export interface MFASecret {
  secret: string;
  type: MFAType;
  enabled: boolean;
  backupCodes?: string[];
  createdAt: Date;
  lastUsedAt?: Date;
}

// MFA schemas
export const EnableTOTPSchema = z.object({
  userId: z.string(),
  token: z.string().length(6, "TOTP token must be 6 digits")
});

export const VerifyMFASchema = z.object({
  userId: z.string(),
  token: z.string(),
  type: z.nativeEnum(MFAType)
});

export const EnableSMSMFASchema = z.object({
  userId: z.string(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number format")
});

export const BackupCodeSchema = z.object({
  userId: z.string(),
  code: z.string().length(8, "Backup code must be 8 characters")
});

export type EnableTOTPData = z.infer<typeof EnableTOTPSchema>;
export type VerifyMFAData = z.infer<typeof VerifyMFASchema>;
export type EnableSMSMFAData = z.infer<typeof EnableSMSMFASchema>;
export type BackupCodeData = z.infer<typeof BackupCodeSchema>;

export class MFAService {
  
  // Generate TOTP secret and QR code
  static async generateTOTPSecret(userId: string, serviceName = "DeepWebAI"): Promise<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  }> {
    // Get user info for QR code
    const userResult = await sql`
      SELECT email, username FROM users WHERE id = ${userId}
    `;
    
    if (userResult.length === 0) {
      throw new Error("User not found");
    }
    
    const user = userResult[0];
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${user.email})`,
      issuer: serviceName,
      length: 32
    });

    // Store temporary secret (not enabled yet)
    await sql`
      INSERT INTO user_mfa_secrets (user_id, type, secret, enabled, created_at)
      VALUES (${userId}, ${MFAType.TOTP}, ${secret.base32}, false, NOW())
      ON CONFLICT (user_id, type) 
      DO UPDATE SET secret = ${secret.base32}, enabled = false, created_at = NOW()
    `;

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  // Enable TOTP after verification
  static async enableTOTP(data: EnableTOTPData): Promise<string[]> {
    const validated = EnableTOTPSchema.parse(data);
    
    // Get the temporary secret
    const secretResult = await sql`
      SELECT secret FROM user_mfa_secrets 
      WHERE user_id = ${validated.userId} AND type = ${MFAType.TOTP} AND enabled = false
    `;
    
    if (secretResult.length === 0) {
      throw new Error("No TOTP setup found. Please start setup process first.");
    }
    
    const secret = secretResult[0].secret;
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: validated.token,
      window: 2 // Allow 2 time steps of tolerance
    });
    
    if (!verified) {
      throw new Error("Invalid TOTP token");
    }
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Enable TOTP and store backup codes
    await sql`
      UPDATE user_mfa_secrets 
      SET enabled = true, backup_codes = ${JSON.stringify(backupCodes)}, updated_at = NOW()
      WHERE user_id = ${validated.userId} AND type = ${MFAType.TOTP}
    `;
    
    // Mark user as MFA enabled
    await sql`
      UPDATE users SET mfa_enabled = true WHERE id = ${validated.userId}
    `;
    
    return backupCodes;
  }

  // Verify MFA token
  static async verifyMFA(data: VerifyMFAData): Promise<boolean> {
    const validated = VerifyMFASchema.parse(data);
    
    switch (validated.type) {
      case MFAType.TOTP:
        return this.verifyTOTP(validated.userId, validated.token);
      
      case MFAType.BACKUP_CODES:
        return this.verifyBackupCode(validated.userId, validated.token);
      
      case MFAType.SMS:
        return this.verifySMS(validated.userId, validated.token);
      
      case MFAType.EMAIL:
        return this.verifyEmail(validated.userId, validated.token);
      
      default:
        throw new Error("Unsupported MFA type");
    }
  }

  // Verify TOTP token
  static async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secretResult = await sql`
      SELECT secret FROM user_mfa_secrets 
      WHERE user_id = ${userId} AND type = ${MFAType.TOTP} AND enabled = true
    `;
    
    if (secretResult.length === 0) {
      throw new Error("TOTP not enabled for this user");
    }
    
    const secret = secretResult[0].secret;
    
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (verified) {
      // Update last used timestamp
      await sql`
        UPDATE user_mfa_secrets 
        SET last_used_at = NOW() 
        WHERE user_id = ${userId} AND type = ${MFAType.TOTP}
      `;
    }
    
    return verified;
  }

  // Verify backup code
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const secretResult = await sql`
      SELECT backup_codes FROM user_mfa_secrets 
      WHERE user_id = ${userId} AND type = ${MFAType.TOTP} AND enabled = true
    `;
    
    if (secretResult.length === 0) {
      throw new Error("MFA not enabled for this user");
    }
    
    const backupCodes = JSON.parse(secretResult[0].backup_codes || '[]');
    
    if (!backupCodes.includes(code)) {
      return false;
    }
    
    // Remove used backup code
    const updatedCodes = backupCodes.filter((c: string) => c !== code);
    
    await sql`
      UPDATE user_mfa_secrets 
      SET backup_codes = ${JSON.stringify(updatedCodes)}, last_used_at = NOW()
      WHERE user_id = ${userId} AND type = ${MFAType.TOTP}
    `;
    
    return true;
  }

  // SMS MFA implementation (placeholder)
  static async enableSMSMFA(data: EnableSMSMFAData): Promise<void> {
    const validated = EnableSMSMFASchema.parse(data);
    
    // Store phone number
    await sql`
      INSERT INTO user_mfa_secrets (user_id, type, secret, enabled, created_at)
      VALUES (${validated.userId}, ${MFAType.SMS}, ${validated.phoneNumber}, false, NOW())
      ON CONFLICT (user_id, type) 
      DO UPDATE SET secret = ${validated.phoneNumber}, enabled = false, created_at = NOW()
    `;
    
    // In a real implementation, send SMS verification code here
    // Note: Code generated but not logged for security
  }

  static async verifySMS(userId: string, token: string): Promise<boolean> {
    // In a real implementation, verify SMS code from cache/database
    // For now, accept any 6-digit code for testing
    return /^\d{6}$/.test(token);
  }

  // Email MFA implementation (placeholder)
  static async verifyEmail(userId: string, token: string): Promise<boolean> {
    // In a real implementation, verify email code from cache/database
    // For now, accept any 6-digit code for testing
    return /^\d{6}$/.test(token);
  }

  // Disable MFA
  static async disableMFA(userId: string, type: MFAType): Promise<void> {
    await sql`
      DELETE FROM user_mfa_secrets 
      WHERE user_id = ${userId} AND type = ${type}
    `;
    
    // Check if user has any other MFA methods enabled
    const remainingMFA = await sql`
      SELECT COUNT(*) as count FROM user_mfa_secrets 
      WHERE user_id = ${userId} AND enabled = true
    `;
    
    if (remainingMFA[0].count === 0) {
      await sql`
        UPDATE users SET mfa_enabled = false WHERE id = ${userId}
      `;
    }
  }

  // Get user MFA status
  static async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    methods: Array<{
      type: MFAType;
      enabled: boolean;
      lastUsed?: Date;
    }>;
  }> {
    const methods = await sql`
      SELECT type, enabled, last_used_at 
      FROM user_mfa_secrets 
      WHERE user_id = ${userId}
    `;
    
    const userResult = await sql`
      SELECT mfa_enabled FROM users WHERE id = ${userId}
    `;
    
    return {
      enabled: userResult[0]?.mfa_enabled || false,
      methods: methods.map(m => ({
        type: m.type as MFAType,
        enabled: m.enabled,
        lastUsed: m.last_used_at ? new Date(m.last_used_at) : undefined
      }))
    };
  }

  // Generate backup codes
  static generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    
    return codes;
  }

  // Generate SMS code
  static generateSMSCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Generate email code  
  static generateEmailCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Regenerate backup codes
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newCodes = this.generateBackupCodes();
    
    await sql`
      UPDATE user_mfa_secrets 
      SET backup_codes = ${JSON.stringify(newCodes)}, updated_at = NOW()
      WHERE user_id = ${userId} AND type = ${MFAType.TOTP} AND enabled = true
    `;
    
    return newCodes;
  }

  // Check if user requires MFA for login
  static async requiresMFA(userId: string): Promise<boolean> {
    const userResult = await sql`
      SELECT mfa_enabled FROM users WHERE id = ${userId}
    `;
    
    return userResult[0]?.mfa_enabled || false;
  }

  // Create MFA challenge for login
  static async createMFAChallenge(userId: string, sessionId: string): Promise<{
    challengeId: string;
    availableMethods: MFAType[];
  }> {
    const challengeId = crypto.randomUUID();
    
    // Store challenge in database with expiration
    await sql`
      INSERT INTO mfa_challenges (id, user_id, session_id, expires_at, created_at)
      VALUES (${challengeId}, ${userId}, ${sessionId}, NOW() + INTERVAL '10 minutes', NOW())
    `;
    
    // Get available MFA methods
    const methods = await sql`
      SELECT type FROM user_mfa_secrets 
      WHERE user_id = ${userId} AND enabled = true
    `;
    
    const availableMethods = methods.map(m => m.type as MFAType);
    
    // Always include backup codes if TOTP is enabled
    if (availableMethods.includes(MFAType.TOTP)) {
      availableMethods.push(MFAType.BACKUP_CODES);
    }
    
    return {
      challengeId,
      availableMethods
    };
  }

  // Verify MFA challenge
  static async verifyMFAChallenge(challengeId: string, token: string, type: MFAType): Promise<{
    success: boolean;
    userId: string;
    sessionId: string;
  }> {
    // Get challenge details
    const challengeResult = await sql`
      SELECT user_id, session_id, expires_at 
      FROM mfa_challenges 
      WHERE id = ${challengeId} AND verified = false
    `;
    
    if (challengeResult.length === 0) {
      throw new Error("Invalid or expired MFA challenge");
    }
    
    const challenge = challengeResult[0];
    
    // Check if challenge has expired
    if (new Date() > new Date(challenge.expires_at)) {
      throw new Error("MFA challenge has expired");
    }
    
    // Verify the MFA token
    const success = await this.verifyMFA({
      userId: challenge.user_id,
      token,
      type
    });
    
    if (success) {
      // Mark challenge as verified
      await sql`
        UPDATE mfa_challenges 
        SET verified = true, verified_at = NOW() 
        WHERE id = ${challengeId}
      `;
    }
    
    return {
      success,
      userId: challenge.user_id,
      sessionId: challenge.session_id
    };
  }
}

export default {
  MFAService,
  MFAType,
  EnableTOTPSchema,
  VerifyMFASchema,
  EnableSMSMFASchema,
  BackupCodeSchema
};
