import { Router, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { redis } from '../../lib/redis'
import { emailService } from '../../services/email.service'
import { logger } from '../../lib/logger'
import { env } from '../../lib/env'
import { StorageService } from '../../services/storage.service'
import { AppError } from '../../utils/AppError'

export const userRouter = Router()

userRouter.get('/public/:id',
  siteMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site
    const { id } = req.params

    const profile = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { siteId },
          { siteId: null }
        ],
        articles: {
          some: {
            siteId,
            status: 'published',
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        bio: true,
        createdAt: true
      }
    })

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profil penulis tidak ditemukan' }
      })
    }

    const [publishedCount, totalViews, recentArticles] = await Promise.all([
      prisma.article.count({
        where: {
          authorId: id,
          siteId,
          status: 'published',
          deletedAt: null
        }
      }),
      prisma.article.aggregate({
        where: {
          authorId: id,
          siteId,
          status: 'published',
          deletedAt: null
        },
        _sum: { viewCount: true }
      }),
      prisma.article.findMany({
        where: {
          authorId: id,
          siteId,
          status: 'published',
          deletedAt: null
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          siteId: true,
          authorId: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          isBreaking: true,
          isExclusive: true,
          isFeatured: true,
          featuredImage: true,
          featuredImageBlur: true,
          featuredImageColor: true,
          viewCount: true,
          wordCount: true,
          readingTimeMin: true,
          blocks: true,
          tags: true,
          metaTitle: true,
          metaDescription: true,
          categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          author: { select: { id: true, name: true, avatarUrl: true, role: true } }
        },
        orderBy: { publishedAt: 'desc' },
        take: 6
      })
    ])

    res.json({
      success: true,
      data: {
        profile,
        stats: {
          publishedCount,
          totalViews: totalViews._sum.viewCount || 0
        },
        recentArticles
      }
    })
  })
)

// GET /api/v1/users/authors - Get all authors with published articles for public listing
userRouter.get('/authors',
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = (req.query.site as string) || req.site!
    const limit = parseInt(req.query.limit as string) || 50

    // Get all users who have published articles on this site
    const authors = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { siteId },
          { siteId: null }
        ],
        articles: {
          some: {
            siteId,
            status: 'published',
            deletedAt: null
          }
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { articles: { where: { siteId, status: 'published', deletedAt: null } } }
        }
      },
      take: limit
    })

    // Single aggregation query for all authors
    const authorIds = authors.map(a => a.id)
    const aggregated = await prisma.article.groupBy({
      by: ['authorId'],
      where: { authorId: { in: authorIds }, siteId, status: 'published', deletedAt: null },
      _sum: { viewCount: true }
    })
    const viewsMap = new Map(aggregated.map(a => [a.authorId, a._sum.viewCount || 0]))

    const authorsWithStats = authors.map(author => ({
      id: author.id,
      name: author.name,
      role: author.role,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
      createdAt: author.createdAt,
      publishedCount: author._count.articles,
      totalViews: viewsMap.get(author.id) || 0
    }))

    res.json({
      success: true,
      data: authorsWithStats,
      meta: {
        total: authorsWithStats.length,
        limit
      }
    })
  })
)

