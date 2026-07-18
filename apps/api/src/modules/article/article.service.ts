import * as repo from './article.repository'
import { logger } from '../../lib/logger'
import { AppError } from '../../utils/AppError'
import {
  resolveUniqueSlug,
  createArticleWithSlugRetry,
  updateArticleWithSlugRetry
} from './slug.service'
import type { JWTPayload } from '@beritakarya/types'
import type { ContentType, Prisma } from '@prisma/client'
import { sendNotification } from '../notification/notification.controller'
import { prisma } from '../../db/client'
import { recordView } from '../analytics/analytics.service'
import * as searchService from './search.service'
import { getCache, setCache, deleteCache } from '../../lib/redis'
import { googleIndexingService } from '../../services/google-indexing.service'
import { applySeoDefaults, validateArticleContentLimits, type ArticleBlock } from './content.service'
import { finalizeArticlePublish } from './publish.service'
import { parseArticleBlocks } from './article.validator'

const PUBLISH_ALLOWED_STATUSES = ['approved', 'scheduled'] as const

/** Inferred return type of findPublishedArticleBySlug (for Redis cache). */
type CachedArticle = NonNullable<Awaited<ReturnType<typeof repo.findPublishedArticleBySlug>>>

export function assertCanPublish(
  article: { status: string },
  user: JWTPayload,
  forcePublish?: boolean
): void {
  if (article.status === 'published') {
    throw new AppError('Post sudah terbit', 400)
  }
  if (PUBLISH_ALLOWED_STATUSES.includes(article.status as (typeof PUBLISH_ALLOWED_STATUSES)[number])) {
    return
  }
  if (forcePublish && user.role === 'superadmin') {
    return
  }
  throw new AppError(
    `Post harus berstatus disetujui (approved) atau terjadwal (scheduled) sebelum diterbitkan. Status saat ini: ${article.status}`,
    400
  )
}

