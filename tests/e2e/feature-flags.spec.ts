import { test, expect, type Page } from '@playwright/test';
import { sql } from './test-db-client.js';

// Test data
const testUser = {
  email: 'flagtest@test.com',
  username: 'flagtest',
  password: 'TestPassword123!',
  displayName: 'Flag Test User'
};

const testFlag = {
  key: 'test-feature-flag',
  name: 'Test Feature Flag',
  description: 'A test feature flag for e2e testing',
  environment: 'development'
};

test.describe('Feature Flags E2E', () => {
  let page: Page;
  let authToken: string;

  test.beforeEach(async ({ browser }) => {
    // Clean up test data
    await sql`DELETE FROM feature_flag_events WHERE 1=1`;
    await sql`DELETE FROM feature_flag_targets WHERE 1=1`;
    await sql`DELETE FROM feature_flags WHERE flag_key LIKE '%test%'`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%flagtest%'`;

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
    // Clean up test data
    await sql`DELETE FROM feature_flag_events WHERE 1=1`;
    await sql`DELETE FROM feature_flag_targets WHERE 1=1`;
    await sql`DELETE FROM feature_flags WHERE flag_key LIKE '%test%'`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%flagtest%'`;
  });

  test('should create and manage feature flags', async () => {
    // Navigate to feature flags admin
    await page.goto('/admin/feature-flags');

    // Create new feature flag
    await page.click('[data-testid="create-flag-button"]');

    // Fill flag creation form
    await page.fill('[data-testid="flag-key-input"]', testFlag.key);
    await page.fill('[data-testid="flag-name-input"]', testFlag.name);
    await page.fill('[data-testid="flag-description-input"]', testFlag.description);
    await page.selectOption('[data-testid="environment-select"]', testFlag.environment);

    // Set initial value to false
    await page.click('[data-testid="initial-value-false"]');

    // Save flag
    await page.click('[data-testid="save-flag-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Feature flag created');

    // Should appear in flags list
    await expect(page.locator(`[data-testid="flag-${testFlag.key}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-name"]`)).toContainText(testFlag.name);
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-status"]`)).toContainText('Disabled');
  });

  test('should toggle feature flag values', async () => {
    // Create flag via API
    await page.request.post('/api/admin/feature-flags', {
      data: testFlag,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await page.goto('/admin/feature-flags');

    // Should show flag as disabled
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-status"]`)).toContainText('Disabled');

    // Toggle flag on
    await page.click(`[data-testid="flag-${testFlag.key}-toggle"]`);

    // Should show confirmation dialog
    await expect(page.locator('[data-testid="toggle-confirmation-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-toggle-button"]');

    // Should update status
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-status"]`)).toContainText('Enabled');

    // Toggle flag off
    await page.click(`[data-testid="flag-${testFlag.key}-toggle"]`);
    await page.click('[data-testid="confirm-toggle-button"]');

    // Should update status
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-status"]`)).toContainText('Disabled');
  });

  test('should handle user-specific flag targeting', async () => {
    // Create flag via API
    await page.request.post('/api/admin/feature-flags', {
      data: testFlag,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await page.goto('/admin/feature-flags');

    // Open flag details
    await page.click(`[data-testid="flag-${testFlag.key}-details"]`);

    // Navigate to targeting tab
    await page.click('[data-testid="targeting-tab"]');

    // Add user target
    await page.click('[data-testid="add-user-target-button"]');
    await page.fill('[data-testid="target-user-input"]', testUser.email);
    await page.click('[data-testid="target-value-true"]');
    await page.click('[data-testid="save-target-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Target added');

    // Should appear in targets list
    await expect(page.locator(`[data-testid="target-${testUser.email}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="target-${testUser.email}-value"]`)).toContainText('Enabled');
  });

  test('should receive real-time flag updates', async () => {
    // Create flag via API
    await page.request.post('/api/admin/feature-flags', {
      data: testFlag,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Open two tabs - admin and user dashboard
    const adminPage = page;
    const userPage = await page.context().newPage();

    await userPage.goto('/dashboard');

    // Check initial flag state in user dashboard
    const flagElement = userPage.locator(`[data-testid="feature-flag-${testFlag.key}"]`);
    await expect(flagElement).toHaveAttribute('data-enabled', 'false');

    // Toggle flag in admin
    await adminPage.goto('/admin/feature-flags');
    await adminPage.click(`[data-testid="flag-${testFlag.key}-toggle"]`);
    await adminPage.click('[data-testid="confirm-toggle-button"]');

    // Wait for real-time update in user dashboard
    await expect(flagElement).toHaveAttribute('data-enabled', 'true', { timeout: 5000 });

    await userPage.close();
  });

  test('should track analytics for flag usage', async () => {
    // Create flag via API
    await page.request.post('/api/admin/feature-flags', {
      data: { ...testFlag, enabled: true },
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Visit page that checks flag
    await page.goto('/dashboard');

    // Trigger flag check (this would normally happen in app logic)
    await page.evaluate(`
      window.gtag?.('event', 'feature_flag_check', {
        flag_key: '${testFlag.key}',
        flag_value: true,
        user_id: '${testUser.email}'
      });
    `);

    // Navigate to analytics
    await page.goto('/admin/feature-flags/analytics');

    // Check analytics data
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-analytics"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="flag-${testFlag.key}-checks"]`)).toContainText('1');
  });

  test('should handle flag rollout percentages', async () => {
    await page.goto('/admin/feature-flags');

    // Create percentage rollout flag
    await page.click('[data-testid="create-flag-button"]');
    await page.fill('[data-testid="flag-key-input"]', 'rollout-test');
    await page.fill('[data-testid="flag-name-input"]', 'Rollout Test');

    // Set rollout percentage
    await page.click('[data-testid="rollout-tab"]');
    await page.fill('[data-testid="rollout-percentage-input"]', '50');
    await page.click('[data-testid="save-flag-button"]');

    // Should show rollout configuration
    await expect(page.locator('[data-testid="flag-rollout-test-rollout"]')).toContainText('50%');

    // Test multiple users would get consistent results
    const checkResponses = [];
    for (let i = 0; i < 10; i++) {
      const response = await page.request.get(`/api/feature-flags/rollout-test/check?userId=user${i}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      checkResponses.push(data.enabled);
    }

    // Should have some enabled and some disabled (with 50% rollout)
    const enabledCount = checkResponses.filter(enabled => enabled).length;
    expect(enabledCount).toBeGreaterThan(0);
    expect(enabledCount).toBeLessThan(10);
  });

  test('should handle flag dependencies', async () => {
    // Create parent flag
    await page.request.post('/api/admin/feature-flags', {
      data: { ...testFlag, key: 'parent-flag', name: 'Parent Flag' },
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await page.goto('/admin/feature-flags');

    // Create dependent flag
    await page.click('[data-testid="create-flag-button"]');
    await page.fill('[data-testid="flag-key-input"]', 'dependent-flag');
    await page.fill('[data-testid="flag-name-input"]', 'Dependent Flag');

    // Set dependency
    await page.click('[data-testid="dependencies-tab"]');
    await page.selectOption('[data-testid="dependency-flag-select"]', 'parent-flag');
    await page.click('[data-testid="add-dependency-button"]');

    await page.click('[data-testid="save-flag-button"]');

    // Should show dependency relationship
    await expect(page.locator('[data-testid="flag-dependent-flag-dependencies"]')).toContainText('parent-flag');
  });

  test('should export and import flag configurations', async () => {
    // Create test flags
    await page.request.post('/api/admin/feature-flags', {
      data: testFlag,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await page.goto('/admin/feature-flags');

    // Export configuration
    await page.click('[data-testid="export-flags-button"]');

    // Should trigger download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/feature-flags-.*\.json/);

    // Test import (mock file upload)
    await page.click('[data-testid="import-flags-button"]');
    
    // Mock file content
    const mockFlagConfig = JSON.stringify([{
      key: 'imported-flag',
      name: 'Imported Flag',
      description: 'Imported from file',
      enabled: true
    }]);

    await page.setInputFiles('[data-testid="import-file-input"]', {
      name: 'flags.json',
      mimeType: 'application/json',
      buffer: Buffer.from(mockFlagConfig)
    });

    await page.click('[data-testid="confirm-import-button"]');

    // Should show imported flag
    await expect(page.locator('[data-testid="flag-imported-flag"]')).toBeVisible();
  });

  test('should handle flag evaluation errors gracefully', async () => {
    // Mock network error for flag evaluation
    await page.route('/api/feature-flags/*', route => route.abort());

    await page.goto('/dashboard');

    // Should show fallback behavior
    await expect(page.locator('[data-testid="flag-error-fallback"]')).toBeVisible();
    await expect(page.locator('[data-testid="flag-error-message"]')).toContainText('Unable to load feature flags');

    // Should allow retry
    await expect(page.locator('[data-testid="retry-flags-button"]')).toBeVisible();
  });

  test('should validate flag key uniqueness', async () => {
    // Create first flag
    await page.request.post('/api/admin/feature-flags', {
      data: testFlag,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await page.goto('/admin/feature-flags');

    // Try to create flag with same key
    await page.click('[data-testid="create-flag-button"]');
    await page.fill('[data-testid="flag-key-input"]', testFlag.key);
    await page.fill('[data-testid="flag-name-input"]', 'Duplicate Flag');
    await page.click('[data-testid="save-flag-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="flag-key-error"]')).toContainText('Flag key already exists');
    await expect(page.locator('[data-testid="save-flag-button"]')).toBeDisabled();
  });

  test('should handle flag history and audit trail', async () => {
    // Create flag
    await page.request.post('/api/admin/feature-flags', {
      data: testFlag,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    await page.goto('/admin/feature-flags');

    // Open flag details
    await page.click(`[data-testid="flag-${testFlag.key}-details"]`);

    // Navigate to history tab
    await page.click('[data-testid="history-tab"]');

    // Should show creation event
    await expect(page.locator('[data-testid="history-event-created"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-event-created"]')).toContainText('Flag created');
    await expect(page.locator('[data-testid="history-event-created"]')).toContainText(testUser.displayName);

    // Make a change
    await page.click('[data-testid="settings-tab"]');
    await page.fill('[data-testid="flag-description-input"]', 'Updated description');
    await page.click('[data-testid="save-flag-button"]');

    // Check history updated
    await page.click('[data-testid="history-tab"]');
    await expect(page.locator('[data-testid="history-event-updated"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-event-updated"]')).toContainText('Flag updated');
  });
});
