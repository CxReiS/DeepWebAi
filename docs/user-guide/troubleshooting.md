# Sorun Giderme Rehberi

DeepWebAI platformunu kullanırken karşılaşabileceğiniz yaygın sorunlar için kapsamlı çözümler.

## Başlangıç Sorunları

### Hesap Oluşturma Sorunları

**E-posta Doğrulaması Alınamadı**
```
Sorun: Doğrulama e-postası gelmiyor
Çözümler:
1. Spam/gereksiz klasörünü kontrol edin
2. Teslimat için 5-10 dakika bekleyin
3. E-posta adresinin doğru olduğunu doğrulayın
4. Yeni doğrulama e-postası isteyin
5. Kalıcıysa destekle iletişime geçin
```

**OAuth Giriş Başarısızlıkları**
```
Sorun: Google/GitHub/Discord ile giriş yapılamıyor
Çözümler:
1. Tarayıcı çerezlerini ve önbelleğini temizleyin
2. Tarayıcı uzantılarını geçici olarak devre dışı bırakın
3. Gizli/özel tarama modunu deneyin
4. OAuth sağlayıcı hesap durumunu kontrol edin
5. Farklı tarayıcı kullanın
6. Gerekirse sağlayıcı desteğiyle iletişime geçin
```

**Parola Sıfırlama Sorunları**
```
Sorun: Parola sıfırlama e-postası çalışmıyor
Çözümler:
1. E-posta adresi yazım hatalarını kontrol edin
2. Spam klasörüne bakın
3. 15 dakikaya kadar bekleyin
4. Farklı tarayıcı deneyin
5. Tarayıcı verilerini temizleyin
6. Hesap detaylarıyla destekle iletişime geçin
```

### Giriş ve Kimlik Doğrulama

**Çok Faktörlü Kimlik Doğrulama Sorunları**
```
Sorun: MFA kodu çalışmıyor
Çözümler:
1. Cihaz saatinin senkronize olduğundan emin olun
2. Saat dilimi ayarlarını kontrol edin
3. Sıradaki önceki/sonraki kodu deneyin
4. Varsa yedek kodları kullanın
5. Gerekirse MFA kurulumunu yenileyin
6. MFA sıfırlaması için destekle iletişime geçin
```

**Oturum Süresi Dolma Sorunları**
```
Sorun: Sık sık oturumdan çıkılıyor
Çözümler:
1. "Beni Hatırla" seçeneğini etkinleştirin
2. Tarayıcı çerez ayarlarını kontrol edin
3. Agresif gizlilik uzantılarını devre dışı bırakın
4. Kararlı internet bağlantısını doğrulayın
5. Tarayıcıyı en son sürüme güncelleyin
```

## AI ve Konuşma Sorunları

### AI Yanıt Sorunları

**AI'dan Yanıt Yok**
```
Sorun: AI mesajlara yanıt vermiyor
Tanı Adımları:
1. İnternet bağlantısını kontrol edin
2. Ayarlarda hız sınırı durumunu doğrulayın
3. Farklı AI sağlayıcı deneyin
4. Sistem durum sayfasını kontrol edin
5. Tarayıcıyı tamamen yenileyin

Çözümler:
- Hız sınırı sıfırlanması için bekleyin
- Alternatif AI sağlayıcıya geçin
- Mesaj karmaşıklığını azaltın
- Yoğun olmayan saatlerde tekrar deneyin
```

**Yavaş AI Yanıtları**
```
Sorun: AI yanıt vermesi çok uzun sürüyor
Çözümler:
1. İnternet hızınızı kontrol edin
2. Daha hızlı AI modeline geçin (Gemini Flash)
3. Mesaj uzunluğunu azaltın
4. Yoğun olmayan saatlerde deneyin
5. Tarayıcı önbelleğini temizleyin
6. Farklı tarayıcı kullanın
```

**Düşük Kaliteli Yanıtlar**
```
Sorun: AI yanıtları yardımcı olmuyor
İyileştirmeler:
1. Sorularınızda daha fazla bağlam sağlayın
2. İhtiyacınız konusunda daha spesifik olun
3. Karşılaştırma için farklı AI sağlayıcı deneyin
4. Karmaşık soruları parçalara bölün
5. Yüklenen dosyalara açıkça referans verin
6. Açıklama için takip soruları kullanın
```

**Hız Sınırı Aşıldı**
```
Sorun: "Hız sınırı aşıldı" hatası
Çözümler:
1. Kota sıfırlanması için bekleyin (hatada gösterilir)
2. Daha yüksek seviye plana yükseltin
3. Mesaj kullanımını optimize edin
4. Kullanımı gün boyunca yayın
5. Daha verimli istem kullanımı yapın
```

### Sağlayıcı Özel Sorunlar

