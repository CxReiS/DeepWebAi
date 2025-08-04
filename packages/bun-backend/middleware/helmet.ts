// Güvenlik başlıklarını otomatik ekleyen Helmet middleware'ini ekle.
.use(helmet())

// API endpoint'leriniz
.get('/', () => 'Hello from DeepWeb AI Backend')
.get('/health', () => ({ status: 'ok' })) // Örnek sağlık kontrolü

.listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
