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

// Test data
const testUsers = {
  user1: {
    email: 'realtime1@test.com',
    username: 'realtime1',
    password: 'TestPassword123!',
    displayName: 'Realtime User 1'
  },
  user2: {
    email: 'realtime2@test.com',
    username: 'realtime2',
    password: 'TestPassword123!',
    displayName: 'Realtime User 2'
  }
};

const testMessages = {
  simple: 'Hello, this is a test message!',
  complex: 'This is a longer message with **markdown** formatting and _emphasis_.',
  emoji: 'Hello! 👋 How are you? 😊',
  code: '```javascript\nconsole.log("Hello World");\n```',
  mention: '@realtime2 Could you please review this document?'
};

test.describe('Real-time Features E2E', () => {
  let page1: Page;
  let page2: Page;
  let authToken1: string;
  let authToken2: string;

  test.beforeEach(async ({ browser }) => {
    // Clean up test data
    await sql`DELETE FROM chat_messages WHERE 1=1`;
    await sql`DELETE FROM chat_rooms WHERE 1=1`;
    await sql`DELETE FROM notifications WHERE 1=1`;
    await sql`DELETE FROM websocket_connections WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%realtime%'`;

    // Create two browser contexts for multi-user testing
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    page1 = await context1.newPage();
    page2 = await context2.newPage();

    // Register and login both users
    const registerResponse1 = await page1.request.post('/api/auth/register', {
      data: testUsers.user1
    });
    const registerData1 = await registerResponse1.json();
    authToken1 = registerData1.token;

    const registerResponse2 = await page2.request.post('/api/auth/register', {
      data: testUsers.user2
    });
    const registerData2 = await registerResponse2.json();
    authToken2 = registerData2.token;

    // Login user 1
    await page1.goto('/login');
    await page1.fill('[data-testid="email-input"]', testUsers.user1.email);
    await page1.fill('[data-testid="password-input"]', testUsers.user1.password);
    await page1.click('[data-testid="login-button"]');
    await expect(page1).toHaveURL('/dashboard');

    // Login user 2
    await page2.goto('/login');
    await page2.fill('[data-testid="email-input"]', testUsers.user2.email);
    await page2.fill('[data-testid="password-input"]', testUsers.user2.password);
    await page2.click('[data-testid="login-button"]');
    await expect(page2).toHaveURL('/dashboard');
  });

  test.afterEach(async () => {
    await page1.close();
    await page2.close();
    
    // Clean up test data
    await sql`DELETE FROM chat_messages WHERE 1=1`;
    await sql`DELETE FROM chat_rooms WHERE 1=1`;
    await sql`DELETE FROM notifications WHERE 1=1`;
    await sql`DELETE FROM websocket_connections WHERE 1=1`;
    await sql`DELETE FROM auth_sessions WHERE 1=1`;
    await sql`DELETE FROM users WHERE email LIKE '%realtime%'`;
  });

  test('should establish WebSocket connections', async () => {
    // Navigate to chat
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Should show connection status
    await expect(page1.locator('[data-testid="connection-status"]')).toContainText('Connected');
    await expect(page2.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // Should show online users
    await expect(page1.locator('[data-testid="online-users"]')).toBeVisible();
    await expect(page2.locator('[data-testid="online-users"]')).toBeVisible();

    // Should see each other online
    await expect(page1.locator('[data-testid="user-realtime2"]')).toBeVisible();
    await expect(page2.locator('[data-testid="user-realtime1"]')).toBeVisible();
  });

  test('should send and receive real-time chat messages', async () => {
    // Navigate to chat
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Wait for connection
    await expect(page1.locator('[data-testid="connection-status"]')).toContainText('Connected');
    await expect(page2.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // User 1 sends message
    await page1.fill('[data-testid="message-input"]', testMessages.simple);
    await page1.click('[data-testid="send-button"]');

    // Should appear in user 1's chat
    await expect(page1.locator('[data-testid="message-item"]')).toBeVisible();
    await expect(page1.locator('[data-testid="message-content"]')).toContainText(testMessages.simple);
    await expect(page1.locator('[data-testid="message-sender"]')).toContainText(testUsers.user1.displayName);

    // Should appear in user 2's chat in real-time
    await expect(page2.locator('[data-testid="message-item"]')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('[data-testid="message-content"]')).toContainText(testMessages.simple);
    await expect(page2.locator('[data-testid="message-sender"]')).toContainText(testUsers.user1.displayName);

    // User 2 replies
    await page2.fill('[data-testid="message-input"]', 'Thanks for the message!');
    await page2.click('[data-testid="send-button"]');

    // Should appear in both chats
    await expect(page1.locator('[data-testid="message-item"]')).toHaveCount(2);
    await expect(page2.locator('[data-testid="message-item"]')).toHaveCount(2);
  });

  test('should handle typing indicators', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Wait for connection
    await expect(page1.locator('[data-testid="connection-status"]')).toContainText('Connected');
    await expect(page2.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // User 1 starts typing
    await page1.fill('[data-testid="message-input"]', 'Test');

    // Should show typing indicator on user 2's screen
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 3000 });
    await expect(page2.locator('[data-testid="typing-indicator"]')).toContainText(`${testUsers.user1.displayName} is typing...`);

    // Stop typing
    await page1.fill('[data-testid="message-input"]', '');

    // Typing indicator should disappear
    await expect(page2.locator('[data-testid="typing-indicator"]')).toBeHidden({ timeout: 5000 });
  });

  test('should handle message reactions and emojis', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Send message
    await page1.fill('[data-testid="message-input"]', testMessages.simple);
    await page1.click('[data-testid="send-button"]');

    // Wait for message to appear
    await expect(page2.locator('[data-testid="message-item"]')).toBeVisible();

    // User 2 adds reaction
    await page2.hover('[data-testid="message-item"]');
    await page2.click('[data-testid="add-reaction-button"]');
    await page2.click('[data-testid="emoji-thumbs-up"]');

    // Reaction should appear on both sides
    await expect(page1.locator('[data-testid="message-reactions"]')).toBeVisible({ timeout: 3000 });
    await expect(page1.locator('[data-testid="reaction-thumbs-up"]')).toBeVisible();
    await expect(page1.locator('[data-testid="reaction-count"]')).toContainText('1');

    await expect(page2.locator('[data-testid="message-reactions"]')).toBeVisible();
    await expect(page2.locator('[data-testid="reaction-thumbs-up"]')).toBeVisible();

    // User 1 adds same reaction
    await page1.click('[data-testid="reaction-thumbs-up"]');

    // Count should update
    await expect(page1.locator('[data-testid="reaction-count"]')).toContainText('2');
    await expect(page2.locator('[data-testid="reaction-count"]')).toContainText('2');
  });

  test('should support live notifications', async () => {
    await page1.goto('/dashboard');
    await page2.goto('/chat');

    // User 2 sends a message mentioning user 1
    await page2.fill('[data-testid="message-input"]', testMessages.mention);
    await page2.click('[data-testid="send-button"]');

    // User 1 should receive real-time notification
    await expect(page1.locator('[data-testid="notification-popup"]')).toBeVisible({ timeout: 5000 });
    await expect(page1.locator('[data-testid="notification-content"]')).toContainText('mentioned you in chat');
    await expect(page1.locator('[data-testid="notification-sender"]')).toContainText(testUsers.user2.displayName);

    // Notification should appear in notifications center
    await page1.click('[data-testid="notifications-button"]');
    await expect(page1.locator('[data-testid="notification-item"]')).toBeVisible();
    await expect(page1.locator('[data-testid="notification-unread"]')).toBeVisible();

    // Click notification to navigate to chat
    await page1.click('[data-testid="notification-item"]');
    await expect(page1).toHaveURL('/chat');

    // Message should be highlighted
    await expect(page1.locator('[data-testid="highlighted-message"]')).toBeVisible();
  });

  test('should handle file sharing in real-time', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Create test file
    const testFile = new File(['Test file content'], 'test-document.txt', {
      type: 'text/plain'
    });

    // User 1 shares file
    await page1.setInputFiles('[data-testid="file-share-input"]', [
      { name: 'test-document.txt', mimeType: 'text/plain', buffer: Buffer.from('Test file content') }
    ]);

    // Should show file upload progress
    await expect(page1.locator('[data-testid="file-upload-progress"]')).toBeVisible();

    // File should appear in chat for both users
    await expect(page1.locator('[data-testid="shared-file"]')).toBeVisible({ timeout: 10000 });
    await expect(page2.locator('[data-testid="shared-file"]')).toBeVisible({ timeout: 10000 });

    // Should show file details
    await expect(page1.locator('[data-testid="file-name"]')).toContainText('test-document.txt');
    await expect(page2.locator('[data-testid="file-name"]')).toContainText('test-document.txt');

    // User 2 should be able to download
    await expect(page2.locator('[data-testid="download-file-button"]')).toBeVisible();
  });

  test('should support collaborative document editing', async () => {
    // Create shared document
    const docResponse = await page1.request.post('/api/documents', {
      data: { title: 'Test Document', content: 'Initial content' },
      headers: { 'Authorization': `Bearer ${authToken1}` }
    });
    const docData = await docResponse.json();

    // Share document with user 2
    await page1.request.post(`/api/documents/${docData.id}/share`, {
      data: { email: testUsers.user2.email, permission: 'edit' },
      headers: { 'Authorization': `Bearer ${authToken1}` }
    });

    // Both users open the document
    await page1.goto(`/documents/${docData.id}`);
    await page2.goto(`/documents/${docData.id}`);

    // Should show collaborative editing indicators
    await expect(page1.locator('[data-testid="collaborators"]')).toBeVisible();
    await expect(page2.locator('[data-testid="collaborators"]')).toBeVisible();

    // Should see each other as active collaborators
    await expect(page1.locator('[data-testid="collaborator-realtime2"]')).toBeVisible();
    await expect(page2.locator('[data-testid="collaborator-realtime1"]')).toBeVisible();

    // User 1 makes edit
    await page1.click('[data-testid="document-editor"]');
    await page1.keyboard.type(' - Added by user 1');

    // Should show in real-time on user 2's screen
    await expect(page2.locator('[data-testid="document-content"]')).toContainText('Added by user 1', { timeout: 5000 });

    // Should show editing cursor/selection
    await expect(page2.locator('[data-testid="user-cursor-realtime1"]')).toBeVisible();

    // User 2 makes concurrent edit
    await page2.click('[data-testid="document-editor"]');
    await page2.keyboard.press('End');
    await page2.keyboard.type(' - And by user 2');

    // Should merge edits properly
    await expect(page1.locator('[data-testid="document-content"]')).toContainText('And by user 2', { timeout: 5000 });
  });

  test('should handle connection failures and reconnection', async () => {
    await page1.goto('/chat');

    // Should start connected
    await expect(page1.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // Simulate connection loss
    await page1.evaluate(() => {
      // Mock WebSocket disconnect
      window.dispatchEvent(new Event('offline'));
    });

    // Should show disconnected status
    await expect(page1.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
    await expect(page1.locator('[data-testid="reconnect-indicator"]')).toBeVisible();

    // Should show offline message queue
    await page1.fill('[data-testid="message-input"]', 'Message while offline');
    await page1.click('[data-testid="send-button"]');

    await expect(page1.locator('[data-testid="queued-message"]')).toBeVisible();
    await expect(page1.locator('[data-testid="message-pending"]')).toBeVisible();

    // Simulate reconnection
    await page1.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Should reconnect and send queued messages
    await expect(page1.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 10000 });
    await expect(page1.locator('[data-testid="message-sent"]')).toBeVisible();
  });

  test('should support real-time presence indicators', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Should show both users as online
    await expect(page1.locator('[data-testid="user-realtime2-status"]')).toContainText('Online');
    await expect(page2.locator('[data-testid="user-realtime1-status"]')).toContainText('Online');

    // User 2 goes idle
    await page2.evaluate(() => {
      // Simulate idle state
      window.dispatchEvent(new CustomEvent('user-idle'));
    });

    // Should update presence status
    await expect(page1.locator('[data-testid="user-realtime2-status"]')).toContainText('Idle', { timeout: 5000 });

    // User 2 becomes active again
    await page2.click('[data-testid="message-input"]');

    // Should update to active
    await expect(page1.locator('[data-testid="user-realtime2-status"]')).toContainText('Online', { timeout: 5000 });

    // User 2 closes tab (goes offline)
    await page2.close();

    // Should show as offline
    await expect(page1.locator('[data-testid="user-realtime2-status"]')).toContainText('Offline', { timeout: 10000 });
  });

  test('should handle message threading and replies', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // User 1 sends initial message
    await page1.fill('[data-testid="message-input"]', 'This is the main message');
    await page1.click('[data-testid="send-button"]');

    // Wait for message to appear
    await expect(page2.locator('[data-testid="message-item"]')).toBeVisible();

    // User 2 replies to the message
    await page2.hover('[data-testid="message-item"]');
    await page2.click('[data-testid="reply-button"]');

    // Should open thread view
    await expect(page2.locator('[data-testid="thread-view"]')).toBeVisible();
    await expect(page2.locator('[data-testid="parent-message"]')).toContainText('This is the main message');

    // Send reply
    await page2.fill('[data-testid="thread-reply-input"]', 'This is a reply');
    await page2.click('[data-testid="send-reply-button"]');

    // Should show thread indicator on main message
    await expect(page1.locator('[data-testid="thread-indicator"]')).toBeVisible({ timeout: 5000 });
    await expect(page1.locator('[data-testid="reply-count"]')).toContainText('1 reply');

    // User 1 can open thread
    await page1.click('[data-testid="thread-indicator"]');
    await expect(page1.locator('[data-testid="thread-view"]')).toBeVisible();
    await expect(page1.locator('[data-testid="thread-reply"]')).toContainText('This is a reply');
  });

  test('should support voice and video call initiation', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // User 1 initiates voice call
    await page1.click('[data-testid="voice-call-button"]');

    // Should show call invitation for user 2
    await expect(page2.locator('[data-testid="incoming-call"]')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('[data-testid="caller-name"]')).toContainText(testUsers.user1.displayName);
    await expect(page2.locator('[data-testid="call-type"]')).toContainText('Voice Call');

    // User 2 accepts call
    await page2.click('[data-testid="accept-call-button"]');

    // Should open call interface
    await expect(page1.locator('[data-testid="call-interface"]')).toBeVisible();
    await expect(page2.locator('[data-testid="call-interface"]')).toBeVisible();

    // Should show call controls
    await expect(page1.locator('[data-testid="mute-button"]')).toBeVisible();
    await expect(page1.locator('[data-testid="end-call-button"]')).toBeVisible();

    // Test video call upgrade
    await page1.click('[data-testid="video-button"]');

    // Should request video permission
    await expect(page2.locator('[data-testid="video-request"]')).toBeVisible();
    await page2.click('[data-testid="accept-video-button"]');

    // Should show video interface
    await expect(page1.locator('[data-testid="video-interface"]')).toBeVisible();
    await expect(page2.locator('[data-testid="video-interface"]')).toBeVisible();
  });

  test('should handle group chat functionality', async () => {
    // Create group chat
    await page1.goto('/chat');
    await page1.click('[data-testid="create-group-button"]');

    await page1.fill('[data-testid="group-name-input"]', 'Test Group');
    await page1.fill('[data-testid="group-description-input"]', 'A test group for e2e testing');

    // Add user 2 to group
    await page1.fill('[data-testid="add-member-input"]', testUsers.user2.email);
    await page1.click('[data-testid="add-member-button"]');

    await page1.click('[data-testid="create-group-confirm"]');

    // Should show success message
    await expect(page1.locator('[data-testid="group-created"]')).toBeVisible();

    // User 2 should receive group invitation
    await page2.goto('/chat');
    await expect(page2.locator('[data-testid="group-invitation"]')).toBeVisible({ timeout: 5000 });
    await page2.click('[data-testid="accept-invitation-button"]');

    // Both users should see the group
    await expect(page1.locator('[data-testid="group-test-group"]')).toBeVisible();
    await expect(page2.locator('[data-testid="group-test-group"]')).toBeVisible();

    // Test group messaging
    await page1.click('[data-testid="group-test-group"]');
    await page1.fill('[data-testid="message-input"]', 'Hello group!');
    await page1.click('[data-testid="send-button"]');

    // Should appear for user 2
    await page2.click('[data-testid="group-test-group"]');
    await expect(page2.locator('[data-testid="message-item"]')).toBeVisible({ timeout: 5000 });
    await expect(page2.locator('[data-testid="message-content"]')).toContainText('Hello group!');
  });

  test('should handle message search and history', async () => {
    await page1.goto('/chat');
    await page2.goto('/chat');

    // Send several messages
    const testMessages = [
      'First test message',
      'Second message with keyword',
      'Third message about testing',
      'Fourth message with different content'
    ];

    for (const message of testMessages) {
      await page1.fill('[data-testid="message-input"]', message);
      await page1.click('[data-testid="send-button"]');
      await expect(page2.locator('[data-testid="message-item"]')).toHaveCount(testMessages.indexOf(message) + 1);
    }

    // Test message search
    await page2.click('[data-testid="search-button"]');
    await page2.fill('[data-testid="search-input"]', 'keyword');
    await page2.press('[data-testid="search-input"]', 'Enter');

    // Should show search results
    await expect(page2.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page2.locator('[data-testid="search-result-item"]')).toHaveCount(1);
    await expect(page2.locator('[data-testid="search-result-item"]')).toContainText('Second message with keyword');

    // Test message history pagination
    await page2.click('[data-testid="load-more-history"]');
    await expect(page2.locator('[data-testid="loading-history"]')).toBeVisible();
    await expect(page2.locator('[data-testid="history-loaded"]')).toBeVisible({ timeout: 5000 });
  });
});
