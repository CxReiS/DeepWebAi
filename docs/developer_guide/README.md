# Developer Guide

Welcome to the DeepWebAI Developer Guide. This comprehensive guide covers installation, environment setup, coding standards, and contribution guidelines.

## Table of Contents

1. [Installation](#installation)
2. [Environment Setup](#environment-setup)
3. [Architecture Overview](#architecture-overview)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Contributing](#contributing)

---

## Installation

### System Requirements

#### Prerequisites
- **Node.js**: v22.14.0 or higher
- **pnpm**: 10.14.0 or higher
- **Git**: Latest version
- **Docker**: Latest version (optional)

#### Services
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Redis/DragonflyDB**: Caching layer
- **Ably**: Real-time messaging (optional)

### Quick Start

```bash
# Clone repository
git clone https://github.com/CxReiS/DeepWebAi.git
cd DeepWebAi

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Setup environment variables (see Environment Setup)
# Edit .env file with your configurations

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Package Installation

```bash
# Install all packages
pnpm install

# Install for specific package
pnpm --filter=backend install <package>

# Add development dependency
pnpm --filter=frontend add -D <package>
```

---

## Environment Setup

### Core Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@hostname:5432/database?sslmode=require"
DIRECT_URL="postgresql://user:password@hostname:5432/database?sslmode=require"

# Authentication (Auth.js)
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider APIs
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="AI..."
DEEPSEEK_API_KEY="sk-..."

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Caching
REDIS_URL="redis://localhost:6379"
DRAGONFLY_URL="redis://localhost:6380"  # Optional alternative

# Real-time
ABLY_API_KEY="your-ably-api-key"  # Optional

# Analytics
PLAUSIBLE_DOMAIN="your-domain.com"  # Optional
VERCEL_ANALYTICS_ID="your-analytics-id"  # Optional

# Feature Flags
GROWTHBOOK_API_HOST="https://cdn.growthbook.io"
GROWTHBOOK_CLIENT_KEY="sdk-..."
GROWTHBOOK_DECRYPT_KEY="key_..."

# File Processing
MAX_FILE_SIZE="50MB"
SUPPORTED_FILE_TYPES="pdf,docx,doc,txt,png,jpg,jpeg"
OCR_LANGUAGES="eng,spa,fra,deu"

# Security
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
RATE_LIMIT_REQUESTS="1000"
RATE_LIMIT_WINDOW="3600"  # seconds
```

### Service Setup

#### Neon PostgreSQL Setup

1. Create account at [Neon](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run migrations: `pnpm db:migrate`

#### Redis/DragonflyDB Setup

**Option 1: Local Redis**
```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server
```

**Option 2: Docker Redis**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Option 3: DragonflyDB (Recommended)**
```bash
docker run -d -p 6380:6379 docker.dragonflydb.io/dragonflydb/dragonfly
```

#### AI Provider Setup

1. **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com)
2. **Anthropic**: Get API key from [Anthropic Console](https://console.anthropic.com)
3. **Google Gemini**: Get API key from [Google AI Studio](https://aistudio.google.com)
4. **DeepSeek**: Get API key from [DeepSeek Platform](https://platform.deepseek.com)

#### Local Llama Setup (Optional)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama2
ollama pull codellama
ollama pull mistral
```

---

## Architecture Overview

### Monorepo Structure

```
DeepWebAi/
├── packages/
│   ├── backend/           # Elysia.js API server
│   ├── frontend/          # React + Vite application
│   ├── ai-gateway/        # Unified AI provider interface
│   ├── ai-core/           # Advanced AI capabilities
│   ├── advanced-ai/       # Ethics & specialized AI
│   ├── caching/           # Multi-layer caching system
│   ├── file-processing/   # Document & image processing
│   ├── feature-flags/     # Feature management
│   ├── observability/     # Monitoring & tracing
│   ├── shared-types/      # Common TypeScript types
│   └── tema-ui/           # Theme & UI components
├── docs/                  # Documentation
├── tests/                 # Test suites
├── scripts/               # Build & deployment scripts
└── tools/                 # Development tools
```

### Technology Stack

#### Backend
- **Runtime**: Node.js 22.14.0
- **Framework**: Elysia.js (Bun-compatible)
- **Database**: Neon PostgreSQL + Prisma ORM
- **Authentication**: Auth.js (NextAuth.js) with MFA
- **Caching**: Redis/DragonflyDB with node-cache
- **File Upload**: Formidable
- **Validation**: Zod schemas
- **Testing**: Vitest + Supertest

#### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.0.6
- **State Management**: Jotai
- **Styling**: Tailwind CSS + Tema UI
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright

#### AI Integration
- **Providers**: OpenAI, Anthropic, Gemini, DeepSeek, Local Llama
- **Features**: Chat completion, streaming, failover, rate limiting
- **File Processing**: PDF/DOCX text extraction, OCR

#### DevOps
- **Package Manager**: pnpm with workspaces
- **Build System**: Turbo for monorepo builds
- **CI/CD**: GitHub Actions
- **Deployment**: Docker + Vercel/Railway
- **Monitoring**: Built-in observability package

---

## Development Workflow

### Daily Development

```bash
# Start all services
pnpm dev

# Start specific package
pnpm --filter=backend dev
pnpm --filter=frontend dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

### Package-specific Commands

```bash
# Backend development
cd packages/backend
pnpm dev          # Start dev server
pnpm test         # Run unit tests
pnpm build        # Build for production

# Frontend development
cd packages/frontend
pnpm dev          # Start dev server with HMR
pnpm build        # Build for production
pnpm preview      # Preview production build

# AI Gateway testing
cd packages/ai-gateway
pnpm test         # Test all providers
pnpm test:openai  # Test specific provider
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/ai-provider-improvements

# Commit changes
git add .
git commit -m "feat(ai-gateway): add streaming support for Gemini"

# Push and create PR
git push origin feature/ai-provider-improvements
```

### Code Generation

```bash
# Generate database client
pnpm db:generate

# Generate API types
pnpm types:generate

# Generate test coverage
pnpm test:coverage
```

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── backend/          # Backend unit tests
│   │   ├── authjs.test.ts
│   │   ├── formidable.test.ts
│   │   └── mfa.test.ts
│   ├── frontend/         # Frontend unit tests
│   └── packages/         # Package-specific tests
├── integration/          # Integration tests
│   └── auth-mfa-oauth-flow.spec.ts
└── e2e/                  # End-to-end tests
    └── auth-complete-flow.spec.ts
```

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Specific test suites
pnpm test:auth          # Authentication tests
pnpm test:files         # File processing tests
pnpm test:ai            # AI gateway tests

# Single test file
cd packages/backend && vitest auth.test.ts

# Watch mode
cd packages/frontend && vitest --watch
```

### Test Configuration

**Vitest Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts']
    }
  }
});
```

**Playwright Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  }
});
```

---

## Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter=backend build
pnpm --filter=frontend build
```

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10.14.0
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3001
CMD ["pnpm", "start"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: ./packages/backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis

  frontend:
    build: ./packages/frontend
    ports:
      - "3000:3000"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Environment-specific Configurations

**Development:**
```bash
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

**Production:**
```bash
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
```

### Deployment Scripts

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production

# Health check
pnpm health:check
```

---

## Contributing

### Code Standards

#### TypeScript Guidelines

1. **Strict Mode**: Always use TypeScript strict mode
2. **Type Safety**: Prefer explicit types over `any`
3. **Interfaces**: Use interfaces for object shapes
4. **Enums**: Use const assertions for better type inference

```typescript
// Good
interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

const API_ENDPOINTS = {
  AUTH: '/api/auth',
  FILES: '/api/files'
} as const;

// Avoid
const userProfile: any = {};
```

#### Code Formatting

**Prettier Configuration** (`.prettierrc`):
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

**ESLint Configuration** (`.eslintrc.js`):
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error'
  }
};
```

#### File Organization

```typescript
// 1. External imports
import React from 'react';
import { z } from 'zod';

// 2. Internal imports
import { UserService } from '../services';
import { validateRequest } from '../utils';

// 3. Type definitions
interface Props {
  userId: string;
}

// 4. Constants
const DEFAULT_TIMEOUT = 5000;

// 5. Component/function implementation
export const UserProfile: React.FC<Props> = ({ userId }) => {
  // Implementation
};
```

### Performance Guidelines

#### Backend Performance

1. **Database Queries**: Use proper indexing and query optimization
2. **Caching**: Implement multi-layer caching strategy
3. **Rate Limiting**: Protect endpoints with appropriate limits
4. **Error Handling**: Use structured error responses

```typescript
// Good: Optimized database query with caching
async function getUserProfile(userId: string) {
  const cached = await cache.get(`user:${userId}`);
  if (cached) return cached;
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }
  });
  
  await cache.set(`user:${userId}`, user, 300); // 5 min TTL
  return user;
}
```

#### Frontend Performance

1. **Code Splitting**: Lazy load components and routes
2. **State Management**: Use Jotai for efficient state updates
3. **Memoization**: Use React.memo and useMemo appropriately
4. **Bundle Size**: Monitor and optimize bundle sizes

```typescript
// Good: Lazy loading with React.lazy
const Dashboard = React.lazy(() => import('./Dashboard'));

// Good: Memoized expensive computation
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);
```

### Security Guidelines

1. **Input Validation**: Always validate user inputs with Zod
2. **Authentication**: Use proper session management
3. **Rate Limiting**: Implement per-endpoint rate limits
4. **CORS**: Configure CORS properly for production
5. **Environment Variables**: Never commit secrets to repository

```typescript
// Good: Input validation with Zod
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

// Good: Rate limiting middleware
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

### Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names
   - `feat/add-streaming-support`
   - `fix/auth-token-expiration`
   - `docs/update-api-reference`

2. **Commit Messages**: Follow conventional commits
   - `feat(ai-gateway): add streaming support for Claude`
   - `fix(auth): handle token expiration properly`
   - `docs: update installation instructions`

3. **PR Description**: Include
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes

4. **Code Review**: Ensure
   - All tests pass
   - Code follows style guidelines
   - Documentation is updated
   - Performance implications are considered

### Documentation Guidelines

1. **API Documentation**: Update OpenAPI specs for new endpoints
2. **Code Comments**: Add comments for complex business logic
3. **README Updates**: Keep package READMEs current
4. **Changelog**: Update version history for releases

---

This developer guide provides comprehensive information for contributing to DeepWebAI. For specific API details, see the [API Reference](../api-reference.md). For user-facing features, see the [User Guide](../user_guide/README.md).
