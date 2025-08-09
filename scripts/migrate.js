#!/usr/bin/env node

/**
 * Database Migration Script for DeepWebAI
 * Handles PostgreSQL migrations for Neon database
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import { config } from 'dotenv';
config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const SKIP_DB = process.env.SKIP_DB_CONNECTION === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!DATABASE_URL && !SKIP_DB) {
  console.error('❌ DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Migration directories
const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');
const SCHEMA_DIR = path.join(__dirname, '..', 'database', 'schema');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

if (SKIP_DB || NODE_ENV === 'development') {
  log('⚠️  Skipping database operations (development mode)', 'yellow');
  log('✅ Migration script completed (skipped)', 'green');
  process.exit(0);
}

// Database client
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

/**
 * Create migrations table if it doesn't exist
 */
async function createMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64)
    );
  `;
  
  try {
    await client.query(createTableSQL);
    log('✅ Migrations table ready', 'green');
  } catch (error) {
    log(`❌ Failed to create migrations table: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  try {
    const result = await client.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  } catch (error) {
    log(`❌ Failed to get executed migrations: ${error.message}`, 'red');
    return [];
  }
}

/**
 * Calculate MD5 checksum of a file
 */
async function calculateChecksum(content) {
  const crypto = await import('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Read migration files from directory
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    log(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`, 'red');
    return [];
  }
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

/**
 * Execute a single migration
 */
async function executeMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  const checksum = await calculateChecksum(content);
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Execute migration SQL
    await client.query(content);
    
    // Record migration
    await client.query(
      'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
      [filename, checksum]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    log(`✅ Applied migration: ${filename}`, 'green');
    return true;
    
  } catch (error) {
    // Rollback transaction
    await client.query('ROLLBACK');
    log(`❌ Failed to apply migration ${filename}: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  log('🚀 Starting database migrations...', 'blue');
  
  try {
    // Connect to database
    await client.connect();
    log('✅ Connected to database', 'green');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get executed and available migrations
    const executedMigrations = await getExecutedMigrations();
    const availableMigrations = getMigrationFiles();
    
    // Find pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !executedMigrations.includes(migration)
    );
    
    if (pendingMigrations.length === 0) {
      log('✅ No pending migrations', 'green');
      return;
    }
    
    log(`📋 Found ${pendingMigrations.length} pending migration(s):`, 'cyan');
    pendingMigrations.forEach(migration => {
      log(`   - ${migration}`, 'yellow');
    });
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    log('🎉 All migrations completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Create initial database schema
 */
async function createInitialSchema() {
  const schemaFiles = [
    'users.sql',
    'sessions.sql', 
    'files.sql',
    'conversations.sql',
    'messages.sql',
    'feature_flags.sql',
    'analytics.sql'
  ];
  
  log('📋 Creating initial database schema...', 'blue');
  
  try {
    await client.connect();
    
    for (const schemaFile of schemaFiles) {
      const schemaPath = path.join(SCHEMA_DIR, schemaFile);
      
      if (fs.existsSync(schemaPath)) {
        const content = fs.readFileSync(schemaPath, 'utf8');
        await client.query(content);
        log(`✅ Created schema: ${schemaFile}`, 'green');
      } else {
        log(`⚠️  Schema file not found: ${schemaFile}`, 'yellow');
      }
    }
    
    log('✅ Initial schema created successfully!', 'green');
    
  } catch (error) {
    log(`❌ Schema creation failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Rollback last migration
 */
async function rollbackMigration() {
  log('🔄 Rolling back last migration...', 'yellow');
  
  try {
    await client.connect();
    
    // Get last migration
    const result = await client.query(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      log('❌ No migrations to rollback', 'red');
      return;
    }
    
    const lastMigration = result.rows[0].filename;
    
    // Check for rollback file
    const rollbackFile = lastMigration.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(MIGRATIONS_DIR, rollbackFile);
    
    if (!fs.existsSync(rollbackPath)) {
      log(`❌ Rollback file not found: ${rollbackFile}`, 'red');
      return;
    }
    
    // Execute rollback
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(rollbackSQL);
    await client.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
    await client.query('COMMIT');
    
    log(`✅ Rolled back migration: ${lastMigration}`, 'green');
    
  } catch (error) {
    await client.query('ROLLBACK');
    log(`❌ Rollback failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  try {
    await client.connect();
    
    const executedMigrations = await getExecutedMigrations();
    const availableMigrations = getMigrationFiles();
    
    log('📊 Migration Status:', 'blue');
    log(`   Total migrations: ${availableMigrations.length}`, 'cyan');
    log(`   Executed: ${executedMigrations.length}`, 'green');
    log(`   Pending: ${availableMigrations.length - executedMigrations.length}`, 'yellow');
    
    if (executedMigrations.length > 0) {
      log('\n✅ Executed migrations:', 'green');
      executedMigrations.forEach(migration => {
        log(`   - ${migration}`, 'green');
      });
    }
    
    const pending = availableMigrations.filter(m => !executedMigrations.includes(m));
    if (pending.length > 0) {
      log('\n⏳ Pending migrations:', 'yellow');
      pending.forEach(migration => {
        log(`   - ${migration}`, 'yellow');
      });
    }
    
  } catch (error) {
    log(`❌ Failed to get status: ${error.message}`, 'red');
  } finally {
    await client.end();
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'migrate';
  
  switch (command) {
    case 'migrate':
    case 'up':
      await runMigrations();
      break;
      
    case 'rollback':
    case 'down':
      await rollbackMigration();
      break;
      
    case 'status':
      await showStatus();
      break;
      
    case 'schema':
    case 'init':
      await createInitialSchema();
      break;
      
    default:
      log('Usage:', 'blue');
      log('  node scripts/migrate.js [command]', 'cyan');
      log('');
      log('Commands:', 'blue');
      log('  migrate, up    - Run pending migrations (default)', 'cyan');
      log('  rollback, down - Rollback last migration', 'cyan');
      log('  status         - Show migration status', 'cyan');
      log('  schema, init   - Create initial schema', 'cyan');
      break;
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled rejection: ${error.message}`, 'red');
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log(`❌ Migration script failed: ${error.message}`, 'red');
  process.exit(1);
});
