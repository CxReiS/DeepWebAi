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
    return result.map((row: any) => AIModelSchema.parse(row));
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
    // Türkçe Açıklama: Dinamik SET cümlesi yerine güvenli tagged template ile COALESCE kullanıyoruz.
    const result = await sql`
      UPDATE conversations 
      SET 
        title = COALESCE(${updates.title ?? null}, title),
        model_id = COALESCE(${updates.model_id ?? null}, model_id),
        system_prompt = COALESCE(${updates.system_prompt ?? null}, system_prompt),
        metadata = COALESCE(${updates.metadata ? JSON.stringify(updates.metadata) : null}, metadata),
        is_archived = COALESCE(${updates.is_archived ?? null}, is_archived),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return result[0] || null;
  }

  static async deleteConversation(id: string): Promise<boolean> {
    // Türkçe Açıklama: DELETE dönüşünde etkilenen satır sayısı yerine RETURNING kullanarak güvenli kontrol.
    const result = await sql`
      DELETE FROM conversations 
      WHERE id = ${id}
      RETURNING id
    `;
    return Array.isArray(result) && result.length > 0;
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

    const result = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ${since ? sql`AND created_at > ${since.toISOString()}` : sql``}
      ORDER BY created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

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
    
    // Türkçe Açıklama: sql.unsafe yerine COALESCE ile güvenli güncelleme
    const result = await sql`
      UPDATE messages 
      SET 
        role = COALESCE(${updates.role ?? null}, role),
        content = COALESCE(${updates.content ?? null}, content),
        metadata = COALESCE(${updates.metadata ? JSON.stringify(updates.metadata) : null}, metadata),
        token_count = COALESCE(${updates.token_count ?? null}, token_count)
      WHERE id = ${id}
      RETURNING *
    `;
    
    return result[0] || null;
  }

  static async deleteMessage(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM messages 
      WHERE id = ${id}
      RETURNING id
    `;
    return Array.isArray(result) && result.length > 0;
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
    const usage = await sql`
      SELECT au.*, am.name as model_name, am.provider as model_provider
      FROM api_usage au
      LEFT JOIN ai_models am ON au.model_id = am.id
      WHERE user_id = ${userId}
      ${from ? sql`AND created_at >= ${from.toISOString()}` : sql``}
      ${to ? sql`AND created_at <= ${to.toISOString()}` : sql``}
      ${model_id ? sql`AND model_id = ${model_id}` : sql``}
      ORDER BY au.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Get statistics
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens,
        COALESCE(SUM(cost_usd), 0) as total_cost,
        COALESCE(AVG(response_time_ms), 0) as avg_response_time
      FROM api_usage
      WHERE user_id = ${userId}
      ${from ? sql`AND created_at >= ${from.toISOString()}` : sql``}
      ${to ? sql`AND created_at <= ${to.toISOString()}` : sql``}
      ${model_id ? sql`AND model_id = ${model_id}` : sql``}
    `;
    
    return {
      usage,
      stats: statsResult[0] as any
    };
  }

  // Model performance analytics
  static async getModelPerformanceStats(modelId?: string): Promise<any[]> {
    const result = await sql`
      SELECT 
        am.id,
        am.name,
        am.provider,
        COUNT(au.id) as total_requests,
        AVG(au.response_time_ms) as avg_response_time,
        AVG(au.tokens_used) as avg_tokens_per_request,
        SUM(au.cost_usd) as total_cost,
        COUNT(CASE WHEN au.status_code >= 400 THEN 1 END) as error_count,
        (COUNT(CASE WHEN au.status_code >= 400 THEN 1 END)::FLOAT / NULLIF(COUNT(au.id), 0) * 100) as error_rate
      FROM ai_models am
      LEFT JOIN api_usage au ON am.id = au.model_id
      WHERE ${modelId ? sql`au.model_id = ${modelId}` : sql`1=1`}
        AND au.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY am.id, am.name, am.provider
      ORDER BY total_requests DESC
    `;
    
    return result;
  }
}
