# AI Asistan Kullanım Rehberi

Birden fazla sağlayıcı seçeneği, gelişmiş özellikler ve akıllı konuşma yönetimi ile DeepWebAI'ın güçlü AI yeteneklerinde uzmanlaşın.

## AI Sağlayıcı Genel Bakış

### Mevcut AI Modelleri

**OpenAI GPT**
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **En İyi Kullanım**: Genel konuşmalar, yaratıcı yazım, kod yardımı
- **Güçlü Yanları**: Çok yönlü, iyi eğitilmiş, güvenilir yanıtlar
- **Kullanım Alanları**: Genel soru-cevap, beyin fırtınası, içerik oluşturma

**Anthropic Claude**
- **Models**: Claude-3 Opus, Claude-3 Sonnet, Claude-3 Haiku
- **En İyi Kullanım**: Analiz, mantık yürütme, etik tartışmalar
- **Güçlü Yanları**: Dikkatli mantık yürütme, nüanslı anlayış
- **Kullanım Alanları**: Karmaşık analiz, araştırma, ayrıntılı açıklamalar

**Google Gemini**
- **Models**: Gemini Pro, Gemini Flash
- **En İyi Kullanım**: Çok modlu görevler, görüntü analizi, hızlı yanıtlar
- **Güçlü Yanları**: Görüntü anlama, hız, entegrasyon
- **Kullanım Alanları**: Görüntü analizi, hızlı yanıtlar, görsel içerik

**DeepSeek**
- **Models**: DeepSeek Chat, DeepSeek Coder
- **En İyi Kullanım**: Uygun maliyetli konuşmalar, kodlama görevleri
- **Güçlü Yanları**: Verimli, özelleşmiş kodlama modeli mevcut
- **Kullanım Alanları**: Bütçe dostu kullanım, programlama yardımı

**Local Llama**
- **Models**: Kendi sunucunuzda barındırılan Llama modelleri
- **En İyi Kullanım**: Gizlilik odaklı konuşmalar, çevrimdışı kullanım
- **Güçlü Yanları**: Tam gizlilik, özelleştirilebilir, harici API yok
- **Kullanım Alanları**: Hassas veriler, çevrimdışı senaryolar, özel eğitim

### Sağlayıcı Seçimi

**Otomatik Seçim:**
- Platform akıllıca en iyi sağlayıcıyı seçer
- Sorgu türü ve mevcut kullanılabilirliğe göre
- Sağlayıcı kullanılamıyorsa sorunsuz geçiş
- Hız ve doğruluk için optimize edilmiş

**Manuel Seçim:**
```
1. AI sağlayıcı açılır menüsüne tıklayın
2. Tercih ettiğiniz modeli seçin
3. Sağlayıcı oturum boyunca seçili kalır
4. Konuşma sırasında istediğiniz zaman değiştirin
```

## Konuşma Başlatma

### Temel Sohbet Arayüzü

**Mesaj Girişi:**
- Mesajınızı metin kutusuna yazın
- Göndermek için Enter tuşuna basın
- Yeni satır eklemek için Shift+Enter (gönderme olmadan)
- Mesaj geçmişi otomatik olarak korunur

**Konuşma Akışı:**
```
Siz: Makine öğrenmesi nasıl çalışır?
AI: Makine öğrenmesi, yapay zekanın bir alt kümesidir...
Siz: Bana pratik bir örnek verebilir misiniz?
AI: Tabii ki! İşte pratik bir örnek...
```

### Gelişmiş Giriş Seçenekleri

**Çok Satırlı Mesajlar:**
- Satır sonları için Shift+Enter kullanın
- Kod blokları için backtick kullanın
- Karmaşık soruları açık bir şekilde yapılandırın
- Bağlam ve ayrıntıları dahil edin

**Mesaj Formatı:**
```markdown
**Kalın metin** vurgu için
*İtalik metin* hafif vurgu için
`kod parçacıkları` teknik terimler için
- Listeler için madde işaretleri
1. Sıralar için numaralı listeler
```

### Bağlam Yönetimi

**Konuşma Hafızası:**
- AI tüm konuşma geçmişini hatırlar
- Önceki mesajlara doğal olarak referans verin
- Zaman içinde karmaşık tartışmalar geliştirin
- Bağlam oturumlar arasında korunur

**Dosya Bağlamı:**
- Yüklenen dosyalar sohbet boyunca kullanılabilir
- Belgelere isimle referans verin
- AI dosyaları konuşma bağlamında analiz eder
- Birden fazla dosya içgörüsünü birleştirin

## Konuşma Türleri

### Genel Soru-Cevap

**Bilgi Talepleri:**
```
Örnekler:
"Kuantum bilişimi basit terimlerle açıkla"
"Yenilenebilir enerjinin faydaları nelerdir?"
"Python programlama öğrenmeye nasıl başlarım?"
```

**Araştırma Yardımı:**
```
Örnekler:
"Farklı proje yönetimi metodolojilerini karşılaştır"
"AI geliştirmesindeki en son trendler nelerdir?"
"Uzaktan çalışmanın artı ve eksilerini analiz et"
```