**OpenAI Bağlantı Sorunları**
```
Belirtiler: OpenAI modelleri yanıt vermiyor
Çözümler:
1. OpenAI durum sayfasını kontrol edin
2. Geçici olarak Claude veya Gemini'ye geçin
3. API kota durumunu doğrulayın
4. 5-10 dakika sonra tekrar deneyin
5. Kalıcı sorunları bildirin
```

**Anthropic Claude Sorunları**
```
Belirtiler: Claude yanıtları başarısız oluyor
Çözümler:
1. Claude hizmet durumunu doğrulayın
2. Geçici olarak OpenAI'ya geçin
3. Mesaj içeriğini politika ihlalleri için kontrol edin
4. Mesaj karmaşıklığını azaltın
5. Farklı konuşma yaklaşımı deneyin
```

**Yerel AI Sorunları**
```
Belirtiler: Local Llama çalışmıyor
Çözümler:
1. Yerel sunucu durumunu kontrol edin
2. Sunucuya ağ bağlantısını doğrulayın
3. Yerel AI hizmetini yeniden başlatın
4. Sunucu kaynak kullanılabilirliğini kontrol edin
5. Bulut sağlayıcılarına geri dönün
```

## Dosya İşleme Sorunları

### Yükleme Sorunları

**Dosya Yükleme Başarısız**
```
Sorun: Dosyalar yüklenemiyor
Tanı Adımları:
1. Dosya boyutunu kontrol edin (limitler seviyeye göre değişir)
2. Dosya formatının desteklendiğini doğrulayın
3. İnternet bağlantısı kararlılığını kontrol edin
4. Önce küçük dosyaları deneyin

Çözümler:
- Büyük dosyaları sıkıştırın
- Desteklenen formata dönüştürün (PDF, DOCX, PNG, JPEG)
- Kararlı internet bağlantısı kullanın
- Dosyaları tek tek yüklemeyi deneyin
```

**Desteklenen Dosya Formatları**
```
✅ Desteklenen:
- PDF belgeleri
- DOCX Word belgeleri
- PNG resimleri
- JPEG/JPG resimleri
- GIF resimleri

❌ Desteklenmeyen:
- Excel dosyaları (PDF'ye dönüştürün)
- PowerPoint (PDF'ye aktarın)
- Ses/video dosyaları
- Çalıştırılabilir dosyalar
- Sıkıştırılmış arşivler
```

### İşleme Sorunları

**Dosya İşleme Takıldı**
```
Sorun: Dosya süresiz "İşleniyor..." gösteriyor
Çözümler:
1. Karmaşık dosyalar için 2-3 dakika bekleyin
2. Durumu kontrol etmek için tarayıcıyı yenileyin
3. İptal edip dosyayı yeniden yükleyin
4. Yoğun olmayan saatlerde işlemeyi deneyin
5. Dosya önemliyse destekle iletişime geçin
```

**OCR Çalışmıyor**
```
Sorun: Resimlerden metin çıkarılamıyor
İyileştirmeler:
1. Daha yüksek çözünürlüklü resimler kullanın
2. İyi kontrast ve aydınlatma sağlayın
3. Eğik veya döndürülmüş resimlerden kaçının
4. Desteklenen dilleri kullanın (öncelikle İngilizce)
5. Resmi önce PDF'ye dönüştürmeyi deneyin
```

**PDF İşleme Hataları**
```
Sorun: PDF içeriği çıkarılamıyor
Çözümler:
1. PDF'nin parola korumalı olup olmadığını kontrol edin (korumayı kaldırın)
2. PDF'nin bozuk olmadığını doğrulayın
3. Farklı PDF dışa aktarma ayarlarını deneyin
4. Farklı PDF sürümüne dönüştürün
5. Gerekirse sayfaların resim dışa aktarımını kullanın
```

## Bağlantı ve Performans

### İnternet Bağlantısı Sorunları

**Yavaş Yükleme**
```
Sorun: Platform yavaş yükleniyor
Çözümler:
1. İnternet hızını kontrol edin (minimum 1 Mbps önerilen)
2. Diğer bant genişliği yoğun uygulamaları kapatın
3. Farklı tarayıcı deneyin
4. Tarayıcı önbelleğini ve çerezleri temizleyin
5. Gereksiz tarayıcı uzantılarını devre dışı bırakın
6. Mevcut ise farklı ağa bağlanın
```

**Bağlantı Kesintisi Sorunları**
```
Sorun: Sık bağlantı kesintileri
Çözümler:
1. Wi-Fi sinyal gücünü kontrol edin
2. Mümkünse kablolu bağlantı kullanın
3. VPN'i geçici olarak devre dışı bırakın
4. Ağ sürücülerini güncelleyin
5. Kalıcıysa ISS ile iletişime geçin
```

### Tarayıcı Uyumluluğu

