import { Context } from 'elysia';
import { formidableFileService, FormidableUploadData } from './formidable-service.js';
import { ocrProcessor } from '@deepwebai/file-processing';
import { 
  FileProcessingOptions,
  FileUploadResponse,
  ProcessedFileContent,
  FileProcessingStatus
} from '@deepwebai/shared-types';
import { IncomingMessage } from 'http';

export class FormidableFileController {
  /**
   * Upload single file endpoint with Formidable
   */
  async uploadFile(context: Context): Promise<FileUploadResponse> {
    try {
      // Convert Elysia request to Node.js IncomingMessage for Formidable
      const req = this.elysiaToNodeRequest(context);
      
      // Parse multipart form data
      const { fields, files } = await formidableFileService.parseForm(req);
      
      // Get the first uploaded file
      const fileEntries = Object.entries(files);
      if (fileEntries.length === 0) {
        context.set.status = 400;
        throw new Error('No file provided');
      }

      const [fieldName, file] = fileEntries[0];
      const uploadFile = Array.isArray(file) ? file[0] : file;

      if (!uploadFile) {
        context.set.status = 400;
        throw new Error('No valid file found');
      }

      // Get user ID from auth context
      const userId = (context as any).user?.id;

      const uploadData: FormidableUploadData = {
        file: uploadFile,
        fields
      };

      const result = await formidableFileService.uploadFile(uploadData, userId);
      
      context.set.status = 201;
      return result;
    } catch (error) {
      context.set.status = 400;
      throw error;
    }
  }

  /**
   * Upload multiple files endpoint with Formidable
   */
  async uploadMultipleFiles(context: Context): Promise<{ 
    success: boolean; 
    files: FileUploadResponse[];
    totalFiles: number;
    successCount: number;
    errorCount: number;
  }> {
    try {
      // Convert Elysia request to Node.js IncomingMessage
      const req = this.elysiaToNodeRequest(context);
      
      // Parse multipart form data
      const { fields, files } = await formidableFileService.parseForm(req);
      
      // Extract all uploaded files
      const allFiles: any[] = [];
      Object.values(files).forEach(file => {
        if (Array.isArray(file)) {
          allFiles.push(...file);
        } else {
          allFiles.push(file);
        }
      });

      if (allFiles.length === 0) {
        context.set.status = 400;
        throw new Error('No files provided');
      }

      // Get user ID from auth context
      const userId = (context as any).user?.id;

      // Upload all files
      const results = await formidableFileService.uploadMultipleFiles(allFiles, userId);
      
      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.filter(r => r.error).length;

      context.set.status = 201;
      return {
        success: true,
        files: results,
        totalFiles: allFiles.length,
        successCount,
        errorCount
      };
    } catch (error) {
      context.set.status = 400;
      throw error;
    }
  }

  /**
   * Process file endpoint
   */
  async processFile(context: Context): Promise<{ jobId: string; message: string }> {
    try {
      const { params, body } = context;
      const fileId = params.id as string;
      
      if (!fileId) {
        context.set.status = 400;
        throw new Error('File ID is required');
      }

      const options: FileProcessingOptions = {
        extractImages: body?.extractImages || false,
        ocrEnabled: body?.ocrEnabled !== false,
        language: body?.language || 'eng',
        cleanText: body?.cleanText !== false,
        maxPages: body?.maxPages || 500,
        ...body
      };

      const jobId = await formidableFileService.processFile(fileId, options);
      
      context.set.status = 202;
      return {
        jobId,
        message: 'File processing started'
      };
    } catch (error) {
      context.set.status = 400;
      throw error;
    }
  }

  /**
   * Get file processing status
   */
  async getProcessingStatus(context: Context): Promise<FileProcessingStatus | { error: string }> {
    try {
      const { params } = context;
      const fileId = params.id as string;
      
      if (!fileId) {
        context.set.status = 400;
        return { error: 'File ID is required' };
      }

      const status = await formidableFileService.getProcessingStatus(fileId);
      
      if (!status) {
        context.set.status = 404;
        return { error: 'Processing status not found' };
      }

      return status;
    } catch (error) {
      context.set.status = 500;
      return { error: 'Failed to get processing status' };
    }
  }

  /**
   * Get processed file content
   */
  async getFileContent(context: Context): Promise<ProcessedFileContent | { error: string }> {
    try {
      const { params } = context;
      const fileId = params.id as string;
      
      if (!fileId) {
        context.set.status = 400;
        return { error: 'File ID is required' };
      }

      const content = await formidableFileService.getProcessedContent(fileId);
      
      if (!content) {
        context.set.status = 404;
        return { error: 'Processed content not found' };
      }

      return content;
    } catch (error) {
      context.set.status = 500;
      return { error: 'Failed to get file content' };
    }
  }

