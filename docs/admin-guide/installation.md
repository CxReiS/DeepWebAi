# DeepWebAI Yönetici Kılavuzu - Kurulum ve Dağıtım

Bu kılavuz DeepWebAI platformunun tam kurulum ve dağıtım sürecini kapsamaktadır.

## Ön Gereksinimler

### Sistem Gereksinimleri
- **Node.js**: 18.x veya üstü
- **pnpm**: 8.x veya üstü
- **PostgreSQL**: 14+ (veya Neon serverless)
- **Redis**: 6+ (önbellekleme için)
- **Docker**: 20+ (isteğe bağlı, konteynerli dağıtım için)

### Harici Servisler
- **Neon Database**: Serverless PostgreSQL
- **Ably**: Gerçek zamanlı mesajlaşma
- **Sentry**: Hata takibi (isteğe bağlı)
- **AI Sağlayıcıları**: OpenAI, Anthropic, Google, DeepSeek

## Kurulum

### 1. Repository'yi Klonla
```bash
git clone https://github.com/CxReiS/DeepWebAi.git
cd DeepWebAi
```

### 2. Bağımlılıkları Yükle
```bash
pnpm install
```

### 3. Ortam Yapılandırması
Ortam şablonunu kopyala:
```bash
cp .env.example .env
```

### Gerekli Ortam Değişkenleri

#### Veritabanı Yapılandırması
```env
# Neon Database
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
NEON_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

#### Kimlik Doğrulama
```env
# JWT Secrets
JWT_SECRET="your-jwt-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Session Configuration
SESSION_COOKIE_NAME="deepwebai-session"
SESSION_MAX_AGE=604800
```

#### AI Sağlayıcı API'leri
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

#### Gerçek Zamanlı Servisler
```env
# Ably Real-time
ABLY_API_KEY="..."
ABLY_APP_ID="..."
```

#### Önbellekleme ve Depolama
```env
# Redis (isteğe bağlı)
REDIS_URL="redis://localhost:6379"

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=52428800
```

#### İzleme ve Analitik
```env
# Sentry (isteğe bağlı)
SENTRY_DSN="https://..."
SENTRY_ENVIRONMENT="production"

# Analytics
ANALYTICS_ENABLED=true
```

### 4. Veritabanı Kurulumu
```bash
# Migrationları çalıştır
pnpm run db:migrate

# İlk verileri yükle
pnpm run db:seed
```

### 5. Uygulamayı Derle
```bash
pnpm build
```

## Dağıtım Seçenekleri

### Seçenek 1: Geleneksel Sunucu Dağıtımı

#### 1. Üretim Derlemesi
```bash
NODE_ENV=production pnpm build
```

#### 2. Servisleri Başlat
```bash
# Backend'i başlat
cd packages/backend
pnpm start

# Frontend'i başlat (ayrı terminal)
cd packages/frontend
pnpm preview --host 0.0.0.0 --port 3000
```

#### 3. Süreç Yöneticisi (PM2)
```bash
# PM2'yi yükle
npm install -g pm2

# PM2 ile başlat
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Seçenek 2: Docker Dağıtımı

#### 1. Image'ları Derle
```bash
# Backend'i derle
docker build -f docker/backend.Dockerfile -t deepwebai-backend .

# Frontend'i derle
docker build -f docker/frontend.Dockerfile -t deepwebai-frontend .
```

#### 2. Docker Compose
```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f
```

### Seçenek 3: Bulut Dağıtımı (Vercel/Netlify)

#### Frontend (Vercel)
```bash
# Vercel CLI'yi yükle
npm i -g vercel

# Dağıt
cd packages/frontend
vercel --prod
```

#### Backend (Railway/Render)
1. GitHub repository'sini bağla
2. Ortam değişkenlerini ayarla
3. Push'ta otomatik dağıt

## Yapılandırma Yönetimi

