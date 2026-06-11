import { prisma } from '../db/client'
import { logger } from '../lib/logger'

/**
 * Token Cleanup Task
 * 1. Purge expired refresh tokens
 * 2. Purge expired blacklisted tokens
 */
export async function runTokenCleanup() {
  logger.info('🧹 Starting scheduled token cleanup task...')
  const now = new Date()

  try {
    // --- 1. PURGE EXPIRED REFRESH TOKENS ---
    const deletedRefresh = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    })
    
    if (deletedRefresh.count > 0) {
      logger.info(`  Cleaned up ${deletedRefresh.count} expired refresh tokens.`)
    }

    // --- 2. PURGE EXPIRED BLACKLISTED TOKENS ---
    const deletedBlacklisted = await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    })

    if (deletedBlacklisted.count > 0) {
      logger.info(`  Cleaned up ${deletedBlacklisted.count} expired blacklisted tokens.`)
    }

    logger.info('✅ Token cleanup task completed successfully.')
  } catch (error) {
    logger.error('❌ Token cleanup task failed:', error)
  }
}

// If run directly
if (require.main === module) {
  runTokenCleanup()
}
