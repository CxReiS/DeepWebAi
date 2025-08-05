import { test, expect, type Page } from '@playwright/test';
import { sql } from '../../packages/backend/lib/neon-client.js';

// Test data
const testUser = {
  email: 'e2etest@test.com',
  username: 'e2etest',
  password: 'TestPassword123!',
  displayName: 'E2E Test User'
};

test.describe('Complete Authentication Flow E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    // Clean up test data
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%e2etest%'`;

    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
    // Clean up test data
    await sql`DELETE FROM mfa_challenges WHERE 1=1`;
    await sql`DELETE FROM user_mfa_secrets WHERE 1=1`;
    await sql`DELETE FROM user_oauth_accounts WHERE 1=1`;
    await sql`DELETE FROM oauth_states WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%e2etest%'`;
  });

  test('should complete user registration flow', async () => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="username-input"]', testUser.username);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="display-name-input"]', testUser.displayName);

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText(testUser.displayName);
  });

  test('should complete login flow', async () => {
    // First register the user via API
    const response = await page.request.post('/api/auth/register', {
      data: testUser
    });
    expect(response.ok()).toBeTruthy();

    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle login validation errors', async () => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('[data-testid="login-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    // Fill invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'short');
    await page.click('[data-testid="login-button"]');

    // Should show specific validation errors
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
  });

  test('should handle incorrect login credentials', async () => {
    // Register user first
    await page.request.post('/api/auth/register', { data: testUser });

    await page.goto('/login');

    // Try with wrong password
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid email or password');

    // Try with non-existent email
    await page.fill('[data-testid="email-input"]', 'nonexistent@test.com');
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid email or password');
  });

  test('should complete MFA setup flow', async () => {
    // Register and login user
    await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Navigate to security settings
    await page.goto('/settings/security');

    // Start MFA setup
    await page.click('[data-testid="enable-mfa-button"]');

    // Should show TOTP setup
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-entry-key"]')).toBeVisible();

    // Get the secret key for testing
    const secretKey = await page.locator('[data-testid="manual-entry-key"]').textContent();
    expect(secretKey).toBeTruthy();

    // Simulate entering TOTP code (in real app, user would use authenticator app)
    // For testing, we'll use a mock valid code
    await page.fill('[data-testid="totp-verification-input"]', '123456');
    await page.click('[data-testid="verify-totp-button"]');

    // Mock successful verification - should show backup codes
    await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
    await expect(page.locator('[data-testid="backup-code"]')).toHaveCount(10);

    // Confirm setup
    await page.click('[data-testid="confirm-mfa-setup-button"]');

    // Should redirect back to security settings
    await expect(page).toHaveURL('/settings/security');
    await expect(page.locator('[data-testid="mfa-enabled-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="mfa-enabled-status"]')).toContainText('Enabled');
  });

  test('should complete MFA login flow', async () => {
    // Setup user with MFA via API
    const registerResponse = await page.request.post('/api/auth/register', { data: testUser });
    const registerData = await registerResponse.json();
    const userId = registerData.user.id;

    // Enable MFA via API
    await page.request.post('/api/auth/mfa/setup-totp', {
      headers: { 'Authorization': `Bearer ${registerData.token}` }
    });

    // Mock TOTP verification via API
    await page.request.post('/api/auth/mfa/verify-totp', {
      data: { token: '123456' },
      headers: { 'Authorization': `Bearer ${registerData.token}` }
    });

    // Now test MFA login flow
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should redirect to MFA verification page
    await expect(page).toHaveURL('/auth/mfa');

    // Should show MFA input form
    await expect(page.locator('[data-testid="mfa-token-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="mfa-backup-code-link"]')).toBeVisible();

    // Enter TOTP code
    await page.fill('[data-testid="mfa-token-input"]', '123456');
    await page.click('[data-testid="verify-mfa-button"]');

    // Should complete login and redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle MFA backup code login', async () => {
    // Setup user with MFA and get backup codes
    const registerResponse = await page.request.post('/api/auth/register', { data: testUser });
    const setupResponse = await page.request.post('/api/auth/mfa/setup-totp', {
      headers: { 'Authorization': `Bearer ${registerResponse.json().token}` }
    });
    const backupCodes = (await setupResponse.json()).backupCodes;

    // Login with password
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should show MFA page
    await expect(page).toHaveURL('/auth/mfa');

    // Click backup code option
    await page.click('[data-testid="mfa-backup-code-link"]');

    // Should show backup code input
    await expect(page.locator('[data-testid="backup-code-input"]')).toBeVisible();

    // Enter backup code
    await page.fill('[data-testid="backup-code-input"]', backupCodes[0]);
    await page.click('[data-testid="verify-backup-code-button"]');

    // Should complete login
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete OAuth login flow', async () => {
    // Mock OAuth provider response
    await page.route('/api/auth/oauth/github/callback*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'oauth-user-id',
            email: 'oauth@github.com',
            username: 'oauthuser',
            displayName: 'OAuth User'
          },
          token: 'mock-jwt-token',
          isNewUser: true
        })
      });
    });

    await page.goto('/login');

    // Click GitHub OAuth button
    await page.click('[data-testid="github-oauth-button"]');

    // Should redirect to GitHub (we'll mock this)
    // In real implementation, this would go to GitHub OAuth page
    // For testing, we'll simulate the callback
    await page.goto('/api/auth/oauth/github/callback?code=mock_code&state=mock_state');

    // Should complete OAuth flow and redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText('OAuth User');
  });

  test('should handle profile updates', async () => {
    // Register and login user
    const registerResponse = await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Navigate to profile settings
    await page.goto('/settings/profile');

    // Update profile information
    await page.fill('[data-testid="display-name-input"]', 'Updated Name');
    await page.fill('[data-testid="bio-input"]', 'This is my updated bio');

    // Save changes
    await page.click('[data-testid="save-profile-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated successfully');

    // Verify changes are reflected
    await expect(page.locator('[data-testid="display-name-input"]')).toHaveValue('Updated Name');
    await expect(page.locator('[data-testid="bio-input"]')).toHaveValue('This is my updated bio');

    // Verify in user menu
    await expect(page.locator('[data-testid="user-display-name"]')).toContainText('Updated Name');
  });

  test('should handle password change', async () => {
    // Register and login user
    await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Navigate to security settings
    await page.goto('/settings/security');

    // Change password
    await page.fill('[data-testid="current-password-input"]', testUser.password);
    await page.fill('[data-testid="new-password-input"]', 'NewPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');

    await page.click('[data-testid="change-password-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password changed successfully');

    // Should be logged out and redirected to login
    await expect(page).toHaveURL('/login');

    // Test login with new password
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', 'NewPassword123!');
    await page.click('[data-testid="login-button"]');

    // Should successfully login
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle logout', async () => {
    // Register and login user
    await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Verify logged in
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');

    // Should not be able to access protected pages
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should handle session expiration', async () => {
    // Register and login user
    await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Verify logged in
    await expect(page).toHaveURL('/dashboard');

    // Mock session expiration by clearing cookies/tokens
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Try to access protected page
    await page.reload();

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Should show session expired message
    await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
  });

  test('should handle account deletion', async () => {
    // Register and login user
    await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Navigate to account settings
    await page.goto('/settings/account');

    // Click delete account
    await page.click('[data-testid="delete-account-button"]');

    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();

    // Confirm password
    await page.fill('[data-testid="delete-password-input"]', testUser.password);
    await page.click('[data-testid="confirm-delete-button"]');

    // Should redirect to goodbye page or home
    await expect(page).toHaveURL(/\/(goodbye|\/)/);

    // Try to login with deleted account
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should show error
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid email or password');
  });

  test('should handle network errors gracefully', async () => {
    // Mock network errors
    await page.route('/api/auth/login', route => route.abort());

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should show network error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');

    // Should allow retry
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should maintain auth state across page refreshes', async () => {
    // Register and login user
    await page.request.post('/api/auth/register', { data: testUser });
    
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Verify logged in
    await expect(page).toHaveURL('/dashboard');

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Navigate to another page
    await page.goto('/settings');

    // Should still be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
