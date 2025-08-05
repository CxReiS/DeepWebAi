// File processing module exports
export { fileService, FileService } from './file.service';
export { fileController, FileController } from './file.controller';
export { fileProcessingRoutes, fileRouter, ocrRouter } from './file.router';

// Re-export types for convenience
export type {
  FileUploadResponse,
  ProcessedFileContent,
  FileMetadata,
  FileProcessingOptions,
  OCRResult,
  OCRBlock,
  FileProcessingError,
  FileProcessingStatus
} from '@deepwebai/shared-types';
