import { prisma } from '../db/client'
import { logger } from '../lib/logger'

export interface UsageLog {
  userId: string
  siteId: string
  action: string
  inputLength: number
  outputLength: number
  latencyMs: number
  success: boolean
}

export async function logUsage(log: UsageLog) {
  try {
    await prisma.aIUsage.create({ data: log })
  } catch (error) {
    // logging failure tidak boleh crash aplikasi
    logger.error('[AI Usage Error]', error)
  }
}

export async function getUserUsageToday(userId: string, action: string) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return prisma.aIUsage.count({
    where: { userId, action, createdAt: { gte: startOfDay }, success: true }
  })
}
