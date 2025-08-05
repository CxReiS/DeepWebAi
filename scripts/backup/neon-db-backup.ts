#!/usr/bin/env tsx

import { createNeonClient, getCurrentNeonConfig, NeonBranchManager } from '../../database/neon-config';
import { promises as fs } from 'fs';
import { join } from 'path';

interface BackupConfig {
  outputDir: string;
  retentionDays: number;
  includeTables?: string[];
  excludeTables?: string[];
  compressionLevel?: number;
  environment: 'development' | 'staging' | 'production';
}

interface BackupMetadata {
  timestamp: string;
  environment: string;
  size: number;
  tables: string[];
  checksum: string;
  branch?: string;
}

export class NeonDatabaseBackup {
  private sql = createNeonClient();
  private config: BackupConfig;
  private branchManager = new NeonBranchManager();

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.config.outputDir, `neon-backup-${timestamp}`);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      console.log(`🚀 Starting Neon database backup for ${this.config.environment}...`);
      
      // Get database schema and table information
      const tables = await this.getTables();
      const filteredTables = this.filterTables(tables);
      
      console.log(`📊 Found ${filteredTables.length} tables to backup`);
      
      const backupFiles: string[] = [];
      
      // Backup schema
      console.log('📋 Backing up database schema...');
      const schemaFile = await this.backupSchema(backupDir);
      backupFiles.push(schemaFile);
      
      // Backup each table
      for (const table of filteredTables) {
        console.log(`📦 Backing up table: ${table.table_name}`);
        const tableFile = await this.backupTable(backupDir, table.table_name);
        backupFiles.push(tableFile);
      }
      
      // Create metadata file
      const metadata: BackupMetadata = {
        timestamp,
        environment: this.config.environment,
        size: await this.calculateBackupSize(backupFiles),
        tables: filteredTables.map(t => t.table_name),
        checksum: await this.generateChecksum(backupFiles),
        branch: getCurrentNeonConfig().branchName
      };
      
      const metadataFile = join(backupDir, 'metadata.json');
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
      
      // Create compressed archive if requested
      if (this.config.compressionLevel && this.config.compressionLevel > 0) {
        console.log('🗜️ Compressing backup...');
        const archivePath = await this.compressBackup(backupDir);
        console.log(`✅ Backup completed and compressed: ${archivePath}`);
        return archivePath;
      }
      
      console.log(`✅ Backup completed: ${backupDir}`);
      return backupDir;
      
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  async createBackupBranch(branchName?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupBranchName = branchName || `backup-${timestamp}`;
    
    try {
      console.log(`🌿 Creating backup branch: ${backupBranchName}`);
      const branch = await this.branchManager.createBranch(backupBranchName);
      console.log(`✅ Backup branch created successfully`);
      return branch.branch.id;
    } catch (error) {
      console.error('❌ Failed to create backup branch:', error);
      throw error;
    }
  }

  private async getTables() {
    const result = await this.sql`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    return result;
  }

  private filterTables(tables: any[]) {
    let filtered = tables;
    
    if (this.config.includeTables && this.config.includeTables.length > 0) {
      filtered = filtered.filter(t => this.config.includeTables!.includes(t.table_name));
    }
    
    if (this.config.excludeTables && this.config.excludeTables.length > 0) {
      filtered = filtered.filter(t => !this.config.excludeTables!.includes(t.table_name));
    }
    
    return filtered;
  }

  private async backupSchema(backupDir: string): Promise<string> {
    const schemaFile = join(backupDir, 'schema.sql');
    
    // Get table definitions
    const tables = await this.sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    
    // Get constraints and indexes
    const constraints = await this.sql`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
    `;
    
    let schemaSQL = '-- DeepWebAI Database Schema Backup\n';
    schemaSQL += `-- Generated: ${new Date().toISOString()}\n`;
    schemaSQL += `-- Environment: ${this.config.environment}\n\n`;
    
    // Group tables and generate CREATE statements
    const tableGroups = new Map();
    tables.forEach(col => {
      if (!tableGroups.has(col.table_name)) {
        tableGroups.set(col.table_name, []);
      }
      tableGroups.get(col.table_name).push(col);
    });
    
    for (const [tableName, columns] of tableGroups) {
      schemaSQL += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      const columnDefs = columns.map((col: any) => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });
      schemaSQL += columnDefs.join(',\n');
      schemaSQL += '\n);\n\n';
    }
    
    await fs.writeFile(schemaFile, schemaSQL);
    return schemaFile;
  }

  private async backupTable(backupDir: string, tableName: string): Promise<string> {
    const dataFile = join(backupDir, `${tableName}.json`);
    
    try {
      const data = await this.sql`SELECT * FROM ${this.sql(tableName)}`;
      await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
      return dataFile;
    } catch (error) {
      console.error(`Failed to backup table ${tableName}:`, error);
      throw error;
    }
  }

  private async calculateBackupSize(files: string[]): Promise<number> {
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
    }
    return totalSize;
  }

  private async generateChecksum(files: string[]): Promise<string> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    
    for (const file of files) {
      const content = await fs.readFile(file);
      hash.update(content);
    }
    
    return hash.digest('hex');
  }

  private async compressBackup(backupDir: string): Promise<string> {
    const tar = await import('tar');
    const archivePath = `${backupDir}.tar.gz`;
    
    await tar.create(
      {
        gzip: { level: this.config.compressionLevel },
        file: archivePath,
        cwd: this.config.outputDir
      },
      [backupDir.split('/').pop() || '']
    );
    
    // Remove original directory after compression
    await fs.rm(backupDir, { recursive: true });
    
    return archivePath;
  }

  async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    try {
      const entries = await fs.readdir(this.config.outputDir);
      
      for (const entry of entries) {
        if (entry.startsWith('neon-backup-')) {
          const entryPath = join(this.config.outputDir, entry);
          const stats = await fs.stat(entryPath);
          
          if (stats.mtime < cutoffDate) {
            console.log(`🗑️ Removing old backup: ${entry}`);
            if (stats.isDirectory()) {
              await fs.rm(entryPath, { recursive: true });
            } else {
              await fs.unlink(entryPath);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  async validateBackup(backupPath: string): Promise<boolean> {
    try {
      const metadataPath = backupPath.endsWith('.tar.gz') 
        ? null // Would need to extract to validate
        : join(backupPath, 'metadata.json');
      
      if (metadataPath) {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        console.log(`📊 Backup metadata:`, metadata);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Backup validation failed:', error);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = (args[0] as any) || 'development';
  const action = args[1] || 'backup';
  
  const config: BackupConfig = {
    outputDir: process.env.BACKUP_OUTPUT_DIR || join(process.cwd(), 'backups', 'database'),
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    compressionLevel: parseInt(process.env.BACKUP_COMPRESSION_LEVEL || '6'),
    environment,
    excludeTables: ['migrations', 'logs'] // Exclude system tables
  };
  
  const backup = new NeonDatabaseBackup(config);
  
  try {
    switch (action) {
      case 'backup':
        await backup.createFullBackup();
        break;
      case 'branch':
        await backup.createBackupBranch();
        break;
      case 'cleanup':
        await backup.cleanupOldBackups();
        break;
      case 'validate':
        const backupPath = args[2];
        if (!backupPath) {
          console.error('❌ Please provide backup path for validation');
          process.exit(1);
        }
        const isValid = await backup.validateBackup(backupPath);
        console.log(isValid ? '✅ Backup is valid' : '❌ Backup is invalid');
        break;
      default:
        console.log('Usage: tsx neon-db-backup.ts [environment] [action] [args]');
        console.log('Actions: backup, branch, cleanup, validate');
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
