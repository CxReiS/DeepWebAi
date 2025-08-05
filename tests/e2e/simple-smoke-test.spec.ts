import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Skip database operations for this smoke test
    await page.goto('https://example.com');
    
    // Very basic check
    await expect(page).toHaveTitle(/Example Domain/);
    
    console.log('✅ Basic Playwright test working');
  });

  test('should handle JavaScript execution', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Test JavaScript execution
    const result = await page.evaluate(() => {
      return 2 + 2;
    });
    
    expect(result).toBe(4);
    console.log('✅ JavaScript execution test working');
  });

  test('should take a screenshot', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Take screenshot to verify visual testing works
    await page.screenshot({ path: 'tests/e2e/reports/smoke-test.png' });
    
    console.log('✅ Screenshot functionality working');
  });
});
