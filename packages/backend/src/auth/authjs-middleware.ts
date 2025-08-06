import { Elysia } from "elysia";
import { auth } from "./authjs-service.js";

// Auth middleware for Elysia using NextAuth.js
export const authMiddleware = new Elysia({ name: 'authjs-middleware' })
  .derive(async ({ headers, set }) => {
    try {
      // Get session using NextAuth
      const session = await auth();
      
      if (!session?.user) {
        return { 
          user: null, 
          session: null,
          isAuthenticated: false 
        };
      }
      
      return {
        user: session.user,
        session: session,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('Auth middleware error:', error);
      return { 
        user: null, 
        session: null,
        isAuthenticated: false 
      };
    }
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

// JWT compatibility middleware (for existing API endpoints)
export const jwtAuthMiddleware = new Elysia({ name: 'jwt-auth' })
  .derive(async ({ headers, set }) => {
    // Extract token from Authorization header
    const authHeader = headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { 
        user: null, 
        session: null,
        isAuthenticated: false 
      };
    }
    
    const token = authHeader.substring(7);
    
    try {
      // For JWT tokens from the old system, verify using NextAuth session
      const session = await auth();
      
      if (!session?.user) {
        return { 
          user: null, 
          session: null,
          isAuthenticated: false 
        };
      }
      
      return {
        user: session.user,
        session: session,
        isAuthenticated: true
      };
    } catch (error) {
      return { 
        user: null, 
        session: null,
        isAuthenticated: false 
      };
    }
  });

// MFA middleware (for endpoints requiring MFA)
export const requireMFA = new Elysia({ name: 'require-mfa' })
  .use(requireAuth)
  .derive(async ({ user, set, headers }) => {
    // Check if user has MFA enabled and verified
    const mfaHeader = headers['x-mfa-token'];
    
    // For now, we'll check if user has MFA enabled in their profile
    // In a full implementation, you'd verify the MFA token
    if (user.mfaEnabled && !mfaHeader) {
      set.status = 403;
      throw new Error("MFA verification required");
    }
    
    return { user };
  });

// Rate limiting middleware (can be combined with auth)
export const rateLimitMiddleware = new Elysia({ name: 'rate-limit' })
  .derive(async ({ headers, set }) => {
    // Get client IP
    const clientIP = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
    
    // In a real implementation, you'd use Redis or another store
    // to track request counts per IP/user
    const requestCount = 1; // Placeholder
    const maxRequests = 100; // Per hour
    
    if (requestCount > maxRequests) {
      set.status = 429;
      set.headers['Retry-After'] = '3600';
      throw new Error("Rate limit exceeded");
    }
    
    return { clientIP, requestCount };
  });

// Combined auth and rate limiting
export const authWithRateLimit = new Elysia({ name: 'auth-rate-limit' })
  .use(authMiddleware)
  .use(rateLimitMiddleware);

// Security headers middleware
export const securityHeadersMiddleware = new Elysia({ name: 'security-headers' })
  .onBeforeHandle(({ set }) => {
    // Add security headers
    set.headers = {
      ...set.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  });

export default {
  authMiddleware,
  requireAuth,
  requireRole,
  jwtAuthMiddleware,
  requireMFA,
  rateLimitMiddleware,
  authWithRateLimit,
  securityHeadersMiddleware
};
