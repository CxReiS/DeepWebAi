#!/usr/bin/env ts-node
// Database migration script
import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config({ path: join(__dirname, '../.env') });

interface MigrationResult {
  filename: string;
}

async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');
    
    // Check if DATABASE_URL is provided
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found. Skipping migrations in development mode.');
      process.exit(0);
    }

    // Import neon client
    const { sql } = await import('../database/neon-config.js');
    
    // Get migration files
    const migrationsDir = join(__dirname, '../database/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('📝 No migration files found.');
      return;
    }

    // Create migrations table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Get already executed migrations
    const executed = await sql`SELECT filename FROM migrations` as MigrationResult[];
    const executedFiles = executed.map(row => row.filename);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedFiles.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔧 Executing migration: ${file}`);
      
      try {
        const migrationContent = readFileSync(join(migrationsDir, file), 'utf8');
        
        // Execute migration
        await sql.unsafe(migrationContent);
        
        // Record migration
        await sql`INSERT INTO migrations (filename) VALUES (${file})`;
        
        console.log(`✅ Migration ${file} completed`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Migration ${file} failed:`, errorMessage);
        process.exit(1);
      }
    }

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Migration failed:', errorMessage);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
