# DeepWebAI

🚀 **Advanced AI-powered platform for document processing, chat, and intelligent analysis.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)

## ✨ Features

### 🤖 **Multi-Provider AI Integration**

- **OpenAI GPT-4**: Advanced reasoning and analysis
- **Anthropic Claude**: Excellent for writing and summarization
- **Google Gemini**: Fast responses and creative tasks
- **DeepSeek**: Cost-effective alternative
- **Intelligent Routing**: Automatic provider fallback and load balancing

### 📄 **Advanced Document Processing**

- **OCR Technology**: Extract text from images and scanned PDFs
- **Multi-format Support**: PDF, DOC, DOCX, images, spreadsheets
- **Text Cleaning**: Remove formatting and normalize content
- **Metadata Extraction**: Automatic language detection and analysis
- **Real-time Processing**: Monitor progress with live updates

### 🔐 **Enterprise-Grade Security**

- **Multi-Factor Authentication**: TOTP, SMS, backup codes
- **OAuth Integration**: GitHub, Discord, Google sign-in
- **Session Management**: Secure authentication with OAuth2 (Auth.js / NextAuth)
- **Rate Limiting**: Protection against abuse and attacks
- **Security Headers**: CSRF, XSS, and injection protection

### 🚀 **Real-time Collaboration**

- **WebSocket Chat**: Instant messaging and notifications
- **Live Document Sharing**: Collaborate on analysis in real-time
- **Ably Integration**: Scalable real-time infrastructure
- **Presence Indicators**: See who's online and active

### 🎛️ **Feature Flag Management**

- **Dynamic Control**: Enable/disable features without deployment
- **A/B Testing**: Test new features with specific user groups
- **User Targeting**: Customize experience based on user attributes
- **Analytics Integration**: Track feature usage and performance

### 📊 **Analytics & Monitoring**

- **Usage Tracking**: Monitor API calls, file processing, chat interactions
- **Performance Metrics**: Response times, error rates, system health
- **Sentry Integration**: Error tracking and performance monitoring
- **Custom Dashboards**: View analytics and insights

### 🔄 **High-Performance Caching**

- **Redis Integration**: Fast data access and session storage
- **Multi-level Caching**: Memory and distributed caching strategies
- **Cache Warming**: Preload frequently accessed data
- **Intelligent Invalidation**: Keep data fresh and consistent

## 🏗️ Architecture

**Modern Monorepo** built with Turbo and pnpm workspaces:

```
packages/
├── backend/          # Elysia.js API server with TypeScript
├── frontend/         # React + Vite + Jotai state management
├── ai-gateway/       # AI provider abstraction and routing
├── ai-core/          # Core AI utilities and types
├── file-processing/  # Document processing and OCR engine
├── feature-flags/    # Feature flag management system
├── caching/          # Caching service abstraction
├── shared-types/     # Shared TypeScript definitions
└── tema-ui/          # Custom UI component library
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **PostgreSQL** 14+ (or Neon serverless)
- **Redis** 6+ (optional, for caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/CxReiS/DeepWebAi.git
cd DeepWebAi

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm run db:migrate

# Start all development servers
pnpm dev
```

### First Steps

1. **📝 Register Account**: Visit `http://localhost:3000` and create an account
2. **🔐 Setup MFA**: Enable two-factor authentication for security
3. **📄 Upload Document**: Try uploading a PDF or image for processing
4. **🤖 Start Chatting**: Ask AI questions about your documents
5. **⚙️ Explore Settings**: Customize your experience with feature flags

## 📖 Documentation

### For Users

- **[Getting Started Guide](./docs/user-guide/getting-started.md)** - Complete user onboarding
- **[Authentication Setup](./docs/user-guide/authentication.md)** - MFA and OAuth setup
- **[File Processing Guide](./docs/user-guide/file-processing.md)** - Document upload and analysis
- **[AI Chat Features](./docs/user-guide/ai-chat.md)** - Using AI assistants effectively

### For Administrators

- **[Installation Guide](./docs/admin-guide/installation.md)** - Complete deployment setup
- **[Configuration Management](./docs/admin-guide/configuration.md)** - Environment and security setup
- **[Feature Flag Management](./docs/admin-guide/feature-flags.md)** - Managing user experiences
- **[Monitoring & Analytics](./docs/admin-guide/monitoring.md)** - System health and usage

### For Developers

- **[Development Setup](./docs/developer_guide/environment_setup.md)** - Local development environment
- **[API Documentation](./docs/api/)** - Complete API reference
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute to the project

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all development servers
pnpm dev:backend      # Backend only
pnpm dev:frontend     # Frontend only

