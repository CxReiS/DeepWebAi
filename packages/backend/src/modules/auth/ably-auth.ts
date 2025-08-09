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

import { Elysia } from 'elysia';
import * as Ably from 'ably';
import { config } from '../../elysia.config.js';
import { AuthService } from '../../auth/index.js';

// Ably token generation endpoint
export const ablyAuthRouter = new Elysia({ name: 'ably-auth' })
  .post('/api/auth/ably-token', async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'Missing or invalid authorization header' };
      }

      const token = authHeader.substring(7);
      
      // Validate user session via AuthService
      const decoded = AuthService.verifyJWT(token);
      if (!decoded) {
        set.status = 401;
        return { error: 'Invalid token' };
      }

      const user = await AuthService.getUserById(decoded.userId);
      if (!user) {
        set.status = 401;
        return { error: 'User not found' };
      }

      const ablyClient = new Ably.Rest({ key: config.ablyApiKey });

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
  })
  .get('/api/auth/ably-token', async ({ query, set }) => {
    const { token } = query as { token?: string };
    
    if (!token) {
      set.status = 401;
      return { error: 'Missing token parameter' };
    }

    try {
      const decoded = AuthService.verifyJWT(token);
      if (!decoded) {
        set.status = 401;
        return { error: 'Invalid token' };
      }

      const user = await AuthService.getUserById(decoded.userId);
      if (!user) {
        set.status = 401;
        return { error: 'User not found' };
      }

      const ablyClient = new Ably.Rest({ key: config.ablyApiKey });
      
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
