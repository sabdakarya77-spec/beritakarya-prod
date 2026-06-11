import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function requireSiteAccess(resourceSiteId: string | ((req: Request) => string)) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Belum login' }
      })
    }

    // Superadmin atau user global tanpa siteId bisa akses semua site
    if (req.user.role === 'superadmin' || !req.user.siteId) return next()

    // Get target site ID from param, query, or body
    const targetSiteId = typeof resourceSiteId === 'function' 
      ? resourceSiteId(req)
      : resourceSiteId

    // Wapimred hanya bisa akses site mereka sendiri
    if (req.user.role === 'wapimred') {
      if (req.user.siteId !== targetSiteId) {
        logger.warn(`Access denied: Wapimred ${req.user.userId} (site:${req.user.siteId}) tried to access site ${targetSiteId}`)
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Akses ditolak: tidak memiliki izin untuk situs ini' }
        })
      }
    }

    // Reporter, Kontributor, Advertiser & Reader tidak punya akses admin
    if (['reporter', 'kontributor', 'reader', 'advertiser'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Role tidak memiliki akses admin' }
      })
    }

    next()
  }
}