#!/usr/bin/env tsx
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


import { promises as fs } from 'fs';
import { join, basename, dirname, extname } from 'path';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

interface FileBackupConfig {
  sourceDir: string;
  backupDir: string;
  retentionDays: number;
  compressionLevel: number;
  includeProcessedData: boolean;
  includeOCRResults: boolean;
  maxFileSize?: number;
  excludePatterns?: string[];
}

interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  status: string;
  userId?: string;
  checksum: string;
  processingResults?: any;
  ocrResults?: any;
}

interface BackupManifest {
  timestamp: string;
  totalFiles: number;
  totalSize: number;
  sourceDir: string;
  files: FileMetadata[];
  version: string;
  environment: string;
}

export class FileStorageBackup {
  private config: FileBackupConfig;

  constructor(config: FileBackupConfig) {
    this.config = config;
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.config.backupDir, `file-backup-${timestamp}`);
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
      
      console.log(`🚀 Starting file storage backup...`);
      console.log(`📁 Source: ${this.config.sourceDir}`);
      console.log(`📁 Destination: ${backupDir}`);
      
      // Scan source directory
      const files = await this.scanFiles(this.config.sourceDir);
      console.log(`📊 Found ${files.length} files to backup`);
      
      const manifest: BackupManifest = {
        timestamp: new Date().toISOString(),
        totalFiles: files.length,
        totalSize: 0,
        sourceDir: this.config.sourceDir,
        files: [],
        version: '1.0',
        environment: process.env.NODE_ENV || 'development'
      };
      
      let processedFiles = 0;
      let totalSize = 0;
      
      // Create subdirectories
      const userFilesDir = join(backupDir, 'user-files');
      const metadataDir = join(backupDir, 'metadata');
      const processedDir = join(backupDir, 'processed');
      const ocrDir = join(backupDir, 'ocr-results');
      
      await fs.mkdir(userFilesDir, { recursive: true });
      await fs.mkdir(metadataDir, { recursive: true });
      
      if (this.config.includeProcessedData) {
        await fs.mkdir(processedDir, { recursive: true });
      }
      
      if (this.config.includeOCRResults) {
        await fs.mkdir(ocrDir, { recursive: true });
      }
      
      // Backup files with progress
      for (const file of files) {
        try {
          if (this.shouldExcludeFile(file.path)) {
            console.log(`⏭️ Skipping excluded file: ${file.filename}`);
            continue;
          }
          
          if (this.config.maxFileSize && file.size > this.config.maxFileSize) {
            console.log(`⏭️ Skipping large file: ${file.filename} (${file.size} bytes)`);
            continue;
          }
          
          // Copy main file
          const backupFilePath = join(userFilesDir, file.filename);
          await this.copyFile(file.path, backupFilePath);
          
          // Calculate checksum
          file.checksum = await this.calculateChecksum(file.path);
          
          // Load additional metadata
          await this.loadAdditionalMetadata(file);
          
          // Backup processed data if requested
          if (this.config.includeProcessedData && file.processingResults) {
            const processedFilePath = join(processedDir, `${file.id}.json`);
            await fs.writeFile(processedFilePath, JSON.stringify(file.processingResults, null, 2));
          }
          
          // Backup OCR results if requested
          if (this.config.includeOCRResults && file.ocrResults) {
            const ocrFilePath = join(ocrDir, `${file.id}.json`);
            await fs.writeFile(ocrFilePath, JSON.stringify(file.ocrResults, null, 2));
          }
          
          manifest.files.push(file);
          totalSize += file.size;
          processedFiles++;
          
          if (processedFiles % 100 === 0) {
            console.log(`📦 Processed ${processedFiles}/${files.length} files...`);
          }
          
        } catch (error) {
          console.error(`❌ Failed to backup file ${file.filename}:`, error);
        }
      }
      
      manifest.totalSize = totalSize;
      manifest.totalFiles = processedFiles;
      