export async function getArticles(
  siteId: string,
  query: { status?: string; search?: string; category?: string; startDate?: string; endDate?: string; sort?: string; order?: string; sinceHours?: number; page?: number; limit?: number },
  user?: JWTPayload
) {
  // If search is provided, use Meilisearch
  if (query.search) {
    const searchResult = await searchService.searchArticles(query.search, {
      siteId,
      status: query.status
    })

    if (searchResult?.hits?.length) {
      const ids = searchResult.hits
        .map((hit: { id?: string }) => hit.id)
        .filter((id: string | undefined): id is string => typeof id === 'string')

      const listOpts: { authorId?: string } = {}
      if (user?.role === 'reporter' || user?.role === 'kontributor') {
        listOpts.authorId = user.userId
      }

      const hydrated = await repo.findArticlesByIds(siteId, ids, listOpts)
      const byId = new Map(hydrated.map((a) => [a.id, a] as const))
      const items = ids.flatMap((id: string) => {
        const row = byId.get(id)
        return row ? [row] : []
      })

      const limit = query.limit || 20
      const total = searchResult.estimatedTotalHits ?? items.length
      return {
        items,
        total,
        page: query.page || 1,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    }

    if (searchResult) {
      return {
        items: [],
        total: 0,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: 0
      }
    }
  }

  const opts: { status?: string; search?: string; category?: string; startDate?: string; endDate?: string; sort?: string; order?: string; sinceHours?: number; page?: number; limit?: number; authorId?: string } = { ...query }

  // If user is a reporter or kontributor, they can only see their own articles
  if (user?.role === 'reporter' || user?.role === 'kontributor') {
    opts.authorId = user.userId
  }

  return repo.findArticlesBySite(siteId, opts)
}

export async function getArticleById(id: string, siteId: string, user?: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)

  // Authorization: Reporters and kontributors can only view their own articles (unless published, but dashboard usually shows drafts)
  if (user && !['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role) && article.authorId !== user.userId) {
    throw new AppError('Anda tidak punya akses ke post ini', 403)
  }

  return article
}

export async function getArticleBySlug(slug: string, siteId: string) {
  const article = await repo.findArticleBySlug(slug, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)
  return article
}

export async function getPublishedArticleBySlug(
  slug: string,
  siteId: string,
  meta?: { ipAddress?: string; userAgent?: string; referrer?: string }
) {
  const cacheKey = `article:${siteId}:${slug}`
  const cached = await getCache<CachedArticle>(cacheKey)

  let article = cached
  if (!article) {
    article = await repo.findPublishedArticleBySlug(slug, siteId)
    if (!article) throw new AppError('Post tidak ditemukan', 404)
    await setCache(cacheKey, article, 3600) // Cache for 1 hour
  }

  // Async recording (don't block the response)
  recordView({
    siteId,
    articleId: article.id,
    path: `/artikel/${slug}`,
    ...meta
  }).catch(err => logger.error('Failed to record view:', err))

  return article
}

export async function createArticle(
  input: {
    title: string;
    excerpt?: string;
    blocks?: ArticleBlock[];
    categoryIds?: string[];
    tags?: string[];
    contentType?: string;
    metaTitle?: string;
    metaDescription?: string;
    isBreaking?: boolean;
    isExclusive?: boolean;
    isFeatured?: boolean;
    featuredImage?: string;
    featuredImageCredit?: string;
    coverLayout?: string;
  },
  user: JWTPayload, siteId: string
) {
  try {
    // Fetch fresh user data to check KYC status and current role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, kycStatus: true }
    })

    if (!dbUser) {
      throw new AppError('User tidak ditemukan', 404)
    }

    // Role validation: Readers cannot create articles
    if (dbUser.role === 'reader') {
      throw new AppError('Akses ditolak: Pembaca tidak dapat membuat artikel', 403)
    }

    // KYC validation: Reporters and kontributors must be APPROVED to create articles
    if ((dbUser.role === 'reporter' || dbUser.role === 'kontributor') && dbUser.kycStatus !== 'APPROVED') {
      throw new AppError('Akses ditolak: Verifikasi identitas (KYC) Anda belum disetujui', 403)
    }

    if (input.blocks) {
      try {
        input.blocks = parseArticleBlocks(input.blocks) as typeof input.blocks
      } catch (err) {
        if (err instanceof Error) {
          throw new AppError(`Struktur blok tidak valid: ${err.message}`, 400, 'INVALID_BLOCKS')
        }
        throw err
      }
      validateArticleContentLimits(input.blocks, { contentType: input.contentType })
    }

    const withSeo = applySeoDefaults({
      title: input.title,
      blocks: input.blocks,
      excerpt: input.excerpt,
      metaDescription: input.metaDescription
    })

    const resolvedCategoryIds = await resolveCategoryIds(input.categoryIds || [], siteId)
    const slug = await resolveUniqueSlug(input.title, siteId)
    const article = await createArticleWithSlugRetry({
      title: input.title,
      slug,
      excerpt: input.excerpt?.trim() || undefined,
      siteId,
      authorId: user.userId,
      categoryIds: resolvedCategoryIds,
      tags: input.tags ?? [],
      blocks: (withSeo.blocks ?? []) as unknown as Prisma.InputJsonValue[],
      contentType: (input.contentType as ContentType) ?? 'article',
      metaTitle: input.metaTitle,
      metaDescription: withSeo.metaDescription,
      isBreaking: input.isBreaking ?? false,
      isExclusive: input.isExclusive ?? false,
      isFeatured: input.isFeatured ?? false,
      featuredImage: input.featuredImage ?? '',
      featuredImageCredit: input.featuredImageCredit ?? null,
      coverLayout: input.coverLayout ?? 'left-bottom'
    })

    await repo.createAuditLog({
      userId: user.userId,
      siteId,
      action: 'post.create',
      entityType: 'post',
      entityId: article.id,
      newValue: article
    })

    // Indexing
    searchService.indexArticle(article).catch(err => logger.error('Failed to index article:', err))

    return article
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('[createArticle] Error:', error.message, error.stack ? `\nStack: ${error.stack}` : '')
    throw err
  }
}

