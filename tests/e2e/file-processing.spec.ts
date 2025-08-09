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

import { test, expect, type Page } from '@playwright/test';
import { sql } from './test-db-client.js';
import path from 'path';
import fs from 'fs';

// Test data
const testUser = {
  email: 'filetest@test.com',
  username: 'filetest',
  password: 'TestPassword123!',
  displayName: 'File Test User'
};

// Test file paths (we'll create these in beforeEach)
const testFiles = {
  pdf: path.join(__dirname, '../fixtures/test-document.pdf'),
  image: path.join(__dirname, '../fixtures/test-image.png'),
  text: path.join(__dirname, '../fixtures/test-document.txt'),
  invalidFile: path.join(__dirname, '../fixtures/invalid-file.xyz')
};

test.describe('File Processing E2E', () => {
  let page: Page;
  let authToken: string;

  test.beforeEach(async ({ browser }) => {
    // Create test fixtures directory
    const fixturesDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // Create test files
    fs.writeFileSync(testFiles.text, 'This is a test document for file processing.');
    
    // Create minimal PDF (mock)
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF Document) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n299\n%%EOF');
    fs.writeFileSync(testFiles.pdf, pdfContent);

    // Create minimal PNG (1x1 pixel)
    const pngContent = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x6D, 0xF0, 0xA2, 0x5C, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(testFiles.image, pngContent);

    // Create invalid file
    fs.writeFileSync(testFiles.invalidFile, 'This is not a valid file format');

    // Clean up test data
    await sql`DELETE FROM file_processing_jobs WHERE 1=1`;
    await sql`DELETE FROM file_metadata WHERE 1=1`;
    await sql`DELETE FROM uploaded_files WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%filetest%'`;

    page = await browser.newPage();

    // Register and login test user
    const registerResponse = await page.request.post('/api/auth/register', {
      data: testUser
    });
    const registerData = await registerResponse.json();
    authToken = registerData.token;

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test.afterEach(async () => {
    await page.close();
    
    // Clean up test files
    Object.values(testFiles).forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Clean up test data
    await sql`DELETE FROM file_processing_jobs WHERE 1=1`;
    await sql`DELETE FROM file_metadata WHERE 1=1`;
    await sql`DELETE FROM uploaded_files WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%filetest%'`;
  });

  test('should upload and process text files', async () => {
    await page.goto('/files/upload');

    // Upload text file
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.text);

    // Should show file in upload queue
    await expect(page.locator('[data-testid="upload-queue-item"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-name"]')).toContainText('test-document.txt');
    await expect(page.locator('[data-testid="file-type"]')).toContainText('text/plain');

    // Start upload
    await page.click('[data-testid="start-upload-button"]');

    // Should show upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Wait for upload completion
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Navigate to files list
    await page.goto('/files');

    // Should show uploaded file
    await expect(page.locator('[data-testid="file-list-item"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-name"]')).toContainText('test-document.txt');
    await expect(page.locator('[data-testid="file-status"]')).toContainText('Processed');

    // Click to view file details
    await page.click('[data-testid="file-list-item"]');

    // Should show file metadata
    await expect(page.locator('[data-testid="file-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-content-preview"]')).toContainText('This is a test document');
  });

  test('should upload and process PDF files with OCR', async () => {
    await page.goto('/files/upload');

    // Upload PDF file
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.pdf);

    // Should show file in queue
    await expect(page.locator('[data-testid="file-name"]')).toContainText('test-document.pdf');
    await expect(page.locator('[data-testid="file-type"]')).toContainText('application/pdf');

    // Enable OCR processing
    await page.check('[data-testid="enable-ocr-checkbox"]');

    // Start upload
    await page.click('[data-testid="start-upload-button"]');

    // Wait for upload and processing
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 30000 });

    // Navigate to files list
    await page.goto('/files');

    // Should show processed PDF
    await expect(page.locator('[data-testid="file-list-item"]')).toBeVisible();
    await page.click('[data-testid="file-list-item"]');

    // Should show OCR results
    await expect(page.locator('[data-testid="ocr-text"]')).toBeVisible();
    await expect(page.locator('[data-testid="ocr-confidence"]')).toBeVisible();
  });

  test('should upload and process image files', async () => {
    await page.goto('/files/upload');

    // Upload image file
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.image);

    // Should show image preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-type"]')).toContainText('image/png');

    // Start upload
    await page.click('[data-testid="start-upload-button"]');

    // Wait for processing
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 15000 });

    // Navigate to files list
    await page.goto('/files');

    // View file details
    await page.click('[data-testid="file-list-item"]');

    // Should show image metadata
    await expect(page.locator('[data-testid="image-dimensions"]')).toContainText('1x1');
    await expect(page.locator('[data-testid="image-format"]')).toContainText('PNG');
    await expect(page.locator('[data-testid="image-preview-large"]')).toBeVisible();
  });

  test('should handle multiple file uploads', async () => {
    await page.goto('/files/upload');

    // Upload multiple files
    await page.setInputFiles('[data-testid="file-upload-input"]', [
      testFiles.text,
      testFiles.pdf,
      testFiles.image
    ]);

    // Should show all files in queue
    await expect(page.locator('[data-testid="upload-queue-item"]')).toHaveCount(3);

    // Start batch upload
    await page.click('[data-testid="start-batch-upload-button"]');

    // Should show batch progress
    await expect(page.locator('[data-testid="batch-upload-progress"]')).toBeVisible();

    // Wait for all uploads to complete
    await expect(page.locator('[data-testid="batch-upload-complete"]')).toBeVisible({ timeout: 30000 });

    // Check results
    await page.goto('/files');
    await expect(page.locator('[data-testid="file-list-item"]')).toHaveCount(3);
  });

  test('should handle file validation and errors', async () => {
    await page.goto('/files/upload');

    // Try to upload invalid file type
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.invalidFile);

    // Should show validation error
    await expect(page.locator('[data-testid="file-validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-validation-error"]')).toContainText('Unsupported file type');

    // Upload button should be disabled
    await expect(page.locator('[data-testid="start-upload-button"]')).toBeDisabled();

    // Test file size limit (mock large file)
    await page.evaluate(() => {
      const mockLargeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large-file.txt', {
        type: 'text/plain'
      });
      const input = document.querySelector('[data-testid="file-upload-input"]') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockLargeFile);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should show size error
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File too large');
  });

  test('should track file processing jobs', async () => {
    await page.goto('/files/upload');

    // Upload file
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.pdf);
    await page.check('[data-testid="enable-ocr-checkbox"]');
    await page.click('[data-testid="start-upload-button"]');

    // Navigate to processing jobs
    await page.goto('/files/jobs');

    // Should show processing job
    await expect(page.locator('[data-testid="processing-job"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-status"]')).toContainText('Processing');
    await expect(page.locator('[data-testid="job-type"]')).toContainText('OCR');

    // Wait for completion
    await expect(page.locator('[data-testid="job-status"]')).toContainText('Completed', { timeout: 30000 });

    // Click to view job details
    await page.click('[data-testid="processing-job"]');

    // Should show job timeline
    await expect(page.locator('[data-testid="job-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-logs"]')).toBeVisible();
  });

  test('should handle file metadata extraction', async () => {
    await page.goto('/files/upload');

    // Upload PDF file
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.pdf);
    await page.click('[data-testid="start-upload-button"]');

    // Wait for processing
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 15000 });

    // Navigate to file details
    await page.goto('/files');
    await page.click('[data-testid="file-list-item"]');

    // Should show extracted metadata
    await expect(page.locator('[data-testid="file-metadata-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-file-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-created-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="metadata-mime-type"]')).toContainText('application/pdf');

    // Should show PDF-specific metadata
    await expect(page.locator('[data-testid="pdf-page-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="pdf-version"]')).toBeVisible();
  });

  test('should support file search and filtering', async () => {
    // Upload test files
    await page.goto('/files/upload');
    await page.setInputFiles('[data-testid="file-upload-input"]', [
      testFiles.text,
      testFiles.pdf,
      testFiles.image
    ]);
    await page.click('[data-testid="start-batch-upload-button"]');
    await expect(page.locator('[data-testid="batch-upload-complete"]')).toBeVisible({ timeout: 30000 });

    // Navigate to files list
    await page.goto('/files');

    // Test search
    await page.fill('[data-testid="file-search-input"]', 'document');
    await page.press('[data-testid="file-search-input"]', 'Enter');

    // Should filter results
    await expect(page.locator('[data-testid="file-list-item"]')).toHaveCount(2); // text and pdf

    // Test filter by type
    await page.selectOption('[data-testid="file-type-filter"]', 'image');

    // Should show only image
    await expect(page.locator('[data-testid="file-list-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="file-name"]')).toContainText('test-image.png');

    // Test date range filter
    await page.click('[data-testid="date-filter-button"]');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.click('[data-testid="apply-date-filter-button"]');

    // Should maintain image filter with date range
    await expect(page.locator('[data-testid="file-list-item"]')).toHaveCount(1);
  });

  test('should handle file downloads', async () => {
    // Upload file
    await page.goto('/files/upload');
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.text);
    await page.click('[data-testid="start-upload-button"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Navigate to files list
    await page.goto('/files');
    await page.click('[data-testid="file-list-item"]');

    // Download original file
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-original-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('test-document.txt');

    // Download processed file (if available)
    if (await page.locator('[data-testid="download-processed-button"]').isVisible()) {
      const processedDownloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-processed-button"]');
      const processedDownload = await processedDownloadPromise;
      expect(processedDownload.suggestedFilename()).toMatch(/processed-.*\.txt/);
    }
  });

  test('should handle file sharing and permissions', async () => {
    // Upload file
    await page.goto('/files/upload');
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.text);
    await page.click('[data-testid="start-upload-button"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Navigate to file details
    await page.goto('/files');
    await page.click('[data-testid="file-list-item"]');

    // Open sharing panel
    await page.click('[data-testid="share-file-button"]');

    // Should show sharing options
    await expect(page.locator('[data-testid="sharing-panel"]')).toBeVisible();

    // Generate shareable link
    await page.click('[data-testid="generate-share-link-button"]');
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible();

    // Copy link
    await page.click('[data-testid="copy-share-link-button"]');
    await expect(page.locator('[data-testid="link-copied-message"]')).toBeVisible();

    // Set expiration
    await page.selectOption('[data-testid="link-expiration-select"]', '7-days');
    await page.click('[data-testid="update-share-settings-button"]');

    // Should update link settings
    await expect(page.locator('[data-testid="link-expires"]')).toContainText('7 days');
  });

  test('should handle storage quota and usage', async () => {
    await page.goto('/files/storage');

    // Should show storage usage
    await expect(page.locator('[data-testid="storage-usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="used-storage"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-storage"]')).toBeVisible();

    // Upload file to test quota
    await page.goto('/files/upload');
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.text);
    await page.click('[data-testid="start-upload-button"]');
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Check updated usage
    await page.goto('/files/storage');
    const usageAfter = await page.locator('[data-testid="used-storage"]').textContent();
    expect(usageAfter).not.toBe('0 B');

    // Test quota warning (mock near-limit scenario)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('storage-quota-warning', {
        detail: { usage: 95, limit: 100 }
      }));
    });

    await expect(page.locator('[data-testid="quota-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="quota-warning"]')).toContainText('95%');
  });

  test('should handle concurrent file processing', async () => {
    await page.goto('/files/upload');

    // Upload multiple files for concurrent processing
    await page.setInputFiles('[data-testid="file-upload-input"]', [
      testFiles.text,
      testFiles.pdf,
      testFiles.image
    ]);

    // Enable different processing options
    await page.check('[data-testid="enable-ocr-checkbox"]');
    await page.check('[data-testid="enable-thumbnails-checkbox"]');

    // Start batch upload
    await page.click('[data-testid="start-batch-upload-button"]');

    // Should show concurrent processing
    await expect(page.locator('[data-testid="concurrent-jobs-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-jobs-count"]')).toContainText('3');

    // Wait for all processing to complete
    await expect(page.locator('[data-testid="batch-upload-complete"]')).toBeVisible({ timeout: 45000 });

    // Verify all files processed successfully
    await page.goto('/files');
    await expect(page.locator('[data-testid="file-list-item"]')).toHaveCount(3);

    // Check each file status
    const fileItems = page.locator('[data-testid="file-list-item"]');
    for (let i = 0; i < 3; i++) {
      await expect(fileItems.nth(i).locator('[data-testid="file-status"]')).toContainText('Processed');
    }
  });

  test('should handle processing failures and retries', async () => {
    // Mock processing failure
    await page.route('/api/files/process/*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Processing failed' })
      });
    });

    await page.goto('/files/upload');
    await page.setInputFiles('[data-testid="file-upload-input"]', testFiles.text);
    await page.click('[data-testid="start-upload-button"]');

    // Should show processing error
    await expect(page.locator('[data-testid="processing-error"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Processing failed');

    // Should offer retry option
    await expect(page.locator('[data-testid="retry-processing-button"]')).toBeVisible();

    // Test retry (remove route mock first)
    await page.unroute('/api/files/process/*');
    await page.click('[data-testid="retry-processing-button"]');

    // Should succeed on retry
    await expect(page.locator('[data-testid="processing-complete"]')).toBeVisible({ timeout: 15000 });
  });
});
