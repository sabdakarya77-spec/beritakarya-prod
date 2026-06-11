import { prisma } from '../../db/client'
import { getSiteAssignmentFilter } from '../site/site-category.utils'
import { CATEGORY_TREE_CONFIG } from '@beritakarya/config'

const categoryInclude = {
  site: true,
  parent: true
} as const

export class CategoryService {
  // Helper: Convert flat list to recursive tree structure
  buildCategoryTree(categories: any[]): any[] {
    const map = new Map<string, any>()
    const roots: any[] = []

    // Initialize map with nodes having empty children array
    for (const cat of categories) {
      map.set(cat.id, { ...cat, subCategories: [] })
    }

    // Build tree by assigning children to parents
    for (const cat of categories) {
      const node = map.get(cat.id)
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).subCategories.push(node)
      } else {
        roots.push(node)
      }
    }

    // Sort recursively by order
    const sortRecursive = (nodes: any[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(node => sortRecursive(node.subCategories))
    }
    sortRecursive(roots)

    return roots
  }

  // Helper: Deduplicate categories by slug AND name, preferring site-specific over global
  deduplicateCategories(categories: any[], siteId: string): any[] {
    // Dedup by both slug AND name (case-insensitive).
    // Site-specific wins over global when slugs or names collide.
    const dedupMap = new Map<string, any>()
    for (const cat of categories) {
      const slugKey = `slug:${cat.slug}`
      const nameKey = `name:${cat.name.toLowerCase()}`

      for (const key of [slugKey, nameKey]) {
        const existing = dedupMap.get(key)
        if (!existing || (cat.siteId === siteId && existing.siteId !== siteId)) {
          dedupMap.set(key, cat)
        }
      }
    }

    // Collect unique categories from name-based dedup (catches cross-slug name dupes)
    const uniqueById = new Map<string, any>()
    for (const cat of dedupMap.values()) {
      if (!uniqueById.has(cat.id)) uniqueById.set(cat.id, cat)
    }

    // Defensive: second-pass dedup by name — prevents two entries with same name
    // but different slugs (e.g. 'gaya-hidup' vs 'lifestyle') from both surviving.
    const uniqueByName = new Map<string, any>()
    for (const cat of uniqueById.values()) {
      const nameKey = cat.name.toLowerCase()
      const existing = uniqueByName.get(nameKey)
      if (!existing || (cat.siteId === siteId && existing.siteId !== siteId)) {
        uniqueByName.set(nameKey, cat)
      }
    }
    const deduplicated = Array.from(uniqueByName.values())

    // Build ID mapping for parentId remapping (old ID → surviving ID)
    const idMapping = new Map<string, string>()
    for (const cat of categories) {
      // Find which category survived for this cat's name
      const nameKey = `name:${cat.name.toLowerCase()}`
      const survivor = dedupMap.get(nameKey)
      if (survivor && survivor.id !== cat.id) {
        idMapping.set(cat.id, survivor.id)
      }
    }

    return deduplicated.map(cat => {
      if (cat.parentId && idMapping.has(cat.parentId)) {
        return { ...cat, parentId: idMapping.get(cat.parentId) }
      }
      return cat
    })
  }

  private async findCategoriesForSite(siteId: string) {
    const assignment = await getSiteAssignmentFilter(siteId)

    const where =
      assignment.isConfigured
        ? {
            OR: [
              { siteId },
              {
                isGlobal: true,
                id: { in: assignment.expandedGlobalIds }
              }
            ]
          }
        : {
            OR: [{ siteId }, { isGlobal: true }]
          }

    return prisma.category.findMany({
      where,
      include: categoryInclude,
      orderBy: { order: 'asc' }
    })
  }

  async getSiteCategories(siteId: string) {
    const all = await this.findCategoriesForSite(siteId)
    return this.deduplicateCategories(all, siteId)
  }

  async getAllCategories() {
    return await prisma.category.findMany({
      include: {
        site: true,
        parent: true
      },
      orderBy: [
        { siteId: 'asc' },
        { order: 'asc' }
      ]
    })
  }

  async getGlobalCategories() {
    return await prisma.category.findMany({
      where: { isGlobal: true },
      include: { 
      site: true,
      parent: true
      },
      orderBy: {
        order: 'asc'
      }
    })
  }

  async getCategoryTree(siteId: string) {
    const all = await this.findCategoriesForSite(siteId)
    const deduplicated = this.deduplicateCategories(all, siteId)
    return this.buildCategoryTree(deduplicated)
  }

  async createCategory(data: {
    name: string
    slug: string
    siteId?: string | null
    description?: string
    parentId?: string | null
    order?: number
    color?: string | null
  }, _actorUserId: string) {
    const isGlobal = data.siteId === null
    const effectiveSiteId = data.siteId === '' ? null : data.siteId

    const where = effectiveSiteId
      ? { slug: data.slug, siteId: effectiveSiteId }
      : { slug: data.slug, isGlobal: true }

    const existing = await prisma.category.findFirst({ where })
    if (existing) {
      throw Object.assign(
        new Error(`Category with slug "${data.slug}" already exists in this scope`),
        { statusCode: 409 }
      )
    }

    if (data.parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: data.parentId }
      })
      if (!parentExists) {
        throw Object.assign(new Error('Parent category not found'), { statusCode: 404 })
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        siteId: effectiveSiteId,
        isGlobal,
        description: data.description,
        parentId: data.parentId || null,
        order: data.order !== undefined ? data.order : 0,
        color: data.color || null
      },
      include: { site: true, parent: true }
    })

    return category
  }

  async updateCategory(
    categoryId: string,
    data: Partial<{
      name: string
      description: string
      siteId?: string | null
      parentId?: string | null
      order?: number
      color?: string | null
    }>,
    _actorUserId: string
  ) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    }

    if (existing.isGlobal && data.siteId !== undefined && data.siteId !== null) {
      throw Object.assign(
        new Error('Cannot change global category to site-specific'),
        { statusCode: 400 }
      )
    }

    if (data.siteId !== undefined && data.siteId !== existing.siteId) {
      const newSiteId = data.siteId === null ? null : data.siteId
      const whereCondition = newSiteId
        ? { slug: existing.slug, siteId: newSiteId, id: { not: categoryId } }
        : { slug: existing.slug, isGlobal: true, id: { not: categoryId } }

      const conflict = await prisma.category.findFirst({
        where: whereCondition
      })

      if (conflict) {
        throw Object.assign(
          new Error(`Category slug "${existing.slug}" already exists in the target site`),
          { statusCode: 409 }
        )
      }
    }

    if (data.parentId !== undefined) {
      if (data.parentId === categoryId) {
        throw Object.assign(new Error('Category cannot be its own parent'), { statusCode: 400 })
      }
      if (data.parentId !== null) {
        const parentExists = await prisma.category.findUnique({
          where: { id: data.parentId }
        })
        if (!parentExists) {
          throw Object.assign(new Error('Parent category not found'), { statusCode: 404 })
        }
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        siteId: data.siteId !== undefined
          ? (data.siteId === '' ? null : data.siteId)
          : undefined,
        parentId: data.parentId !== undefined ? data.parentId : undefined,
        order: data.order !== undefined ? data.order : undefined,
        color: data.color !== undefined ? data.color : undefined
      },
      include: { site: true, parent: true }
    })

    return category
  }

  async deleteCategory(categoryId: string, _actorUserId: string) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    }

    if (existing.isGlobal) {
      throw Object.assign(
        new Error('Cannot delete global category'),
        { statusCode: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    return { success: true, message: 'Category deleted' }
  }

  /**
   * Create global master categories when none exist.
   * Prefers copying from an existing site (e.g. pusat); falls back to default template.
   */
  async seedGlobalCategories(sourceSiteId = 'pusat') {
    const globalCount = await prisma.category.count({
      where: { isGlobal: true, deletedAt: null }
    })

    if (globalCount > 0) {
      return {
        created: 0,
        skipped: true,
        source: 'existing' as const,
        message: 'Kategori global sudah ada'
      }
    }

    const siteCats = await prisma.category.findMany({
      where: { siteId: sourceSiteId, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (siteCats.length > 0) {
      const created = await this.promoteSiteCategoriesToGlobal(siteCats)
      return {
        created,
        skipped: false,
        source: 'site' as const,
        message: `Berhasil membuat ${created} kategori global dari situs ${sourceSiteId}`
      }
    }

    const created = await this.seedGlobalFromTemplate()
    return {
      created,
      skipped: false,
      source: 'template' as const,
      message: `Berhasil membuat ${created} kategori global dari template`
    }
  }

  private async promoteSiteCategoriesToGlobal(
    siteCats: { id: string; name: string; slug: string; parentId: string | null; description: string | null; order: number; color: string | null }[]
  ) {
    const idMap = new Map<string, string>()
    let created = 0

    const parents = siteCats.filter((c) => !c.parentId)
    const children = siteCats.filter((c) => c.parentId)

    for (const cat of parents) {
      const { id: globalId, created: isNew } = await this.ensureGlobalCategory({
        name: cat.name,
        slug: cat.slug,
        parentId: null,
        description: cat.description,
        order: cat.order,
        color: cat.color
      })
      idMap.set(cat.id, globalId)
      if (isNew) created++
    }

    for (const cat of children) {
      const globalParentId = cat.parentId ? idMap.get(cat.parentId) : undefined
      if (!globalParentId) continue

      const { id: globalId, created: isNew } = await this.ensureGlobalCategory({
        name: cat.name,
        slug: cat.slug,
        parentId: globalParentId,
        description: cat.description,
        order: cat.order,
        color: cat.color
      })
      idMap.set(cat.id, globalId)
      if (isNew) created++
    }

    return created
  }

  private async ensureGlobalCategory(data: {
    name: string
    slug: string
    parentId: string | null
    description: string | null
    order: number
    color: string | null
  }): Promise<{ id: string; created: boolean }> {
    const existing = await prisma.category.findFirst({
      where: { slug: data.slug, isGlobal: true, deletedAt: null }
    })
    if (existing) {
      return { id: existing.id, created: false }
    }

    const row = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        siteId: null,
        isGlobal: true,
        parentId: data.parentId,
        description: data.description,
        order: data.order,
        color: data.color
      }
    })
    return { id: row.id, created: true }
  }

  private async seedGlobalFromTemplate() {
    let created = 0
    let order = 1

    for (const category of CATEGORY_TREE_CONFIG) {
      const { id: parentId, created: parentNew } = await this.ensureGlobalCategory({
        name: category.name,
        slug: category.slug,
        parentId: null,
        description: null,
        order: order++,
        color: null
      })
      if (parentNew) created++

      if (category.subCategories) {
        let subOrder = 1
        for (const sub of category.subCategories) {
          const { created: subNew } = await this.ensureGlobalCategory({
            name: sub.name,
            slug: sub.slug,
            parentId,
            description: null,
            order: subOrder++,
            color: null
          })
          if (subNew) created++

          // Handle 3rd-level sub-subcategories
          if (sub.subCategories) {
            let subSubOrder = 1
            const subId = (await this.ensureGlobalCategory({
              name: sub.name,
              slug: sub.slug,
              parentId,
              description: null,
              order: subOrder - 1,
              color: null
            })).id
            for (const subsub of sub.subCategories) {
              const { created: subSubNew } = await this.ensureGlobalCategory({
                name: subsub.name,
                slug: subsub.slug,
                parentId: subId,
                description: null,
                order: subSubOrder++,
                color: null
              })
              if (subSubNew) created++
            }
          }
        }
      }
    }

    return created
  }
}

export const categoryService = new CategoryService()