export async function updateArticle(
  id: string, siteId: string,
  input: Partial<{
    title: string; excerpt: string; blocks: ArticleBlock[]; metaTitle: string; metaDescription: string;
    categoryIds: string[]; tags: string[]; status: string;
    contentType: string; publishedAt: Date;
    isBreaking: boolean; isExclusive: boolean; isFeatured: boolean;
    featuredImage: string; reviewNotes: string; reviewedBy: string;
  }>,
  user: JWTPayload
) {
  // Fetch fresh user data to check KYC status and current role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true, kycStatus: true }
  })

  if (!dbUser) {
    throw new AppError('User tidak ditemukan', 404)
  }

  // Role validation: Readers cannot update articles
  if (dbUser.role === 'reader') {
    throw new AppError('Akses ditolak: Pembaca tidak dapat mengubah artikel', 403)
  }

  // KYC validation: Reporters and kontributors must be APPROVED to update articles
  if ((dbUser.role === 'reporter' || dbUser.role === 'kontributor') && dbUser.kycStatus !== 'APPROVED') {
    throw new AppError('Akses ditolak: Verifikasi identitas (KYC) Anda belum disetujui', 403)
  }

  const article = await repo.findArticleById(id, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)

  // Authorization
  if (!['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role) && article.authorId !== user.userId) {
    throw new AppError('Anda tidak punya akses ke post ini', 403)
  }

  // [H-006] State Machine Workflow Validation
  const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
    draft: ['submitted', 'deleted'],
    submitted: ['draft', 'approved', 'rejected', 'review', 'revision'],
    review: ['revision', 'approved', 'rejected'],
    revision: ['submitted', 'draft'],
    approved: ['published', 'scheduled', 'draft', 'revision'],
    scheduled: ['published', 'draft'],
    published: ['archived', 'draft'],
    archived: ['published', 'draft'],
    rejected: ['draft', 'submitted']
  }

  if (input.status && input.status !== article.status) {
    const allowed = WORKFLOW_TRANSITIONS[article.status] || []
    if (!allowed.includes(input.status)) {
      throw new AppError(`Transisi status tidak valid: ${article.status} -> ${input.status}`, 400)
    }
  }

  // Prevent reporters and kontributors from setting certain statuses directly
  if ((user.role === 'reporter' || user.role === 'kontributor') && input.status && !['draft', 'submitted'].includes(input.status)) {
     if (article.status !== 'revision' && input.status !== 'submitted') {
        throw new AppError('Hanya Wapimred yang dapat mengubah status ke ' + input.status, 403)
     }
  }

  // Cek toggle canSchedule untuk wewenang manajerial
  if (['wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role) && input.status === 'scheduled') {
    const roleSettingsKey = `${user.role}Settings` as 'wapimredSettings' | 'kaperwilSettings' | 'korwilSettings' | 'kabiroSettings';
    const siteForToggle = await prisma.site.findUnique({
      where: { id: siteId },
      select: { [roleSettingsKey]: true }
    })
    const settings = (siteForToggle?.[roleSettingsKey] as unknown as Record<string, boolean>) || {}
    if (!settings.canSchedule) {
      throw new AppError(
        `${user.role.toUpperCase()} tidak memiliki izin untuk menjadwalkan artikel. Hubungi Pimred.`,
        403
      )
    }
  }

  if (input.blocks) {
    const requireMinWords = input.status === 'submitted'
    try {
      input.blocks = parseArticleBlocks(input.blocks) as typeof input.blocks
    } catch (err) {
      if (err instanceof Error) {
        throw new AppError(`Struktur blok tidak valid: ${err.message}`, 400, 'INVALID_BLOCKS')
      }
      throw err
    }
    const effectiveContentType = input.contentType ?? article.contentType ?? 'article'
    validateArticleContentLimits(input.blocks, { requireMinWords, contentType: effectiveContentType })
  }

  let data: Record<string, unknown> = { ...input }

  // Auto-set publishedAt when transitioning to published (if not already set)
  if (input.status === 'published' && !article.publishedAt && !input.publishedAt) {
    data.publishedAt = new Date()
  }

  // Resolve categoryIds from slug to UUID if provided
  let resolvedCategoryIds: string[] | undefined
  if (input.categoryIds !== undefined) {
    resolvedCategoryIds = await resolveCategoryIds(input.categoryIds, siteId)
  }

  if (input.blocks && !input.metaDescription?.trim()) {
    const withSeo = applySeoDefaults({
      title: input.title || article.title,
      blocks: input.blocks,
      excerpt: input.excerpt,
      metaDescription: input.metaDescription
    })
    if (withSeo.metaDescription) data.metaDescription = withSeo.metaDescription
  }

  // [S-Tier] Propagate blur hash and dominant color if featuredImage is updated
  if ('featuredImage' in input) {
    if (input.featuredImage) {
      const media = await prisma.media.findFirst({
        where: { url: input.featuredImage },
        select: { blurHash: true, dominantColor: true }
      })
      if (media) {
        data.featuredImageBlur = media.blurHash || null
        data.featuredImageColor = media.dominantColor || null
      } else {
        data.featuredImageBlur = null
        data.featuredImageColor = null
      }
    } else {
      data.featuredImageBlur = null
      data.featuredImageColor = null
    }
  }

  // Handle Slug Change
  if (input.title && input.title !== article.title) {
    data.slug = await resolveUniqueSlug(input.title, siteId, id)
  }

  // Auto-calculate word count and reading time if blocks changed
  if (input.blocks) {
    const textContent = input.blocks
      .filter((b: ArticleBlock) => b.type === 'paragraph' || b.type === 'heading')
      .map((b: ArticleBlock) => b.content)
      .join(' ')
    const words = textContent.trim().split(/\s+/).length
    data.wordCount = words
    data.readingTimeMin = Math.max(1, Math.ceil(words / 200))
  }

  // Hapus category fields dari data (sudah tidak ada di schema Article)
  delete data.categoryId
  delete data.categoryIds

  const updated = data.slug
    ? await updateArticleWithSlugRetry(id, siteId, data)
    : await repo.updateArticle(id, siteId, data)

  // Update kategori via join table (atomic nested write)
  if (resolvedCategoryIds !== undefined) {
    await prisma.article.update({
      where: { id },
      data: {
        categories: {
          deleteMany: {},
          create: resolvedCategoryIds.map(catId => ({ categoryId: catId }))
        }
      }
    })
  }

  // Auto-save version on submission
  if (input.status === 'submitted') {
     await saveArticleVersion(id, user.userId, siteId)
  }

  // Notifications
  if (input.status === 'submitted') {
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { name: true }
    })
    const userName = userData?.name || 'User'

    // Ambil toggle notifikasi pimred
    const siteData = await prisma.site.findUnique({
      where: { id: siteId },
      select: { wapimredSettings: true }
    })
    const wapimredSettings = (siteData?.wapimredSettings as Record<string, boolean>) || {}
    const notifyPimredOnSubmit = wapimredSettings.notifyPimredOnSubmit !== false // default true

    // Filter editor berdasarkan toggle
    const editorRoles: string[] = ['wapimred', 'kaperwil', 'korwil', 'kabiro']
    if (notifyPimredOnSubmit) {
      editorRoles.push('superadmin')
    }

    const editors = await prisma.user.findMany({
      where: { siteId, role: { in: editorRoles as any[] } },
      select: { id: true }
    })
    for (const editor of editors) {
      await sendNotification({
        userId: editor.id,
        siteId,
        type: 'post_submitted',
        title: 'Post Baru Masuk Antrian',
        message: `${userName} baru saja mengirim post "${updated.title}" untuk di-review.`,
        link: `/${siteId}/dashboard/review`
      })
    }
  } else if (input.status === 'approved') {
    // Notifikasi ke pimred saat editor approve artikel
    if (['wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)) {
      const roleSettingsKey = `${user.role}Settings` as 'wapimredSettings' | 'kaperwilSettings' | 'korwilSettings' | 'kabiroSettings';
      const siteData = await prisma.site.findUnique({
        where: { id: siteId },
        select: { [roleSettingsKey]: true }
      })
      const settings = (siteData?.[roleSettingsKey] as unknown as Record<string, boolean>) || {}
      if (settings.notifyPimredOnApprove !== false) {
        const superadmins = await prisma.user.findMany({
          where: { siteId, role: 'superadmin' },
          select: { id: true }
        })
        const approverName = (await prisma.user.findUnique({
          where: { id: user.userId },
          select: { name: true }
        }))?.name || 'Wapimred'
        for (const sa of superadmins) {
          await sendNotification({
            userId: sa.id,
            siteId,
            type: 'post_approved',
            title: 'Artikel Disetujui Wapimred',
            message: `${approverName} menyetujui post "${updated.title}". Siap untuk diterbitkan.`,
            link: `/${siteId}/dashboard/review?tab=approved`
          })
        }
      }
    }
  } else if (input.status === 'revision') {
    await sendNotification({
      userId: updated.authorId,
      siteId,
      type: 'post_reviewed',
      title: 'Revisi Diperlukan',
      message: `Editor meminta revisi untuk post "${updated.title}". Catatan: ${input.reviewNotes || 'Cek dashboard.'}`,
      link: `/${siteId}/dashboard/articles/${id}`
    })
  } else if (input.status === 'archived') {
    await sendNotification({
      userId: updated.authorId,
      siteId,
      type: 'post_reviewed',
      title: 'Post Ditolak',
      message: `Maaf, post "${updated.title}" Anda telah ditolak/diarsipkan oleh editor.`,
      link: `/${siteId}/dashboard/articles/${id}`
    })
  }

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.update',
    entityType: 'post',
    entityId: id,
    oldValue: article,
    newValue: updated
  })

  // Re-indexing
  searchService.indexArticle(updated).catch(err => logger.error('Failed to index article:', err))

  // Invalidate cache (old slug too if title/slug changed)
  const invalidateCache = (slug: string) =>
    deleteCache(`article:${siteId}:${slug}`).catch((err) =>
      logger.error(`Failed to invalidate article cache on update (${slug}):`, err)
    )
  await invalidateCache(updated.slug)
  if (article.slug && article.slug !== updated.slug) {
    await invalidateCache(article.slug)
  }

  return updated
}

