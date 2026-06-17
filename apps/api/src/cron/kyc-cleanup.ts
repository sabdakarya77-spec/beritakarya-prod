import { prisma } from '../db/client'
import { StorageService } from '../services/storage.service'
import { logger } from '../lib/logger'

/**
 * KYC Cleanup Task
 * 1. Enforce 5-year data retention policy (GDPR/UU PDP compliance)
 * 2. Cleanup rejected KYC files older than 30 days
 */
export async function runKYCCleanup() {
  logger.info('🧹 Starting scheduled KYC cleanup task...')
  const now = new Date()

  try {
    // --- 1. HANDLE EXPIRED KYC (5 YEARS) ---
    const expiredUsers = await prisma.user.findMany({
      where: {
        kycDataExpiresAt: { lt: now },
        OR: [
          { idCardPath: { not: null } },
          { familyCardPath: { not: null } }
        ]
      },
      select: { id: true, idCardPath: true, familyCardPath: true, name: true }
    })

    logger.info(`Found ${expiredUsers.length} expired KYC records to purge.`)

    for (const user of expiredUsers) {
      await purgeKYCData(user, 'EXPIRED')
    }

    // --- 2. HANDLE REJECTED KYC CLEANUP (30 DAYS) ---
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const rejectedUsers = await prisma.user.findMany({
      where: {
        isVerified: false,
        kycStatus: 'REJECTED',
        kycSubmittedAt: { lt: thirtyDaysAgo },
        OR: [
          { idCardPath: { not: null } },
          { familyCardPath: { not: null } }
        ]
      },
      select: { id: true, idCardPath: true, familyCardPath: true, name: true }
    })

    logger.info(`Found ${rejectedUsers.length} old rejected KYC records to cleanup.`)

    for (const user of rejectedUsers) {
      await purgeKYCData(user, 'REJECTED_CLEANUP')
    }

    logger.info('✅ KYC cleanup task completed successfully.')
  } catch (error) {
    logger.error('❌ KYC cleanup task failed:', error)
  }
}

async function purgeKYCData(user: { id: string; name: string; idCardPath: string | null; familyCardPath: string | null }, reason: string) {
  try {
    const isCloudEnabled = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'r2'

    // Delete files
    if (user.idCardPath) {
      if (isCloudEnabled && !user.idCardPath.startsWith('/')) {
        await StorageService.deleteFile(user.idCardPath).catch(err => logger.error(`Failed to delete S3 file: ${user.idCardPath}`, err))
      } else {
        // Local file deletion logic here if needed
      }
    }

    if (user.familyCardPath) {
      if (isCloudEnabled && !user.familyCardPath.startsWith('/')) {
        await StorageService.deleteFile(user.familyCardPath).catch(err => logger.error(`Failed to delete S3 file: ${user.familyCardPath}`, err))
      }
    }

    // Update DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        idCardPath: null,
        familyCardPath: null,
        kycNotes: `${reason} at ${new Date().toISOString()}`
      }
    })

    logger.info(`  [${reason}] Purged data for user: ${user.name} (${user.id})`)
  } catch (err) {
    logger.error(`  Failed to purge data for user ${user.id}:`, err)
  }
}

// If run directly (e.g. via ts-node)
if (require.main === module) {
  runKYCCleanup()
}
