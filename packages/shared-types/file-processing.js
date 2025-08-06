"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_FILE_EXTENSIONS = exports.MAX_PAGES = exports.MAX_FILE_SIZE = exports.SUPPORTED_IMAGE_TYPES = exports.SUPPORTED_DOCUMENT_TYPES = void 0;
// Supported file types
exports.SUPPORTED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
];
exports.SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
];
// File validation constants
exports.MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
exports.MAX_PAGES = 500;
exports.ALLOWED_FILE_EXTENSIONS = [
    '.pdf', '.docx', '.doc', '.txt',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
];
