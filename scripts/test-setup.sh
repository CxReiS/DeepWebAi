#!/bin/bash

# Test setup script for DeepWebAI
# This script sets up the test environment and runs tests

set -e  # Exit on any error

echo "🧪 Setting up test environment for DeepWebAI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    print_status "Detected Windows environment"
    PLATFORM="windows"
else
    print_status "Detected Unix-like environment"
    PLATFORM="unix"
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [[ "$NODE_VERSION" == "not installed" ]]; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

print_success "Node.js version: $NODE_VERSION"

# Check pnpm
print_status "Checking pnpm..."
PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "not installed")
if [[ "$PNPM_VERSION" == "not installed" ]]; then
    print_warning "pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

print_success "pnpm version: $PNPM_VERSION"

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Check if .env.test exists
if [[ ! -f ".env.test" ]]; then
    print_warning ".env.test not found. Creating from template..."
    cp .env.example .env.test 2>/dev/null || echo "No .env.example found"
fi

# Setup test database (if PostgreSQL is available)
print_status "Checking test database setup..."
if command -v psql &> /dev/null; then
    print_status "PostgreSQL found. Setting up test database..."
    
    # Try to create test database
    createdb deepweb_ai_test 2>/dev/null || print_warning "Test database might already exist"
    
    print_success "Test database setup completed"
else
    print_warning "PostgreSQL not found. Tests will run with fallback database."
fi

# Setup Redis for tests (if available)
print_status "Checking Redis for tests..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &>/dev/null; then
        print_success "Redis is running"
    else
        print_warning "Redis is not running. Some tests may fail."
    fi
else
    print_warning "Redis not found. Some tests may skip Redis-dependent features."
fi

# Validate test configuration
print_status "Validating test configuration..."

# Check if vitest is available
if pnpm list vitest &>/dev/null; then
    print_success "Vitest is installed"
else
    print_error "Vitest is not installed. Installing..."
    pnpm add -D vitest
fi

# Run type checking
print_status "Running TypeScript type checking..."
if pnpm run typecheck &>/dev/null; then
    print_success "TypeScript type checking passed"
else
    print_warning "TypeScript type checking failed. Continuing with tests..."
fi

# Run linting
print_status "Running linting..."
if pnpm run lint &>/dev/null; then
    print_success "Linting passed"
else
    print_warning "Linting failed. Continuing with tests..."
fi

print_success "Test environment setup completed!"

# Ask user what tests to run
echo ""
echo "Select test type to run:"
echo "1) Unit tests only"
echo "2) Integration tests only" 
echo "3) All tests"
echo "4) Tests with coverage"
echo "5) Watch mode"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        print_status "Running unit tests..."
        pnpm run test:unit
        ;;
    2)
        print_status "Running integration tests..."
        pnpm run test:integration
        ;;
    3)
        print_status "Running all tests..."
        pnpm test
        ;;
    4)
        print_status "Running tests with coverage..."
        pnpm run test:coverage
        ;;
    5)
        print_status "Starting test watch mode..."
        pnpm run test:watch
        ;;
    6)
        print_status "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice. Running all tests by default..."
        pnpm test
        ;;
esac

print_success "Test execution completed!"

# Show test results summary
echo ""
echo "📊 Test Summary:"
echo "- Environment: $([ -f .env.test ] && echo "✅ Configured" || echo "❌ Missing")"
echo "- Database: $(command -v psql &>/dev/null && echo "✅ PostgreSQL available" || echo "⚠️ Fallback mode")"
echo "- Redis: $(command -v redis-cli &>/dev/null && echo "✅ Available" || echo "⚠️ Not available")"
echo "- TypeScript: $(pnpm run typecheck &>/dev/null && echo "✅ Types valid" || echo "⚠️ Type errors")"

echo ""
print_success "Test setup script completed successfully! 🎉"
