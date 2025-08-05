import { Elysia } from "elysia";
import { sql } from "../lib/neon-client.js";
import { z } from "zod";
import crypto from "crypto";

// Security configuration
export const securityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordResetExpiry: 60 * 60 * 1000, // 1 hour
  emailVerificationExpiry: 24 * 60 * 60 * 1000, // 24 hours
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  bruteForceWindowMs: 60 * 60 * 1000, // 1 hour
};

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  ACCOUNT_LOCKED = 'account_locked',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  EMAIL_VERIFIED = 'email_verified',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt'
}

// IP-based brute force protection
class BruteForceProtection {
  private attempts: Map<string, { count: number; firstAttempt: number; lastAttempt: number }> = new Map();

  constructor() {
    // Clean up old entries every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.attempts.entries()) {
      if (now - data.lastAttempt > securityConfig.bruteForceWindowMs) {
        this.attempts.delete(ip);
      }
    }
  }

  isBlocked(ip: string): boolean {
    const data = this.attempts.get(ip);
    if (!data) return false;

    const now = Date.now();
    
    // Reset if window has passed
    if (now - data.firstAttempt > securityConfig.bruteForceWindowMs) {
      this.attempts.delete(ip);
      return false;
    }

    return data.count >= securityConfig.maxLoginAttempts;
  }

  recordAttempt(ip: string, success: boolean) {
    if (success) {
      // Clear attempts on successful login
      this.attempts.delete(ip);
      return;
    }

    const now = Date.now();
    const data = this.attempts.get(ip);

    if (!data) {
      this.attempts.set(ip, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      // Reset if window has passed
      if (now - data.firstAttempt > securityConfig.bruteForceWindowMs) {
        this.attempts.set(ip, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now
        });
      } else {
        data.count++;
        data.lastAttempt = now;
        this.attempts.set(ip, data);
      }
    }
  }

  getRemainingTime(ip: string): number {
    const data = this.attempts.get(ip);
    if (!data) return 0;

    const timeRemaining = securityConfig.bruteForceWindowMs - (Date.now() - data.firstAttempt);
    return Math.max(0, timeRemaining);
  }
}

export const bruteForceProtection = new BruteForceProtection();

// Security service
export class SecurityService {
  // Log security events
  static async logSecurityEvent(
    eventType: SecurityEventType,
    userId: string | null,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO security_logs (
          event_type, user_id, details, ip_address, user_agent, created_at
        ) VALUES (
          ${eventType},
          ${userId},
          ${JSON.stringify(details)},
          ${ipAddress || null},
          ${userAgent || null},
          NOW()
        )
      `;
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Check if account is locked due to failed attempts
  static async isAccountLocked(userId: string): Promise<{ locked: boolean; until?: Date }> {
    try {
      const result = await sql`
        SELECT locked_until FROM user_security
        WHERE user_id = ${userId}
          AND locked_until > NOW()
      `;

      if (result.length > 0) {
        return {
          locked: true,
          until: result[0].locked_until
        };
      }

      return { locked: false };
    } catch (error) {
      console.error('Failed to check account lock status:', error);
      return { locked: false };
    }
  }

  // Lock account due to failed login attempts
  static async lockAccount(userId: string, reason: string = 'Too many failed login attempts'): Promise<void> {
    try {
      const lockUntil = new Date(Date.now() + securityConfig.lockoutDuration);
      
      await sql`
        INSERT INTO user_security (user_id, failed_attempts, locked_until, lock_reason, updated_at)
        VALUES (${userId}, ${securityConfig.maxLoginAttempts}, ${lockUntil.toISOString()}, ${reason}, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          failed_attempts = ${securityConfig.maxLoginAttempts},
          locked_until = ${lockUntil.toISOString()},
          lock_reason = ${reason},
          updated_at = NOW()
      `;

      await this.logSecurityEvent(
        SecurityEventType.ACCOUNT_LOCKED,
        userId,
        { reason, lockUntil: lockUntil.toISOString() }
      );
    } catch (error) {
      console.error('Failed to lock account:', error);
    }
  }

  // Unlock account
  static async unlockAccount(userId: string): Promise<void> {
    try {
      await sql`
        UPDATE user_security 
        SET failed_attempts = 0, locked_until = NULL, lock_reason = NULL, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error('Failed to unlock account:', error);
    }
  }

  // Record failed login attempt
  static async recordFailedLogin(userId: string): Promise<boolean> {
    try {
      const result = await sql`
        INSERT INTO user_security (user_id, failed_attempts, updated_at)
        VALUES (${userId}, 1, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          failed_attempts = user_security.failed_attempts + 1,
          updated_at = NOW()
        RETURNING failed_attempts
      `;

      const failedAttempts = result[0]?.failed_attempts || 0;

      if (failedAttempts >= securityConfig.maxLoginAttempts) {
        await this.lockAccount(userId);
        return true; // Account locked
      }

      return false; // Account not locked yet
    } catch (error) {
      console.error('Failed to record failed login:', error);
      return false;
    }
  }

