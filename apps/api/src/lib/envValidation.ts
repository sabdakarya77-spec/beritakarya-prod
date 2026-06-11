import { env } from '../lib/env'

const required: Record<string, string | undefined> = {
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET:   env.JWT_SECRET,
}

const missing = Object.entries(required)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (missing.length > 0) {
  console.error(`❌ Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET harus minimal 32 karakter')
  process.exit(1)
}
