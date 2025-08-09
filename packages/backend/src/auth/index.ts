// NextAuth.js ile authentication sistemi
// Auth.js (NextAuth.js) kullanarak kullanıcı kimlik doğrulama ve oturum yönetimi
import { AuthJSService } from "./authjs-service.js";
import { auth, signIn, signOut } from "./authjs-service.js";
import { sql } from "../lib/neon-client.js";
import { z } from "zod";
import { Elysia } from "elysia";
// NextAuth.js sürümünde bcrypt ve jwt artık gerekli değil

// Kimlik doğrulama şemaları - NextAuth ile uyumlu
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

// Auth service class - NextAuth.js wrapper ile uyumlu
export class AuthService {
  // Şifre hash işlemi
  static async hashPassword(password: [REDACTED:password]): Promise<string> {
    return AuthJSService.hashPassword(password);
  }

  // Şifre doğrulama
  static async verifyPassword(password: [REDACTED:password], hash: string): Promise<boolean> {
    return AuthJSService.verifyPassword(password, hash);
  }

  // JWT token oluşturma - NextAuth ile uyumluluk için
  static generateJWT(userId: string, sessionId?: string): string {
    return AuthJSService.generateJWT(userId, sessionId);
  }

  // JWT token doğrulama - NextAuth ile uyumluluk için
  static verifyJWT(token: string): { userId: string; sessionId?: string } | null {
    return AuthJSService.verifyJWT(token);
  }

  // Yeni kullanıcı kaydı - NextAuth.js kullanılıyor
  static async register(data: RegisterData): Promise<{
    user: any;
    session: any;
    token: string;
  }> {
    return AuthJSService.register(data);
  }

  // Kullanıcı girişi - NextAuth.js kullanılıyor
  static async login(data: LoginData): Promise<{
    user: any;
    session: any;
    token: string;
  }> {
    return AuthJSService.login(data);
  }

  // Kullanıcı çıkışı - NextAuth.js kullanılıyor
  static async logout(): Promise<void> {
    return AuthJSService.logout();
  }

  // Oturum doğrulama - NextAuth.js kullanılıyor
  static async validateSession(sessionToken?: string): Promise<{
    user: any;
    session: any;
  } | null> {
    return AuthJSService.validateSession(sessionToken);
  }

  // Kullanıcı ID ile getirme
  static async getUserById(userId: string): Promise<any | null> {
    return AuthJSService.getUserById(userId);
  }

  // Şifre değiştirme
  static async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    return AuthJSService.changePassword(userId, data);
  }

  // Kullanıcı profili güncelleme
  static async updateProfile(userId: string, updates: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    preferences?: Record<string, any>;
  }): Promise<any> {
    return AuthJSService.updateProfile(userId, updates);
  }
}

// Auth middleware - NextAuth.js oturumları ile çalışır
export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ headers, set }) => {
    // Authorization header veya cookie'den token çıkarma
    const authHeader = headers.authorization;
    let sessionToken: string | undefined;
    
    if (authHeader?.startsWith('Bearer ')) {
      // JWT token kimlik doğrulama
      const token = authHeader.substring(7);
      const jwtPayload = AuthService.verifyJWT(token);
      
      if (jwtPayload) {
        sessionToken = token;
      }
    }
    
    const result = await AuthService.validateSession(sessionToken);
    
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

// Kimlik doğrulama gerekliliği middleware
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authMiddleware)
  .derive(({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }
    
    return { user };
  });

// Belirli rol gerekliliği middleware
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