  /**
   * Download file
   */
  async downloadFile(context: Context): Promise<Response> {
    try {
      const { params } = context;
      const fileId = params.id as string;
      
      if (!fileId) {
        context.set.status = 400;
        throw new Error('File ID is required');
      }

      const result = await formidableFileService.downloadFile(fileId);
      
      if (!result) {
        context.set.status = 404;
        throw new Error('File not found');
      }

      const { buffer, metadata } = result;

      // Set response headers
      context.set.headers = {
        'Content-Type': metadata.mimeType,
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
        'Cache-Control': 'no-cache'
      };

      return new Response(buffer);
    } catch (error) {
      context.set.status = error.message === 'File not found' ? 404 : 500;
      throw error;
    }
  }

  /**
   * Process image with OCR using Formidable
   */
  async processImageOCR(context: Context): Promise<any> {
    try {
      // Convert Elysia request to Node.js IncomingMessage
      const req = this.elysiaToNodeRequest(context);
      
      // Parse multipart form data
      const { fields, files } = await formidableFileService.parseForm(req);
      
      // Get the uploaded image
      const fileEntries = Object.entries(files);
      if (fileEntries.length === 0) {
        context.set.status = 400;
        throw new Error('No image provided');
      }

      const [fieldName, file] = fileEntries[0];
      const imageFile = Array.isArray(file) ? file[0] : file;

      if (!imageFile) {
        context.set.status = 400;
        throw new Error('No valid image found');
      }

      // Read image buffer
      const buffer = await require('fs').promises.readFile(imageFile.filepath);

      // OCR options from fields
      const options = {
        language: this.getFieldValue(fields, 'language') || 'eng',
        confidence: parseInt(this.getFieldValue(fields, 'confidence') || '60'),
        preprocessImage: this.getFieldValue(fields, 'preprocessImage') !== 'false'
      };

      const result = await ocrProcessor.processImage(buffer, options);
      
      return {
        text: result.text,
        confidence: result.confidence,
        blocks: result.blocks,
        processingTime: result.processingTime
      };
    } catch (error) {
      context.set.status = 400;
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(context: Context): Promise<{ success: boolean; message: string }> {
    try {
      const { params } = context;
      const fileId = params.id as string;
      
      if (!fileId) {
        context.set.status = 400;
        return { success: false, message: 'File ID is required' };
      }

      const success = await formidableFileService.deleteFile(fileId);
      
      if (!success) {
        context.set.status = 404;
        return { success: false, message: 'File not found' };
      }

      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      context.set.status = 500;
      return { success: false, message: 'Failed to delete file' };
    }
  }

  /**
   * Get supported file types
   */
  async getSupportedTypes(): Promise<{
    documentTypes: readonly string[];
    imageTypes: readonly string[];
    maxFileSize: number;
    allowedExtensions: readonly string[];
  }> {
    const { 
      SUPPORTED_DOCUMENT_TYPES, 
      SUPPORTED_IMAGE_TYPES, 
      MAX_FILE_SIZE, 
      ALLOWED_FILE_EXTENSIONS 
    } = await import('@deepwebai/file-processing');

    return {
      documentTypes: SUPPORTED_DOCUMENT_TYPES,
      imageTypes: SUPPORTED_IMAGE_TYPES,
      maxFileSize: MAX_FILE_SIZE,
      allowedExtensions: ALLOWED_FILE_EXTENSIONS
    };
  }

  /**
   * Get OCR supported languages
   */
  async getOCRLanguages(): Promise<{ languages: string[] }> {
    const languages = ocrProcessor.getSupportedLanguages();
    return { languages };
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(context: Context): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    fileTypes: Record<string, number>;
  }> {
    try {
      const stats = await formidableFileService.getUploadStats();
      return stats;
    } catch (error) {
      context.set.status = 500;
      throw error;
    }
  }

  /**
   * Convert Elysia context to Node.js IncomingMessage for Formidable compatibility
   */
  private elysiaToNodeRequest(context: Context): IncomingMessage {
    // This is a simplified conversion
    // In a real implementation, you might need a more robust conversion
    const req = {
      method: context.request.method,
      url: context.request.url,
      headers: Object.fromEntries(context.request.headers.entries()),
      body: context.body,
      // Add other necessary properties for Formidable
    } as any;

    return req;
  }

  /**
   * Get field value from Formidable fields
   */
  private getFieldValue(fields: any, fieldName: string): string | undefined {
    const field = fields[fieldName];
    if (Array.isArray(field)) {
      return field[0];
    }
    return field;
  }
}

export const formidableFileController = new FormidableFileController();
