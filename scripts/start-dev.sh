#!/bin/bash

# Development startup script for DeepWebAI
# This script starts all services in development mode

set -e

echo "🚀 Starting DeepWebAI development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check environment
print_status "Checking development environment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

print_success "Environment checks passed"

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "Installing dependencies..."
    pnpm install
fi

# Setup environment file
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found. Creating from example..."
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration"
    else
        print_error ".env.example not found. Please create .env manually."
    fi
fi

# Check backend environment
if [[ ! -f "packages/backend/.env" ]]; then
    print_warning "Backend .env not found. Creating from example..."
    if [[ -f "packages/backend/.env.example" ]]; then
        cp packages/backend/.env.example packages/backend/.env
        print_warning "Please edit packages/backend/.env with your configuration"
    fi
fi

# Health check function
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-30}
    
    print_status "Checking $service_name..."
    
    for i in $(seq 1 $timeout); do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        if [[ $i -eq $timeout ]]; then
            print_warning "$service_name health check timed out"
            return 1
        fi
        
        sleep 1
    done
}

# Start services based on user choice
echo ""
echo "Select startup mode:"
echo "1) Full development (Backend + Frontend)"
echo "2) Backend only"
echo "3) Frontend only"
echo "4) Check services health"
echo "5) Run tests"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        print_status "Starting full development environment..."
        
        # Start backend and frontend concurrently
        print_status "Starting backend and frontend..."
        pnpm dev &
        
        # Wait for services to start
        sleep 5
        
        # Health checks
        check_service "Backend" "http://localhost:3001/health"
        check_service "Frontend" "http://localhost:3000"
        
        print_success "Development environment started!"
        print_status "Backend: http://localhost:3001"
        print_status "Frontend: http://localhost:3000"
        print_status "API Docs: http://localhost:3001/docs"
        
        # Keep script running
        wait
        ;;
        
    2)
        print_status "Starting backend only..."
        cd packages/backend
        pnpm dev &
        
        sleep 3
        check_service "Backend" "http://localhost:3001/health"
        
        print_success "Backend started!"
        print_status "Backend: http://localhost:3001"
        print_status "Health: http://localhost:3001/health"
        print_status "Metrics: http://localhost:3001/metrics"
        
        wait
        ;;
        
    3)
        print_status "Starting frontend only..."
        cd packages/frontend
        pnpm dev &
        
        sleep 3
        check_service "Frontend" "http://localhost:3000"
        
        print_success "Frontend started!"
        print_status "Frontend: http://localhost:3000"
        
        wait
        ;;
        
    4)
        print_status "Checking services health..."
        
        check_service "Backend" "http://localhost:3001/health" 5
        check_service "Frontend" "http://localhost:3000" 5
        
        # Additional checks
        print_status "Checking database connectivity..."
        if curl -f -s "http://localhost:3001/health" | grep -q "connected"; then
            print_success "Database is connected"
        else
            print_warning "Database connection issue"
        fi
        
        print_status "Health check completed"
        ;;
        
    5)
        print_status "Running tests..."
        ./scripts/test-setup.sh
        ;;
        
    6)
        print_status "Exiting..."
        exit 0
        ;;
        
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

print_success "Development script completed! 🎉"
