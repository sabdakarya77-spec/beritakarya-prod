import { Router, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import multer from 'multer'
import os from 'os'
import fs from 'fs/promises'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { anonymizeIP } from '@beritakarya/utils'
import { FileValidator } from '../../services/file-validator.service'
import { WatermarkService } from '../../services/watermark.service'
import { StorageService } from '../../services/storage.service'
import { sendNotification } from '../notification/notification.controller'
import { logger } from '../../lib/logger'

export const kycRouter = Router()

// Setup Multer for temporary storage in OS temp dir
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

const kycUpload = upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'familyCard', maxCount: 1 },
])

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

kycRouter.get('/',
  ...withSite,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site!
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const search = req.query.search as string
    const status = req.query.status as string
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = { siteId, deletedAt: null }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'pending') {
      where.kycStatus = 'PENDING'
    } else if (status === 'verified') {
      where.kycStatus = 'APPROVED'
    } else if (status === 'rejected') {
      where.kycStatus = 'REJECTED'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kycSubmittedAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          kycSubmittedAt: true,
          kycReviewedAt: true,
          kycStatus: true,
          kycNotes: true,
        }
      }),
      prisma.user.count({ where })
    ])

    res.json({ 
      success: true, 
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

// GET /stats - Get KYC editorial metrics
kycRouter.get('/stats',
  ...withSite,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site!
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalPending,
      approvedThisWeek,
      rejectedThisWeek,
      allVerifiedUsers
    ] = await Promise.all([
      // Total Pending (Submitted but not verified and not rejected)
      prisma.user.count({
        where: { siteId, kycStatus: 'PENDING', deletedAt: null }
      }),
      // Approved This Week
      prisma.user.count({
        where: { siteId, kycStatus: 'APPROVED', kycReviewedAt: { gte: oneWeekAgo }, deletedAt: null }
      }),
      // Rejected This Week
      prisma.user.count({
        where: { siteId, kycStatus: 'REJECTED', kycReviewedAt: { gte: oneWeekAgo }, deletedAt: null }
      }),
      // All Verified Users (for avg time calculation)
      prisma.user.findMany({
        where: { siteId, kycStatus: 'APPROVED', kycSubmittedAt: { not: null }, kycReviewedAt: { not: null }, deletedAt: null },
        select: { kycSubmittedAt: true, kycReviewedAt: true }
      })
    ])

    // Calculate Average Approval Time (in hours)
    let avgApprovalTime = 0
    if (allVerifiedUsers.length > 0) {
      const totalHours = allVerifiedUsers.reduce((sum, u) => {
        const diff = u.kycReviewedAt!.getTime() - u.kycSubmittedAt!.getTime()
        return sum + (diff / (1000 * 60 * 60))
      }, 0)
      avgApprovalTime = Math.round(totalHours / allVerifiedUsers.length)
    }

    // NEW: Calculate Trend Data (Last 7 Days)
    // [B-2] Optimized: use raw query for GROUP BY DATE to support PostgreSQL casting
    const trendDataRaw = await prisma.$queryRaw<{ date: Date; count: number }[]>`
      SELECT 
        "kycSubmittedAt"::date as date, 
        COUNT(*)::int as count 
      FROM "User" 
      WHERE "siteId" = ${siteId} 
        AND "kycSubmittedAt" >= ${oneWeekAgo}
      GROUP BY "kycSubmittedAt"::date 
      ORDER BY date ASC
    `

    // Format for frontend (fill gaps if any)
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const found = trendDataRaw.find(d => {
        const dStr = new Date(d.date).toISOString().split('T')[0]
        return dStr === dateStr
      })
      
      trendData.push({ date: dateStr, count: found ? found.count : 0 })
    }

    res.json({
      success: true,
      data: {
        totalPending,
        approvedThisWeek,
        rejectedThisWeek,
        avgApprovalTime,
        conversionRate: Math.round((approvedThisWeek / (approvedThisWeek + rejectedThisWeek || 1)) * 100),
        trendData
      }
    })
  })
)

kycRouter.get('/:id',
  ...withSite,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        role: true,
        isVerified: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycStatus: true,
        kycNotes: true,
        kycDataExpiresAt: true,
        idCardPath: true,
        familyCardPath: true
      }
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      })
    }
    res.json({ success: true, data: user })
  })
)

