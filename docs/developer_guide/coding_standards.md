# Kod Standartları

## Genel Kurallar

### TypeScript
- TypeScript 5.5.2 kullanılmaktadır
- Strict mode aktiftir
- Tüm dosyalarda tip tanımlamaları yapılmalıdır

### Kod Stili
- Prettier ile otomatik formatlama (VS Code default formatter)
- ESLint TS/JS/TSX/JSX dosyaları için aktiftir
- Kaydetmede otomatik formatlama

### İsimlendirme Kuralları
- **camelCase**: değişkenler ve fonksiyonlar için
- **PascalCase**: bileşenler ve tipler için
- **kebab-case**: dosya isimleri için

### Import/Export Kuralları
- Ortak tipler için `shared-types` paketi kullanılmalıdır
- Relative import'lar yerine absolute import'lar tercih edilmelidir

### Test Standartları
- Vitest test framework'ü kullanılır
- React Testing Library frontend testleri için
- Test dosyaları `tests/unit/<package>/` dizininde olmalıdır

### Hata Yönetimi
- Zod schema validasyonu kullanılmalıdır
- TypeScript error type'ları düzgün tanımlanmalıdır
- Try-catch blokları uygun şekilde kullanılmalıdır

### Commit Standartları
- Conventional Commits formatı kullanılmalıdır
- Commit mesajları Türkçe veya İngilizce olabilir
- Her commit atomic olmalıdır

### Dosya Organizasyonu
- Her paket kendi package.json'ına sahip olmalıdır
- Barrel export'lar (index.ts) kullanılmalıdır
- Dosya yapısı feature-based olmalıdır