userRouter.get('/',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const skip = (page - 1) * limit

    const fetchAll = req.query.site === 'all' && req.user!.role === 'superadmin'
    const whereClause = fetchAll ? { deletedAt: null } : { siteId, deletedAt: null }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          siteId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Batch Redis online status check (mget instead of N+1 get)
    let onlineSet = new Set<string>()
    if (process.env.REDIS_HOST && users.length > 0) {
      try {
        const keys = users.map(u => `user:online:${u.id}`)
        const values = await redis!.mget(...keys)
        users.forEach((u, i) => {
          if (values[i]) onlineSet.add(u.id)
        })
      } catch {
        // ignore Redis errors
      }
    }

    const usersWithOnlineStatus = users.map(u => ({
      ...u,
      isOnline: onlineSet.has(u.id)
    }))

    res.json({
      success: true,
      data: usersWithOnlineStatus,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

userRouter.get('/stats',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site
    const users = await prisma.user.findMany({
      where: {
        siteId,
        deletedAt: null,
        role: { in: ['reporter', 'kontributor', 'wapimred', 'superadmin'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { articles: { where: { status: 'published' } } }
        }
      }
    })

    if (users.length === 0) {
      return res.json({ success: true, data: [] })
    }

    // Single aggregation query instead of N+1
    const userIds = users.map(u => u.id)
    const aggregated = await prisma.article.groupBy({
      by: ['authorId'],
      where: { authorId: { in: userIds }, siteId, status: 'published' },
      _sum: { viewCount: true },
      _avg: { wordCount: true }
    })
    const statsMap = new Map(aggregated.map(a => [a.authorId, a]))

    // Batch Redis online status check (mget instead of N+1 get)
    let onlineSet = new Set<string>()
    if (process.env.REDIS_HOST) {
      try {
        const keys = userIds.map(id => `user:online:${id}`)
        const values = await redis!.mget(...keys)
        userIds.forEach((id, i) => {
          if (values[i]) onlineSet.add(id)
        })
      } catch {
        // ignore Redis errors
      }
    }

    const data = users.map(user => {
      const agg = statsMap.get(user.id)
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnline: onlineSet.has(user.id),
        publishedCount: user._count.articles,
        totalViews: agg?._sum?.viewCount || 0,
        avgWords: Math.round(agg?._avg?.wordCount || 0),
        createdAt: user.createdAt
      }
    })

    res.json({ success: true, data })
  })
)

// GET /api/v1/users/profile - Get current user's profile
userRouter.get('/profile',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        bio: true,
        siteId: true,
        isVerified: true,
        createdAt: true
      }
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Profil tidak ditemukan' }
      })
    }
    res.json({ success: true, data: user })
  })
)

// PUT /api/v1/users/profile - Update current user's profile
userRouter.put('/profile',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    const { name, bio } = req.body

    const updateData: Prisma.UserUncheckedUpdateInput = {}

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (bio !== undefined) {
      updateData.bio = bio ? bio.trim() : null
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Tidak ada data yang diupdate' }
      })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        bio: true,
        isVerified: true,
        updatedAt: true
      }
    })

    res.json({ success: true, data: user })
  })
)

// ─── Avatar Upload ──────────────────────────────────────────────────────────

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError('Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP', 400, 'INVALID_FILE_TYPE'))
    }
  },
})

async function loadSharp() {
  try {
    const mod = await import('sharp')
    return mod.default
  } catch {
    throw new AppError('Image processing tidak tersedia', 500, 'SHARP_UNAVAILABLE')
  }
}

// POST /api/v1/users/avatar - Upload avatar
userRouter.post('/avatar',
  requireAuth,
  avatarUpload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    const file = req.file

    if (!file) {
      throw new AppError('File tidak ditemukan', 400, 'FILE_REQUIRED')
    }

    const sharp = await loadSharp()

    // Resize to 256x256, crop to square, convert to WebP
    const buffer = await sharp(file.buffer)
      .resize(256, 256, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer()

    const key = `avatars/${userId}.webp`

    // Upload to public media bucket
    await StorageService.uploadBuffer(buffer, key, 'image/webp', StorageService.mediaBucket, { isPublic: true })

    const avatarUrl = StorageService.getPublicUrl(StorageService.mediaBucket, key)

    // Update user record
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        bio: true,
        isVerified: true,
        updatedAt: true
      }
    })

    logger.info(`[User] Avatar updated for user ${userId}`)
    res.json({ success: true, data: user })
  })
)

