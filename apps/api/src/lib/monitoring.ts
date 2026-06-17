import { logger } from './logger'

interface Metric {
  count: number
  totalMs: number
  errors: number
  lastReset: Date
}

const REDIS_KEY = 'metrics:summary'
const REDIS_TTL = 7 * 24 * 60 * 60 // 7 days in seconds
const FLUSH_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * In-memory metrics collector with optional Redis persistence.
 * Metrics survive restarts when Redis is available.
 */
class MetricsCollector {
  private metrics: Map<string, Metric> = new Map()
  private flushTimer: ReturnType<typeof setInterval> | null = null

  record(key: string, durationMs: number, isError = false) {
    const existing = this.metrics.get(key) ?? {
      count: 0, totalMs: 0, errors: 0, lastReset: new Date()
    }
    this.metrics.set(key, {
      count: existing.count + 1,
      totalMs: existing.totalMs + durationMs,
      errors: existing.errors + (isError ? 1 : 0),
      lastReset: existing.lastReset
    })
  }

  getSummary() {
    const result: Record<string, unknown> = {}
    for (const [key, m] of this.metrics.entries()) {
      result[key] = {
        count: m.count,
        avgMs: m.count > 0 ? Math.round(m.totalMs / m.count) : 0,
        errorRate: m.count > 0 ? ((m.errors / m.count) * 100).toFixed(1) + '%' : '0%',
        errors: m.errors,
        lastReset: m.lastReset.toISOString()
      }
    }
    return result
  }

  reset() {
    this.metrics.clear()
  }

  /**
   * Start periodic Redis persistence (every 5 minutes).
   * Call this once during app startup after Redis is initialized.
   */
  startAutoFlush() {
    if (this.flushTimer) return // already running

    // Load historical data from Redis on startup
    this.loadFromRedis().catch(() => {})

    this.flushTimer = setInterval(() => {
      this.persistToRedis().catch(() => {})
    }, FLUSH_INTERVAL)

    // Ensure flush on process exit
    process.on('SIGTERM', () => this.persistToRedis().catch(() => {}))
    process.on('SIGINT', () => this.persistToRedis().catch(() => {}))
  }

  /**
   * Persist current metrics to Redis with 7-day TTL.
   */
  async persistToRedis() {
    try {
      const { redis } = await import('./redis.js')
      if (!redis) return

      const summary = this.getSummary()
      if (Object.keys(summary).length === 0) return

      await redis.set(REDIS_KEY, JSON.stringify(summary), 'EX', REDIS_TTL)
    } catch (_e) {
      // Silent fail — metrics persistence is best-effort
    }
  }

  /**
   * Load metrics from Redis into memory.
   * Called on startup to restore historical data.
   */
  async loadFromRedis() {
    try {
      const { redis } = await import('./redis.js')
      if (!redis) return

      const data = await redis.get(REDIS_KEY)
      if (!data) return

      const summary = JSON.parse(data)
      for (const [key, m] of Object.entries(summary as Record<string, { count: number; avgMs: number; errors: number; lastReset: string }>)) {
        this.metrics.set(key, {
          count: m.count || 0,
          totalMs: (m.avgMs || 0) * (m.count || 0),
          errors: m.errors || 0,
          lastReset: new Date(m.lastReset || Date.now())
        })
      }

      logger.info(`[Metrics] Loaded ${Object.keys(summary).length} metric keys from Redis`)
    } catch (_e) {
      // Silent fail — will start fresh
    }
  }
}

export const metrics = new MetricsCollector()
