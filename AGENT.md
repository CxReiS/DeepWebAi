# Agent Guidelines for DeepWebAi Monorepo

## Build/Test Commands

- **Build**: `pnpm build` (builds all packages), `turbo run build --filter=<package>`
- **Test**: `pnpm test` (all tests), `vitest` in package dirs, `vitest <filename>` for single test
- **Dev**: `pnpm dev` (starts all), individual packages: `pnpm --filter=<package> dev`
- **Single package test**: `cd packages/<package> && vitest <testfile>`

## Architecture & Structure

- **Monorepo** using Turbo + pnpm workspaces
- **Packages**: backend (Elysia.js), frontend (React+Vite), ai-core, ai-gateway, shared-types, tema-ui
- **Database**: Neon serverless PostgreSQL, Prisma ORM (client in node_modules/.prisma)
- **State**: Jotai for React state management
- **API**: RESTful with Elysia.js, Zod validation, OAuth2 auth (Auth.js / NextAuth)
- **Real-time**: Ably for websockets/notifications

## Code Style & Conventions

- **TypeScript 5.5.2** everywhere, strict mode
- **Format on save** with Prettier (VS Code default formatter)
- **ESLint** enabled for TS/JS/TSX/JSX files
- **Imports**: Use shared-types package for common types across packages
- **Testing**: Vitest with React Testing Library, tests in `tests/unit/<package>/`
- **Error handling**: Use Zod schemas, proper TypeScript error types
- **Naming**: camelCase for variables/functions, PascalCase for components/types
