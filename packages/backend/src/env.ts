/*
 * Env loader (dotenv-flow + zod)
 * - Sadece .env, .env.local, .env.development(.local), .env.production(.local), .env.test dosyaları okunur
 * - Uppercase .ENV asla okunmaz; bulunduğunda uyarı verilir
 */
import fs from 'node:fs'
import path from 'node:path'
import { config as dotenvFlow } from 'dotenv-flow'
import { z } from 'zod'

// .ENV bulunduysa uyarı
const UPPER_ENV_PATH = path.join(process.cwd(), '.ENV')
if (fs.existsSync(UPPER_ENV_PATH)) {
  console.warn('⚠️  Uppercase .ENV bulundu, yoksayılıyor (okuma yok).')
}

// dotenv-flow yükleme (NODE_ENV=test ise .env.test yüklensin)
const nodeEnv = process.env.NODE_ENV || 'development'
dotenvFlow({
  node_env: nodeEnv,
  default_node_env: 'development',
  silent: true,
  // .ENV dosyası spesifik olarak okunmaz; dotenv-flow zaten .ENV'i hedeflemez
})

// Zod şeması
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL gerekli'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET gerekli'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().optional(),
  CORS_MAX_AGE: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),

  STORAGE_TYPE: z.string().default('local'),
  STORAGE_PATH: z.string().default('/uploads'),
  MAX_FILE_SIZE: z.string().optional(),
  MAX_BODY_SIZE: z.string().optional(),

  REDIS_URL: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
  ENABLE_SWAGGER: z.string().optional(),
  ENABLE_METRICS: z.string().optional(),

  // Harici sağlayıcı anahtarları opsiyonel
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ABLY_API_KEY: z.string().optional(),
}).transform((v) => {
  return {
    NODE_ENV: v.NODE_ENV,
    PORT: v.PORT ? Number(v.PORT) : (v.NODE_ENV === 'production' ? 8000 : 3001),
    HOST: v.HOST,

    DATABASE_URL: v.DATABASE_URL,
    JWT_SECRET: v.JWT_SECRET,

    CORS_ORIGIN: v.CORS_ORIGIN,
    CORS_CREDENTIALS: v.CORS_CREDENTIALS === 'true',
    CORS_MAX_AGE: v.CORS_MAX_AGE ? Number(v.CORS_MAX_AGE) : 86400,

    RATE_LIMIT_WINDOW_MS: v.RATE_LIMIT_WINDOW_MS ? Number(v.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: v.RATE_LIMIT_MAX_REQUESTS ? Number(v.RATE_LIMIT_MAX_REQUESTS) : 100,

    STORAGE_TYPE: v.STORAGE_TYPE,
    STORAGE_PATH: v.STORAGE_PATH,
    MAX_FILE_SIZE: v.MAX_FILE_SIZE ? Number(v.MAX_FILE_SIZE) : 10 * 1024 * 1024,
    MAX_BODY_SIZE: v.MAX_BODY_SIZE ? Number(v.MAX_BODY_SIZE) : 10 * 1024 * 1024,

    REDIS_URL: v.REDIS_URL,

    SENTRY_DSN: v.SENTRY_DSN,
    LOG_LEVEL: v.LOG_LEVEL,
    ENABLE_SWAGGER: v.ENABLE_SWAGGER === 'true',
    ENABLE_METRICS: v.ENABLE_METRICS === 'true',

    OPENAI_API_KEY: v.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: v.ANTHROPIC_API_KEY,
    DEEPSEEK_API_KEY: v.DEEPSEEK_API_KEY,
    GEMINI_API_KEY: v.GEMINI_API_KEY,
    ABLY_API_KEY: v.ABLY_API_KEY,
  }
})

const parsed = EnvSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Geçersiz environment:', parsed.error.flatten().fieldErrors)
  throw new Error('Environment validation failed')
}

export const ENV = parsed.data
