import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6380';
  process.env.REDIS_DB = '15';
  process.env.CACHE_LOG_HITS = 'false';
  process.env.CACHE_LOG_MISSES = 'false';
  process.env.CACHE_LOG_ERRORS = 'false';
});

afterAll(async () => {
  // Cleanup
});
