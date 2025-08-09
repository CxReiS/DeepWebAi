/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { sql } from "../lib/neon-client.js";
import { z } from "zod";
import { Elysia } from "elysia";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Auth schemas
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  displayName: z.string().optional(),
  preferences: z.record(z.any()).default({})
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
});

export type RegisterData = z.infer<typeof RegisterSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;

// Session helpers (no external auth framework)
async function createDbSession(userId: string) {
  const id = crypto.randomUUID();
  const result = await sql`
    INSERT INTO auth_sessions (id, user_id, created_at, expires_at)
    VALUES (${id}, ${userId}, NOW(), NOW() + INTERVAL '7 days')
    RETURNING id
  `;
  return { id: result[0].id };
}

async function invalidateDbSession(sessionId: string) {
  await sql`DELETE FROM auth_sessions WHERE id = ${sessionId}`;
}

async function invalidateUserDbSessions(userId: string) {
  await sql`DELETE FROM auth_sessions WHERE user_id = ${userId}`;
}

async function validateDbSession(sessionId: string) {
  const rows = await sql`
    SELECT s.id as session_id, u.id, u.email, u.username, u.display_name, u.avatar_url, u.role, u.is_verified, u.preferences
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND (s.expires_at IS NULL OR s.expires_at > NOW())
  `;
  if (rows.length === 0) return null;
  const user = rows[0];
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isVerified: user.is_verified,
      preferences: user.preferences
    },
    session: { id: rows[0].session_id }
  };
}

// Auth service class
export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token (signed with NEXTAUTH_SECRET)
  static generateJWT(userId: string, sessionId: string): string {
    const payload = {
      userId,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    return jwt.sign(payload, process.env.NEXTAUTH_SECRET!);
  }

  // Verify JWT token
  static verifyJWT(token: string): { userId: string; sessionId: string } | null {
    try {
      const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      return {
        userId: payload.userId,
        sessionId: payload.sessionId
      };
    } catch {
      return null;
    }
  }

  // Create session
  static async createSession(userId: string) {
    return createDbSession(userId);
  }

  static async invalidateSession(sessionId: string) {
    return invalidateDbSession(sessionId);
  }

  static async invalidateUserSessions(userId: string) {
    return invalidateUserDbSessions(userId);
  }

  static async validateSession(sessionId: string) {
    return validateDbSession(sessionId);
  }

  // Register new user
  static async register(data: RegisterData): Promise<{
    user: any;
    session: any;
    token: string;
  }> {
    const validated = RegisterSchema.parse(data);

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users 
      WHERE email = ${validated.email} OR username = ${validated.username}
    `;

    if (existingUser.length > 0) {
      throw new Error("User with this email or username already exists");
    }

    const passwordHash = await this.hashPassword(validated.password);

    const userResult = await sql`
      INSERT INTO users (
        email, username, password_hash, display_name, preferences, role
      ) VALUES (
        ${validated.email},
        ${validated.username},
        ${passwordHash},
        ${validated.displayName || validated.username},
        ${JSON.stringify(validated.preferences)},
        'user'
      )
      RETURNING id, email, username, display_name, avatar_url, role, is_verified, preferences, created_at
    `;

    const user = userResult[0];
    const session = await this.createSession(user.id);
    const token = this.generateJWT(user.id, session.id);

    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        isVerified: user.is_verified,
        preferences: user.preferences,
        createdAt: user.created_at
      },
      session,
      token
    };
  }

  // Login user
  static async login(data: LoginData): Promise<{
    user: any;
    session: any;
    token: string;
  }> {
    const validated = LoginSchema.parse(data);

    const userResult = await sql`
      SELECT id, email, username, display_name, avatar_url, password_hash, role, is_verified, preferences
      FROM users 
      WHERE email = ${validated.email}
    `;

    if (userResult.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = userResult[0];
    const isValidPassword = await this.verifyPassword(validated.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    await this.invalidateUserSessions(user.id);
    const session = await this.createSession(user.id);
    const token = this.generateJWT(user.id, session.id);

    await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        isVerified: user.is_verified,
        preferences: user.preferences
      },
      session,
      token
    };
  }

  static async logout(sessionId: string): Promise<void> {
    await this.invalidateSession(sessionId);
  }

  static async validateSessionPublic(sessionId: string) {
    return this.validateSession(sessionId);
  }

  static async getUserById(userId: string): Promise<any | null> {
    const result = await sql`
      SELECT id, email, username, display_name, avatar_url, role, is_verified, preferences, created_at, last_login_at
      FROM users 
      WHERE id = ${userId}
    `;

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isVerified: user.is_verified,
      preferences: user.preferences,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at
    };
  }

  static async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const validated = ChangePasswordSchema.parse(data);

    const userResult = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      throw new Error("User not found");
    }

    const isValidPassword = await this.verifyPassword(validated.currentPassword, userResult[0].password_hash);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    const newPasswordHash = await this.hashPassword(validated.newPassword);

    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, updated_at = NOW()
      WHERE id = ${userId}
    `;

    await this.invalidateUserSessions(userId);
  }

  static async updateProfile(userId: string, updates: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    preferences?: Record<string, any>;
  }): Promise<any> {
    const setClause: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'displayName' ? 'display_name' : 
                     key === 'avatarUrl' ? 'avatar_url' : key;
        setClause.push(`${dbKey} = $${values.length + 1}`);
        values.push(key === 'preferences' ? JSON.stringify(value) : value);
      }
    });

    if (setClause.length === 0) {
      return this.getUserById(userId);
    }

    setClause.push('updated_at = NOW()');

    const result = await sql.unsafe(`
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING id, email, username, display_name, avatar_url, role, is_verified, preferences, updated_at
    `, [...values, userId]);

    if (result.length === 0) {
      throw new Error("User not found");
    }

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      isVerified: user.is_verified,
      preferences: user.preferences,
      updatedAt: user.updated_at
    };
  }
}

// Auth middleware
export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ headers }) => {
    const authHeader = headers.authorization;
    const sessionCookie = headers.cookie?.split(';')
      .find(c => c.trim().startsWith('deepweb_session='))
      ?.split('=')[1];

    let sessionId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtPayload = AuthService.verifyJWT(token);
      if (jwtPayload) {
        sessionId = jwtPayload.sessionId;
      }
    } else if (sessionCookie) {
      sessionId = sessionCookie;
    }

    if (!sessionId) {
      return { user: null, session: null, isAuthenticated: false };
    }

    const result = await AuthService.validateSession(sessionId);
    if (!result) {
      return { user: null, session: null, isAuthenticated: false };
    }

    return { user: result.user, session: result.session, isAuthenticated: true };
  });

export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authMiddleware)
  .derive(({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }
    return { user };
  });

export const requireRole = (allowedRoles: string[]) => 
  new Elysia({ name: 'require-role' })
    .use(requireAuth)
    .derive(({ user, set }) => {
      if (!allowedRoles.includes(user.role)) {
        set.status = 403;
        throw new Error("Insufficient permissions");
      }
      return { user };
    });

export default {
  AuthService,
  authMiddleware,
  requireAuth,
  requireRole,
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema
};
