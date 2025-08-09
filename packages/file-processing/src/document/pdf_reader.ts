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

import pdfParse from 'pdf-parse';
import { FileMetadata, FileProcessingOptions, FileProcessingError } from '@deepwebai/shared-types';

export interface PDFContent {
  text: string;
  metadata: FileMetadata;
  pageCount: number;
}

export class PDFReader {
  /**
   * Extract text and metadata from PDF buffer
   */
  async extractText(buffer: Buffer, options: FileProcessingOptions = {}): Promise<PDFContent> {
    try {
      const data = await pdfParse(buffer, {
        max: options.maxPages || 500,
        version: 'v2.0.550'
      });

      const content: PDFContent = {
        text: data.text,
        pageCount: data.numpages,
        metadata: {
          pageCount: data.numpages,
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          keywords: data.info?.Keywords ? data.info.Keywords.split(',').map((k: string) => k.trim()) : undefined,
          creationDate: data.info?.CreationDate,
          modificationDate: data.info?.ModDate,
          producer: data.info?.Producer,
          creator: data.info?.Creator,
          wordCount: this.countWords(data.text)
        }
      };

      if (options.cleanText) {
        content.text = this.cleanText(content.text);
      }

      return content;
    } catch (error) {
      throw this.createProcessingError('PDF_PARSE_ERROR', 'Failed to parse PDF file', error);
    }
  }

  /**
   * Validate PDF file
   */
  validatePDF(buffer: Buffer): { isValid: boolean; error?: string } {
    try {
      // Check PDF magic number
      const header = buffer.slice(0, 4).toString();
      if (!header.startsWith('%PDF')) {
        return { isValid: false, error: 'Invalid PDF file format' };
      }

      // Check file size
      if (buffer.length === 0) {
        return { isValid: false, error: 'Empty PDF file' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate PDF file' };
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
      // Remove page headers/footers (simple heuristic)
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

export const pdfReader = new PDFReader();
