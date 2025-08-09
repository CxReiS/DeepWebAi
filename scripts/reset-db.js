#!/usr/bin/env node

/**
 * Database Reset Script for DeepWebAI
 * Drops all tables and recreates schema
 */

import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Database client
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

/**
 * Drop all tables
 */
async function dropAllTables() {
  log('🗑️  Dropping all tables...', 'yellow');
  
  try {
    // Disable foreign key checks temporarily
    await client.query('SET session_replication_role = replica;');
    
    // Get all table names
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'migrations'
    `);
    
    // Drop each table
    for (const row of result.rows) {
      const tableName = row.tablename;
      await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
      log(`  ✅ Dropped table: ${tableName}`, 'green');
    }
    
    // Drop all views
    const viewResult = await client.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public'
    `);
    
    for (const row of viewResult.rows) {
      const viewName = row.viewname;
      await client.query(`DROP VIEW IF EXISTS "${viewName}" CASCADE`);
      log(`  ✅ Dropped view: ${viewName}`, 'green');
    }
    
    // Drop migrations table too (if --full flag)
    const args = process.argv.slice(2);
    if (args.includes('--full')) {
      await client.query('DROP TABLE IF EXISTS migrations CASCADE');
      log('  ✅ Dropped migrations table', 'green');
    }
    
    // Re-enable foreign key checks
    await client.query('SET session_replication_role = DEFAULT;');
    
    log('✅ All tables dropped successfully', 'green');
    
  } catch (error) {
    log(`❌ Failed to drop tables: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Drop all functions and procedures
 */
async function dropAllFunctions() {
  log('🗑️  Dropping all functions...', 'yellow');
  
  try {
    const result = await client.query(`
      SELECT proname, oidvectortypes(proargtypes) as argtypes
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    `);
    
    for (const row of result.rows) {
      const funcName = row.proname;
      const argTypes = row.argtypes;
      await client.query(`DROP FUNCTION IF EXISTS "${funcName}"(${argTypes}) CASCADE`);
      log(`  ✅ Dropped function: ${funcName}`, 'green');
    }
    
    log('✅ All functions dropped successfully', 'green');
    
  } catch (error) {
    log(`❌ Failed to drop functions: ${error.message}`, 'red');
    // Don't throw - functions might not exist
  }
}

/**
 * Reset database sequences
 */
async function resetSequences() {
  log('🔢 Resetting sequences...', 'blue');
  
  try {
    const result = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const row of result.rows) {
      const seqName = row.sequence_name;
      await client.query(`ALTER SEQUENCE "${seqName}" RESTART WITH 1`);
      log(`  ✅ Reset sequence: ${seqName}`, 'green');
    }
    
    log('✅ All sequences reset', 'green');
    
  } catch (error) {
    log(`❌ Failed to reset sequences: ${error.message}`, 'red');
    // Don't throw - sequences might not exist
  }
}

/**
 * Show database status
 */
async function showStatus() {
  log('📊 Database Status:', 'blue');
  
  try {
    // Count tables
    const tableResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    const tableCount = parseInt(tableResult.rows[0].count);
    
    // Count views
    const viewResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_views 
      WHERE schemaname = 'public'
    `);
    const viewCount = parseInt(viewResult.rows[0].count);
    
    // Count functions
    const funcResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    `);
    const funcCount = parseInt(funcResult.rows[0].count);
    
    log(`  Tables: ${tableCount}`, 'blue');
    log(`  Views: ${viewCount}`, 'blue');
    log(`  Functions: ${funcCount}`, 'blue');
    
    if (tableCount > 0) {
      log('\n📋 Tables:', 'blue');
      const tables = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);
      
      for (const row of tables.rows) {
        log(`  - ${row.tablename}`, 'blue');
      }
    }
    
  } catch (error) {
    log(`❌ Failed to get status: ${error.message}`, 'red');
  }
}

/**
 * Confirm action with user
 */
async function confirmAction(message) {
  const args = process.argv.slice(2);
  if (args.includes('--force') || args.includes('-y')) {
    return true;
  }
  
  // In non-interactive environments, require --force
  if (!process.stdin.isTTY) {
    log('❌ Non-interactive environment detected. Use --force to proceed.', 'red');
    return false;
  }
  
  // Simple confirmation (since we can't easily import readline in ES modules)
  log(`⚠️  ${message}`, 'yellow');
  log('This action cannot be undone!', 'yellow');
  log('Use --force flag to skip this confirmation.', 'blue');
  
  return false; // Require explicit --force for safety
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'reset';
  
  try {
    await client.connect();
    log('✅ Connected to database', 'green');
    
    switch (command) {
      case 'reset':
      case 'drop':
        if (await confirmAction('This will drop ALL tables and data in the database.')) {
          await dropAllTables();
          await dropAllFunctions();
          await resetSequences();
          log('🎉 Database reset completed!', 'green');
        } else {
          log('❌ Operation cancelled. Use --force to proceed without confirmation.', 'yellow');
        }
        break;
        
      case 'status':
        await showStatus();
        break;
        
      case 'tables':
        await dropAllTables();
        break;
        
      case 'functions':
        await dropAllFunctions();
        break;
        
      case 'sequences':
        await resetSequences();
        break;
        
      default:
        log('Usage:', 'blue');
        log('  node scripts/reset-db.js [command] [options]', 'blue');
        log('');
        log('Commands:', 'blue');
        log('  reset      - Drop all tables, views, and functions (default)', 'blue');
        log('  status     - Show database status', 'blue');
        log('  tables     - Drop tables only', 'blue');
        log('  functions  - Drop functions only', 'blue');
        log('  sequences  - Reset sequences only', 'blue');
        log('');
        log('Options:', 'blue');
        log('  --force, -y  - Skip confirmation prompt', 'blue');
        log('  --full       - Also drop migrations table', 'blue');
        break;
    }
    
  } catch (error) {
    log(`❌ Reset script failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled rejection: ${error.message}`, 'red');
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log(`❌ Reset script failed: ${error.message}`, 'red');
  process.exit(1);
});