      // Save manifest
      const manifestPath = join(backupDir, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      // Create compressed archive
      const archivePath = await this.compressBackup(backupDir);
      
      console.log(`✅ File backup completed!`);
      console.log(`📊 Files backed up: ${processedFiles}`);
      console.log(`📊 Total size: ${this.formatBytes(totalSize)}`);
      console.log(`📦 Archive: ${archivePath}`);
      
      return archivePath;
      
    } catch (error) {
      console.error('❌ File backup failed:', error);
      throw error;
    }
  }

  private async scanFiles(dir: string): Promise<FileMetadata[]> {
    const files: FileMetadata[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          
          const metadata: FileMetadata = {
            id: this.generateFileId(fullPath),
            filename: entry.name,
            originalName: entry.name,
            path: fullPath,
            size: stats.size,
            mimeType: this.getMimeType(entry.name),
            uploadedAt: stats.birthtime.toISOString(),
            status: 'uploaded',
            checksum: ''
          };
          
          files.push(metadata);
        }
      }
    } catch (error) {
      console.error(`Failed to scan directory ${dir}:`, error);
    }
    
    return files;
  }

  private shouldExcludeFile(filePath: string): boolean {
    if (!this.config.excludePatterns) return false;
    
    const filename = basename(filePath);
    return this.config.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    });
  }

  private async copyFile(source: string, destination: string): Promise<void> {
    try {
      // Ensure destination directory exists
      await fs.mkdir(dirname(destination), { recursive: true });
      
      if (this.config.compressionLevel > 0) {
        // Compress file during copy
        const sourceStream = createReadStream(source);
        const gzipStream = createGzip({ level: this.config.compressionLevel });
        const destStream = createWriteStream(`${destination}.gz`);
        
        await pipeline(sourceStream, gzipStream, destStream);
      } else {
        // Simple copy
        await fs.copyFile(source, destination);
      }
    } catch (error) {
      console.error(`Failed to copy file ${source} to ${destination}:`, error);
      throw error;
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async loadAdditionalMetadata(file: FileMetadata): Promise<void> {
    try {
      // Try to load processing results
      const processingPath = join(dirname(file.path), '..', 'processed', `${file.id}.json`);
      try {
        const processingData = await fs.readFile(processingPath, 'utf-8');
        file.processingResults = JSON.parse(processingData);
      } catch {
        // Processing results not found
      }
      
      // Try to load OCR results
      const ocrPath = join(dirname(file.path), '..', 'ocr', `${file.id}.json`);
      try {
        const ocrData = await fs.readFile(ocrPath, 'utf-8');
        file.ocrResults = JSON.parse(ocrData);
      } catch {
        // OCR results not found
      }
      
    } catch (error) {
      console.warn(`Failed to load additional metadata for ${file.filename}:`, error);
    }
  }

  private generateFileId(filePath: string): string {
    const hash = createHash('md5');
    hash.update(filePath);
    return hash.digest('hex').substring(0, 8);
  }

  private getMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async compressBackup(backupDir: string): Promise<string> {
    const tar = await import('tar');
    const archivePath = `${backupDir}.tar.gz`;
    
    await tar.create(
      {
        gzip: { level: this.config.compressionLevel },
        file: archivePath,
        cwd: dirname(backupDir)
      },
      [basename(backupDir)]
    );
    
    // Remove original directory after compression
    await fs.rm(backupDir, { recursive: true });
    
    return archivePath;
  }

  async restoreBackup(archivePath: string, targetDir?: string): Promise<void> {
    const restoreDir = targetDir || this.config.sourceDir;
    
    try {
      console.log(`🔄 Restoring file backup from ${archivePath}...`);
      
      // Extract archive
      const tar = await import('tar');
      const tempDir = join(dirname(archivePath), 'temp-restore');
      
      await tar.extract({
        file: archivePath,
        cwd: dirname(archivePath)
      });
      
      // Find extracted directory
      const extractedDir = archivePath.replace('.tar.gz', '');
      
      // Read manifest
      const manifestPath = join(extractedDir, 'manifest.json');
      const manifest: BackupManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      console.log(`📊 Restoring ${manifest.totalFiles} files...`);
      
      // Ensure target directory exists
      await fs.mkdir(restoreDir, { recursive: true });
      
      // Restore files
      const userFilesDir = join(extractedDir, 'user-files');
      const files = await fs.readdir(userFilesDir);
      
      let restoredCount = 0;
      for (const file of files) {
        const sourcePath = join(userFilesDir, file);
        const targetPath = join(restoreDir, file.replace('.gz', ''));
        
        if (file.endsWith('.gz')) {
          // Decompress file
          await this.decompressFile(sourcePath, targetPath);
        } else {
          // Simple copy
          await fs.copyFile(sourcePath, targetPath);
        }
        
        restoredCount++;
        
        if (restoredCount % 100 === 0) {
          console.log(`📦 Restored ${restoredCount}/${files.length} files...`);
        }
      }
      
      // Clean up
      await fs.rm(extractedDir, { recursive: true });
      
      console.log(`✅ File restore completed!`);
      console.log(`📊 Files restored: ${restoredCount}`);
      console.log(`📁 Target directory: ${restoreDir}`);
      
    } catch (error) {
      console.error('❌ File restore failed:', error);
      throw error;
    }
  }

  private async decompressFile(source: string, destination: string): Promise<void> {
    const { createGunzip } = await import('zlib');
    
    const sourceStream = createReadStream(source);
    const gunzipStream = createGunzip();
    const destStream = createWriteStream(destination);
    
    await pipeline(sourceStream, gunzipStream, destStream);
  }

  async validateBackup(archivePath: string): Promise<boolean> {
    try {
      console.log(`🔍 Validating backup ${archivePath}...`);
      
      // Extract to temporary location
      const tar = await import('tar');
      const tempDir = join(dirname(archivePath), 'temp-validate');
      
      await tar.extract({
        file: archivePath,
        cwd: dirname(archivePath)
      });
      
      const extractedDir = archivePath.replace('.tar.gz', '');
      
      // Read and validate manifest
      const manifestPath = join(extractedDir, 'manifest.json');
      const manifest: BackupManifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
      
      console.log(`📊 Manifest shows ${manifest.totalFiles} files, ${this.formatBytes(manifest.totalSize)}`);
      
      // Validate file count
      const userFilesDir = join(extractedDir, 'user-files');
      const actualFiles = await fs.readdir(userFilesDir);
      
      const isValid = actualFiles.length === manifest.totalFiles;
      
      // Clean up
      await fs.rm(extractedDir, { recursive: true });
      
      console.log(isValid ? '✅ Backup validation passed' : '❌ Backup validation failed');
      return isValid;
      
    } catch (error) {
      console.error('❌ Backup validation failed:', error);
      return false;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    try {
      const entries = await fs.readdir(this.config.backupDir);
      
      for (const entry of entries) {
        if (entry.startsWith('file-backup-') && entry.endsWith('.tar.gz')) {
          const entryPath = join(this.config.backupDir, entry);
          const stats = await fs.stat(entryPath);
          
          if (stats.mtime < cutoffDate) {
            console.log(`🗑️ Removing old backup: ${entry}`);
            await fs.unlink(entryPath);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'backup';
  
  const config: FileBackupConfig = {
    sourceDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
    backupDir: process.env.BACKUP_OUTPUT_DIR || join(process.cwd(), 'backups', 'files'),
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    compressionLevel: parseInt(process.env.BACKUP_COMPRESSION_LEVEL || '6'),
    includeProcessedData: process.env.BACKUP_INCLUDE_PROCESSED === 'true',
    includeOCRResults: process.env.BACKUP_INCLUDE_OCR === 'true',
    maxFileSize: parseInt(process.env.BACKUP_MAX_FILE_SIZE || '104857600'), // 100MB
    excludePatterns: [
      '*.log',
      '*.tmp',
      '.DS_Store',
      'Thumbs.db'
    ]
  };
  
  const backup = new FileStorageBackup(config);
  
  try {
    switch (action) {
      case 'backup':
        await backup.createBackup();
        break;
      case 'restore':
        const archivePath = args[1];
        const targetDir = args[2];
        if (!archivePath) {
          console.error('❌ Please provide archive path');
          process.exit(1);
        }
        await backup.restoreBackup(archivePath, targetDir);
        break;
      case 'validate':
        const validatePath = args[1];
        if (!validatePath) {
          console.error('❌ Please provide archive path for validation');
          process.exit(1);
        }
        await backup.validateBackup(validatePath);
        break;
      case 'cleanup':
        await backup.cleanupOldBackups();
        break;
      default:
        console.log('Usage: tsx file-storage-backup.ts [action] [args]');
        console.log('Actions: backup, restore, validate, cleanup');
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