### Teknik Yardım

**Programlama Yardımı:**
```
Örnekler:
"Bu JavaScript fonksiyonunu debug et"
"Bu Python hata mesajını açıkla"
"Bir e-ticaret sitesi için veritabanı şeması tasarla"
```

**Problem Çözme:**
```
Örnekler:
"Bu algoritmayı optimize etmeme yardım et"
"Kodumu güvenlik açıkları için incele"
"Bu mimari için iyileştirmeler öner"
```

### Yaratıcı Görevler

**İçerik Oluşturma:**
```
Örnekler:
"Sürdürülebilir teknoloji hakkında blog yazısı yaz"
"Bilim kurgu romanı için hikaye taslağı oluştur"
"Yeni ürün için pazarlama metni üret"
```

**Beyin Fırtınası:**
```
Örnekler:
"Uygulama özelliklerini beyin fırtınası yapmama yardım et"
"İşletme ismi fikirleri üret"
"Takım oluşturma için yaratıcı çözümler öner"
```

### Belge Analizi

**Dosya Tabanlı Konuşmalar:**
```
Örnekler:
"Bu araştırma makalesini özetle"
"Bu rapordan anahtar metrikleri çıkar"
"Bu belgede ana argümanlar nelerdir?"
```

**Çoklu Dosya Analizi:**
```
Örnekler:
"Bu iki teklifi karşılaştır"
"Bu belgeler arasında ortak temaları bul"
"Raporlar arasındaki tutarsızlıkları belirle"
```

## Gelişmiş Özellikler

### Akış Yanıtları

**Gerçek Zamanlı Çıktı:**
- Yanıtlar kelime kelime görünür
- AI'ın düşünce sürecini görün
- Yanıt yoldan çıkarsa müdahale edin
- Doğal konuşma akışı

**Faydalar:**
- Daha hızlı algılanan yanıt süresi
- Etkileşimli deneyim
- Daha iyi katılım
- Anında geri bildirim mevcut

### Hız Sınırları ve Kotalar

**Kullanım Limitleri:**
```
Ücretsiz Seviye:
- Günde 50 mesaj
- Mesaj başına 10.000 token
- Sadece temel modeller

Premium Seviye:
- Günde 500 mesaj
- Mesaj başına 50.000 token
- Tüm modeller mevcut

Geliştirici Seviyesi:
- Sınırsız mesaj
- Mesaj başına 100.000 token
- Öncelikli erişim
```

**Kullanımı Yönetme:**
- Ayarlarda kullanımı izleyin
- Daha fazla kapasite için planı yükseltin
- Mesaj verimliliğini optimize edin
- Görev için uygun model kullanın

### Hata İşleme

**Otomatik Yedek Geçiş:**
- Birincil başarısız olursa yedek sağlayıcıya geç
- Sorunsuz kullanıcı deneyimi
- Konuşmada kesinti yok
- Şeffaf hata kurtarma

**Manuel Kurtarma:**
- Başarısız mesajları yeniden deneyin
- Sağlayıcıları manuel olarak değiştirin
- Kalıcı sorunları bildirin
- Alternatif ifade önerileri

## Konuşma Yönetimi

### Konuşmaları Kaydetme

**Otomatik Kaydetme:**
- Tüm konuşmalar otomatik olarak kaydedilir
- Manuel işlem gerekmez
- Tarayıcı oturumları arasında kalıcı
- Güvenli bulut depolama

**Manuel Yönetim:**
```
Seçenekler:
- Önemli konuşmaları yıldızla
- Özel başlıklar ekle
- Eski konuşmaları arşivle
- İstenmeyen sohbetleri sil
```

### Sohbetleri Organize Etme

**Konuşma Listesi:**
```
📚 Son Konuşmalar
├── ⭐ Makine Öğrenmesi Öğreticisi
├── 📄 Belge Analizi - Q1 Raporu
├── 💻 Python Kod İncelemesi
├── 🧠 Yaratıcı Yazım Oturumu
└── 📊 Veri Analizi Yardımı
```

**Filtreleme Seçenekleri:**
- Tarih aralığına göre filtrele
- Anahtar kelimelere göre ara
- AI sağlayıcıya göre filtrele
- Önem sırasına göre sırala

### Arama ve Geçmiş

**Geçmiş Konuşmaları Bulma:**
```
Arama Özellikleri:
- Tüm mesajlarda tam metin arama
- Katılımcıya (AI modeli) göre filtrele
- Tarih aralığı filtreleme
- Etiket tabanlı organizasyon
```

**Arama İpuçları:**
- Belirli anahtar kelimeler kullanın
- Aramaya AI sağlayıcıyı dahil edin
- Belge sohbetleri için dosya isimlerini arayın
- Tam ifadeler için tırnak kullanın

## Optimizasyon İpuçları

### Etkili İstemler Yazma

