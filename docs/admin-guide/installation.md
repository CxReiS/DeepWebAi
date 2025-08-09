# DeepWebAI Admin Guide - Installation & Deployment

This guide covers the complete installation and deployment process for DeepWebAI platform.

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher
- **PostgreSQL**: 14+ (or Neon serverless)
- **Redis**: 6+ (for caching)
- **Docker**: 20+ (optional, for containerized deployment)

### External Services
- **Neon Database**: Serverless PostgreSQL
- **Ably**: Real-time messaging
- **Sentry**: Error tracking (optional)
- **AI Providers**: OpenAI, Anthropic, Google, DeepSeek

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/CxReiS/DeepWebAi.git
cd DeepWebAi
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Configuration
Copy environment template:
```bash
cp .env.example .env
```

### Required Environment Variables

#### Database Configuration
```env
# Neon Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
NEON_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

#### Authentication
```env
# JWT Secrets
JWT_SECRET="your-jwt-secret-here"
LUCIA_SECRET="your-lucia-secret-here"

# Session Configuration
SESSION_COOKIE_NAME="deepwebai-session"
SESSION_MAX_AGE=604800
```

#### AI Provider APIs
```env
# OpenAI
OPENAI_API_KEY="sk-..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="sk-ant-..."

# Google (Gemini)
GEMINI_API_KEY="..."

# DeepSeek
DEEPSEEK_API_KEY="..."
```

#### Real-time Services
```env
# Ably Real-time
ABLY_API_KEY="..."
ABLY_APP_ID="..."
```

#### Caching & Storage
```env
# Redis (optional)
REDIS_URL="redis://localhost:6379"

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=52428800
```

#### Monitoring & Analytics
```env
# Sentry (optional)
SENTRY_DSN="https://..."
SENTRY_ENVIRONMENT="production"

# Analytics
ANALYTICS_ENABLED=true
```

### 4. Database Setup
```bash
# Run migrations
pnpm run db:migrate

# Seed initial data
pnpm run db:seed
```

### 5. Build Application
```bash
pnpm build
```

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Production Build
```bash
NODE_ENV=production pnpm build
```

#### 2. Start Services
```bash
# Start backend
cd packages/backend
pnpm start

# Start frontend (separate terminal)
cd packages/frontend
pnpm preview --host 0.0.0.0 --port 3000
```

#### 3. Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

#### 1. Build Images
```bash
# Build backend
docker build -f docker/backend.Dockerfile -t deepwebai-backend .

# Build frontend
docker build -f docker/frontend.Dockerfile -t deepwebai-frontend .
```

#### 2. Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 3: Cloud Deployment (Vercel/Netlify)

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd packages/frontend
vercel --prod
```

#### Backend (Railway/Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

## Configuration Management

### Feature Flags Configuration
```env
# Feature Flags Provider
FEATURE_FLAGS_PROVIDER="database"  # or "growthbook"
GROWTHBOOK_API_KEY="..."
```

### Security Configuration
```env
# CORS
CORS_ORIGIN="https://yourapp.com"
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
SECURITY_HEADERS_ENABLED=true
```

### Performance Configuration
```env
# Caching
CACHE_TTL=3600
CACHE_PROVIDER="redis"  # or "memory"

# File Processing
OCR_ENABLED=true
OCR_LANGUAGE="eng"
MAX_PROCESSING_TIME=300000
```

## SSL/TLS Setup

### Using Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Health Checks & Monitoring

### Application Health
```bash
# Check health endpoint
curl https://yourapp.com/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "services": {
    "ai-gateway": "healthy",
    "file-processing": "healthy"
  }
}
```

### Log Management
```bash
# View application logs
pm2 logs

# Structured logging
tail -f /var/log/deepwebai/app.log | jq
```

### Monitoring Setup
1. **Sentry**: Error tracking and performance monitoring
2. **Prometheus + Grafana**: Metrics and dashboards
3. **Uptime monitoring**: Pingdom, UptimeRobot
4. **Log aggregation**: ELK stack or similar

## Backup Configuration

### Database Backups
```bash
# Daily backup script
#!/bin/bash
pg_dump $DATABASE_URL > backups/db-$(date +%Y%m%d).sql
```

### File Storage Backups
```bash
# Sync uploads to S3
aws s3 sync ./uploads s3://deepwebai-backups/uploads/
```

## Troubleshooting

### Common Issues

#### Database Connection
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database exists and user has permissions

#### Build Failures
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables are set

#### Performance Issues
- Enable Redis caching
- Optimize database queries
- Configure CDN for static assets

### Logs to Check
- Application logs: `/var/log/deepwebai/`
- System logs: `/var/log/syslog`
- Nginx logs: `/var/log/nginx/`
- Database logs: Check Neon dashboard

## Security Checklist

- [ ] All secrets properly configured
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Security headers enabled
- [ ] Database access restricted
- [ ] File upload validation active
- [ ] MFA enforced for admin accounts
- [ ] Regular security updates applied

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Health checks working
- [ ] CDN configured
- [ ] Domain DNS configured
- [ ] Performance testing completed
- [ ] Security audit passed

For additional support, contact: admin@deepwebai.com
