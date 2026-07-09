import { prisma } from '../../db/client'
import { CATEGORY_TREE_CONFIG } from '@beritakarya/config'
import type { Prisma } from '@prisma/client'

/**
 * Memberitahu Next.js frontend untuk mem-flush Data Cache kategori.
 * Dipanggil setelah create / update / delete kategori agar homepage
 * langsung merefleksikan perubahan tanpa menunggu revalidate interval.
 *
 * Jika REVALIDATE_SECRET atau FRONTEND_URL tidak tersedia, fungsi ini
 * gagal secara silent agar tidak mengganggu operasi utama.
 */
async function revalidateNextCache(siteId?: string | null): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET
  const frontendUrl = process.env.FRONTEND_URL

  if (!secret || !frontendUrl) return

  const tagsToInvalidate = ['categories']
  if (siteId) tagsToInvalidate.push(`categories-${siteId}`)

  // Fire-and-forget: jalankan semua revalidasi secara paralel
  await Promise.allSettled(
    tagsToInvalidate.map((tag) =>
      fetch(`${frontendUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, secret }),
        signal: AbortSignal.timeout(5000)
      }).then((res) => {
        if (!res.ok) console.warn(`[Revalidate] Failed for tag "${tag}": HTTP ${res.status}`)
        else console.log(`[Revalidate] Invalidated tag "${tag}"`)
      })
    )
  )
}

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

    // Flush Next.js server cache agar homepage langsung update
    revalidateNextCache(data.siteId).catch(() => {})

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

    // Flush Next.js server cache agar homepage langsung update
    revalidateNextCache(category.siteId).catch(() => {})

    return category
  }

  async deleteCategory(categoryId: string, _actorUserId: string, allowGlobal = false) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    }

    // Defense in depth: global categories cannot be deleted from Site View.
    // Even though Site View only shows local categories (UI protection),
    // this check prevents accidental deletion via direct API call.
    if (existing.isGlobal && !allowGlobal) {
      throw Object.assign(
        new Error('Kategori global tidak bisa dihapus dari Site View. Gunakan Global View.'),
        { statusCode: 403 }
      )
    }

    if (existing.isGlobal) {
      // Hapus kategori global dan seluruh salinan lokalnya di semua site
      await prisma.category.deleteMany({
        where: { slug: existing.slug }
      })
    } else {
      await prisma.category.delete({
        where: { id: categoryId }
      })
    }

    // Flush Next.js server cache agar homepage langsung update
    // Untuk kategori global, invalidasi semua tag (tidak ada siteId spesifik)
    revalidateNextCache(existing.isGlobal ? null : existing.siteId).catch(() => {})

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
   * Phase 3: Sync global categories to local (Add Only).
   * Compares global and local by slug — adds missing, keeps existing intact.
   * Preserves hierarchy when copying.
   */
  async syncGlobalToLocal(siteId: string): Promise<{
    added: number
    skipped: number
  }> {
    // 1. Fetch global categories
    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (globalCategories.length === 0) {
      return { added: 0, skipped: 0 }
    }

    // 2. Fetch existing local categories
    const localCategories = await prisma.category.findMany({
      where: { siteId, isGlobal: false, deletedAt: null }
    })

    // Build set of existing local slugs for fast lookup
    const localSlugs = new Set(localCategories.map(c => c.slug))

    // 3. Build local parentId mapping (existing local categories)
    const localSlugToId = new Map<string, string>()
    for (const cat of localCategories) {
      localSlugToId.set(cat.slug, cat.id)
    }

    // 4. Sort: parents first, then children
    const sorted = [...globalCategories].sort((a, b) => {
      if (!a.parentId && b.parentId) return -1
      if (a.parentId && !b.parentId) return 1
      return (a.order || 0) - (b.order || 0)
    })

    let added = 0
    let skipped = 0

    // 5. Process each global category
    for (const cat of sorted) {
      // Skip if already exists locally (by slug)
      if (localSlugs.has(cat.slug)) {
        skipped++
        continue
      }

      // Resolve local parentId
      let localParentId: string | null = null
      if (cat.parentId) {
        // Find parent's slug from global categories
        const parentGlobal = globalCategories.find(g => g.id === cat.parentId)
        if (parentGlobal) {
          localParentId = localSlugToId.get(parentGlobal.slug) || null
        }
        // If parent doesn't exist locally and wasn't just created, skip
        if (!localParentId) {
          skipped++
          continue
        }
      }

      // Create local category
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

      // Add to tracking maps so children can reference it
      localSlugs.add(cat.slug)
      localSlugToId.set(cat.slug, localCat.id)
      added++
    }

    return { added, skipped }
  }

  /**
   * Factory Reset: Hapus semua kategori lokal site, ganti dengan salinan persis
   * dari database global. Re-map artikel berdasarkan slug.
   *
   * Konsep: global = single source of truth, lokal = mirror.
   * Setiap kali dijalankan, hasilnya selalu sama (idempotent).
   */
  async resetToDefault(siteId: string): Promise<{
    categoriesCreated: number
    articlesRemapped: number
  }> {
    // 1. Validasi global categories ada
    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (globalCategories.length === 0) {
      throw Object.assign(
        new Error('Tidak ada kategori global. Jalankan seed-global terlebih dahulu.'),
        { statusCode: 400 }
      )
    }

    // 2. Simpan mapping artikel → kategori lokal (slug) sebelum dihapus
    const localCategories = await prisma.category.findMany({
      where: { siteId, isGlobal: false, deletedAt: null },
      select: { id: true, slug: true }
    })

    const localIdToSlug = new Map<string, string>()
    for (const cat of localCategories) {
      localIdToSlug.set(cat.id, cat.slug)
    }

    // Ambil semua ArticleCategory yang artikelnya milik site ini
    const localIds = [...localIdToSlug.keys()]
    const articleCategoryMap: Array<{ articleId: string; categorySlug: string }> = []

    if (localIds.length > 0) {
      const articleCategories = await prisma.articleCategory.findMany({
        where: {
          categoryId: { in: localIds },
          article: { siteId }
        },
        select: { articleId: true, categoryId: true }
      })

      for (const ac of articleCategories) {
        const slug = localIdToSlug.get(ac.categoryId)
        if (slug) {
          articleCategoryMap.push({ articleId: ac.articleId, categorySlug: slug })
        }
      }
    }

    // 3. Transaction: hapus lokal lama → copy dari global → re-map artikel
    const result = await prisma.$transaction(async (tx) => {
      // 3a. Hapus semua kategori lokal site (ArticleCategory cascade)
      await tx.category.deleteMany({
        where: { siteId, isGlobal: false }
      })

      // 3b. Copy global → lokal dengan topological sort (parent before child)
      const idMap = new Map<string, string>() // globalId → localId

      const sorted = this.sortTopological(globalCategories)

      let created = 0
      for (const cat of sorted) {
        let localParentId: string | null = null
        if (cat.parentId) {
          localParentId = idMap.get(cat.parentId) || null
          if (!localParentId) continue // parent tidak ter-map, skip
        }

        const localCat = await tx.category.create({
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

      // 3c. Re-map artikel: slug → new local categoryId
      // Build slug → localId mapping
      const slugToLocalId = new Map<string, string>()
      for (const [globalId, localId] of idMap) {
        const globalCat = globalCategories.find(g => g.id === globalId)
        if (globalCat) {
          slugToLocalId.set(globalCat.slug, localId)
        }
      }

      let remapped = 0
      for (const { articleId, categorySlug } of articleCategoryMap) {
        const newCategoryId = slugToLocalId.get(categorySlug)
        if (!newCategoryId) continue // slug tidak ada di global, skip

        try {
          await tx.articleCategory.create({
            data: { articleId, categoryId: newCategoryId }
          })
          remapped++
        } catch {
          // Skip if already exists (duplicate)
        }
      }

      return { categoriesCreated: created, articlesRemapped: remapped }
    })

    return result
  }

  /**
   * Topological sort: parent diproses sebelum child.
   * Menghitung depth dengan traverse ke atas, lalu sort by depth + order.
   */
  private sortTopological<T extends { id: string; parentId: string | null; order: number }>(
    items: T[]
  ): T[] {
    const depthCache = new Map<string, number>()

    const getDepth = (item: T): number => {
      if (depthCache.has(item.id)) return depthCache.get(item.id)!
      let depth = 0
      let current = item
      while (current.parentId) {
        depth++
        const parent = items.find(i => i.id === current.parentId)
        if (!parent) break
        current = parent
        if (depth > 10) break
      }
      depthCache.set(item.id, depth)
      return depth
    }

    return [...items].sort((a, b) => {
      const depthA = getDepth(a)
      const depthB = getDepth(b)
      if (depthA !== depthB) return depthA - depthB
      return (a.order || 0) - (b.order || 0)
    })
  }

  /**
   * Diff detection: bandingkan kategori global vs lokal di semua site.
   * Return per-site diff (new, updated, same).
   */
  async diffGlobalCategories(): Promise<{
    hasDiff: boolean
    sites: Array<{
      siteId: string
      siteName: string
      new: Array<{ slug: string; name: string }>
      updated: Array<{ slug: string; field: string; globalValue: string; localValue: string }>
      total: number
    }>
  }> {
    // 1. Ambil semua global categories
    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (globalCategories.length === 0) {
      return { hasDiff: false, sites: [] }
    }

    // 2. Ambil semua site
    const sites = await prisma.site.findMany({
      select: { id: true, name: true }
    })

    // 3. Build global lookup by slug and id
    const globalBySlug = new Map<string, typeof globalCategories[0]>()
    const globalById = new Map<string, typeof globalCategories[0]>()
    for (const cat of globalCategories) {
      globalBySlug.set(cat.slug, cat)
      globalById.set(cat.id, cat)
    }

    const result: Array<{
      siteId: string
      siteName: string
      new: Array<{ slug: string; name: string }>
      updated: Array<{ slug: string; field: string; globalValue: string; localValue: string }>
      total: number
    }> = []

    let hasDiff = false

    // 4. Untuk setiap site, bandingkan lokal vs global
    for (const site of sites) {
      const localCategories = await prisma.category.findMany({
        where: { siteId: site.id, isGlobal: false, deletedAt: null },
        select: { id: true, slug: true, name: true, description: true, color: true, parentId: true, order: true }
      })

      const localBySlug = new Map<string, typeof localCategories[0]>()
      const localById = new Map<string, typeof localCategories[0]>()
      for (const cat of localCategories) {
        localBySlug.set(cat.slug, cat)
        localById.set(cat.id, cat)
      }

      const newCats: Array<{ slug: string; name: string }> = []
      const updatedCats: Array<{ slug: string; field: string; globalValue: string; localValue: string }> = []

      // Cek setiap kategori global
      for (const globalCat of globalCategories) {
        const localCat = localBySlug.get(globalCat.slug)

        if (!localCat) {
          // Baru: ada di global, tidak ada di lokal
          newCats.push({ slug: globalCat.slug, name: globalCat.name })
          continue
        }

        // Bandingkan field
        if (localCat.name !== globalCat.name) {
          updatedCats.push({
            slug: globalCat.slug,
            field: 'name',
            globalValue: globalCat.name,
            localValue: localCat.name
          })
        }
        if ((localCat.description || '') !== (globalCat.description || '')) {
          updatedCats.push({
            slug: globalCat.slug,
            field: 'description',
            globalValue: globalCat.description || '',
            localValue: localCat.description || ''
          })
        }
        if ((localCat.color || '') !== (globalCat.color || '')) {
          updatedCats.push({
            slug: globalCat.slug,
            field: 'color',
            globalValue: globalCat.color || '',
            localValue: localCat.color || ''
          })
        }
        if (localCat.order !== globalCat.order) {
          updatedCats.push({
            slug: globalCat.slug,
            field: 'order',
            globalValue: String(globalCat.order),
            localValue: String(localCat.order)
          })
        }
        // Bandingkan parentId berdasarkan parent slug masing-masing (karena ID lokal/global berbeda)
        const localParentSlug = localCat.parentId ? (localById.get(localCat.parentId)?.slug || null) : null
        const globalParentSlug = globalCat.parentId ? (globalById.get(globalCat.parentId)?.slug || null) : null
        if (localParentSlug !== globalParentSlug) {
          updatedCats.push({
            slug: globalCat.slug,
            field: 'parentId',
            globalValue: globalParentSlug || 'none',
            localValue: localParentSlug || 'none'
          })
        }
      }

      const total = newCats.length + updatedCats.length
      if (total > 0) hasDiff = true

      result.push({
        siteId: site.id,
        siteName: site.name,
        new: newCats,
        updated: updatedCats,
        total
      })
    }

    return { hasDiff, sites: result }
  }

  /**
   * Sync global categories ke semua site.
   * - Kategori baru (slug tidak ada di lokal) → tambah
   * - Kategori berubah (slug sama, data beda) → update
   * - Kategori lokal custom → biarkan
   */
  async syncGlobalToAllSites(): Promise<{
    sitesProcessed: number
    totalAdded: number
    totalUpdated: number
    errors: Array<{ siteId: string; error: string }>
  }> {
    // 1. Ambil global categories
    const globalCategories = await prisma.category.findMany({
      where: { isGlobal: true, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (globalCategories.length === 0) {
      return { sitesProcessed: 0, totalAdded: 0, totalUpdated: 0, errors: [] }
    }

    const globalById = new Map<string, typeof globalCategories[0]>()
    for (const cat of globalCategories) {
      globalById.set(cat.id, cat)
    }

    const sorted = this.sortTopological(globalCategories)

    // 2. Ambil semua site
    const sites = await prisma.site.findMany({
      select: { id: true }
    })

    let totalAdded = 0
    let totalUpdated = 0
    const errors: Array<{ siteId: string; error: string }> = []

    // 3. Untuk setiap site
    for (const site of sites) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Ambil kategori lokal
          const localCategories = await tx.category.findMany({
            where: { siteId: site.id, isGlobal: false, deletedAt: null }
          })

          const localBySlug = new Map<string, typeof localCategories[0]>()
          const localById = new Map<string, typeof localCategories[0]>()
          for (const cat of localCategories) {
            localBySlug.set(cat.slug, cat)
            localById.set(cat.id, cat)
          }

          // Build slug → localId mapping (termasuk yang baru dibuat)
          const slugToLocalId = new Map<string, string>()
          for (const cat of localCategories) {
            slugToLocalId.set(cat.slug, cat.id)
          }

          let added = 0
          let updated = 0

          for (const globalCat of sorted) {
            const localCat = localBySlug.get(globalCat.slug)

            if (!localCat) {
              // Baru: buat kategori lokal
              let localParentId: string | null = null
              if (globalCat.parentId) {
                const parentGlobal = globalById.get(globalCat.parentId)
                if (parentGlobal) {
                  localParentId = slugToLocalId.get(parentGlobal.slug) || null
                }
                if (!localParentId) continue // parent belum ada, skip
              }

              const newCat = await tx.category.create({
                data: {
                  name: globalCat.name,
                  slug: globalCat.slug,
                  siteId: site.id,
                  isGlobal: false,
                  parentId: localParentId,
                  description: globalCat.description,
                  order: globalCat.order,
                  color: globalCat.color
                }
              })

              slugToLocalId.set(globalCat.slug, newCat.id)
              localById.set(newCat.id, newCat)
              localBySlug.set(newCat.slug, newCat)
              added++
            } else {
              // Sudah ada: cek apakah ada perubahan
              const localParentSlug = localCat.parentId ? (localById.get(localCat.parentId)?.slug || null) : null
              const globalParentSlug = globalCat.parentId ? (globalById.get(globalCat.parentId)?.slug || null) : null

              const needsUpdate =
                localCat.name !== globalCat.name ||
                (localCat.description || '') !== (globalCat.description || '') ||
                (localCat.color || '') !== (globalCat.color || '') ||
                localCat.order !== globalCat.order ||
                localParentSlug !== globalParentSlug

              if (needsUpdate) {
                let localParentId: string | null = null
                if (globalCat.parentId) {
                  const parentGlobal = globalById.get(globalCat.parentId)
                  if (parentGlobal) {
                    localParentId = slugToLocalId.get(parentGlobal.slug) || null
                  }
                }

                const updatedCat = await tx.category.update({
                  where: { id: localCat.id },
                  data: {
                    name: globalCat.name,
                    description: globalCat.description,
                    color: globalCat.color,
                    order: globalCat.order,
                    parentId: localParentId
                  }
                })
                localById.set(updatedCat.id, updatedCat)
                localBySlug.set(updatedCat.slug, updatedCat)
                updated++
              }
            }
          }

          return { added, updated }
        })

        totalAdded += result.added
        totalUpdated += result.updated
      } catch (error: unknown) {
        errors.push({
          siteId: site.id,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return {
      sitesProcessed: sites.length,
      totalAdded,
      totalUpdated,
      errors
    }
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
