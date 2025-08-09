# Agent Guidelines for DeepWebAi Monorepo

## Build/Test Commands

- **Build**: `pnpm build` (builds all packages), `turbo run build --filter=<package>`
- **Test**: `pnpm test` (all tests), `vitest` in package dirs, `vitest <filename>` for single test
- **Dev**: `pnpm dev` (starts all), individual packages: `pnpm --filter=<package> dev`
- **Single package test**: `cd packages/<package> && vitest <testfile>`
- **Auth Tests**: `pnpm test:auth` (Auth.js, MFA, OAuth tests)
- **File Tests**: `pnpm test:files` (Formidable file upload tests)
- **Migration Check**: `pnpm migration:check` (Check Auth.js + Formidable migration)

## Architecture & Structure

- **Monorepo** using Turbo + pnpm workspaces
- **Packages**: backend (Elysia.js), frontend (React+Vite), ai-core, ai-gateway, shared-types, tema-ui
- **Database**: Neon serverless PostgreSQL, Auth.js adapter (client in node_modules/.prisma)
- **State**: Jotai for React state management
- **API**: RESTful with Elysia.js, Zod validation, Auth.js (NextAuth.js) authentication
- **File Upload**: Formidable for multipart/form-data processing
- **Real-time**: Ably for websockets/notifications

## Authentication & File Upload

### Auth.js (NextAuth.js) Implementation
- **Service**: `AuthJSService` wrapper tamamen NextAuth.js kullanır
- **Middleware**: `authMiddleware`, `requireAuth`, `requireRole` for Elysia.js
- **OAuth**: Built-in GitHub, Discord, Google, Twitter providers
- **MFA**: TOTP, SMS, Email, Backup codes (NextAuth.js ile uyumlu)
- **Database**: Neon adapter with existing user tables

### Formidable File Upload
- **Service**: `FormidableFileService` for multipart parsing
- **Controller**: `FormidableFileController` for Elysia.js integration  
- **Features**: Single/multiple file upload, file validation, processing pipeline
- **Security**: File type validation, size limits, path traversal protection

## Code Style & Conventions

- **TypeScript 5.5.2** everywhere, strict mode
- **Format on save** with Prettier (VS Code default formatter)
- **ESLint** enabled for TS/JS/TSX/JSX files
- **Imports**: Use shared-types package for common types across packages
- **Testing**: Vitest with React Testing Library, tests in `tests/unit/<package>/`
- **Error handling**: Use Zod schemas, proper TypeScript error types
- **Naming**: camelCase for variables/functions, PascalCase for components/types

## Migration Status

### ✅ Completed Migrations
- **NextAuth.js**: NextAuth.js 5.0.0-beta.26 implementasyonu tamamlandı
- **Formidable**: Multer → Formidable 3.5.1 with enhanced security and performance
- **Dependencies**: Updated to React 19.1.1 with compatible testing libraries
- **Tests**: New test suites for NextAuth.js and Formidable implementations

### 📁 Key Files
- `packages/backend/src/auth/authjs-*` - NextAuth.js implementation
- `packages/backend/src/modules/files/formidable-*` - Formidable implementation
- `tests/unit/backend/authjs.test.ts` - NextAuth.js tests
- `tests/unit/backend/formidable.test.ts` - Formidable tests
- `docs/NEXTAUTH_MIGRATION.md` - NextAuth.js migration guide
- `docs/FORMIDABLE_MIGRATION.md` - Formidable migration guide
