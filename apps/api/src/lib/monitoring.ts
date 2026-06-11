interface Metric {
  count:    number
  totalMs:  number
  errors:   number
  lastReset:Date
}

/**
 * Simple in-memory metrics collector
 */
class MetricsCollector {
  private metrics: Map<string, Metric> = new Map()

  record(key: string, durationMs: number, isError = false) {
    const existing = this.metrics.get(key) ?? {
      count: 0, totalMs: 0, errors: 0, lastReset: new Date()
    }
    this.metrics.set(key, {
      count:     existing.count + 1,
      totalMs:   existing.totalMs + durationMs,
      errors:    existing.errors + (isError ? 1 : 0),
      lastReset: existing.lastReset
    })
  }

  getSummary() {
    const result: Record<string, any> = {}
    for (const [key, m] of this.metrics.entries()) {
      result[key] = {
        count:      m.count,
        avgMs:      m.count > 0 ? Math.round(m.totalMs / m.count) : 0,
        errorRate:  m.count > 0 ? ((m.errors / m.count) * 100).toFixed(1) + '%' : '0%',
        errors:     m.errors,
        lastReset:  m.lastReset.toISOString()
      }
    }
    return result
  }

  reset() {
    this.metrics.clear()
  }
}

export const metrics = new MetricsCollector()
