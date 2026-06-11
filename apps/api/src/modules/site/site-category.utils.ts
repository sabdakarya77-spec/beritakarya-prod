import { prisma } from '../../db/client'

export type GlobalCategoryIndexEntry = { id: string; parentId: string | null }

/** Include ancestor global categories so navigation trees stay intact. */
export function expandWithAncestors(
  categoryIds: string[],
  globalIndex: GlobalCategoryIndexEntry[]
): string[] {
  const byId = new Map(globalIndex.map((c) => [c.id, c]))
  const expanded = new Set(categoryIds)

  for (const id of categoryIds) {
    let current = byId.get(id)
    while (current?.parentId) {
      expanded.add(current.parentId)
      current = byId.get(current.parentId)
    }
  }

  return Array.from(expanded)
}

export async function loadGlobalCategoryIndex(): Promise<GlobalCategoryIndexEntry[]> {
  return prisma.category.findMany({
    where: { isGlobal: true, deletedAt: null },
    select: { id: true, parentId: true }
  })
}

export type SiteAssignmentFilter =
  | { isConfigured: false }
  | { isConfigured: true; expandedGlobalIds: string[] }

/**
 * Returns whether the site has an explicit global-category allowlist.
 * When configured, expandedGlobalIds includes assigned IDs plus ancestor chain.
 */
export async function getSiteAssignmentFilter(siteId: string): Promise<SiteAssignmentFilter> {
  const assignments = await prisma.siteCategory.findMany({
    where: { siteId },
    select: { categoryId: true }
  })

  if (assignments.length === 0) {
    return { isConfigured: false }
  }

  const assignedIds = assignments.map((a) => a.categoryId)
  const globalIndex = await loadGlobalCategoryIndex()
  const expandedGlobalIds = expandWithAncestors(assignedIds, globalIndex)

  return { isConfigured: true, expandedGlobalIds }
}
