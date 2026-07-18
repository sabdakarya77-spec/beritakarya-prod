import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.middleware'
import { prisma } from '../db/client'
import { Prisma, Role } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler'

const adminRouter = Router()

const requireAdmin = requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'])

// ── USAGE DASHBOARD ─────────────────────────────────────────────────────
adminRouter.get('/ai-usage', requireAuth, requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query
  const now = new Date()
  
  // Default to last 30 days
  const start = startDate ? new Date(startDate as string) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const end = endDate ? new Date(endDate as string) : now

  // Overall statistics
  const totalStats = await prisma.aIUsage.aggregate({
    where: {
      createdAt: { gte: start, lte: end },
      success: true
    },
    _sum: {
      estimatedCost: true,
      inputLength: true,
      outputLength: true,
      latencyMs: true
    },
    _count: {
      id: true
    }
  })

  // By role using raw query (for proper joins)
  const byRole = await prisma.$queryRaw<{ role: string; requests: number; cost: number; totalTokens: number }[]>`
    SELECT 
      u.role,
      COUNT(DISTINCT ua.id)::int as requests,
      SUM(ua."estimatedCost") as cost,
      SUM(ua."tokensInput" + ua."tokensOutput")::int as totalTokens
    FROM "AIUsage" ua
    JOIN "User" u ON ua."userId" = u.id
    WHERE ua."createdAt" >= ${start}
      AND ua."createdAt" <= ${end}
      AND ua.success = true
    GROUP BY u.role
    ORDER BY cost DESC
  `

  // By feature
  const byFeature = await prisma.aIUsage.groupBy({
    by: ['action'],
    where: {
      createdAt: { gte: start, lte: end },
      success: true
    },
    _sum: {
      estimatedCost: true,
      inputLength: true,
      outputLength: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        estimatedCost: 'desc'
      }
    }
  })

  // By site (branch)
  const bySite = await prisma.$queryRaw<{ site: string; requests: number; cost: number; activeUsers: number }[]>`
    SELECT 
      s.domain as site,
      COUNT(DISTINCT ua.id)::int as requests,
      SUM(ua."estimatedCost") as cost,
      COUNT(DISTINCT ua."userId")::int as activeUsers
    FROM "AIUsage" ua
    JOIN "Site" s ON ua."siteId" = s.id
    WHERE ua."createdAt" >= ${start}
      AND ua."createdAt" <= ${end}
      AND ua.success = true
    GROUP BY s.domain
    ORDER BY cost DESC
  `

  // Top users by cost
  const topUsers = await prisma.$queryRaw<{ name: string; email: string; role: string; requests: number; cost: number }[]>`
    SELECT 
      u.name,
      u.email,
      u.role,
      COUNT(DISTINCT ua.id)::int as requests,
      SUM(ua."estimatedCost") as cost
    FROM "AIUsage" ua
    JOIN "User" u ON ua."userId" = u.id
    WHERE ua."createdAt" >= ${start}
      AND ua."createdAt" <= ${end}
      AND ua.success = true
    GROUP BY u.id, u.name, u.email, u.role
    ORDER BY cost DESC
    LIMIT 10
  `

  // Monthly budget status
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const budgetStatus = await prisma.$queryRaw<{ role: string; requests: number; currentSpend: number; monthlyBudget: number; percentUsed: number }[]>`
    SELECT 
      u.role,
      COUNT(DISTINCT ua.id)::int as requests,
      SUM(ua."estimatedCost") as currentSpend,
      rq."monthlyBudget",
      (SUM(ua."estimatedCost") * 100.0 / rq."monthlyBudget") as percentUsed
    FROM "User" u
    LEFT JOIN "AIUsage" ua ON u.id = ua."userId" 
      AND ua."createdAt" >= ${currentMonth}
      AND ua."createdAt" <= ${now}
      AND ua.success = true
    LEFT JOIN "RoleQuota" rq ON u.role = rq.role
    WHERE u."aiEnabled" = true
    GROUP BY u.role, rq."monthlyBudget"
    ORDER BY percentUsed DESC
  `

  // Daily usage trend
  const dailyTrend = await prisma.$queryRaw<{ date: Date; requests: number; cost: number; activeUsers: number }[]>`
    SELECT 
      ua."createdAt"::date as date,
      COUNT(*)::int as requests,
      SUM(ua."estimatedCost") as cost,
      COUNT(DISTINCT ua."userId")::int as activeUsers
    FROM "AIUsage" ua
    WHERE ua."createdAt" >= ${start}
      AND ua."createdAt" <= ${end}
      AND ua.success = true
    GROUP BY ua."createdAt"::date
    ORDER BY date ASC
  `

  // Model usage distribution
  const modelUsage = await prisma.aIUsage.groupBy({
    by: ['modelUsed'],
    where: {
      createdAt: { gte: start, lte: end },
      success: true,
      modelUsed: { not: null }
    },
    _sum: {
      estimatedCost: true,
      tokensInput: true,
      tokensOutput: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        estimatedCost: 'desc'
      }
    }
  })

  res.json({
    period: { start, end },
    overall: {
      totalCost: totalStats._sum.estimatedCost || 0,
      totalRequests: totalStats._count.id || 0,
      totalTokens: (totalStats._sum.inputLength || 0) + (totalStats._sum.outputLength || 0),
      avgLatency: totalStats._sum.latencyMs ? totalStats._sum.latencyMs / (totalStats._count.id || 1) : 0
    },
    byRole,
    byFeature,
    bySite,
    topUsers,
    budgetStatus,
    dailyTrend,
    modelUsage
  })
}))

