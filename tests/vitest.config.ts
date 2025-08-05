import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.ts'],
    include: [
      'unit/**/*.{test,spec}.{js,ts,tsx}',
      'integration/**/*.{test,spec}.{js,ts,tsx}',
      'ai-validation/**/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
      'performance/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/backend/src/**',
        'packages/ai-core/**',
        'packages/frontend/src/**'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        '**/node_modules/**',
        '**/dist/**'
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 60,
          functions: 70,
          lines: 70
        }
      }
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    testTimeout: 30000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
      '@backend': resolve(__dirname, '../packages/backend'),
      '@frontend': resolve(__dirname, '../packages/frontend'),
      '@ai-core': resolve(__dirname, '../packages/ai-core'),
      '@shared-types': resolve(__dirname, '../packages/shared-types'),
      '@tests': resolve(__dirname, './')
    }
  },
  define: {
    'process.env': process.env
  }
});
