// server.ts
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { createAuth } from "@elysiajs/lucia-auth";
import { sql } from "./db/neon-client";

const app = new Elysia()
  .use(cors())
  .use(createAuth({ 
    adapter: new LuciaAdapter(sql), 
    secret: process.env.LUCIA_SECRET!
  }))
  .get("/", () => "Hello from Bun + Elysia (benzetildi 2025)")
  .listen(3000);
