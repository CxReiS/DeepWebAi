# DeepWebAI Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps diagnose and resolve common issues in the DeepWebAI platform. Issues are organized by category with step-by-step resolution instructions.

---

## Quick Diagnosis Checklist

### 🔍 First Steps for Any Issue

1. **Check System Status**
   ```bash
   # Check application health
   curl -f http://localhost:3001/health
   
   # Check service status
   pnpm health:check
   ```

2. **Review Recent Logs**
   ```bash
   # Backend logs
   tail -f packages/backend/logs/app.log
   
   # Frontend logs (browser console)
   # Docker logs
   docker logs deepwebai-backend
   ```

3. **Verify Environment**
   ```bash
   # Check environment variables
   node -e "console.log(process.env.DATABASE_URL ? 'DB connected' : 'DB missing')"
   
   # Check dependencies
   pnpm run health:dependencies
   ```

---

## Authentication Issues

### 🔐 Login Problems

#### Issue: Cannot log in with email/password

**Symptoms:**
- "Invalid credentials" error
- Login form not responding
- Infinite loading on login

**Diagnosis Steps:**
```bash
# 1. Check user exists in database
psql $DATABASE_URL -c "SELECT id, email, created_at FROM users WHERE email = 'user@example.com';"

# 2. Verify password hash
node -e "
const bcrypt = require('bcrypt');
const hash = 'hash_from_database';
const password = 'user_password';
console.log(bcrypt.compareSync(password, hash));
"

# 3. Check Auth.js configuration
grep -r "NEXTAUTH_SECRET" .env
```

**Common Solutions:**

1. **Reset Password**
   ```bash
   # Generate password reset token
   pnpm run auth:reset-password user@example.com
   ```

2. **Clear Session Data**
   ```bash
   # Clear Redis sessions
   redis-cli FLUSHDB
   
   # Clear browser storage
   # In browser console:
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Check Environment Variables**
   ```bash
   # Verify required variables
   echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."
   echo "NEXTAUTH_URL: $NEXTAUTH_URL"
   echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
   ```

#### Issue: OAuth authentication fails

**Symptoms:**
- Redirect loop during OAuth
- "OAuth error" message
- Provider callback fails

**Diagnosis Steps:**
```bash
# 1. Verify OAuth provider configuration
curl -H "Accept: application/json" \
  "https://api.github.com/applications/CLIENT_ID/token" \
  -u "CLIENT_ID:CLIENT_SECRET"

# 2. Check callback URL configuration
echo "Callback URL should be: $NEXTAUTH_URL/api/auth/callback/github"

# 3. Review OAuth provider logs
grep "oauth" packages/backend/logs/app.log | tail -20
```

**Common Solutions:**

1. **Update Callback URLs**
   - GitHub: `https://yourdomain.com/api/auth/callback/github`
   - Discord: `https://yourdomain.com/api/auth/callback/discord`

2. **Verify Client Credentials**
   ```bash
   # Test GitHub OAuth
   curl -X POST "https://github.com/login/oauth/access_token" \
     -H "Accept: application/json" \
     -d "client_id=$GITHUB_CLIENT_ID" \
     -d "client_secret=$GITHUB_CLIENT_SECRET" \
     -d "code=test"
   ```

3. **Clear OAuth State**
   ```bash
   # Clear OAuth state from Redis
   redis-cli DEL "oauth:state:*"
   ```

### 🔐 Multi-Factor Authentication (MFA) Issues

#### Issue: TOTP codes not working

**Symptoms:**
- "Invalid code" error
- TOTP app shows different code
- Time synchronization issues

**Diagnosis Steps:**
```bash
# 1. Check server time
date

# 2. Verify TOTP secret in database
psql $DATABASE_URL -c "SELECT totp_secret FROM users WHERE id = 'user_id';"

# 3. Test TOTP generation
node -e "
const speakeasy = require('speakeasy');
const token = speakeasy.totp({
  secret: 'USER_TOTP_SECRET',
  encoding: 'base32'
});
console.log('Current token:', token);
"
```

**Common Solutions:**

1. **Synchronize Time**
   ```bash
   # On Linux/macOS
   sudo ntpdate -s time.nist.gov
   
   # On Windows
   w32tm /resync
   ```

