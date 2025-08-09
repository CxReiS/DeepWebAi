import { Elysia } from "elysia";
import { formidableFileController } from "./formidable-controller.js";
import { authMiddleware, requireAuth } from "../../auth/authjs-middleware.js";
import { z } from "zod";

// File processing options schema
const FileProcessingOptionsSchema = z.object({
  extractImages: z.boolean().optional().default(false),
  ocrEnabled: z.boolean().optional().default(true),
  language: z.string().optional().default('eng'),
  cleanText: z.boolean().optional().default(true),
  maxPages: z.number().optional().default(500),
  confidence: z.number().optional().default(60),
  preprocessImage: z.boolean().optional().default(true)
});

// File upload router with Formidable
export const formidableFileRouter = new Elysia({ prefix: '/api/files' })
  .use(authMiddleware)
  
  // Upload single file
  .post('/upload', 
    async (context) => formidableFileController.uploadFile(context),
    {
      detail: {
        summary: 'Upload single file',
        description: 'Upload a single file using Formidable multipart parser',
        tags: ['Files'],
        consumes: ['multipart/form-data'],
        produces: ['application/json']
      }
    }
  )
  
  // Upload multiple files
  .post('/upload/multiple', 
    async (context) => formidableFileController.uploadMultipleFiles(context),
    {
      detail: {
        summary: 'Upload multiple files',
        description: 'Upload multiple files at once using Formidable',
        tags: ['Files'],
        consumes: ['multipart/form-data'],
        produces: ['application/json']
      }
    }
  )
  
  // Process uploaded file
  .post('/:id/process', 
    async (context) => formidableFileController.processFile(context),
    {
      params: z.object({
        id: z.string().uuid('Invalid file ID format')
      }),
      body: FileProcessingOptionsSchema,
      detail: {
        summary: 'Process uploaded file',
        description: 'Start processing an uploaded file with specified options',
        tags: ['Files'],
        produces: ['application/json']
      }
    }
  )
  
  // Get processing status
  .get('/:id/status', 
    async (context) => formidableFileController.getProcessingStatus(context),
    {
      params: z.object({
        id: z.string().uuid('Invalid file ID format')
      }),
      detail: {
        summary: 'Get processing status',
        description: 'Get the current processing status of a file',
        tags: ['Files'],
        produces: ['application/json']
      }
    }
  )
  
  // Get processed content
  .get('/:id/content', 
    async (context) => formidableFileController.getFileContent(context),
    {
      params: z.object({
        id: z.string().uuid('Invalid file ID format')
      }),
      detail: {
        summary: 'Get processed content',
        description: 'Get the processed content of a file',
        tags: ['Files'],
        produces: ['application/json']
      }
    }
  )
  
  // Download file
  .get('/:id/download', 
    async (context) => formidableFileController.downloadFile(context),
    {
      params: z.object({
        id: z.string().uuid('Invalid file ID format')
      }),
      detail: {
        summary: 'Download file',
        description: 'Download the original uploaded file',
        tags: ['Files'],
        produces: ['application/octet-stream']
      }
    }
  )
  
  // Delete file
  .delete('/:id', 
    async (context) => formidableFileController.deleteFile(context),
    {
      params: z.object({
        id: z.string().uuid('Invalid file ID format')
      }),
      detail: {
        summary: 'Delete file',
        description: 'Delete an uploaded file and its processed content',
        tags: ['Files'],
        produces: ['application/json']
      }
    }
  )
  
  // OCR image processing
  .post('/ocr', 
    async (context) => formidableFileController.processImageOCR(context),
    {
      detail: {
        summary: 'Process image with OCR',
        description: 'Extract text from an image using OCR',
        tags: ['Files', 'OCR'],
        consumes: ['multipart/form-data'],
        produces: ['application/json']
      }
    }
  )
  
  // Get supported file types
  .get('/types', 
    async () => formidableFileController.getSupportedTypes(),
    {
      detail: {
        summary: 'Get supported file types',
        description: 'Get list of supported file types and limits',
        tags: ['Files'],
        produces: ['application/json']
      }
    }
  )
  
  // Get OCR supported languages
  .get('/ocr/languages', 
    async () => formidableFileController.getOCRLanguages(),
    {
      detail: {
        summary: 'Get OCR supported languages',
        description: 'Get list of languages supported by OCR',
        tags: ['Files', 'OCR'],
        produces: ['application/json']
      }
    }
  )
  
  // Get upload statistics (requires auth)
  .use(requireAuth)
  .get('/stats', 
    async (context) => formidableFileController.getUploadStats(context),
    {
      detail: {
        summary: 'Get upload statistics',
        description: 'Get statistics about uploaded files (authenticated users only)',
        tags: ['Files', 'Stats'],
        produces: ['application/json'],
        security: [{ bearerAuth: [] }]
      }
    }
  );

export default formidableFileRouter;