export async function publishArticle(
  id: string,
  siteId: string,
  user: JWTPayload,
  options?: { forcePublish?: boolean }
) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)

  if (!['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)) {
    throw new AppError('Akses ditolak: Hanya Wapimred, Kaperwil, Korwil, Kabiro, dan Superadmin yang dapat mem-publish post', 403)
  }

  // Cek toggle canPublish dari site settings
  if (['wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)) {
    const roleSettingsKey = `${user.role}Settings` as 'wapimredSettings' | 'kaperwilSettings' | 'korwilSettings' | 'kabiroSettings';
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { [roleSettingsKey]: true }
    })
    const settings = (site?.[roleSettingsKey] as unknown as Record<string, boolean>) || {}
    if (!settings.canPublish) {
      throw new AppError(
        `${user.role.toUpperCase()} tidak memiliki izin untuk menerbitkan artikel. Hubungi Pimred.`,
        403
      )
    }
    // Cek toggle canForcePublish jika menggunakan forcePublish
    if (options?.forcePublish && !settings.canForcePublish) {
      throw new AppError(
        `${user.role.toUpperCase()} tidak memiliki izin untuk force-publish. Hubungi Pimred.`,
        403
      )
    }
  }

  assertCanPublish(article, user, options?.forcePublish)
  validateArticleContentLimits(
    Array.isArray(article.blocks) ? (article.blocks as ArticleBlock[]) : [],
    { requireMinWords: true, contentType: article.contentType ?? 'article' }
  )

  await saveArticleVersion(id, user.userId, siteId)

  return finalizeArticlePublish(id, siteId, article, { userId: user.userId })
}