**Spesifik Olun:**
```
❌ "Kodlama yardımı"
✅ "TypeError veren bu Python fonksiyonunu debug et"
```

**Bağlam Sağlayın:**
```
❌ "Bunu analiz et"
✅ "Bu çeyreklik satış raporunu bölgesel performans trendlerine odaklanarak analiz et"
```

**Takip Soruları Sorun:**
```
Örnekler:
"3. noktayı detaylandırabilir misiniz?"
"Bu yaklaşımın sonuçları neler olurdu?"
"Bu pratikte nasıl çalışır?"
```

### Doğru AI'ı Seçme

**Görev Tabanlı Seçim:**
```
Yaratıcı Yazım: OpenAI GPT
Derin Analiz: Anthropic Claude
Görüntü Görevleri: Google Gemini
Kodlama: DeepSeek Coder
Gizlilik: Local Llama
```

**Performans Değerlendirmeleri:**
- Hız vs. kalite ödünleşimleri
- Maliyet vs. yetenek dengesi
- Kullanılabilirlik ve güvenilirlik
- Belirli model güçlü yanları

### Token Kullanımını Yönetme

**Verimli Mesajlaşma:**
- Mesajları odaklı tutun
- Gereksiz tekrardan kaçının
- Açık, kısa dil kullanın
- Karmaşık sorguları parçalara bölün

**Token Farkındalığı:**
```
Yaklaşık Token Sayıları:
- 1 token ≈ 4 karakter
- Ortalama kelime ≈ 1.3 token
- Uzun mesajlar daha fazla token kullanır
- Dosya içeriği token sayısına eklenir
```

## Sorun Giderme

### Yaygın Sorunlar

**AI Yanıt Vermiyor:**
1. İnternet bağlantısını kontrol edin
2. Hız sınırı durumunu doğrulayın
3. Farklı AI sağlayıcı deneyin
4. Kalıcıysa tarayıcıyı yenileyin

**Yavaş Yanıtlar:**
1. Sunucu durumunu kontrol edin
2. Yoğun olmayan saatlerde deneyin
3. Daha hızlı model kullanın (Gemini Flash)
4. Mesaj karmaşıklığını azaltın

**Beklenmeyen Yanıtlar:**
1. Daha fazla bağlam sağlayın
2. Sorunuzu yeniden ifade edin
3. Farklı AI sağlayıcı deneyin
4. Karmaşık sorguları adımlara bölün

### Hata Mesajları

**Hız Sınırı Aşıldı:**
- Kota sıfırlanması için bekleyin
- Daha yüksek seviyeye yükseltin
- Daha verimli mesajlaşma kullanın
- Kullanımı gün boyunca yayın

**Sağlayıcı Kullanılamıyor:**
- Otomatik yedek geçiş etkinleştirildi
- Manuel sağlayıcı seçimi
- Birkaç dakika sonra yeniden deneyin
- Güncellemeler için durum sayfasını kontrol edin

**Geçersiz Giriş:**
- Mesaj formatını kontrol edin
- Yükleme yapıyorsanız dosya türlerini doğrulayın
- Mesaj uzunluğunu azaltın
- Özel karakterleri kaldırın

## En İyi Uygulamalar

### Konuşma Nezaketi

**Açık İletişim:**
- Neye ihtiyacınız olduğu konusunda spesifik olun
- İlgili bağlamı sağlayın
- Seferde bir soru sorun
- Açıklama için takip edin

**Etkili İşbirliği:**
- Önceki yanıtlar üzerine inşa edin
- AI yanıtlarının belirli bölümlerine referans verin
- Yanlış anlamaları hızla düzeltin
- Konuşma dizisini sürdürün

### Gizlilik ve Güvenlik

**Hassas Bilgiler:**
- Kişisel verileri paylaşmaktan kaçının
- Parolaları veya anahtarları dahil etmeyin
- Hassas içerik için Local Llama kullanmayı düşünün
- Paylaşmadan önce konuşmayı gözden geçirin

**Veri İşleme:**
- Konuşmalar şifrelenir
- Dosyalar güvenli bir şekilde işlenir
- Veriler yetkisiz taraflarla paylaşılmaz
- Saklama politikaları otomatik olarak uygulanır

### AI Değerini Maksimize Etme

**Öğrenme Yaklaşımı:**
- Farklı sağlayıcılarla deneyim yapın
- Her modelin güçlü yanlarını öğrenin
- Karmaşık konuşmaları kademeli olarak geliştirin
- Etkili istem yazma konusunda notlar alın

**Verimlilik İpuçları:**
- Faydalı konuşma şablonlarını kaydedin
- Etkili istem kalıplarını yeniden kullanın
- Konuşmaları proje bazında organize edin
- Eski sohbetleri düzenli olarak temizleyin

Unutmayın: AI asistanı, pratikte daha etkili hale gelen güçlü bir araçtır. Özel ihtiyaçlarınız için en uygun olanı bulmak için farklı yaklaşımlar ve sağlayıcılarla deneyim yapın!
