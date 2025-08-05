import { Elysia } from "elysia";
import { authController } from "./auth.controller.js";
import { authMiddleware, requireAuth } from "../../src/auth/index.js";
import { AuthService } from "../../src/auth/index.js";

// User profile management routes
export const userProfileRouter = new Elysia({ prefix: '/user', name: 'user-profile' })
  .use(authMiddleware)
  
  // Get user profile (requires auth)
  .get('/profile', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized",
        message: "Authentication required"
      };
    }
    
    try {
      const fullUser = await AuthService.getUserById(user.id);
      
      if (!fullUser) {
        set.status = 404;
        return {
          success: false,
          error: "Not Found",
          message: "User not found"
        };
      }
      
      return {
        success: true,
        data: {
          user: fullUser
        }
      };
    } catch (error: any) {
      console.error('Get profile error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Internal Error",
        message: "Failed to get user profile"
      };
    }
  })
  
  // Update user profile (requires auth)
  .patch('/profile', async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized", 
        message: "Authentication required"
      };
    }
    
    try {
      const updatedUser = await AuthService.updateProfile(user.id, body as any);
      
      return {
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser
        }
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Update Failed",
        message: "Failed to update profile"
      };
    }
  })
  
  // Delete user account (requires auth)
  .delete('/account', async ({ user, headers, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized",
        message: "Authentication required"
      };
    }
    
    try {
      // Get session ID for logout
      const sessionCookie = headers.cookie?.split(';')
        .find(c => c.trim().startsWith('deepweb_session='))
        ?.split('=')[1];
      
      // Invalidate all user sessions
      await AuthService.logout(sessionCookie || '');
      
      // Soft delete user (mark as inactive instead of hard delete)
      const { UserQueries } = await import("../../database/operations/user.queries.js");
      await UserQueries.delete(user.id);
      
      // Clear session cookie
      set.headers = {
        ...set.headers,
        'Set-Cookie': 'deepweb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
      };
      
      return {
        success: true,
        message: "Account deleted successfully"
      };
    } catch (error: any) {
      console.error('Delete account error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Delete Failed",
        message: "Failed to delete account"
      };
    }
  });

// OAuth routes
export const oauthRouter = new Elysia({ prefix: '/oauth', name: 'oauth' })
  
  // GitHub OAuth (placeholder for future implementation)
  .get('/github', async ({ set }) => {
    // Redirect to GitHub OAuth
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    const scope = 'user:email';
    
    if (!clientId || !redirectUri) {
      set.status = 500;
      return {
        success: false,
        error: "Configuration Error",
        message: "GitHub OAuth not configured"
      };
    }
    
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    set.status = 302;
    set.headers = {
      ...set.headers,
      'Location': githubUrl
    };
    
    return { redirect: githubUrl };
  })
  
  // GitHub OAuth callback (placeholder)
  .get('/github/callback', async ({ query, set }) => {
    // Handle GitHub OAuth callback
    const { code, error } = query as any;
    
    if (error) {
      set.status = 400;
      return {
        success: false,
        error: "OAuth Error",
        message: error
      };
    }
    
    if (!code) {
      set.status = 400;
      return {
        success: false,
        error: "Missing Code",
        message: "Authorization code not provided"
      };
    }
    
    // TODO: Implement GitHub OAuth token exchange and user creation
    return {
      success: true,
      message: "GitHub OAuth callback received",
      data: { code }
    };
  })
  
  // Discord OAuth (placeholder)
  .get('/discord', async ({ set }) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;
    const scope = 'identify email';
    
    if (!clientId || !redirectUri) {
      set.status = 500;
      return {
        success: false,
        error: "Configuration Error",
        message: "Discord OAuth not configured"
      };
    }
    
    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    set.status = 302;
    set.headers = {
      ...set.headers,
      'Location': discordUrl
    };
    
    return { redirect: discordUrl };
  })
  
  // Discord OAuth callback (placeholder)
  .get('/discord/callback', async ({ query, set }) => {
    const { code, error } = query as any;
    
    if (error) {
      set.status = 400;
      return {
        success: false,
        error: "OAuth Error",
        message: error
      };
    }
    
    if (!code) {
      set.status = 400;
      return {
        success: false,
        error: "Missing Code",
        message: "Authorization code not provided"
      };
    }
    
    // TODO: Implement Discord OAuth token exchange and user creation
    return {
      success: true,
      message: "Discord OAuth callback received",
      data: { code }
    };
  });

// Admin routes (requires admin role)
export const adminAuthRouter = new Elysia({ prefix: '/admin', name: 'admin-auth' })
  .use(requireAuth)
  .derive(({ user, set }) => {
    if (user.role !== 'admin' && user.role !== 'developer') {
      set.status = 403;
      throw new Error("Admin access required");
    }
    return { user };
  })
  
  // List all users (admin only)
  .get('/users', async ({ query, set }) => {
    try {
      const { UserQueries } = await import("../../database/operations/user.queries.js");
      const { limit = 20, offset = 0, role, search } = query as any;
      
      const result = await UserQueries.findMany({
        limit: parseInt(limit),
        offset: parseInt(offset),
        role,
        search
      });
      
      return {
        success: true,
        data: {
          users: result.users,
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      };
    } catch (error: any) {
      console.error('Admin list users error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Internal Error",
        message: "Failed to list users"
      };
    }
  })
  
  // Get user by ID (admin only)
  .get('/users/:id', async ({ params, set }) => {
    try {
      const user = await AuthService.getUserById(params.id);
      
      if (!user) {
        set.status = 404;
        return {
          success: false,
          error: "Not Found",
          message: "User not found"
        };
      }
      
      // Get user stats
      const { UserQueries } = await import("../../database/operations/user.queries.js");
      const stats = await UserQueries.getStats(params.id);
      
      return {
        success: true,
        data: {
          user: {
            ...user,
            stats
          }
        }
      };
    } catch (error: any) {
      console.error('Admin get user error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Internal Error",
        message: "Failed to get user"
      };
    }
  })
  
  // Update user role (admin only)
  .patch('/users/:id/role', async ({ params, body, set }) => {
    try {
      const { role } = body as any;
      
      if (!['user', 'premium', 'admin', 'developer'].includes(role)) {
        set.status = 400;
        return {
          success: false,
          error: "Invalid Role",
          message: "Invalid role specified"
        };
      }
      
      const updatedUser = await AuthService.updateProfile(params.id, { role });
      
      return {
        success: true,
        message: "User role updated successfully",
        data: {
          user: updatedUser
        }
      };
    } catch (error: any) {
      console.error('Admin update role error:', error);
      set.status = 500;
      return {
        success: false,
        error: "Update Failed",
        message: "Failed to update user role"
      };
    }
  });

// Combined auth router
export const authRouter = new Elysia({ prefix: '/api', name: 'auth-router' })
  .use(authController)
  .use(userProfileRouter)
  .use(oauthRouter)
  .use(adminAuthRouter);

export default authRouter;