2. **Regenerate TOTP Secret**
   ```bash
   # Reset TOTP for user
   pnpm run auth:reset-totp user@example.com
   ```

3. **Use Backup Codes**
   ```bash
   # Generate new backup codes
   pnpm run auth:generate-backup-codes user@example.com
   ```

---

## AI Gateway Issues

### 🤖 AI Provider Problems

#### Issue: AI responses are slow or timing out

**Symptoms:**
- Long response times (>30 seconds)
- Timeout errors
- Inconsistent performance

**Diagnosis Steps:**
```bash
# 1. Test provider connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/models"

# 2. Check provider health
curl http://localhost:3001/api/ai/providers

# 3. Monitor AI gateway logs
grep "ai-gateway" packages/backend/logs/app.log | tail -20
```

**Common Solutions:**

1. **Check API Keys**
   ```bash
   # Verify OpenAI key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     "https://api.openai.com/v1/usage"
   
   # Verify Anthropic key
   curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     "https://api.anthropic.com/v1/messages" \
     -d '{"model":"claude-3-sonnet-20240229","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
   ```

2. **Test Provider Fallback**
   ```bash
   # Force failover test
   curl -X POST http://localhost:3001/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"test"}],"provider":"invalid"}'
   ```

3. **Reset Provider Health Status**
   ```bash
   # Clear provider health cache
   redis-cli DEL "ai:provider:health:*"
   ```

#### Issue: Specific AI provider not working

**Symptoms:**
- Single provider consistently fails
- Error messages from specific provider
- Provider marked as unhealthy

**Provider-Specific Diagnostics:**

**OpenAI Issues:**
```bash
# Check quota and usage
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/usage?date=$(date +%Y-%m-%d)"

# Test specific model
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  "https://api.openai.com/v1/chat/completions" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}],"max_tokens":5}'
```

**Anthropic Issues:**
```bash
# Check account status
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  "https://api.anthropic.com/v1/account"

# Test Claude model
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  "https://api.anthropic.com/v1/messages" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":5,"messages":[{"role":"user","content":"test"}]}'
```

**Local Llama Issues:**
```bash
# Check Ollama service
curl http://localhost:11434/api/tags

# Test model
curl http://localhost:11434/api/generate \
  -d '{"model":"llama2","prompt":"test","stream":false}'

# Check GPU availability
nvidia-smi  # For NVIDIA GPUs
```

### 🚀 Streaming Issues

#### Issue: Streaming responses not working

**Symptoms:**
- No real-time updates
- Complete response arrives at once
- WebSocket connection failures

**Diagnosis Steps:**
```bash
# 1. Test WebSocket connection
curl --include \
  --no-buffer \
  --header "Connection: Upgrade" \
  --header "Upgrade: websocket" \
  --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  --header "Sec-WebSocket-Version: 13" \
  http://localhost:3001/ws/chat

# 2. Check streaming endpoint
curl -N -H "Accept: text/event-stream" \
  -H "Cache-Control: no-cache" \
  -X POST http://localhost:3001/api/ai/chat/stream \
  -d '{"messages":[{"role":"user","content":"test"}],"stream":true}'

# 3. Review streaming logs
grep "stream" packages/backend/logs/app.log | tail -10
```

**Common Solutions:**

1. **Verify Browser Support**
   ```javascript
   // Test in browser console
   if (typeof EventSource !== "undefined") {
     console.log("Server-Sent Events supported");
   } else {
     console.log("SSE not supported");
   }
   ```

2. **Check Proxy Configuration**
   ```nginx
   # Nginx configuration for streaming
   location /api/ai/chat/stream {
     proxy_pass http://backend;
     proxy_buffering off;
     proxy_cache off;
     proxy_set_header Connection '';
     proxy_http_version 1.1;
     chunked_transfer_encoding off;
   }
   ```

3. **Test Network Connectivity**
   ```bash
   # Check for network buffering
   curl -N --limit-rate 1k http://localhost:3001/api/ai/chat/stream
   ```

---

## File Processing Issues

### 📁 File Upload Problems

#### Issue: File uploads failing

**Symptoms:**
- Upload progress stops
- "File too large" errors
- Upload timeouts