**Önerilen Tarayıcılar**
```
✅ Tam Desteklenen:
- Chrome 90+ (Önerilen)
- Firefox 88+
- Safari 14+
- Edge 90+

⚠️ Sınırlı Destek:
- Internet Explorer (önerilmez)
- Eski tarayıcı sürümleri

🚫 Desteklenmeyen:
- IE 11 ve altı
- Çok eski mobil tarayıcılar
```

**Tarayıcı Özel Sorunlar**
```
Chrome:
- Tarama verilerini temizle: Ayarlar → Gizlilik → Tarama verilerini temizle
- Uzantıları devre dışı bırak: Menü → Diğer araçlar → Uzantılar

Firefox:
- Verileri temizle: Seçenekler → Gizlilik ve Güvenlik → Verileri Temizle
- Güvenli mod: Yardım → Eklentiler Devre Dışı ile Yeniden Başlat

Safari:
- Önbelleği temizle: Geliştir → Önbellekleri Boşalt
- Safari'yi sıfırla: Safari → Safari'yi Sıfırla
```

## Gerçek Zamanlı Özellikler

### Sohbet ve Mesajlaşma Sorunları

**Mesajlar Gönderilmiyor**
```
Sorun: Mesajlar "Gönderiliyor..." durumunda kalıyor
Çözümler:
1. İnternet bağlantısını kontrol edin
2. Tarayıcı sekmesini yenileyin
3. Mesaj metnini kopyalayın ve yeniden gönderin
4. Farklı tarayıcı deneyin
5. Mesaj içeriğinin politikaları ihlal edip etmediğini kontrol edin
```

**Gerçek Zamanlı Güncellemeler Çalışmıyor**
```
Sorun: Canlı güncellemeler görülmüyor
Çözümler:
1. WebSocket bağlantı durumunu kontrol edin
2. Güvenlik duvarı/VPN'i geçici olarak devre dışı bırakın
3. Farklı ağ deneyin
4. Tarayıcı bildirimlerini etkinleştirin
5. Tarayıcıyı tamamen yenileyin
```

**Bildirim Sorunları**
```
Sorun: Bildirimler alınamıyor
Çözümler:
1. Tarayıcı bildirim izinlerini kontrol edin
2. Platform ayarlarında bildirimleri etkinleştirin
3. Cihaz bildirim ayarlarını doğrulayın
4. Konuşma başına bildirim tercihlerini doğrulayın
5. Farklı tarayıcıyla test edin
```

## Depolama ve Veri

### Dosya Depolama Sorunları

**Depolama Limiti Doldu**
```
Sorun: Daha fazla dosya yüklenemiyor
Çözümler:
1. Gereksiz dosyaları silin
2. Eski konuşmaları temizleyin
3. Daha yüksek seviyeye yükseltin
4. Büyük dosyaları dışa aktarın ve kaldırın
5. Yüklemeden önce dosyaları sıkıştırın
```

**Eksik Dosyalar veya Konuşmalar**
```
Sorun: Önceden yüklenen dosyalar/sohbetler kayboldu
Adımlar:
1. Arşivlenmiş konuşmaları kontrol edin
2. Hesap girişini doğrulayın (aynı hesap?)
3. Dosyaların süresinin dolup dolmadığını kontrol edin (saklama politikasına göre)
4. Anahtar kelimelerle konuşmaları arayın
5. Belirli detaylarla destekle iletişime geçin
```

## Hesap ve Faturalandırma

### Abonelik Sorunları

**Yükseltme Sorunları**
```
Sorun: Abonelik yükseltilemiyor
Çözümler:
1. Tarayıcı önbelleğini ve çerezleri temizleyin
2. Farklı ödeme yöntemi deneyin
3. Kartın/hesabın yeterli bakiyesi olup olmadığını kontrol edin
4. Farklı tarayıcı deneyin
5. Faturalandırma desteğiyle iletişime geçin
```

**Özellik Erişim Sorunları**
```
Sorun: Yükseltmeden sonra premium özellikler mevcut değil
Çözümler:
1. Çıkış yapın ve tekrar giriş yapın
2. Tarayıcı önbelleğini temizleyin
3. Ayarlarda abonelik durumunu kontrol edin
4. Etkinleştirme için 5-10 dakika bekleyin
5. Çözülmezse destekle iletişime geçin
```

### Veri Dışa Aktarma ve Yedekleme

**Dışa Aktarma Başarısızlıkları**
```
Sorun: Konuşmalar/veriler dışa aktarılamıyor
Çözümler:
1. Daha küçük tarih aralıklarını dışa aktarmayı deneyin
2. Farklı dışa aktarma formatı seçin
3. Mevcut depolama alanını kontrol edin
4. Yoğun olmayan saatlerde deneyin
5. Büyük dışa aktarmalar için destekle iletişime geçin
```

## Güvenlik ve Gizlilik

### Güvenlik Endişeleri

