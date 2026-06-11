import { prisma } from '../db/client'
import { logger } from '../lib/logger'
import { StorageService } from './storage.service'
import fs from 'fs/promises'
import path from 'path'

interface CleanupResult {
  totalCleaned: number
  errors: string[]
}

class CleanupService {
  private isRunning: boolean = false
  private cleanupInterval?: NodeJS.Timeout

  constructor() {
    this.startCleanupCron()
  }

  /**
   * Start cron job to run cleanup every day at 2 AM
   */
  private startCleanupCron() {
    // Run cleanup daily at 2 AM
    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const now = new Date()
    const twoAmToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 0, 0)
    
    // If it's past 2 AM, schedule for tomorrow
    if (now > twoAmToday) {
      twoAmToday.setDate(twoAmToday.getDate() + 1)
    }

    const timeUntilTwoAm = twoAmToday.getTime() - now.getTime()
    
    // Initial delay until 2 AM
    setTimeout(() => {
      this.runDailyCleanup()
      // Then run every 24 hours
      this.cleanupInterval = setInterval(() => {
        this.runDailyCleanup()
      }, ONE_DAY_MS)
    }, timeUntilTwoAm)

    logger.info(`CleanupService scheduled to run daily at 2 AM (in ${Math.round(timeUntilTwoAm / (1000 * 60 * 60))} hours)`)
  }

  /**
   * Run the daily cleanup job
   */
  async runDailyCleanup(): Promise<CleanupResult> {
    if (this.isRunning) {
      logger.warn('Cleanup job already running, skipping this execution')
      return { totalCleaned: 0, errors: [] }
    }

    this.isRunning = true
    const result: CleanupResult = { totalCleaned: 0, errors: [] }

    try {
      logger.info('Starting daily cleanup job...')
      
      // Find all users with expired KYC data (kycDataExpiresAt in the past)
      const expiredUsers = await prisma.user.findMany({
        where: {
          kycDataExpiresAt: { not: null, lt: new Date() },
          OR: [
            { idCardPath: { not: null } },
            { familyCardPath: { not: null } }
          ]
        },
        select: {
          id: true,
          email: true,
          name: true,
          siteId: true,
          idCardPath: true,
          familyCardPath: true
        }
      })

      logger.info(`Found ${expiredUsers.length} users with expired KYC documents`)

      for (const user of expiredUsers) {
        try {
          await this.cleanupUserKYC(user)
          result.totalCleaned++
        } catch (error) {
          const errorMsg = `Failed to cleanup KYC for user ${user.id} (${user.email}): ${error}`
          logger.error(errorMsg)
          result.errors.push(errorMsg)
        }
      }

      logger.info(`Cleanup job completed: ${result.totalCleaned} users cleaned, ${result.errors.length} errors`)
    } catch (error) {
      logger.error('Cleanup job failed:', error)
      result.errors.push(`Global error: ${error}`)
    } finally {
      this.isRunning = false
    }

    return result
  }

  /**
   * Cleanup KYC documents for a single user
   */
  private async cleanupUserKYC(user: any): Promise<void> {
    const filesToDelete: string[] = []
    
    if (user.idCardPath) filesToDelete.push(user.idCardPath)
    if (user.familyCardPath) filesToDelete.push(user.familyCardPath)

    // Delete from cloud storage if enabled
    const isCloudEnabled = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'r2'
    
    if (isCloudEnabled) {
      for (const filePath of filesToDelete) {
        try {
          await StorageService.deleteFile(filePath)
          logger.debug(`Deleted from cloud storage: ${filePath}`)
        } catch (error) {
          logger.warn(`Failed to delete from cloud storage ${filePath}: ${error}`)
          // Continue with local cleanup even if cloud delete fails
        }
      }
    }

    // Delete local files if they exist
    const localBasePath = process.env.KYC_LOCAL_PATH || 'uploads/kyc'
    for (const filePath of filesToDelete) {
      // If it's a local path (not a cloud key)
      if (!filePath.includes('/')) {
        const fullPath = path.join(localBasePath, filePath)
        try {
          await fs.unlink(fullPath).catch(() => {})
          logger.debug(`Deleted local file: ${fullPath}`)
        } catch (error) {
          logger.warn(`Failed to delete local file ${fullPath}: ${error}`)
        }
      }
    }

    // Update user record: clear KYC file paths and reset KYC status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        idCardPath: null,
        familyCardPath: null,
        kycDataExpiresAt: null,
        kycSubmittedAt: null,
        kycNotes: 'KYC documents deleted after retention period expired',
        isVerified: false
      }
    })

    // Audit log for cleanup
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        siteId: user.siteId || null,
        action: 'kyc.cleanup_expired',
        entityType: 'user',
        entityId: user.id,
        oldValue: { 
          idCardPath: user.idCardPath,
          familyCardPath: user.familyCardPath,
          kycDataExpiresAt: user.kycDataExpiresAt 
        },
        newValue: { 
          idCardPath: null,
          familyCardPath: null,
          kycDataExpiresAt: null 
        }
      }
    })

    logger.info(`Cleaned up KYC documents for user ${user.id} (${user.email})`)
  }

  /**
   * Manual trigger for cleanup (for testing or immediate execution)
   */
  async manualCleanup(): Promise<CleanupResult> {
    return this.runDailyCleanup()
  }

  /**
   * Stop the cleanup cron (for graceful shutdown)
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
      logger.info('CleanupService stopped')
    }
  }
}

export const cleanupService = new CleanupService()