import { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/client'
import { getCache, setCache } from '../lib/redis'
import { env } from '../lib/env'

interface QuotaCheckResult {
  allowed: boolean
  error?: string
  quota?: {
    dailyRequests: number
    dailyTokens: number
    monthlyBudget: number
    allowedFeatures: string[]
    modelRestriction?: string
  }
  statusCode?: number
}

/**
 * Check if user has permission to use AI feature
 * Also validates feature access and model restrictions
 */
export async function checkAIPermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user?.userId
  const userRole = req.user?.role
  
  if (!userId || !userRole) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  // Run async checks
  checkPermissions(userId, userRole, req)
    .then(result => {
      if (!result.allowed) {
        res.status(result.statusCode || 403).json({ error: result.error })
        return
      }
      // Store quota info for post-call accounting
      req.aiQuota = result.quota
      req.aiUserId = userId
      next()
    })
    .catch(_error => {
      res.status(500).json({ error: 'Quota check failed' })
    })
}

/**
 * Check user permissions and quotas
 */
async function checkPermissions(
  userId: string,
  userRole: string,
  req: Request
): Promise<QuotaCheckResult> {
  // Fetch user with quota fields
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiEnabled: true,
      aiDailyLimit: true,
      aiMonthlyBudget: true,
      aiFeaturesAllowed: true,
      aiModelRestriction: true,
      aiConsentGivenAt: true,
      role: true
    }
  })

  if (!user) {
    return { allowed: false, error: 'User not found' }
  }

  // Check if AI is enabled
  if (!user.aiEnabled) {
    return { allowed: false, error: 'AI access disabled. Contact admin.' }
  }

  // Check if user has given AI consent
  if (!user.aiConsentGivenAt) {
    return { allowed: false, error: 'CONSENT_REQUIRED', statusCode: 403 }
  }

  // Get role quota defaults (in case user fields are not set)
  const roleQuota = await prisma.roleQuota.findUnique({
    where: { role: user.role }
  })

  // Merge user-specific quotas with role defaults
  const dailyLimit = user.aiDailyLimit || roleQuota?.dailyRequests || 50
  const monthlyBudget = Number(user.aiMonthlyBudget ?? roleQuota?.monthlyBudget ?? 10.00)
  const allowedFeatures = user.aiFeaturesAllowed 
    ? JSON.parse(user.aiFeaturesAllowed as string)
    : roleQuota?.allowedFeatures ? JSON.parse(String(roleQuota.allowedFeatures)) : []
  const modelRestriction = user.aiModelRestriction || roleQuota?.modelRestriction || null

  // Extract endpoint from path (e.g., '/ai/rewrite' -> 'rewrite')
  const endpoint = req.path.split('/').pop() || ''

  // Feature permission check
  if (!allowedFeatures.includes(endpoint)) {
    return { 
      allowed: false, 
      error: `Feature '${endpoint}' tidak tersedia untuk role '${user.role}'. Hubungi admin untuk upgrade.` 
    }
  }

  // Model restriction check (applies to the request model if specified)
  const requestedModel = (req.body as Record<string, unknown> | undefined)?.model as string | undefined || env.AI_MODEL
  if (modelRestriction && requestedModel !== modelRestriction) {
    return {
      allowed: false,
      error: `Role '${user.role}' hanya bisa menggunakan model ${modelRestriction}.`
    }
  }

  // Check daily quota using Redis
  const today = new Date().toISOString().split('T')[0]
  const redisKey = `ai:quota:${userId}:${today}`
  
  // Try Redis first for performance
  let currentRequests: number
  if (process.env.REDIS_HOST) {
    const cached = await getCache<number>(redisKey)
    if (cached !== null) {
      currentRequests = cached
    } else {
      // Fallback to database
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      currentRequests = await prisma.aIUsage.count({
        where: { 
          userId, 
          createdAt: { gte: startOfDay },
          success: true 
        }
      })
      // Cache for 5 minutes
      await setCache(redisKey, currentRequests, 300)
    }
  } else {
    // No Redis, use database directly
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    currentRequests = await prisma.aIUsage.count({
      where: { 
        userId, 
        createdAt: { gte: startOfDay },
        success: true 
      }
    })
  }

  if (currentRequests >= dailyLimit) {
    return { 
      allowed: false, 
      error: `Quota harian habis (${dailyLimit}/hari). Reset besok pukul 00:00.`,
      quota: { dailyRequests: dailyLimit, dailyTokens: 0, monthlyBudget, allowedFeatures, modelRestriction: modelRestriction || undefined }
    }
  }

  // Check monthly budget using Redis
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const budgetKey = `ai:budget:${userId}:${currentMonth}`
  
  let currentSpend: number
  if (process.env.REDIS_HOST) {
    const cached = await getCache<number>(budgetKey)
    if (cached !== null) {
      currentSpend = cached
    } else {
      const monthStart = new Date(currentMonth + '-01')
      const result = await prisma.aIUsage.groupBy({
        by: ['userId'],
        where: { 
          userId, 
          createdAt: { gte: monthStart },
          success: true 
        },
        _sum: { estimatedCost: true }
      })
      currentSpend = Number(result[0]?._sum.estimatedCost ?? 0)
      await setCache(budgetKey, currentSpend, 300)
    }
  } else {
    const monthStart = new Date(currentMonth + '-01')
    const result = await prisma.aIUsage.groupBy({
      by: ['userId'],
      where: { 
        userId, 
        createdAt: { gte: monthStart },
        success: true 
      },
      _sum: { estimatedCost: true }
    })
    currentSpend = Number(result[0]?._sum.estimatedCost ?? 0)
  }

  if (currentSpend >= monthlyBudget) {
    return { 
      allowed: false, 
      error: `Budget bulanan habis ($${monthlyBudget}/bulan). Reset di bulan berikutnya.`,
      quota: { dailyRequests: dailyLimit, dailyTokens: 0, monthlyBudget, allowedFeatures, modelRestriction: modelRestriction || undefined }
    }
  }

  // Check if approaching limit (soft warning at 80%)
  if (currentRequests >= dailyLimit * 0.8 || currentSpend >= monthlyBudget * 0.8) {
    // Store warning flag in Redis for 1 hour to avoid spam
    const warningKey = `ai:quota:warned:${userId}`
    const alreadyWarned = await getCache<boolean>(warningKey)
    if (!alreadyWarned) {
      // Send warning asynchronously (to be implemented with notification system)
      console.log(`[Quota Warning] User ${userId} at ${Math.round((currentRequests/dailyLimit)*100)}% daily quota`)
      await setCache(warningKey, true, 3600)
    }
  }

  return { 
    allowed: true,
    quota: { 
      dailyRequests: dailyLimit, 
      dailyTokens: 0,
      monthlyBudget, 
      allowedFeatures, 
      modelRestriction: modelRestriction || undefined 
    }
  }
}