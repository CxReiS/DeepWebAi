import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { OCRResult, OCRBlock, FileProcessingOptions, FileProcessingError } from '@deepwebai/shared-types';

export interface OCRProcessingOptions extends FileProcessingOptions {
  language?: string;
  confidence?: number;
  preprocessImage?: boolean;
  pageSegmentationMode?: number;
  ocrEngineMode?: number;
}

// Re-export OCRResult for convenience
export type { OCRResult } from '@deepwebai/shared-types';

export class OCRProcessor {
  private worker?: Tesseract.Worker;

  /**
   * Initialize Tesseract worker
   */
  async initialize(language: string = 'eng'): Promise<void> {
    try {
      if (!this.worker) {
        this.worker = await Tesseract.createWorker(language, 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              // Log progress if needed
            }
          }
        });
      }
    } catch (error) {
      throw this.createProcessingError('OCR_INIT_ERROR', 'Failed to initialize OCR worker', error);
    }
  }

  /**
   * Process image buffer with OCR
   */
  async processImage(buffer: Buffer, options: OCRProcessingOptions = {}): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      await this.initialize(options.language || 'eng');
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      // Preprocess image if requested
      let processedBuffer = buffer;
      if (options.preprocessImage !== false) {
        processedBuffer = await this.preprocessImage(buffer);
      }

      // Set OCR parameters
      if (options.pageSegmentationMode !== undefined) {
        await this.worker.setParameters({
          tessedit_pageseg_mode: String(options.pageSegmentationMode)
        } as any);
      }

      if (options.ocrEngineMode !== undefined) {
        await this.worker.setParameters({
          tessedit_ocr_engine_mode: String(options.ocrEngineMode)
        } as any);
      }

      // Perform OCR
      const { data } = await this.worker.recognize(processedBuffer);
      
      const processingTime = Date.now() - startTime;

      // Filter results by confidence if specified
      const minConfidence = options.confidence || 0;
      const filteredBlocks: OCRBlock[] = (data.blocks || [])
        .filter(block => block.confidence >= minConfidence)
        .map(block => ({
          text: block.text,
          confidence: block.confidence,
          bbox: {
            x0: block.bbox.x0,
            y0: block.bbox.y0,
            x1: block.bbox.x1,
            y1: block.bbox.y1
          }
        }));

      return {
        text: data.text,
        confidence: data.confidence,
        blocks: filteredBlocks,
        processingTime
      };
    } catch (error) {
      throw this.createProcessingError('OCR_PROCESSING_ERROR', 'Failed to process image with OCR', error);
    }
  }

  /**
   * Process multiple images
   */
  async processImages(buffers: Buffer[], options: OCRProcessingOptions = {}): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const buffer of buffers) {
      try {
        const result = await this.processImage(buffer, options);
        results.push(result);
      } catch (error) {
        // Continue processing other images even if one fails
        console.error('Failed to process image:', error);
        results.push({
          text: '',
          confidence: 0,
          blocks: [],
          processingTime: 0
        });
      }
    }

    return results;
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        // Convert to grayscale
        .grayscale()
        // Enhance contrast
        .normalize()
        // Increase sharpness
        .sharpen()
        // Resize if image is too small (minimum 300px width)
        .resize({
          width: 300,
          withoutEnlargement: true
        })
        // Convert to PNG for better OCR results
        .png()
        .toBuffer();
    } catch (error) {
      // If preprocessing fails, return original buffer
      console.error('Image preprocessing failed:', error);
      return buffer;
    }
  }

  /**
   * Validate image file
   */
  async validateImage(buffer: Buffer): Promise<{ isValid: boolean; error?: string; format?: string }> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.format) {
        return { isValid: false, error: 'Unknown image format' };
      }

      const supportedFormats = ['jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
      if (!supportedFormats.includes(metadata.format)) {
        return { 
          isValid: false, 
          error: `Unsupported image format: ${metadata.format}`,
          format: metadata.format 
        };
      }

      if (!metadata.width || !metadata.height) {
        return { isValid: false, error: 'Invalid image dimensions' };
      }

      // Check minimum dimensions
      if (metadata.width < 50 || metadata.height < 50) {
        return { isValid: false, error: 'Image too small (minimum 50x50 pixels)' };
      }

      return { isValid: true, format: metadata.format };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate image file' };
    }
  }

  /**
   * Extract text regions from OCR result
   */
  extractTextRegions(ocrResult: OCRResult, minConfidence: number = 60): OCRBlock[] {
    return ocrResult.blocks
      .filter(block => block.confidence >= minConfidence && block.text.trim().length > 0)
      .sort((a, b) => {
        // Sort by Y position first (top to bottom), then X position (left to right)
        if (Math.abs(a.bbox.y0 - b.bbox.y0) < 10) {
          return a.bbox.x0 - b.bbox.x0;
        }
        return a.bbox.y0 - b.bbox.y0;
      });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = undefined;
      }
    } catch (error) {
      console.error('Failed to cleanup OCR worker:', error);
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      'eng', 'ara', 'chi_sim', 'chi_tra', 'deu', 'fra', 'ita', 'jpn',
      'kor', 'por', 'rus', 'spa', 'tur', 'nld', 'pol', 'swe'
    ];
  }

  /**
   * Create standardized processing error
   */
  private createProcessingError(code: string, message: string, originalError?: any): FileProcessingError {
    return {
      code,
      message,
      details: originalError ? {
        originalMessage: originalError.message,
        stack: originalError.stack
      } : undefined
    };
  }
}

export const ocrProcessor = new OCRProcessor();

// Cleanup on process exit
process.on('exit', () => {
  ocrProcessor.cleanup().catch(console.error);
});

process.on('SIGINT', async () => {
  await ocrProcessor.cleanup();
  process.exit();
});

process.on('SIGTERM', async () => {
  await ocrProcessor.cleanup();
  process.exit();
});