export async function getDueScheduledArticles(siteId: string, user: JWTPayload) {
  if (!['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)) {
    throw new AppError('Akses ditolak', 403)
  }

  const rows = await repo.findDueScheduledArticles(100)
  return rows.filter((r) => r.siteId === siteId)
}

export async function processDueScheduledArticles(): Promise<{
  published: number
  failed: number
}> {
  const due = await repo.findDueScheduledArticles(50)
  let published = 0
  let failed = 0

  for (const row of due) {
    try {
      const article = await repo.findArticleById(row.id, row.siteId)
      if (!article || article.status !== 'scheduled') continue

      await saveArticleVersion(row.id, row.authorId, row.siteId)
      await finalizeArticlePublish(row.id, row.siteId, article, {
        userId: row.authorId,
        auditAction: 'post.publish.scheduled'
      })
      published++
    } catch (err) {
      failed++
      logger.error(`Scheduled publish failed for ${row.id}:`, err)
    }
  }

  return { published, failed }
}

export async function deleteArticle(id: string, siteId: string, user: JWTPayload) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)

  // [DELETE-PERMISSION] Aturan hapus per-role:
  // - superadmin         : boleh hapus semua status (termasuk published)
  // - wapimred           : boleh hapus semua status KECUALI published
  // - reporter/kontributor: hanya boleh hapus DRAFT MILIK SENDIRI
  // - lainnya            : tidak boleh hapus
  // siteMiddleware + requireSiteAccess sudah memastikan user berada di situs
  // yang sesuai; di sini kita hanya mengatur per-status & ownership.
  const isSuperadmin = user.role === 'superadmin'
  const isWapimred = ['wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)
  const isReporterOrKontributor = user.role === 'reporter' || user.role === 'kontributor'
  const isAuthor = article.authorId === user.userId
  const isPublished = article.status === 'published'
  const isDraft = article.status === 'draft'

  let allowed = false
  let denyReason = 'Akses ditolak'

  if (isSuperadmin) {
    allowed = true
  } else if (isWapimred) {
    if (isPublished) {
      // Cek toggle canDeletePublished dari site settings masing-masing role
      const roleSettingsKey = `${user.role}Settings` as 'wapimredSettings' | 'kaperwilSettings' | 'korwilSettings' | 'kabiroSettings';
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        select: { [roleSettingsKey]: true }
      })
      const settings = (site?.[roleSettingsKey] as unknown as Record<string, boolean>) || {}
      if (settings.canDeletePublished) {
        allowed = true
      } else {
        denyReason = `${user.role.toUpperCase()} tidak dapat menghapus post yang sudah diterbitkan. Hubungi Superadmin.`
      }
    } else {
      allowed = true
    }
  } else if (isReporterOrKontributor) {
    if (!isAuthor) {
      denyReason = 'Anda hanya dapat menghapus post milik sendiri.'
    } else if (!isDraft) {
      denyReason = 'Reporter/Kontributor hanya dapat menghapus post berstatus draft.'
    } else {
      allowed = true
    }
  } else {
    denyReason = 'Peran Anda tidak memiliki izin untuk menghapus post.'
  }

  if (!allowed) {
    throw new AppError(denyReason, 403)
  }

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.delete',
    entityType: 'post',
    entityId: id,
    oldValue: {
      title: article.title,
      slug: article.slug,
      status: article.status,
      authorId: article.authorId,
      actorRole: user.role,
    }
  })

  // Remove from search index and public cache
  searchService.deleteIndexedArticle(id).catch(err =>
    logger.error('Failed to delete indexed article:', err)
  )
  deleteCache(`article:${siteId}:${article.slug}`).catch(err =>
    logger.error('Failed to invalidate article cache on delete:', err)
  )

  return repo.softDeleteArticle(id)
}