// POST /submit - Submit KYC documents
kycRouter.post('/submit',
  ...withSite,
  kycUpload,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    const _siteId = req.site!

    // req.site bisa berisi nilai virtual ('pusat', 'all') yang bukan ID Site nyata di DB.
    // Untuk operasi database (AuditLog, Notification), gunakan siteId user yang sebenarnya.
    const dbSiteId = req.user?.siteId || null

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }
    const idCard = files?.['idCard']?.[0]
    const familyCard = files?.['familyCard']?.[0]

    if (!idCard) {
      return res.status(400).json({ success: false, error: { message: 'KTP wajib diupload' } })
    }

    const consent = req.body.consent === 'true' || req.body.consent === '1'
    if (!consent) {
      return res.status(400).json({
        success: false,
        error: { message: 'Harus setuju kebijakan perlindungan data untuk melanjutkan' }
      })
    }

    // 1. Validate files
    const idCardValidation = await FileValidator.validateFile(idCard.path, idCard.originalname)
    if (!idCardValidation.valid) {
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(400).json({ success: false, error: { message: idCardValidation.error } })
    }

    // Flag resolusi rendah (hanya warning, tidak memblokir)
    const idCardLowRes = idCardValidation.metadata?.lowResolution === true
    let familyCardLowRes = false

    if (familyCard) {
      const familyCardValidation = await FileValidator.validateFile(familyCard.path, familyCard.originalname)
      if (!familyCardValidation.valid) {
        await fs.unlink(idCard.path).catch(() => {})
        await fs.unlink(familyCard.path).catch(() => {})
        return res.status(400).json({ success: false, error: { message: familyCardValidation.error } })
      }
      familyCardLowRes = familyCardValidation.metadata?.lowResolution === true
    }

    // 2. Check if already verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true, kycAttempts: true, kycLockedUntil: true }
    })

    if (user?.isVerified) {
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      return res.status(400).json({ success: false, error: { message: 'KYC sudah disetujui' } })
    }

    // 2b. [A-4] Check if account is locked due to too many failed KYC attempts
    const now = new Date()
    if (user?.kycLockedUntil && user.kycLockedUntil > now) {
      const remainingMs = user.kycLockedUntil.getTime() - now.getTime()
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60))
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60))
      await fs.unlink(idCard.path).catch(() => {})
      if (familyCard) await fs.unlink(familyCard.path).catch(() => {})
      logger.warn(`KYC submit blocked for userId=${userId}: account locked for ${remainingHours}h`)
      return res.status(429).json({
        success: false,
        error: {
          code: 'KYC_LOCKED',
          message: remainingHours >= 1
            ? `Akun Anda dikunci sementara karena terlalu banyak percobaan KYC yang gagal. Coba lagi dalam ${remainingHours} jam.`
            : `Akun Anda dikunci sementara. Coba lagi dalam ${remainingMinutes} menit.`,
          lockedUntil: user.kycLockedUntil.toISOString()
        }
      })
    }

    // 2c. Reset attempts if lock has expired (grace period reset)
    if (user?.kycLockedUntil && user.kycLockedUntil <= now) {
      await prisma.user.update({
        where: { id: userId },
        data: { kycAttempts: 0, kycLockedUntil: null }
      })
      user.kycAttempts = 0
      user.kycLockedUntil = null
    }

    // 3. Process and Save
    try {
      const idCardResult = await WatermarkService.savePermanent(idCard.path, userId, 'ktp')
      const familyCardResult = familyCard 
        ? await WatermarkService.savePermanent(familyCard.path, userId, 'kk')
        : null

      // --- CLOUD STORAGE UPLOAD (S3/R2) ---
      let idPath = idCardResult.original
      let familyPath = familyCardResult?.original

      const isCloudEnabled = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'r2'

      if (isCloudEnabled) {
        try {
          const idKey = `kyc/${userId}/ktp_${Date.now()}.jpg`
          await StorageService.uploadFile(idCardResult.original, idKey, 'image/jpeg')
          idPath = idKey
          
          // Cleanup local
          await fs.unlink(idCardResult.original).catch(() => {})
          await fs.unlink(idCardResult.thumbnail).catch(() => {})

          if (familyCardResult) {
            const familyKey = `kyc/${userId}/kk_${Date.now()}.jpg`
            await StorageService.uploadFile(familyCardResult.original, familyKey, 'image/jpeg')
            familyPath = familyKey
            
            // Cleanup local
            await fs.unlink(familyCardResult.original).catch(() => {})
            await fs.unlink(familyCardResult.thumbnail).catch(() => {})
          }
        } catch (err) {
          logger.error(`Cloud Upload failed: ${err}`)
          return res.status(500).json({ success: false, error: { message: 'Gagal mengunggah ke penyimpanan awan (R2)' } })
        }
      }
      // --- CLOUD STORAGE END ---

      const updatedUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: userId },
          data: {
            bio: req.body.bio,
            idCardPath: idPath,
            familyCardPath: familyPath || null,
            kycSubmittedAt: new Date(),
            kycConsentGivenAt: new Date(),
            kycDataExpiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years
            isVerified: false,
            kycStatus: 'PENDING',
            // Sertakan flag resolusi rendah di kycNotes agar terlihat di panel admin
            kycNotes: [
              `SUBMITTED at ${new Date().toISOString()}`,
              idCardLowRes ? '[PERINGATAN: Resolusi KTP rendah (<640x480px)]' : null,
              familyCardLowRes ? '[PERINGATAN: Resolusi KK rendah (<640x480px)]' : null
            ].filter(Boolean).join(' | ')
          }
        })

        // Audit log
        // Hanya buat AuditLog jika user memiliki siteId yang valid (ada di DB)
        if (dbSiteId) {
          await tx.auditLog.create({
            data: {
              userId,
              siteId: dbSiteId,
              action: 'kyc.submit',
              entityType: 'user',
              entityId: userId,
              newValue: {
                hasIdCard: true,
                hasFamilyCard: !!familyCard,
                // Catat flag resolusi rendah untuk referensi admin
                idCardLowRes,
                familyCardLowRes
              }
            }
          })
        }

        return u
      })

      // 4. Notify Admins
      // Cari admin berdasarkan siteId user yang sebenarnya, atau semua superadmin
      const adminWhere: Prisma.UserWhereInput = dbSiteId
        ? { siteId: dbSiteId, role: { in: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'] } }
        : { role: { in: ['superadmin'] } } // Jika tidak ada siteId, notify semua superadmin

      const admins = await prisma.user.findMany({
        where: adminWhere,
        select: { id: true, siteId: true }
      })

      for (const admin of admins) {
        const notifSiteId = admin.siteId || dbSiteId
        if (!notifSiteId) continue // Skip jika tidak ada siteId valid
        await sendNotification({
          userId: admin.id,
          siteId: notifSiteId,
          type: 'kyc_submitted',
          title: '📝 Pengajuan KYC Baru',
          message: `User ${updatedUser.name} telah mengajukan verifikasi identitas.`,
          link: `/dashboard/admin/kyc/${userId}`
        })
      }

      res.status(200).json({ success: true, data: { message: 'KYC submitted successfully' } })
    } catch (error: unknown) {
      logger.error('KYC submission failed:', error)

      // [A-4] Increment failed attempts on processing error; lock after 3 failures
      try {
        const currentAttempts = (user?.kycAttempts ?? 0) + 1
        const shouldLock = currentAttempts >= 3
        await prisma.user.update({
          where: { id: userId },
          data: {
            kycAttempts: { increment: 1 },
            ...(shouldLock
              ? { kycLockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) } // Lock 24 hours
              : {})
          }
        })
        if (shouldLock) {
          logger.warn(`KYC account locked for userId=${userId} after ${currentAttempts} failed attempts`)
        }
      } catch (updateError) {
        logger.error('Failed to update kycAttempts:', updateError)
      }

      res.status(500).json({ success: false, error: { message: 'Gagal memproses pengajuan KYC' } })
    }
  })
)

