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
