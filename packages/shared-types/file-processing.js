// Supported file types
export const SUPPORTED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
];
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
];
// File validation constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PAGES = 500;
export const ALLOWED_FILE_EXTENSIONS = [
    '.pdf', '.docx', '.doc', '.txt',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
];
