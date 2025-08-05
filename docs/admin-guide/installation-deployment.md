# Installation and Deployment Guide

Comprehensive guide for installing and deploying the DeepWebAI platform in various environments.

## System Requirements

### Minimum Requirements

**Hardware:**
```
CPU: 4 cores, 2.4 GHz
RAM: 8 GB minimum, 16 GB recommended
Storage: 50 GB SSD for application
Network: 100 Mbps bandwidth
```

**Software:**
```
Node.js: 18.x or 20.x LTS
pnpm: 8.x or higher
PostgreSQL: 14.x or higher
Redis: 6.x or higher (optional, for caching)
Docker: 20.x or higher (for containerized deployment)
```

**Supported Operating Systems:**
- Ubuntu 20.04 LTS or higher
- CentOS 8 or higher
- Debian 11 or higher
- Windows Server 2019 or higher
- macOS 12 or higher (development only)

### Production Requirements

**Hardware:**
```
CPU: 8+ cores, 3.0+ GHz
RAM: 32 GB minimum, 64 GB recommended
Storage: 500 GB+ NVMe SSD
Network: 1 Gbps+ bandwidth
Load Balancer: Nginx or similar
```

**Infrastructure:**
```
Database: PostgreSQL 15+ with connection pooling
Cache: Redis Cluster for high availability
CDN: CloudFlare or AWS CloudFront
Monitoring: Prometheus + Grafana
Logging: ELK Stack or similar
```

## Installation Methods

### Docker Deployment (Recommended)

**Prerequisites:**
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Quick Start:**
```bash
# Clone repository
git clone https://github.com/yourusername/deepwebai.git
cd deepwebai

# Copy environment configuration
cp .env.example .env
nano .env  # Configure environment variables

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

**Docker Compose Configuration:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: deepwebai
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Manual Installation

**System Preparation:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl git build-essential python3-pip

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis (optional)
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Application Setup:**
```bash
# Clone and setup application
git clone https://github.com/yourusername/deepwebai.git
cd deepwebai

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
nano .env

# Setup database
pnpm db:setup
pnpm db:migrate

# Build application
pnpm build

# Start application
pnpm start
```

### Kubernetes Deployment

**Namespace Setup:**
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: deepwebai
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: deepwebai-config
  namespace: deepwebai
data:
  NODE_ENV: "production"
  DATABASE_URL: "postgresql://user:pass@postgres:5432/deepwebai"
  REDIS_URL: "redis://redis:6379"
```

**Application Deployment:**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deepwebai-app
  namespace: deepwebai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: deepwebai
  template:
    metadata:
      labels:
        app: deepwebai
    spec:
      containers:
      - name: deepwebai
        image: deepwebai:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: deepwebai-config
        - secretRef:
            name: deepwebai-secrets
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: deepwebai-service
  namespace: deepwebai
spec:
  selector:
    app: deepwebai
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Database Setup:**
```yaml
# postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: deepwebai
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: "deepwebai"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: deepwebai-secrets
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: deepwebai-secrets
              key: DB_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

## Environment Configuration

### Database Setup

**PostgreSQL Configuration:**
```sql
-- Create database and user
CREATE DATABASE deepwebai;
CREATE USER deepwebai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE deepwebai TO deepwebai_user;

-- Configure PostgreSQL settings
-- Edit postgresql.conf
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
```

**Database Migration:**
```bash
# Run initial migration
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Verify setup
pnpm db:status
```

### Redis Configuration

**Redis Setup:**
```bash
# Edit redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis
```

**Connection Test:**
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Test from application
node -e "const redis = require('ioredis'); const client = new redis('redis://localhost:6379'); client.ping().then(console.log).finally(() => client.disconnect());"
```

## SSL/TLS Configuration

### Let's Encrypt Setup

