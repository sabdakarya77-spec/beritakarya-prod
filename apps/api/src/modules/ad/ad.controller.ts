import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { adTrackingLimiter } from '../../lib/rateLimit'
import { isDuplicateImpression } from './ad.service'
import * as repo from './ad.repository'

export const adRouter = Router()

// Public endpoint for tracking views/clicks — with rate limiting & dedup
adRouter.post('/track/:id',
  adTrackingLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { action } = req.query // 'impression' | 'click'
    const ip = req.ip || req.socket.remoteAddress || 'unknown'

    try {
      const ad = await repo.findAdById(id)
      if (!ad) return res.json({ success: true })

      if (action === 'impression') {
        const isDup = await isDuplicateImpression(id, ip)
        if (!isDup) {
          await repo.incrementAdMetric(id, 'impressions')
          await repo.createAdEventLog({ adId: id, siteId: ad.siteId, action: 'impression' })
        }
      } else if (action === 'click') {
        await repo.incrementAdMetric(id, 'clicks')
        await repo.createAdEventLog({ adId: id, siteId: ad.siteId, action: 'click' })
      }
    } catch (_e) {
      // Ignore if ad not found
    }

    res.json({ success: true })
  })
)

// Public endpoint for fetching active advertisements for a specific site
adRouter.get('/public',
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.query.site as string
    if (!siteId) {
      return res.status(400).json({ success: false, message: 'site query parameter is required' })
    }
    const ads = await repo.findActiveAdsBySite(siteId)
    res.json({ success: true, data: ads })
  })
)

// Public endpoint for fetching fallback ads (e.g., static examples for empty slots)
adRouter.get('/fallback',
  asyncHandler(async (req: Request, res: Response) => {
    const slot = req.query.slot as string || 'HOME_TOP'
    // Minimal static fallback data – matches the shape used by the front‑end fallback UI.
    const fallbackAds = [
      {
        id: 'fallback-1',
        slot,
        mediaType: 'image',
        mediaUrl: '/fallbacks/home-top.svg',
        headline: 'Ruang Iklan Premium',
        subheadline: 'Jangkau audiens luas dengan banner berkualitas tinggi di BeritaKarya',
      }
    ]
    res.json({ success: true, data: fallbackAds })
  })
)

// Admin: list ads
adRouter.get('/',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await repo.findAdsBySite(req.site!, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    })
    res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } })
  })
)

// Admin: create ad
adRouter.post('/',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { slot, imageUrl, linkUrl, isActive } = req.body

    if (!slot || !imageUrl) {
      return res.status(400).json({ success: false, message: 'slot dan imageUrl wajib diisi' })
    }

    const nextOrder = await repo.getNextOrder(req.site!, slot)

    const ad = await repo.createAd({
      siteId: req.site!,
      slot,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      isActive: isActive ?? true,
      order: nextOrder,
    })
    res.status(201).json({ success: true, data: ad })
  })
)

// Admin: update ad
adRouter.patch('/:id',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { slot, imageUrl, linkUrl, isActive, order } = req.body

    const ad = await repo.updateAd(id, {
      slot,
      imageUrl: imageUrl || undefined,
      linkUrl: linkUrl || undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      order: order !== undefined ? order : undefined,
    })
    res.json({ success: true, data: ad })
  })
)

// Admin: delete ad
adRouter.delete('/:id',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await repo.deleteAd(id)
    res.json({ success: true })
  })
)

// Admin: reorder ads in carousel
adRouter.patch('/reorder',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items wajib berupa array' })
    }
    await repo.reorderAds(items)
    res.json({ success: true })
  })
)