import { Lucia, TimeSpan } from "lucia";
import { NeonHTTPAdapter } from "@lucia-auth/adapter-postgresql";
import { sql } from "../../lib/neon-client.js";
import { z } from "zod";
import { Elysia } from "elysia";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Database adapter for Lucia
const adapter = new NeonHTTPAdapter(sql, {
  user: "users",
  session: "auth_sessions"
});

// Lucia configuration
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: "deepweb_session",
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined
    }
  },
  sessionExpiresIn: new TimeSpan(7, "d"), // 7 days
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      email: attributes.email,
      username: attributes.username,
      displayName: attributes.display_name,
      avatarUrl: attributes.avatar_url,
      role: attributes.role,
      isVerified: attributes.is_verified,
      preferences: attributes.preferences
    };
  }
});

// Type declarations for Lucia
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      id: string;
      email: string;
      username: string;
      display_name?: string;
      avatar_url?: string;
      role: "user" | "premium" | "admin" | "developer";
      is_verified: boolean;
      preferences: Record<string, any>;
    };
  }
}

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

  // Generate JWT token
  static generateJWT(userId: string, sessionId: string): string {
    const payload = {
      userId,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET!);
  }

  // Verify JWT token
  static verifyJWT(token: string): { userId: string; sessionId: string } | null {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        userId: payload.userId,
        sessionId: payload.sessionId
      };
    } catch {
      return null;
    }
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
    
    // Hash password
    const passwordHash = await this.hashPassword(validated.password);
    
    // Create user
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
    
    // Create session
    const session = await lucia.createSession(user.id, {});
    
    // Generate JWT
    const token = this.generateJWT(user.id, session.id);
    
    // Update last login
    await sql`
      UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
    `;
    
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
    
    // Find user
    const userResult = await sql`
      SELECT id, email, username, display_name, avatar_url, password_hash, role, is_verified, preferences
      FROM users 
      WHERE email = ${validated.email}
    `;
    
    if (userResult.length === 0) {
      throw new Error("Invalid email or password");
    }
    
    const user = userResult[0];
    
    // Verify password
    const isValidPassword = await this.verifyPassword(validated.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }
    
    // Invalidate existing sessions (optional - remove if you want multiple sessions)
    await lucia.invalidateUserSessions(user.id);
    
    // Create new session
    const session = await lucia.createSession(user.id, {});
    
    // Generate JWT
    const token = this.generateJWT(user.id, session.id);
    
    // Update last login
    await sql`
      UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
    `;
    
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

  // Logout user
  static async logout(sessionId: string): Promise<void> {
    await lucia.invalidateSession(sessionId);
  }

  // Validate session
  static async validateSession(sessionId: string): Promise<{
    user: any;
    session: any;
  } | null> {
    try {
      const result = await lucia.validateSession(sessionId);
      
      if (!result.user || !result.session) {
        return null;
      }
      
      return {
        user: result.user,
        session: result.session
      };
    } catch {
      return null;
    }
  }

  // Get user by ID
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

  // Change password
  static async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const validated = ChangePasswordSchema.parse(data);
    
    // Get current password hash
    const userResult = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;
    
    if (userResult.length === 0) {
      throw new Error("User not found");
    }
    
    // Verify current password
    const isValidPassword = await this.verifyPassword(validated.currentPassword, userResult[0].password_hash);
    
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }
    
    // Hash new password
    const newPasswordHash = await this.hashPassword(validated.newPassword);
    
    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    // Invalidate all sessions to force re-login
    await lucia.invalidateUserSessions(userId);
  }

  // Update user profile
  static async updateProfile(userId: string, updates: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    preferences?: Record<string, any>;
  }): Promise<any> {
    const setClause = [];
    const values = [];
    
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
  .derive(async ({ headers, set }) => {
    // Extract token from Authorization header or cookie
    const authHeader = headers.authorization;
    const sessionCookie = headers.cookie?.split(';')
      .find(c => c.trim().startsWith('deepweb_session='))
      ?.split('=')[1];
    
    let sessionId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      // JWT token authentication
      const token = authHeader.substring(7);
      const jwtPayload = AuthService.verifyJWT(token);
      
      if (jwtPayload) {
        sessionId = jwtPayload.sessionId;
      }
    } else if (sessionCookie) {
      // Cookie-based session
      sessionId = sessionCookie;
    }
    
    if (!sessionId) {
      return { 
        user: null, 
        session: null,
        isAuthenticated: false 
      };
    }
    
    const result = await AuthService.validateSession(sessionId);
    
    if (!result) {
      return { 
        user: null, 
        session: null,
        isAuthenticated: false 
      };
    }
    
    return {
      user: result.user,
      session: result.session,
      isAuthenticated: true
    };
  });

// Require authentication middleware
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authMiddleware)
  .derive(({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }
    
    return { user };
  });

// Require specific role middleware
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
  lucia,
  AuthService,
  authMiddleware,
  requireAuth,
  requireRole,
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema
};
