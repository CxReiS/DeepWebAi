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

import mimeTypes from 'mime-types';
import { 
  FileProcessingOptions, 
  ProcessedFileContent, 
  FileMetadata, 
  SupportedFileType,
  SUPPORTED_DOCUMENT_TYPES,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  FileProcessingError
} from '@deepwebai/shared-types';

import { pdfReader } from './document/pdf_reader.js';
import { docxReader } from './document/docx_reader.js';
import { textCleaner } from './document/text_cleaner.js';
import { ocrProcessor, OCRResult } from './ocr/ocr_processor.js';

export interface FileProcessingResult {
  content: ProcessedFileContent;
  ocrResults?: OCRResult[];
  processingTime: number;
}

export class FileProcessor {
  /**
   * Process file based on its type
   */
  async processFile(
    buffer: Buffer, 
    filename: string,
    fileId: string,
    options: FileProcessingOptions = {}
  ): Promise<FileProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Validate file
      const validation = this.validateFile(buffer, filename);
      if (!validation.isValid) {
        throw this.createProcessingError('FILE_VALIDATION_ERROR', validation.error!);
      }

      const mimeType = validation.mimeType!;
      let content: string = '';
      let metadata: FileMetadata = {};
      let ocrResults: OCRResult[] | undefined;

      // Process based on file type
      if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType as any)) {
        const result = await this.processDocument(buffer, mimeType, options);
        content = result.text;
        metadata = result.metadata;
      } else if (SUPPORTED_IMAGE_TYPES.includes(mimeType as any)) {
        if (options.ocrEnabled !== false) {
          const ocrResult = await ocrProcessor.processImage(buffer, options);
          content = ocrResult.text;
          ocrResults = [ocrResult];
          metadata = {
            wordCount: this.countWords(content)
          };
        }
      }

      // Clean text if requested
      if (options.cleanText && content) {
        content = textCleaner.clean(content);
        metadata.wordCount = this.countWords(content);
      }

      const processingTime = Date.now() - startTime;

      const processedContent: ProcessedFileContent = {
        id: this.generateId(),
        fileId,
        content,
        metadata,
        processedAt: new Date().toISOString()
      };

      return {
        content: processedContent,
        ocrResults,
        processingTime
      };
    } catch (error) {
      throw this.createProcessingError('PROCESSING_ERROR', 'Failed to process file', error);
    }
  }

  /**
   * Process document files (PDF, DOCX, TXT)
   */
  private async processDocument(
    buffer: Buffer, 
    mimeType: string, 
    options: FileProcessingOptions
  ): Promise<{ text: string; metadata: FileMetadata }> {
    switch (mimeType) {
      case 'application/pdf':
        const pdfResult = await pdfReader.extractText(buffer, options);
        return {
          text: pdfResult.text,
          metadata: { ...pdfResult.metadata, pageCount: pdfResult.pageCount }
        };

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docxResult = await docxReader.extractText(buffer, options);
        return {
          text: docxResult.text,
          metadata: docxResult.metadata
        };

      case 'text/plain':
        const text = buffer.toString('utf-8');
        return {
          text,
          metadata: {
            wordCount: this.countWords(text)
          }
        };

      default:
        throw this.createProcessingError('UNSUPPORTED_TYPE', `Unsupported document type: ${mimeType}`);
    }
  }

  /**
   * Validate file before processing
   */
  validateFile(buffer: Buffer, filename: string): {
    isValid: boolean;
    error?: string;
    mimeType?: string;
  } {
    // Check file size
    if (buffer.length === 0) {
      return { isValid: false, error: 'Empty file' };
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    // Determine MIME type
    const mimeType = mimeTypes.lookup(filename);
    if (!mimeType) {
      return { isValid: false, error: 'Unknown file type' };
    }

    // Check if type is supported
    const allSupportedTypes = [...SUPPORTED_DOCUMENT_TYPES, ...SUPPORTED_IMAGE_TYPES];
    if (!allSupportedTypes.includes(mimeType as SupportedFileType)) {
      return { 
        isValid: false, 
        error: `Unsupported file type: ${mimeType}` 
      };
    }

    // Additional validation based on file type
    if (mimeType === 'application/pdf') {
      const pdfValidation = pdfReader.validatePDF(buffer);
      if (!pdfValidation.isValid) {
        return { isValid: false, error: pdfValidation.error };
      }
    } else if (mimeType.includes('wordprocessing')) {
      const docxValidation = docxReader.validateDOCX(buffer);
      if (!docxValidation.isValid) {
        return { isValid: false, error: docxValidation.error };
      }
    } else if (mimeType.startsWith('image/')) {
      // Image validation would be async, so we'll validate during processing
    }

    return { isValid: true, mimeType };
  }

  /**
   * Extract images from document for OCR
   */
  async extractImagesFromDocument(buffer: Buffer, mimeType: string): Promise<Buffer[]> {
    try {
      switch (mimeType) {
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await docxReader.extractImages(buffer);
        
        // PDF image extraction would require additional libraries like pdf2pic
        case 'application/pdf':
          // TODO: Implement PDF image extraction
          return [];
        
        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to extract images:', error);
      return [];
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized processing error
   */
  private createProcessingError(code: string, message: string, originalError?: any): FileProcessingError {
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

export const fileProcessor = new FileProcessor();