**Diagnosis Steps:**
```bash
# 1. Check file size limits
grep "MAX_FILE_SIZE" .env

# 2. Test upload endpoint
curl -X POST http://localhost:3001/api/files/upload \
  -F "file=@test-small.pdf" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 3. Check disk space
df -h

# 4. Monitor upload logs
tail -f packages/backend/logs/file-upload.log
```

**Common Solutions:**

1. **Increase File Size Limits**
   ```bash
   # Update environment variables
   echo "MAX_FILE_SIZE=100MB" >> .env
   
   # Update Nginx configuration
   # client_max_body_size 100M;
   ```

2. **Check Storage Space**
   ```bash
   # Free up disk space
   docker system prune -f
   
   # Clean temporary files
   rm -rf /tmp/uploads/*
   ```

3. **Test Network Upload**
   ```bash
   # Test with smaller file
   echo "test content" > test-small.txt
   curl -X POST http://localhost:3001/api/files/upload \
     -F "file=@test-small.txt"
   ```

#### Issue: File processing fails

**Symptoms:**
- Processing stuck in queue
- OCR not extracting text
- Corrupted output files

**Diagnosis Steps:**
```bash
# 1. Check processing queue
redis-cli LLEN "file:processing:queue"

# 2. Test file processor
node -e "
const { FileProcessor } = require('./packages/file-processing');
const processor = new FileProcessor();
processor.processFile('test.pdf').then(console.log);
"

# 3. Check OCR dependencies
tesseract --version
```

**Common Solutions:**

1. **Restart Processing Queue**
   ```bash
   # Clear stuck jobs
   redis-cli DEL "file:processing:queue"
   
   # Restart processor
   pnpm --filter=file-processing restart
   ```

2. **Install OCR Dependencies**
   ```bash
   # Install Tesseract (Ubuntu)
   sudo apt-get install tesseract-ocr tesseract-ocr-eng
   
   # Install language packs
   sudo apt-get install tesseract-ocr-spa tesseract-ocr-fra
   ```

3. **Test File Processing**
   ```bash
   # Test PDF processing
   curl -X POST http://localhost:3001/api/files/test-file/process \
     -H "Content-Type: application/json" \
     -d '{"type":"text_extraction"}'
   ```

---

## Database Issues

### 💾 Connection Problems

#### Issue: Database connection errors

**Symptoms:**
- "Connection refused" errors
- Timeout during queries
- Pool exhaustion warnings

**Diagnosis Steps:**
```bash
# 1. Test direct connection
psql $DATABASE_URL -c "SELECT version();"

# 2. Check connection pool
curl http://localhost:3001/api/health/db

# 3. Monitor database logs
# Check Neon dashboard or local PostgreSQL logs
```

**Common Solutions:**

1. **Verify Connection String**
   ```bash
   # Test connection components
   node -e "
   const url = new URL(process.env.DATABASE_URL);
   console.log('Host:', url.hostname);
   console.log('Port:', url.port);
   console.log('Database:', url.pathname.slice(1));
   "
   ```

2. **Adjust Connection Pool**
   ```bash
   # Update pool configuration
   echo "DATABASE_POOL_SIZE=20" >> .env
   echo "DATABASE_POOL_TIMEOUT=30000" >> .env
   ```

3. **Check Network Connectivity**
   ```bash
   # Test network connection
   telnet $DB_HOST $DB_PORT
   
   # Check SSL requirements
   psql "$DATABASE_URL?sslmode=require" -c "SELECT 1;"
   ```

### 🔄 Migration Issues

#### Issue: Database migrations failing

**Symptoms:**
- Migration timeout errors
- Schema inconsistencies
- Foreign key constraint violations

**Diagnosis Steps:**
```bash
# 1. Check migration status
pnpm db:migrate:status

# 2. Check for locks
psql $DATABASE_URL -c "SELECT * FROM pg_locks WHERE NOT granted;"

# 3. Verify schema
psql $DATABASE_URL -c "\dt"  # List tables
```

**Common Solutions:**

1. **Reset Migration State**
   ```bash
   # Reset migrations (WARNING: Data loss)
   pnpm db:migrate:reset
   
   # Apply migrations step by step
   pnpm db:migrate:up --step=1
   ```

2. **Resolve Schema Conflicts**
   ```bash
   # Check for conflicting schemas
   psql $DATABASE_URL -c "
   SELECT schemaname, tablename 
   FROM pg_tables 
   WHERE tablename LIKE '%_migration%';
   "
   ```

