// Türkçe: Lokal geliştirmede .env yoksa .env.local varsa kopyalar; varsa dokunmaz.
import fs from 'fs';
const has = p => fs.existsSync(p);
if (!has('.env') && has('.env.local')) {
  fs.copyFileSync('.env.local', '.env');
  console.log('[env-prepare] .env oluşturuldu (.env.local kopyalandı).');
} else {
  console.log('[env-prepare] .env mevcut veya .env.local yok, değişiklik yapılmadı.');
}
