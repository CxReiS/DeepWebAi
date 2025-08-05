import { sql } from "../neon-config.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Migration {
  id: string;
  name: string;
  description?: string;
  sql: string;
  rollback?: string;
  dependencies?: string[];
}

export class MigrationRunner {
  private migrationsTable = "schema_migrations";

  constructor() {
    this.ensureMigrationsTable();
  }

  private async ensureMigrationsTable() {
    await sql`
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      )
    `;
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await sql`
      SELECT id FROM ${this.migrationsTable} 
      ORDER BY applied_at ASC
    `;
    return result.map(row => row.id);
  }

  async applyMigration(migration: Migration): Promise<void> {
    try {
      // Start transaction
      await sql`BEGIN`;

      // Execute migration
      await sql.unsafe(migration.sql);

      // Record migration
      await sql`
        INSERT INTO ${this.migrationsTable} (id, name, checksum)
        VALUES (${migration.id}, ${migration.name}, ${this.generateChecksum(migration.sql)})
      `;

      await sql`COMMIT`;
      console.log(`✅ Applied migration: ${migration.id} - ${migration.name}`);
    } catch (error) {
      await sql`ROLLBACK`;
      console.error(`❌ Failed to apply migration ${migration.id}:`, error);
      throw error;
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.rollback) {
      throw new Error(`No rollback script provided for migration ${migration.id}`);
    }

    try {
      await sql`BEGIN`;

      // Execute rollback
      await sql.unsafe(migration.rollback);

      // Remove migration record
      await sql`
        DELETE FROM ${this.migrationsTable} 
        WHERE id = ${migration.id}
      `;

      await sql`COMMIT`;
      console.log(`⬅️  Rolled back migration: ${migration.id} - ${migration.name}`);
    } catch (error) {
      await sql`ROLLBACK`;
      console.error(`❌ Failed to rollback migration ${migration.id}:`, error);
      throw error;
    }
  }

  loadMigration(filename: string): Migration {
    const filePath = join(__dirname, filename);
    const content = readFileSync(filePath, 'utf-8');
    
    // Parse migration metadata from comments
    const lines = content.split('\n');
    const metadata: any = {};
    
    for (const line of lines) {
      if (line.startsWith('-- @')) {
        const [key, ...value] = line.substring(4).split(':');
        metadata[key.trim()] = value.join(':').trim();
      }
    }

    return {
      id: metadata.id || filename.replace('.sql', ''),
      name: metadata.name || filename,
      description: metadata.description,
      sql: content,
      rollback: metadata.rollback,
      dependencies: metadata.dependencies?.split(',').map((d: string) => d.trim())
    };
  }

  async runMigrations(): Promise<void> {
    const migrationFiles = [
      '001_create_conversations.sql',
      '002_create_embeddings.sql',
      '003_create_api_usage.sql',
      '004_create_feature_flags.sql'
    ];

    const appliedMigrations = await this.getAppliedMigrations();
    
    for (const file of migrationFiles) {
      const migration = this.loadMigration(file);
      
      if (!appliedMigrations.includes(migration.id)) {
        console.log(`🔄 Running migration: ${migration.id}`);
        await this.applyMigration(migration);
      } else {
        console.log(`⏭️  Skipping already applied migration: ${migration.id}`);
      }
    }
  }

  private generateChecksum(content: string): string {
    // Simple checksum using crypto
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }
}

// Environment configuration
export const migrationConfig = {
  development: {
    autoMigrate: true,
    logging: true
  },
  staging: {
    autoMigrate: false,
    logging: true
  },
  production: {
    autoMigrate: false,
    logging: false
  }
};

export function getMigrationConfig() {
  const env = process.env.NODE_ENV || 'development';
  return migrationConfig[env] || migrationConfig.development;
}
