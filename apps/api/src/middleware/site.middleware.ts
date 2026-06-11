import { Request, Response, NextFunction } from 'express'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - workspace package import issues
import { KNOWN_SITE_IDS } from '@beritakarya/config'
import { prisma } from '../db/client'

import { logger } from '../lib/logger'
// Import type augmentation to recognize `site` property on Request
import '../types/express'

// In-memory cache for valid site IDs to avoid DB hits on every request
const validSiteCache = new Set<string>(KNOWN_SITE_IDS)
let lastCacheUpdate = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function refreshCache() {
  try {
    const sites = await prisma.site.findMany({ select: { id: true } })
    sites.forEach((s: any) => validSiteCache.add(s.id))
    lastCacheUpdate = Date.now()
  } catch (e) {
    logger.error('Failed to refresh site cache', e)
  }
}

export async function siteMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const siteId =
    (req.query.site as string) ||
    (req.headers['x-site-id'] as string)

  if (!siteId) {
    return res.status(400).json({
      success: false,
      error: { code: 'SITE_REQUIRED', message: 'Parameter site diperlukan' }
    })
  }

  // Refresh cache if expired or siteId not found
  if (Date.now() - lastCacheUpdate > CACHE_TTL || !validSiteCache.has(siteId)) {
    await refreshCache()
  }

  if (!validSiteCache.has(siteId) && siteId !== 'pusat' && siteId !== 'all') {
    return res.status(400).json({
      success: false,
      error: { code: 'SITE_UNKNOWN', message: `Site "${siteId}" tidak dikenal` }
    })
  }

  req.site = siteId
  next()
}

export function requireSiteAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) return next()

  if (
    ['reporter', 'kontributor', 'wapimred'].includes(req.user.role) &&
    req.user.siteId !== req.site
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'SITE_FORBIDDEN',
        message: 'Anda hanya bisa mengakses site Anda sendiri'
      }
    })
  }
  next()
}