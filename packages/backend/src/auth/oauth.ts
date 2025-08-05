import { z } from "zod";
import { sql } from "../lib/neon-client.js";
import { AuthService } from "./index.js";
import crypto from "crypto";

// OAuth providers
export enum OAuthProvider {
  GITHUB = 'github',
  DISCORD = 'discord',
  GOOGLE = 'google',
  TWITTER = 'twitter'
}

// OAuth user data interface
export interface OAuthUserData {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  provider: OAuthProvider;
  providerUserId: string;
}

// OAuth schemas
export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  provider: z.nativeEnum(OAuthProvider)
});

export const LinkAccountSchema = z.object({
  userId: z.string(),
  provider: z.nativeEnum(OAuthProvider),
  providerUserId: z.string(),
  providerEmail: z.string().email()
});

export type OAuthCallbackData = z.infer<typeof OAuthCallbackSchema>;
export type LinkAccountData = z.infer<typeof LinkAccountSchema>;

export class OAuthService {
  
  // OAuth state management
  static async createOAuthState(provider: OAuthProvider, redirectUrl?: string): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with expiration (10 minutes)
    await sql`
      INSERT INTO oauth_states (state, provider, redirect_url, expires_at, created_at)
      VALUES (${state}, ${provider}, ${redirectUrl}, NOW() + INTERVAL '10 minutes', NOW())
    `;
    
