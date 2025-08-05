"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserQueries = exports.UpdateUserSchema = exports.CreateUserSchema = exports.UserSchema = void 0;
const neon_client_js_1 = require("../../lib/neon-client.js");
const zod_1 = require("zod");
// User schemas
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(50),
    display_name: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().url().optional(),
    bio: zod_1.z.string().max(500).optional(),
    is_verified: zod_1.z.boolean().default(false),
    role: zod_1.z.enum(['user', 'premium', 'admin', 'developer']).default('user'),
    preferences: zod_1.z.record(zod_1.z.any()).default({}),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
    last_login_at: zod_1.z.date().optional()
});
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(50),
    display_name: zod_1.z.string().optional(),
    avatar_url: zod_1.z.string().url().optional(),
    bio: zod_1.z.string().max(500).optional(),
    role: zod_1.z.enum(['user', 'premium', 'admin', 'developer']).default('user'),
    preferences: zod_1.z.record(zod_1.z.any()).default({})
});
exports.UpdateUserSchema = exports.CreateUserSchema.partial().omit({ email: true });
// User queries
class UserQueries {
    // Find user by ID
    static async findById(id) {
        const result = await (0, neon_client_js_1.sql) `
      SELECT * FROM users 
      WHERE id = ${id}
    `;
        return result[0] || null;
    }
    // Find user by email
    static async findByEmail(email) {
        const result = await (0, neon_client_js_1.sql) `
      SELECT * FROM users 
      WHERE email = ${email}
    `;
        return result[0] || null;
    }
    // Find user by username
    static async findByUsername(username) {
        const result = await (0, neon_client_js_1.sql) `
      SELECT * FROM users 
      WHERE username = ${username}
    `;
        return result[0] || null;
    }
    // Create new user
    static async create(userData) {
        const validated = exports.CreateUserSchema.parse(userData);
        const result = await (0, neon_client_js_1.sql) `
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
    static async update(id, userData) {
        const validated = exports.UpdateUserSchema.parse(userData);
        const setClause = [];
        const values = [];
        Object.entries(validated).forEach(([key, value]) => {
            if (value !== undefined) {
                setClause.push(`${key} = $${values.length + 1}`);
                values.push(key === 'preferences' ? JSON.stringify(value) : value);
            }
        });
        if (setClause.length === 0) {
            return this.findById(id);
        }
        setClause.push('updated_at = NOW()');
        const result = await neon_client_js_1.sql.unsafe(`
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `, [...values, id]);
        return result[0] || null;
    }
    // Delete user (soft delete by marking as inactive)
    static async delete(id) {
        const result = await (0, neon_client_js_1.sql) `
      UPDATE users 
      SET updated_at = NOW(), role = 'inactive'
      WHERE id = ${id}
    `;
        return result.count > 0;
    }
    // Update last login
    static async updateLastLogin(id) {
        await (0, neon_client_js_1.sql) `
      UPDATE users 
      SET last_login_at = NOW()
      WHERE id = ${id}
    `;
    }
    // Find users with pagination
    static async findMany(options = {}) {
        const { limit = 20, offset = 0, role, search } = options;
        let whereConditions = ['1=1'];
        const values = [];
        if (role) {
            whereConditions.push(`role = $${values.length + 1}`);
            values.push(role);
        }
        if (search) {
            whereConditions.push(`(username ILIKE $${values.length + 1} OR display_name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 1})`);
            values.push(`%${search}%`);
        }
        const whereClause = whereConditions.join(' AND ');
        // Get total count
        const countResult = await neon_client_js_1.sql.unsafe(`
      SELECT COUNT(*) as total FROM users 
      WHERE ${whereClause}
    `, values);
        // Get users
        const users = await neon_client_js_1.sql.unsafe(`
      SELECT * FROM users 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `, [...values, limit, offset]);
        return {
            users,
            total: parseInt(countResult[0].total)
        };
    }
    // Get user statistics
    static async getStats(userId) {
        const result = await (0, neon_client_js_1.sql) `
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
        return result[0] || {
            totalConversations: 0,
            totalMessages: 0,
            totalTokensUsed: 0,
            totalCost: 0
        };
    }
    // Get user with OAuth accounts
    static async findWithOAuthAccounts(id) {
        const userResult = await (0, neon_client_js_1.sql) `
      SELECT * FROM users WHERE id = ${id}
    `;
        if (!userResult[0])
            return null;
        const oauthResult = await (0, neon_client_js_1.sql) `
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
    static async checkUserLimits(userId, action) {
        // Check quotas
        const quotaResult = await (0, neon_client_js_1.sql) `
      SELECT quota_type, period, limit_value, used_value, reset_at
      FROM usage_quotas
      WHERE user_id = ${userId}
        AND reset_at > NOW()
    `;
        // Check rate limits (last hour)
        const rateLimitResult = await (0, neon_client_js_1.sql) `
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
exports.UserQueries = UserQueries;
