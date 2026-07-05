import { prisma } from '../../db/client'
import { logger } from '../../lib/logger'
import { AppError } from '../../utils/AppError'
import type { Prisma } from '@prisma/client'

/**
 * Field-field "aset korporat" yang diwariskan dari site 'pusat' ke
 * site cabang. Ini adalah field yang:
 * - Tidak boleh diedit wapimred (lihat SUPERADMIN_ONLY_FIELDS di controller)
 * - Perlu tampil di homepage/site cabang meskipun field tsb kosong
 *   (inheritance dari pusat saat read)
 * - Auto-populate saat site baru dibuat (pakai nilai pusat sebagai default)
 */
const CORPORATE_ASSET_FIELDS = [
  'socialLinks',          // Saluran Media Sosial Resmi
  'footerText',           // Teks Footer Hak Cipta
  'googleIndexingConfig', // Google Search API
  'aboutUs',              // Halaman Legal
  'codeOfEthics',
  'editorial',
  'advertising',
  'privacyPolicy',
  'termsOfService',
  'mediaSiber',
] as const

/** True kalau value "kosong" (null/undefined/string kosong/object kosong) */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (typeof value === 'object' && Object.keys(value as object).length === 0) return true
  return false
}

export class SiteService {
  /**
   * Phase 1: Copy global categories to local for a new site.
   * Copies full tree (top-level + sub + sub-sub) from global categories.
   * Uses the provided Prisma transaction client for atomicity.
   */
  async copyGlobalToLocal(tx: Prisma.TransactionClient, siteId: string): Promise<number> {
    // Fetch all global categories
    const globalCategories = await tx.category.findMany({
      where: { isGlobal: true, deletedAt: null },
      orderBy: { order: 'asc' }
    })

    if (globalCategories.length === 0) return 0

    const idMap = new Map<string, string>() // globalId → localId
    let copied = 0

    // Sort: parents first (null parentId), then children
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
        if (!localParentId) continue // Parent not mapped, skip
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
      copied++
    }

