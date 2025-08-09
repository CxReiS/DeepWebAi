import NextAuth from "next-auth";
import { authConfig, LoginSchema, RegisterSchema, type LoginData, type RegisterData } from "./authjs-config.js";
import { sql } from "../lib/neon-client.js";
import bcrypt from "bcrypt";
import { z } from "zod";

// Initialize NextAuth
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth(authConfig);

// Password change schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
});

export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;

// AuthJS Service class - NextAuth.js entegrasyonu ile kimlik doğrulama
export class AuthJSService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Yeni kullanıcı kaydı - NextAuth.js ile
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
        email, username, password_hash, display_name, preferences, role, is_verified
      ) VALUES (
        ${validated.email},
        ${validated.username},
        ${passwordHash},
        ${validated.displayName || validated.username},
        ${JSON.stringify(validated.preferences)},
        'user',
        false
      )
      RETURNING id, email, username, display_name, avatar_url, role, is_verified, preferences, created_at
    `;
    
    const user = userResult[0];
    
    // Sign in with NextAuth
    const result = await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false
    });
    
    // Get session after sign in
    const session = await auth();
    
    // Update last login
    await sql`
      UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
    `;
    
    // Generate a simple token for compatibility (session token)
    const token = session?.user?.id || user.id;
    
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
      session: session || null,
      token
    };
  }

  // Kullanıcı girişi - NextAuth.js ile
  static async login(data: LoginData): Promise<{
    user: any;
    session: any;
    token: string;
  }> {
    const validated = LoginSchema.parse(data);
    
    // Sign in with NextAuth
    const result = await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false
    });
    
    if (!result || result.error) {
      throw new Error("Invalid email or password");
    }
    
    // Get session after sign in
    const session = await auth();
    
    if (!session?.user) {
      throw new Error("Failed to create session");
    }
    
    // Get user data
    const userResult = await sql`
      SELECT id, email, username, display_name, avatar_url, role, is_verified, preferences
      FROM users 
      WHERE email = ${validated.email}
    `;
    
    const user = userResult[0];
    
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
      token: session.user.id
    };
  }

  // Kullanıcı çıkışı - NextAuth.js ile  
  static async logout(): Promise<void> {
    await signOut({ redirect: false });
  }

  // Oturum doğrulama - NextAuth.js ile
  static async validateSession(sessionToken?: string): Promise<{
    user: any;
    session: any;
  } | null> {
    try {
      const session = await auth();
      
      if (!session?.user) {
        return null;
      }
      
      return {
        user: session.user,
        session: session
      };
    } catch {
      return null;
    }
  }

  // Kullanıcı ID ile getirme - NextAuth.js ile
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

  // Şifre değiştirme - NextAuth.js ile
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
    
    // Sign out to force re-login
    await this.logout();
  }

  // Kullanıcı profili güncelleme - NextAuth.js ile
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

  // Generate JWT token (for compatibility)
  static generateJWT(userId: string, sessionId?: string): string {
    // With NextAuth, we don't need to generate JWTs manually
    // Return a simple identifier for compatibility
    return `authjs_${userId}_${Date.now()}`;
  }

  // Verify JWT token (for compatibility)
  static verifyJWT(token: string): { userId: string; sessionId?: string } | null {
    try {
      // Simple token format for compatibility
      const parts = token.split('_');
      if (parts[0] === 'authjs' && parts[1]) {
        return {
          userId: parts[1]
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export auth functions for direct use
export { auth as getSession, signIn as signInUser, signOut as signOutUser };

export default {
  AuthJSService,
  auth,
  signIn,
  signOut,
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema
};
