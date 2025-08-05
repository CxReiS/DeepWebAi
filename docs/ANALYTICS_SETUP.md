# Analytics Setup Guide

Bu kılavuz, DeepWebAI projesinde Plausible ve Vercel Analytics modüllerinin nasıl aktif edileceğini açıklar.

## Desteklenen Analytics Platformları

- ✅ **Vercel Analytics** - Vercel tarafından sağlanan built-in analytics
- ✅ **Plausible Analytics** - Privacy-focused, GDPR compliant analytics
- ✅ **Google Analytics 4** - Google'ın analytics platformu
- ✅ **Mixpanel** - Event tracking ve user analytics
- ✅ **Custom Analytics** - Özel analytics endpoint'i

## Kurulum

### 1. Environment Variables

`.env` dosyanızda aşağıdaki değişkenleri ayarlayın:

```bash
# Analytics Configuration

# Vercel Analytics
VERCEL_ANALYTICS_ID=your_vercel_analytics_id

# Plausible Analytics
PLAUSIBLE_DOMAIN=your-domain.com
PLAUSIBLE_API_HOST=plausible.io

# Google Analytics
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your_ga_api_secret

# Mixpanel
MIXPANEL_TOKEN=your_mixpanel_token

# Custom Analytics
CUSTOM_ANALYTICS_ENDPOINT=https://your-analytics.com/api/track

# Analytics Sampling
ANALYTICS_SAMPLING_RATE=1.0

# Frontend Environment Variables
VITE_ENABLE_ANALYTICS=true
VITE_PLAUSIBLE_DOMAIN=your-domain.com
VITE_PLAUSIBLE_API_HOST=plausible.io
```

### 2. Backend Analytics

Backend analytics şu özellikleri sağlar:

- **Automatic API Request Tracking**: Tüm API istekleri otomatik olarak izlenir
- **Error Tracking**: Hatalar ve exceptions otomatik olarak kaydedilir
- **Performance Monitoring**: Yavaş istekler ve performans metrikleri
- **User Journey Tracking**: Kullanıcı davranışları ve akışları

#### Analytics Router Endpoints

```typescript
GET  /api/analytics/health   # Analytics sisteminin durumu
POST /api/analytics/track    # Manuel event tracking
POST /api/analytics/flush    # Events'leri hemen gönder
```

### 3. Frontend Analytics

Frontend analytics şu özellikleri sağlar:

- **Page View Tracking**: Sayfa görüntülemeleri
- **User Interaction Tracking**: Button clicks, form submissions
- **Chat Analytics**: Mesaj gönderme, model seçimi
- **File Operation Tracking**: Dosya yükleme işlemleri
- **Error Tracking**: Frontend hataları ve exceptions
- **Performance Monitoring**: Component render times, slow interactions

#### React Hook Kullanımı

```typescript
import { useAnalytics } from '../utils/analytics';

function MyComponent() {
  const { trackClick, trackFeatureAccess, trackError } = useAnalytics();

  const handleButtonClick = () => {
    trackClick('submit_button', { formName: 'contact' });
  };

  const handleFeatureAccess = () => {
    trackFeatureAccess('premium_feature', { plan: 'pro' });
  };

  return (
    <button onClick={handleButtonClick}>
      Submit
    </button>
  );
}
```

## Event Types

### Backend Events

```typescript
enum AnalyticsEventType {
  // User events
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // AI/Chat events
  CONVERSATION_STARTED = 'conversation_started',
  MESSAGE_SENT = 'message_sent',
  AI_RESPONSE_GENERATED = 'ai_response_generated',
  
  // Performance events
  API_REQUEST = 'api_request',
  ERROR_OCCURRED = 'error_occurred',
  
  // Business events
  SUBSCRIPTION_STARTED = 'subscription_started',
  QUOTA_EXCEEDED = 'quota_exceeded'
}
```

### Frontend Events

