# Ana Proje Yapısı (DeepWebAi_Ana_Sema) Monorepo (pnpm + Turborepo) yaklaşımı

# Monorepo (pnpm + Turborepo): Proje birden fazla bağımsız modülü tek repo altında yönetir

# pnpm: Hızlı disk kullanımlı paket yöneticisi

# Turborepo: Paralel build ve caching optimizasyonu

/project-root
│
├── 📁 .vscode/ → VS Code ayarları (Editör konfigürasyonları ve debug ayarları)
│ ├── 📄launch.json → Debug konfigürasyonu (Kod hata ayıklama profilleri)
│ └── 📄settings.json → Proje özel ayarları (ESLint, Prettier, uzantı ayarları)
│ │
├── 🗃️database/ → VERİTABANI ŞEMASI ve YÖNETİM
│ ├── 🐎migrations/ → DB şema değişiklikleri (Alembic/Neon SQL migrasyonları)
│ │ ├── 001_create_conversations.sql → Tüm SQL migrasyon dosyaları
│ │ └── ⚙️env.ts → Ortam değişkenleri yardımcısı
│ └── 🌱seeds/ → Test ve demo verileri (kullanıcılar, modeller)
│ │ ├── 🤖models_seed.sql → Yapay zeka model test verileri
│ │ ├── 🧪test_users.sql → Test kullanıcıları
│ │ └── 👥users_seed.sql → Kullanıcı örnek verileri
│ ├── 🔮orm/ → ORM katmanı (SQLAlchemy) - DB session yönetimi
│ │ └── 💽session.ts → Veritabanı oturum yönetimi
│ ├── 🏗️init.sql → İlk tablo oluşturma scriptleri
│ └── 🐘neon-clients.ts → Neon DB bağlantı yardımcısı
│ │
├── 🚀deployment/ → Dağıtım & DevOps Ayarları
│ ├── 🌍environments/ → Ortam değişkenleri
│ │ ├── 💻development.env → Local geliştirme değişkenleri
│ │ ├── 🏭production.env → Canlı sunucu ayarları
│ │ ├── 🤝shared-config.ts → Ortam Değişken Yönetimi
│ │ └── 🧪staging.env → Test sunucusu değişkenleri
│ └── 🔁ci-cd-pipeline/ → CI/CD Pipeline - CI/CD dosyaları (GitHub Actions vb. YAML dosyaları)
│ │ └── 💾backup/ → Otomatik yedekleme scriptleri (DB, dosya, log)
│ │ │ └── 🗃️database-backup/ → Veritabanı Yedekleme
│ │ │ │ └── 📅daily_backup.sh → Günlük otomatik yedek scripti
│ │ │ │
│ │ │ └── 📂file-backup/ → Dosya Yedekleme
│ │ │ │ ├── ⬆️upload_backup.ts → Upload klasörleri yedekleme
│ │ │ │ └── 📜log_archive.ts → Log arşivleme
│ │ │ │
│ │ │ └── ⏮️ recovery/ → Geri Yükleme (Recovery)
│ │ │ │ └── ♻️ neon-restore.ts → Neon DB geri yükleme
│ │ │ │
│ │ │ └── 📦storage/ → Depolama
│ │ │ ├── 🅰️ s3_storage.ts → AWS S3 / Google Cloud Storage
│ │ │ ├── 📤☁️s3-uploader.ts → AWS S3 entegrasyonu
│ │ │ ├── 🪣 minio-adapter.ts → MinIO entegrasyonu
│ │ │ └── 💽 local_storage.ts → Lokal yedek klasörleri
│ │ │
│ │ ├── 📦pipeline.yml
│ │ ├── 🛠️build.yml → Build işlemleri
│ │ ├── 🧪test.yml → Test işlemleri
│ │ ├── 🚢deploy.yml → Vercel/Neon deploy
│ │ └── 📦registry_push.yml → Docker registry push
│ │
├── 📚docs/ → Dokümantasyon
│ ├── 📑 api_reference.md → API endpoint açıklamaları (Swagger/OpenAPI 3.0)
│ ├── 👨‍💻 developer_guide/ → Geliştirici kılavuzu (kurulum, kod standartları)
│ │ ├── ⚙️ installation.md → Kurulum adımları
│ │ ├── 🛠️ environment_setup.md → Geliştirme ortamı ayarları
│ │ └── ✨ coding_standards.md → Kod standartları
│ │
│ ├── 👤 user_guide/ → Kullanıcı dokümanları (UI kılavuzu, senaryolar)
│ │ ├── 🖥️ ui_overview.md → Kullanıcı arayüzü açıklamaları
│ │ └── 🎬 usage_scenarios.md → Temel kullanım senaryoları
│ │
│ └── 🗓️ changelog/ → Sürüm geçmişi
│ └──⏳version_history.md → Versiyon değişiklik kayıtları
│
├── 🐳 docker/ → KONTEYNER YAPILANDIRMA
│ └── 🐋 docker-compose.yml → Tüm servislerin ayağa kaldırılması
│ │ └── 🤖 triton-inference → Çıkarım motoru konteyneri
│ │ └── 🐋 Dockerfile → Docker servislerini
│ │
├── 📚 libs → Paylaşılan kütüphaneler
│ └── 📁error-tracking/ → Merkezi hata kütüphanesi (Sentry entegrasyonu, özel logger)
│ ├── ⚡ neon-client.ts → Neon DB yardımcısı
│ ├── 🚨 sentry-integration.ts → Sentry entegrasyonu
│ └── 📝 custom-logger.ts → Özelleştirilmiş logger
│
├── 📢 notifications/ → Bildirim ve Mesajlaşma Sistemleri
│ ├── 🔔 system-notifications/ → Sistem Bildirimleri (Email/Slack/WebPush entegrasyonları)
│ │ ├── ✉️ email_smtp.ts → E-mail (SMTP)
│ │ ├── 📲 web_push.ts → Push Notifications (Web Push)
│ │ └── 💬 slack_webhook.ts → Slack / Webhook entegrasyonu
│ │
│ ├── 👤 user-notifications/ → Kullanıcı Bildirimleri
│ │ ├── 💬 toast_alerts.ts → Toast uyarıları
│ │ └── 🌐 websocket_notifications.ts → Gerçek zamanlı bildirim (WebSocket)
│ │
│ └── 🗂️ queue-system/ → Queue Sistemi
│ │ ├── 🐇 celery_tasks.ts → Celery / RabbitMQ
│ │ └── ⏳ async_task_manager.ts → Asenkron görev yönetimi
│ │  
├── 📦 packages/ → MONOREPO PAKETLERİ (Ana kodlar burada)
│ └── 🧠 ai-core/ → LLM ve AI çekirdek modülü ( AI Çekirdek Motoru )
│ │ ├── 📚 embeddings → Vektör veritabanı bağlantıları (Pinecone/Chroma)
│ │ │ └── 🔗 vector-db-conector.ts
│ │ │ │
│ │ ├── 🤝 integrations/ → Harici API entegrasyonları
│ │ │ ├── 🌐 external-services/ → Harici Servisler
│ │ │ │ ├── 🔍 deepseek_api.ts → Deepseek API'si için HTTP istemci ve tip tanımları
│ │ │ │ ├── 🤗 huggingface_models.ts → HuggingFace model yönetimi ve inference endpoint'leri
│ │ │ │ ├── 🦙 llama3.ts → Yerel Llama 3 modeli için çalıştırıcı ve tokenizer
│ │ │ │ └── 🧠 mixtral.ts → Mixtral 8x7B quantize model desteği
│ │ ├── 🎥 media-processing/ → video analiz
│ │ │ ├── 🖼️ frame-extractor.ts → Videodan kare çekme  
│ │ │ ├── 🖼️ image-processor.ts → Görüntü analizi (OpenCV.js)
│ │ │ └── 🎬 video-analysis.ts → Video parçalama/analiz  
│ │ ├── 💬 prompts/ → Merkezi prompt yönetimi
│ │ │ ├── ⚙️ system/ → Sistem promptları
│ │ │ │ ├── 📄 general.md →
│ │ │ │ └── 📄 technical.md →
│ │ │ ├── 👤 user/ → Kullanıcı prompt şablonları
│ │ │ │ ├── 📝 creative.txt →
│ │ │ │ └── 📝 concise.txt →
│ │ │ └── 🔀 versioning/ → Prompt versiyonlama
│ │ │ │ ├── 📊 v1-summary.json →
│ │ │ │ └── 📊 v2-summary.json →
│ │ ├── ⚡ optimization/ → Model optimizasyonu
│ │ │ ├── 🐍 model-quantizer.py → GGUF/ONNX model quantizasyon
│ │ │ └── 🐍 gpu-allocator.py → CUDA core GPU bellek yönetimi ve GPU paylaşımı
│ │ ├── 🤖 agents/ → Akıllı ajanlar (Chain-of-Thought mantıksal çıkarım, web araştırma)
│ │ │ ├── 💭 deep-reasoning.ts → Zincirleme düşünme akıl yürütme (Chain-of-Thought)
│ │ │ ├── 🔍 web-researcher.ts → Web tarama, kaynak toplama ve bilgi sentezleme
│ │ │ └── 📚 citation-generator.ts → Otomatik kaynakça (3 dosya)
│ │ └── 🔤 tokenizers/ → Model özel tokenizer'lar
│ │ │ ├── 🦙 llama-tokenizer.ts → Llama3 tokenizer
│ │ │ └── 🧠 mixtral-tokenizer.ts → Mixtral tokenizer  
│ │ ├── 🔧 transformers/ → Dil modelleri için tokenizasyon ve model uyumluluk katmanı
│ │ │ ├── 🔌 model-adapter.ts → Farklı model API'lerini (Llama/Mixtral) standart arayüze adapte eder
│ │ │ └── ⚖️ quantize.ts → Modelleri GGUF formatında quantize ederek boyut ve performans optimizasyonu
│ │ ├── 🎙️ voice-processing/ → Ses işleme modülü (STT/TTS, ses klonlama)
│ │ │ ├── 🔊 speech-to-text.ts → Konuşmayı metne çevirme
│ │ │ ├── 🔊 text-to-speech.ts → Metni sese çevirme
│ │ │ └── 🎤 voice-cloning.ts → Ses klonlama (3 dosya)
│ └── 🧠 ai-gateway/
│ │ ├── 🌐providers/  
│ │ │ ├── 🤖 anthropic/
│ │ │ │ ├── 📡client.ts → Örnek: Anthropic istemcisi
│ │ │ ├── 🤖 deepseek/
│ │ │ │ ├── 📡client.ts → DeepSeek API wrapper
│ │ │ ├── 🤖 gemini/
│ │ │ │ ├── 📡client.ts → Gemini API wrapper
│ │ │ ├── 🤖 local-llama/
│ │ │ │ ├── 📡client.ts → Llama API wrapper
│ │ │ └── 🤖 openai/
│ │ │ └── 📡client.ts → OpenAi API wrapper
│ └── 🧠 advanced-ai/
│ │ ├── 😊 emotion-recognition.ts → Duygu analizi (ses/metin)
│ │ ├── ⚖️ ethics-module.ts → AI etik sınırları yönetimi
│ │ ├── ⚖️ load-balancer.ts → API key rotasyonu ve yük dağıtım mantığı
│ │ └── 📈self-improvement.ts → Modelin kendini geliştirme mekanizması
│ │ │
│ └── ⚙️ bun-backend/ → Bun + Elysia 1.3.2
│ │ ├── 🛢️ database/ → Neon DB bağlantısı ve sorgular
│ │ │ ├── 📁 operations/ → SQL sorguları
│ │ │ │ ├── 🤖ai.queries.ts  
│ │ │ │ └── 👤user.queries.ts
│ │ ├── 🗃️lib/ → Neon DB 4.1.0 bağlantıları
│ │ │ └── ⚡neon-client.ts
│ │ ├── 📁 middleware/ → Global middleware'ler (CORS, rate limit, güvenlik başlıkları)
│ │ │ ├── 🔄 cors.ts → CORS yönetimi
│ │ │ ├── 🔒 helmet.ts → Güvenlik başlıkları
│ │ │ └── ⏱️ rate-limiter.ts → Sağlayıcı bazlı istek sınırlama (token/dakika)
│ │ ├── 🔐modules/ → Lucia Auth 3.2 entegre İş mantığı modülleri
│ │ │ ├── 🤖ai/ → Yapay zeka endpoint yönetimi(streaming chat, model yönlendirme)
│ │ │ │ ├── 🎮ai.controller.ts → Sadece HTTP isteklerini yönetir (request/response).
│ │ │ │ ├── 🛣️ai.router.ts
│ │ │ │ ├── 💬chat.ts → Streaming chat endpoint'i (Ably WebSocket entegrasyonlu)
│ │ │ │ └── ⚖️model-load-balancer.ts → Model seçimi ve yönlendirme (load balancer ile entegre)
│ │ │ ├── 💬chat/ → Sohbet işlemleri
│ │ │ │ └──
│ │ │ ├── ⛑️health/ → Sistem sağlık kontrolü (GET /health)
│ │ │ │ └── 💓health_check.ts → GET /health → Servis durumu
│ │ │ └── 🤖 model-manager/ → Model yönetim endpoint'leri
│ │ │ └── model.router.ts → Model deploy/update endpointleri  
│ │ │
│ │ └── 🌐realtime/ → Ably WebSocket entegrasyonu
│ │ │ ├── 🔌 websocket-server.ts → WebSocket sunucusu / Gerçek zamanlı mesajlaşma
│ │ │ ├── 🤝 ably-integration.ts → Ably entegrasyonu  
│ │ │ └── 📁events/
│ │ │ ├── chat-events.ts → Mesaj iletim olayları  
│ │ │ └── user-notifications.ts → Bildirim olayları  
│ │ ├── 📁 src/
│ │ │ ├── 🔐auth/ → Lucia Auth 3.2 ile kimlik yönetimi (Lucia 3.2 + Web3/OAuth2)
│ │ │ │ └── 🔑 strategies/ → Discord/GitHub/Web3 auth stratejileri
│ │ │ │ │ ├── 🔗discord.ts
│ │ │ │ │ └── 🔗github.ts
│ │ │ │ ├── 📑 index.ts → Auth Modülü Yapısı (Tek Dosyada Tüm İşlevler) OWASP, Web3, Elysia
│ │ │ │ ├── 🛡️security.ts → OWASP Uyumluluğu İçin Ekstra Katman
│ │ │ │ └── 🌐web3.ts → Web3 Entegrasyonu (Ekstra Güvenlikle)
│ │ │ ├── 📁 core → Backend'in internal core modülü
│ │ │ │ └── 👀 monitoring/ → İzleme & Monitoring
│ │ │ │ │ ├── 📜 logging/ → Sadece log aggregator
│ │ │ │ │ │ ├── 🚨 app_errors.ts → Uygulama hataları
│ │ │ │ │ │ └── 👤 audit_logs.ts → Kullanıcı aktiviteleri
│ │ │ │ │ │
│ │ │ │ ├── 📊 analytics/ → Analitik
│ │ │ │ │ ├── ⏱️ api_performance.ts → API performans metrikleri
│ │ │ │ │ ├── 🖱️ frontend_events.ts → Kullanıcı davranışları
│ │ │ │ │ └── ⚡ performance.ts → Performans izleme  
│ │ │ │ └── 🧰 tools/ → İzleme Araçları - Sentry/Prometheus gibi external entegrasyonlar
│ │ │ │ │ ├── 📊 log-anomaly-detector.ts
│ │ │ │ │ ├── 📈 prometheus_config.ts → Prometheus yapılandırma
│ │ │ │ │ ├── 📉 grafana_dashboard.ts → Grafana dashboard
│ │ │ │ │ └── 🚨 sentry_setup.ts → Sentry hata takibi
│ │ │ │ │ └── 📝unified-logger.ts → Entegre logger
│ │ │ │ │  
│ │ │ │ └── 🛡️ security/ → Güvenlik
│ │ │ │ ├── 👧🏻biometric-auth.ts → Biyometrik doğrulama
│ │ │ │ ├── 🔑 jwt-validator.ts → JWT doğrulama  
│ │ │ │ ├── 🗝️ rate-limiter.ts → İstek sınırlayıcı
│ │ │ │ └── 🌐 web3-signer.ts → Web3 dijital imza  
│ │ │ ├── 🔌 auth.module.ts →
│ │ │ ├── ⚙️ elysia.config.ts → Ana Elysia konfigürasyonu
│ │ │ └── 🚀 server.ts → Giriş noktası  
│ │ │ └── 📘 swagger.ts → OpenAPI dokümantasyonu otomatize ed
│ │ │ │
│ │ ├── 🛠️ services/ → Business logic servisleri (AI, kullanıcı, dosya işlemleri)
│ │ │ ├── 🤖 ai.service.ts → AI iş mantığı (business logic) içerir.
│ │ │ ├── 💬 chat.service.ts
│ │ │ ├── 📄 file.service.ts → Dosya işleme mantığı  
│ │ │ ├── 🤖 model.service.ts
│ │ │ └── 👤 user.service.ts
│ │ └── 📁 utils/  
│ │ ├── 📄 api-helper.ts
│ │ ├── 📄 crypto.ts → Şifreleme araçları
│ │ ├── 📄 di.ts → Servisler arası bağımlılıkları yönetmek için basit bir DI mekanizması
│ │ ├── 📄 error-handler.ts → Hata yönetimi
│ │ ├── 📄 storage.ts
│ │ └── 📄 validation.ts → Veri validasyonu
│ │
│ └── 💾 caching/ → Redis/DragonflyDB önbellek yönetimi (2 katmanlı cache)
│ │ ├── 📁src/
│ │ │ ├── 🗃️ response-cache.ts → Vercel Edge + Redis ile 2 katmanlı önbellekleme
│ │ │ ├── 🔗 redis-client.ts → Redis (veya DragonflyDB) bağlantısını kuran ve yöneten kod.
│ │ │ └── ⚡ cache.service.ts → Önbelleğe veri ekleme (set), veri çekme (get), veri silme (del)
│ │ └── 📄 index.ts → Bu paketten dışarıya açılacak fonksiyonları export eder.
│ │
│ ├── 🚩 feature-flags/ → GrowthBook ile canlı feature toggle yönetimi
│ │ ├── 📁src/
│ │ │ ├── ⚙️ growthbook-setup.ts → GrowthBook konfigürasyonu
│ │ │ └── 🚩 feature-toggles.ts → Flag yönetimi
│ │ └── 📄 index.ts
│ │
│ ├── 📂file-processing/ → Dosya İşleme (PDF/OCR işlemleri (metin çıkarma, temizleme))
│ │ ├── 📂 src/
│ │ │ ├── 📄 document/ → PDF/TXT işlemleri
│ │ │ │ ├── 📄pdf_reader.ts → PDF, Word, TXT okuma
│ │ │ │ └── 🧹text_cleaner.ts → Metin temizleme
│ │ │ │  
│ │ │ └── 👁️ ocr/ → OCR işlemleri
│ │ │ └── 👁️ocr_processor.ts → Resimden metin çıkarma
│ │ └── 📄 index.ts
│ └── 🚀frontend/ → Vite + React 20.2.1
│ │ ├── 📁public/ → Statik asset'ler (favicon, SVG'ler)
│ │ │ ├── 🎯 favicon.ico
│ │ │ ├── ⚛️ react.svg
│ │ │ └── ⚡ vite.svg
│ │ ├── 📁src/
│ │ │ └── 🧩components/ → UI bileşenleri (Button, Modal, Navbar)
│ │ │ │ ├── 🧱ui/ → Atomik, yeniden kullanılabilir UI bileşenleri
│ │ │ │ │ ├── 👤 Avatar.tsx
│ │ │ │ │ ├── 🏷️ Badge.tsx
│ │ │ │ │ ├── 🛎️ Button.tsx
│ │ │ │ │ ├── 🃏 Card.tsx
│ │ │ │ │ ├── ☑️ Checkbox.tsx
│ │ │ │ │ ├── ▽ Dropdown.tsx
│ │ │ │ │ ├── ⌨️ Input.tsx
│ │ │ │ │ ├── 🤖 Model.tsx
│ │ │ │ │ └── 💡 Tooltip.tsx
│ │ │ │ │  
│ │ │ │ ├── 🧭 layout/ → Sayfa düzeni bileşenleri
│ │ │ │ │ ├── 📐 MainLayout.tsx
│ │ │ │ │ ├── 🔝 Navbar.tsx
│ │ │ │ │ ├── 📊 Sidebar.tsx
│ │ │ │ │ └── 📑 TabBar.tsx
│ │ │ │ │  
│ │ │ │ └── 📊 features/ → Özellik tabanlı bileşenler
│ │ │ │ ├── 🔐 auth/ → Giriş/Profil bileşenleri
│ │ │ │ │ ├── 🔑 LoginForm.tsx
│ │ │ │ │ └── ⚙️ ProfileSettings.tsx
│ │ │ │ ├── 🤝 collaboration/ → Gerçek zamanlı düzenleme (CRDT), sesli sohbet
│ │ │ │ │ ├── ✏️ shared-editor.tsx → Eş zamanlı doküman düzenleme / Yapay Zeka Destekli CRDT implementasyonu
│ │ │ │ │ └── 🎙️voice-chat.tsx → WebRTC tabanlı sesli sohbet implementasyonu
│ │ │ │ ├── 💻 code-generator/ → AI destekli Kod üretme arayüzü
│ │ │ │ │ ├── </> CodeGenerator.tsx  
│ │ │ │ │ └── 🪝 useCodeGen.ts  
│ │ │ │ ├── 📊 dashboard/
│ │ │ │ │ ├── 📈 Chart.tsx
│ │ │ │ │ ├── 📊 MetricsPanel.tsx
│ │ │ │ │ └── 🧩 Widget.tsx
│ │ │ │ ├── 📊 data-visualization/ → Veri görselleştirme araçları→
│ │ │ │ │ ├── index.ts
│ │ │ │ ├── 📊 diagrams/ → Diyagramlar
│ │ │ │ │ ├── index.ts
│ │ │ │ ├── 🧠 knowledge-base/ → Bilgi bankası yönetimi
│ │ │ │ │ ├── index.ts
│ │ │ │ ├── 📝 markdown/ → Markdown işleme
│ │ │ │ │ ├── index.ts
│ │ │ │ ├── 🎨 media/ → Medya yönetimi
│ │ │ │ │ ├── index.ts
│ │ │ │ ├── 🤖 models/ → Model yönetimi (yükleme, karşılaştırma, ayarlar)
│ │ │ │ │ ├── 📤 LocalModelUpload.tsx → GGUF/ONNX model yükleme
│ │ │ │ │ ├── ⚖️ ModelComparison.tsx → Yan yana model karşılaştırma
│ │ │ │ │ ├── ▾ ModelSelector.tsx → Model seçimi
│ │ │ │ │ └── ⚙️ ModelSettings.tsx → Model ayarları
│ │ │ │ └── 🎬 VideoProcessor/ → Video işleme UI  
│ │ │ │ ├── 📤 VideoUpload.tsx  
│ │ │ │ └── ▶️ VideoPlayer.tsx  
│ │ │ │
│ │ │ ├── 🪝hooks/ → Custom Hook'lar
│ │ │ │ ├── 🔐 useAuth.ts
│ │ │ │ └── 🎨 useTheme.ts
│ │ │ ├── 🖼️layouts/ → Sayfa şablonları
│ │ │ │ └── 📐 MainLayout.tsx
│ │ │ ├── 📝pages/ → Sayfalar (Login, Dashboard)
│ │ │ │ ├── 📊 Dashboard.tsx
│ │ │ │ └── 🔑 Login.tsx
│ │ │ ├── 📡services/ → API istekleri
│ │ │ │ └── 📡api-client.ts
│ │ │ ├── 🏪store/ → Jotai global state yönetimi
│ │ │ │ ├── 🏗️ atom-store.ts → Jotai spesifikasyonu
│ │ │ │ └── ⚛️ atoms.ts → Jotai-Immer Entegrasyonu
│ │ │ ├── 🎨 style/ → Stil ve CSS Şeması :contentReference[oaicite:2]{index=2}
│ │ │ │ ├── 🧩 components.css
│ │ │ │ ├── 🖼️ layout.css
│ │ │ │ ├── 🎨 main.css
│ │ │ │ ├── 🎨 variables.css
│ │ │ │ └── 🌓 themes/ → Temalar
│ │ │ │ ├── ☀️ light.css
│ │ │ │ └── 🌙 dark.css
│ │ │ └── 🧰utils/ → Önbellekleme (Vercel Edge), API helper'lar
│ │ │ ├── ⚛️ App.ts
│ │ │ ├── 💾 cache.ts → Vercel Edge Config + React Cache API: → Önbellek yönetimi
│ │ │ ├── 🛠️ helpers.ts
│ │ │ └── 🚀 main.ts
│ │ │
│ │ ├── 📄 🐳Dockerfile
│ │ ├── 📄 index.html
│ │ ├── 🤖 log-anomaly-detector.ts
│ │ ├── 📦 package.json
│ │ ├── 📋 requirements.txt
│ │ └── ⚙️ vite.config.ts → SWC optimizasyonlu build
│ │ │
│ └── 👀 observability/ → Prometheus/Grafana/Sentry ile Gözlemlenebilirlik
│ │ └── 📊analytics/ → Analitik ve İçgörü Modülleri
│ │ │ ├── 👥kullanici-davranislari/ → Kullanıcı Davranışları
│ │ │ │ ├── 🧮visit_count.ts → Ziyaretçi sayısı
│ │ │ │ ├── ⏱️session_duration.ts → Oturum süresi
│ │ │ │ └── 🗺️click_map.ts → Tıklama haritaları
│ │ │ │
│ │ │ ├── ⚡ performans-metrikleri/ → Performans Metrikleri
│ │ │ │ ├── 🤖 ai-metrics.ts
│ │ │ │ ├── ⏳ api_response_time.ts → API yanıt süreleri
│ │ │ │ ├── ❌ error_rate.ts → Hata oranları
│ │ │ │ └── 💻 resource_usage.ts → Kaynak kullanımı (CPU/RAM)
│ │ │ │
│ │ │ ├── 🧰 analitik-araclar/ → Analitik Araçlar
│ │ │ │ ├── 📈 google_analytics.ts → Google Analytics entegrasyonu
│ │ │ │ ├── 📊 mixpanel.ts → Mixpanel entegrasyonu
│ │ │ │ └── 🔍 event_tracking.ts → Custom event tracking
│ │ │ │
│ │ │ ├── 📑 raporlama/ → Raporlama
│ │ │ │ ├── 📅 weekly_report.ts → Haftalık raporlar
│ │ │ │ ├── 📤 export_pdf_csv.ts → PDF/CSV çıktı desteği
│ │ │ │ └── 📊 realtime-dashboard.ts
│ │ │ │
│ │ │ └── 🔄 auth/ → Merkezi kimlik yönetimi
│ │ │ ├── strategies/ → OAuth2/OpenID/SAML
│ │ │ └── mfa/ → Çok faktörlü kimlik doğrulama
│ │ ├── 📝 logs/ → Yapılandırılmış loglar
│ │ │ └── 📝 log-aggregator.ts → Loki/Promtail konfigürasyonu
│ │ ├── 📈 metrics/ → Prometheus metrikleri  
│ │ │ ├──
│ │ │ ├──
│ │ └── 🕵️ tracing/ → OpenTelemetry izleme
│ │ ├── 🕸️ distributed-tracing.ts → OpenTelemetry entegrasyonu → Dağıtık izleme
│ │ └── 📤 trace-exporter.ts → Jaeger/Zipkin İz dışa aktarıcı
│ └── 🧩 shared-types → Tüm paketlerde kullanılacak global type'lar (Monorepo geneli TypeScript tipleri)
│ │ ├── 📝 index.d.ts → Şema Validasyonu
│ │ ├── ✅ schema-validator.ts → Paylaşılan tipler için
│ │ ├── 🛠️ utils.ts → Cross-package yardımcı fonksiyonlar
│ │ ├── 🔄 turbo.json
│ │ └── 🧾 types.d.ts → Global TypeScript tipleri
│ │
│ ├── 🎨tema-ui/ → Tema & UI
│ │ ├── 🌓 dark_light_theme.ts → Dark/Light tema desteği
│ │ ├── 🛠️ customizable_panels.ts → Özelleştirilebilir paneller
│ │ └── 🔔 notification_system.ts → Bildirim sistemi (toast, websocket)
│ │
├── 🛠️ scripts/ → Yardımcı script'ler (setup, test vb.)
│ └── ⚙️ init_project.sh → Proje başlatma scripti
│ │
├── 🧪 tests/ → Merkezi test dizini(ROOT SEVİYESİ)
│ └── 🤖 ai-validation/ → AI model validasyon testleri (Model bias, adil kullanım metrikleri)
│ │ ├── ⚖️ bias-detection.spec.ts → Bias analiz testleri
│ │ ├── 📈 drift-detection.spec.ts → Model drift testleri
│ │ └── ⚖️ fairness-metrics.spec.ts
│ └── 🔁 e2e/ → Uçtan uca testler. Gerçek kullanıcı akışları (Cypress benzeri)
│ │ ├── 🔐 auth.spec.ts
│ │ ├── 🔍 ai-workflow.spec.ts
│ │ └── 🕑 realtime.spec.ts
│ │
│ └── 🔐 integration/ → Çoklu modül entegrasyon testleri. Modüller arası etkileşim testleri
│ │ ├── 🤖 ai-workflow.spec.ts
│ │ └── 🔐 auth-flow.spec.ts
│ │
│ └── 🔬 unit/ → Paket bazlı testler. Bileşen/fonksiyon seviyesi testler (Vitest)
│ │ └── 🤖ai-core/
│ │ │ └── 😊 huggingface-wrapper.test.ts
│ │ │
│ │ └── ⚙️ bun-backend/ → Backend Testleri
│ │ │ ├── 🔐 ai.test.ts
│ │ │ └── 🗃️ auth.test.ts
│ │ │
│ │ └── 🚩 feature-flags → GrowthBook testleri
│ │ │ └── 🧪 feature-flags.spec.ts → GrowthBook testleri buraya
│ │ │
│ │ └── 🖥️ frontend/ → Frontend React bileşen testleri
│ │ │ └── 🧩 components/
│ │ │ │ ├── 🛎️ Button.test.tsx
│ │ │ │ └── 💬 ChatWidget.test.tsx
│ │ │ │
│ │ │ └── ⚛️ react-testing-library/
│ │ │ │ ├── 🛎️ Button.test.tsx
│ │ │ │ ├── 🔝 Navbar.test.tsx
│ │ │ │ └── 💬 useToast.test.tsx
│ │ │ └── hooks.test.tsx
│ │ │
│ ├── ⚡ performance/ → Yeni: Yük testleri
│ │ ├── ⚡ bun-bench/
│ │ └── 🐜 locust/ → Python tabanlı yük testleri
│ │ │
│ └── 🛡️ security/ → Güvenlik testleri. OWASP ZAP taramaları, SAST
│ │ ├── 🕵️ zap-scans/ → OWASP ZAP konfigürasyonu
│ │ └── 🔍 sast/ → Statik kod analizi raporları
│ │  
│ └── ⚙️ vitest.config.ts → Tüm testler için tek config
│ │
├── 🧰tools/
│ └── 📦monorepo/ → Yardımcı araçlar
│ ├── 📊 dependency-graph.ts → Bağımlılık grafiği
│ ├── 🖼️ dependency-visualizer.ts → Görselleştirici
│ └── 🔍 version-checker.ts → Versiyon kontrolü
│
├── ⚙️ .env → Ortam değişkenleri
├── 🙈 .gitignore → Git ignore ayarları
├── 📄 bunfig.toml → Bun global konfigürasyonu
├── 🛠️ Makefile
├── 🏗️ nx.json → Nx build sistemi (opsiyonel)
├── 📦 package.json → WORKSPACE TANIMLARI
├── 📁 pnpm-workspace.yaml → Workspace tanımları
├── 📜 README.md → Kurulum, tanıtım, özellikler. Proje dokümantasyonu.
├── 🚨 sentry.config.ts → Hata izleme konfigürasyonu
└── 🔄 turbo.json → TURBOREPO KONFİGÜRASYONU (Build pipeline)
