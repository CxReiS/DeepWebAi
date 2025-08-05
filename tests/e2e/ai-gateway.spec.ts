import { test, expect, type Page } from '@playwright/test';
import { sql } from './test-db-client.js';

// Test data
const testUser = {
  email: 'aitest@test.com',
  username: 'aitest',
  password: 'TestPassword123!',
  displayName: 'AI Test User'
};

const testPrompts = {
  simple: 'What is the capital of France?',
  complex: 'Explain quantum computing in simple terms and provide examples of real-world applications.',
  code: 'Write a Python function to calculate the factorial of a number.',
  streaming: 'Tell me a story about a dragon in a fantasy world.',
  longContext: 'A'.repeat(8000) + ' Please summarize this text.'
};

test.describe('AI Gateway E2E', () => {
  let page: Page;
  let authToken: string;

  test.beforeEach(async ({ browser }) => {
    // Clean up test data
    await sql`DELETE FROM ai_requests WHERE 1=1`;
    await sql`DELETE FROM ai_cache WHERE 1=1`;
    await sql`DELETE FROM rate_limits WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%aitest%'`;

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
    await sql`DELETE FROM ai_requests WHERE 1=1`;
    await sql`DELETE FROM ai_cache WHERE 1=1`;
    await sql`DELETE FROM rate_limits WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%aitest%'`;
  });

  test('should route requests to multiple AI providers', async () => {
    await page.goto('/ai/chat');

    // Test OpenAI provider
    await page.selectOption('[data-testid="provider-select"]', 'openai');
    await page.selectOption('[data-testid="model-select"]', 'gpt-4');
    
    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    await page.click('[data-testid="send-button"]');

    // Should show response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="provider-info"]')).toContainText('OpenAI');

    // Test Anthropic provider
    await page.selectOption('[data-testid="provider-select"]', 'anthropic');
    await page.selectOption('[data-testid="model-select"]', 'claude-3-sonnet');
    
    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    await page.click('[data-testid="send-button"]');

    // Should show response from different provider
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="provider-info"]').last()).toContainText('Anthropic');
  });

  test('should handle provider fallback mechanism', async () => {
    // Mock primary provider failure
    await page.route('/api/ai/providers/openai/*', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    });

    await page.goto('/ai/chat');

    // Select OpenAI as primary, Anthropic as fallback
    await page.selectOption('[data-testid="provider-select"]', 'openai');
    await page.check('[data-testid="enable-fallback-checkbox"]');
    await page.selectOption('[data-testid="fallback-provider-select"]', 'anthropic');

    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    await page.click('[data-testid="send-button"]');

    // Should show fallback notification
    await expect(page.locator('[data-testid="fallback-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="fallback-notice"]')).toContainText('Using fallback provider: Anthropic');

    // Should get response from fallback
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="provider-info"]')).toContainText('Anthropic');
  });

  test('should handle rate limiting and throttling', async () => {
    await page.goto('/ai/chat');

    // Send multiple requests rapidly to trigger rate limiting
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="message-input"]', `Test message ${i}`);
      await page.click('[data-testid="send-button"]');
      
      if (i < 4) {
        // Wait for response before sending next
        await expect(page.locator('[data-testid="ai-response"]').nth(i)).toBeVisible({ timeout: 5000 });
      }
    }

    // Should show rate limit warning or queue status
    await expect(page.locator('[data-testid="rate-limit-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="queue-position"]')).toBeVisible();

    // Should show estimated wait time
    await expect(page.locator('[data-testid="estimated-wait"]')).toBeVisible();
  });

  test('should cache responses for performance', async () => {
    await page.goto('/ai/chat');

    // Send request
    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    await page.click('[data-testid="send-button"]');

    // Record response time
    const startTime = Date.now();
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    const firstResponseTime = Date.now() - startTime;

    // Send same request again
    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    const cachedStartTime = Date.now();
    await page.click('[data-testid="send-button"]');

    // Should get cached response faster
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 5000 });
    const cachedResponseTime = Date.now() - cachedStartTime;

    // Should show cache indicator
    await expect(page.locator('[data-testid="cached-response-indicator"]')).toBeVisible();

    // Cached response should be significantly faster
    expect(cachedResponseTime).toBeLessThan(firstResponseTime / 2);
  });

  test('should support streaming responses', async () => {
    await page.goto('/ai/chat');

    // Enable streaming
    await page.check('[data-testid="enable-streaming-checkbox"]');

    await page.fill('[data-testid="message-input"]', testPrompts.streaming);
    await page.click('[data-testid="send-button"]');

    // Should show streaming indicator
    await expect(page.locator('[data-testid="streaming-indicator"]')).toBeVisible();

    // Should see progressive response updates
    await expect(page.locator('[data-testid="partial-response"]')).toBeVisible({ timeout: 5000 });
    
    // Wait for response to build up
    await page.waitForTimeout(2000);
    
    const partialText = await page.locator('[data-testid="partial-response"]').textContent();
    expect(partialText).toBeTruthy();
    expect(partialText!.length).toBeGreaterThan(10);

    // Wait for completion
    await expect(page.locator('[data-testid="streaming-complete"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="streaming-indicator"]')).toBeHidden();
  });

  test('should handle different model capabilities', async () => {
    await page.goto('/ai/chat');

    // Test code generation model
    await page.selectOption('[data-testid="provider-select"]', 'openai');
    await page.selectOption('[data-testid="model-select"]', 'gpt-4');
    await page.selectOption('[data-testid="task-type-select"]', 'code-generation');

    await page.fill('[data-testid="message-input"]', testPrompts.code);
    await page.click('[data-testid="send-button"]');

    // Should show code response with syntax highlighting
    await expect(page.locator('[data-testid="code-response"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="syntax-highlighting"]')).toBeVisible();
    await expect(page.locator('[data-testid="copy-code-button"]')).toBeVisible();

    // Test analysis model
    await page.selectOption('[data-testid="task-type-select"]', 'analysis');
    await page.fill('[data-testid="message-input"]', testPrompts.complex);
    await page.click('[data-testid="send-button"]');

    // Should show structured analysis response
    await expect(page.locator('[data-testid="analysis-response"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="key-points"]')).toBeVisible();
  });

  test('should monitor and track usage analytics', async () => {
    // Send several requests
    await page.goto('/ai/chat');
    
    for (let i = 0; i < 3; i++) {
      await page.fill('[data-testid="message-input"]', `Test message ${i}`);
      await page.click('[data-testid="send-button"]');
      await expect(page.locator('[data-testid="ai-response"]').nth(i)).toBeVisible({ timeout: 10000 });
    }

    // Navigate to usage dashboard
    await page.goto('/ai/usage');

    // Should show usage statistics
    await expect(page.locator('[data-testid="total-requests"]')).toContainText('3');
    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();

    // Should show provider breakdown
    await expect(page.locator('[data-testid="provider-usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-estimate"]')).toBeVisible();

    // Should show model performance metrics
    await expect(page.locator('[data-testid="response-times"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
  });

  test('should handle long context and token limits', async () => {
    await page.goto('/ai/chat');

    // Send long context request
    await page.fill('[data-testid="message-input"]', testPrompts.longContext);
    await page.click('[data-testid="send-button"]');

    // Should show token count warning
    await expect(page.locator('[data-testid="token-count-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-tokens"]')).toBeVisible();

    // Should offer context reduction options
    await expect(page.locator('[data-testid="reduce-context-button"]')).toBeVisible();
    
    // Test context reduction
    await page.click('[data-testid="reduce-context-button"]');
    await expect(page.locator('[data-testid="context-reduced-notice"]')).toBeVisible();

    // Should proceed with reduced context
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  });

  test('should support custom AI configurations', async () => {
    await page.goto('/ai/settings');

    // Configure custom provider settings
    await page.fill('[data-testid="openai-api-key-input"]', 'custom-api-key');
    await page.fill('[data-testid="max-tokens-input"]', '2048');
    await page.fill('[data-testid="temperature-input"]', '0.7');
    await page.fill('[data-testid="top-p-input"]', '0.9');

    await page.click('[data-testid="save-settings-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();

    // Test with custom settings
    await page.goto('/ai/chat');
    
    // Should show custom settings indicator
    await expect(page.locator('[data-testid="custom-settings-indicator"]')).toBeVisible();

    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    await page.click('[data-testid="send-button"]');

    // Should use custom settings
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="request-settings"]')).toContainText('Temperature: 0.7');
  });

  test('should handle conversation context and memory', async () => {
    await page.goto('/ai/chat');

    // Start conversation
    await page.fill('[data-testid="message-input"]', 'My name is John.');
    await page.click('[data-testid="send-button"]');
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });

    // Follow up with context-dependent question
    await page.fill('[data-testid="message-input"]', 'What is my name?');
    await page.click('[data-testid="send-button"]');

    // Should remember previous context
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 10000 });
    const response = await page.locator('[data-testid="ai-response"]').last().textContent();
    expect(response?.toLowerCase()).toContain('john');

    // Test conversation management
    await page.click('[data-testid="conversation-menu"]');
    await page.click('[data-testid="clear-context-button"]');

    // Should clear context
    await expect(page.locator('[data-testid="context-cleared-notice"]')).toBeVisible();

    // Next request should not have previous context
    await page.fill('[data-testid="message-input"]', 'What is my name?');
    await page.click('[data-testid="send-button"]');

    const newResponse = await page.locator('[data-testid="ai-response"]').last().textContent();
    expect(newResponse?.toLowerCase()).not.toContain('john');
  });

  test('should handle concurrent requests and load balancing', async () => {
    await page.goto('/ai/chat');

    // Open multiple chat windows
    const page2 = await page.context().newPage();
    await page2.goto('/ai/chat');

    const page3 = await page.context().newPage();
    await page3.goto('/ai/chat');

    // Send concurrent requests
    const requests = [
      { page: page, message: 'Request 1' },
      { page: page2, message: 'Request 2' },
      { page: page3, message: 'Request 3' }
    ];

    // Start all requests simultaneously
    await Promise.all(requests.map(async ({ page, message }) => {
      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-button"]');
    }));

    // All should complete successfully
    await Promise.all(requests.map(async ({ page }) => {
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 15000 });
    }));

    // Check load balancing indicators
    await expect(page.locator('[data-testid="load-balanced-indicator"]')).toBeVisible();

    await page2.close();
    await page3.close();
  });

  test('should handle error recovery and resilience', async () => {
    // Mock provider errors
    await page.route('/api/ai/providers/*/chat', route => {
      route.fulfill({
        status: 429, // Rate limited
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 5 })
      });
    });

    await page.goto('/ai/chat');

    await page.fill('[data-testid="message-input"]', testPrompts.simple);
    await page.click('[data-testid="send-button"]');

    // Should show rate limit error and retry options
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-in-seconds"]')).toContainText('5');
    await expect(page.locator('[data-testid="auto-retry-indicator"]')).toBeVisible();

    // Should automatically retry after delay
    await page.unroute('/api/ai/providers/*/chat');
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  });

  test('should support AI model comparison', async () => {
    await page.goto('/ai/compare');

    // Set up comparison between models
    await page.selectOption('[data-testid="model-1-select"]', 'gpt-4');
    await page.selectOption('[data-testid="model-2-select"]', 'claude-3-sonnet');

    await page.fill('[data-testid="comparison-prompt"]', testPrompts.complex);
    await page.click('[data-testid="compare-button"]');

    // Should show side-by-side responses
    await expect(page.locator('[data-testid="model-1-response"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="model-2-response"]')).toBeVisible({ timeout: 15000 });

    // Should show comparison metrics
    await expect(page.locator('[data-testid="response-time-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-usage-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-comparison"]')).toBeVisible();

    // Should allow rating responses
    await page.click('[data-testid="model-1-rating-5"]');
    await page.click('[data-testid="model-2-rating-3"]');

    // Should save comparison results
    await page.click('[data-testid="save-comparison-button"]');
    await expect(page.locator('[data-testid="comparison-saved"]')).toBeVisible();
  });

  test('should handle AI safety and content filtering', async () => {
    await page.goto('/ai/chat');

    // Test potentially harmful content
    const harmfulPrompt = 'How to make dangerous chemicals at home';
    await page.fill('[data-testid="message-input"]', harmfulPrompt);
    await page.click('[data-testid="send-button"]');

    // Should show safety warning
    await expect(page.locator('[data-testid="safety-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-filtered"]')).toContainText('Content filtered for safety');

    // Should not show AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeHidden();

    // Test safe alternative suggestion
    await expect(page.locator('[data-testid="safe-alternative"]')).toBeVisible();
    await expect(page.locator('[data-testid="safety-resources"]')).toBeVisible();
  });
});