// PATCH /:userId/reset-lock - Admin reset KYC lock (akibat terlalu banyak percobaan gagal)
kycRouter.patch('/:userId/reset-lock',
  ...withSite,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, kycAttempts: true, kycLockedUntil: true }
    })

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { kycAttempts: 0, kycLockedUntil: null }
    })

    logger.info(`[KYC] Lock reset for userId=${userId} by admin=${req.user!.userId}`)
    res.json({ success: true, data: { message: `KYC lock berhasil direset untuk ${user.name}` } })
  })
)

// PATCH /:userId/verify - Admin verify KYC (approve/reject)
kycRouter.patch('/:userId/verify',
  ...withSite,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { status, notes } = req.body // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Status harus approved atau rejected' } })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { siteId: true, kycNotes: true, name: true, role: true }
    })

    if (!targetUser) {
      return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    }

    // [C-003] Site access check for reviewer
    const reviewerRole = req.user!.role
    const reviewerSiteId = req.user!.siteId
    
    if (reviewerRole !== 'superadmin' && targetUser.siteId !== reviewerSiteId) {
      return res.status(403).json({ 
        success: false, 
        error: { message: 'Tidak memiliki izin mereview KYC site ini' } 
      })
    }

    await prisma.$transaction(async (tx) => {
      const isApproved = status === 'approved'
      
      await tx.user.update({
        where: { id: userId },
        data: {
          isVerified: isApproved,
          kycStatus: isApproved ? 'APPROVED' : 'REJECTED',
          kycNotes: `${status.toUpperCase()} at ${new Date().toISOString()}${notes ? ` - ${notes}` : ''}`,
          kycReviewedBy: req.user!.userId,
          kycReviewedAt: new Date(),
          // Promote to reporter if approved, unless they are already superadmin or wapimred
          role: (isApproved && !['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(targetUser.role)) ? 'reporter' : undefined
        }
      })

      // Audit log — hanya jika target user memiliki siteId yang valid
      if (targetUser.siteId) {
        await tx.auditLog.create({
          data: {
            userId: req.user!.userId,
            siteId: targetUser.siteId,
            action: `kyc.${status}`,
            entityType: 'user',
            entityId: userId,
            newValue: { status, notes }
          }
        })

        // Notify User
        await sendNotification({
          userId,
          siteId: targetUser.siteId,
          type: isApproved ? 'kyc_approved' : 'kyc_rejected',
          title: isApproved ? '✅ KYC Disetujui' : '❌ KYC Ditolak',
          message: isApproved 
            ? 'Selamat! Verifikasi identitas Anda telah disetujui. Anda sekarang dapat menerbitkan berita.'
            : `Verifikasi identitas Anda ditolak. Alasan: ${notes || 'Tidak memenuhi syarat'}.`,
          link: '/dashboard/settings'
        })
      }
    })

    res.json({ success: true, data: { message: `KYC ${status} berhasil` } })
  })
)

