// PostCSS konfigürasyonu - TailwindCSS ve Autoprefixer eklentilerini içerir
// TailwindCSS artık yeni @tailwindcss/postcss eklentisi ile kullanılıyor
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // Yeni TailwindCSS PostCSS eklentisi - CSS sınıflarını işler
    autoprefixer: {}, // CSS vendor prefix'lerini otomatik olarak ekler
  },
}
