import { Elysia } from "elysia";
import { 
  AuthJSService, 
  LoginSchema, 
  RegisterSchema, 
  ChangePasswordSchema,
  auth,
  signIn,
  signOut
} from "./authjs-service.js";
import { OAuthService, OAuthProvider } from "./oauth.js";
import { MFAService, MFAType } from "./mfa.js";
import { authMiddleware, requireAuth } from "./authjs-middleware.js";
import { z } from "zod";

// Auth router with NextAuth.js integration
export const authJSRouter = new Elysia({ prefix: '/api/auth' })
  
  // NextAuth.js handlers
  .all('/[...nextauth]', async (context) => {
    // Handle NextAuth.js requests
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/auth/', '');
    
    // This would be handled by NextAuth.js middleware in a proper setup
    // For now, return a basic response
    return new Response('NextAuth.js handler', { status: 200 });
  })
  
  // Custom registration endpoint
  .post('/register', 
    async ({ body, set }) => {
      try {
        const result = await AuthJSService.register(body);
        set.status = 201;
        return result;
      } catch (error) {
        set.status = 400;
        throw error;
      }
    },
    {
      body: RegisterSchema,
      detail: {
        summary: 'Register new user',
        description: 'Register a new user account',
        tags: ['Auth'],
        produces: ['application/json']
      }
    }
  )
  
  // Custom login endpoint
  .post('/login', 
    async ({ body, set }) => {
      try {
        const result = await AuthJSService.login(body);
        set.status = 200;
        return result;
      } catch (error) {
        set.status = 400;
        throw error;
      }
    },
    {
      body: LoginSchema,
      detail: {
        summary: 'Login user',
        description: 'Login with email and password',
        tags: ['Auth'],
        produces: ['application/json']
      }
    }
  )
  
  // Logout endpoint
  .post('/logout', 
    async ({ set }) => {
      try {
        await AuthJSService.logout();
        set.status = 200;
        return { message: 'Logged out successfully' };
      } catch (error) {
        set.status = 400;
        throw error;
      }
    },
    {
      detail: {
        summary: 'Logout user',
        description: 'Logout current user',
        tags: ['Auth'],
        produces: ['application/json']
      }
    }
  )
  
  // Get current session
  .get('/session', 
    async ({ set }) => {
      try {
        const session = await auth();
        set.status = 200;
        return { session };
      } catch (error) {
        set.status = 401;
        return { session: null };
      }
    },
    {
      detail: {
        summary: 'Get current session',
        description: 'Get current user session',
        tags: ['Auth'],
        produces: ['application/json']
      }
    }
  )

  // Protected routes
  .use(requireAuth)
  
  // Get current user profile
  .get('/me', 
    async ({ user, set }) => {
      try {
        const userProfile = await AuthJSService.getUserById(user.id);
        set.status = 200;
        return { user: userProfile };
      } catch (error) {
        set.status = 404;
        throw error;
      }
    },
    {
      detail: {
        summary: 'Get current user profile',
        description: 'Get current authenticated user profile',
        tags: ['Auth', 'User'],
        produces: ['application/json'],
        security: [{ bearerAuth: [] }]
      }
    }
  )
  
  // Update user profile
  .patch('/me', 
    async ({ user, body, set }) => {
      try {
        const updates = body as {
          displayName?: string;
          avatarUrl?: string;
          bio?: string;
          preferences?: Record<string, any>;
        };
        
        const updatedUser = await AuthJSService.updateProfile(user.id, updates);
        set.status = 200;
        return { user: updatedUser };
      } catch (error) {
        set.status = 400;
        throw error;
      }
    },
    {
      body: z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().url().optional(),
        bio: z.string().optional(),
        preferences: z.record(z.any()).optional()
      }),
      detail: {
        summary: 'Update user profile',
        description: 'Update current user profile',
        tags: ['Auth', 'User'],
        produces: ['application/json'],
        security: [{ bearerAuth: [] }]
      }
    }
  )
  
  // Change password
  .post('/change-password', 
    async ({ user, body, set }) => {
      try {
        await AuthJSService.changePassword(user.id, body);
        set.status = 200;
        return { message: 'Password changed successfully' };
      } catch (error) {
        set.status = 400;
        throw error;
      }
    },
    {
      body: ChangePasswordSchema,
      detail: {
        summary: 'Change password',
        description: 'Change current user password',
        tags: ['Auth'],
        produces: ['application/json'],
        security: [{ bearerAuth: [] }]
      }
    }
  )

  // OAuth routes
  .group('/oauth', (app) => app
    
    // Generate OAuth URL
    .get('/:provider/url', 
      async ({ params, query, set }) => {
        try {
          const provider = params.provider as OAuthProvider;
          const redirectUrl = query.redirect;
          
          const state = await OAuthService.createOAuthState(provider, redirectUrl);
          const authUrl = OAuthService.generateOAuthURL(provider, state, redirectUrl);
          
          set.status = 200;
          return { authUrl, state };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        params: z.object({
          provider: z.nativeEnum(OAuthProvider)
        }),
        query: z.object({
          redirect: z.string().url().optional()
        }),
        detail: {
          summary: 'Get OAuth authorization URL',
          description: 'Get OAuth authorization URL for specified provider',
          tags: ['Auth', 'OAuth'],
          produces: ['application/json']
        }
      }
    )
    
    // OAuth callback
    .get('/:provider/callback', 
      async ({ params, query, set }) => {
        try {
          const provider = params.provider as OAuthProvider;
          const { code, state } = query;
          
          let result;
          switch (provider) {
            case OAuthProvider.GITHUB:
              result = await OAuthService.handleGitHubCallback(code, state);
              break;
            case OAuthProvider.DISCORD:
              result = await OAuthService.handleDiscordCallback(code, state);
              break;
            case OAuthProvider.GOOGLE:
              result = await OAuthService.handleGoogleCallback(code, state);
              break;
            default:
              throw new Error('Unsupported OAuth provider');
          }
          
          set.status = 200;
          return result;
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        params: z.object({
          provider: z.nativeEnum(OAuthProvider)
        }),
        query: z.object({
          code: z.string(),
          state: z.string()
        }),
        detail: {
          summary: 'OAuth callback',
          description: 'Handle OAuth callback from provider',
          tags: ['Auth', 'OAuth'],
          produces: ['application/json']
        }
      }
    )
    
    // Get linked OAuth accounts
    .get('/accounts', 
      async ({ user, set }) => {
        try {
          const accounts = await OAuthService.getUserOAuthAccounts(user.id);
          set.status = 200;
          return { accounts };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        detail: {
          summary: 'Get linked OAuth accounts',
          description: 'Get OAuth accounts linked to current user',
          tags: ['Auth', 'OAuth'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
    
    // Unlink OAuth account
    .delete('/:provider', 
      async ({ user, params, set }) => {
        try {
          const provider = params.provider as OAuthProvider;
          await OAuthService.unlinkOAuthAccount(user.id, provider);
          set.status = 200;
          return { message: 'OAuth account unlinked successfully' };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        params: z.object({
          provider: z.nativeEnum(OAuthProvider)
        }),
        detail: {
          summary: 'Unlink OAuth account',
          description: 'Unlink OAuth account from current user',
          tags: ['Auth', 'OAuth'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
  )

  // MFA routes
  .group('/mfa', (app) => app
    
    // Get MFA status
    .get('/status', 
      async ({ user, set }) => {
        try {
          const status = await MFAService.getMFAStatus(user.id);
          set.status = 200;
          return status;
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        detail: {
          summary: 'Get MFA status',
          description: 'Get current user MFA status and enabled methods',
          tags: ['Auth', 'MFA'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
    
    // Generate TOTP secret
    .post('/totp/setup', 
      async ({ user, set }) => {
        try {
          const result = await MFAService.generateTOTPSecret(user.id);
          set.status = 200;
          return result;
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        detail: {
          summary: 'Setup TOTP',
          description: 'Generate TOTP secret and QR code for setup',
          tags: ['Auth', 'MFA'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
    
    // Enable TOTP
    .post('/totp/enable', 
      async ({ user, body, set }) => {
        try {
          const backupCodes = await MFAService.enableTOTP({
            userId: user.id,
            token: body.token
          });
          set.status = 200;
          return { backupCodes, message: 'TOTP enabled successfully' };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        body: z.object({
          token: z.string().length(6, "TOTP token must be 6 digits")
        }),
        detail: {
          summary: 'Enable TOTP',
          description: 'Enable TOTP MFA with verification token',
          tags: ['Auth', 'MFA'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
    
    // Verify MFA
    .post('/verify', 
      async ({ user, body, set }) => {
        try {
          const verified = await MFAService.verifyMFA({
            userId: user.id,
            token: body.token,
            type: body.type
          });
          
          set.status = 200;
          return { verified };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        body: z.object({
          token: z.string(),
          type: z.nativeEnum(MFAType)
        }),
        detail: {
          summary: 'Verify MFA',
          description: 'Verify MFA token',
          tags: ['Auth', 'MFA'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
    
    // Disable MFA
    .delete('/:type', 
      async ({ user, params, set }) => {
        try {
          const type = params.type as MFAType;
          await MFAService.disableMFA(user.id, type);
          set.status = 200;
          return { message: 'MFA disabled successfully' };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        params: z.object({
          type: z.nativeEnum(MFAType)
        }),
        detail: {
          summary: 'Disable MFA',
          description: 'Disable MFA method for current user',
          tags: ['Auth', 'MFA'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
    
    // Regenerate backup codes
    .post('/backup-codes/regenerate', 
      async ({ user, set }) => {
        try {
          const backupCodes = await MFAService.regenerateBackupCodes(user.id);
          set.status = 200;
          return { backupCodes };
        } catch (error) {
          set.status = 400;
          throw error;
        }
      },
      {
        detail: {
          summary: 'Regenerate backup codes',
          description: 'Generate new backup codes for MFA',
          tags: ['Auth', 'MFA'],
          produces: ['application/json'],
          security: [{ bearerAuth: [] }]
        }
      }
    )
  );

export default authJSRouter;
