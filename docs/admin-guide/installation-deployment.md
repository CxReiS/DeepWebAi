# Kurulum ve Dağıtım Kılavuzu

DeepWebAI platformunun çeşitli ortamlarda kurulum ve dağıtımı için kapsamlı kılavuz.

## Sistem Gereksinimleri

### Minimum Gereksinimler

**Donanım:**
```
CPU: 4 çekirdek, 2.4 GHz
RAM: 8 GB minimum, 16 GB önerilen
Depolama: Uygulama için 50 GB SSD
Ağ: 100 Mbps bant genişliği
```

**Yazılım:**
```
Node.js: 18.x veya 20.x LTS
pnpm: 8.x veya üstü
PostgreSQL: 14.x veya üstü
Redis: 6.x veya üstü (isteğe bağlı, önbellekleme için)
Docker: 20.x veya üstü (konteynerli dağıtım için)
```

**Desteklenen İşletim Sistemleri:**
- Ubuntu 20.04 LTS veya üstü
- CentOS 8 veya üstü
- Debian 11 veya üstü
- Windows Server 2019 veya üstü
- macOS 12 veya üstü (sadece geliştirme için)

### Üretim Gereksinimleri

**Donanım:**
```
CPU: 8+ çekirdek, 3.0+ GHz
RAM: 32 GB minimum, 64 GB önerilen
Depolama: 500 GB+ NVMe SSD
Ağ: 1 Gbps+ bant genişliği
Load Balancer: Nginx veya benzeri
```

**Altyapı:**
```
Veritabanı: Bağlantı havuzlaması olan PostgreSQL 15+
Önbellek: Yüksek erişilebilirlik için Redis Cluster
CDN: CloudFlare veya AWS CloudFront
İzleme: Prometheus + Grafana
Loglama: ELK Stack veya benzeri
```

## Kurulum Yöntemleri

### Docker Dağıtımı (Önerilen)

**Ön Gereksinimler:**
```bash
# Docker ve Docker Compose'u yükle
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose'u yükle
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Hızlı Başlangıç:**
```bash
# Repository'yi klonla
git clone https://github.com/yourusername/deepwebai.git
cd deepwebai

# Ortam yapılandırmasını kopyala
cp .env.example .env
nano .env  # Ortam değişkenlerini yapılandır

# Servisleri başlat
docker-compose up -d

# Durumu kontrol et
docker-compose ps
docker-compose logs -f
```

**Docker Compose Yapılandırması:**
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

### Manuel Kurulum

**Sistem Hazırlığı:**
```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Bağımlılıkları yükle
sudo apt install -y curl git build-essential python3-pip

# Node.js 20 LTS'yi yükle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm'i yükle
npm install -g pnpm

# PostgreSQL'i yükle
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Redis'i yükle (isteğe bağlı)
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Uygulama Kurulumu:**
```bash
# Uygulamayı klonla ve kur
git clone https://github.com/yourusername/deepwebai.git
cd deepwebai

# Bağımlılıkları yükle
pnpm install

# Ortamı kur
cp .env.example .env
nano .env

# Veritabanını kur
pnpm db:setup
pnpm db:migrate

# Uygulamayı derle
pnpm build

# Uygulamayı başlat
pnpm start
```

### Kubernetes Dağıtımı

**Namespace Kurulumu:**
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

**Uygulama Dağıtımı:**
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

**Veritabanı Kurulumu:**
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

## Ortam Yapılandırması

### Veritabanı Kurulumu

**PostgreSQL Yapılandırması:**
```sql
-- Veritabanı ve kullanıcı oluştur
CREATE DATABASE deepwebai;
CREATE USER deepwebai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE deepwebai TO deepwebai_user;

-- PostgreSQL ayarlarını yapılandır
-- postgresql.conf'u düzenle
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
```

**Veritabanı Migration'ı:**
```bash
# İlk migration'ı çalıştır
pnpm db:migrate

# İlk verileri yükle
pnpm db:seed

# Kurulumu doğrula
pnpm db:status
```

### Redis Yapılandırması

**Redis Kurulumu:**
```bash
# redis.conf'u düzenle
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Redis'i yeniden başlat
sudo systemctl restart redis
```

**Bağlantı Testi:**
```bash
# Redis bağlantısını test et
redis-cli ping
# Döndürmesi gereken: PONG

# Uygulamadan test et
node -e "const redis = require('ioredis'); const client = new redis('redis://localhost:6379'); client.ping().then(console.log).finally(() => client.disconnect());"
```

## SSL/TLS Yapılandırması

### Let's Encrypt Kurulumu

**Certbot Kurulumu:**
```bash
# Certbot'u yükle
sudo apt install -y certbot python3-certbot-nginx

# Sertifikaları oluştur
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme kurulumu
sudo crontab -e
# Ekle: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Nginx SSL Yapılandırması:**
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

    # WebSocket desteği
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

## Yüksek Erişilebilirlik Kurulumu

### Load Balancer Yapılandırması

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
        
        # Sağlık kontrolü
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Sağlık kontrolü endpoint'i
    location /health {
        access_log off;
        proxy_pass http://deepwebai_backend;
        proxy_method GET;
    }
}
```