3. **Manual Migration Fix**
   ```sql
   -- Connect to database and fix manually
   \c your_database
   
   -- Check migration table
   SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;
   
   -- Mark migration as applied (if needed)
   UPDATE _prisma_migrations 
   SET finished_at = NOW() 
   WHERE migration_name = 'failed_migration_name';
   ```

---

## Caching Issues

### 🗄️ Cache Performance Problems

#### Issue: Low cache hit rates

**Symptoms:**
- Cache hit rate below 70%
- Slow response times
- High database load

**Diagnosis Steps:**
```bash
# 1. Check cache statistics
curl http://localhost:3001/api/cache/stats

# 2. Monitor cache patterns
redis-cli MONITOR | head -20

# 3. Analyze cache usage
redis-cli INFO memory
```

**Common Solutions:**

1. **Optimize Cache Configuration**
   ```bash
   # Increase cache TTL for stable data
   redis-cli CONFIG SET maxmemory-policy allkeys-lru
   
   # Adjust memory allocation
   redis-cli CONFIG SET maxmemory 2gb
   ```

2. **Review Cache Strategies**
   ```javascript
   // Update cache strategy in code
   const cacheConfig = {
     'user:profile': { ttl: 3600 }, // 1 hour
     'ai:response': { ttl: 1800 },  // 30 minutes
     'file:content': { ttl: 7200 }  // 2 hours
   };
   ```

3. **Warm Critical Caches**
   ```bash
   # Preload important data
   curl -X POST http://localhost:3001/api/cache/warm \
     -d '{"patterns":["user:*","session:*"]}'
   ```

#### Issue: Cache invalidation problems

**Symptoms:**
- Stale data being served
- Inconsistent responses
- Cache growing too large

**Diagnosis Steps:**
```bash
# 1. Check cache keys
redis-cli KEYS "*" | head -20

# 2. Monitor invalidation patterns
grep "cache:invalidate" packages/backend/logs/app.log

# 3. Check memory usage
redis-cli INFO memory | grep used_memory
```

**Common Solutions:**

1. **Manual Cache Clear**
   ```bash
   # Clear specific patterns
   redis-cli EVAL "return redis.call('del', unpack(redis.call('keys', ARGV[1])))" 0 "user:123:*"
   
   # Clear all cache
   redis-cli FLUSHALL
   ```

2. **Implement Smart Invalidation**
   ```javascript
   // Add cache tags for better invalidation
   await cache.set('user:123:profile', userData, {
     ttl: 3600,
     tags: ['user:123', 'profile']
   });
   
   // Invalidate by tags
   await cache.invalidateByTags(['user:123']);
   ```

3. **Monitor Cache Growth**
   ```bash
   # Set up cache monitoring
   redis-cli --latency -i 1
   ```

---

## Performance Issues

### 🐌 Slow Response Times

#### Issue: API responses are slow

**Symptoms:**
- Response times > 1 second
- High server load
- User complaints about slowness

**Diagnosis Steps:**
```bash
# 1. Profile API endpoints
curl -w "@curl-format.txt" http://localhost:3001/api/slow-endpoint

# 2. Check database query performance
psql $DATABASE_URL -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;
"

# 3. Monitor system resources
top -p $(pgrep -f "node.*backend")
```

**Common Solutions:**

1. **Optimize Database Queries**
   ```sql
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_user_id ON files(user_id);
   
   -- Analyze query plans
   EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
   ```

2. **Implement Response Caching**
   ```javascript
   // Add caching middleware
   app.get('/api/expensive-operation', cacheMiddleware(300), handler);
   ```

3. **Use Connection Pooling**
   ```bash
   # Optimize connection pool
   echo "DATABASE_POOL_SIZE=20" >> .env
   echo "DATABASE_POOL_MIN=5" >> .env
   ```

### 💾 Memory Issues

#### Issue: High memory usage or memory leaks

**Symptoms:**
- Memory usage continuously growing
- Out of memory errors
- Garbage collection pressure

