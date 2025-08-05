import { sql, pool } from "../neon-config.js";
import { Pool, PoolClient } from "@neondatabase/serverless";

export interface DatabaseSession {
  query: typeof sql;
  client?: PoolClient;
  isTransaction: boolean;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => Promise<void>;
}

export class SessionManager {
  private static instance: SessionManager;
  private connectionPool: Pool;

  private constructor() {
    this.connectionPool = pool;
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Create a simple session using the default sql client
  async createSession(): Promise<DatabaseSession> {
    return {
      query: sql,
      isTransaction: false,
      commit: async () => {
        // No-op for non-transaction sessions
      },
      rollback: async () => {
        // No-op for non-transaction sessions
      },
      release: async () => {
        // No-op for simple sessions
      }
    };
  }

  // Create a pooled session for complex operations
  async createPooledSession(): Promise<DatabaseSession> {
    const client = await this.connectionPool.connect();
    
    return {
      query: (strings: TemplateStringsArray, ...values: any[]) => {
        const query = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] !== undefined ? `$${i + 1}` : '');
        }, '');
        return client.query(query, values);
      },
      client,
      isTransaction: false,
      commit: async () => {
        // No-op for non-transaction pooled sessions
      },
      rollback: async () => {
        // No-op for non-transaction pooled sessions
      },
      release: async () => {
        client.release();
      }
    };
  }

  // Create a transaction session
  async createTransaction(): Promise<DatabaseSession> {
    const client = await this.connectionPool.connect();
    await client.query('BEGIN');
    
    return {
      query: (strings: TemplateStringsArray, ...values: any[]) => {
        const query = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] !== undefined ? `$${i + 1}` : '');
        }, '');
        return client.query(query, values);
      },
      client,
      isTransaction: true,
      commit: async () => {
        await client.query('COMMIT');
        client.release();
      },
      rollback: async () => {
        await client.query('ROLLBACK');
        client.release();
      },
      release: async () => {
        if (client) {
          await client.query('ROLLBACK');
          client.release();
        }
      }
    };
  }

  // Execute function within a transaction
  async withTransaction<T>(
    callback: (session: DatabaseSession) => Promise<T>
  ): Promise<T> {
    const session = await this.createTransaction();
    
    try {
      const result = await callback(session);
      await session.commit();
      return result;
    } catch (error) {
      await session.rollback();
      throw error;
    }
  }

  // Execute function with a pooled connection
  async withConnection<T>(
    callback: (session: DatabaseSession) => Promise<T>
  ): Promise<T> {
    const session = await this.createPooledSession();
    
    try {
      const result = await callback(session);
      return result;
    } finally {
      await session.release();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await sql`SELECT 1 as health, NOW() as timestamp`;
      return result.length > 0;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Get pool statistics
  getPoolStats() {
    return {
      totalCount: this.connectionPool.totalCount,
      idleCount: this.connectionPool.idleCount,
      waitingCount: this.connectionPool.waitingCount
    };
  }

  // Close all connections
  async close(): Promise<void> {
    await this.connectionPool.end();
  }
}

// Repository base class
export abstract class BaseRepository {
  protected sessionManager: SessionManager;

  constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  // Execute query with simple session
  protected async query<T = any>(
    queryFn: (session: DatabaseSession) => Promise<T>
  ): Promise<T> {
    const session = await this.sessionManager.createSession();
    return queryFn(session);
  }

  // Execute query with pooled connection
  protected async queryWithConnection<T = any>(
    queryFn: (session: DatabaseSession) => Promise<T>
  ): Promise<T> {
    return this.sessionManager.withConnection(queryFn);
  }

  // Execute query within transaction
  protected async transaction<T = any>(
    queryFn: (session: DatabaseSession) => Promise<T>
  ): Promise<T> {
    return this.sessionManager.withTransaction(queryFn);
  }
}

// Example repository implementation
export class UserRepository extends BaseRepository {
  async findById(id: string) {
    return this.query(async (session) => {
      const result = await session.query`
        SELECT * FROM users WHERE id = ${id}
      `;
      return result[0] || null;
    });
  }

  async create(userData: any) {
    return this.transaction(async (session) => {
      const result = await session.query`
        INSERT INTO users (email, username, display_name)
        VALUES (${userData.email}, ${userData.username}, ${userData.displayName})
        RETURNING *
      `;
      return result[0];
    });
  }

  async updateWithConversation(userId: string, userData: any, conversationData: any) {
    return this.transaction(async (session) => {
      // Update user
      const userResult = await session.query`
        UPDATE users 
        SET display_name = ${userData.displayName}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;

      // Create conversation
      const conversationResult = await session.query`
        INSERT INTO conversations (user_id, title, system_prompt)
        VALUES (${userId}, ${conversationData.title}, ${conversationData.systemPrompt})
        RETURNING *
      `;

      return {
        user: userResult[0],
        conversation: conversationResult[0]
      };
    });
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export convenient functions
export const withTransaction = sessionManager.withTransaction.bind(sessionManager);
export const withConnection = sessionManager.withConnection.bind(sessionManager);
export const createSession = sessionManager.createSession.bind(sessionManager);
