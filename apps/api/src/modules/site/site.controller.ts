import { Router, Request, Response } from 'express'
import { AppError } from '../../utils/AppError'
import { siteService } from './site.service'
import { logger } from '../../lib/logger'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { publicLimiter } from '../../lib/rateLimit'
import { asyncHandler } from '../../utils/asyncHandler'

export const siteRouter: Router = Router()

siteRouter.get('/', publicLimiter, asyncHandler(getSites))
siteRouter.get('/settings', publicLimiter, asyncHandler(getSiteSettings))
siteRouter.get('/:id', asyncHandler(getSiteById))
siteRouter.patch('/settings',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(updateSiteSettings))
siteRouter.get('/wapimred-settings',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin', 'wapimred']),
  asyncHandler(getWapimredSettings))
siteRouter.patch('/wapimred-settings',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin']),
  asyncHandler(updateWapimredSettings))
siteRouter.post('/',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(createSite))
siteRouter.put('/:id',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(updateSite))
siteRouter.delete('/:id',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(deleteSite))
siteRouter.post('/:id/wapimred',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(assignWapimred))

/**
 * Site Routes - Express Router
 * All routes are prefixed with /api/v1/sites
 * All endpoints require superadmin role
 */

function getErrorStatus(error: unknown): number {
  if (error instanceof AppError) return error.statusCode
  if (error instanceof Error && 'statusCode' in error) return (error as Error & { statusCode: number }).statusCode
  return 500
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function getErrorCode(error: unknown, fallback: string): string {
  if (error instanceof AppError) return error.code
  if (error instanceof Error && 'code' in error) return (error as Error & { code: string }).code
  return fallback
}

/**
 * GET /api/v1/sites
 * Get all sites (superadmin only)
 * Query: ?includeStats=true to include user/article/category counts
 */
export async function getSites(req: Request, res: Response) {
  try {
    const { includeStats } = req.query
    const sites = await siteService.getAllSites(includeStats === 'true')
    res.json({ success: true, data: sites })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITES_FETCH_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * GET /api/v1/sites/settings
 * Get current site settings (siteId from query or header)
 */
export async function getSiteSettings(req: Request, res: Response) {
  try {
    const siteId = (req.query.site as string) || (req.headers['x-site-id'] as string)
    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SITE_ID', message: 'Parameter site required' }
      })
    }
    
    const settings = await siteService.getSiteSettings(siteId)
    res.json({ success: true, data: settings })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_SETTINGS_FETCH_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * PATCH /api/v1/sites/settings
 * Update current site settings (siteId from query or header)
 */
export async function updateSiteSettings(req: Request, res: Response) {
  try {
    const siteId = (req.query.site as string) || (req.headers['x-site-id'] as string)
    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SITE_ID', message: 'Parameter site required' }
      })
    }

    // Role check: Only superadmin or wapimred of the site can update settings
    const userRole = req.user?.role
    const userSiteId = req.user?.siteId

    if (userRole !== 'superadmin') {
      if (userRole !== 'wapimred' || userSiteId !== siteId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses untuk mengubah pengaturan situs ini' }
        })
      }
    }

    // [MULTISITE] Field-field ini hanya boleh diedit superadmin.
    // Wapimred boleh update identitas visual, kontak regional, dan topik
    // hangat, tapi tidak boleh mengutak-atik sosmed pusat, footer copyright,
    // Google Search API, atau halaman legal (compliance).
    const SUPERADMIN_ONLY_FIELDS = [
      'socialLinks',          // Saluran Media Sosial Resmi
      'footerText',           // Teks Footer Hak Cipta
      'googleIndexingConfig', // Google Search API
      'ga4PropertyId',        // Google Analytics 4
      'gscSiteUrl',           // Google Search Console
      'aboutUs',              // Halaman Legal
      'codeOfEthics',
      'editorial',
      'advertising',
      'privacyPolicy',
      'termsOfService',
      'mediaSiber',
    ]

    let body = req.body
    if (userRole !== 'superadmin') {
      // Wapimred: strip field superadmin-only (silent drop agar UX tetap mulus,
      // audit log akan otomatis mencatat hanya field yang benar-benar berubah)
      const stripped: string[] = []
      for (const field of SUPERADMIN_ONLY_FIELDS) {
        if (body[field] !== undefined) {
          delete body[field]
          stripped.push(field)
        }
      }
      if (stripped.length > 0) {
        // Catat di audit log agar ada jejak kalau wapimred coba-coba kirim field terlarang
        logger.warn(
          `[SECURITY] wapimred userId=${req.user?.userId} coba update field superadmin-only: ${stripped.join(', ')}`
        )
      }
    }

    const actorUserId = req.user!.userId
    const settings = await siteService.updateSiteSettings(siteId, body, actorUserId)
    res.json({ success: true, data: settings })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_SETTINGS_UPDATE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * GET /api/v1/sites/wapimred-settings
 * Get wapimred permission settings for current site
 */
