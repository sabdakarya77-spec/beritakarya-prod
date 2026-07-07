import { Router, Request, Response } from 'express'
import * as service from './article.service'
import {
  createArticleSchema,
  updateArticleSchema,
  articleQuerySchema,
  publicArticleQuerySchema,
  publishArticleSchema
} from './article.validator'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { anonymizeIP } from '@beritakarya/utils'
import { articleWriteLimiter, articleUpdateLimiter } from '../../lib/rateLimit'

export const articleRouter: Router = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

articleRouter.get('/slug/:slug', siteMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const article = await service.getPublishedArticleBySlug(req.params.slug, req.site!, {
    ipAddress: anonymizeIP(req.ip),
    userAgent: req.headers['user-agent'],
    referrer: req.headers['referer'] as string
  })
  res.json({ success: true, data: article })
}))

articleRouter.get('/public', siteMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const query = publicArticleQuerySchema.parse(req.query)
  const result = await service.getArticles(req.site!, { ...query, status: 'published' })
  res.json({ success: true, data: result })
}))

articleRouter.get('/scheduled/due', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getDueScheduledArticles(req.site!, req.user!)
  res.json({ success: true, data: items })
}))

articleRouter.get('/stats', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const stats = await service.getArticleStats(req.site!, req.user!)
  res.json({ success: true, data: stats })
}))

articleRouter.get('/', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const query = articleQuerySchema.parse(req.query)
  const result = await service.getArticles(req.site!, query, req.user!)
  res.json({ success: true, data: result })
}))

articleRouter.get('/:id', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const article = await service.getArticleById(req.params.id, req.site!, req.user!)
  res.json({ success: true, data: article })
}))

articleRouter.post('/', articleWriteLimiter, ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const input = createArticleSchema.parse(req.body) as Parameters<typeof service.createArticle>[0]
  const article = await service.createArticle(input, req.user!, req.site!)
  res.status(201).json({ success: true, data: article })
}))

articleRouter.put('/:id', articleUpdateLimiter, ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const input = updateArticleSchema.parse(req.body) as Parameters<typeof service.updateArticle>[2]
  const article = await service.updateArticle(req.params.id, req.site!, input, req.user!)
  res.json({ success: true, data: article })
}))

articleRouter.post('/:id/publish', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const { forcePublish } = publishArticleSchema.parse(req.body ?? {})
  const article = await service.publishArticle(
    req.params.id,
    req.site!,
    req.user!,
    { forcePublish }
  )
  res.json({ success: true, data: article })
}))

articleRouter.post('/:id/index-google', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const result = await service.indexGoogleArticle(req.params.id, req.site!)
  res.json(result)
}))

// Versioning Endpoints
articleRouter.get('/:id/versions', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const versions = await service.getArticleVersions(req.params.id)
  res.json({ success: true, data: versions })
}))

articleRouter.post('/:id/versions/save', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const version = await service.saveArticleVersion(req.params.id, req.user!.userId, req.site!)
  res.json({ success: true, data: version })
}))

articleRouter.post('/versions/:versionId/restore', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const updated = await service.restoreArticleVersion(req.params.versionId, req.site!, req.user!)
  res.json({ success: true, data: updated })
}))

articleRouter.delete('/:id', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  await service.deleteArticle(req.params.id, req.site!, req.user!)
  res.json({ success: true, message: 'Artikel berhasil dihapus' })
}))