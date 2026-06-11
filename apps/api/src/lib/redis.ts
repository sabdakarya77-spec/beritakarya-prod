import { logger } from './logger'

// ─── Redis Client (Optional) ─────────────────────────────────────────────────
// Di lingkungan serverless (Vercel), Redis lokal tidak tersedia.
// Jika REDIS_HOST tidak diset, semua operasi cache akan di-skip secara silent.
// Untuk produksi serverless, gunakan Upstash Redis (diakses lewat @upstash/redis REST API).

let redis: any = null

async function initRedis() {
  if (!process.env.REDIS_HOST) {
    // No Redis configured — all cache ops become no-ops
    return
  }

  try {
    const Redis = require('ioredis')
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times: number) => {
        if (times > 3) return null
        return Math.min(times * 50, 2000)
      },
      lazyConnect: true,
    })

    redis.on('error', (err: Error) => {
      logger.warn('[Redis] Connection error (non-fatal):', err.message)
    })

    await redis.connect()
    logger.info('[Redis] Connected successfully')
  } catch (err) {
    logger.warn('[Redis] Failed to connect (falling back to no-op cache):', err)
    redis = null
  }
}

// Initialize lazily (don't block module loading in serverless)
const redisReady = initRedis()

const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'app:'

function getFullKey(key: string): string {
  return key.startsWith(KEY_PREFIX) ? key : `${KEY_PREFIX}${key}`
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    await redisReady
    const data = await redis.get(getFullKey(key))
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600) {
  if (!redis) return
  try {
    await redisReady
    await redis.set(getFullKey(key), JSON.stringify(value), 'EX', ttlSeconds)
  } catch {}
}

export async function deleteCache(key: string) {
  if (!redis) return
  try {
    await redisReady
    await redis.del(getFullKey(key))
  } catch {}
}

export async function clearPattern(pattern: string): Promise<void> {
  if (!redis) return
  try {
    await redisReady
    const fullPattern = pattern.startsWith(KEY_PREFIX) ? pattern : `${KEY_PREFIX}${pattern}`
    const keys = await redis.keys(fullPattern)
    if (keys.length === 0) return

    const BATCH_SIZE = 1000
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE)
      if (batch.length > 0) {
        await redis.del(...batch)
      }
    }
  } catch (err) {
    logger.warn(`[Redis] Failed to clear pattern ${pattern}:`, err)
  }
}

// Export redis instance for rate-limit-redis (may be null)
export { redis }
