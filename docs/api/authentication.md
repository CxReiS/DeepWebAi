# DeepWebAI API - Kimlik Doğrulama

Bu belge, DeepWebAI API'si için kimlik doğrulama sistemini açıklar.

## Genel Bakış

DeepWebAI, NextAuth.js tarafından desteklenen güvenli oturum tabanlı kimlik doğrulama sistemi kullanır ve şunları destekler:
- Kullanıcı adı/şifre kimlik doğrulaması
- Çok faktörlü kimlik doğrulama (MFA)
- OAuth sağlayıcıları (GitHub, Discord, Google)
- API erişimi için JWT token'ları
- Oturum yönetimi

## Base URL

```
Production: https://api.deepwebai.com
Development: http://localhost:8000
```

## Kimlik Doğrulama Akışı

### 1. Kullanıcı Kaydı

Yeni bir kullanıcı hesabı oluşturun.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kayıt başarılı. Lütfen e-postanızı doğrulayın.",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "isVerified": false,
    "role": "user"
  }
}
```

**Error Responses:**
```json
{
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Bu e-posta adresi ile bir hesap zaten mevcut"
}
```

### 2. E-posta Doğrulaması

E-posta ile gönderilen token'ı kullanarak e-posta adresini doğrulayın.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "E-posta başarıyla doğrulandı"
}
```

### 3. Kullanıcı Girişi

E-posta/kullanıcı adı ve şifre ile kimlik doğrulaması yapın.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "identifier": "user@example.com",  // e-posta veya kullanıcı adı
  "password": "securePassword123",
  "mfaCode": "123456"  // MFA etkinse gerekli
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "role": "user",
    "mfaEnabled": true
  },
  "sessionId": "session_123"
}
```

**MFA Required Response:**
```json
{
  "success": false,
  "error": "MFA_REQUIRED",
  "message": "Çok faktörlü kimlik doğrulama kodu gerekli",
  "challengeId": "challenge_123"
}
```

### 4. Çok Faktörlü Kimlik Doğrulama

#### TOTP MFA Kurulumu

**Endpoint:** `POST /api/auth/mfa/setup-totp`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "backupCodes": [
    "backup-code-1",
    "backup-code-2",
    // ... 8 adet daha kod
  ]
}
```

#### TOTP Kurulumunu Doğrula

**Endpoint:** `POST /api/auth/mfa/verify-totp`

**Request Body:**
```json
{
  "code": "123456"
}
```

#### SMS MFA Kurulumu

**Endpoint:** `POST /api/auth/mfa/setup-sms`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS doğrulama kodu gönderildi"
}
```

#### SMS Kurulumunu Doğrula

**Endpoint:** `POST /api/auth/mfa/verify-sms`

**Request Body:**
```json
{
  "code": "123456"
}
```

### 5. Şifre Sıfırlama

#### Şifre Sıfırlama Talebi

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### Şifre Sıfırlama

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

### 6. OAuth Kimlik Doğrulama

#### OAuth Akışını Başlat

**GitHub:** `GET /api/auth/github`
**Discord:** `GET /api/auth/discord`  
**Google:** `GET /api/auth/google`

**Response:** OAuth sağlayıcısına yönlendirir

#### OAuth Callback

**GitHub:** `GET /api/auth/github/callback?code=...`
**Discord:** `GET /api/auth/discord/callback?code=...`
**Google:** `GET /api/auth/google/callback?code=...`

**Response:** Oturum veya hata ile frontend'e yönlendirir

### 7. Oturum Yönetimi

#### Mevcut Kullanıcıyı Al

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe",
    "role": "user",
    "mfaEnabled": true,
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  }
}
```

#### Profil Güncelleme

**Endpoint:** `PUT /api/auth/profile`

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "bio": "AI meraklısı",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "light",
    "language": "en"
  }
}
```

#### Şifre Değiştirme

**Endpoint:** `PUT /api/auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

#### Çıkış

**Endpoint:** `POST /api/auth/logout`

**Response:**
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı"
}
```

#### Tüm Oturumlardan Çıkış

**Endpoint:** `POST /api/auth/logout-all`

**Response:**
```json
{
  "success": true,
  "message": "Tüm oturumlardan çıkış yapıldı"
}
```

## JWT Token Kimlik Doğrulaması

API erişimi için oturum çerezleri yerine JWT token'ları kullanabilirsiniz.

### JWT Token Al

**Endpoint:** `POST /api/auth/token`

**Headers:**
```
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### JWT Token Yenile

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### JWT Token'ları Kullanma

