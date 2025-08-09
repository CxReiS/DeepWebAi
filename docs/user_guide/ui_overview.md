# Kullanıcı Arayüzü Genel Bakış

DeepWebAI'ın sezgisel ve güçlü kullanıcı arayüzünün detaylı rehberi. Tüm bileşenleri, navigasyon seçeneklerini ve özelleştirme imkanlarını keşfedin.

## Ana Arayüz Bileşenleri

### Üst Navigasyon Çubuğu

**Sol Taraf:**
```
🏠 DeepWebAI Logo (Ana sayfaya dönüş)
📁 Workspace (Çalışma alanı seçici)
🔍 Global Arama (Hızlı arama)
```

**Sağ Taraf:**
```
🔔 Bildirimler (Gerçek zamanlı uyarılar)
⚙️ Ayarlar (Hızlı ayarlar menüsü)
👤 Profil (Hesap ve çıkış seçenekleri)
🌙 Tema Değiştirici (Açık/Koyu mod)
```

**Bildirim Merkezi:**
- ⚡ Gerçek zamanlı sistem bildirimleri
- 📄 Dosya işleme durumu güncellemeleri
- 🤖 AI yanıt tamamlanma uyarıları
- 👥 İşbirliği davetleri
- 🎯 Özellik duyuruları

### Sol Kenar Çubuğu

**Ana Navigasyon:**
```
💬 Sohbetler
   ├── 🆕 Yeni Konuşma
   ├── 📝 Son Konuşmalar
   ├── ⭐ Yıldızlı
   └── 🗂️ Arşiv

📁 Dosyalar
   ├── 📤 Yükle
   ├── 📋 Son Dosyalar
   ├── 🔄 İşleme Durumu
   └── 🗑️ Geri Dönüşüm Kutusu

👥 İşbirliği
   ├── 🏢 Takımım
   ├── 📞 Aktif Oturumlar
   └── 📨 Davetler

📊 Analitik
   ├── 📈 Kullanım İstatistikleri
   ├── 🎯 Performans Metrikleri
   └── 💰 Fatura ve Kullanım
```

**Daraltılabilir Menü:**
- Daha fazla ekran alanı için yan paneli daralt
- Önemli fonksiyonlara hızlı erişim
- Hover üzerine genişleme seçeneği
- Kişiselleştirilebilir görünüm tercihleri

### Ana İçerik Alanı

**Sohbet Arayüzü:**
```
┌─────────────── Sohbet Başlığı ────────────────┐
│ 🤖 GPT-4 • Son mesaj: 2 dakika önce          │
├───────────────────────────────────────────────┤
│                                               │
│  👤 Kullanıcı: Merhaba, yardım ister misin?  │
│                                               │
│  🤖 AI: Tabii ki! Size nasıl yardımcı        │
│      olabilirim?                              │
│                                               │
│  [Dosya: rapor.pdf yüklendi ✅]             │
│                                               │
├───────────────────────────────────────────────┤
│ 📎 Dosya Ekle | 🎤 Ses | ✨ AI Seç          │
│ [Mesajınızı buraya yazın...]                 │
│                                     Gönder 📤│
└───────────────────────────────────────────────┘
```

**Dosya Yönetimi Paneli:**
```
┌─────────── Dosya Kütüphanesi ────────────┐
│ 🔍 Dosyalarda ara...                     │
├──────────────────────────────────────────┤
│ 📄 quarterly-report.pdf                  │
│ └─ 2.4 MB • Bugün • İşlendi ✅         │
│                                          │
│ 🖼️ presentation.png                     │
│ └─ 890 KB • Dün • İşleniyor ⏳         │
│                                          │
│ 📊 data-analysis.xlsx                    │
│ └─ 1.2 MB • 3 gün önce • Hata ❌       │
└──────────────────────────────────────────┘
```

### Sağ Kenar Paneli (Bağlamsal)

**AI Asistan Bilgileri:**
```
┌──────── AI Sağlayıcı Bilgileri ────────┐
│ 🤖 OpenAI GPT-4                       │
│ ├─ Durum: Aktif 🟢                   │
│ ├─ Yanıt süresi: ~2s                  │
│ ├─ Token kullanımı: 1,250/10,000      │
│ └─ Güvenilirlik: %99.8                │
│                                        │
│ 🔄 Sağlayıcı Değiştir                │
│ ⚙️ Model Ayarları                     │
│ 📊 Performans Geçmişi                │
└────────────────────────────────────────┘
```