# Building
pnpm build            # Build all packages
pnpm build:backend    # Backend only
pnpm build:frontend   # Frontend only

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:integration # Integration tests
pnpm test:e2e         # End-to-end tests

# Quality
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript checking
pnpm format           # Format with Prettier

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed test data
pnpm db:reset         # Reset database
```

### Testing

**Comprehensive test suite** with 71 E2E scenarios:

```bash
# Interactive test runner
node test-runner.js

# E2E tests
node tests/e2e/e2e-test-runner.mjs

# Specific test types
pnpm test:auth        # Authentication flow tests
pnpm test:files       # File processing tests
pnpm test:ai          # AI gateway tests
pnpm test:realtime    # Real-time feature tests
```

## 🔐 Environment Configuration

### Required Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Authentication
JWT_SECRET="your-jwt-secret-256-bit"
NEXTAUTH_SECRET="your-nextauth-secret-256-bit"

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."
DEEPSEEK_API_KEY="..."

# Real-time (Ably)
ABLY_API_KEY="your-ably-api-key"
ABLY_APP_ID="your-ably-app-id"

# Optional: Caching
REDIS_URL="redis://localhost:6379"

# Optional: Monitoring
SENTRY_DSN="https://..."
```

### Security Configuration

```env
# CORS
CORS_ORIGIN="https://yourdomain.com"
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # per window

# File Upload
MAX_FILE_SIZE=52428800           # 50MB
UPLOAD_DIR="./uploads"

# Session Security
SESSION_MAX_AGE=604800           # 7 days
SESSION_COOKIE_NAME="deepwebai-session"
```

## 🚀 Deployment

### Production Deployment

```bash
# Build for production
NODE_ENV=production pnpm build

# Using PM2 (recommended)
pm2 start ecosystem.config.js --env production

# Or Docker
docker-compose up -d

# Or manual
cd packages/backend && pnpm start
cd packages/frontend && pnpm preview
```

### Cloud Deployment

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Railway, Render, AWS EC2, DigitalOcean
- **Database**: Neon, Supabase, AWS RDS
- **Cache**: Redis Cloud, AWS ElastiCache

## 📊 Backup & Recovery

### Automated Backups

```bash
# Database backup (Windows)
.\\scripts\\backup\\database-backup.ps1

# Database backup (Unix/Linux)
./scripts/backup/database-backup.sh

# Restore from backup
.\\scripts\\recovery\\database-recovery.ps1 -BackupFile "backup.sql"
```

### Backup Features

- **Automated scheduling** with retention policies
- **Compression** and integrity verification
- **Cloud upload** to S3/compatible storage
- **Point-in-time recovery** capabilities

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** and add tests
4. **Run quality checks**: `pnpm lint && pnpm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

## Lisans

Bu proje, Apache License 2.0 ile lisanslanmıştır. Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakın.

## 🛠️ Tech Stack

### Backend

- **[Elysia.js](https://elysiajs.com/)** - High-performance TypeScript web framework
- **[Auth.js (NextAuth)](https://authjs.dev/)** - OAuth2 authentication
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL
- **[Redis](https://redis.io/)** - In-memory caching and sessions

### Frontend

- **[React 18](https://react.dev/)** - Modern React with hooks
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[Jotai](https://jotai.org/)** - Primitive and flexible state management
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework

### AI & Processing

- **Multiple AI Providers** - OpenAI, Anthropic, Google, DeepSeek
- **[Tesseract.js](https://tesseract.projectnaptha.com/)** - OCR processing
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** - PDF text extraction

### Infrastructure

- **[Turbo](https://turbo.build/)** - Monorepo build system
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Ably](https://ably.com/)** - Real-time messaging infrastructure

## 🆘 Support

- **📧 Email**: support@deepweb.ai
- **💬 Discord**: [Join our community](https://discord.gg/deepwebai)
- **🐛 Issues**: [GitHub Issues](https://github.com/CxReiS/DeepWebAi/issues)
- **📚 Docs**: [Documentation Site](https://docs.deepwebai.com)

---

**Built with ❤️ by the DeepWebAI team**

## Çevre Değişkeni Akışı
- Lokal: .env.local → (ilk çalıştırmada) .env kopyalanır, asla ezilmez.
- Vercel: `pnpm env:push` ile Dashboard’a, `pnpm env:pull` ile `.env.local`’a çekilir.
- .env ve .env.* git’e dahil edilmez; sadece .env.example commit edilir.
