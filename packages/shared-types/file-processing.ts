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

// File Processing Types
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
}

export interface ProcessedFileContent {
  id: string;
  fileId: string;
  content: string;
  pageCount?: number;
  metadata: FileMetadata;
  processedAt: string;
}

export interface FileMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  producer?: string;
  creator?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
}

export interface FileProcessingOptions {
  extractImages?: boolean;
  ocrEnabled?: boolean;
  language?: string;
  cleanText?: boolean;
  maxPages?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
  processingTime: number;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface FileProcessingError {
  code: string;
  message: string;
  details?: any;
}

export interface FileProcessingStatus {
  fileId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: FileProcessingError;
}

// Supported file types
export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain'
] as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp'
] as const;

export type SupportedDocumentType = typeof SUPPORTED_DOCUMENT_TYPES[number];
export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];
export type SupportedFileType = SupportedDocumentType | SupportedImageType;

// File validation constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PAGES = 500;
export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf', '.docx', '.doc', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
] as const;