userRouter.get('/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const siteId = req.site
    const user = await prisma.user.findFirst({
      where: { id, siteId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        siteId: true,
        isVerified: true,
        createdAt: true
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

userRouter.put('/:id/role',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { role, siteId } = req.body

    const validRoles = ['reader', 'reporter', 'kontributor', 'wapimred', 'superadmin', 'advertiser']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid role provided' }
      })
    }

    if (req.user!.role !== 'superadmin' && role === 'superadmin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only superadmin can grant superadmin role' }
      })
    }
    const currentRequestSiteId = req.site

    // Verify user exists
    const userQuery: Prisma.UserWhereInput = { id, deletedAt: null }
    if (req.user!.role !== 'superadmin') {
      userQuery.siteId = currentRequestSiteId
    }

    const user = await prisma.user.findFirst({
      where: userQuery
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found or you do not have permission to manage this user' }
      })
    }

    // Get old fields for audit log
    const oldRole = user.role
    const oldSiteId = user.siteId

    // Compile update fields
    const updateData: Prisma.UserUncheckedUpdateInput = { role }

    // Only superadmin can assign/change branches (siteId)
    if (req.user!.role === 'superadmin') {
      if (siteId === '' || siteId === null || siteId === undefined) {
        updateData.siteId = null
      } else {
        // Validate that siteId exists in database
        const siteExists = await prisma.site.findUnique({
          where: { id: siteId }
        })
        if (!siteExists) {
          return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'Cabang yang dipilih tidak valid' }
          })
        }
        updateData.siteId = siteId
      }
    }

    // Check if role is being upgraded from reader to a content role
    const wasReader = oldRole === 'reader'
    const isNowContentRole = !['reader', 'advertiser'].includes(role)
    const roleUpgraded = wasReader && isNowContentRole

    // If upgrading from reader → reset email verification & require re-verify
    if (roleUpgraded) {
      updateData.emailVerifiedAt = null
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        siteId: true,
        emailVerifiedAt: true
      }
    })

    // Audit log for role/site change
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        siteId: currentRequestSiteId || 'pusat',
        action: 'user.role_change',
        entityType: 'user',
        entityId: id,
        oldValue: { role: oldRole, siteId: oldSiteId },
        newValue: { role: role, siteId: updateData.siteId }
      }
    })

    // Send email notification to user about role/site change
    try {
      await emailService.sendRoleChangeNotification(
        updated.email,
        updated.name,
        oldRole,
        updated.role,
        'Superadmin',
        updated.siteId
      )
    } catch (emailErr) {
      logger.error('Gagal mengirim email notifikasi perubahan peran:', emailErr)
    }

    // If upgraded from reader → send verification email so user can verify before login
    if (roleUpgraded) {
      try {
        const secret = env.EMAIL_VERIFICATION_SECRET || env.JWT_SECRET
        const token = jwt.sign({ userId: updated.id, purpose: 'email-verify' }, secret, { expiresIn: '24h' })
        const frontendUrl = process.env.FRONTEND_URL || 'https://beritakarya.co'
        const verifyLink = `${frontendUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(updated.email)}`
        await emailService.sendVerificationEmail(updated.email, updated.name, verifyLink)
        logger.info(`Verification email sent to ${updated.email} after role upgrade: ${oldRole} → ${role}`)
      } catch (emailErr) {
        logger.error('Gagal mengirim email verifikasi setelah perubahan peran:', emailErr)
      }
    }

    res.json({ success: true, data: updated })
  })
)

userRouter.delete('/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const siteId = req.site

    if (id === req.user!.userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Anda tidak dapat menghapus akun Anda sendiri' }
      })
    }

    const user = await prisma.user.findFirst({
      where: { id, siteId, deletedAt: null }
    })
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' }
      })
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        siteId: req.site!,
        action: 'user.delete',
        entityType: 'user',
        entityId: id,
        oldValue: { name: user.name, email: user.email, role: user.role },
        newValue: { deletedAt: new Date() }
      }
    })

    res.json({ success: true, message: 'User berhasil dihapus' })
  })
)

/**
 * POST /api/v1/users/heartbeat
 * Update user's online status in Redis
 */
userRouter.post('/heartbeat',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId
    // Set online status in Redis with 60s expiration
    // This supports a 30s polling interval from the frontend
    if (process.env.REDIS_HOST) {
      try {
        await redis!.set(`user:online:${userId}`, '1', 'EX', 60)
      } catch (_err) {
        // ignore
      }
    }
    
    res.json({ success: true })
  })
)
