import { Router, Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './analytics.repository'
import { getActiveReaderCount } from './analytics.service'

export const analyticsRouter: Router = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

const getAuthorId = (req: any) => {
  if (req.user?.role === 'reporter' || req.user?.role === 'kontributor') {
    return req.user.userId
  }
  return undefined
}

analyticsRouter.get('/traffic', ...withSite, asyncHandler(async (req: any, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 7
  const stats = await repo.getTrafficStats(req.site!, days, getAuthorId(req))
  res.json({ success: true, data: stats })
}))

analyticsRouter.get('/top-content', ...withSite, asyncHandler(async (req: any, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5
  const content = await repo.getTopContent(req.site!, limit, getAuthorId(req))
  res.json({ success: true, data: content })
}))

analyticsRouter.get('/active-readers', ...withSite, asyncHandler(async (req: any, res: Response) => {
  const count = await getActiveReaderCount(req.site!)
  res.json({ success: true, data: { count } })
}))

analyticsRouter.get('/engagement', ...withSite, asyncHandler(async (req: any, res: Response) => {
  const stats = await repo.getEngagementStats(req.site!, getAuthorId(req))
  res.json({ success: true, data: stats })
}))