**Diagnosis Steps:**
```bash
# 1. Monitor memory usage
node --inspect packages/backend/src/server.js &
# Open chrome://inspect in browser

# 2. Check for memory leaks
node --trace-warnings --trace-uncaught packages/backend/src/server.js

# 3. Analyze heap dump
node -e "
const v8 = require('v8');
const fs = require('fs');
const heapSnapshot = v8.writeHeapSnapshot();
console.log('Heap snapshot written to', heapSnapshot);
"
```

**Common Solutions:**

1. **Identify Memory Leaks**
   ```javascript
   // Add memory monitoring
   setInterval(() => {
     const usage = process.memoryUsage();
     console.log('Memory usage:', {
       rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
       heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
       heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB'
     });
   }, 60000);
   ```

2. **Optimize Garbage Collection**
   ```bash
   # Run with optimized GC settings
   node --max-old-space-size=4096 \
        --optimize-for-size \
        packages/backend/src/server.js
   ```

3. **Clear References**
   ```javascript
   // Properly clean up event listeners
   process.removeAllListeners('SIGTERM');
   
   // Clear intervals and timeouts
   clearInterval(intervalId);
   clearTimeout(timeoutId);
   ```

---

## Development Environment Issues

### 🛠️ Setup Problems

#### Issue: Development server won't start

**Symptoms:**
- "Port already in use" errors
- Module resolution failures
- Environment variable errors

**Diagnosis Steps:**
```bash
# 1. Check port usage
lsof -i :3000  # Frontend port
lsof -i :3001  # Backend port

# 2. Verify dependencies
pnpm run check:dependencies

# 3. Check environment setup
node scripts/check-env.js
```

**Common Solutions:**

1. **Kill Existing Processes**
   ```bash
   # Kill processes on ports
   kill $(lsof -ti:3000)
   kill $(lsof -ti:3001)
   
   # Or use different ports
   PORT=3002 pnpm --filter=frontend dev
   ```

2. **Reinstall Dependencies**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   pnpm store prune
   pnpm install
   ```

3. **Fix Environment Variables**
   ```bash
   # Copy example environment
   cp .env.example .env
   
   # Generate required secrets
   node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   ```

### 🧪 Testing Issues

#### Issue: Tests failing unexpectedly

**Symptoms:**
- Test timeouts
- Database connection errors in tests
- Inconsistent test results

**Diagnosis Steps:**
```bash
# 1. Run tests with verbose output
pnpm test -- --verbose

# 2. Check test database
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 3. Run single test file
pnpm vitest run tests/unit/auth.test.ts
```

**Common Solutions:**

1. **Setup Test Database**
   ```bash
   # Create test database
   createdb deepwebai_test
   
   # Run test migrations
   DATABASE_URL=$TEST_DATABASE_URL pnpm db:migrate
   ```

2. **Fix Test Environment**
   ```bash
   # Set test environment
   export NODE_ENV=test
   export DATABASE_URL=$TEST_DATABASE_URL
   
   # Clear test cache
   rm -rf node_modules/.cache/vitest
   ```

3. **Isolate Test Issues**
   ```bash
   # Run specific test suites
   pnpm test:auth
   pnpm test:files
   pnpm test:ai
   ```

---

## Deployment Issues

### 🚀 Production Problems

#### Issue: Application crashes in production

**Symptoms:**
- Unexpected exits
- 502 Bad Gateway errors
- Health check failures

**Diagnosis Steps:**
```bash
# 1. Check application logs
docker logs deepwebai-backend --tail 100

# 2. Check system resources
docker stats deepwebai-backend

# 3. Test health endpoint
curl -f http://localhost:3001/health
```

**Common Solutions:**

1. **Increase Resource Limits**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '1.0'
   ```

2. **Fix Environment Configuration**
   ```bash
   # Check production environment
   docker exec deepwebai-backend env | grep DATABASE_URL
   
   # Update production secrets
   docker secret create db_password new_password.txt
   ```

3. **Implement Health Checks**
   ```dockerfile
   # Add to Dockerfile
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD curl -f http://localhost:3001/health || exit 1
   ```

#### Issue: SSL/HTTPS problems

**Symptoms:**
- Certificate errors
- Mixed content warnings
- HTTPS redirects not working

**Diagnosis Steps:**
```bash
# 1. Check certificate validity
openssl x509 -in certificate.crt -text -noout

# 2. Test SSL connection
openssl s_client -connect yourdomain.com:443

# 3. Check redirect configuration
curl -I http://yourdomain.com
```

