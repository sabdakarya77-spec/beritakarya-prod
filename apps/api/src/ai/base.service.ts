import OpenAI from 'openai'
import { logger } from '../lib/logger'
import { env } from '../lib/env'
import { getCache, setCache } from '../lib/redis'
import { createHash } from 'crypto'
import { createOpenAIBreaker } from '../lib/circuitBreaker'
import { prisma } from '../db/client'

let client: OpenAI | null = null

function getClient() {
  const apiKey = env.OPENAI_API_KEY || (process.env.VITEST ? 'test-key' : undefined)

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
      timeout: 30_000,
    })
  }

  return client
}

export interface AIResult<T> {
  success: boolean
  data?: T
  error?: string
  fallback?: boolean
  cached?: boolean
}

// Generate cache key from prompt + options
function getCacheKey(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): string {
  const hash = createHash('md5')
  const content = `${systemPrompt}|${userPrompt}|${opts.model || env.AI_MODEL}|${opts.maxTokens || 1000}|${opts.temperature || 0.7}`
  hash.update(content)
  return `ai:${hash.digest('hex')}`
}

// Circuit breaker for OpenAI with fallback
const openaiBreaker = createOpenAIBreaker(
  async (systemPrompt: string, userPrompt: string, opts: { 
    maxTokens?: number; 
    temperature?: number; 
    model?: string;
  }) => {
    const res = await getClient().chat.completions.create({
      model: opts.model || env.AI_MODEL,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
    return res.choices[0]?.message?.content?.trim() ?? ''
  }
)

export async function callAI<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<AIResult<T>> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (err: any) {
      lastError = err
      const isRetryable =
        err?.status === 429 ||
        err?.status >= 500 ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET'

      if (!isRetryable || attempt === maxRetries) break

      const delay = Math.pow(2, attempt - 1) * 1000
      logger.warn(`AI retry attempt ${attempt}/${maxRetries} in ${delay}ms — ${err.message}`)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  logger.error({ message: 'AI call failed', error: lastError?.message })
  return {
    success: false,
    error: 'AI tidak tersedia saat ini. Coba lagi nanti.'
  }
}

export async function chatComplete(
  systemPrompt: string,
  userPrompt: string,
  opts: { 
    maxTokens?: number; 
    temperature?: number; 
    model?: string;
    useCache?: boolean;
    cacheTtl?: number;
  } = {}
): Promise<string> {
  const {
    model = env.AI_MODEL,
    useCache = true,
    cacheTtl = 3600
  } = opts

  // Check cache first (if enabled)
  if (useCache && process.env.REDIS_HOST) {
    const cacheKey = getCacheKey(systemPrompt, userPrompt, { ...opts, model })
    const cached = await getCache<{ result: string }>(cacheKey)
    if (cached?.result) {
      logger.debug('Cache hit for AI request')
      return cached.result
    }
  }

  // Use circuit breaker for OpenAI call
  let result: string
  try {
    result = await openaiBreaker.fire(
      systemPrompt, 
      userPrompt, 
      {
        maxTokens: opts.maxTokens ?? 1000,
        temperature: opts.temperature ?? 0.7,
        model
      }
    )
  } catch (err: any) {
    logger.error('OpenAI circuit breaker error:', err.message)
    
    // Circuit is open, return fallback message
    // @ts-expect-error - opossum circuit breaker has stats.state
    if (openaiBreaker.stats?.state === 'open') {
      return '[Service temporarily unavailable]'
    }
    
    throw err
  }

  // Cache successful result
  if (useCache && process.env.REDIS_HOST && result) {
    const cacheKey = getCacheKey(systemPrompt, userPrompt, { ...opts, model })
    await setCache(cacheKey, { result }, cacheTtl)
    logger.debug('Cached AI response')
  }

  return result
}

export async function callAIWithTracking<T>(
  fn: () => Promise<T>,
  req: any, // Request object with user info
  action: string,
  maxRetries = 3
): Promise<AIResult<T>> {
  const start = Date.now()
  
  // Execute AI call with retry logic
  let result: AIResult<T> | null = null
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn()
      result = { success: true, data }
      break
    } catch (err: any) {
      lastError = err
      const isRetryable =
        err?.status === 429 ||
        err?.status >= 500 ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ECONNRESET'

      if (!isRetryable || attempt === maxRetries) break

      const delay = Math.pow(2, attempt - 1) * 1000
      logger.warn(`AI retry attempt ${attempt}/${maxRetries} in ${delay}ms — ${err.message}`)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  if (!result) {
    logger.error({ message: 'AI call failed', error: lastError?.message })
    result = {
      success: false,
      error: 'AI tidak tersedia saat ini. Coba lagi nanti.'
    }
  }

  // Post-call accounting and cost tracking
  try {
    // [H-009] Only log if user context exists
    if (req?.user?.userId || req?.aiUserId) {
      await accountAIUsage(req, action, result, Date.now() - start)
    }
  } catch (accountingError) {
    logger.error('Failed to account AI usage:', accountingError)
    // Don't fail the request due to accounting issues
  }

  return result
}

/**
 * Track AI usage with cost estimation and quota accounting
 */
async function accountAIUsage(
  req: any,
  action: string,
  result: AIResult<any>,
  latencyMs: number
) {
  const userId = req?.aiUserId || req?.user?.userId
  const siteId = req?.user?.siteId || 'pusat'
  const model = req?.body?.model || env.AI_MODEL || 'gpt-4o'

  if (!userId) return

  // Estimate tokens (rough approximation if not available)
  const inputLength = typeof req?.body?.content === 'string' 
    ? req.body.content.length 
    : JSON.stringify(req.body).length
  const outputLength = typeof result.data === 'string'
    ? result.data.length
    : JSON.stringify(result.data).length

  const tokensInput = Math.ceil(inputLength / 4)
  const tokensOutput = Math.ceil(outputLength / 4)

  // Calculate cost based on model
  const cost = calculateCost(tokensInput, tokensOutput, model)

  // Log to AIUsage table (async, don't block)
  try {
    await prisma.aIUsage.create({
      data: {
        userId,
        siteId,
        action,
        inputLength: tokensInput,
        outputLength: tokensOutput,
        latencyMs,
        success: result.success,
        estimatedCost: cost,
        modelUsed: model,
        tokensInput,
        tokensOutput
      }
    })
  } catch (dbError) {
    logger.error('Failed to log AI usage:', dbError)
    // Continue - logging failure shouldn't break anything
  }

  // Update real-time counters in Redis (for quota checks)
  if (process.env.REDIS_HOST) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const dailyKey = `ai:quota:${userId}:${today}`
      
      const current = await getCache<number>(dailyKey) || 0
      await setCache(dailyKey, current + 1, 86400)
    } catch (redisError) {
      logger.error('Failed to update Redis counters:', redisError)
    }
  }
}

/**
 * Calculate cost in USD based on token usage and model
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const COST_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-3.5-turbo-0125': { input: 0.50, output: 1.50 }
  }

  const rates = COST_PER_1M_TOKENS[model]
  if (!rates) {
    logger.warn(`Unknown model ${model}, using default gpt-4o rates`)
    return 0 // Unknown model, can't calculate
  }

  return (
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output
  )
}
