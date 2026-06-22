import { Router, Request, Response } from 'express'
import { categoryService } from './category.service'
import { AppError } from '../../utils/AppError'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { publicLimiter } from '../../lib/rateLimit'
import { asyncHandler } from '../../utils/asyncHandler'

export const categoryRouter: Router = Router()

categoryRouter.get('/tree', publicLimiter, siteMiddleware, asyncHandler(getCategoryTree))
categoryRouter.get('/', publicLimiter, siteMiddleware, asyncHandler(getCategories))
categoryRouter.post('/seed-global',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(seedGlobalCategories))
categoryRouter.post('/sync-from-template',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(syncFromTemplate))
categoryRouter.post('/migrate-to-local',
  requireAuth, requireRole(['superadmin']),
  asyncHandler(migrateToLocal))
categoryRouter.post('/',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin']),
  asyncHandler(createCategory))
categoryRouter.put('/:id',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin']),
  asyncHandler(updateCategory))
categoryRouter.delete('/:id',
  requireAuth, siteMiddleware, requireSiteAccess,
  requireRole(['superadmin']),
  asyncHandler(deleteCategory))

/**
 * Category Routes - Express Router
 * All routes are prefixed with /api/v1/categories
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

/**
 * GET /api/v1/categories
 * Fetches categories based on user role and query parameter:
 * - Regular users/wapimred: site-specific + global categories
 * - Superadmin with ?view=all: all categories across sites
 * - Superadmin with ?view=global: only global categories
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const { view } = req.query
    const user = req.user
    const siteId = req.site || (req.query.site as string) || (req.headers['x-site-id'] as string)

    // Superadmin-only routes
    if (view === 'global' || view === 'all') {
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
        })
      }
    }

    let categories

    if (view === 'global') {
      // Superadmin: get only global categories
      categories = await categoryService.getGlobalCategories()
    } else if (view === 'all') {
      // Superadmin: get all categories (site-specific + global)
      categories = await categoryService.getAllCategories()
    } else {
      // Regular: site-specific + global (for the current site)
      if (!siteId) {
        return res.status(400).json({
          success: false,
          error: { code: 'SITE_REQUIRED', message: 'Site parameter required' }
        })
      }
      categories = await categoryService.getSiteCategories(siteId)
    }

    res.json({ success: true, data: categories })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_FETCH_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * GET /api/v1/categories/tree
 * Fetch categories in tree hierarchy structure
 * - Regular users: site-specific + global categories (tree format)
 * - Superadmin with ?view=all: all categories across sites (tree format)
 * - Superadmin with ?view=global: only global categories (tree format)
 * - Superadmin with ?view=local: only local categories (tree format)
 */