  // Reset failed login attempts on successful login
  static async resetFailedAttempts(userId: string): Promise<void> {
    try {
      await sql`
        UPDATE user_security 
        SET failed_attempts = 0, locked_until = NULL, lock_reason = NULL, updated_at = NOW()
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error('Failed to reset failed attempts:', error);
    }
  }

  // Generate secure token for password reset, email verification, etc.
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create password reset token
  static async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + securityConfig.passwordResetExpiry);

    try {
      await sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
        VALUES (${userId}, ${token}, ${expiresAt.toISOString()}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          token = ${token},
          expires_at = ${expiresAt.toISOString()},
          created_at = NOW(),
          used = FALSE
      `;

      await this.logSecurityEvent(
        SecurityEventType.PASSWORD_RESET_REQUESTED,
        userId,
        { expiresAt: expiresAt.toISOString() }
      );

      return token;
    } catch (error) {
      console.error('Failed to create password reset token:', error);
      throw new Error('Failed to create password reset token');
    }
  }

  // Validate password reset token
  static async validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const result = await sql`
        SELECT user_id FROM password_reset_tokens
        WHERE token = ${token}
          AND expires_at > NOW()
          AND used = FALSE
      `;

      if (result.length === 0) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: result[0].user_id
      };
    } catch (error) {
      console.error('Failed to validate password reset token:', error);
      return { valid: false };
    }
  }

  // Mark password reset token as used
  static async markPasswordResetTokenUsed(token: string): Promise<void> {
    try {
      await sql`
        UPDATE password_reset_tokens 
        SET used = TRUE, used_at = NOW()
        WHERE token = ${token}
      `;
    } catch (error) {
      console.error('Failed to mark password reset token as used:', error);
    }
  }

  // Create email verification token
  static async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + securityConfig.emailVerificationExpiry);

    try {
      await sql`
        INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at)
        VALUES (${userId}, ${token}, ${expiresAt.toISOString()}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          token = ${token},
          expires_at = ${expiresAt.toISOString()},
          created_at = NOW(),
          used = FALSE
      `;

      await this.logSecurityEvent(
        SecurityEventType.EMAIL_VERIFICATION_SENT,
        userId,
        { expiresAt: expiresAt.toISOString() }
      );

      return token;
    } catch (error) {
      console.error('Failed to create email verification token:', error);
      throw new Error('Failed to create email verification token');
    }
  }

  // Validate email verification token
  static async validateEmailVerificationToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const result = await sql`
        SELECT user_id FROM email_verification_tokens
        WHERE token = ${token}
          AND expires_at > NOW()
          AND used = FALSE
      `;

      if (result.length === 0) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: result[0].user_id
      };
    } catch (error) {
      console.error('Failed to validate email verification token:', error);
      return { valid: false };
    }
  }

  // Mark email verification token as used and verify email
  static async verifyEmail(token: string): Promise<boolean> {
    try {
      const validation = await this.validateEmailVerificationToken(token);
      
      if (!validation.valid || !validation.userId) {
        return false;
      }

      // Mark token as used
      await sql`
        UPDATE email_verification_tokens 
        SET used = TRUE, used_at = NOW()
        WHERE token = ${token}
      `;

      // Mark user as verified
      await sql`
        UPDATE users 
        SET is_verified = TRUE, updated_at = NOW()
        WHERE id = ${validation.userId}
      `;

      await this.logSecurityEvent(
        SecurityEventType.EMAIL_VERIFIED,
        validation.userId
      );

      return true;
    } catch (error) {
      console.error('Failed to verify email:', error);
      return false;
    }
  }

  // Detect suspicious activity patterns
  static async detectSuspiciousActivity(userId: string, ipAddress: string): Promise<boolean> {
    try {
      // Check for multiple IPs in short time
      const recentIPs = await sql`
        SELECT DISTINCT ip_address 
        FROM security_logs
        WHERE user_id = ${userId}
          AND created_at > NOW() - INTERVAL '1 hour'
          AND event_type = ${SecurityEventType.LOGIN_SUCCESS}
      `;

      if (recentIPs.length > 3) {
        await this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          userId,
          { 
            reason: 'Multiple IP addresses',
            ipCount: recentIPs.length,
            currentIP: ipAddress 
          },
          ipAddress
        );
        return true;
      }

      // Check for rapid login attempts from different locations
      const rapidLogins = await sql`
        SELECT COUNT(*) as count
        FROM security_logs
        WHERE user_id = ${userId}
          AND created_at > NOW() - INTERVAL '5 minutes'
          AND event_type IN (${SecurityEventType.LOGIN_SUCCESS}, ${SecurityEventType.LOGIN_FAILED})
      `;

      if (rapidLogins[0]?.count > 10) {
        await this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          userId,
          { 
            reason: 'Rapid login attempts',
            attemptCount: rapidLogins[0].count 
          },
          ipAddress
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }
}

// Security middleware for brute force protection
export const bruteForceMiddleware = new Elysia({ name: 'brute-force-protection' })
  .derive(({ request, set }) => {
    const ip = request.headers['x-forwarded-for'] || 
               request.headers['x-real-ip'] || 
               'unknown';
    
    if (bruteForceProtection.isBlocked(ip)) {
      const remainingTime = bruteForceProtection.getRemainingTime(ip);
      
      set.status = 429;
      set.headers = {
        ...set.headers,
        'Retry-After': Math.ceil(remainingTime / 1000).toString()
      };
      
      throw new Error(`Too many failed attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`);
    }
    
    return { clientIP: ip };
  });

export default {
  SecurityService,
  securityConfig,
  SecurityEventType,
  bruteForceProtection,
  bruteForceMiddleware
};
