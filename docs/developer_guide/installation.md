# Kurulum Kılavuzu

## Sistem Gereksinimleri

### Temel Gereksinimler
- **Node.js**: v22.14.0 veya üzeri
- **pnpm**: 10.14.0 veya üzeri
- **Git**: En son sürüm
- **Docker**: En son sürüm (opsiyonel)

### Veritabanı
- **Neon PostgreSQL**: Serverless PostgreSQL veritabanı
- Neon hesabı ve proje kurulumu gereklidir

## Kurulum Adımları

### 1. Repository Klonlama
```bash
git clone https://github.com/CxReiS/DeepWebAi.git
cd DeepWebAi
```

### 2. Bağımlılıkların Yüklenmesi
```bash
# pnpm kurulumu (eğer yoksa)
npm install -g pnpm@10.14.0

# Proje bağımlılıklarını yükleme
pnpm install
```

### 3. Ortam Değişkenlerinin Ayarlanması
```bash
# .env dosyasını kopyalama
cp .env.example .env

# Gerekli değişkenleri düzenleme
# - DATABASE_URL: Neon veritabanı URL'si
# - NEXTAUTH_SECRET: Auth.js için secret
# - NEXTAUTH_URL: Uygulama URL'si
```

### 4. Veritabanı Kurulumu
```bash
# Veritabanı migration'larını çalıştırma
pnpm migration:run

# Seed verilerini yükleme (opsiyonel)
pnpm db:seed
```

### 5. Projeyi Başlatma
```bash
# Tüm servisleri başlatma
pnpm dev

# Sadece backend başlatma
pnpm --filter=backend dev

# Sadece frontend başlatma
pnpm --filter=frontend dev
```

## Test Kurulumu

### Test Komutları
```bash
# Tüm testleri çalıştırma
pnpm test

# Belirli bir paketi test etme
pnpm --filter=backend test

# E2E testleri
pnpm test:e2e
```

## Docker ile Kurulum

### Docker Compose ile Başlatma
```bash
# Tüm servisleri Docker ile başlatma
docker-compose up -d

# Sadece veritabanı servisleri
docker-compose up database -d
```

## Geliştirme Araçları

### VS Code Ayarları
- Workspace ayarları `.vscode/settings.json` dosyasında tanımlı
- Önerilen uzantılar otomatik olarak önerilecektir
- Debug konfigürasyonu `.vscode/launch.json` dosyasında

### Lint ve Format
```bash
# Kodları kontrol etme
pnpm lint

# Kodları düzeltme
pnpm lint:fix

# Formatlama
pnpm format
```

## Sorun Giderme

### Yaygın Sorunlar
1. **Port çakışması**: Farklı portlar kullanmayı deneyin
2. **pnpm cache**: `pnpm store prune` komutu ile cache temizleyin
3. **Node sürümü**: Node.js 22.14.0 sürümünü kullanın

### Yardım Alma
- GitHub Issues sayfasını kontrol edin
- Dokümantasyonu inceleyin
- Geliştirici ekibiyle iletişime geçin