JWT token'ını Authorization header'ında dahil edin:

```http
GET /api/files
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Hata Yönetimi

### Yaygın Hata Yanıtları

#### 400 Bad Request
```json
{
  "error": "INVALID_INPUT",
  "message": "Geçersiz e-posta formatı",
  "details": {
    "field": "email",
    "code": "INVALID_FORMAT"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Geçersiz kimlik bilgileri"
}
```

#### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Yetersiz izinler"
}
```

#### 429 Too Many Requests
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Çok fazla istek. Lütfen daha sonra tekrar deneyin.",
  "retryAfter": 60
}
```

### Hata Kodları

| Kod | Açıklama |
|------|-------------|
| `INVALID_INPUT` | İstek doğrulaması başarısız |
| `EMAIL_ALREADY_EXISTS` | E-posta zaten kayıtlı |
| `USERNAME_TAKEN` | Kullanıcı adı zaten alınmış |
| `INVALID_CREDENTIALS` | Yanlış e-posta/şifre |
| `EMAIL_NOT_VERIFIED` | E-posta doğrulaması gerekli |
| `MFA_REQUIRED` | MFA kodu gerekli |
| `INVALID_MFA_CODE` | Yanlış MFA kodu |
| `ACCOUNT_LOCKED` | Hesap geçici olarak kilitli |
| `SESSION_EXPIRED` | Oturum süresi dolmuş |
| `TOKEN_EXPIRED` | JWT token süresi dolmuş |
| `INSUFFICIENT_PERMISSIONS` | Kullanıcı gerekli izinlere sahip değil |

## Hız Sınırlama

Kimlik doğrulama endpoint'leri kötüye kullanımı önlemek için hız sınırlamasına tabidir:

- **Giriş denemeleri:** IP başına dakikada 5
- **Kayıt:** IP başına saatte 3
- **Şifre sıfırlama:** E-posta başına saatte 3
- **MFA denemeleri:** Kullanıcı başına dakikada 10

Hız sınırı header'ları yanıtlara dahil edilir:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

## Güvenlik Header'ları

Tüm kimlik doğrulama yanıtları güvenlik header'larını içerir:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## En İyi Uygulamalar

### Geliştiriciler İçin

1. **Her zaman HTTPS kullanın** üretim ortamında
2. **Token'ları güvenli şekilde saklayın** (httpOnly çerezler veya güvenli depolama)
3. **Tüm auth durumları için uygun hata yönetimi uygulayın**
4. **Hız sınırlamasını** exponential backoff ile zarif şekilde yönetin
5. **Token'ları hem istemci hem sunucu tarafında doğrulayın**
6. **Çıkış işlevini** düzgün şekilde uygulayın
7. **Uzun süreli uygulamalar için refresh token'ları kullanın**

### Kullanıcılar İçin

1. **Gelişmiş güvenlik için MFA'yı etkinleştirin**
2. **Güçlü şifreler kullanın** (min 8 karakter, büyük-küçük harf, sayı, sembol)
3. **Yedek kodları** güvenli ve erişilebilir tutun
4. **İşiniz bittiğinde çıkış yapın**, özellikle paylaşılan cihazlarda
5. **Hesap etkinliğini** düzenli olarak izleyin

## SDK Örnekleri

### JavaScript/TypeScript

```typescript
import { DeepWebAIAuth } from '@deepwebai/sdk';

const auth = new DeepWebAIAuth({
  baseUrl: 'https://api.deepwebai.com',
  apiKey: 'your-api-key'
});

// Giriş
const user = await auth.login({
  identifier: 'user@example.com',
  password: 'password123'
});

// Mevcut kullanıcıyı al
const currentUser = await auth.getCurrentUser();

// Çıkış
await auth.logout();
```

### Python

```python
from deepwebai import DeepWebAIAuth

auth = DeepWebAIAuth(
    base_url='https://api.deepwebai.com',
    api_key='your-api-key'
)

# Giriş
user = auth.login(
    identifier='user@example.com',
    password='password123'
)

# Mevcut kullanıcıyı al
current_user = auth.get_current_user()

# Çıkış
auth.logout()
```

## Test

Geliştirme ortamında bu test kimlik bilgilerini kullanın:

```json
{
  "email": "test@deepwebai.com",
  "password": "test123456",
  "mfaSecret": "JBSWY3DPEHPK3PXP"
}
```

**Not:** Test kimlik bilgileri sadece geliştirme ortamında çalışır.