export async function getArticleVersions(articleId: string) {
  return repo.findVersions(articleId)
}

export async function saveArticleVersion(articleId: string, authorId: string, siteId: string) {
  const article = await repo.findArticleById(articleId, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)

  const versionNumber = await repo.getNextVersionNumber(articleId)
  return repo.createVersion({
    articleId,
    title: article.title,
    blocks: article.blocks as unknown as Prisma.InputJsonValue[],
    version: versionNumber,
    authorId
  })
}

export async function restoreArticleVersion(versionId: string, siteId: string, user: JWTPayload) {
  const version = await repo.findVersionById(versionId)
  if (!version) throw new AppError('Versi tidak ditemukan', 404)

  const article = await repo.findArticleById(version.articleId, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)

  // Authorization check
  if (!['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role) && article.authorId !== user.userId) {
    throw new AppError('Akses ditolak', 403)
  }

  const updated = await repo.updateArticle(article.id, siteId, {
    title: version.title,
    blocks: version.blocks as unknown as Prisma.InputJsonValue[]
  })

  await repo.createAuditLog({
    userId: user.userId,
    siteId,
    action: 'post.restore_version',
    entityType: 'post',
    entityId: article.id,
    oldValue: article,
    newValue: updated
  })

  return updated
}

export async function getArticleStats(siteId: string, user?: JWTPayload) {
  const where: Prisma.ArticleWhereInput = { siteId, deletedAt: null }

  // If user is a reporter or kontributor, they can only see their own article stats
  if (user?.role === 'reporter' || user?.role === 'kontributor') {
    where.authorId = user.userId
  }

  const counts = await prisma.article.groupBy({
    by: ['status'],
    where,
    _count: { id: true }
  })

  const stats = counts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.id
    return acc
  }, {} as Record<string, number>)

  // Ensure all relevant statuses exist even if 0
  const statuses = ['draft', 'submitted', 'review', 'revision', 'approved', 'published', 'archived']
  statuses.forEach(s => {
    if (stats[s] === undefined) stats[s] = 0
  })

  return stats
}

