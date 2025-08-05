// Simple test file to verify the file processing setup
import { fileProcessor } from './file-processor.js';
import { textCleaner } from './document/text_cleaner.js';
import { ocrProcessor } from './ocr/ocr_processor.js';

export async function testFileProcessing() {
  // Test text cleaner
  const testText = "  This   is  a    test  text  with    extra   spaces.  \n\n\n\n  Another line.  ";
  const cleanedText = textCleaner.clean(testText);
  
  // Test OCR processor initialization
  try {
    await ocrProcessor.initialize('eng');
  } catch (error) {
    // Expected in test environment
  }
  
  // Test file processor validation
  const testBuffer = Buffer.from('test content');
  const validation = fileProcessor.validateFile(testBuffer, 'test.txt');
  
  return {
    textCleaningPassed: cleanedText.length < testText.length,
    fileValidationPassed: validation.isValid
  };
}

// Export for testing purposes
export { fileProcessor, textCleaner, ocrProcessor };