### Özellik Bayrakları Yapılandırması
```env
# Feature Flags Provider
FEATURE_FLAGS_PROVIDER="database"  # or "growthbook"
GROWTHBOOK_API_KEY="..."
```

### Güvenlik Yapılandırması
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

### Performans Yapılandırması
```env
# Caching
CACHE_TTL=3600
CACHE_PROVIDER="redis"  # or "memory"

# File Processing
OCR_ENABLED=true
OCR_LANGUAGE="eng"
MAX_PROCESSING_TIME=300000
```

## SSL/TLS Kurulumu

### Let's Encrypt Kullanımı (Certbot)
```bash
# Certbot'u yükle
sudo apt install certbot

# Sertifika oluştur
sudo certbot certonly --standalone -d yourdomain.com

# Otomatik yenileme
sudo crontab -e
# Ekle: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Yapılandırması
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

## Sağlık Kontrolleri ve İzleme

### Uygulama Sağlığı
```bash
# Sağlık endpoint'ini kontrol et
curl https://yourapp.com/api/health

# Beklenen yanıt:
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

### Log Yönetimi
```bash
# Uygulama loglarını görüntüle
pm2 logs

# Yapılandırılmış loglama
tail -f /var/log/deepwebai/app.log | jq
```

### İzleme Kurulumu
1. **Sentry**: Hata takibi ve performans izleme
2. **Prometheus + Grafana**: Metrikler ve dashboard'lar
3. **Uptime izleme**: Pingdom, UptimeRobot
4. **Log toplama**: ELK stack veya benzeri

## Yedekleme Yapılandırması

### Veritabanı Yedekleri
```bash
# Günlük yedekleme betiği
#!/bin/bash
pg_dump $DATABASE_URL > backups/db-$(date +%Y%m%d).sql
```

### Dosya Depolama Yedekleri
```bash
# Upload'ları S3'e senkronize et
aws s3 sync ./uploads s3://deepwebai-backups/uploads/
```

## Sorun Giderme

### Yaygın Sorunlar

#### Veritabanı Bağlantısı
- DATABASE_URL formatını doğrula
- Ağ bağlantısını kontrol et
- Veritabanının var olduğunu ve kullanıcının izinleri olduğunu doğrula

#### Derleme Hatası
- node_modules'u temizle ve yeniden yükle
- Node.js sürüm uyumluluğunu kontrol et
- Tüm ortam değişkenlerinin ayarlandığını doğrula

#### Performans Sorunları
- Redis önbelleklemesini etkinleştir
- Veritabanı sorgularını optimize et
- Statik varlıklar için CDN yapılandır

### Kontrol Edilecek Loglar
- Uygulama logları: `/var/log/deepwebai/`
- Sistem logları: `/var/log/syslog`
- Nginx logları: `/var/log/nginx/`
- Veritabanı logları: Neon dashboard'u kontrol et

## Güvenlik Kontrol Listesi

- [ ] Tüm gizli anahtarlar düzgün yapılandırıldı
- [ ] SSL/TLS etkinleştirildi
- [ ] Hız sınırlaması yapılandırıldı
- [ ] CORS düzgün ayarlandı
- [ ] Güvenlik başlıkları etkinleştirildi
- [ ] Veritabanı erişimi kısıtlandı
- [ ] Dosya yükleme doğrulaması aktif
- [ ] Yönetici hesapları için MFA zorunlu
- [ ] Düzenli güvenlik güncellemeleri uygulandı

## Üretim Kontrol Listesi

- [ ] Ortam değişkenleri yapılandırıldı
- [ ] Veritabanı migration'ları uygulandı
- [ ] SSL sertifikaları yüklendi
- [ ] İzleme yapılandırıldı
- [ ] Yedeklemeler zamanlandı
- [ ] Sağlık kontrolleri çalışıyor
- [ ] CDN yapılandırıldı
- [ ] Domain DNS yapılandırıldı
- [ ] Performans testleri tamamlandı
- [ ] Güvenlik denetimi geçildi

Ek destek için iletişim: admin@deepwebai.com
