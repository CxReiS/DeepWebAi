import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(() => {
  // Mock environment variables
  process.env.VITE_API_URL = 'http://localhost:3001';
  process.env.NODE_ENV = 'test';
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => null,
      setItem: (key: string, value: string) => {},
      removeItem: (key: string) => {},
      clear: () => {},
    },
    writable: true,
  });

  // Mock fetch
  global.fetch = async (url: string, options?: any) => {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

// Test utilities
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  role: 'user',
  isVerified: true,
  preferences: {}
};

export const mockConversation = {
  id: 'test-conversation-id',
  title: 'Test Conversation',
  userId: 'test-user-id',
  modelId: 'test-model-id',
  createdAt: new Date().toISOString()
};

export const createMockResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};
