# Kimlik Doğrulama ve Hesap Kurulumu

Çok faktörlü kimlik doğrulama (MFA) ve OAuth sağlayıcıları dahil olmak üzere kapsamlı kimlik doğrulama seçenekleriyle DeepWebAI hesabınızı güvence altına alın.

## Hesap Kaydı

### E-posta Kaydı

1. **Kayıt Süreci**
   ```
   1. Ana sayfada "Sign Up" butonuna tıklayın
   2. E-posta adresinizi girin
   3. Güçlü bir parola oluşturun (minimum 8 karakter)
   4. Parolayı onaylayın
   5. Hizmet şartlarını kabul edin
   6. "Create Account" butonuna tıklayın
   ```

2. **E-posta Doğrulama**
   - Gelen kutunuzda doğrulama e-postasını kontrol edin
   - Doğrulama bağlantısına tıklayın
   - Hesap otomatik olarak etkinleştirilecektir

### OAuth Kaydı

Desteklenen OAuth sağlayıcıları:
- **Google**: Google hesabı ile hızlı kurulum
- **GitHub**: Geliştirici dostu seçenek
- **Discord**: Oyun topluluğu entegrasyonu
- **Twitter**: Sosyal medya bağlantısı

**OAuth Kurulum Adımları:**
1. Tercih ettiğiniz OAuth sağlayıcısına tıklayın
2. DeepWebAI erişimini yetkilendirin
3. Profil bilgilerini tamamlayın
4. Hesap oluşturulur ve doğrulanır

## Çok Faktörlü Kimlik Doğrulama (MFA)

### MFA'yı Neden Etkinleştirmeli?

- **Gelişmiş Güvenlik**: Parola ihlallerine karşı koruma sağlar
- **Hesap Koruması**: Yetkisiz erişimi önler
- **Uyumluluk**: Güvenlik en iyi uygulamalarını karşılar
- **Gönül Rahatlığı**: Değerli konuşmalarınızı ve verilerinizi güvence altına alır

### MFA Kurulumu

1. **Güvenlik Ayarlarına Erişim**
   ```
   Profile → Settings → Security → Two-Factor Authentication
   ```

2. **MFA'yı Etkinleştirme**
   - "Enable Two-Factor Authentication" butonuna tıklayın
   - Kimlik doğrulayıcı uygulamanızı seçin:
     - Google Authenticator (önerilen)
     - Microsoft Authenticator
     - Authy
     - 1Password
     - Herhangi bir TOTP uyumlu uygulama

3. **QR Kodunu Tarama**
   - Kimlik doğrulayıcı uygulamanızı açın
   - Gösterilen QR kodunu tarayın
   - Uygulamanızdan 6 haneli kodu girin
   - Yedek kodlarınızı güvenli bir şekilde kaydedin

4. **Kurulumu Doğrulama**
   - Çıkış yapın ve tekrar giriş yapın
   - Parolanızı girin
   - Uygulamanızdan MFA kodunu sağlayın
   - Başarıyla kimlik doğrulandı!

### MFA Yedek Kodları

**Önemli**: Bu yedek kodları güvenli bir yerde saklayın!

- **Kodları İndirme**: MFA'yı etkinleştirdikten sonra yedek kodları indirin
- **Güvenli Saklama**: Kodları parola yöneticisinde veya güvenli yerde tutun
- **Tek Kullanım**: Her yedek kod yalnızca bir kez kullanılabilir
- **Yeni Oluşturma**: Gerektiğinde yeni yedek kodlar oluşturun

### MFA Kullanımı

**Normal Giriş Süreci:**
1. E-posta ve parola girin
2. "Sign In" butonuna tıklayın
3. Kimlik doğrulayıcı uygulamasını açın
4. Mevcut 6 haneli kodu girin
5. Erişim sağlandı!

**Yedek Kodları Kullanma:**
1. Kimlik doğrulayıcı kullanılamıyorsa, "Use backup code" seçeneğine tıklayın
2. Kayıtlı yedek kodlarınızdan birini girin
3. Kullandıktan sonra yeni yedek kodlar oluşturun

## Parola Yönetimi

### Parola Gereksinimleri

- **Minimum 8 karakter**
- **Büyük ve küçük harflerin karışımı**
- **En az bir rakam**
- **Özel karakterler önerilir**
- **Yaygın parolaları kullanmaktan kaçının**

### Parolanızı Değiştirme

1. **Ayarlara Erişim**
   ```
   Profile → Settings → Security → Change Password
   ```

2. **Güncelleme Süreci**
   - Mevcut parolayı girin
   - Yeni parolayı girin
   - Yeni parolayı onaylayın
   - "Update Password" butonuna tıklayın

3. **Güvenlik Bildirimi**
   - Tüm aktif oturumlar sonlandırılacaktır
   - Tüm cihazlarda tekrar giriş yapmanız gerekecektir
   - Etkinse MFA gerekli olacaktır

### Parola Sıfırlama

**Parolanızı Hatırlıyorsanız:**
- Ayarlardaki parola değiştirme seçeneğini kullanın

**Parolanızı Unuttuysanız:**
1. Giriş sayfasında "Forgot Password" seçeneğine tıklayın
2. E-posta adresinizi girin
3. Sıfırlama bağlantısı için e-postanızı kontrol edin
4. Bağlantıya tıklayın ve yeni parola oluşturun
5. Yeni kimlik bilgileriyle giriş yapın

## OAuth Hesap Yönetimi

### Bağlı Hesaplar

OAuth bağlantılarınızı görüntüleyin ve yönetin:
```
Profile → Settings → Connected Accounts
```

### OAuth Sağlayıcılarını Ekleme