**Dosya Ayrıntıları:**
```
┌────────── Dosya Özellikleri ──────────┐
│ 📄 quarterly-report.pdf               │
│ ├─ Boyut: 2.4 MB                     │
│ ├─ Sayfalar: 24                       │
│ ├─ Dil: İngilizce                     │
│ ├─ Yüklenme: 10:30, Bugün            │
│ └─ İşlenme: Tamamlandı ✅           │
│                                        │
│ 📋 İçerik Özeti                      │
│ ├─ 12 tablo                          │
│ ├─ 8 grafik                          │
│ ├─ 156 anahtar terim                 │
│ └─ 3 öneri maddesi                   │
│                                        │
│ 🔄 Yeniden İşle                      │
│ 📥 İndir                             │
│ 🗑️ Sil                               │
└────────────────────────────────────────┘
```

## Navigasyon ve Kısayollar

### Klavye Kısayolları

**Genel Navigasyon:**
```
Ctrl + /       : Komut paletini aç
Ctrl + K       : Hızlı arama
Ctrl + N       : Yeni konuşma
Ctrl + S       : Konuşmayı kaydet
Ctrl + E       : Dosya yükle
Esc            : Mevcut işlemi iptal et
```

**Sohbet Kontrolleri:**
```
Enter          : Mesaj gönder
Shift + Enter  : Yeni satır ekle
Ctrl + Z       : Son mesajı geri al
Ctrl + R       : Son yanıtı yenile
Tab            : AI sağlayıcı döngüsü
```

**Dosya İşlemleri:**
```
Ctrl + U       : Dosya yükle
Ctrl + D       : Dosya ayrıntıları
Del            : Seçili dosyayı sil
F2             : Dosyayı yeniden adlandır
Space          : Dosya önizleme
```

### Komut Paleti

**Hızlı Erişim (Ctrl + /):**
```
🔍 Komut Ara...
├─ 💬 Yeni konuşma başlat
├─ 📁 Dosya yükle
├─ 🤖 AI sağlayıcı değiştir
├─ ⚙️ Ayarları aç
├─ 🔄 Sayfayı yenile
├─ 🌙 Temayı değiştir
├─ 📊 Analitikleri görüntüle
└─ 💰 Fatura bilgilerini aç
```

**Akıllı Öneriler:**
- Son kullanılan komutlar öncelikli
- Bağlama göre öneriler
- Klavye navigasyon desteği
- Bulanık arama özelliği

## Tema ve Özelleştirme

### Tema Seçenekleri

**Açık Tema:**
```
🌞 Varsayılan Açık
├─ Beyaz arka plan
├─ Koyu metin
├─ Mavi aksan renkleri
└─ Yüksek kontrast
```

**Koyu Tema:**
```
🌙 Varsayılan Koyu
├─ Koyu gri arka plan
├─ Açık metin
├─ Mavi aksan renkleri
└─ Göz dostu kontrast
```

**Özel Temalar (Premium):**
```
🎨 Özelleştirilebilir
├─ Renk paleti seçimi
├─ Font tercihleri
├─ Aralık ayarları
└─ Aksan renkleri
```

### Layout Seçenekleri

**Kompakt Görünüm:**
- Daha az boşluk kullanımı
- Daha fazla içerik görünürlüğü
- Küçük ekranlar için optimize
- Hızlı navigasyon

**Konforlu Görünüm:**
- Geniş aralıklar
- Rahat okuma deneyimi
- Büyük hedef alanları
- Erişilebilirlik odaklı

**Özel Layout:**
- Panel boyutları ayarlanabilir
- Bileşen konumları özelleştirilebilir
- İş akışına göre optimize
- Workspace bazlı kayıt

## Duyarlı Tasarım

### Masaüstü Görünümü (1200px+)

```
┌─ Nav ─┬─────── Ana İçerik ─────────┬─ Yan Panel ─┐
│       │                           │              │
│ Menü  │    Sohbet Arayüzü        │  AI Bilgisi  │
│       │                           │              │
│ Dosya │    Mesaj Girişi           │  Dosya Info  │
│       │                           │              │
│ Ayar  │    Durum Çubuğu           │  Ayarlar     │
└───────┴───────────────────────────┴──────────────┘
```

### Tablet Görünümü (768px - 1199px)

