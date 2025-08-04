import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { helmet } from "@elysiajs/helmet";

const app = new Elysia()
  // CORS middleware'ini ekle. Tüm kaynaklardan gelen isteklere izin verir (geliştirme için).
  // Production'da origin: 'https://your-frontend-domain.com' gibi kısıtlayın.
  .use(cors());
// Güvenlik için Helmet middleware'ini ekle.