export async function getWapimredSettings(req: Request, res: Response) {
  try {
    const siteId = (req.query.site as string) || (req.headers['x-site-id'] as string)
    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SITE_ID', message: 'Parameter site required' }
      })
    }

    const settings = await siteService.getWapimredSettings(siteId)
    res.json({ success: true, data: settings })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'WAPIMRED_SETTINGS_FETCH_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * PATCH /api/v1/sites/wapimred-settings
 * Update wapimred permission settings (superadmin-only)
 */
export async function updateWapimredSettings(req: Request, res: Response) {
  try {
    const siteId = (req.query.site as string) || (req.headers['x-site-id'] as string)
    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SITE_ID', message: 'Parameter site required' }
      })
    }

    const actorUserId = req.user!.userId
    const settings = await siteService.updateWapimredSettings(siteId, req.body, actorUserId)
    res.json({ success: true, data: settings })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'WAPIMRED_SETTINGS_UPDATE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * GET /api/v1/sites/:id
 * Get single site by ID (superadmin only)
 */
export async function getSiteById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const site = await siteService.getSiteById(id)
    res.json({ success: true, data: site })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_FETCH_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * POST /api/v1/sites
 * Create new site (superadmin only)
 * Optionally assign wapimred in the same request
 */
export async function createSite(req: Request, res: Response) {
  try {
    const { id, domain, name, wapimredId, logoUrl, contactEmail, phone, address, description } = req.body

    const site = await siteService.createSite({
      id,
      domain,
      name,
      wapimredId,
      logoUrl,
      contactEmail,
      phone,
      address,
      description
    })

    res.status(201).json({ success: true, data: site })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_CREATE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * PUT /api/v1/sites/:id
 * Update site (superadmin only)
 */
export async function updateSite(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { domain, name, logoUrl, contactEmail, phone, address, description, trendingTopics } = req.body
    const actorUserId = req.user!.userId

    const site = await siteService.updateSite(
      id,
      { domain, name, logoUrl, contactEmail, phone, address, description, trendingTopics },
      actorUserId
    )

    res.json({ success: true, data: site })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_UPDATE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * DELETE /api/v1/sites/:id
 * Delete site (superadmin only)
 * Prevents deletion if site has existing articles
 */
export async function deleteSite(req: Request, res: Response) {
  try {
    const { id } = req.params
    const actorUserId = req.user!.userId

    await siteService.deleteSite(id, actorUserId)

    res.json({ success: true, message: 'Site deleted' })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'SITE_DELETE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * POST /api/v1/sites/:id/wapimred
 * Assign wapimred to a site (superadmin only)
 */
export async function assignWapimred(req: Request, res: Response) {
  try {
    const { id } = req.params  // siteId
    const { wapimredId } = req.body
    const actorUserId = req.user!.userId

    const user = await siteService.assignWapimred(id, wapimredId, actorUserId)

    res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        siteId: user.siteId
      }
    })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'WAPIMRED_ASSIGN_FAILED', message: getErrorMessage(error) }
    })
  }
}