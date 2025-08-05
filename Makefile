# DeepWebAI Development Makefile
# Quick commands for development, testing, and deployment

.PHONY: help install dev build test clean docker health

# Default target
help:
	@echo "🚀 DeepWebAI Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install     - Install all dependencies"
	@echo "  make setup       - Complete project setup"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start development servers"
	@echo "  make dev-backend - Start backend only"
	@echo "  make dev-frontend- Start frontend only"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-unit   - Run unit tests"
	@echo "  make test-int    - Run integration tests"
	@echo "  make test-coverage - Run tests with coverage"
	@echo "  make test-watch  - Run tests in watch mode"
	@echo ""
	@echo "Quality:"
	@echo "  make lint        - Run linting"
	@echo "  make typecheck   - Run TypeScript type checking"
	@echo "  make format      - Format code"
	@echo ""
	@echo "Building:"
	@echo "  make build       - Build all packages"
	@echo "  make build-backend - Build backend only"
	@echo "  make build-frontend - Build frontend only"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-seed     - Seed database with test data"
	@echo "  make db-reset    - Reset database"
	@echo ""
	@echo "Monitoring:"
	@echo "  make health      - Check services health"
	@echo "  make logs        - View logs"
	@echo "  make metrics     - View metrics"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up   - Start Docker services"
	@echo "  make docker-down - Stop Docker services"
	@echo "  make docker-build - Build Docker images"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make clean-deps  - Clean dependencies"
	@echo "  make reset       - Complete reset"

# Setup & Installation
install:
	@echo "📦 Installing dependencies..."
	pnpm install

setup: install
	@echo "⚙️  Setting up project..."
	@cp .env.example .env 2>/dev/null || echo "⚠️  .env.example not found"
	@cp packages/backend/.env.example packages/backend/.env 2>/dev/null || echo "⚠️  Backend .env.example not found"
	@echo "✅ Setup completed! Please configure your .env files."

# Development
dev:
	@echo "🚀 Starting development environment..."
	pnpm dev

dev-backend:
	@echo "🔧 Starting backend..."
	cd packages/backend && pnpm dev

dev-frontend:
	@echo "🎨 Starting frontend..."
	cd packages/frontend && pnpm dev

# Testing
test:
	@echo "🧪 Running all tests..."
	pnpm test

test-unit:
	@echo "🔬 Running unit tests..."
	pnpm run test:unit

test-int:
	@echo "🔗 Running integration tests..."
	pnpm run test:integration

test-coverage:
	@echo "📊 Running tests with coverage..."
	pnpm run test:coverage

test-watch:
	@echo "👀 Starting test watch mode..."
	pnpm run test:watch

test-setup:
	@echo "🛠️  Setting up test environment..."
	chmod +x scripts/test-setup.sh
	./scripts/test-setup.sh

# Quality
lint:
	@echo "🔍 Running linting..."
	pnpm run lint

typecheck:
	@echo "📝 Running TypeScript type checking..."
	pnpm run typecheck

format:
	@echo "💄 Formatting code..."
	@echo "Code formatting would be implemented here"

# Building
build:
	@echo "🏗️  Building all packages..."
	pnpm build

build-backend:
	@echo "🔧 Building backend..."
	cd packages/backend && pnpm build

build-frontend:
	@echo "🎨 Building frontend..."
	cd packages/frontend && pnpm build

# Database
db-migrate:
	@echo "🗃️  Running database migrations..."
	pnpm run db:migrate

db-seed:
	@echo "🌱 Seeding database..."
	pnpm run db:seed

db-reset:
	@echo "🔄 Resetting database..."
	@echo "Database reset would be implemented here"

# Monitoring
health:
	@echo "🏥 Checking services health..."
	pnpm run health

logs:
	@echo "📋 Viewing logs..."
	@if [ -f "packages/backend/logs/app.log" ]; then \
		tail -f packages/backend/logs/app.log; \
	else \
		echo "No log file found"; \
	fi

metrics:
	@echo "📊 Viewing metrics..."
	curl -s http://localhost:3001/metrics | jq . || echo "Metrics service not available"

# Docker
docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose -f docker/docker-compose.yml up -d

docker-down:
	@echo "🛑 Stopping Docker services..."
	docker-compose -f docker/docker-compose.yml down

docker-build:
	@echo "🔨 Building Docker images..."
	docker-compose -f docker/docker-compose.yml build

docker-logs:
	@echo "📋 Viewing Docker logs..."
	docker-compose -f docker/docker-compose.yml logs -f

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf packages/*/dist
	rm -rf packages/*/build
	rm -rf .turbo
	rm -rf coverage

clean-deps:
	@echo "🗑️  Cleaning dependencies..."
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf pnpm-lock.yaml

reset: clean clean-deps
	@echo "🔄 Complete reset..."
	@echo "Project reset completed. Run 'make setup' to reinstall."

# Development helpers
start:
	@echo "🚀 Starting development with script..."
	chmod +x scripts/start-dev.sh
	./scripts/start-dev.sh

stop:
	@echo "🛑 Stopping all services..."
	pkill -f "pnpm dev" || true
	pkill -f "vite" || true
	pkill -f "ts-node" || true

restart: stop start

# Environment
env-check:
	@echo "🔍 Checking environment..."
	@echo "Node.js: $$(node --version)"
	@echo "pnpm: $$(pnpm --version)"
	@echo "TypeScript: $$(npx tsc --version)"
	@echo "Environment: $${NODE_ENV:-development}"

# Quick development workflow
quick-start: install dev

# CI/CD helpers
ci-test:
	@echo "🤖 Running CI tests..."
	pnpm run test:ci

ci-build:
	@echo "🤖 Running CI build..."
	pnpm build
	
ci-deploy:
	@echo "🚀 Running CI deployment..."
	@echo "Deployment would be implemented here"

# Security
security-check:
	@echo "🔒 Running security checks..."
	pnpm audit

# Performance
perf-test:
	@echo "⚡ Running performance tests..."
	@echo "Performance tests would be implemented here"

# Monitoring setup
monitoring-setup:
	@echo "📊 Setting up monitoring..."
	@echo "Monitoring setup would be implemented here"