// ── QUOTA MANAGEMENT ───────────────────────────────────────────────────
adminRouter.get('/quotas', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  // Get all role quotas
  const roleQuotas = await prisma.roleQuota.findMany({
    orderBy: { role: 'asc' }
  })

  // Get users with their quota info
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      siteId: true,
      aiEnabled: true,
      aiDailyLimit: true,
      aiMonthlyBudget: true,
      aiFeaturesAllowed: true,
      aiModelRestriction: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Load sites separately
  const siteIds = [...new Set(users.map(u => u.siteId).filter(Boolean))] as string[]
  const sites = await prisma.site.findMany({
    where: { id: { in: siteIds } },
    select: { id: true, domain: true, name: true }
  })
  const siteMap = new Map(sites.map(s => [s.id, s]))

  // Get current month usage per user
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const userUsage = await prisma.$queryRaw<{ userId: string; requests: number; cost: number; tokens: number }[]>`
    SELECT 
      ua."userId",
      COUNT(*)::int as requests,
      SUM(ua."estimatedCost") as cost,
      SUM(ua."tokensInput" + ua."tokensOutput")::int as tokens
    FROM "AIUsage" ua
    WHERE ua."createdAt" >= ${monthStart}
      AND ua.success = true
    GROUP BY ua."userId"
  `

  const usageMap = new Map()
  for (const u of userUsage) {
    usageMap.set(u.userId, u)
  }

  // Enrich roleQuotas to make sure allowedFeatures is always an array
  const formattedRoleQuotas = roleQuotas.map(quota => {
    let allowed: string[] = []
    if (Array.isArray(quota.allowedFeatures)) {
      allowed = quota.allowedFeatures as string[]
    } else if (typeof quota.allowedFeatures === 'string') {
      try {
        allowed = JSON.parse(quota.allowedFeatures)
      } catch (_e) {
        allowed = []
      }
    }
    return {
      ...quota,
      allowedFeatures: allowed
    }
  })

  // Enrich users with usage, site info, and secure features array
  const enrichedUsers = users.map(user => {
    const usage = usageMap.get(user.id) || { requests: 0, cost: 0, tokens: 0 }
    const site = user.siteId ? siteMap.get(user.siteId) : null
    
    let allowed: string[] = []
    if (Array.isArray(user.aiFeaturesAllowed)) {
      allowed = user.aiFeaturesAllowed as string[]
    } else if (typeof user.aiFeaturesAllowed === 'string') {
      try {
        allowed = JSON.parse(user.aiFeaturesAllowed)
      } catch (_e) {
        allowed = []
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      site: site || null,
      aiEnabled: user.aiEnabled,
      aiDailyLimit: user.aiDailyLimit,
      aiMonthlyBudget: user.aiMonthlyBudget,
      aiFeaturesAllowed: allowed,
      aiModelRestriction: user.aiModelRestriction,
      currentMonthUsage: usage
    }
  })

  res.json({
    roleQuotas: formattedRoleQuotas,
    users: enrichedUsers
  })
}))

// ── USER QUOTA MANAGEMENT ──────────────────────────────────────────────
adminRouter.patch('/users/:userId/quota', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const userId = req.params.userId
  const {
    aiEnabled,
    aiDailyLimit,
    aiMonthlyBudget,
    aiFeaturesAllowed,
    aiModelRestriction
  } = req.body

  const updateData: Prisma.UserUpdateInput = {}
  if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled
  if (aiDailyLimit !== undefined) updateData.aiDailyLimit = aiDailyLimit
  if (aiMonthlyBudget !== undefined) updateData.aiMonthlyBudget = aiMonthlyBudget
  if (aiFeaturesAllowed !== undefined) updateData.aiFeaturesAllowed = JSON.stringify(aiFeaturesAllowed)
  if (aiModelRestriction !== undefined) updateData.aiModelRestriction = aiModelRestriction

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      aiEnabled: true,
      aiDailyLimit: true,
      aiMonthlyBudget: true,
      aiFeaturesAllowed: true,
      aiModelRestriction: true
    }
  })

  res.json({
    success: true,
    message: 'User quota updated',
    user
  })
}))