**Common Solutions:**

1. **Renew SSL Certificate**
   ```bash
   # Using Let's Encrypt
   certbot renew --dry-run
   certbot renew
   
   # Restart web server
   systemctl reload nginx
   ```

2. **Fix HTTPS Configuration**
   ```nginx
   # Nginx configuration
   server {
     listen 80;
     server_name yourdomain.com;
     return 301 https://$server_name$request_uri;
   }
   
   server {
     listen 443 ssl http2;
     server_name yourdomain.com;
     
     ssl_certificate /path/to/certificate.crt;
     ssl_certificate_key /path/to/private.key;
   }
   ```

3. **Update Security Headers**
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   add_header X-Content-Type-Options nosniff always;
   add_header X-Frame-Options DENY always;
   ```

---

## Getting Help

### 📞 Support Channels

#### Self-Service Resources
1. **Documentation**
   - [API Reference](api-reference.md)
   - [Developer Guide](developer_guide/README.md)
   - [User Guide](user_guide/README.md)

2. **Status Pages**
   - Service Status: https://status.deepwebai.com
   - Provider Status: Built-in `/health` endpoint

3. **Community Resources**
   - GitHub Issues: [Report bugs and feature requests](https://github.com/CxReiS/DeepWebAi/issues)
   - Discord Community: Real-time help and discussions
   - Stack Overflow: Technical questions with `deepwebai` tag

#### Professional Support
1. **Email Support**: support@deepwebai.com
   - Response time: 24 hours (Premium: 4 hours)
   - Include: Error logs, reproduction steps, environment details

2. **Enterprise Support**
   - Dedicated Slack channel
   - Phone support during business hours
   - On-site troubleshooting (availability varies)

### 🐛 Bug Reporting

#### Effective Bug Reports
Include the following information:

1. **Environment Details**
   ```bash
   # Generate environment report
   node scripts/generate-debug-info.js
   ```

2. **Reproduction Steps**
   - Step-by-step instructions
   - Expected vs. actual behavior
   - Screenshots or videos if applicable

3. **Log Files**
   ```bash
   # Collect relevant logs
   tail -100 packages/backend/logs/app.log > debug-logs.txt
   docker logs deepwebai-backend > docker-logs.txt
   ```

4. **System Information**
   - Operating system and version
   - Node.js version
   - Browser version (for frontend issues)
   - Docker version (for containerized deployments)

#### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Environment
- OS: Ubuntu 22.04
- Node.js: v22.14.0
- Browser: Chrome 120.0.0
- DeepWebAI Version: 1.0.0

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Additional Context
Any other relevant information

## Logs
```
[Attach log files]
```

---

## Preventive Maintenance

### 🔧 Regular Maintenance Tasks

#### Daily Tasks
```bash
# Check system health
curl -f http://localhost:3001/health

# Monitor error rates
grep "ERROR" packages/backend/logs/app.log | wc -l

# Check cache performance
redis-cli INFO stats | grep keyspace_hits
```

#### Weekly Tasks
```bash
# Update dependencies
pnpm update

# Run full test suite
pnpm test

# Clean up old files
find uploads/ -type f -mtime +7 -delete

# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

#### Monthly Tasks
```bash
# Security updates
npm audit
pnpm audit

# Performance review
node scripts/performance-report.js

# Database maintenance
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Certificate renewal check
certbot certificates
```

### 📊 Monitoring Setup

#### Essential Metrics to Monitor
1. **Application Health**
   - Response time percentiles (p50, p95, p99)
   - Error rate percentage
   - Request throughput

2. **Infrastructure Health**
   - CPU and memory utilization
   - Disk usage and I/O
   - Network connectivity

3. **Business Metrics**
   - Active user count
   - AI request volume
   - File processing throughput

#### Alert Configuration
```yaml
# Example alerting rules
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"
    
  - name: "Slow Response Time"
    condition: "response_time_p95 > 1s"
    duration: "10m"
    severity: "warning"
    
  - name: "High Memory Usage"
    condition: "memory_usage > 90%"
    duration: "5m"
    severity: "warning"
```

---

This troubleshooting guide covers the most common issues encountered with DeepWebAI. For additional support, refer to the [Developer Guide](developer_guide/README.md) or contact our support team.
