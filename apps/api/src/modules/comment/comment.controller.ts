import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './comment.service'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Komentar tidak boleh kosong').max(5000, 'Komentar terlalu panjang'),
  parentId: z.string().uuid().optional()
})

export const commentRouter = Router()

commentRouter.get('/article/:articleId',
  siteMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const comments = await service.getArticleComments(req.params.articleId, req.site!)
    res.json({ success: true, data: comments })
  })
)

commentRouter.post('/article/:articleId',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { content, parentId } = createCommentSchema.parse(req.body)
    const comment = await service.addComment(
      req.params.articleId,
      req.site!,
      { content, parentId },
      req.user!
    )
    res.status(201).json({ success: true, data: comment })
  })
)

commentRouter.get('/',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site!
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { siteId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          article: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.comment.count({ where: { siteId } })
    ])

    res.json({ 
      success: true, 
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

commentRouter.get('/stats',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site!
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [pending, approvedToday, total] = await Promise.all([
      prisma.comment.count({ where: { siteId, status: 'pending' } }),
      prisma.comment.count({
        where: {
          siteId,
          status: 'approved',
          createdAt: { gte: todayStart }
        }
      }),
      prisma.comment.count({ where: { siteId } })
    ])

    res.json({
      success: true,
      data: { pending, approvedToday, total }
    })
  })
)

commentRouter.get('/moderation',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.site!
    const { status, search } = req.query
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const skip = (page - 1) * limit
    
    const VALID_STATUSES = ['pending', 'approved', 'spam']
    const where: Prisma.CommentWhereInput = { siteId }
    if (status && status !== 'all') {
      if (VALID_STATUSES.includes(status as string)) {
        where.status = status as string
      } else {
        where.status = 'pending' // Fallback to pending if invalid
      }
    } else if (!status) {
      where.status = 'pending'
    }
    
    if (search) {
      where.OR = [
        { content: { contains: search as string, mode: 'insensitive' } },
        { authorName: { contains: search as string, mode: 'insensitive' } },
        { authorEmail: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } }
      ]
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          article: { select: { id: true, title: true, slug: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.comment.count({ where })
    ])
    
    res.json({ 
      success: true, 
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

commentRouter.patch('/:id/approve',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  requireRole(['wapimred', 'superadmin', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const siteId = req.site!

    const updated = await prisma.comment.updateMany({
      where: { id, siteId },
      data: { status: 'approved' }
    })

    if (updated.count === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } })
    }
    res.json({ success: true, message: 'Comment approved' })
  })
)

commentRouter.patch('/:id/reject',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  requireRole(['wapimred', 'superadmin', 'kaperwil', 'korwil', 'kabiro']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const siteId = req.site!
    
    const updated = await prisma.comment.updateMany({
      where: { id, siteId },
      data: { status: 'spam' }
    })
    
    if (updated.count === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comment not found' } })
    }
    res.json({ success: true, message: 'Comment rejected' })
  })
)

commentRouter.get('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        article: { select: { id: true, title: true, slug: true } }
      }
    })
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      })
    }
    res.json({ success: true, data: comment })
  })
)

commentRouter.post('/',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { articleId, content } = req.body
    const siteId = req.site!

    // Verify article belongs to same site
    const article = await prisma.article.findFirst({
      where: { id: articleId, siteId }
    })
    if (!article) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ARTICLE', message: 'Article not found or does not belong to this site' }
      })
    }

    const comment = await prisma.comment.create({
      data: {
        siteId,
        articleId,
        authorId: req.user!.userId,
        content
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    })
    res.status(201).json({ success: true, data: comment })
  })
)

commentRouter.put('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { content } = req.body
    const siteId = req.site

    // Check ownership
    const existing = await prisma.comment.findFirst({
      where: { id, siteId }
    })
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      })
    }
    if (existing.authorId !== req.user?.userId && req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not your comment' }
      })
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, name: true } }
      }
    })
    res.json({ success: true, data: comment })
  })
)

commentRouter.delete('/:id',
  requireAuth,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const siteId = req.site

    // Check ownership
    const existing = await prisma.comment.findFirst({
      where: { id, siteId }
    })
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' }
      })
    }
    if (existing.authorId !== req.user?.userId && req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not your comment' }
      })
    }

    await prisma.comment.delete({ where: { id } })
    res.json({ success: true, message: 'Comment deleted' })
  })
)
