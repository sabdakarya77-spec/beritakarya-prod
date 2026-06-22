import { prisma } from '../../db/client'
import { CATEGORY_TREE_CONFIG } from '@beritakarya/config'
import type { Prisma } from '@prisma/client'

const categoryInclude = {
  site: true,
  parent: true
} as const

/** Category returned from Prisma with site and parent relations included. */
type CategoryWithRelations = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>

/** Category tree node with nested subCategories array. */
type CategoryTreeNode = CategoryWithRelations & { subCategories: CategoryTreeNode[] }

export class CategoryService {
  // Helper: Convert flat list to recursive tree structure
  buildCategoryTree(categories: CategoryWithRelations[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>()
    const roots: CategoryTreeNode[] = []

    // Initialize map with nodes having empty children array
    for (const cat of categories) {
      map.set(cat.id, { ...cat, subCategories: [] })
    }

    // Build tree by assigning children to parents
    for (const cat of categories) {
      const node = map.get(cat.id)
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.subCategories.push(node!)
      } else {
        roots.push(node!)
      }
    }

    // Sort recursively by order
    const sortRecursive = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(node => sortRecursive(node.subCategories))
    }
    sortRecursive(roots)

    return roots
  }

  // Helper: Deduplicate categories by slug AND name, preferring site-specific over global
  deduplicateCategories(categories: CategoryWithRelations[], siteId: string): CategoryWithRelations[] {
    // Dedup by both slug AND name (case-insensitive).
    // Site-specific wins over global when slugs or names collide.
    const dedupMap = new Map<string, CategoryWithRelations>()
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
    const uniqueById = new Map<string, CategoryWithRelations>()
    for (const cat of dedupMap.values()) {
      if (!uniqueById.has(cat.id)) uniqueById.set(cat.id, cat)
    }

    // Defensive: second-pass dedup by name — prevents two entries with same name
    // but different slugs (e.g. 'gaya-hidup' vs 'lifestyle') from both surviving.
    const uniqueByName = new Map<string, CategoryWithRelations>()
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
        return { ...cat, parentId: idMapping.get(cat.parentId)! }
      }
      return cat
    })
  }

  private async findCategoriesForSite(siteId: string) {
    // Phase 2: Site View hanya menampilkan kategori lokal (berdiri sendiri).
    // Global tidak ikut masuk. Setiap site punya kategori lokal masing-masing.
    return prisma.category.findMany({
      where: { siteId },
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

  async getLocalCategoryTree(siteId: string) {
    const local = await prisma.category.findMany({
      where: { siteId, isGlobal: false },
      include: categoryInclude,
      orderBy: { order: 'asc' }
    })
    return this.buildCategoryTree(local)
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

  /**
   * Phase 0: Migrate global categories to local for a specific site.
   * Copies the full global tree (top-level + sub + sub-sub) as site-specific categories.
   * Returns a mapping of globalId → localId for re-mapping ArticleCategory.
   */
  async migrateGlobalToLocal(siteId: string): Promise<{
    mapping: Map<string, string>
    categoriesCreated: number
  }> {
    // 1. Fetch full global tree (flat list, ordered)
    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (globalCategories.length === 0) {
      throw Object.assign(
        new Error('Tidak ada kategori global untuk di-migrasi. Jalankan seed-global terlebih dahulu.'),
        { statusCode: 400 }
      )
    }

    // 2. Check if local categories already exist for this site
    const existingLocal = await prisma.category.count({
      where: { siteId, isGlobal: false, deletedAt: null }
    })

    if (existingLocal > 0) {
      throw Object.assign(
        new Error(`Site "${siteId}" sudah memiliki ${existingLocal} kategori lokal. Migrasi hanya bisa dijalankan sekali.`),
        { statusCode: 409 }
      )
    }

    // 3. Copy with hierarchy mapping
    const idMap = new Map<string, string>() // globalId → localId
    let created = 0

    // Process in order: parents first, then children (parentId already resolved)
    // Sort: null parentId first, then by order
    const sorted = [...globalCategories].sort((a, b) => {
      if (!a.parentId && b.parentId) return -1
      if (a.parentId && !b.parentId) return 1
      return (a.order || 0) - (b.order || 0)
    })

    for (const cat of sorted) {
      // Resolve local parentId
      let localParentId: string | null = null
      if (cat.parentId) {
        localParentId = idMap.get(cat.parentId) || null
        // If parent wasn't mapped (shouldn't happen), skip this child
        if (!localParentId) continue
      }

      // Check if a local category with same slug already exists
      const existingBySlug = await prisma.category.findFirst({
        where: { slug: cat.slug, siteId, deletedAt: null }
      })

      if (existingBySlug) {
        // Already exists (e.g. from a previous partial migration), reuse it
        idMap.set(cat.id, existingBySlug.id)
        continue
      }

      const localCat = await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          siteId,
          isGlobal: false,
          parentId: localParentId,
          description: cat.description,
          order: cat.order,
          color: cat.color
        }
      })

      idMap.set(cat.id, localCat.id)
      created++
    }

    return { mapping: idMap, categoriesCreated: created }
  }

  /**
   * Phase 0: Re-map ArticleCategory from global category IDs to local category IDs.
   * Only affects articles belonging to the given siteId.
   */
  async remapArticleCategories(
    siteId: string,
    idMapping: Map<string, string>
  ): Promise<{ articlesRemapped: number; rowsUpdated: number }> {
    let rowsUpdated = 0
    const articleIds = new Set<string>()

    // Find all ArticleCategory rows where categoryId is a global ID in the mapping
    // and the article belongs to this site
    const globalIds = [...idMapping.keys()]

    for (const globalId of globalIds) {
      const localId = idMapping.get(globalId)
      if (!localId) continue

      // Find ArticleCategory rows pointing to this global category
      const rows = await prisma.articleCategory.findMany({
        where: {
          categoryId: globalId,
          article: { siteId }
        },
        select: { articleId: true }
      })

      if (rows.length === 0) continue

      // Delete old rows and create new ones (composite key, can't update)
      for (const row of rows) {
        try {
          await prisma.articleCategory.delete({
            where: {
              articleId_categoryId: {
                articleId: row.articleId,
                categoryId: globalId
              }
            }
          })

          await prisma.articleCategory.create({
            data: {
              articleId: row.articleId,
              categoryId: localId
            }
          })

          articleIds.add(row.articleId)
          rowsUpdated++
        } catch {
          // Skip if already exists or other constraint error
        }
      }
    }

    return {
      articlesRemapped: articleIds.size,
      rowsUpdated
    }
  }

  /**
   * Phase 0: Run full migration for one site (copy global → local + re-map articles).
   */
  async migrateSite(siteId: string) {
    // 1. Copy global categories to local
    const { mapping, categoriesCreated } = await this.migrateGlobalToLocal(siteId)

    // 2. Re-map article categories
    const { articlesRemapped, rowsUpdated } = await this.remapArticleCategories(siteId, mapping)

    return {
      siteId,
      categoriesCreated,
      articlesRemapped,
      rowsUpdated
    }
  }

  /**
   * Phase 0: Run migration for all sites (or specific site).
   */
  async migrateAllSites(targetSiteId?: string) {
    const results: Array<{
      siteId: string
      categoriesCreated: number
      articlesRemapped: number
      rowsUpdated: number
      error?: string
    }> = []

    if (targetSiteId) {
      try {
        const result = await this.migrateSite(targetSiteId)
        results.push(result)
      } catch (error: unknown) {
        results.push({
          siteId: targetSiteId,
          categoriesCreated: 0,
          articlesRemapped: 0,
          rowsUpdated: 0,
          error: error instanceof Error ? error.message : String(error)
        })
      }
      return results
    }

    // Migrate all sites
    const sites = await prisma.site.findMany({ select: { id: true } })

    for (const site of sites) {
      try {
        const result = await this.migrateSite(site.id)
        results.push(result)
      } catch (error: unknown) {
        results.push({
          siteId: site.id,
          categoriesCreated: 0,
          articlesRemapped: 0,
          rowsUpdated: 0,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  /**
   * Force-sync global categories from CATEGORY_TREE_CONFIG template.
   * Unlike seedGlobalCategories(), this runs even when categories already exist —
   * it updates names/orders and creates any missing categories.
   *
   * MASALAH 3 FIX: Database is the single source of truth for runtime.
   * This endpoint lets superadmin re-sync when the template config is updated.
   */
  async syncFromTemplate() {
    let created = 0
    let updated = 0
    let order = 1

    for (const category of CATEGORY_TREE_CONFIG) {
      const { id: parentId, created: parentNew, updated: parentUpdated } =
        await this.upsertGlobalCategory({
          name: category.name,
          slug: category.slug,
          parentId: null,
          order: order++
        })
      if (parentNew) created++
      if (parentUpdated) updated++

      if (category.subCategories) {
        let subOrder = 1
        for (const sub of category.subCategories) {
          const { id: subId, created: subNew, updated: subUpdated } =
            await this.upsertGlobalCategory({
              name: sub.name,
              slug: sub.slug,
              parentId,
              order: subOrder++
            })
          if (subNew) created++
          if (subUpdated) updated++

          // Handle 3rd-level sub-subcategories
          if (sub.subCategories) {
            let subSubOrder = 1
            for (const subsub of sub.subCategories) {
              const { created: subSubNew, updated: subSubUpdated } =
                await this.upsertGlobalCategory({
                  name: subsub.name,
                  slug: subsub.slug,
                  parentId: subId,
                  order: subSubOrder++
                })
              if (subSubNew) created++
              if (subSubUpdated) updated++
            }
          }
        }
      }
    }

    return {
      created,
      updated,
      total: created + updated,
      message: `Sinkronisasi selesai: ${created} dibuat, ${updated} diperbarui`
    }
  }

  /**
   * Upsert a global category: create if missing, update name/order/parentId if exists.
   */
  private async upsertGlobalCategory(data: {
    name: string
    slug: string
    parentId: string | null
    order: number
  }): Promise<{ id: string; created: boolean; updated: boolean }> {
    const existing = await prisma.category.findFirst({
      where: { slug: data.slug, isGlobal: true, deletedAt: null }
    })

    if (existing) {
      // Update if name, order, or parentId changed
      const needsUpdate =
        existing.name !== data.name ||
        existing.order !== data.order ||
        existing.parentId !== data.parentId

      if (needsUpdate) {
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            order: data.order,
            parentId: data.parentId
          }
        })
        return { id: existing.id, created: false, updated: true }
      }
      return { id: existing.id, created: false, updated: false }
    }

    const row = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        siteId: null,
        isGlobal: true,
        parentId: data.parentId,
        order: data.order
      }
    })
    return { id: row.id, created: true, updated: false }
  }
}

export const categoryService = new CategoryService()
