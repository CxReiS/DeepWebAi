import { sql } from "../../lib/neon-client.js";
import { z } from "zod";

// AI Model schemas
export const AIModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  model_type: z.string(),
  version: z.string().optional(),
  api_endpoint: z.string().url().optional(),
  capabilities: z.array(z.string()).default([]),
  pricing_info: z.record(z.any()).default({}),
  context_length: z.number().optional(),
  max_tokens: z.number().optional(),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date()
});

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().optional(),
  model_id: z.string().uuid().optional(),
  system_prompt: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  is_archived: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date()
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.any()).default({}),
  token_count: z.number().optional(),
  created_at: z.date()
});

export const CreateConversationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().optional(),
  model_id: z.string().uuid().optional(),
  system_prompt: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

export const CreateMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  metadata: z.record(z.any()).default({}),
  token_count: z.number().optional()
});

export type AIModel = z.infer<typeof AIModelSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type CreateMessage = z.infer<typeof CreateMessageSchema>;

// AI Queries
export class AIQueries {
  // Model management
  static async getActiveModels(): Promise<AIModel[]> {
    const result = await sql`
      SELECT * FROM ai_models 
      WHERE is_active = true 
      ORDER BY name ASC
    `;
    return result;
  }

  static async getModelById(id: string): Promise<AIModel | null> {
    const result = await sql`
      SELECT * FROM ai_models 
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  static async getModelsByProvider(provider: string): Promise<AIModel[]> {
    const result = await sql`
      SELECT * FROM ai_models 
      WHERE provider = ${provider} AND is_active = true
      ORDER BY name ASC
    `;
    return result;
  }

  static async getModelsByCapability(capability: string): Promise<AIModel[]> {
    const result = await sql`
      SELECT * FROM ai_models 
      WHERE ${capability} = ANY(capabilities) AND is_active = true
      ORDER BY name ASC
    `;
    return result;
  }

  // Conversation management
  static async createConversation(data: CreateConversation): Promise<Conversation> {
    const validated = CreateConversationSchema.parse(data);
    
    const result = await sql`
      INSERT INTO conversations (
        user_id, title, model_id, system_prompt, metadata
      ) VALUES (
        ${validated.user_id},
        ${validated.title || null},
        ${validated.model_id || null},
        ${validated.system_prompt || null},
        ${JSON.stringify(validated.metadata)}
      )
      RETURNING *
    `;
    
    return result[0];
  }

  static async getConversationById(id: string): Promise<Conversation | null> {
    const result = await sql`
      SELECT * FROM conversations 
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  static async getUserConversations(
    userId: string, 
    options: { limit?: number; offset?: number; archived?: boolean } = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const { limit = 20, offset = 0, archived = false } = options;
    
    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM conversations 
      WHERE user_id = ${userId} AND is_archived = ${archived}
    `;
    
    // Get conversations
    const conversations = await sql`
      SELECT c.*, am.name as model_name, am.provider as model_provider
      FROM conversations c
      LEFT JOIN ai_models am ON c.model_id = am.id
      WHERE c.user_id = ${userId} AND c.is_archived = ${archived}
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return {
      conversations,
      total: parseInt(countResult[0].total)
    };
  }

  static async updateConversation(
    id: string, 
    updates: Partial<Omit<Conversation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<Conversation | null> {
    const setClause = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${values.length + 1}`);
        values.push(key === 'metadata' ? JSON.stringify(value) : value);
      }
    });
    
    if (setClause.length === 0) {
      return this.getConversationById(id);
    }
    
    setClause.push('updated_at = NOW()');
    
    const result = await sql.unsafe(`
      UPDATE conversations 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `, [...values, id]);
    
    return result[0] || null;
  }

  static async deleteConversation(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM conversations 
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // Message management
  static async addMessage(data: CreateMessage): Promise<Message> {
    const validated = CreateMessageSchema.parse(data);
    
    const result = await sql`
      INSERT INTO messages (
        conversation_id, role, content, metadata, token_count
      ) VALUES (
        ${validated.conversation_id},
        ${validated.role},
        ${validated.content},
        ${JSON.stringify(validated.metadata)},
        ${validated.token_count || null}
      )
      RETURNING *
    `;
    
    // Update conversation updated_at
    await sql`
      UPDATE conversations 
      SET updated_at = NOW()
      WHERE id = ${validated.conversation_id}
    `;
    
    return result[0];
  }

  static async getConversationMessages(
    conversationId: string,
    options: { limit?: number; offset?: number; since?: Date } = {}
  ): Promise<Message[]> {
    const { limit = 50, offset = 0, since } = options;
    
    let whereClause = 'conversation_id = $1';
    const values = [conversationId];
    
    if (since) {
      whereClause += ` AND created_at > $${values.length + 1}`;
      values.push(since.toISOString());
    }
    
    const result = await sql.unsafe(`
      SELECT * FROM messages 
      WHERE ${whereClause}
      ORDER BY created_at ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `, [...values, limit, offset]);
    
    return result;
  }

  static async getMessageById(id: string): Promise<Message | null> {
    const result = await sql`
      SELECT * FROM messages 
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  static async updateMessage(
    id: string,
    updates: Partial<Omit<Message, 'id' | 'conversation_id' | 'created_at'>>
  ): Promise<Message | null> {
    const setClause = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${values.length + 1}`);
        values.push(key === 'metadata' ? JSON.stringify(value) : value);
      }
    });
    
    if (setClause.length === 0) {
      return this.getMessageById(id);
    }
    
    const result = await sql.unsafe(`
      UPDATE messages 
      SET ${setClause.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING *
    `, [...values, id]);
    
    return result[0] || null;
  }

  static async deleteMessage(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM messages 
      WHERE id = ${id}
    `;
    return result.count > 0;
  }

  // API Usage tracking
  static async trackAPIUsage(data: {
    user_id?: string;
    model_id?: string;
    endpoint: string;
    method: string;
    tokens_used?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    cost_usd?: number;
    response_time_ms?: number;
    status_code: number;
    error_message?: string;
    request_metadata?: Record<string, any>;
  }): Promise<void> {
    await sql`
      INSERT INTO api_usage (
        user_id, model_id, endpoint, method, tokens_used, 
        prompt_tokens, completion_tokens, cost_usd, response_time_ms,
        status_code, error_message, request_metadata
      ) VALUES (
        ${data.user_id || null},
        ${data.model_id || null},
        ${data.endpoint},
        ${data.method},
        ${data.tokens_used || null},
        ${data.prompt_tokens || 0},
        ${data.completion_tokens || 0},
        ${data.cost_usd || null},
        ${data.response_time_ms || null},
        ${data.status_code},
        ${data.error_message || null},
        ${JSON.stringify(data.request_metadata || {})}
      )
    `;
  }

  static async getUserAPIUsage(
    userId: string,
    options: { 
      from?: Date; 
      to?: Date; 
      model_id?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    usage: any[];
    stats: {
      total_requests: number;
      total_tokens: number;
      total_cost: number;
      avg_response_time: number;
    };
  }> {
    const { from, to, model_id, limit = 100, offset = 0 } = options;
    
    let whereClause = 'user_id = $1';
    const values = [userId];
    
    if (from) {
      whereClause += ` AND created_at >= $${values.length + 1}`;
      values.push(from.toISOString());
    }
    
    if (to) {
      whereClause += ` AND created_at <= $${values.length + 1}`;
      values.push(to.toISOString());
    }
    
    if (model_id) {
      whereClause += ` AND model_id = $${values.length + 1}`;
      values.push(model_id);
    }
    
    // Get usage records
    const usage = await sql.unsafe(`
      SELECT au.*, am.name as model_name, am.provider as model_provider
      FROM api_usage au
      LEFT JOIN ai_models am ON au.model_id = am.id
      WHERE ${whereClause}
      ORDER BY au.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `, [...values, limit, offset]);
    
    // Get statistics
    const statsResult = await sql.unsafe(`
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(AVG(response_time_ms), 0) as avg_response_time
      FROM api_usage
      WHERE ${whereClause}
    `, values);
    
    return {
      usage,
      stats: statsResult[0]
    };
  }

  // Model performance analytics
  static async getModelPerformanceStats(modelId?: string): Promise<any[]> {
    let whereClause = '1=1';
    const values = [];
    
    if (modelId) {
      whereClause = 'au.model_id = $1';
      values.push(modelId);
    }
    
    const result = await sql.unsafe(`
      SELECT 
        am.id,
        am.name,
        am.provider,
        COUNT(au.id) as total_requests,
        AVG(au.response_time_ms) as avg_response_time,
        AVG(au.tokens_used) as avg_tokens_per_request,
        SUM(au.cost_usd) as total_cost,
        COUNT(CASE WHEN au.status_code >= 400 THEN 1 END) as error_count,
        (COUNT(CASE WHEN au.status_code >= 400 THEN 1 END)::FLOAT / COUNT(au.id) * 100) as error_rate
      FROM ai_models am
      LEFT JOIN api_usage au ON am.id = au.model_id
      WHERE ${whereClause}
        AND au.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY am.id, am.name, am.provider
      ORDER BY total_requests DESC
    `, values);
    
    return result;
  }
}