// ── ROLE QUOTA MANAGEMENT ──────────────────────────────────────────────
adminRouter.patch('/roles/:role/quota', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const role = req.params.role as Role
  
  // Basic validation to prevent Prisma errors with invalid role strings
  const validRoles: Role[] = ['reader', 'reporter', 'kontributor', 'wapimred', 'superadmin', 'advertiser', 'kaperwil', 'korwil', 'kabiro']
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`
    })
  }
  const {
    dailyRequests,
    dailyTokens,
    monthlyBudget,
    allowedFeatures,
    modelRestriction
  } = req.body

  const updateData: Prisma.RoleQuotaUpdateInput = {}
  if (dailyRequests !== undefined) updateData.dailyRequests = dailyRequests
  if (dailyTokens !== undefined) updateData.dailyTokens = dailyTokens
  if (monthlyBudget !== undefined) updateData.monthlyBudget = monthlyBudget
  if (allowedFeatures !== undefined) updateData.allowedFeatures = JSON.stringify(allowedFeatures)
  if (modelRestriction !== undefined) updateData.modelRestriction = modelRestriction

  const roleQuota = await prisma.roleQuota.upsert({
    where: { role },
    update: updateData,
    create: {
      role,
      dailyRequests: (dailyRequests as number) || 50,
      dailyTokens: (dailyTokens as number) || 10000,
      monthlyBudget: (monthlyBudget as number) || 10.00,
      allowedFeatures: JSON.stringify(allowedFeatures || ['rewrite', 'expand', 'grammar', 'readability', 'caption']),
      modelRestriction: modelRestriction as string | null || null
    }
  })

  res.json({
    success: true,
    message: 'Role quota updated',
    roleQuota
  })
}))

// ── ALERT HISTORY ──────────────────────────────────────────────────────
adminRouter.get('/alerts', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const { type, isRead, userId } = req.query

  const where: Prisma.NotificationWhereInput = {}

  // Filter: only AI-related alert types for admin view
  const alertTypes = ['quota_warning', 'quota_exceeded', 'budget_warning', 'ai_disabled', 'unusual_spike']
  where.type = type ? String(type) : { in: alertTypes }

  if (isRead !== undefined) {
    where.isRead = isRead === 'true'
  }

  if (userId) {
    where.userId = String(userId)
  }

  // Run count + paginated query in parallel
  const [total, alerts] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        userId: true,
        siteId: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      }
    })
  ])

  // Enrich with user info (name + email) via a single batch query
  const userIds = [...new Set(alerts.map(a => a.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true }
  })
  const userMap = new Map(users.map(u => [u.id, u]))

  const enrichedAlerts = alerts.map(alert => ({
    ...alert,
    user: userMap.get(alert.userId) ?? null
  }))

  // Summary stats for quick overview
  const [unreadCount, todayCount] = await Promise.all([
    prisma.notification.count({ where: { ...where, isRead: false } }),
    prisma.notification.count({
      where: {
        ...where,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    })
  ])

  res.json({
    alerts: enrichedAlerts,
    total,
    unread: unreadCount,
    today: todayCount,
    limit: Number(limit),
    offset: Number(offset),
  })
}))

// ── MARK ALL ALERTS AS READ (static route — must be before :id routes) ──
adminRouter.patch('/alerts/read-all', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const alertTypes = ['quota_warning', 'quota_exceeded', 'budget_warning', 'ai_disabled', 'unusual_spike']

  const { count } = await prisma.notification.updateMany({
    where: { type: { in: alertTypes }, isRead: false },
    data: { isRead: true }
  })

  res.json({ success: true, updated: count })
}))

// ── MARK ALERT AS READ ─────────────────────────────────────────────────
adminRouter.patch('/alerts/:id/read', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params

  const alert = await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })

  res.json({ success: true, alert })
}))

// ── DELETE (DISMISS) ALERT ─────────────────────────────────────────────
adminRouter.delete('/alerts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params

  await prisma.notification.delete({ where: { id } })

  res.json({ success: true, message: 'Alert dismissed' })
}))

export default adminRouter