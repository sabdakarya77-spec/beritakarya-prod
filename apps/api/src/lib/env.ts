import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z.string(),
  DIRECT_URL: z.string().url().optional(),

  // ── Security ──────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter untuk keamanan'),
  JWT_ACCESS_EXPIRES: z.string().default('1h'),
  RESET_SECRET: z.string().min(32).optional(),
  EMAIL_VERIFICATION_SECRET: z.string().min(32).optional(),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  TRUST_PROXY: z.string().optional(),

  // ── API ───────────────────────────────────────────────────────────────────
  API_URL: z.string().default('http://localhost:3001'),

  // ── AI ────────────────────────────────────────────────────────────────────
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4o'),

  // ── Redis (optional — rate-limiting falls back to memory if not set) ──────
  // For Upstash Redis, set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
  // For self-hosted Redis, set REDIS_HOST (+ REDIS_PORT, REDIS_PASSWORD)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Meilisearch (optional — search falls back to PostgreSQL FTS if not set) ─
  MEILISEARCH_HOST: z.string().default('http://localhost:7700'),
  MEILISEARCH_KEY: z.string().default(''),

  // ── Supabase Storage (S3-compatible) ─────────────────────────────────────
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('ap-southeast-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().default('true'),
  S3_BUCKET: z.string().default('kyc'),
  S3_MEDIA_BUCKET: z.string().default('media'),
  // Public CDN base URL: https://<ref>.supabase.co/storage/v1/object/public
  SUPABASE_STORAGE_PUBLIC_URL: z.string().url().optional(),

  // ── Email (SMTP) ──────────────────────────────────────────────────────────
  EMAIL_ENABLED: z.string().default('false'),
  EMAIL_FROM_ADDRESS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // ── Cron Security ─────────────────────────────────────────────────────────
  // Secret used to authorize cron job HTTP requests from Vercel
  CRON_SECRET: z.string().optional(),

  // ── Monitoring ────────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().optional(),
  LOG_HTTP_HOST: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  )
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
