import { prisma } from '../../db/client'
import type { Prisma, ArticleStatus, ContentType } from '@prisma/client'

/** Active articles only — excludes soft-deleted rows. */
export const articleNotDeleted: Prisma.ArticleWhereInput = { deletedAt: null }

export async function findArticlesBySite(
  siteId: string,
  opts: { status?: string; search?: string; category?: string; page?: number; limit?: number; authorId?: string } = {}
) {
  const { status, search, category, page = 1, limit = 20, authorId } = opts
  const categoryFilter: Prisma.ArticleWhereInput = {}

  if (category) {
    const catRecord = await prisma.category.findFirst({
      where: {
        AND: [
          {
            OR: [
              { name: { equals: category, mode: 'insensitive' } },
              { slug: { equals: category, mode: 'insensitive' } }
            ]
          },
          {
            OR: [
              { siteId },
              { isGlobal: true }
            ]
          }
        ]
      },
      include: {
        subCategories: {
          select: { id: true }
        }
      }
    })
    
    if (catRecord) {
      const ids = [catRecord.id, ...catRecord.subCategories.map((sub: { id: string }) => sub.id)]
      categoryFilter.categoryId = { in: ids }
    } else {
      categoryFilter.categoryId = { in: [] }
    }
  }

  const where: Prisma.ArticleWhereInput = {
    siteId,
    ...articleNotDeleted,
    ...(status && { status: status as ArticleStatus }),
    ...(authorId && { authorId }),
    ...categoryFilter,
    ...(search && { 
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { blocks: { path: ['$'], string_contains: search } }
      ]
    })
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
        siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
        isBreaking: true, isExclusive: true, isFeatured: true,
        featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
        viewCount: true, wordCount: true, readingTimeMin: true,
        blocks: true, tags: true, metaTitle: true, metaDescription: true,
        contentType: true,
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.article.count({ where })
  ])
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function findArticlesByIds(
  siteId: string,
  ids: string[],
  opts: { authorId?: string } = {}
) {
  if (ids.length === 0) return []

  return prisma.article.findMany({
    where: {
      id: { in: ids },
      siteId,
      ...articleNotDeleted,
      ...(opts.authorId && { authorId: opts.authorId })
    },
    select: {
      id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
      siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
      isBreaking: true, isExclusive: true, isFeatured: true,
      featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
      viewCount: true, wordCount: true, readingTimeMin: true,
      blocks: true, tags: true, metaTitle: true, metaDescription: true,
      contentType: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function findDueScheduledArticles(limit = 50) {
  return prisma.article.findMany({
    where: {
      status: 'scheduled',
      ...articleNotDeleted,
      scheduledAt: { lte: new Date() }
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
    select: {
      id: true,
      siteId: true,
      authorId: true,
      slug: true,
      title: true,
      status: true
    }
  })
}

export async function findArticleById(id: string, siteId: string) {
  return prisma.article.findFirst({
    where: { id, siteId, ...articleNotDeleted },
    select: {
      id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
      siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
      isBreaking: true, isExclusive: true, isFeatured: true,
      featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
      viewCount: true, wordCount: true, readingTimeMin: true,
      blocks: true, tags: true, metaTitle: true, metaDescription: true,
      contentType: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, email: true, role: true } }
    }
  })
}

export async function findArticleBySlug(slug: string, siteId: string) {
  return prisma.article.findFirst({
    where: { siteId, slug, ...articleNotDeleted },
    select: {
      id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
      siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
      isBreaking: true, isExclusive: true, isFeatured: true,
      featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
      viewCount: true, wordCount: true, readingTimeMin: true,
      blocks: true, tags: true, metaTitle: true, metaDescription: true,
      contentType: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function findPublishedArticleBySlug(slug: string, siteId: string) {
  return prisma.article.findFirst({
    where: { siteId, slug, status: 'published', ...articleNotDeleted },
    select: {
      id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
      siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
      isBreaking: true, isExclusive: true, isFeatured: true,
      featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
      viewCount: true, wordCount: true, readingTimeMin: true,
      blocks: true, tags: true, metaTitle: true, metaDescription: true,
      contentType: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function createArticle(data: {
  title: string; slug: string; excerpt?: string; siteId: string
  authorId: string; categoryId?: string | null; tags?: any; blocks?: any[]
  contentType?: ContentType;
  metaTitle?: string; metaDescription?: string
  isBreaking?: boolean; isExclusive?: boolean; isFeatured?: boolean;
  featuredImage?: string;
}) {
  return prisma.article.create({
    data: { ...data, blocks: data.blocks ?? [] },
    select: {
      id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
      siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
      isBreaking: true, isExclusive: true, isFeatured: true,
      featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
      viewCount: true, wordCount: true, readingTimeMin: true,
      blocks: true, tags: true, metaTitle: true, metaDescription: true,
      contentType: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function updateArticle(
  id: string, siteId: string,
  data: Partial<{
    title: string; slug: string; excerpt: string; blocks: any[]; metaTitle: string; metaDescription: string;
    status: string; categoryId: string | null; tags: any;
    contentType: ContentType;
    isBreaking: boolean; isExclusive: boolean; isFeatured: boolean;
    wordCount: number; readingTimeMin: number; publishedAt: Date;
    scheduledAt: Date | null;
    reviewNotes: string; reviewedBy: string; reviewedAt: Date;
    featuredImage: string; featuredImageBlur?: string | null; featuredImageColor?: string | null;
  }>
) {
  return prisma.article.update({
    where: { id },
    data: data as any,
    select: {
      id: true, title: true, slug: true, excerpt: true, categoryId: true, status: true,
      siteId: true, authorId: true, publishedAt: true, createdAt: true, updatedAt: true,
      isBreaking: true, isExclusive: true, isFeatured: true,
      featuredImage: true, featuredImageBlur: true, featuredImageColor: true,
      viewCount: true, wordCount: true, readingTimeMin: true,
      blocks: true, tags: true, metaTitle: true, metaDescription: true,
      contentType: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function softDeleteArticle(id: string) {
  return prisma.article.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, title: true, slug: true, siteId: true }
  })
}

/** @deprecated Use softDeleteArticle — kept as alias for callers migrating gradually. */
export const deleteArticle = softDeleteArticle

export async function slugExists(slug: string, siteId: string, excludeId?: string) {
  const article = await prisma.article.findFirst({
    where: {
      slug,
      siteId,
      ...(excludeId && { id: { not: excludeId } })
    },
    select: { id: true }
  })
  return !!article
}

export async function createAuditLog(data: {
  userId: string; siteId: string; action: string;
  entityType: string; entityId: string;
  oldValue?: any; newValue?: any;
}) {
  return (prisma as any).auditLog.create({ data })
}

export async function createVersion(data: {
  articleId: string; title: string; blocks: any[]; version: number; authorId: string
}) {
  return prisma.articleVersion.create({ data })
}

export async function incrementViewCount(id: string) {
  return prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  })
}

export async function findVersions(articleId: string) {
  return prisma.articleVersion.findMany({
    where: { articleId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, version: true, createdAt: true, authorId: true
    }
  })
}

export async function findVersionById(id: string) {
  return prisma.articleVersion.findUnique({ where: { id } })
}

export async function getNextVersionNumber(articleId: string) {
  const last = await prisma.articleVersion.findFirst({
    where: { articleId },
    orderBy: { version: 'desc' }
  })
  return (last?.version || 0) + 1
}
