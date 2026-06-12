import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { getCache, setCache } from '../lib/redis'

/**
 * Check for quota thresholds and create notifications
 * Called after AI usage is logged
 */
export async function checkQuotaThresholds(
  userId: string,
  dailyRequests: number,
  monthlySpend: number,
  user: any,
  roleQuota: any
) {
  const warningKey = `ai:quota:warned:${userId}`
  
  // Check daily quota (80% warning)
  if (dailyRequests >= roleQuota.dailyRequests * 0.8) {
    const alreadyWarned = await getCache<boolean>(warningKey)
    if (!alreadyWarned) {
      await createQuotaNotification(
        userId,
        'Daily quota warning',
        `You've used ${Math.round((dailyRequests / roleQuota.dailyRequests) * 100)}% of your daily AI quota (${dailyRequests}/${roleQuota.dailyRequests} requests).`,
        'warning'
      )
      await setCache(warningKey, true, 3600)
    }
  }

  // Check monthly budget (80% warning)
  if (monthlySpend >= roleQuota.monthlyBudget * 0.8) {
    const alreadyWarned = await getCache<boolean>(`${warningKey}:budget`)
    if (!alreadyWarned) {
      await createQuotaNotification(
        userId,
        'Monthly budget warning',
        `You've used ${Math.round((monthlySpend / roleQuota.monthlyBudget) * 100)}% of your monthly AI budget ($${monthlySpend.toFixed(2)}/$${roleQuota.monthlyBudget}).`,
        'warning'
      )
      await setCache(`${warningKey}:budget`, true, 3600)
    }
  }
}

/**
 * Create a quota notification in the database
 */
async function createQuotaNotification(
  userId: string,
  title: string,
  message: string,
  _type: 'warning' | 'error' | 'info'
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true }
    })

    if (!user) return

    await prisma.notification.create({
      data: {
        userId,
        siteId: user.siteId || 'pusat',
        type: 'quota_warning',
        title,
        message,
        link: '/admin/ai-quotas'
      }
    })

    logger.info(`Created quota notification for user ${userId}: ${title}`)
  } catch (error) {
    logger.error('Failed to create quota notification:', error)
  }
}

/**
 * Check for users approaching quota limits (cron job)
 * Run this hourly via cron
 */
export async function checkAllQuotas() {
  const now = new Date()

  logger.info('Starting hourly quota check...')

  // Get all users with AI enabled
  const users = await prisma.user.findMany({
    where: { aiEnabled: true },
    include: {
      site: true
    }
  })

  for (const user of users) {
    try {
      const roleQuota = await prisma.roleQuota.findUnique({
        where: { role: user.role }
      })

      if (!roleQuota) continue

      // Get daily usage count
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const dailyCount = await prisma.aIUsage.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfDay },
          success: true
        }
      })

      // Get monthly spend
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyResult = await prisma.$queryRaw<{ spend: string | number }[]>`
        SELECT COALESCE(SUM(ua."estimatedCost"), 0) as spend
        FROM "AIUsage" ua
        WHERE ua."userId" = ${user.id}
          AND ua."createdAt" >= ${monthStart}
          AND ua."createdAt" <= ${now}
          AND ua.success = true
      `
      const monthlySpend = Number(monthlyResult[0]?.spend ?? 0)

      // Check thresholds
      await checkQuotaThresholds(user.id, dailyCount, monthlySpend, user, roleQuota)

      // Disable AI if quota exceeded (hard limit)
      if (dailyCount >= roleQuota.dailyRequests || monthlySpend >= Number(roleQuota.monthlyBudget)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { aiEnabled: false }
        })
        
        await createQuotaNotification(
          user.id,
          'AI access suspended',
          `Your AI access has been temporarily suspended due to exceeding your quota. Please contact your administrator to increase your limits.`,
          'error'
        )

        logger.warn(`Disabled AI for user ${user.id} due to quota exceeded`)
      }
    } catch (error) {
      logger.error(`Error checking quota for user ${user.id}:`, error)
    }
  }

  logger.info('Hourly quota check completed')
}