    return copied
  }

  async getAllSites(includeStats = false) {
    const sites = await prisma.site.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' }
    })

    if (!includeStats) {
      return sites.map(site => ({
        id: site.id,
        domain: site.domain,
        name: site.name,
        logoUrl: site.logoUrl,
        contactEmail: site.contactEmail,
        phone: site.phone,
        address: site.address,
        description: site.description
      }))
    }

    // Tanggal threshold untuk penanda "sehat" (30 hari terakhir)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Fetch stats for all sites in parallel
    const sitesWithStats = await Promise.all(
      sites.map(async (site) => {
        const userCount = await prisma.user.count({
          where: {
            siteId: site.id,
            role: { in: ['wapimred', 'reporter', 'kontributor'] }
          }
        })
        const articleCount = await prisma.article.count({
          where: { siteId: site.id }
        })
        const categoryCount = await prisma.category.count({
          where: { siteId: site.id }
        })
        // Aktivitas 30 hari terakhir: artikel baru + KYC submission
        const recentActivity = await prisma.article.count({
          where: {
            siteId: site.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        })

        // Heuristik isActive: punya tim DAN ada aktivitas 30 hari terakhir
        const isActive = userCount > 0 && recentActivity > 0

        return {
          id: site.id,
          domain: site.domain,
          name: site.name,
          logoUrl: site.logoUrl,
          contactEmail: site.contactEmail,
          phone: site.phone,
          address: site.address,
          description: site.description,
          isActive,
          stats: {
            users: userCount,
            articles: articleCount,
            categories: categoryCount,
            recentActivity
          }
        }
      })
    )

    return sitesWithStats
  }

  async getSiteById(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    // Fetch stats in parallel
    const [userCount, articleCount, categoryCount] = await Promise.all([
      prisma.user.count({
        where: {
          siteId: site.id,
          role: { in: ['wapimred', 'reporter', 'kontributor'] }
        }
      }),
      prisma.article.count({
        where: { siteId: site.id }
      }),
      prisma.category.count({
        where: { siteId: site.id }
      })
    ])

    return {
      id: site.id,
      domain: site.domain,
      name: site.name,
      logoUrl: site.logoUrl,
      contactEmail: site.contactEmail,
      phone: site.phone,
      address: site.address,
      description: site.description,
      trendingTopics: site.trendingTopics,
      stats: {
        users: userCount,
        articles: articleCount,
        categories: categoryCount
      }
    }
  }

  async createSite(data: {
    id: string
    domain: string
    name?: string
    wapimredId?: string
    logoUrl?: string
    contactEmail?: string
    phone?: string
    address?: string
    description?: string
  }) {
    const { id, domain, name, wapimredId, ...rest } = data

    const existing = await prisma.site.findFirst({
      where: {
        OR: [{ id }, { domain }]
      }
    })

    if (existing) {
      throw Object.assign(
        new Error(`Site with ID "${id}" or domain "${domain}" already exists`),
        { statusCode: 409 }
      )
    }

    // [MULTISITE-OPSI-C] Auto-populate aset korporat dari pusat supaya
    // site baru langsung punya nilai default (sosmed pusat, footer
    // korporat, halaman legal). Superadmin tetap bisa override
    // kemudian via PATCH /sites/settings. Jika pusat belum punya nilai
    // untuk field tertentu, field tsb tetap null (tidak auto-generate).
    const pusat = await prisma.site.findUnique({ where: { id: 'pusat' } })
    const corporateDefaults: Record<string, unknown> = {}
    if (pusat) {
      const pusatRecord = pusat as Record<string, unknown>
      for (const field of CORPORATE_ASSET_FIELDS) {
        if (!isEmptyValue(pusatRecord[field])) {
          corporateDefaults[field] = pusatRecord[field]
        }
      }
    }

    const site = await prisma.$transaction(async (tx) => {
      const newSite = await tx.site.create({
        data: {
          id,
          domain,
          name: name || id,
          ...rest,
          ...corporateDefaults,
        }
      })

      if (wapimredId) {
        const user = await tx.user.findUnique({
          where: { id: wapimredId }
        })

        if (!user) {
          throw Object.assign(
            new Error(`User ${wapimredId} not found`),
            { statusCode: 400 }
          )
        }

        if (user.role !== 'wapimred') {
          throw Object.assign(
            new Error(`User ${wapimredId} is not a wapimred`),
            { statusCode: 400 }
          )
        }

        await tx.user.update({
          where: { id: wapimredId },
          data: { siteId: newSite.id }
        })

        await tx.auditLog.create({
          data: {
            userId: 'system',
            siteId: newSite.id,
            action: 'site.wapimred_assigned',
            entityType: 'user',
            entityId: wapimredId,
            newValue: { siteId: newSite.id }
          }
        })
      }

      // Phase 1: Auto-copy global categories to local for the new site
      try {
        const copied = await this.copyGlobalToLocal(tx, newSite.id)
        if (copied > 0) {
          logger.info(`[Site] Copied ${copied} global categories to local for site "${newSite.id}"`)
        }
      } catch (err) {
        // Non-fatal: site creation should succeed even if category copy fails
        logger.error(`[Site] Failed to copy global categories to local for site "${newSite.id}":`, err)
      }

      return newSite
    })

    return {
      id: site.id,
      domain: site.domain,
      name: site.name,
      logoUrl: site.logoUrl,
      contactEmail: site.contactEmail
    }
  }

  async updateSite(
    siteId: string,
    data: Partial<{
      domain: string
      name: string
      logoUrl: string
      contactEmail: string
      phone: string
      address: string
      description: string
      trendingTopics: Prisma.InputJsonValue
    }>,
    actorUserId: string
  ) {
    const existing = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!existing) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    if (data.domain && data.domain !== existing.domain) {
      // Use NOT condition with Prisma
      const domainExists = await prisma.site.findFirst({
        where: {
          domain: data.domain,
          id: { not: siteId }
        }
      })

      if (domainExists) {
        throw Object.assign(
          new Error(`Domain ${data.domain} already in use by another site`),
          { statusCode: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.trendingTopics && typeof data.trendingTopics === 'object') {
      updateData.trendingTopics = JSON.stringify(data.trendingTopics)
    }

    const updated = await prisma.site.update({
      where: { id: siteId },
      data: updateData as Prisma.SiteUpdateInput
    })

    await this.logAudit(actorUserId, 'site.updated', {
      siteId,
      changes: data
    })

    return {
      id: updated.id,
      domain: updated.domain,
      name: updated.name,
      logoUrl: updated.logoUrl,
      contactEmail: updated.contactEmail
    }
  }

  async getSiteSettings(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    // [MULTISITE-OPSI-A] Site cabang mewarisi aset korporat (socialLinks,
    // footerText, Google config, halaman legal) dari pusat JIKA nilai
    // site tsb kosong. Pusat sendiri tetap pakai nilainya sendiri.
    // Inheritance terjadi di READ, bukan WRITE — saat superadmin
    // edit site, nilai raw yang disimpan, bukan yang di-inherit.
    if (siteId !== 'pusat') {
      const pusat = await prisma.site.findUnique({
        where: { id: 'pusat' }
      })
      if (pusat) {
        const siteRecord = site as Record<string, unknown>
        const pusatRecord = pusat as Record<string, unknown>
        for (const field of CORPORATE_ASSET_FIELDS) {
          if (isEmptyValue(siteRecord[field]) && !isEmptyValue(pusatRecord[field])) {
            siteRecord[field] = pusatRecord[field]
          }
        }
      }
    }

    return {
      name: site.name,
      domain: site.domain,
      description: site.description,
      logoUrl: site.logoUrl,
      footerText: site.footerText,
      address: site.address,
      contactEmail: site.contactEmail,
      phone: site.phone,
      aboutUs: site.aboutUs,
      codeOfEthics: site.codeOfEthics,
      editorial: site.editorial,
      advertising: site.advertising,
      privacyPolicy: site.privacyPolicy,
      termsOfService: site.termsOfService,
      mediaSiber: site.mediaSiber,
      socialLinks: site.socialLinks,
      appearance: site.appearance,
      trendingTopics: site.trendingTopics,
      googleIndexingConfig: site.googleIndexingConfig,
      ga4PropertyId: site.ga4PropertyId,
      gscSiteUrl: site.gscSiteUrl,
      wapimredSettings: site.wapimredSettings
    }
  }

  async updateSiteSettings(siteId: string, data: Record<string, unknown>, actorUserId: string) {
    const existing = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!existing) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    if (data.domain && data.domain !== existing.domain) {
      const domainExists = await prisma.site.findFirst({
        where: {
          domain: data.domain as string,
          id: { not: siteId }
        }
      })
      if (domainExists) {
        throw Object.assign(
          new Error(`Domain ${data.domain} already in use by another site`),
          { statusCode: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'domain', 'description', 'logoUrl', 'faviconUrl', 'ogImageUrl', 'footerText',
      'address', 'contactEmail', 'phone', 'aboutUs', 'codeOfEthics',
      'editorial', 'advertising', 'privacyPolicy', 'termsOfService', 'mediaSiber',
      'socialLinks', 'appearance', 'trendingTopics',
      'googleIndexingConfig', 'ga4PropertyId', 'gscSiteUrl', 'wapimredSettings'
    ]

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (['socialLinks', 'appearance', 'trendingTopics', 'googleIndexingConfig'].includes(field) && typeof data[field] === 'object') {
          // Prisma handles objects natively for JSON fields in Postgres
          updateData[field] = data[field]
        } else {
          updateData[field] = data[field]
        }
      }
    }

    await prisma.site.update({
      where: { id: siteId },
      data: updateData as Prisma.SiteUpdateInput
    })

    await this.logAudit(actorUserId, 'site.settings_updated', {
      siteId,
      changes: updateData
    })

    return this.getSiteSettings(siteId) // return standardized format
  }

  async deleteSite(siteId: string, actorUserId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    // Check all tables with ON DELETE RESTRICT foreign keys to Site.
    // PostgreSQL will refuse the delete if any of these have matching rows.
    // Count dependent records. AuditLog entries are allowed to be removed automatically
    // because they are only informational. We therefore delete them first and exclude them
    // from the blockers list.
    // NOTE: Deleting audit logs before the foreign‑key check prevents the 400 error caused
    // by existing audit log rows while still protecting other relational data.
    await prisma.auditLog.deleteMany({ where: { siteId } })

    const checks = await Promise.all([
      prisma.article.count({ where: { siteId } }),
      // auditLog count removed from blockers – already cleared above
      prisma.pageView.count({ where: { siteId } }),
      prisma.media.count({ where: { siteId } }),
      prisma.aIUsage.count({ where: { siteId } }),
      prisma.comment.count({ where: { siteId } }),
      prisma.notification.count({ where: { siteId } }),
      prisma.newsletterSubscriber.count({ where: { siteId } }),
      prisma.kYCViewLog.count({ where: { siteId } }),
      prisma.advertisement.count({ where: { siteId } }),
      prisma.adBooking.count({ where: { siteId } }),
    ])

    const [
      articleCount,
      pageViewCount,
      mediaCount,
      aiUsageCount,
      commentCount,
      notificationCount,
      newsletterCount,
      kycViewLogCount,
      adCount,
      adBookingCount,
    ] = checks

    const blockers: string[] = []
    if (articleCount > 0) blockers.push(`${articleCount} artikel`)
    if (pageViewCount > 0) blockers.push(`${pageViewCount} page view`)
    if (mediaCount > 0) blockers.push(`${mediaCount} media`)
    if (aiUsageCount > 0) blockers.push(`${aiUsageCount} penggunaan AI`)
    if (commentCount > 0) blockers.push(`${commentCount} komentar`)
    if (notificationCount > 0) blockers.push(`${notificationCount} notifikasi`)
    if (newsletterCount > 0) blockers.push(`${newsletterCount} subscriber newsletter`)
    if (kycViewLogCount > 0) blockers.push(`${kycViewLogCount} KYC view log`)
    if (adCount > 0) blockers.push(`${adCount} iklan`)
    if (adBookingCount > 0) blockers.push(`${adBookingCount} booking iklan`)

    if (blockers.length > 0) {
      throw Object.assign(
        new Error(`Tidak bisa menghapus site yang masih memiliki data: ${blockers.join(', ')}. Hapus data terkait terlebih dahulu.`),
        { statusCode: 400 }
      )
    }

    // SiteCategory has ON DELETE CASCADE, so it will be auto-deleted.
    // User.siteId and Category.siteId have ON DELETE SET NULL, safe to delete.
    // AuditLog entries already cleared above.
    await prisma.site.delete({
      where: { id: siteId }
    })

    return { success: true, message: 'Site berhasil dihapus' }
  }

  async assignWapimred(siteId: string, wapimredId: string, actorUserId: string) {
    await this.getSiteById(siteId)

    const user = await prisma.user.findUnique({
      where: { id: wapimredId }
    })

    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 })
    }

    if (user.role !== 'wapimred') {
      throw Object.assign(
        new Error('Only wapimred users can be assigned to a site'),
        { statusCode: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: wapimredId },
      data: { siteId },
      include: { site: true }
    })

    await this.logAudit(actorUserId, 'site.wapimred_assigned', {
      siteId,
      wapimredId,
      wapimredName: user.name
    })

    return updatedUser
  }

  /**
   * GET wapimred settings for a site.
   * Returns defaults if not yet set.
   */
  async getWapimredSettings(siteId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { wapimredSettings: true }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    const defaults = {
      canPublish: false,
      canSchedule: false,
      canForcePublish: false,
      canDeletePublished: false,
      canManageCategories: false,
      canTransferUser: false,
      canDeleteUser: false,
      notifyPimredOnSubmit: true,
      notifyPimredOnApprove: true
    }

    const settings = (site.wapimredSettings as Record<string, boolean>) || {}
    return { ...defaults, ...settings }
  }

  /**
   * UPDATE wapimred settings for a site (superadmin-only).
   * Merges with existing settings.
   */
  async updateWapimredSettings(siteId: string, data: Record<string, boolean>, actorUserId: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    const allowedKeys = ['canPublish', 'canSchedule', 'canForcePublish', 'canDeletePublished', 'canManageCategories', 'canTransferUser', 'canDeleteUser', 'notifyPimredOnSubmit', 'notifyPimredOnApprove']
    const filtered: Record<string, boolean> = {}
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        filtered[key] = data[key]
      }
    }

    const current = (site.wapimredSettings as Record<string, boolean>) || {}
    const merged = { ...current, ...filtered }

    await prisma.site.update({
      where: { id: siteId },
      data: { wapimredSettings: merged }
    })

    await this.logAudit(actorUserId, 'site.wapimred_settings_updated', {
      siteId,
      changes: filtered
    })

    return merged
  }

  // ─────────────────────────────────────────────────
  // Homepage Config — 6 template system
  // ─────────────────────────────────────────────────

  async getHomepageConfig(siteId: string) {
    const config = await prisma.homepageConfig.findUnique({
      where: { siteId }
    })

    // Jika belum ada config, buat default (Design F)
    if (!config) {
      return prisma.homepageConfig.create({
        data: {
          siteId,
          template: 'F',
          heroMode: 'MAGAZINE_COVER_550',
          feedLayout: 'pattern_rotation',
          trendingStyle: 'numbered_podium',
        }
      })
    }

    return config
  }

  async updateHomepageConfig(siteId: string, data: Record<string, unknown>, actorUserId: string) {
    // Validasi site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) throw new AppError('Site tidak ditemukan', 404)

    // Whitelist field yang boleh di-update
    const allowedFields = [
      'template', 'heroMode', 'heroAutoRotate', 'heroIntervalMs',
      'feedLayout', 'trendingStyle',
      'scoreFreshness', 'scoreEngagement', 'scoreEditorial', 'scoreRelevance',
      'opinionCategories', 'photoCategories', 'videoCategories',
      'sectionOrder', 'sectionVisibility', 'feedColumns', 'showExcerpt', 'interstitials',
    ]

    const filtered: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        filtered[key] = data[key]
      }
    }

    // Validasi template value
    if (filtered.template && !['A', 'B', 'C', 'D', 'E', 'F'].includes(filtered.template as string)) {
      throw new AppError('Template harus A, B, C, D, E, atau F', 400)
    }

    // Validasi scoring weights sum to 1.0
    const wFreshness = filtered.scoreFreshness as number | undefined
    const wEngagement = filtered.scoreEngagement as number | undefined
    const wEditorial = filtered.scoreEditorial as number | undefined
    const wRelevance = filtered.scoreRelevance as number | undefined

    if ([wFreshness, wEngagement, wEditorial, wRelevance].some(w => w !== undefined)) {
      const sum = (wFreshness ?? 0.3) + (wEngagement ?? 0.3) + (wEditorial ?? 0.3) + (wRelevance ?? 0.1)
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new AppError(`Total scoring weights harus 1.0, saat ini ${sum.toFixed(2)}`, 400)
      }
    }

    // Upsert config
    const config = await prisma.homepageConfig.upsert({
      where: { siteId },
      create: {
        siteId,
        ...filtered,
      },
      update: filtered,
    })

    // Audit log
    await this.logAudit(actorUserId, 'homepage_config_update', {
      siteId,
      changes: filtered
    })

    return config
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
          newValue: details as Prisma.InputJsonValue
        }
      })
    } catch (error) {
      logger.error('Audit log failed:', error)
    }
  }
}

export const siteService = new SiteService()