export async function indexGoogleArticle(id: string, siteId: string) {
  const article = await repo.findArticleById(id, siteId)
  if (!article) throw new AppError('Post tidak ditemukan', 404)
  if (article.status !== 'published') {
    throw new AppError('Hanya artikel yang sudah terbit (Published) yang dapat di-indeks ke Google', 400)
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId }
  })

  if (!site?.domain) {
    throw new AppError(`Domain tidak dikonfigurasi untuk site ${siteId}`, 500)
  }

  const domain = site.domain
  const protocol = domain.includes('localhost') || domain.includes('127.0.0.1') ? 'http' : 'https'
  const articleUrl = `${protocol}://${domain}/artikel/${article.slug}`

  const result = await googleIndexingService.submitUrl(siteId, articleUrl, 'URL_UPDATED')
  return result
}

async function resolveCategoryId(categoryId: string | null | undefined, siteId: string): Promise<string | null> {
  if (!categoryId) return null

  // Check if it's a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)

  if (isUuid) {
    // Phase 2: Only find local categories (site-specific)
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, siteId }
    })
    if (cat) return cat.id
    throw new AppError(`Kategori dengan ID "${categoryId}" tidak ditemukan di site ini`, 400)
  }

  // Otherwise, try to find by slug (case-insensitive)
  // Phase 2: Only look for local categories (site-specific, not global)
  const catBySlug = await prisma.category.findFirst({
    where: {
      slug: { equals: categoryId, mode: 'insensitive' },
      siteId
    }
  })

  if (catBySlug) return catBySlug.id

  // Slug tidak ditemukan — throw error agar tidak silent null
  throw new AppError(`Kategori "${categoryId}" tidak ditemukan di database`, 400)
}

/**
 * Resolve array of category slugs/UUIDs to UUIDs.
 * Wrapper around resolveCategoryId for multi-category support.
 */
async function resolveCategoryIds(categoryIds: string[], siteId: string): Promise<string[]> {
  if (!categoryIds.length) return []

  const resolved: string[] = []
  for (const id of categoryIds) {
    const catId = await resolveCategoryId(id, siteId)
    if (catId) resolved.push(catId)
  }

  if (resolved.length > 3) {
    throw new AppError('Maksimal 3 kategori per artikel', 400)
  }

  return resolved
}