    return state;
  }

  // Verify OAuth state
  static async verifyOAuthState(state: string, provider: OAuthProvider): Promise<{
    valid: boolean;
    redirectUrl?: string;
  }> {
    const result = await sql`
      SELECT redirect_url, expires_at 
      FROM oauth_states 
      WHERE state = ${state} AND provider = ${provider} AND used = false
    `;
    
    if (result.length === 0) {
      return { valid: false };
    }
    
    const stateData = result[0];
    
    // Check if state has expired
    if (new Date() > new Date(stateData.expires_at)) {
      return { valid: false };
    }
    
    // Mark state as used
    await sql`
      UPDATE oauth_states SET used = true WHERE state = ${state}
    `;
    
    return {
      valid: true,
      redirectUrl: stateData.redirect_url
    };
  }

  // GitHub OAuth implementation
  static async handleGitHubCallback(code: string, state: string): Promise<{
    user: any;
    session: any;
    token: string;
    isNewUser: boolean;
  }> {
    const stateCheck = await this.verifyOAuthState(state, OAuthProvider.GITHUB);
    
    if (!stateCheck.valid) {
      throw new Error("Invalid OAuth state");
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for access token");
    }
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
    }
    
    // Get user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data from GitHub");
    }
    
    const githubUser = await userResponse.json();
    
    // Get user emails
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const emails = emailResponse.ok ? await emailResponse.json() : [];
    const primaryEmail = emails.find((email: any) => email.primary)?.email || githubUser.email;
    
    const oauthUserData: OAuthUserData = {
      id: githubUser.id.toString(),
      email: primaryEmail,
      username: githubUser.login,
      displayName: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url,
      provider: OAuthProvider.GITHUB,
      providerUserId: githubUser.id.toString()
    };
    
    return this.processOAuthUser(oauthUserData);
  }

  // Discord OAuth implementation
  static async handleDiscordCallback(code: string, state: string): Promise<{
    user: any;
    session: any;
    token: string;
    isNewUser: boolean;
  }> {
    const stateCheck = await this.verifyOAuthState(state, OAuthProvider.DISCORD);
    
    if (!stateCheck.valid) {
      throw new Error("Invalid OAuth state");
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for access token");
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user data from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data from Discord");
    }
    
    const discordUser = await userResponse.json();
    
    const oauthUserData: OAuthUserData = {
      id: discordUser.id,
      email: discordUser.email,
      username: discordUser.username,
      displayName: discordUser.global_name || discordUser.username,
      avatarUrl: discordUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : undefined,
      provider: OAuthProvider.DISCORD,
      providerUserId: discordUser.id
    };
    
    return this.processOAuthUser(oauthUserData);
  }

  // Google OAuth implementation
  static async handleGoogleCallback(code: string, state: string): Promise<{
    user: any;
    session: any;
    token: string;
    isNewUser: boolean;
  }> {
    const stateCheck = await this.verifyOAuthState(state, OAuthProvider.GOOGLE);
    
    if (!stateCheck.valid) {
      throw new Error("Invalid OAuth state");
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for access token");
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user data from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data from Google");
    }
    
    const googleUser = await userResponse.json();
    
    const oauthUserData: OAuthUserData = {
      id: googleUser.id,
      email: googleUser.email,
      username: googleUser.email.split('@')[0], // Use email prefix as username
      displayName: googleUser.name,
      avatarUrl: googleUser.picture,
      provider: OAuthProvider.GOOGLE,
      providerUserId: googleUser.id
    };
    
    return this.processOAuthUser(oauthUserData);
  }

  // Process OAuth user (login or register)
  static async processOAuthUser(oauthData: OAuthUserData): Promise<{
    user: any;
    session: any;
    token: string;
    isNewUser: boolean;
  }> {
    // Check if OAuth account already exists
    const existingOAuthAccount = await sql`
      SELECT user_id FROM user_oauth_accounts 
      WHERE provider = ${oauthData.provider} AND provider_user_id = ${oauthData.providerUserId}
    `;
    
    if (existingOAuthAccount.length > 0) {
      // OAuth account exists, log in the user
      const userId = existingOAuthAccount[0].user_id;
      const user = await AuthService.getUserById(userId);
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Create session
      const session = await AuthService.lucia.createSession(userId, {});
      const token = AuthService.generateJWT(userId, session.id);
      
      // Update last login
      await sql`
        UPDATE users SET last_login_at = NOW() WHERE id = ${userId}
      `;
      
      return {
        user,
        session,
        token,
        isNewUser: false
      };
    }
    
    // Check if user with this email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${oauthData.email}
    `;
    
    if (existingUser.length > 0) {
      // User exists, link OAuth account
      const userId = existingUser[0].id;
      
      await this.linkOAuthAccount({
        userId,
        provider: oauthData.provider,
        providerUserId: oauthData.providerUserId,
        providerEmail: oauthData.email
      });
      
      const user = await AuthService.getUserById(userId);
      const session = await AuthService.lucia.createSession(userId, {});
      const token = AuthService.generateJWT(userId, session.id);
      
      await sql`
        UPDATE users SET last_login_at = NOW() WHERE id = ${userId}
      `;
      
      return {
        user,
        session,
        token,
        isNewUser: false
      };
    }
    
    // Create new user account
    return this.createUserFromOAuth(oauthData);
  }

  // Create new user from OAuth data
  static async createUserFromOAuth(oauthData: OAuthUserData): Promise<{
    user: any;
    session: any;
    token: string;
    isNewUser: boolean;
  }> {
    // Ensure username is unique
    let username = oauthData.username;
    let counter = 1;
    
    while (true) {
      const existingUsername = await sql`
        SELECT id FROM users WHERE username = ${username}
      `;
      
      if (existingUsername.length === 0) {
        break;
      }
      
      username = `${oauthData.username}${counter}`;
      counter++;
    }
    
    // Create user
    const userResult = await sql`
      INSERT INTO users (
        email, username, display_name, avatar_url, role, is_verified, preferences
      ) VALUES (
        ${oauthData.email},
        ${username},
        ${oauthData.displayName},
        ${oauthData.avatarUrl || null},
        'user',
        true,
        '{}'
      )
      RETURNING id, email, username, display_name, avatar_url, role, is_verified, preferences, created_at
    `;
    
    const user = userResult[0];
    
    // Link OAuth account
    await this.linkOAuthAccount({
      userId: user.id,
      provider: oauthData.provider,
      providerUserId: oauthData.providerUserId,
      providerEmail: oauthData.email
    });
    
    // Create session
    const session = await AuthService.lucia.createSession(user.id, {});
    const token = AuthService.generateJWT(user.id, session.id);
    
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
      token,
      isNewUser: true
    };
  }

  // Link OAuth account to existing user
  static async linkOAuthAccount(data: LinkAccountData): Promise<void> {
    const validated = LinkAccountSchema.parse(data);
    
    // Check if this OAuth account is already linked to another user
    const existingLink = await sql`
      SELECT user_id FROM user_oauth_accounts 
      WHERE provider = ${validated.provider} AND provider_user_id = ${validated.providerUserId}
    `;
    
    if (existingLink.length > 0 && existingLink[0].user_id !== validated.userId) {
      throw new Error("This OAuth account is already linked to another user");
    }
    
    // Link the account
    await sql`
      INSERT INTO user_oauth_accounts (
        user_id, provider, provider_user_id, provider_email, created_at
      ) VALUES (
        ${validated.userId}, ${validated.provider}, ${validated.providerUserId}, ${validated.providerEmail}, NOW()
      )
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET 
        provider_user_id = ${validated.providerUserId},
        provider_email = ${validated.providerEmail},
        updated_at = NOW()
    `;
  }

  // Unlink OAuth account
  static async unlinkOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    // Check if user has a password before unlinking
    const userResult = await sql`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;
    
    if (userResult.length === 0) {
      throw new Error("User not found");
    }
    
    // Check if this is the only auth method
    const oauthAccounts = await sql`
      SELECT COUNT(*) as count FROM user_oauth_accounts WHERE user_id = ${userId}
    `;
    
    const hasPassword = userResult[0].password_hash !== null;
    const oauthCount = parseInt(oauthAccounts[0].count);
    
    if (!hasPassword && oauthCount <= 1) {
      throw new Error("Cannot unlink the only authentication method. Please set a password first.");
    }
    
    // Unlink the account
    await sql`
      DELETE FROM user_oauth_accounts 
      WHERE user_id = ${userId} AND provider = ${provider}
    `;
  }

  // Get user's linked OAuth accounts
  static async getUserOAuthAccounts(userId: string): Promise<Array<{
    provider: OAuthProvider;
    providerUserId: string;
    providerEmail: string;
    linkedAt: Date;
  }>> {
    const accounts = await sql`
      SELECT provider, provider_user_id, provider_email, created_at
      FROM user_oauth_accounts 
      WHERE user_id = ${userId}
    `;
    
    return accounts.map(account => ({
      provider: account.provider as OAuthProvider,
      providerUserId: account.provider_user_id,
      providerEmail: account.provider_email,
      linkedAt: new Date(account.created_at)
    }));
  }

  // Generate OAuth authorization URL
  static generateOAuthURL(provider: OAuthProvider, state: string, redirectUri?: string): string {
    const baseUrls = {
      [OAuthProvider.GITHUB]: 'https://github.com/login/oauth/authorize',
      [OAuthProvider.DISCORD]: 'https://discord.com/api/oauth2/authorize',
      [OAuthProvider.GOOGLE]: 'https://accounts.google.com/o/oauth2/v2/auth',
      [OAuthProvider.TWITTER]: 'https://twitter.com/i/oauth2/authorize'
    };
    
    const clientIds = {
      [OAuthProvider.GITHUB]: process.env.GITHUB_CLIENT_ID,
      [OAuthProvider.DISCORD]: process.env.DISCORD_CLIENT_ID,
      [OAuthProvider.GOOGLE]: process.env.GOOGLE_CLIENT_ID,
      [OAuthProvider.TWITTER]: process.env.TWITTER_CLIENT_ID
    };
    
    const scopes = {
      [OAuthProvider.GITHUB]: 'user:email',
      [OAuthProvider.DISCORD]: 'identify email',
      [OAuthProvider.GOOGLE]: 'openid email profile',
      [OAuthProvider.TWITTER]: 'tweet.read users.read'
    };
    
    const redirectUris = {
      [OAuthProvider.GITHUB]: process.env.GITHUB_REDIRECT_URI || redirectUri,
      [OAuthProvider.DISCORD]: process.env.DISCORD_REDIRECT_URI || redirectUri,
      [OAuthProvider.GOOGLE]: process.env.GOOGLE_REDIRECT_URI || redirectUri,
      [OAuthProvider.TWITTER]: process.env.TWITTER_REDIRECT_URI || redirectUri
    };
    
    const params = new URLSearchParams({
      client_id: clientIds[provider]!,
      redirect_uri: redirectUris[provider]!,
      scope: scopes[provider],
      state,
      response_type: 'code'
    });
    
    return `${baseUrls[provider]}?${params.toString()}`;
  }
}

export default {
  OAuthService,
  OAuthProvider,
  OAuthCallbackSchema,
  LinkAccountSchema
};
