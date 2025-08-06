import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormidableFileService } from '../../../packages/backend/src/modules/files/formidable-service.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as testUtils from '../../helpers/test-utils.js';

// Mock formidable
vi.mock('formidable', () => ({
  IncomingForm: vi.fn().mockImplementation(() => ({
    parse: vi.fn()
  }))
}));

// Mock file processing
vi.mock('@deepwebai/file-processing', () => ({
  fileProcessor: {
    processFile: vi.fn()
  },
  ocrProcessor: {
    processImage: vi.fn(),
    getSupportedLanguages: vi.fn()
  }
}));

// Mock fs promises
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    promises: {
      writeFile: vi.fn(),
      readFile: vi.fn(),
      unlink: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      access: vi.fn(),
      mkdir: vi.fn(),
      rename: vi.fn()
    }
  };
});

describe('Formidable File Service', () => {
  let fileService: FormidableFileService;
  const testUploadDir = '/test/uploads';

  beforeEach(() => {
    vi.clearAllMocks();
    fileService = new FormidableFileService();
    
    // Mock upload directory creation
    (fs.access as any).mockRejectedValue(new Error('Directory not found'));
    (fs.mkdir as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('File Upload with Formidable', () => {
    it('should upload file successfully using Formidable', async () => {
      const mockFile = {
        filepath: '/tmp/upload_123',
        originalFilename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        hash: null,
        lastModifiedDate: new Date(),
        newFilename: 'upload_123'
      };

      const uploadData = {
        file: mockFile,
        fields: {}
      };

      // Mock file operations
      (fs.rename as any).mockResolvedValue(undefined);

      const result = await fileService.uploadFile(uploadData, 'user-123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('filename');
      expect(result.originalName).toBe('test.pdf');
      expect(result.size).toBe(1024);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.status).toBe('uploaded');

      expect(fs.rename).toHaveBeenCalledWith(
        mockFile.filepath,
        expect.stringContaining('.pdf')
      );
    });

    it('should validate file type during upload', async () => {
      const mockFile = {
        filepath: '/tmp/upload_123',
        originalFilename: 'malicious.exe',
        mimetype: 'application/x-executable',
        size: 1024
      };

      const uploadData = {
        file: mockFile,
        fields: {}
      };

      await expect(fileService.uploadFile(uploadData))
        .rejects.toThrow('File type not supported');
    });

    it('should validate file size during upload', async () => {
      const mockFile = {
        filepath: '/tmp/upload_123',
        originalFilename: 'large.pdf',
        mimetype: 'application/pdf',
        size: 100 * 1024 * 1024 * 1024 // 100GB - too large
      };

      const uploadData = {
        file: mockFile,
        fields: {}
      };

      await expect(fileService.uploadFile(uploadData))
        .rejects.toThrow('File size exceeds maximum limit');
    });

    it('should reject empty files', async () => {
      const mockFile = {
        filepath: '/tmp/upload_123',
        originalFilename: 'empty.pdf',
        mimetype: 'application/pdf',
        size: 0
      };

      const uploadData = {
        file: mockFile,
        fields: {}
      };

      await expect(fileService.uploadFile(uploadData))
        .rejects.toThrow('File is empty');
    });

    it('should handle file rename errors', async () => {
      const mockFile = {
        filepath: '/tmp/upload_123',
        originalFilename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024
      };

      const uploadData = {
        file: mockFile,
        fields: {}
      };

      // Mock file rename failure
      (fs.rename as any).mockRejectedValue(new Error('Permission denied'));

      await expect(fileService.uploadFile(uploadData))
        .rejects.toThrow('Failed to upload file');
    });
  });

  describe('Multiple File Upload', () => {
    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        {
          filepath: '/tmp/upload_1',
          originalFilename: 'file1.pdf',
          mimetype: 'application/pdf',
          size: 1024
        },
        {
          filepath: '/tmp/upload_2',
          originalFilename: 'file2.txt',
          mimetype: 'text/plain',
          size: 512
        }
      ];

      (fs.rename as any).mockResolvedValue(undefined);

      const results = await fileService.uploadMultipleFiles(mockFiles, 'user-123');

      expect(results).toHaveLength(2);
      expect(results[0].originalName).toBe('file1.pdf');
      expect(results[1].originalName).toBe('file2.txt');
      expect(results.every(r => !r.error)).toBe(true);
    });

    it('should continue processing other files when one fails', async () => {
      const mockFiles = [
        {
          filepath: '/tmp/upload_1',
          originalFilename: 'valid.pdf',
          mimetype: 'application/pdf',
          size: 1024
        },
        {
          filepath: '/tmp/upload_2',
          originalFilename: 'invalid.exe',
          mimetype: 'application/x-executable',
          size: 512
        }
      ];

      (fs.rename as any).mockResolvedValue(undefined);

      const results = await fileService.uploadMultipleFiles(mockFiles, 'user-123');

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
      expect(results[1].error).toContain('File type not supported');
    });
  });

  describe('Form Parsing', () => {
    it('should parse multipart form data', async () => {
      const mockIncomingForm = {
        parse: vi.fn().mockImplementation((req, callback) => {
          const fields = { description: 'Test file' };
          const files = {
            upload: {
              filepath: '/tmp/upload_123',
              originalFilename: 'test.pdf',
              mimetype: 'application/pdf',
              size: 1024
            }
          };
          callback(null, fields, files);
        })
      };

      const { IncomingForm } = await import('formidable');
      (IncomingForm as any).mockReturnValue(mockIncomingForm);

      const mockReq = {
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' }
      } as any;

      const result = await fileService.parseForm(mockReq);

      expect(result.fields).toHaveProperty('description');
      expect(result.files).toHaveProperty('upload');
      expect(mockIncomingForm.parse).toHaveBeenCalledWith(mockReq, expect.any(Function));
    });

    it('should handle form parsing errors', async () => {
      const mockIncomingForm = {
        parse: vi.fn().mockImplementation((req, callback) => {
          callback(new Error('Invalid form data'), null, null);
        })
      };

      const { IncomingForm } = await import('formidable');
      (IncomingForm as any).mockReturnValue(mockIncomingForm);

      const mockReq = {} as any;

      await expect(fileService.parseForm(mockReq))
        .rejects.toThrow('Failed to parse form data');
    });
  });

  describe('File Processing', () => {
    it('should process file successfully', async () => {
      const fileId = 'test-file-id';
      
      // Mock file metadata
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });
      (fs.readFile as any).mockResolvedValue(Buffer.from('pdf content'));

      // Mock file processor
      const { fileProcessor } = await import('@deepwebai/file-processing');
      (fileProcessor.processFile as any).mockResolvedValue({
        content: {
          text: 'Extracted text',
          metadata: { pages: 1 }
        }
      });

      const options = {
        extractImages: false,
        ocrEnabled: true,
        language: 'eng'
      };

      const jobId = await fileService.processFile(fileId, options);

      expect(jobId).toBeTypeOf('string');
      expect(fileProcessor.processFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(String),
        fileId,
        options
      );
    });

    it('should handle file not found error', async () => {
      const fileId = 'non-existent-file';
      
      (fs.readdir as any).mockResolvedValue([]);

      await expect(fileService.processFile(fileId))
        .rejects.toThrow('File not found: non-existent-file');
    });

    it('should prevent duplicate processing', async () => {
      const fileId = 'test-file-id';
      
      // Mock file exists
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });

      // Start first processing
      const jobId1 = await fileService.processFile(fileId);
      
      // Try to start second processing
      await expect(fileService.processFile(fileId))
        .rejects.toThrow('File is already being processed');
    });

    it('should get processing status', async () => {
      const fileId = 'test-file-id';
      
      // Mock file exists and start processing
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });

      await fileService.processFile(fileId);
      
      const status = await fileService.getProcessingStatus(fileId);
      
      expect(status).not.toBeNull();
      expect(status!.fileId).toBe(fileId);
      expect(status!.status).toBe('processing');
      expect(status!.progress).toBeGreaterThanOrEqual(0);
    });

    it('should return null for non-existent processing status', async () => {
      const status = await fileService.getProcessingStatus('non-existent');
      expect(status).toBeNull();
    });
  });

  describe('File Download', () => {
    it('should download file successfully', async () => {
      const fileId = 'test-file-id';
      const fileContent = Buffer.from('file content');
      
      // Mock file exists
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });
      (fs.readFile as any).mockResolvedValue(fileContent);

      const result = await fileService.downloadFile(fileId);

      expect(result).not.toBeNull();
      expect(result!.buffer).toEqual(fileContent);
      expect(result!.metadata.id).toBe(fileId);
    });

    it('should return null for non-existent file', async () => {
      (fs.readdir as any).mockResolvedValue([]);

      const result = await fileService.downloadFile('non-existent');
      expect(result).toBeNull();
    });

    it('should handle file read errors', async () => {
      const fileId = 'test-file-id';
      
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });
      (fs.readFile as any).mockRejectedValue(new Error('Permission denied'));

      await expect(fileService.downloadFile(fileId))
        .rejects.toThrow('Failed to download file');
    });
  });

  describe('File Deletion', () => {
    it('should delete file successfully', async () => {
      const fileId = 'test-file-id';
      
      // Mock file exists
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });
      (fs.unlink as any).mockResolvedValue(undefined);

      const result = await fileService.deleteFile(fileId);

      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should return false for non-existent file', async () => {
      (fs.readdir as any).mockResolvedValue([]);

      const result = await fileService.deleteFile('non-existent');
      expect(result).toBe(false);
    });

    it('should handle deletion errors gracefully', async () => {
      const fileId = 'test-file-id';
      
      (fs.readdir as any).mockResolvedValue([`${fileId}.pdf`]);
      (fs.stat as any).mockResolvedValue({
        size: 1024,
        birthtime: new Date()
      });
      (fs.unlink as any).mockRejectedValue(new Error('Permission denied'));

      const result = await fileService.deleteFile(fileId);
      expect(result).toBe(false);
    });
  });

  describe('Upload Statistics', () => {
    it('should calculate upload statistics', async () => {
      const mockFiles = ['file1.pdf', 'file2.txt', 'file3.jpg'];
      const mockStats = [
        { size: 1024 },
        { size: 512 },
        { size: 2048 }
      ];

      (fs.readdir as any).mockResolvedValue(mockFiles);
      (fs.stat as any)
        .mockResolvedValueOnce(mockStats[0])
        .mockResolvedValueOnce(mockStats[1])
        .mockResolvedValueOnce(mockStats[2]);

      const stats = await fileService.getUploadStats();

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(3584); // 1024 + 512 + 2048
      expect(stats.averageSize).toBe(1194.67); // 3584 / 3 (rounded)
      expect(stats.fileTypes).toEqual({
        '.pdf': 1,
        '.txt': 1,
        '.jpg': 1
      });
    });

    it('should handle empty upload directory', async () => {
      (fs.readdir as any).mockResolvedValue([]);

      const stats = await fileService.getUploadStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(stats.fileTypes).toEqual({});
    });

    it('should handle statistics calculation errors', async () => {
      (fs.readdir as any).mockRejectedValue(new Error('Directory access denied'));

      await expect(fileService.getUploadStats())
        .rejects.toThrow('Failed to get upload statistics');
    });
  });

  describe('Formidable Configuration', () => {
    it('should configure Formidable with proper settings', async () => {
      const { IncomingForm } = await import('formidable');
      
      // Create a new service to trigger constructor
      new FormidableFileService();

      expect(IncomingForm).toHaveBeenCalledWith(
        expect.objectContaining({
          keepExtensions: true,
          allowEmptyFiles: false,
          minFileSize: 1,
          filter: expect.any(Function)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should create proper service errors', async () => {
      const mockFile = {
        filepath: '/tmp/upload_123',
        originalFilename: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024
      };

      const uploadData = { file: mockFile, fields: {} };
      
      (fs.rename as any).mockRejectedValue(new Error('Disk full'));

      try {
        await fileService.uploadFile(uploadData);
      } catch (error: any) {
        expect(error.code).toBe('UPLOAD_ERROR');
        expect(error.message).toBe('Failed to upload file');
        expect(error.details).toHaveProperty('originalMessage');
      }
    });
  });
});
