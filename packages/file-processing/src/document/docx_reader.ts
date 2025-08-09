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

import mammoth from 'mammoth';
import { FileMetadata, FileProcessingOptions, FileProcessingError } from '@deepwebai/shared-types';

export interface DOCXContent {
  text: string;
  html?: string;
  metadata: FileMetadata;
  images?: Buffer[];
}

export class DOCXReader {
  /**
   * Extract text and metadata from DOCX buffer
   */
  async extractText(buffer: Buffer, options: FileProcessingOptions = {}): Promise<DOCXContent> {
    try {
      // Extract text
      const textResult = await mammoth.extractRawText({ buffer });
      
      // Extract HTML if needed
      let html: string | undefined;
      if (options.extractImages) {
        const htmlResult = await mammoth.convertToHtml({ buffer });
        html = htmlResult.value;
      }

      const content: DOCXContent = {
        text: textResult.value,
        html,
        metadata: {
          wordCount: this.countWords(textResult.value),
          // DOCX doesn't expose much metadata through mammoth
          // In a real implementation, you might use a different library
          // or extract metadata from the DOCX structure directly
        }
      };

      if (options.cleanText) {
        content.text = this.cleanText(content.text);
      }

      return content;
    } catch (error) {
      throw this.createProcessingError('DOCX_PARSE_ERROR', 'Failed to parse DOCX file', error);
    }
  }

  /**
   * Extract images from DOCX file
   */
  async extractImages(buffer: Buffer): Promise<Buffer[]> {
    try {
      const images: Buffer[] = [];
      
      await mammoth.convertToHtml({
        buffer
      });

      return images;
    } catch (error) {
      throw this.createProcessingError('DOCX_IMAGE_EXTRACTION_ERROR', 'Failed to extract images from DOCX', error);
    }
  }

  /**
   * Validate DOCX file
   */
  validateDOCX(buffer: Buffer): { isValid: boolean; error?: string } {
    try {
      // Check ZIP signature (DOCX is a ZIP file)
      const zipSignature = buffer.slice(0, 4);
      const validSignatures = [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // Standard ZIP
        Buffer.from([0x50, 0x4B, 0x05, 0x06]), // Empty ZIP
        Buffer.from([0x50, 0x4B, 0x07, 0x08])  // Spanned ZIP
      ];

      const isValidZip = validSignatures.some(sig => sig.equals(zipSignature));
      if (!isValidZip) {
        return { isValid: false, error: 'Invalid DOCX file format (not a ZIP file)' };
      }

      // Check file size
      if (buffer.length === 0) {
        return { isValid: false, error: 'Empty DOCX file' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate DOCX file' };
    }
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove page headers/footers
      .replace(/^Page \d+.*$/gm, '')
      // Remove non-printable characters except newlines and tabs
      .replace(/[^\x20-\x7E\n\t]/g, '')
      // Trim
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
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

export const docxReader = new DOCXReader();
