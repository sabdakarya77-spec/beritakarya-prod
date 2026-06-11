import { Router } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { redis } from '../../lib/redis'
import { emailService } from '../../services/email.service'
import { logger } from '../../lib/logger'

export const userRouter = Router() as any

userRouter.get('/public/:id',
  siteMiddleware,
  asyncHandler(async (req: any, res: any) => {
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
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, role: true } }
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
  asyncHandler(async (req: any, res: any) => {
    const siteId = req.query.site || req.site
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
        createdAt: true,
        articles: {
          where: {
            siteId,
            status: 'published',
            deletedAt: null
          },
          select: {
            viewCount: true
          }
        }
      },
      take: limit
    })

    // Transform data with article stats
    const authorsWithStats = authors.map(author => {
      const publishedCount = author.articles.length
      const totalViews = author.articles.reduce((acc, art) => acc + (art.viewCount || 0), 0)
      
      return {
        id: author.id,
        name: author.name,
        role: author.role,
        bio: author.bio,
        createdAt: author.createdAt,
        publishedCount,
        totalViews
      }
    })

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
  asyncHandler(async (req: any, res: any) => {
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

    // Fetch online status from Redis for each user
    const usersWithOnlineStatus = await Promise.all(users.map(async (u) => {
      let isOnline = false
      if (process.env.REDIS_HOST) {
        try {
          const onlineVal = await redis.get(`user:online:${u.id}`)
          isOnline = !!onlineVal
        } catch (err) {
          // ignore
        }
      }
      return { ...u, isOnline }
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
  asyncHandler(async (req: any, res: any) => {
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
        articles: {
          where: { status: 'published' },
          select: { viewCount: true, wordCount: true }
        }
      }
    })

    const stats = users.map(user => {
      const publishedCount = user.articles.length
      const totalViews = user.articles.reduce((acc, art) => acc + art.viewCount, 0)
      const validWordCounts = user.articles.filter(a => a.wordCount).map(a => a.wordCount as number)
      const avgWords = validWordCounts.length > 0 
        ? Math.round(validWordCounts.reduce((a, b) => a + b, 0) / validWordCounts.length) 
        : 0

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnline: false, // Placeholder, will be updated below
        publishedCount,
        totalViews,
        avgWords,
        createdAt: user.createdAt
      }
    })

    // Fetch real online status from Redis
    const statsWithOnlineStatus = await Promise.all(stats.map(async (s) => {
      let isOnline = false
      if (process.env.REDIS_HOST) {
        try {
          const onlineVal = await redis.get(`user:online:${s.id}`)
          isOnline = !!onlineVal
        } catch (err) {
          // ignore
        }
      }
      return { ...s, isOnline }
    }))

    res.json({ success: true, data: statsWithOnlineStatus })
  })
)

// GET /api/v1/users/profile - Get current user's profile
userRouter.get('/profile',
  requireAuth,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
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
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId
    const { name, bio } = req.body

    const updateData: any = {}
    
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
        role: true,
        bio: true,
        isVerified: true,
        updatedAt: true
      }
    })

    res.json({ success: true, data: user })
  })
)

userRouter.get('/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: any, res: any) => {
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
  asyncHandler(async (req: any, res: any) => {
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
    const userQuery: any = { id, deletedAt: null }
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
    const updateData: any = { role }

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

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        siteId: true
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
        req.user!.name || 'Superadmin',
        updated.siteId
      )
    } catch (emailErr) {
      logger.error('Gagal mengirim email notifikasi perubahan peran:', emailErr)
    }

    res.json({ success: true, data: updated })
  })
)

userRouter.delete('/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  requireRole(['superadmin']),
  asyncHandler(async (req: any, res: any) => {
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
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId
    // Set online status in Redis with 60s expiration
    // This supports a 30s polling interval from the frontend
    if (process.env.REDIS_HOST) {
      try {
        await redis.set(`user:online:${userId}`, '1', 'EX', 60)
      } catch (err) {
        // ignore
      }
    }
    
    res.json({ success: true })
  })
)
