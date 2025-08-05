// Main exports for file processing package
export { FileProcessor, fileProcessor } from './src/file-processor';
export type { FileProcessingResult } from './src/file-processor';

// Document processing
export { PDFReader, pdfReader } from './src/document/pdf_reader';
export type { PDFContent } from './src/document/pdf_reader';
export { DOCXReader, docxReader } from './src/document/docx_reader';
export type { DOCXContent } from './src/document/docx_reader';
export { TextCleaner, textCleaner } from './src/document/text_cleaner';
export type { TextCleaningOptions } from './src/document/text_cleaner';

// OCR processing
export { OCRProcessor, ocrProcessor } from './src/ocr/ocr_processor';
export type { OCRProcessingOptions } from './src/ocr/ocr_processor';

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