**Şüpheli Hesap Aktivitesi**
```
Atılacak Adımlar:
1. Parolayı derhal değiştirin
2. Ayarlarda aktif oturumları kontrol edin
3. Tüm cihazlardan çıkış yapın
4. Henüz aktif değilse MFA'yı etkinleştirin
5. Son hesap aktivitesini gözden geçirin
6. Gerekirse güvenlik ekibiyle iletişime geçin
```

**Veri Gizliliği Sorunları**
```
Veri Kullanımı Endişeleri:
1. Gizlilik politikasını gözden geçirin
2. Profilde veri ayarlarını kontrol edin
3. İstenirse analizlerden çıkın
4. Saklama politikalarını anlayın
5. Sorularınızla gizlilik ekibiyle iletişime geçin
```

## Ek Yardım Alma

### Self Servis Kaynaklar

**Dokümantasyon**
- 📖 Kullanıcı rehberleri ve öğreticiler
- 🎥 Video açıklamaları
- 📋 SSS bölümü
- 🔧 Teknik dokümantasyon

**Topluluk Desteği**
- 💬 Kullanıcı forumları ve tartışmalar
- 🤝 Kullanıcıdan kullanıcıya yardım
- 💡 İpuçları ve en iyi uygulamalar
- 🆕 Özellik istekleri ve geri bildirim

### Doğrudan Destek

**Destek Kanalları**
```
📧 E-posta Desteği:
- Genel sorunlar: help@deepwebai.com
- Teknik problemler: tech@deepwebai.com
- Faturalandırma sorguları: billing@deepwebai.com
- Güvenlik endişeleri: security@deepwebai.com

💬 Canlı Sohbet:
- İş saatleri boyunca mevcut
- Premium kullanıcılar öncelik alır
- Teknik uzmanlar mevcut

📞 Telefon Desteği:
- Sadece kurumsal müşteriler
- Acil güvenlik sorunları
- Kritik iş etkileyen problemler
```

**Destekle İletişime Geçerken**

**Bu Bilgileri Ekleyin:**
```
🔍 Problem Açıklaması:
- Ne yapmaya çalışıyordunuz
- Bunun yerine ne oldu
- Hata mesajları (tam metin)
- Problem ne zaman başladı

🖥️ Teknik Detaylar:
- Tarayıcı adı ve sürümü
- İşletim sistemi
- İnternet bağlantısı türü
- Hata ekran görüntüsü (varsa)

📱 Hesap Bilgileri:
- Hesap e-posta adresi
- Abonelik seviyesi
- Sorunun yaklaşık zamanı
- Zaten denenen adımlar
```

**Yanıt Süreleri**
```
📬 E-posta Desteği:
- Ücretsiz kullanıcılar: 48-72 saat
- Premium kullanıcılar: 24-48 saat
- Geliştirici kullanıcıları: 12-24 saat
- Kurumsal: 4-8 saat

💬 Canlı Sohbet:
- 09:00 - 18:00 EST saatleri arasında mevcut
- 5 dakika içinde yanıt
- Premium kullanıcılar öncelik kuyruğu

🚨 Acil Sorunlar:
- Güvenlik ihlalleri: Anında
- Sistem kesintileri: 1 saat içinde
- Kritik hatalar: 4 saat içinde
```

## Önleme İpuçları

### Yaygın Sorunlardan Kaçınma

**Düzenli Bakım**
```
Haftalık Görevler:
✅ Tarayıcı önbelleğini temizle
✅ Tarayıcıyı en son sürüme güncelle
✅ Konuşmaları gözden geçir ve organize et
✅ Depolama kullanımını kontrol et
✅ Yedek kodların güvenli olduğunu doğrula

Aylık Görevler:
✅ İstenirse parolayı güncelle
✅ Aktif oturumları gözden geçir
✅ Eski dosyaları temizle
✅ Abonelik kullanımını kontrol et
✅ Gizlilik ayarlarını gözden geçir
```

**En İyi Uygulamalar**
```
🔐 Güvenlik:
- Güçlü, benzersiz parolalar kullanın
- MFA'yı etkinleştirin
- Hesap aktivitesini izleyin
- Paylaşılan bilgisayarlarda çıkış yapın

💾 Veri Yönetimi:
- Düzenli konuşma temizliği
- Önemli verileri dışa aktarın
- Depolama kullanımını izleyin
- Dosyaları sistematik olarak organize edin

⚡ Performans:
- Önerilen tarayıcıları kullanın
- Kararlı internet bağlantısı
- Gereksiz sekmeleri kapatın
- Tarayıcıyı güncel tutun
```

Unutmayın: Çoğu sorun temel sorun giderme adımlarıyla çözülebilir. Sorunlar devam ederse, sorununuz hakkında ayrıntılı bilgilerle destekle iletişime geçmekten çekinmeyin.
