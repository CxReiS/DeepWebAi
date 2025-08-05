import { Context } from 'elysia';
import { fileService, FileUploadData } from './file.service';
import { ocrProcessor } from '@deepwebai/file-processing';
import { 
  FileProcessingOptions,
  FileUploadResponse,
  ProcessedFileContent,
  FileProcessingStatus
} from '@deepwebai/shared-types';

export class FileController {
  /**
   * Upload file endpoint
   */
  async uploadFile(context: Context): Promise<FileUploadResponse> {
    try {
      const { body } = context;
      
      // In Elysia, we would handle multipart form data
      // This is a simplified version - you'd need proper file upload handling
      const file = body as any; // Would be properly typed with Elysia file upload
      
      if (!file) {
        context.set.status = 400;
        throw new Error('No file provided');
      }

      const fileData: FileUploadData = {
        buffer: file.buffer || Buffer.from(file),
        originalName: file.name || 'unknown',
        mimeType: file.type || 'application/octet-stream',
        size: file.size || file.buffer?.length || 0
      };

      // Get user ID from auth context (if available)
      const userId = (context as any).user?.id;

      const result = await fileService.uploadFile(fileData, userId);
      
      context.set.status = 201;
      return result;
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

      const jobId = await fileService.processFile(fileId, options);
      
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

      const status = await fileService.getProcessingStatus(fileId);
      
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

      const content = await fileService.getProcessedContent(fileId);
      
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

      const result = await fileService.downloadFile(fileId);
      
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
   * Process image with OCR
   */
  async processImageOCR(context: Context): Promise<any> {
    try {
      const { body } = context;
      
      // Handle image upload for OCR
      const image = body as any; // Would be properly typed with file upload
      
      if (!image) {
        context.set.status = 400;
        throw new Error('No image provided');
      }

      const buffer = image.buffer || Buffer.from(image);
      const options = {
        language: body?.language || 'eng',
        confidence: body?.confidence || 60,
        preprocessImage: body?.preprocessImage !== false
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

      const success = await fileService.deleteFile(fileId);
      
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
}

export const fileController = new FileController();
