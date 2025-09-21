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

import { sql } from "../../lib/neon-client.js";
import { z } from "zod";

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  is_verified: z.boolean().default(false),
  role: z.enum(['user', 'premium', 'admin', 'developer']).default('user'),
  preferences: z.record(z.any()).default({}),
  created_at: z.date(),
  updated_at: z.date(),
  last_login_at: z.date().optional()
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  display_name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  role: z.enum(['user', 'premium', 'admin', 'developer']).default('user'),
  preferences: z.record(z.any()).default({})
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ email: true });

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

// User queries
export class UserQueries {
  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users 
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users 
      WHERE email = ${email}
    `;
    return result[0] || null;
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users 
      WHERE username = ${username}
    `;
    return result[0] || null;
  }

  // Create new user
  static async create(userData: CreateUser): Promise<User> {
    const validated = CreateUserSchema.parse(userData);
    
    const result = await sql`
      INSERT INTO users (
        email, username, display_name, avatar_url, bio, role, preferences
      ) VALUES (
        ${validated.email},
        ${validated.username},
        ${validated.display_name || null},
        ${validated.avatar_url || null},
        ${validated.bio || null},
        ${validated.role},
        ${JSON.stringify(validated.preferences)}
      )
      RETURNING *
    `;
    
    return result[0];
  }

  // Update user
  static async update(id: string, userData: UpdateUser): Promise<User | null> {
    const validated = UpdateUserSchema.parse(userData);

    // Türkçe Açıklama: Dinamik SET yerine COALESCE ile güvenli tagged template kullanımı.
    const result = await sql`
      UPDATE users 
      SET 
        username = COALESCE(${validated.username ?? null}, username),
        display_name = COALESCE(${validated.display_name ?? null}, display_name),
        avatar_url = COALESCE(${validated.avatar_url ?? null}, avatar_url),
        bio = COALESCE(${validated.bio ?? null}, bio),
        role = COALESCE(${validated.role ?? null}, role),
        preferences = COALESCE(${validated.preferences ? JSON.stringify(validated.preferences) : null}, preferences),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return result[0] || null;
  }

  // Delete user (soft delete by marking as inactive)
  static async delete(id: string): Promise<boolean> {
    const result = await sql`
      UPDATE users 
      SET updated_at = NOW(), role = 'inactive'
      WHERE id = ${id}
      RETURNING id
    `;
    
    return Array.isArray(result) && result.length > 0;
  }

  // Update last login
  static async updateLastLogin(id: string): Promise<void> {
    await sql`
      UPDATE users 
      SET last_login_at = NOW()
      WHERE id = ${id}
    `;
  }

  // Find users with pagination
  static async findMany(options: {
    limit?: number;
    offset?: number;
    role?: string;
    search?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    const { limit = 20, offset = 0, role, search } = options;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM users 
      WHERE 1=1
      ${role ? sql`AND role = ${role}` : sql``}
      ${search ? sql`AND (username ILIKE ${'%' + search + '%'} OR display_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})` : sql``}
    `;

    // Get users
    const users = await sql`
      SELECT * FROM users 
      WHERE 1=1
      ${role ? sql`AND role = ${role}` : sql``}
      ${search ? sql`AND (username ILIKE ${'%' + search + '%'} OR display_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      users,
      total: parseInt(countResult[0].total)
    } as any;
  }

  // Get user statistics
  static async getStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokensUsed: number;
    totalCost: number;
  }> {
    const result = await sql`
      SELECT 
        COALESCE(conversation_count.total, 0) as total_conversations,
        COALESCE(message_count.total, 0) as total_messages,
        COALESCE(usage_stats.total_tokens, 0) as total_tokens_used,
        COALESCE(usage_stats.total_cost, 0) as total_cost
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as total
        FROM conversations 
        WHERE user_id = ${userId}
        GROUP BY user_id
      ) conversation_count ON u.id = conversation_count.user_id
      LEFT JOIN (
        SELECT c.user_id, COUNT(m.id) as total
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.user_id = ${userId}
        GROUP BY c.user_id
      ) message_count ON u.id = message_count.user_id
      LEFT JOIN (
        SELECT user_id, 
               SUM(tokens_used) as total_tokens,
               SUM(cost_usd) as total_cost
        FROM api_usage 
        WHERE user_id = ${userId}
        GROUP BY user_id
      ) usage_stats ON u.id = usage_stats.user_id
      WHERE u.id = ${userId}
    `;
    
    return (result[0] as any) || {
      totalConversations: 0,
      totalMessages: 0,
      totalTokensUsed: 0,
      totalCost: 0
    } as any;
  }

  // Get user with OAuth accounts
  static async findWithOAuthAccounts(id: string): Promise<User & { oauthAccounts: any[] } | null> {
    const userResult = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    
    if (!userResult[0]) return null;
    
    const oauthResult = await sql`
      SELECT provider, provider_user_id, provider_username, created_at
      FROM oauth_accounts 
      WHERE user_id = ${id}
      ORDER BY created_at DESC
    `;
    
    return {
      ...userResult[0],
      oauthAccounts: oauthResult
    };
  }

  // Check if user can perform action (quota/rate limiting)
  static async checkUserLimits(userId: string, action: string): Promise<{
    allowed: boolean;
    quotas: any[];
    rateLimits: any[];
  }> {
    // Check quotas
    const quotaResult = await sql`
      SELECT quota_type, period, limit_value, used_value, reset_at
      FROM usage_quotas
      WHERE user_id = ${userId}
        AND reset_at > NOW()
    `;
    
    // Check rate limits (last hour)
    const rateLimitResult = await sql`
      SELECT endpoint, request_count, max_requests, window_start
      FROM rate_limits
      WHERE user_id = ${userId}
        AND window_start > NOW() - INTERVAL '1 hour'
    `;
    
    // Check if any quota is exceeded
    const quotaExceeded = quotaResult.some(q => q.used_value >= q.limit_value);
    
    // Check if any rate limit is exceeded
    const rateLimitExceeded = rateLimitResult.some(r => r.request_count >= r.max_requests);
    
    return {
      allowed: !quotaExceeded && !rateLimitExceeded,
      quotas: quotaResult,
      rateLimits: rateLimitResult
    };
  }
}
