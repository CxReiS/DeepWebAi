import { Elysia } from 'elysia';
import * as Ably from 'ably';
import { config } from '../../src/elysia.config';
import { getUserFromToken } from './auth.service'; // Assume this exists

// Ably token generation endpoint
export const ablyAuthRouter = new Elysia({ name: 'ably-auth' })
  .post('/api/auth/ably-token', async ({ headers, set }) => {
    try {
      // Extract JWT token from Authorization header
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'Missing or invalid authorization header' };
      }

      const token = authHeader.substring(7);
      
      // Validate user session (implement this based on your auth system)
      const user = await getUserFromToken(token);
      if (!user) {
        set.status = 401;
        return { error: 'Invalid token' };
      }

      // Create Ably client for token generation
      const ablyClient = new Ably.Rest({ key: config.ABLY_API_KEY });

      // Generate Ably token with user-specific capabilities
      const tokenRequest = await ablyClient.auth.createTokenRequest({
        clientId: user.id,
        capability: {
          'chat': ['publish', 'subscribe'],
          'notifications': ['subscribe'],
          'ai-status': ['subscribe'],
          'user-presence': ['publish', 'subscribe', 'presence'],
        },
        ttl: 3600000, // 1 hour
      });

      return tokenRequest;
    } catch (error) {
      console.error('Ably token generation error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .get('/api/auth/ably-token', async ({ query, set }) => {
    // Support GET requests for simpler client integration
    const { token } = query;
    
    if (!token) {
      set.status = 401;
      return { error: 'Missing token parameter' };
    }

    try {
      const user = await getUserFromToken(token as string);
      if (!user) {
        set.status = 401;
        return { error: 'Invalid token' };
      }

      const ablyClient = new Ably.Rest({ key: config.ABLY_API_KEY });
      
      const tokenRequest = await ablyClient.auth.createTokenRequest({
        clientId: user.id,
        capability: {
          'chat': ['publish', 'subscribe'],
          'notifications': ['subscribe'],
          'ai-status': ['subscribe'],
          'user-presence': ['publish', 'subscribe', 'presence'],
        },
        ttl: 3600000,
      });

      return tokenRequest;
    } catch (error) {
      console.error('Ably token generation error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