```typescript
enum FrontendEventType {
  // Page events
  PAGE_VIEW = 'page_view',
  PAGE_LEAVE = 'page_leave',
  
  // User interactions
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  
  // Chat interactions
  CHAT_OPENED = 'chat_opened',
  MESSAGE_SENT = 'message_sent',
  MODEL_SELECTED = 'model_selected',
  
  // File operations
  FILE_UPLOAD_STARTED = 'file_upload_started',
  FILE_UPLOAD_COMPLETED = 'file_upload_completed',
  
  // Performance
  SLOW_INTERACTION = 'slow_interaction'
}
```

## Analytics Dashboard

Analytics dashboard'a erişim:

```typescript
import { AnalyticsDashboard } from '../components/features/analytics/AnalyticsDashboard';

function AdminPanel() {
  return (
    <div>
      <AnalyticsDashboard />
    </div>
  );
}
```

Dashboard özellikleri:
- Provider status monitoring
- Key metrics overview (page views, users, session duration)
- Top pages listing
- Error tracking
- Real-time data refresh

## Privacy & GDPR Compliance

### Privacy Features

```typescript
const privacyConfig = {
  anonymizeIp: true,           // IP adreslerini anonimleştir
  excludePaths: ['/health'],   // Tracking'den hariç tutulan path'ler
  respectDoNotTrack: true      // DNT header'ını respect et
};
```

### Sampling Configuration

```typescript
const samplingConfig = {
  rate: 1.0,                   // Global sampling rate (0.0-1.0)
  events: {
    API_REQUEST: 0.1,          // API isteklerinin %10'unu sample et
    PAGE_VIEW: 1.0             // Tüm page view'ları sample et
  }
};
```

## Provider-Specific Setup

### Plausible Analytics Setup

1. Plausible hesabı oluşturun: https://plausible.io
2. Domain'inizi ekleyin
3. Environment variables'ları ayarlayın:

```bash
PLAUSIBLE_DOMAIN=your-domain.com
VITE_PLAUSIBLE_DOMAIN=your-domain.com
```

### Vercel Analytics Setup

1. Vercel dashboard'da analytics'i aktif edin
2. Analytics ID'nizi alın
3. Environment variables'ları ayarlayın:

```bash
VERCEL_ANALYTICS_ID=your_analytics_id
```

## Testing

Analytics sistemini test etmek için:

```bash
# Backend analytics health check
curl http://localhost:3001/api/analytics/health

# Frontend analytics test
# Browser console'da analytics objesi kontrolü
console.log(window.analytics);
```

## Troubleshooting

### Common Issues

1. **Events gönderilmiyor**
   - Environment variables'ları kontrol edin
   - Network connectivity'yi kontrol edin
   - Console errors'ları kontrol edin

2. **Plausible script yüklenmiyor**
   - Domain konfigürasyonunu kontrol edin
   - CORS ayarlarını kontrol edin
   - Ad blocker'ları kontrol edin

3. **Performance issues**
   - Sampling rate'i düşürün
   - Event batching konfigürasyonunu optimize edin

### Debug Mode

Development ortamında debug mode'u aktif edin:

```bash
VITE_ENABLE_ANALYTICS=true
NODE_ENV=development
```

Debug mode'da:
- Tüm events console'a log edilir
- Network requests görünür olur
- Error messages detaylı olur

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Analytics     │
│   Analytics     │────│   Analytics      │────│   Providers     │
│   Service       │    │   Service        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       ├─ Vercel
        ├─ Page Views           ├─ API Requests         ├─ Plausible
        ├─ User Events          ├─ Error Tracking       ├─ Google Analytics
        ├─ Performance          ├─ Performance          ├─ Mixpanel
        └─ Errors               └─ User Journey         └─ Custom Endpoint
```

## Next Steps

1. Production ortamında analytics'i aktif edin
2. Custom events ekleyin
3. Dashboard'u customize edin
4. Alerting ve monitoring ekleyin
5. A/B testing entegrasyonu yapın