**Certbot Installation:**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Nginx SSL Configuration:**
```nginx
# nginx.conf
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## High Availability Setup

### Load Balancer Configuration

**Nginx Load Balancer:**
```nginx
# upstream.conf
upstream deepwebai_backend {
    least_conn;
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://deepwebai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://deepwebai_backend;
        proxy_method GET;
    }
}
```

**Database High Availability:**
```yaml
# PostgreSQL Primary-Replica Setup
# Primary server configuration
# postgresql.conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
synchronous_commit = on

# Replica server configuration
# recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary_server port=5432 user=replicator password=secret'
trigger_file = '/tmp/postgresql.trigger'
```

### Health Checks and Monitoring

**Health Check Endpoints:**
```javascript
// Health check implementation
app.get('/health', async (req, res) => {
  try {
    // Database check
    await db.query('SELECT 1');
    
    // Redis check
    await redis.ping();
    
    // AI providers check
    const providerStatus = await checkAIProviders();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        aiProviders: providerStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

**Monitoring Setup:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
```

## Backup and Recovery

### Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/var/backups/deepwebai"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="deepwebai"
DB_USER="deepwebai_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# File system backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/lib/deepwebai/uploads

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/database/
aws s3 cp $BACKUP_DIR/files_backup_$DATE.tar.gz s3://your-backup-bucket/files/
```

**Cron Schedule:**
```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-db.sh
```

### Disaster Recovery

**Recovery Procedures:**
```bash
# Database Recovery
gunzip < db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U deepwebai_user deepwebai

# File Recovery
tar -xzf files_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Application Recovery
cd /opt/deepwebai
git pull origin main
pnpm install
pnpm build
pnpm db:migrate
systemctl restart deepwebai
```

## Performance Optimization

### Application Tuning

**Node.js Optimization:**
```bash
# Environment variables for production
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=32

# PM2 Configuration
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'deepwebai',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Database Optimization:**
```sql
-- PostgreSQL performance tuning
-- postgresql.conf
shared_buffers = 25% of RAM
effective_cache_size = 75% of RAM
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = RAM / max_connections / 4
maintenance_work_mem = RAM / 16

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_conversations_user_id ON conversations(user_id);
CREATE INDEX CONCURRENTLY idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX CONCURRENTLY idx_files_user_id ON files(user_id);
```

### Caching Strategy

**Redis Caching:**
```javascript
// Cache configuration
const cacheConfig = {
  ai_responses: {
    ttl: 3600, // 1 hour
    prefix: 'ai_resp:'
  },
  user_sessions: {
    ttl: 86400, // 24 hours
    prefix: 'session:'
  },
  file_metadata: {
    ttl: 7200, // 2 hours
    prefix: 'file_meta:'
  }
};
```

**CDN Configuration:**
```nginx
# Static asset caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}

# API response caching
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Security Hardening

### System Security

**Firewall Configuration:**
```bash
# UFW Setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban Setup
sudo apt install fail2ban
# Edit /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 6
```

**Application Security:**
```javascript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## Troubleshooting Deployment

### Common Issues

**Database Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Reset connections
sudo systemctl restart postgresql
```

**Memory Issues:**
```bash
# Monitor memory usage
free -h
htop

# Check Node.js heap usage
node --expose-gc app.js &
kill -USR2 $!  # Trigger heap dump
```

**Performance Issues:**
```bash
# Check system performance
iostat -x 1
sar -u 1
netstat -i

# Application performance
pnpm run analyze-bundle
pnpm run profile
```

### Log Analysis

**Centralized Logging:**
```bash
# Install ELK Stack
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:7.14.0
docker run -d --name kibana -p 5601:5601 --link elasticsearch:elasticsearch kibana:7.14.0
docker run -d --name logstash -p 5044:5044 --link elasticsearch:elasticsearch logstash:7.14.0
```

**Log Rotation:**
```bash
# /etc/logrotate.d/deepwebai
/var/log/deepwebai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deepwebai deepwebai
    postrotate
        systemctl reload deepwebai
    endscript
}
```

This comprehensive installation and deployment guide provides everything needed to successfully deploy DeepWebAI in various environments, from development to enterprise production setups.
