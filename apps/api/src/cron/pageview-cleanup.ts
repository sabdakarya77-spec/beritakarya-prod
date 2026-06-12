import { prisma } from '../db/client'
import { logger } from '../lib/logger'

/**
 * PageView Cleanup Task
 *
 * Deletes PageView rows older than PAGEVIEW_RETENTION_DAYS (default: 90).
 * Runs in batches of 1000 to avoid long-running transactions.
 */
export async function runPageViewCleanup() {
  const retentionDays = parseInt(process.env.PAGEVIEW_RETENTION_DAYS || '90', 10)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  logger.info(`🧹 Starting PageView cleanup (retention: ${retentionDays} days, cutoff: ${cutoff.toISOString()})...`)

  let totalDeleted = 0

  try {
    // Batch delete to avoid long locks
    while (true) {
      const result = await prisma.$executeRaw`
        DELETE FROM "PageView"
        WHERE id IN (
          SELECT id FROM "PageView"
          WHERE "createdAt" < ${cutoff}
          LIMIT 1000
        )
      `

      if (result === 0) break
      totalDeleted += result
      logger.info(`  Deleted ${totalDeleted} PageView rows so far...`)
    }

    if (totalDeleted > 0) {
      logger.info(`✅ PageView cleanup completed: ${totalDeleted} rows deleted (older than ${retentionDays} days).`)
    } else {
      logger.info('✅ PageView cleanup completed: no old rows to delete.')
    }
  } catch (error) {
    logger.error('❌ PageView cleanup failed:', error)
    throw error
  }
}
