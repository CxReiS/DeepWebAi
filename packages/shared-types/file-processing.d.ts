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
export declare const SUPPORTED_DOCUMENT_TYPES: readonly ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"];
export declare const SUPPORTED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/webp"];
export type SupportedDocumentType = typeof SUPPORTED_DOCUMENT_TYPES[number];
export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];
export type SupportedFileType = SupportedDocumentType | SupportedImageType;
export declare const MAX_FILE_SIZE: number;
export declare const MAX_PAGES = 500;
export declare const ALLOWED_FILE_EXTENSIONS: readonly [".pdf", ".docx", ".doc", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"];
