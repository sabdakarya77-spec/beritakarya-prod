import { Router, Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './analytics.repository'
import { getActiveReaderCount } from './analytics.service'
import { googleAnalyticsService } from '../../services/google-analytics.service'
import { googleSearchConsoleService } from '../../services/google-search-console.service'

export const analyticsRouter: Router = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

const getAuthorId = (req: Request) => {
  if (req.user?.role === 'reporter' || req.user?.role === 'kontributor') {
    return req.user.userId
  }
  return undefined
}

// ── Internal Analytics (PageView-based) ──────────────────────────────

analyticsRouter.get('/traffic', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 7
  const stats = await repo.getTrafficStats(req.site!, days, getAuthorId(req))
  res.json({ success: true, data: stats })
}))

analyticsRouter.get('/top-content', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5
  const content = await repo.getTopContent(req.site!, limit, getAuthorId(req))
  res.json({ success: true, data: content })
}))

analyticsRouter.get('/active-readers', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const count = await getActiveReaderCount(req.site!)
  res.json({ success: true, data: { count } })
}))

analyticsRouter.get('/engagement', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const stats = await repo.getEngagementStats(req.site!, getAuthorId(req))
  res.json({ success: true, data: stats })
}))

// ── Google Analytics (GA4) ───────────────────────────────────────────

analyticsRouter.get('/ga4/traffic', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 7
  const result = await googleAnalyticsService.getTrafficOverTime(req.site!, days)
  res.json(result)
}))

analyticsRouter.get('/ga4/realtime', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const result = await googleAnalyticsService.getRealtime(req.site!)
  res.json(result)
}))

analyticsRouter.get('/ga4/audience', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 7
  const result = await googleAnalyticsService.getAudience(req.site!, days)
  res.json(result)
}))

// ── Google Search Console ────────────────────────────────────────────

analyticsRouter.get('/gsc/performance', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 28
  const result = await googleSearchConsoleService.getPerformance(req.site!, days)
  res.json(result)
}))

analyticsRouter.get('/gsc/queries', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
  const result = await googleSearchConsoleService.getTopQueries(req.site!, limit)
  res.json(result)
}))

analyticsRouter.get('/gsc/pages', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
  const result = await googleSearchConsoleService.getTopPages(req.site!, limit)
  res.json(result)
}))