1. **Ek Sağlayıcıları Bağlama**
   - İstenen sağlayıcının yanındaki "Connect" seçeneğine tıklayın
   - Erişimi yetkilendirin
   - Sağlayıcı hesabınıza bağlanır

2. **Birden Fazla Sağlayıcının Faydaları**
   - Alternatif giriş yöntemleri
   - Hesap kurtarma seçenekleri
   - Kolaylık ve esneklik

### OAuth Sağlayıcılarını Kaldırma

1. **Sağlayıcı Bağlantısını Kesme**
   - Sağlayıcının yanındaki "Disconnect" seçeneğine tıklayın
   - Kaldırmayı onaylayın
   - Sağlayıcı erişimi iptal edilir

**⚠️ Uyarı**: Sağlayıcıların bağlantısını kesmeden önce alternatif giriş yöntemleriniz olduğundan emin olun!

## Oturum Yönetimi

### Aktif Oturumlar

Hesap erişiminizi izleyin:
```
Profile → Settings → Security → Active Sessions
```

**Oturum Bilgileri:**
- Cihaz türü ve tarayıcı
- IP adresi ve konum
- Son etkinlik zaman damgası
- Mevcut oturum göstergesi

### Oturumları Yönetme

1. **Tüm Oturumları Görüntüleme**
   - Tüm aktif girişleri görün
   - Şüpheli etkinlikleri belirleyin

2. **Oturumları Sonlandırma**
   - Belirli oturumda "Sign Out" seçeneğine tıklayın
   - Veya güvenlik için "Sign Out All Devices" seçeneğini kullanın

3. **Oturum Güvenliği**
   - Oturumlar 7 gün hareketsizlikten sonra sona erer
   - Parola değişikliğinde otomatik çıkış
   - Yeni oturumlar için MFA gereklidir

## Hesap Güvenliği En İyi Uygulamaları

### Güçlü Kimlik Doğrulama

1. **Benzersiz Parolalar Kullanın**
   - DeepWebAI için farklı parola
   - Parola yöneticisi kullanmayı düşünün
   - Düzenli parola güncellemeleri

2. **MFA'yı Etkinleştirin**
   - Mevcut olduğunda her zaman etkinleştirin
   - Güvenilir kimlik doğrulayıcı uygulamaları kullanın
   - Yedek kodları güvende tutun

3. **Hesap Etkinliğini İzleyin**
   - Aktif oturumları düzenli olarak gözden geçirin
   - Şüpheli etkinlikleri kontrol edin
   - Güvenlik endişelerini derhal bildirin

### Güvenli Kullanım

1. **Güvenli Tarama**
   - Paylaşılan bilgisayarlarda her zaman çıkış yapın
   - Gerektiğinde özel/gizli mod kullanın
   - Hassas etkinlikler için halka açık Wi-Fi'dan kaçının

2. **E-posta Güvenliği**
   - E-posta hesabınızı MFA ile güvence altına alın
   - Parola sıfırlama e-postalarını doğrulayın
   - Kimlik avı girişimlerini bildirin

## Kimlik Doğrulama Sorun Giderme

### Yaygın Sorunlar

**Kimlik Doğrulayıcı Uygulamasına Erişilemiyor:**
- Acil erişim için yedek kodları kullanın
- Gerekirse MFA sıfırlaması için destek ile iletişime geçin

**OAuth Giriş Başarısız:**
- OAuth sağlayıcı hesap durumunu kontrol edin
- Tarayıcı önbelleğini ve çerezleri temizleyin
- Farklı tarayıcı veya gizli mod deneyin

**Parola Sıfırlama Çalışmıyor:**
- Spam/gereksiz klasörünü e-posta için kontrol edin
- E-posta adresinin doğru olduğundan emin olun
- Kalıcı sorunlar için destek ile iletişime geçin

**Hesap Kilitli:**
- Otomatik kilit açılması için bekleyin (genellikle 15 dakika)
- Hesap kurtarma seçeneklerini kullanın
- Yardım için destek ile iletişime geçin

### Yardım Alma

**Destek Seçenekleri:**
- **Help Center**: Kendi kendine sorun giderme
- **Contact Support**: Doğrudan yardım
- **Community Forum**: Kullanıcıdan kullanıcıya yardım
- **Emergency Support**: Kritik güvenlik sorunları

**İletişim Bilgileri:**
- Destek e-postası: Help Center'da mevcuttur
- Yanıt süresi: Tipik olarak 24-48 saat
- Acil güvenlik: Anında yanıt

## Hesap Kurtarma

### Kurtarma Seçenekleri

1. **E-posta Kurtarma**
   - Parola sıfırlama için birincil yöntem
   - E-posta erişimini düzenli olarak doğrulayın

2. **MFA Yedek Kodları**
   - MFA etkin hesaplar için gereklidir
   - Güvenli bir şekilde saklayın ve gerektiğinde erişin

3. **OAuth Sağlayıcıları**
   - Alternatif giriş yöntemleri
   - Mevcut olduğunda hesap kurtarma

### Kurtarma Süreci

1. **Mevcut Seçenekleri Belirleme**
   - E-posta erişimini kontrol edin
   - Yedek kodları bulun
   - OAuth sağlayıcı erişimini doğrulayın

2. **Kurtarma Adımlarını Takip Etme**
   - En uygun yöntemi kullanın
   - Güvenlik istemlerini takip edin
   - Kurtarmadan sonra kimlik bilgilerini güncelleyin

3. **Hesabı Güvence Altına Alma**
   - Tehlikeye girerse parolaları değiştirin
   - Güvenlik ayarlarını gözden geçirin ve güncelleyin
   - Yeni MFA yedek kodları oluşturun

Unutmayın: Güvenlik paylaşılan bir sorumluluktur. Hesap bilgilerinizi güvende tutun ve şüpheli etkinlikleri derhal bildirin!