export async function getCategoryTree(req: Request, res: Response) {
  try {
    const { view } = req.query
    const user = req.user
    const siteId = req.site || (req.query.site as string) || (req.headers['x-site-id'] as string)

    // Superadmin-only routes
    if (view === 'global' || view === 'all') {
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
        })
      }
    }

    let categories

    if (view === 'global') {
      // Superadmin: get only global categories (tree format)
      const globalCats = await categoryService.getGlobalCategories()
      categories = categoryService.buildCategoryTree(globalCats)
    } else if (view === 'all') {
      // Superadmin: get all categories (site-specific + global) (tree format)
      const allCats = await categoryService.getAllCategories()
      categories = categoryService.buildCategoryTree(allCats)
    } else if (view === 'local') {
      // Superadmin/Regular: get only local categories (tree format)
      if (!siteId) {
        return res.status(400).json({
          success: false,
          error: { code: 'SITE_REQUIRED', message: 'Site parameter required' }
        })
      }
      categories = await categoryService.getLocalCategoryTree(siteId)
    } else {
      // Regular: site-specific + global (for the current site)
      if (!siteId) {
        return res.status(400).json({
          success: false,
          error: { code: 'SITE_REQUIRED', message: 'Site parameter required' }
        })
      }
      categories = await categoryService.getCategoryTree(siteId)
    }

    res.json({ success: true, data: categories })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_TREE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * POST /api/v1/categories
 * Create a new category (site-specific or global)
 * Only superadmin can create global categories (siteId=null)
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, slug, siteId, description, parentId, order, color } = req.body
    const user = req.user
    const actorUserId = user!.userId

    // Validation: non-superadmin cannot create global categories
    if (siteId === null || siteId === undefined) {
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only superadmin can create global categories' }
        })
      }
    }

    // Non-superadmin must have siteId (cannot create global)
    if (siteId === undefined && user?.role !== 'superadmin') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Site ID required for non-superadmin' }
      })
    }

    const category = await categoryService.createCategory(
      { 
        name, 
        slug, 
        siteId, 
        description, 
        parentId: parentId || null, 
        order: order !== undefined ? Number(order) : undefined, 
        color: color || null 
      },
      actorUserId
    )

    res.status(201).json({ success: true, data: category })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_CREATE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * PUT /api/v1/categories/:id
 * Update category (name, description, siteId)
 * Note: Global categories cannot be changed to site-specific
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description, siteId, parentId, order, color } = req.body
    const actorUserId = req.user!.userId

    const category = await categoryService.updateCategory(
      id,
      { 
        name, 
        description, 
        siteId, 
        parentId: parentId !== undefined ? parentId : undefined,
        order: order !== undefined ? Number(order) : undefined,
        color: color !== undefined ? color : undefined
      },
      actorUserId
    )

    res.json({ success: true, data: category })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_UPDATE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * POST /api/v1/categories/seed-global
 * Create global master categories (superadmin only)
 */
export async function seedGlobalCategories(req: Request, res: Response) {
  try {
    const { sourceSiteId } = req.body || {}
    const result = await categoryService.seedGlobalCategories(
      typeof sourceSiteId === 'string' && sourceSiteId ? sourceSiteId : 'pusat'
    )
    res.json({ success: true, data: result })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'GLOBAL_CATEGORY_SEED_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * DELETE /api/v1/categories/:id
 * Delete a category (global categories cannot be deleted)
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params
    const actorUserId = req.user!.userId

    await categoryService.deleteCategory(id, actorUserId)

    res.json({ success: true, message: 'Category deleted' })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_DELETE_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * POST /api/v1/categories/sync-from-template
 * Force-sync global categories from CATEGORY_TREE_CONFIG template (superadmin only).
 * Unlike seed-global, this runs even when categories already exist —
 * it updates names/orders and creates any missing categories.
 *
 * MASALAH 3 FIX: Memastikan database selalu sinkron dengan template config.
 */
export async function syncFromTemplate(req: Request, res: Response) {
  try {
    const result = await categoryService.syncFromTemplate()
    res.json({ success: true, data: result })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_SYNC_FAILED', message: getErrorMessage(error) }
    })
  }
}

/**
 * POST /api/v1/categories/migrate-to-local
 * Phase 0: Migrate global categories to local for all sites (or specific site).
 * Copies full global tree to local and re-maps ArticleCategory references.
 * Superadmin only. One-time operation.
 */
export async function migrateToLocal(req: Request, res: Response) {
  try {
    const { siteId } = req.body || {}

    const results = await categoryService.migrateAllSites(
      typeof siteId === 'string' && siteId ? siteId : undefined
    )

    const totalCategories = results.reduce((sum, r) => sum + r.categoriesCreated, 0)
    const totalArticles = results.reduce((sum, r) => sum + r.articlesRemapped, 0)
    const errors = results.filter(r => r.error)

    res.json({
      success: true,
      data: {
        results,
        summary: {
          sitesProcessed: results.length,
          totalCategoriesCreated: totalCategories,
          totalArticlesRemapped: totalArticles,
          errors: errors.length
        }
      }
    })
  } catch (error: unknown) {
    const statusCode = getErrorStatus(error)
    res.status(statusCode).json({
      success: false,
      error: { code: 'CATEGORY_MIGRATE_FAILED', message: getErrorMessage(error) }
    })
  }
}