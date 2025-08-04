import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors())
  .get("/", () => "DeepWebAi Backend hazır (Neon + Elysia + CORS)");

// The error "WebStandard does not support listen" suggests Elysia is not detecting the Node.js environment correctly.
// Using Node's native http server with Elysia's fetch handler is a reliable alternative.
createServer(app.fetch as any).listen(port, () =>
  console.log(`Backend başlatıldı: http://localhost:${port}/`)
);
