import { prisma } from '../../db/client'
import { logger } from '../../lib/logger'

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
      for (const field of CORPORATE_ASSET_FIELDS) {
        if (!isEmptyValue((pusat as any)[field])) {
          corporateDefaults[field] = (pusat as any)[field]
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
          throw new Error(`User ${wapimredId} not found`)
        }

        if (user.role !== 'wapimred') {
          throw new Error(`User ${wapimredId} is not a wapimred`)
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
      trendingTopics: any
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

    const updateData = { ...data }
    if (data.trendingTopics && typeof data.trendingTopics === 'object') {
      updateData.trendingTopics = JSON.stringify(data.trendingTopics)
    }

    const updated = await prisma.site.update({
      where: { id: siteId },
      data: updateData
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
        for (const field of CORPORATE_ASSET_FIELDS) {
          if (isEmptyValue((site as any)[field]) && !isEmptyValue((pusat as any)[field])) {
            ;(site as any)[field] = (pusat as any)[field]
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
      googleIndexingConfig: site.googleIndexingConfig
    }
  }

  async updateSiteSettings(siteId: string, data: any, actorUserId: string) {
    const existing = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!existing) {
      throw Object.assign(new Error('Site not found'), { statusCode: 404 })
    }

    if (data.domain && data.domain !== existing.domain) {
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

    const updateData: any = {}
    const allowedFields = [
      'name', 'domain', 'description', 'logoUrl', 'faviconUrl', 'ogImageUrl', 'footerText',
      'address', 'contactEmail', 'phone', 'aboutUs', 'codeOfEthics',
      'editorial', 'advertising', 'privacyPolicy', 'termsOfService', 'mediaSiber',
      'socialLinks', 'appearance', 'trendingTopics',
      'googleIndexingConfig'
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
      data: updateData
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

    // Check if site has articles before deletion (using count)
    const articleCount = await prisma.article.count({
      where: { siteId: site.id }
    })

    if (articleCount > 0) {
      throw Object.assign(
        new Error('Cannot delete site with existing articles. Archive them first.'),
        { statusCode: 400 }
      )
    }

    await prisma.site.delete({
      where: { id: siteId }
    })

    await this.logAudit(actorUserId, 'site.deleted', {
      siteId
    })

    return { success: true, message: 'Site deleted' }
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

  private async logAudit(
    userId: string,
    action: string,
    details: Record<string, any>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || 'system',
          siteId: details.siteId || 'pusat',
          action,
          entityType: 'site',
          entityId: details.siteId || 'system',
          newValue: details
        }
      })
    } catch (error) {
      logger.error('Audit log failed:', error)
    }
  }
}

export const siteService = new SiteService()