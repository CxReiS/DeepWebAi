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

import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { fileProcessor } from '@deepwebai/file-processing';
import { 
  FileProcessingOptions,
  FileUploadResponse,
  ProcessedFileContent,
  FileProcessingStatus,
  FileProcessingError,
  SUPPORTED_DOCUMENT_TYPES,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS
} from '@deepwebai/shared-types';

export interface FileUploadData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StoredFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  userId?: string;
}

export interface ProcessingJob {
  fileId: string;
  status: FileProcessingStatus;
  result?: ProcessedFileContent;
  error?: FileProcessingError;
}

export class FileService {
  private uploadDir: string;
  private processingJobs = new Map<string, ProcessingJob>();

  constructor() {
    // Use environment variable or default to uploads directory
    this.uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  /**
   * Upload and store file
   */
  async uploadFile(fileData: FileUploadData, userId?: string): Promise<FileUploadResponse> {
    try {
      // Validate file
      this.validateFile(fileData);

      // Generate unique filename
      const fileId = uuidv4();
      const extension = extname(fileData.originalName);
      const filename = `${fileId}${extension}`;
      const filePath = join(this.uploadDir, filename);

      // Save file to disk
      await fs.writeFile(filePath, fileData.buffer);

      // Store file metadata (in a real app, this would go to database)
      const storedFile: StoredFile = {
        id: fileId,
        filename,
        originalName: fileData.originalName,
        path: filePath,
        size: fileData.size,
        mimeType: fileData.mimeType,
        uploadedAt: new Date(),
        status: 'uploaded',
        userId
      };

      // In a real implementation, save to database
      await this.saveFileMetadata(storedFile);

      return {
        id: fileId,
        filename,
        originalName: fileData.originalName,
        size: fileData.size,
        mimeType: fileData.mimeType,
        uploadedAt: storedFile.uploadedAt.toISOString(),
        status: 'uploaded'
      };
    } catch (error) {
      throw this.createServiceError('UPLOAD_ERROR', 'Failed to upload file', error);
    }
  }

  /**
   * Process uploaded file
   */
  async processFile(fileId: string, options: FileProcessingOptions = {}): Promise<string> {
    try {
      // Get file metadata
      const file = await this.getFileMetadata(fileId);
      if (!file) {
        throw this.createServiceError('FILE_NOT_FOUND', `File not found: ${fileId}`);
      }

      // Check if already processing
      if (this.processingJobs.has(fileId)) {
        const job = this.processingJobs.get(fileId)!;
        if (job.status.status === 'processing') {
          throw this.createServiceError('ALREADY_PROCESSING', 'File is already being processed');
        }
      }

      // Create processing job
      const processingJobId = uuidv4();
      const processingStatus: FileProcessingStatus = {
        fileId,
        status: 'processing',
        progress: 0,
        startedAt: new Date().toISOString()
      };

      this.processingJobs.set(fileId, {
        fileId,
        status: processingStatus
      });

      // Update file status
      await this.updateFileStatus(fileId, 'processing');

      // Process file asynchronously
      this.processFileAsync(file, options, processingJobId);

      return processingJobId;
    } catch (error) {
      // Türkçe Açıklama: FileProcessingError bir Type olup sınıf değildir, bu yüzden instanceof kullanılamaz.
      // Yerine tip koruyucu (type guard) ile şekil kontrolü yapılır.
      const isFpe = (e: unknown): e is FileProcessingError => !!e && typeof e === 'object' && 'code' in (e as any) && 'message' in (e as any);
      throw isFpe(error)
        ? (error as FileProcessingError)
        : this.createServiceError('PROCESSING_ERROR', 'Failed to start file processing', error);
    }
  }

  /**
   * Get file processing status
   */
  async getProcessingStatus(fileId: string): Promise<FileProcessingStatus | null> {
    const job = this.processingJobs.get(fileId);
    return job ? job.status : null;
  }

  /**
   * Get processed file content
   */
  async getProcessedContent(fileId: string): Promise<ProcessedFileContent | null> {
    const job = this.processingJobs.get(fileId);
    return job?.result || null;
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<{ buffer: Buffer; metadata: StoredFile } | null> {
    try {
      const file = await this.getFileMetadata(fileId);
      if (!file) {
        return null;
      }

      const buffer = await fs.readFile(file.path);
      return { buffer, metadata: file };
    } catch (error) {
      throw this.createServiceError('DOWNLOAD_ERROR', 'Failed to download file', error);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const file = await this.getFileMetadata(fileId);
      if (!file) {
        return false;
      }

      // Delete file from disk
      await fs.unlink(file.path);

      // Remove from processing jobs
      this.processingJobs.delete(fileId);

      // Remove metadata (in real app, delete from database)
      await this.deleteFileMetadata(fileId);

      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Async file processing
   */
  private async processFileAsync(
    file: StoredFile, 
    options: FileProcessingOptions,
    jobId: string
  ): Promise<void> {
    const fileId = file.id;
    
    try {
      // Update progress
      this.updateProgress(fileId, 25);

      // Read file
      const buffer = await fs.readFile(file.path);
      
      // Update progress
      this.updateProgress(fileId, 50);

      // Process file
      const result = await fileProcessor.processFile(
        buffer,
        file.originalName,
        fileId,
        options
      );

      // Update progress
      this.updateProgress(fileId, 75);

      // Save result
      const job = this.processingJobs.get(fileId);
      if (job) {
        job.result = result.content;
        job.status.status = 'completed';
        job.status.progress = 100;
        job.status.completedAt = new Date().toISOString();
      }

      // Update file status
      await this.updateFileStatus(fileId, 'completed');

      // File processing completed successfully
    } catch (error) {
      // Handle processing error
      const job = this.processingJobs.get(fileId);
      if (job) {
        job.status.status = 'failed';
        job.status.completedAt = new Date().toISOString();
        const isFpe = (e: unknown): e is FileProcessingError => !!e && typeof e === 'object' && 'code' in (e as any) && 'message' in (e as any);
        job.error = isFpe(error)
          ? (error as FileProcessingError)
          : this.createServiceError('PROCESSING_FAILED', 'File processing failed', error);
      }

      await this.updateFileStatus(fileId, 'failed');
      console.error(`File processing failed: ${fileId}`, error);
    }
  }

  /**
   * Update processing progress
   */
  private updateProgress(fileId: string, progress: number): void {
    const job = this.processingJobs.get(fileId);
    if (job) {
      job.status.progress = progress;
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(fileData: FileUploadData): void {
    // Check file size
    if (fileData.size > MAX_FILE_SIZE) {
      throw this.createServiceError(
        'FILE_TOO_LARGE', 
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    // Check file extension
    const extension = extname(fileData.originalName).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension as any)) {
      throw this.createServiceError(
        'INVALID_FILE_TYPE',
        `File type not supported: ${extension}`
      );
    }

    // Check MIME type
    const allSupportedTypes = [...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES];
    if (!allSupportedTypes.includes(fileData.mimeType as any)) {
      throw this.createServiceError(
        'INVALID_MIME_TYPE',
        `MIME type not supported: ${fileData.mimeType}`
      );
    }

    // Check if file is empty
    if (fileData.size === 0) {
      throw this.createServiceError('EMPTY_FILE', 'File is empty');
    }
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save file metadata (mock implementation - would use database in real app)
   */
  private async saveFileMetadata(file: StoredFile): Promise<void> {
    // In a real implementation, this would save to database
    // File metadata saved to storage
  }

  /**
   * Get file metadata (mock implementation - would query database in real app)
   */
  private async getFileMetadata(fileId: string): Promise<StoredFile | null> {
    // In a real implementation, this would query database
    // For now, we'll try to reconstruct from filesystem
    try {
      const files = await fs.readdir(this.uploadDir);
      const file = files.find(f => f.startsWith(fileId));
      
      if (!file) {
        return null;
      }

      const filePath = join(this.uploadDir, file);
      const stats = await fs.stat(filePath);
      
      return {
        id: fileId,
        filename: file,
        originalName: file, // We don't have this info without DB
        path: filePath,
        size: stats.size,
        mimeType: 'application/octet-stream', // We don't have this info without DB
        uploadedAt: stats.birthtime,
        status: 'uploaded'
      };
    } catch {
      return null;
    }
  }

  /**
   * Update file status (mock implementation)
   */
  private async updateFileStatus(fileId: string, status: StoredFile['status']): Promise<void> {
    // In a real implementation, this would update database
    // File status updated in storage
  }

  /**
   * Delete file metadata (mock implementation)
   */
  private async deleteFileMetadata(fileId: string): Promise<void> {
    // In a real implementation, this would delete from database
    // File metadata deleted from storage
  }

  /**
   * Create service error
   */
  private createServiceError(code: string, message: string, originalError?: any): FileProcessingError {
    return {
      code,
      message,
      details: originalError ? {
        originalMessage: originalError.message,
        stack: originalError.stack
      } : undefined
    };
  }
}

export const fileService = new FileService();
