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

// Main exports for file processing package
export { FileProcessor, fileProcessor } from './src/file-processor.js';
export type { FileProcessingResult } from './src/file-processor.js';

// Document processing
export { PDFReader, pdfReader } from './src/document/pdf_reader.js';
export type { PDFContent } from './src/document/pdf_reader.js';
export { DOCXReader, docxReader } from './src/document/docx_reader.js';
export type { DOCXContent } from './src/document/docx_reader.js';
export { TextCleaner, textCleaner } from './src/document/text_cleaner.js';
export type { TextCleaningOptions } from './src/document/text_cleaner.js';

// OCR processing
export { OCRProcessor, ocrProcessor } from './src/ocr/ocr_processor.js';
export type { OCRProcessingOptions } from './src/ocr/ocr_processor.js';

// Re-export types from shared-types
export type {
  FileUploadResponse,
  ProcessedFileContent,
  FileMetadata,
  FileProcessingOptions,
  OCRResult,
  OCRBlock,
  FileProcessingError,
  FileProcessingStatus,
  SupportedDocumentType,
  SupportedImageType,
  SupportedFileType
} from '@deepwebai/shared-types';

export {
  SUPPORTED_DOCUMENT_TYPES,
  SUPPORTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_PAGES,
  ALLOWED_FILE_EXTENSIONS
} from '@deepwebai/shared-types';