```
┌─ Üst Nav ─────────────────────────────┐
├─ Yan Menu ─┬─── Ana İçerik ─────────┤
│            │                        │
│   Daralt   │    Sohbet             │
│   Menu     │                        │
│            │    Mesaj Girişi        │
└────────────┴────────────────────────┘
```

### Mobil Görünüm (< 768px)

```
┌─── Üst Bar ───┐
│ ☰ DeepWebAI 🔔│
├───────────────┤
│               │
│   Ana İçerik  │
│               │
├───────────────┤
│  Alt Navigas. │
└───────────────┘
```

**Mobil Optimizasyonları:**
- Dokunma dostu butonlar
- Kaydırma tabanlı navigasyon
- Otomatik klavye uyumu
- Gesture desteği

## Erişilebilirlik Özellikleri

### Görme Engelliler İçin

**Ekran Okuyucu Desteği:**
- ARIA etiketleri tam desteği
- Semantik HTML yapısı
- Odak yönetimi
- Klavye navigasyon

**Görsel Yardımcılar:**
```
⚙️ Erişilebilirlik Ayarları
├─ 🔤 Font boyutu artırma
├─ 🎨 Yüksek kontrast modu
├─ 🔍 Büyüteç özelliği
└─ ⚡ Azaltılmış animasyon
```

### Motor Engelliler İçin

**Klavye Navigasyon:**
- Tab sırası optimizasyonu
- Skip link'ler
- Klavye odak göstergeleri
- Alternatif input metodları

### İşitme Engelliler İçin

**Görsel Geri Bildirim:**
- Ses yerine görsel uyarılar
- Vibrasyon desteği (mobil)
- Görsel durum göstergeleri
- Metin tabanlı bildirimler

## Performans ve Optimizasyon

### Yavaş Bağlantı Desteği

**Aşamalı Yükleme:**
- Kritik içerik önceliği
- Lazy loading
- Progresif geliştirme
- Çevrimdışı cache

**Bant Genişliği Yönetimi:**
- Resim optimizasyonu
- Gzip sıkıştırma
- CDN kullanımı
- Akıllı önbellekleme

### Düşük Donanım Desteği

**Optimizasyon Seçenekleri:**
```
⚙️ Performans Ayarları
├─ 🚀 Hızlı mod (az animasyon)
├─ 💾 Düşük bellek kullanımı
├─ 🔋 Batarya tasarruf modu
└─ 📡 Düşük bant genişliği modu
```

## Özelleştirme ve Kişiselleştirme

### Workspace Yapılandırması

**Kişisel Ayarlar:**
```
🏠 Workspace Ayarları
├─ 📐 Layout tercihleri
├─ 🎨 Tema seçimi
├─ ⌨️ Kısayol özelleştirme
├─ 🔔 Bildirim tercihleri
└─ 📊 Dashboard widget'ları
```

**Takım Ayarları:**
```
👥 Takım Workspace
├─ 🏢 Marka özelleştirme
├─ 🔒 Güvenlik politikaları
├─ 📋 Varsayılan şablonlar
└─ 📈 Takım analitiği
```

### Gelişmiş Özelleştirme

**Developer Modu:**
- API endpoint'lerini görüntüleme
- Request/Response logları
- Performance metrikleri
- Debug konsolu

**Beta Özellikleri:**
- Deneysel UI bileşenleri
- Yeni navigasyon paternleri
- Gelişmiş özelleştirme seçenekleri
- A/B test katılımı

## Sorun Giderme

### Yaygın UI Sorunları

**Yavaş Yüklenme:**
1. Tarayıcı cache'ini temizle
2. Uzantıları devre dışı bırak
3. Farklı tarayıcı dene
4. İnternet bağlantısını kontrol et

**Layout Sorunları:**
1. Sayfayı yenile (F5)
2. Zoom seviyesini sıfırla
3. Tarayıcı uyumluluğunu kontrol et
4. Tema ayarlarını sıfırla

**Erişilebilirlik Sorunları:**
1. Erişilebilirlik ayarlarını kontrol et
2. Ekran okuyucu uyumluluğunu test et
3. Klavye navigasyonunu doğrula
4. Kontrast ayarlarını değerlendirmeyi

Bu kapsamlı UI rehberi, DeepWebAI platformunu en verimli şekilde kullanmanıza yardımcı olacaktır. Arayüzü ihtiyaçlarınıza göre özelleştirmeyi unutmayın!