**Veritabanı Yüksek Erişilebilirliği:**
```yaml
# PostgreSQL Primary-Replica Kurulumu
# Primary sunucu yapılandırması
# postgresql.conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
synchronous_commit = on

# Replica sunucu yapılandırması
# recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary_server port=5432 user=replicator password=secret'
trigger_file = '/tmp/postgresql.trigger'
```

### Sağlık Kontrolleri ve İzleme

**Sağlık Kontrolü Endpoint'leri:**
```javascript
// Sağlık kontrolü implementasyonu
app.get('/health', async (req, res) => {
  try {
    // Veritabanı kontrolü
    await db.query('SELECT 1');
    
    // Redis kontrolü
    await redis.ping();
    
    // AI sağlayıcıları kontrolü
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

**İzleme Kurulumu:**
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

## Yedekleme ve Kurtarma

### Veritabanı Yedekleme

**Otomatik Yedekleme Betiği:**
```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/var/backups/deepwebai"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="deepwebai"
DB_USER="deepwebai_user"

# Yedekleme dizinini oluştur
mkdir -p $BACKUP_DIR

# Veritabanı yedeklemesi
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Dosya sistemi yedeklemesi
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/lib/deepwebai/uploads

# Eski yedekleri temizle (30 gün sakla)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# S3'e yükle (isteğe bağlı)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/database/
aws s3 cp $BACKUP_DIR/files_backup_$DATE.tar.gz s3://your-backup-bucket/files/
```

**Cron Zamanlaması:**
```bash
# Crontab'a ekle
0 2 * * * /usr/local/bin/backup-db.sh
```

### Felaket Kurtarma

**Kurtarma Prosedürleri:**
```bash
# Veritabanı Kurtarma
gunzip < db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U deepwebai_user deepwebai

# Dosya Kurtarma
tar -xzf files_backup_YYYYMMDD_HHMMSS.tar.gz -C /

# Uygulama Kurtarma
cd /opt/deepwebai
git pull origin main
pnpm install
pnpm build
pnpm db:migrate
systemctl restart deepwebai
```

## Performans Optimizasyonu

### Uygulama Ayarlama

**Node.js Optimizasyonu:**
```bash
# Üretim için ortam değişkenleri
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=32

# PM2 Yapılandırması
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

**Veritabanı Optimizasyonu:**
```sql
-- PostgreSQL performans ayarlama
-- postgresql.conf
shared_buffers = RAM'in %25'i
effective_cache_size = RAM'in %75'i
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = RAM / max_connections / 4
maintenance_work_mem = RAM / 16

-- Performans için indeks oluştur
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_conversations_user_id ON conversations(user_id);
CREATE INDEX CONCURRENTLY idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX CONCURRENTLY idx_files_user_id ON files(user_id);
```

### Önbellekleme Stratejisi

**Redis Önbellekleme:**
```javascript
// Önbellek yapılandırması
const cacheConfig = {
  ai_responses: {
    ttl: 3600, // 1 saat
    prefix: 'ai_resp:'
  },
  user_sessions: {
    ttl: 86400, // 24 saat
    prefix: 'session:'
  },
  file_metadata: {
    ttl: 7200, // 2 saat
    prefix: 'file_meta:'
  }
};
```

**CDN Yapılandırması:**
```nginx
# Statik varlık önbellekleme
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
    access_log off;
}

# API yanıt önbellekleme
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Güvenlik Sertleştirme

### Sistem Güvenliği

**Firewall Yapılandırması:**
```bash
# UFW Kurulumu
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban Kurulumu
sudo apt install fail2ban
# /etc/fail2ban/jail.local'i düzenle
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

**Uygulama Güvenliği:**
```javascript
// Güvenlik middleware'i
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

// Hız sınırlaması
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // her IP için windowMs başına 100 istek sınırı
}));
```

## Dağıtım Sorun Giderme

### Yaygın Sorunlar

**Veritabanı Bağlantı Sorunları:**
```bash
# PostgreSQL durumunu kontrol et
sudo systemctl status postgresql

# Bağlantıları kontrol et
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Bağlantıları sıfırla
sudo systemctl restart postgresql
```

**Bellek Sorunları:**
```bash
# Bellek kullanımını izle
free -h
htop

# Node.js heap kullanımını kontrol et
node --expose-gc app.js &
kill -USR2 $!  # Heap dump'ı tetikle
```

**Performans Sorunları:**
```bash
# Sistem performansını kontrol et
iostat -x 1
sar -u 1
netstat -i

# Uygulama performansı
pnpm run analyze-bundle
pnpm run profile
```

### Log Analizi

**Merkezi Loglama:**
```bash
# ELK Stack'i yükle
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:7.14.0
docker run -d --name kibana -p 5601:5601 --link elasticsearch:elasticsearch kibana:7.14.0
docker run -d --name logstash -p 5044:5044 --link elasticsearch:elasticsearch logstash:7.14.0
```

**Log Rotasyonu:**
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

Bu kapsamlı kurulum ve dağıtım kılavuzu, DeepWebAI'nin geliştirmeden kurumsal üretim kurulumlarına kadar çeşitli ortamlarda başarıyla dağıtılması için gereken her şeyi sağlar.
