import { Elysia, t } from "elysia";
import { AuthService, RegisterSchema, LoginSchema, ChangePasswordSchema } from "../../auth/index.js";
import { authRateLimit } from "../../middleware/rate-limiter.js";
import { authSecurityMiddleware } from "../../middleware/helmet.js";

// Auth controller with Elysia
export const authController = new Elysia({ prefix: '/auth', name: 'auth-controller' })
  .use(authRateLimit)
  .use(authSecurityMiddleware)
  
  // Register endpoint
  .post('/register', async ({ body, set, headers }) => {
    try {
      const result = await AuthService.register(body as any);
      
      // Set session cookie
      if (result.session) {
        set.headers = {
          ...set.headers,
          'Set-Cookie': `deepweb_session=${result.session.id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        };
      }
      
      set.status = 201;
      return {
        success: true,
        message: "Account created successfully",
        data: {
          user: result.user,
          token: result.token,
          sessionId: result.session.id
        }
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message.includes('already exists')) {
        set.status = 409;
        return {
          success: false,
          error: "Conflict",
          message: error.message
        };
      }
      
      if (error.message.includes('validation') || error.message.includes('Invalid')) {
        set.status = 400;
        return {
          success: false,
          error: "Validation Error",
          message: error.message
        };
      }
      
      set.status = 500;
      return {
        success: false,
        error: "Registration Failed",
        message: "An error occurred during registration"
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      username: t.String({ minLength: 3, maxLength: 50 }),
      password: t.String({ minLength: 8 }),
      displayName: t.Optional(t.String()),
      preferences: t.Optional(t.Record(t.String(), t.Any()))
    }),
    response: {
      201: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          user: t.Object({
            id: t.String(),
            email: t.String(),
            username: t.String(),
            displayName: t.String(),
            role: t.String(),
            isVerified: t.Boolean()
          }),
          token: t.String(),
          sessionId: t.String()
        })
      }),
      400: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      }),
      409: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      })
    }
  })
  
  // Login endpoint
  .post('/login', async ({ body, set }) => {
    try {
      const result = await AuthService.login(body as any);
      
      // Set session cookie
      if (result.session) {
        set.headers = {
          ...set.headers,
          'Set-Cookie': `deepweb_session=${result.session.id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        };
      }
      
      return {
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          token: result.token,
          sessionId: result.session.id
        }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid email or password')) {
        set.status = 401;
        return {
          success: false,
          error: "Authentication Failed",
          message: "Invalid email or password"
        };
      }
      
      set.status = 500;
      return {
        success: false,
        error: "Login Failed",
        message: "An error occurred during login"
      };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 1 })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          user: t.Object({
            id: t.String(),
            email: t.String(),
            username: t.String(),
            displayName: t.String(),
            role: t.String(),
            isVerified: t.Boolean()
          }),
          token: t.String(),
          sessionId: t.String()
        })
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      })
    }
  })
  
  // Logout endpoint
  .post('/logout', async ({ headers, set }) => {
    try {
      // Extract session from Authorization header or cookie
      const authHeader = headers.authorization;
      const sessionCookie = headers.cookie?.split(';')
        .find(c => c.trim().startsWith('deepweb_session='))
        ?.split('=')[1];
      
      let sessionId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwtPayload = AuthService.verifyJWT(token);
        sessionId = jwtPayload?.sessionId || null;
      } else if (sessionCookie) {
        sessionId = sessionCookie;
      }
      
      if (sessionId) {
        await AuthService.logout(sessionId);
      }
      
      // Clear session cookie
      set.headers = {
        ...set.headers,
        'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
      };
      
      return {
        success: true,
        message: "Logout successful"
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if logout fails, clear the cookie
      set.headers = {
        ...set.headers,
        'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
      };
      
      return {
        success: true,
        message: "Logout completed"
      };
    }
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String()
      })
    }
  })
  
  // Get current user
  .get('/me', async ({ headers, set }) => {
    try {
      // Extract session
      const authHeader = headers.authorization;
      const sessionCookie = headers.cookie?.split(';')
        .find(c => c.trim().startsWith('deepweb_session='))
        ?.split('=')[1];
      
      let sessionId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwtPayload = AuthService.verifyJWT(token);
        sessionId = jwtPayload?.sessionId || null;
      } else if (sessionCookie) {
        sessionId = sessionCookie;
      }
      
      if (!sessionId) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          message: "No valid session found"
        };
      }
      
      const result = await AuthService.validateSession(sessionId);
      
      if (!result) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized", 
          message: "Invalid session"
        };
      }
      
      return {
        success: true,
        data: {
          user: result.user,
          session: {
            id: result.session.id,
            expiresAt: result.session.expiresAt
          }
        }
      };
    } catch (error: any) {
      console.error('Get user error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Internal Error",
        message: "Failed to get user information"
      };
    }
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: t.Object({
          user: t.Object({
            id: t.String(),
            email: t.String(),
            username: t.String(),
            displayName: t.String(),
            role: t.String(),
            isVerified: t.Boolean()
          }),
          session: t.Object({
            id: t.String(),
            expiresAt: t.Date()
          })
        })
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      })
    }
  })
  
  // Change password (requires authentication)
  .post('/change-password', async ({ body, headers, set }) => {
    try {
      // Extract and validate session
      const authHeader = headers.authorization;
      const sessionCookie = headers.cookie?.split(';')
        .find(c => c.trim().startsWith('deepweb_session='))
        ?.split('=')[1];
      
      let sessionId: string | null = null;
      let userId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const jwtPayload = AuthService.verifyJWT(token);
        if (jwtPayload) {
          sessionId = jwtPayload.sessionId;
          userId = jwtPayload.userId;
        }
      } else if (sessionCookie) {
        sessionId = sessionCookie;
        const result = await AuthService.validateSession(sessionCookie);
        if (result) {
          userId = result.user.id;
        }
      }
      
      if (!sessionId || !userId) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          message: "Authentication required"
        };
      }
      
      await AuthService.changePassword(userId, body as any);
      
      // Clear session cookie since all sessions are invalidated
      set.headers = {
        ...set.headers,
        'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
      };
      
      return {
        success: true,
        message: "Password changed successfully. Please log in again."
      };
    } catch (error: any) {
      console.error('Change password error:', error);
      
      if (error.message.includes('Current password is incorrect')) {
        set.status = 400;
        return {
          success: false,
          error: "Invalid Password",
          message: error.message
        };
      }
      
      if (error.message.includes('validation')) {
        set.status = 400;
        return {
          success: false,
          error: "Validation Error",
          message: error.message
        };
      }
      
      set.status = 500;
      return {
        success: false,
        error: "Change Password Failed",
        message: "An error occurred while changing password"
      };
    }
  }, {
    body: t.Object({
      currentPassword: t.String({ minLength: 1 }),
      newPassword: t.String({ minLength: 8 })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String()
      }),
      400: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      })
    }
  })
  
  // Refresh token
  .post('/refresh', async ({ headers, set }) => {
    try {
      const sessionCookie = headers.cookie?.split(';')
        .find(c => c.trim().startsWith('deepweb_session='))
        ?.split('=')[1];
      
      if (!sessionCookie) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          message: "No session found"
        };
      }
      
      const result = await AuthService.validateSession(sessionCookie);
      
      if (!result) {
        set.status = 401;
        return {
          success: false,
          error: "Unauthorized",
          message: "Invalid session"
        };
      }
      
      // Generate new JWT token
      const token = AuthService.generateJWT(result.user.id, result.session.id);
      
      return {
        success: true,
        message: "Token refreshed successfully",
        data: {
          token,
          user: result.user,
          sessionId: result.session.id
        }
      };
    } catch (error: any) {
      console.error('Refresh token error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Refresh Failed",
        message: "Failed to refresh token"
      };
    }
  }, {
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          token: t.String(),
          user: t.Object({
            id: t.String(),
            email: t.String(),
            username: t.String(),
            displayName: t.String(),
            role: t.String()
          }),
          sessionId: t.String()
        })
      }),
      401: t.Object({
        success: t.Boolean(),
        error: t.String(),
        message: t.String()
      })
    }
  });

export default authController;