// GET /view/:userId/:type - Securely serve KYC documents
kycRouter.get('/view/:userId/:type',
  ...withSite,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, type } = req.params // type: 'idCard' | 'familyCard'
    
    if (type !== 'idCard' && type !== 'familyCard') {
      return res.status(400).json({ success: false, error: { message: 'Tipe dokumen tidak valid' } })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { siteId: true, idCardPath: true, familyCardPath: true }
    })

    if (!targetUser) {
      return res.status(404).json({ success: false, error: { message: 'User tidak ditemukan' } })
    }

    // Site access check for wapimred
    if (req.user!.role === 'wapimred' && targetUser.siteId !== req.site) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak untuk situs ini' } })
    }

    const filePath = type === 'idCard' ? targetUser.idCardPath : targetUser.familyCardPath

    if (!filePath) {
      return res.status(404).json({ success: false, error: { message: 'File tidak ditemukan' } })
    }

    // Log the view for audit trail
    await prisma.kYCViewLog.create({
      data: {
        userId,
        viewerId: req.user!.userId,
        siteId: targetUser.siteId || (req.site !== 'all' ? req.site : 'pusat') || 'pusat',
        fileType: type === 'idCard' ? 'ktp' : 'kk',
        ipAddress: anonymizeIP(req.ip),
        userAgent: req.headers['user-agent']
      }
    })

    const isCloudEnabled = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'r2'

    if (isCloudEnabled) {
      try {
        // Proxy the image through the API server instead of redirecting to a
        // presigned MinIO URL. This avoids ERR_SSL_PROTOCOL_ERROR caused by the
        // browser trying to access the internal HTTP endpoint (10.0.0.11:9000)
        // from an HTTPS page (mixed-content blocked).
        const stream = await StorageService.getFileStream(filePath)
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Cache-Control', 'private, max-age=300')
        return stream.pipe(res)
      } catch (err) {
        logger.error(`Failed to stream KYC file: ${err}`)
        return res.status(500).json({ success: false, error: { message: 'Gagal mengambil file dari penyimpanan awan' } })
      }
    }

    res.sendFile(filePath)
  })
)
