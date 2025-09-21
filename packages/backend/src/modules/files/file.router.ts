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

import { Elysia, t } from 'elysia';
import { fileController } from './file.controller';

// File processing validation schemas
const FileProcessingOptionsSchema = t.Object({
  extractImages: t.Optional(t.Boolean()),
  ocrEnabled: t.Optional(t.Boolean()),
  language: t.Optional(t.String()),
  cleanText: t.Optional(t.Boolean()),
  maxPages: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
  confidence: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  preprocessImage: t.Optional(t.Boolean())
});

const FileUploadResponseSchema = t.Object({
  id: t.String(),
  filename: t.String(),
  originalName: t.String(),
  size: t.Number(),
  mimeType: t.String(),
  uploadedAt: t.String(),
  status: t.Union([
    t.Literal('uploaded'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed')
  ])
});

const ProcessingStatusSchema = t.Object({
  fileId: t.String(),
  status: t.Union([
    t.Literal('pending'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed')
  ]),
  progress: t.Number({ minimum: 0, maximum: 100 }),
  startedAt: t.String(),
  completedAt: t.Optional(t.String()),
  error: t.Optional(t.Object({
    code: t.String(),
    message: t.String(),
    details: t.Optional(t.Any())
  }))
});

const FileMetadataSchema = t.Object({
  title: t.Optional(t.String()),
  author: t.Optional(t.String()),
  subject: t.Optional(t.String()),
  keywords: t.Optional(t.Array(t.String())),
  creationDate: t.Optional(t.String()),
  modificationDate: t.Optional(t.String()),
  producer: t.Optional(t.String()),
  creator: t.Optional(t.String()),
  pageCount: t.Optional(t.Number()),
  wordCount: t.Optional(t.Number()),
  language: t.Optional(t.String())
});

const ProcessedContentSchema = t.Object({
  id: t.String(),
  fileId: t.String(),
  content: t.String(),
  pageCount: t.Optional(t.Number()),
  metadata: FileMetadataSchema,
  processedAt: t.String()
});

const OCRBlockSchema = t.Object({
  text: t.String(),
  confidence: t.Number(),
  bbox: t.Object({
    x0: t.Number(),
    y0: t.Number(),
    x1: t.Number(),
    y1: t.Number()
  })
});

const OCRResultSchema = t.Object({
  text: t.String(),
  confidence: t.Number(),
  blocks: t.Array(OCRBlockSchema),
  processingTime: t.Number()
});

export const fileRouter = new Elysia({ prefix: '/api/files' })
  .post('/upload', async (context) => fileController.uploadFile(context as any), {
    body: t.File(),
    response: {
      201: FileUploadResponseSchema,
      400: t.Object({
        error: t.String(),
        message: t.String()
      })
    },
    detail: {
      summary: 'Upload a file',
      description: 'Upload a file for processing. Supports PDF, DOCX, TXT, and image files.',
      tags: ['Files']
    }
  })

  .post('/:id/process', async (context) => fileController.processFile(context as any), {
    params: t.Object({
      id: t.String({ description: 'File ID' })
    }),
    body: t.Optional(FileProcessingOptionsSchema),
    response: {
      202: t.Object({
        jobId: t.String(),
        message: t.String()
      }),
      400: t.Object({
        error: t.String(),
        message: t.String()
      }),
      404: t.Object({
        error: t.String(),
        message: t.String()
      })
    },
    detail: {
      summary: 'Process uploaded file',
      description: 'Start processing an uploaded file to extract text content.',
      tags: ['Files']
    }
  })

  .get('/:id/status', async (context) => fileController.getProcessingStatus(context as any), {
    params: t.Object({
      id: t.String({ description: 'File ID' })
    }),
    response: {
      200: ProcessingStatusSchema,
      404: t.Object({
        error: t.String()
      })
    },
    detail: {
      summary: 'Get file processing status',
      description: 'Get the current processing status of a file.',
      tags: ['Files']
    }
  })

  .get('/:id/content', async (context) => fileController.getFileContent(context as any), {
    params: t.Object({
      id: t.String({ description: 'File ID' })
    }),
    response: {
      200: ProcessedContentSchema,
      404: t.Object({
        error: t.String()
      })
    },
    detail: {
      summary: 'Get processed file content',
      description: 'Get the extracted text content from a processed file.',
      tags: ['Files']
    }
  })

  .get('/:id/download', async (context) => fileController.downloadFile(context as any), {
    params: t.Object({
      id: t.String({ description: 'File ID' })
    }),
    response: {
      200: t.File(),
      404: t.Object({
        error: t.String(),
        message: t.String()
      })
    },
    detail: {
      summary: 'Download file',
      description: 'Download the original uploaded file.',
      tags: ['Files']
    }
  })

  .delete('/:id', async (context) => fileController.deleteFile(context), {
    params: t.Object({
      id: t.String({ description: 'File ID' })
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String()
      }),
      404: t.Object({
        success: t.Boolean(),
        message: t.String()
      })
    },
    detail: {
      summary: 'Delete file',
      description: 'Delete an uploaded file and its processed content.',
      tags: ['Files']
    }
  })

  .get('/supported-types', async () => fileController.getSupportedTypes(), {
    response: {
      200: t.Object({
        documentTypes: t.Array(t.String()),
        imageTypes: t.Array(t.String()),
        maxFileSize: t.Number(),
        allowedExtensions: t.Array(t.String())
      })
    },
    detail: {
      summary: 'Get supported file types',
      description: 'Get information about supported file types and limits.',
      tags: ['Files']
    }
  });

// OCR specific router
export const ocrRouter = new Elysia({ prefix: '/api/ocr' })
  .post('/process', async (context) => fileController.processImageOCR(context), {
    body: t.File(),
    response: {
      200: OCRResultSchema,
      400: t.Object({
        error: t.String(),
        message: t.String()
      })
    },
    detail: {
      summary: 'Process image with OCR',
      description: 'Extract text from an image using OCR technology.',
      tags: ['OCR']
    }
  })

  .get('/languages', async () => fileController.getOCRLanguages(), {
    response: {
      200: t.Object({
        languages: t.Array(t.String())
      })
    },
    detail: {
      summary: 'Get supported OCR languages',
      description: 'Get list of supported languages for OCR processing.',
      tags: ['OCR']
    }
  });

// Combined export
export const fileProcessingRoutes = new Elysia()
  .use(fileRouter)
  .use(ocrRouter);
