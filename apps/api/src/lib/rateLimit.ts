import rateLimit from 'express-rate-limit'
import { logger } from './logger'

/**
 * Rate Limit Store Strategy:
 *
 * - Development lokal tanpa Redis: menggunakan MemoryStore (default express-rate-limit)
 * - Produksi dengan Upstash/Redis: menggunakan RedisStore (rate-limit-redis)
 *
 * Di serverless (Vercel), MemoryStore tidak persistent antar invokasi,
 * sehingga rate-limiting akan "longgar". Untuk produksi yang ketat,
 * pastikan REDIS_HOST atau UPSTASH_REDIS_REST_URL diset.
 */

let createStore: ((prefix: string) => any) | undefined

// Only attempt Redis store if REDIS_HOST is explicitly configured
if (process.env.REDIS_HOST) {
  try {
    // Dynamic import to avoid crash if ioredis is not available
    const RedisStore = require('rate-limit-redis').default
    const { redis } = require('./redis')
    createStore = (prefix: string) => {
      if (!redis) return undefined
      return new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: (...args: string[]) => redis.call(...args),
      })
    }
    logger.info('[RateLimit] Using Redis store')
  } catch {
    logger.info('[RateLimit] Redis store unavailable, using in-memory store')
  }
}

const getStore = (prefix: string) => createStore?.(prefix) ?? undefined

export const authLimiter = rateLimit({
  store: getStore('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const apiLimiter = rateLimit({
  store: getStore('api'),
  windowMs: 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak request. Coba lagi sebentar.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const articleRateLimitKey = (req: { ip?: string; user?: { userId?: string } }) => {
  const user = (req as { user?: { userId?: string } }).user
  return user?.userId ? `user:${user.userId}` : `ip:${req.ip}`
}

export const articleWriteLimiter = rateLimit({
  store: getStore('article-write'),
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: articleRateLimitKey,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak pembuatan artikel. Coba lagi dalam 1 jam.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const articleUpdateLimiter = rateLimit({
  store: getStore('article-update'),
  windowMs: 60 * 60 * 1000,
  max: 120,
  keyGenerator: articleRateLimitKey,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak pembaruan artikel. Coba lagi dalam 1 jam.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const adTrackingLimiter = rateLimit({
  store: getStore('ad-track'),
  windowMs: 60 * 1000, // 1 menit
  max: 30,             // 30 impression/click per IP per menit
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak request tracking. Coba lagi sebentar.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for public (unauthenticated) read endpoints.
 * More restrictive than the general API limiter to prevent abuse.
 */
export const publicLimiter = rateLimit({
  store: getStore('public'),
  windowMs: 60 * 1000, // 1 minute
  max: 200,            // 200 requests per IP per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak request. Coba lagi sebentar.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const aiLimiter = rateLimit({
  store: getStore('ai'),
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMITED',
      message: 'Batas penggunaan AI tercapai. Coba lagi dalam 1 jam.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
})