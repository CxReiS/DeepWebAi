/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OAuthService, OAuthProvider } from '../../../packages/backend/src/auth/oauth.js';
import { AuthService } from '../../../packages/backend/src/auth/index.js';
import { sql } from '../../../packages/backend/lib/neon-client.js';

// Mock fetch for OAuth API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.mock('process', () => ({
  env: {
    GITHUB_CLIENT_ID: 'test_github_client_id',
    GITHUB_CLIENT_SECRET: 'test_github_client_secret',
    GITHUB_REDIRECT_URI: 'http://localhost:3000/auth/github/callback',
    DISCORD_CLIENT_ID: 'test_discord_client_id',
    DISCORD_CLIENT_SECRET: 'test_discord_client_secret',
    DISCORD_REDIRECT_URI: 'http://localhost:3000/auth/discord/callback',
    GOOGLE_CLIENT_ID: 'test_google_client_id',
    GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
    JWT_SECRET: 'test_jwt_secret'
  }
}));

describe('OAuth Service', () => {
  let testUser: any;
  let testUserId: string;

  beforeEach(async () => {
    // Clean up test data
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%oauthtest%'`;

    // Reset fetch mock
    mockFetch.mockReset();

    // Create test user
    const userData = {
      email: 'oauthtest@test.com',
      username: 'oauthtest',
      password: 'TestPassword123!',
      displayName: 'OAuth Test User'
    };

    testUser = await AuthService.register(userData);
    testUserId = testUser.user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%oauthtest%'`;
  });

  describe('OAuth State Management', () => {
    it('should create OAuth state', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB, 'http://localhost:3000/dashboard');

      expect(state).toMatch(/^[a-f0-9]{64}$/); // 64 character hex string

      // Verify state is stored in database
      const stateResult = await sql`
        SELECT provider, redirect_url, expires_at, used FROM oauth_states 
        WHERE state = ${state}
      `;

      expect(stateResult).toHaveLength(1);
      expect(stateResult[0].provider).toBe(OAuthProvider.GITHUB);
      expect(stateResult[0].redirect_url).toBe('http://localhost:3000/dashboard');
      expect(stateResult[0].used).toBe(false);
    });

    it('should verify valid OAuth state', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB, 'http://localhost:3000/dashboard');

      const result = await OAuthService.verifyOAuthState(state, OAuthProvider.GITHUB);

      expect(result.valid).toBe(true);
      expect(result.redirectUrl).toBe('http://localhost:3000/dashboard');

      // Verify state is marked as used
      const stateResult = await sql`
        SELECT used FROM oauth_states WHERE state = ${state}
      `;

      expect(stateResult[0].used).toBe(true);
    });

    it('should reject invalid OAuth state', async () => {
      const result = await OAuthService.verifyOAuthState('invalid_state', OAuthProvider.GITHUB);

      expect(result.valid).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should reject expired OAuth state', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);

      // Manually expire the state
      await sql`
        UPDATE oauth_states 
        SET expires_at = NOW() - INTERVAL '1 minute'
        WHERE state = ${state}
      `;

      const result = await OAuthService.verifyOAuthState(state, OAuthProvider.GITHUB);

      expect(result.valid).toBe(false);
    });

    it('should reject used OAuth state', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);

      // Use the state once
      await OAuthService.verifyOAuthState(state, OAuthProvider.GITHUB);

      // Try to use it again
      const result = await OAuthService.verifyOAuthState(state, OAuthProvider.GITHUB);

      expect(result.valid).toBe(false);
    });
  });

  describe('GitHub OAuth', () => {
    const mockGitHubUser = {
      id: 12345,
      login: 'testuser',
      name: 'Test User',
      email: 'test@github.com',
      avatar_url: 'https://github.com/avatar.png'
    };

    const mockGitHubEmails = [
      { email: 'test@github.com', primary: true, verified: true },
      { email: 'secondary@github.com', primary: false, verified: true }
    ];

    beforeEach(() => {
      // Mock GitHub OAuth API responses
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'test_access_token',
            token_type: 'bearer'
          })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubEmails)
        }));
    });

    it('should handle GitHub OAuth callback for new user', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const code = 'test_auth_code';

      const result = await OAuthService.handleGitHubCallback(code, state);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token');
      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('test@github.com');
      expect(result.user.username).toBe('testuser');
      expect(result.user.displayName).toBe('Test User');
      expect(result.user.avatarUrl).toBe('https://github.com/avatar.png');
      expect(result.user.isVerified).toBe(true);

      // Verify OAuth account is linked
      const oauthResult = await sql`
        SELECT provider, provider_user_id, provider_email FROM user_oauth_accounts 
        WHERE user_id = ${result.user.id}
      `;

      expect(oauthResult).toHaveLength(1);
      expect(oauthResult[0].provider).toBe(OAuthProvider.GITHUB);
      expect(oauthResult[0].provider_user_id).toBe('12345');
      expect(oauthResult[0].provider_email).toBe('test@github.com');
    });

    it('should handle GitHub OAuth callback for existing user with same email', async () => {
      // Create user with same email as GitHub account
      const existingUserData = {
        email: 'test@github.com',
        username: 'existing',
        password: 'ExistingPassword123!'
      };
      const existingUser = await AuthService.register(existingUserData);

      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const code = 'test_auth_code';

      const result = await OAuthService.handleGitHubCallback(code, state);

      expect(result.isNewUser).toBe(false);
      expect(result.user.id).toBe(existingUser.user.id);
      expect(result.user.email).toBe('test@github.com');

      // Verify OAuth account is linked to existing user
      const oauthResult = await sql`
        SELECT user_id FROM user_oauth_accounts 
        WHERE provider = ${OAuthProvider.GITHUB} AND provider_user_id = '12345'
      `;

      expect(oauthResult[0].user_id).toBe(existingUser.user.id);
    });

    it('should handle GitHub OAuth callback for existing OAuth account', async () => {
      // First OAuth login creates the account
      const state1 = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const firstResult = await OAuthService.handleGitHubCallback('code1', state1);

      // Reset fetch mock for second call
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'test_access_token_2',
            token_type: 'bearer'
          })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubEmails)
        }));

      // Second OAuth login should find existing account
      const state2 = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const secondResult = await OAuthService.handleGitHubCallback('code2', state2);

      expect(secondResult.isNewUser).toBe(false);
      expect(secondResult.user.id).toBe(firstResult.user.id);
      expect(secondResult.user.email).toBe('test@github.com');
    });

    it('should reject GitHub OAuth with invalid state', async () => {
      await expect(OAuthService.handleGitHubCallback('code', 'invalid_state'))
        .rejects.toThrow('Invalid OAuth state');
    });

    it('should handle GitHub OAuth API errors', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);

      // Mock failed token exchange
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 400
      }));

      await expect(OAuthService.handleGitHubCallback('code', state))
        .rejects.toThrow('Failed to exchange code for access token');
    });

    it('should handle GitHub OAuth error responses', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);

      // Mock error response from GitHub
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid'
        })
      }));

      await expect(OAuthService.handleGitHubCallback('code', state))
        .rejects.toThrow('GitHub OAuth error: The provided authorization grant is invalid');
    });
  });

  describe('Discord OAuth', () => {
    const mockDiscordUser = {
      id: '123456789',
      username: 'discorduser',
      global_name: 'Discord User',
      email: 'test@discord.com',
      avatar: 'avatar_hash'
    };

    beforeEach(() => {
      // Mock Discord OAuth API responses
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'discord_access_token',
            token_type: 'Bearer'
          })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDiscordUser)
        }));
    });

    it('should handle Discord OAuth callback for new user', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.DISCORD);
      const code = 'discord_auth_code';

      const result = await OAuthService.handleDiscordCallback(code, state);

      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('test@discord.com');
      expect(result.user.username).toBe('discorduser');
      expect(result.user.displayName).toBe('Discord User');
      expect(result.user.avatarUrl).toBe('https://cdn.discordapp.com/avatars/123456789/avatar_hash.png');

      // Verify OAuth account is linked
      const oauthResult = await sql`
        SELECT provider, provider_user_id FROM user_oauth_accounts 
        WHERE user_id = ${result.user.id}
      `;

      expect(oauthResult[0].provider).toBe(OAuthProvider.DISCORD);
      expect(oauthResult[0].provider_user_id).toBe('123456789');
    });

    it('should handle Discord user without global_name', async () => {
      const userWithoutGlobalName = {
        ...mockDiscordUser,
        global_name: null
      };

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'discord_access_token',
            token_type: 'Bearer'
          })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(userWithoutGlobalName)
        }));

      const state = await OAuthService.createOAuthState(OAuthProvider.DISCORD);
      const result = await OAuthService.handleDiscordCallback('code', state);

      expect(result.user.displayName).toBe('discorduser'); // Falls back to username
    });
  });

  describe('Google OAuth', () => {
    const mockGoogleUser = {
      id: 'google_user_id',
      email: 'test@google.com',
      name: 'Google User',
      picture: 'https://google.com/avatar.jpg'
    };

    beforeEach(() => {
      // Mock Google OAuth API responses
      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'google_access_token',
            token_type: 'Bearer'
          })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoogleUser)
        }));
    });

    it('should handle Google OAuth callback for new user', async () => {
      const state = await OAuthService.createOAuthState(OAuthProvider.GOOGLE);
      const code = 'google_auth_code';

      const result = await OAuthService.handleGoogleCallback(code, state);

      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('test@google.com');
      expect(result.user.username).toBe('test'); // Email prefix
      expect(result.user.displayName).toBe('Google User');
      expect(result.user.avatarUrl).toBe('https://google.com/avatar.jpg');

      // Verify OAuth account is linked
      const oauthResult = await sql`
        SELECT provider, provider_user_id FROM user_oauth_accounts 
        WHERE user_id = ${result.user.id}
      `;

      expect(oauthResult[0].provider).toBe(OAuthProvider.GOOGLE);
      expect(oauthResult[0].provider_user_id).toBe('google_user_id');
    });
  });

  describe('Account Linking', () => {
    it('should link OAuth account to existing user', async () => {
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_123',
        providerEmail: 'test@github.com'
      });

      const oauthResult = await sql`
        SELECT provider, provider_user_id, provider_email FROM user_oauth_accounts 
        WHERE user_id = ${testUserId}
      `;

      expect(oauthResult).toHaveLength(1);
      expect(oauthResult[0].provider).toBe(OAuthProvider.GITHUB);
      expect(oauthResult[0].provider_user_id).toBe('github_123');
      expect(oauthResult[0].provider_email).toBe('test@github.com');
    });

    it('should update existing OAuth link', async () => {
      // Link initial account
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_123',
        providerEmail: 'old@github.com'
      });

      // Update the link
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_456',
        providerEmail: 'new@github.com'
      });

      const oauthResult = await sql`
        SELECT provider_user_id, provider_email FROM user_oauth_accounts 
        WHERE user_id = ${testUserId} AND provider = ${OAuthProvider.GITHUB}
      `;

      expect(oauthResult).toHaveLength(1);
      expect(oauthResult[0].provider_user_id).toBe('github_456');
      expect(oauthResult[0].provider_email).toBe('new@github.com');
    });

    it('should reject linking OAuth account already linked to another user', async () => {
      // Create another user
      const userData2 = {
        email: 'user2@test.com',
        username: 'user2',
        password: 'TestPassword123!'
      };
      const user2 = await AuthService.register(userData2);

      // Link OAuth account to first user
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_123',
        providerEmail: 'test@github.com'
      });

      // Try to link same OAuth account to second user
      await expect(OAuthService.linkOAuthAccount({
        userId: user2.user.id,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_123',
        providerEmail: 'test@github.com'
      })).rejects.toThrow('This OAuth account is already linked to another user');
    });
  });

  describe('Account Unlinking', () => {
    beforeEach(async () => {
      // Link OAuth account for unlinking tests
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_123',
        providerEmail: 'test@github.com'
      });
    });

    it('should unlink OAuth account when user has password', async () => {
      await OAuthService.unlinkOAuthAccount(testUserId, OAuthProvider.GITHUB);

      const oauthResult = await sql`
        SELECT * FROM user_oauth_accounts 
        WHERE user_id = ${testUserId} AND provider = ${OAuthProvider.GITHUB}
      `;

      expect(oauthResult).toHaveLength(0);
    });

    it('should reject unlinking only auth method', async () => {
      // Remove password from user
      await sql`
        UPDATE users SET password_hash = NULL WHERE id = ${testUserId}
      `;

      await expect(OAuthService.unlinkOAuthAccount(testUserId, OAuthProvider.GITHUB))
        .rejects.toThrow('Cannot unlink the only authentication method');
    });

    it('should allow unlinking when multiple OAuth accounts exist', async () => {
      // Remove password from user
      await sql`
        UPDATE users SET password_hash = NULL WHERE id = ${testUserId}
      `;

      // Link another OAuth account
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.DISCORD,
        providerUserId: 'discord_123',
        providerEmail: 'test@discord.com'
      });

      // Should be able to unlink one OAuth account
      await OAuthService.unlinkOAuthAccount(testUserId, OAuthProvider.GITHUB);

      const githubResult = await sql`
        SELECT * FROM user_oauth_accounts 
        WHERE user_id = ${testUserId} AND provider = ${OAuthProvider.GITHUB}
      `;

      const discordResult = await sql`
        SELECT * FROM user_oauth_accounts 
        WHERE user_id = ${testUserId} AND provider = ${OAuthProvider.DISCORD}
      `;

      expect(githubResult).toHaveLength(0);
      expect(discordResult).toHaveLength(1);
    });
  });

  describe('OAuth Account Management', () => {
    beforeEach(async () => {
      // Link multiple OAuth accounts
      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.GITHUB,
        providerUserId: 'github_123',
        providerEmail: 'test@github.com'
      });

      await OAuthService.linkOAuthAccount({
        userId: testUserId,
        provider: OAuthProvider.DISCORD,
        providerUserId: 'discord_456',
        providerEmail: 'test@discord.com'
      });
    });

    it('should get user OAuth accounts', async () => {
      const accounts = await OAuthService.getUserOAuthAccounts(testUserId);

      expect(accounts).toHaveLength(2);

      const githubAccount = accounts.find(a => a.provider === OAuthProvider.GITHUB);
      const discordAccount = accounts.find(a => a.provider === OAuthProvider.DISCORD);

      expect(githubAccount).toBeDefined();
      expect(githubAccount!.providerUserId).toBe('github_123');
      expect(githubAccount!.providerEmail).toBe('test@github.com');
      expect(githubAccount!.linkedAt).toBeInstanceOf(Date);

      expect(discordAccount).toBeDefined();
      expect(discordAccount!.providerUserId).toBe('discord_456');
      expect(discordAccount!.providerEmail).toBe('test@discord.com');
    });

    it('should return empty array for user with no OAuth accounts', async () => {
      const userData = {
        email: 'nooauth@test.com',
        username: 'nooauth',
        password: 'TestPassword123!'
      };
      const user = await AuthService.register(userData);

      const accounts = await OAuthService.getUserOAuthAccounts(user.user.id);
      expect(accounts).toHaveLength(0);
    });
  });

  describe('OAuth URL Generation', () => {
    it('should generate GitHub OAuth URL', () => {
      const state = 'test_state';
      const url = OAuthService.generateOAuthURL(OAuthProvider.GITHUB, state);

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test_github_client_id');
      expect(url).toContain('state=test_state');
      expect(url).toContain('scope=user%3Aemail');
      expect(url).toContain('response_type=code');
    });

    it('should generate Discord OAuth URL', () => {
      const state = 'test_state';
      const url = OAuthService.generateOAuthURL(OAuthProvider.DISCORD, state);

      expect(url).toContain('https://discord.com/api/oauth2/authorize');
      expect(url).toContain('client_id=test_discord_client_id');
      expect(url).toContain('state=test_state');
      expect(url).toContain('scope=identify%20email');
    });

    it('should generate Google OAuth URL', () => {
      const state = 'test_state';
      const url = OAuthService.generateOAuthURL(OAuthProvider.GOOGLE, state);

      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test_google_client_id');
      expect(url).toContain('state=test_state');
      expect(url).toContain('scope=openid%20email%20profile');
    });
  });

  describe('Username Uniqueness', () => {
    it('should handle username conflicts during OAuth registration', async () => {
      // Create user with username that will conflict
      const existingData = {
        email: 'existing@test.com',
        username: 'testuser',
        password: 'TestPassword123!'
      };
      await AuthService.register(existingData);

      // Mock GitHub OAuth with conflicting username
      const mockGitHubUser = {
        id: 12345,
        login: 'testuser', // Same as existing user
        name: 'Test User',
        email: 'new@github.com',
        avatar_url: 'https://github.com/avatar.png'
      };

      mockFetch
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'token' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGitHubUser)
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ email: 'new@github.com', primary: true }])
        }));

      const state = await OAuthService.createOAuthState(OAuthProvider.GITHUB);
      const result = await OAuthService.handleGitHubCallback('code', state);

      // Should get unique username
      expect(result.user.username).toBe('testuser1');
      expect(result.user.email).toBe('new@github.com');
    });
  });
});
