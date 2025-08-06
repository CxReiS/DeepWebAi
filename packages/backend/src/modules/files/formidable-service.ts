import { IncomingForm, File as FormidableFile, Fields, Files } from 'formidable';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
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
import { IncomingMessage } from 'http';

export interface FormidableUploadData {
  file: FormidableFile;
  fields: Fields;
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

export class FormidableFileService {
  private uploadDir: string;
  private processingJobs = new Map<string, ProcessingJob>();

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  /**
   * Parse multipart form data using Formidable
   */
  async parseForm(req: IncomingMessage): Promise<{ fields: Fields; files: Files }> {
    return new Promise((resolve, reject) => {
      const form = new IncomingForm({
        uploadDir: this.uploadDir,
        keepExtensions: true,
        maxFileSize: MAX_FILE_SIZE,
        maxFieldsSize: 10 * 1024 * 1024, // 10MB for fields
        maxFields: 50,
        allowEmptyFiles: false,
        minFileSize: 1,
        filter: ({ name, originalFilename, mimetype }) => {
          // Validate file type
          if (!originalFilename) return false;
          
          const extension = extname(originalFilename).toLowerCase();
          const isValidExtension = ALLOWED_FILE_EXTENSIONS.includes(extension as any);
          
          const allSupportedTypes = [...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES];
          const isValidMimeType = mimetype && allSupportedTypes.includes(mimetype as any);
          
          return isValidExtension && isValidMimeType;
        }
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(this.createServiceError('FORM_PARSE_ERROR', 'Failed to parse form data', err));
          return;
        }
        
        resolve({ fields, files });
      });
    });
  }

  /**
   * Upload and store file using Formidable
   */
  async uploadFile(uploadData: FormidableUploadData, userId?: string): Promise<FileUploadResponse> {
    try {
      const { file } = uploadData;
      
      // Validate file
      this.validateFormidableFile(file);

      // Generate unique filename
      const fileId = uuidv4();
      const extension = extname(file.originalFilename || '');
      const filename = `${fileId}${extension}`;
      const finalPath = join(this.uploadDir, filename);

      // Move uploaded file to final location
      await fs.rename(file.filepath, finalPath);

      // Store file metadata
      const storedFile: StoredFile = {
        id: fileId,
        filename,
        originalName: file.originalFilename || 'unknown',
        path: finalPath,
        size: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        uploadedAt: new Date(),
        status: 'uploaded',
        userId
      };

      // Save metadata to storage
      await this.saveFileMetadata(storedFile);

      return {
        id: fileId,
        filename,
        originalName: storedFile.originalName,
        size: storedFile.size,
        mimeType: storedFile.mimeType,
        uploadedAt: storedFile.uploadedAt.toISOString(),
        status: 'uploaded'
      };
    } catch (error) {
      throw this.createServiceError('UPLOAD_ERROR', 'Failed to upload file', error);
    }
  }

  /**
   * Upload multiple files using Formidable
   */
  async uploadMultipleFiles(files: FormidableFile[], userId?: string): Promise<FileUploadResponse[]> {
    const results: FileUploadResponse[] = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadFile({ file, fields: {} }, userId);
        results.push(result);
      } catch (error) {
        // Continue processing other files even if one fails
        console.error(`Failed to upload file ${file.originalFilename}:`, error);
        
        // Add error result
        results.push({
          id: '',
          filename: file.originalFilename || 'unknown',
          originalName: file.originalFilename || 'unknown',
          size: file.size,
          mimeType: file.mimetype || 'unknown',
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }
    
    return results;
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
      throw error instanceof FileProcessingError 
        ? error 
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

      // Remove metadata
      await this.deleteFileMetadata(fileId);

      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Validate Formidable file
   */
  private validateFormidableFile(file: FormidableFile): void {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw this.createServiceError(
        'FILE_TOO_LARGE', 
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }

    // Check file extension
    const extension = extname(file.originalFilename || '').toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension as any)) {
      throw this.createServiceError(
        'INVALID_FILE_TYPE',
        `File type not supported: ${extension}`
      );
    }

    // Check MIME type
    const allSupportedTypes = [...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES];
    if (file.mimetype && !allSupportedTypes.includes(file.mimetype as any)) {
      throw this.createServiceError(
        'INVALID_MIME_TYPE',
        `MIME type not supported: ${file.mimetype}`
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      throw this.createServiceError('EMPTY_FILE', 'File is empty');
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

    } catch (error) {
      // Handle processing error
      const job = this.processingJobs.get(fileId);
      if (job) {
        job.status.status = 'failed';
        job.status.completedAt = new Date().toISOString();
        job.error = error instanceof FileProcessingError 
          ? error 
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
   * Save file metadata (mock implementation)
   */
  private async saveFileMetadata(file: StoredFile): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we could save to a JSON file or use in-memory storage
  }

  /**
   * Get file metadata (mock implementation)
   */
  private async getFileMetadata(fileId: string): Promise<StoredFile | null> {
    // In a real implementation, this would query database
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
        originalName: file,
        path: filePath,
        size: stats.size,
        mimeType: 'application/octet-stream',
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
  }

  /**
   * Delete file metadata (mock implementation)
   */
  private async deleteFileMetadata(fileId: string): Promise<void> {
    // In a real implementation, this would delete from database
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

  /**
   * Get upload statistics
   */
  async getUploadStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    fileTypes: Record<string, number>;
  }> {
    try {
      const files = await fs.readdir(this.uploadDir);
      let totalSize = 0;
      const fileTypes: Record<string, number> = {};

      for (const file of files) {
        const filePath = join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        const extension = extname(file).toLowerCase();
        fileTypes[extension] = (fileTypes[extension] || 0) + 1;
      }

      return {
        totalFiles: files.length,
        totalSize,
        averageSize: files.length > 0 ? totalSize / files.length : 0,
        fileTypes
      };
    } catch (error) {
      throw this.createServiceError('STATS_ERROR', 'Failed to get upload statistics', error);
    }
  }
}

export const formidableFileService = new FormidableFileService();
