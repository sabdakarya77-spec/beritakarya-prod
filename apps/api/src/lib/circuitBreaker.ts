import CircuitBreaker from 'opossum'
import { logger } from './logger'

// ─── Types ───────────────────────────────────────────────────────────────────

type AsyncFn<TArgs extends unknown[], TReturn> = (...args: TArgs) => Promise<TReturn>

// ─── Factory: OpenAI Circuit Breaker ─────────────────────────────────────────

/**
 * Creates a circuit breaker for an OpenAI-backed async function.
 * Timeout: 10s | Trip at: 50% error rate | Reset after: 30s
 */
export function createOpenAIBreaker<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>
): CircuitBreaker<TArgs, TReturn> {
  const breaker = new CircuitBreaker(fn, {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'openai',
  })

  breaker.on('open', () =>
    logger.warn('[CircuitBreaker] OpenAI circuit OPEN — calls are being short-circuited')
  )
  breaker.on('halfOpen', () =>
    logger.info('[CircuitBreaker] OpenAI circuit HALF-OPEN — testing recovery')
  )
  breaker.on('close', () =>
    logger.info('[CircuitBreaker] OpenAI circuit CLOSED — service recovered')
  )
  breaker.on('fallback', () =>
    logger.warn('[CircuitBreaker] OpenAI fallback triggered')
  )

  return breaker
}

// ─── Factory: Meilisearch Circuit Breaker ────────────────────────────────────

/**
 * Creates a circuit breaker for a Meilisearch-backed async function.
 * Timeout: 5s | Trip at: 50% error rate | Reset after: 30s
 */
export function createMeilisearchBreaker<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>,
  name: string
): CircuitBreaker<TArgs, TReturn> {
  const breaker = new CircuitBreaker(fn, {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: `meilisearch:${name}`,
  })

  breaker.on('open', () =>
    logger.warn(`[CircuitBreaker] Meilisearch:${name} circuit OPEN — search degraded`)
  )
  breaker.on('halfOpen', () =>
    logger.info(`[CircuitBreaker] Meilisearch:${name} circuit HALF-OPEN — testing recovery`)
  )
  breaker.on('close', () =>
    logger.info(`[CircuitBreaker] Meilisearch:${name} circuit CLOSED — search recovered`)
  )
  breaker.on('fallback', () =>
    logger.warn(`[CircuitBreaker] Meilisearch:${name} fallback triggered`)
  )

  return breaker
}

// ─── Standard Fallbacks ───────────────────────────────────────────────────────

export const openaiFallbackResult = {
  success: false,
  message: 'AI service temporarily unavailable. Please try again later.',
  fallback: true,
}

export const meilisearchSearchFallback = {
  success: false,
  message: 'Search service temporarily unavailable. Please try again later.',
  fallback: true,
  results: [] as unknown[],
}