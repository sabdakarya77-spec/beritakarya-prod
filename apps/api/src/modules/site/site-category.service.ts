import { prisma } from '../../db/client'
import { logger } from '../../lib/logger'
import { categoryService } from '../category/category.service'
import {
  expandWithAncestors,
  loadGlobalCategoryIndex
} from './site-category.utils'

export class SiteCategoryService {
  private async ensureSiteExists(siteId: string) {
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404, code: 'SITE_NOT_FOUND' })
    }
    return site
  }

  private async validateGlobalCategoryIds(categoryIds: string[]) {
    if (categoryIds.length === 0) {
      return []
    }

    const uniqueIds = [...new Set(categoryIds)]
    const categories = await prisma.category.findMany({
      where: {
        id: { in: uniqueIds },
        isGlobal: true,
        deletedAt: null
      },
      select: { id: true }
    })

    if (categories.length !== uniqueIds.length) {
      const found = new Set(categories.map((c) => c.id))
      const missing = uniqueIds.filter((id) => !found.has(id))
      throw Object.assign(
        new Error(`Invalid or non-global category IDs: ${missing.join(', ')}`),
        { statusCode: 400, code: 'INVALID_CATEGORY_IDS' }
      )
    }

    return uniqueIds
  }

  private filterTreeToAssignedIds(tree: Record<string, unknown>[], assignedIdSet: Set<string>): Record<string, unknown>[] {
    const filterNode = (node: Record<string, unknown>): Record<string, unknown> | null => {
      const filteredChildren = ((node.subCategories as Record<string, unknown>[]) || [])
        .map(filterNode)
        .filter(Boolean)

      const isAssigned = assignedIdSet.has(node.id as string)
      if (!isAssigned && filteredChildren.length === 0) {
        return null
      }

      return {
        ...node,
        subCategories: filteredChildren
      }
    }

    return tree.map(filterNode).filter((n): n is Record<string, unknown> => n !== null)
  }

  async getCategoryAssignments(siteId: string) {
    await this.ensureSiteExists(siteId)

    const assignments = await prisma.siteCategory.findMany({
      where: { siteId },
      select: { categoryId: true }
    })

    const assignedCategoryIds = assignments.map((a) => a.categoryId)
    const isConfigured = assignedCategoryIds.length > 0

    const globalCategories = await categoryService.getGlobalCategories()
    const masterTree = categoryService.buildCategoryTree(
      globalCategories.filter((c) => !c.deletedAt)
    )

    let assignedTree: Record<string, unknown>[] = []
    if (isConfigured) {
      const globalIndex = await loadGlobalCategoryIndex()
      const expandedIds = expandWithAncestors(assignedCategoryIds, globalIndex)
      const assignedIdSet = new Set(expandedIds)

      const assignedFlat = globalCategories.filter((c) => assignedIdSet.has(c.id) && !c.deletedAt)
      const assignedFullTree = categoryService.buildCategoryTree(assignedFlat)
      assignedTree = this.filterTreeToAssignedIds(assignedFullTree, assignedIdSet)
    }

    return {
      siteId,
      isConfigured,
      assignedCategoryIds,
      masterTree,
      assignedTree
    }
  }

  async replaceCategoryAssignments(
    siteId: string,
    categoryIds: string[],
    actorUserId: string
  ) {
    await this.ensureSiteExists(siteId)

    const validatedIds = await this.validateGlobalCategoryIds(categoryIds)
    const globalIndex = await loadGlobalCategoryIndex()
    const expandedIds = expandWithAncestors(validatedIds, globalIndex)

    await prisma.$transaction(async (tx) => {
      await tx.siteCategory.deleteMany({ where: { siteId } })

      if (expandedIds.length > 0) {
        await tx.siteCategory.createMany({
          data: expandedIds.map((categoryId) => ({ siteId, categoryId }))
        })
      }
    })

    await this.logAudit(actorUserId, 'site.categories_updated', {
      siteId,
      categoryIds: expandedIds,
      count: expandedIds.length
    })

    return {
      siteId,
      assignedCategoryIds: expandedIds,
      count: expandedIds.length
    }
  }

  private async logAudit(
    userId: string,
    action: string,
    details: Record<string, unknown>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 'system',
          siteId: (details.siteId as string) || 'pusat',
          action,
          entityType: 'site',
          entityId: (details.siteId as string) || 'system',
          newValue: details as object
        }
      })
    } catch (error) {
      logger.error('Audit log failed:', error)
    }
  }
}

export const siteCategoryService = new SiteCategoryService()
