import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./article.repository')
vi.mock('@beritakarya/utils', () => ({
  generateSlug: (t: string) => t.toLowerCase().replace(/\s+/g, '-')
}))
vi.mock('../../modules/notification/notification.controller', () => ({
  sendNotification: vi.fn().mockResolvedValue({})
}))
vi.mock('../../db/client', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    site: { findUnique: vi.fn().mockResolvedValue({ id: 'bandung', domain: 'bandung.beritakarya.co' }) },
    category: { findUnique: vi.fn(), findFirst: vi.fn() },
    article: { update: vi.fn() }
  }
}))
vi.mock('../../services/google-indexing.service', () => ({
  googleIndexingService: {
    submitUrl: vi.fn().mockResolvedValue({ success: true })
  }
}))
vi.mock('./search.service', () => ({
  indexArticle: vi.fn().mockResolvedValue(undefined),
  deleteIndexedArticle: vi.fn().mockResolvedValue(undefined),
  searchArticles: vi.fn()
}))
vi.mock('../../lib/redis', () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  deleteCache: vi.fn().mockResolvedValue(undefined)
}))

import * as repo from './article.repository'
import * as searchService from './search.service'
import { deleteCache } from '../../lib/redis'
import {
  getArticleById, getArticles, createArticle, updateArticle,
  publishArticle, deleteArticle, assertCanPublish
} from './article.service'
import { prisma } from '../../db/client'
import type { JWTPayload } from '@beritakarya/types'
import type { User, Category, Article } from '@prisma/client'

// Derive mock return types from repository function signatures
type ArticleWithDetails = NonNullable<Awaited<ReturnType<typeof repo.findArticleById>>>
type ArticleList = Awaited<ReturnType<typeof repo.findArticlesByIds>>
type CreateVersionReturn = Awaited<ReturnType<typeof repo.createVersion>>
type SoftDeleteReturn = Awaited<ReturnType<typeof repo.softDeleteArticle>>

const reporterBandung: JWTPayload = {
  userId: 'u-1', role: 'reporter', siteId: 'bandung', iat: 0, exp: 0
}
const reporterSurabaya: JWTPayload = {
  userId: 'u-2', role: 'reporter', siteId: 'surabaya', iat: 0, exp: 0
}
const editorPusat: JWTPayload = {
  userId: 'u-3', role: 'wapimred', siteId: null, iat: 0, exp: 0
}

/** Minimal 50 kata — syarat publish setelah fix draft save */
const publishReadyBlocks = () => [
  {
    type: 'paragraph' as const,
    content: Array.from({ length: 50 }, (_, i) => `kata${i + 1}`).join(' ')
  }
]

const mockArticle = (overrides = {}) => ({
  id: 'art-1', title: 'Test', slug: 'test',
  siteId: 'bandung', authorId: 'u-1',
  blocks: [], status: 'draft',
  createdAt: new Date(), updatedAt: new Date(),
  ...overrides
})

describe('getArticles — Meilisearch hydrate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mengambil artikel lengkap dari DB, bukan hit Meilisearch mentah', async () => {
    vi.mocked(searchService.searchArticles).mockResolvedValue({
      hits: [{ id: 'art-1', title: 'partial' }],
      estimatedTotalHits: 1
    })
    vi.mocked(repo.findArticlesByIds).mockResolvedValue([
      mockArticle({ id: 'art-1', viewCount: 42, author: { name: 'Rep', role: 'reporter' } })
    ] as unknown as ArticleList)

    const result = await getArticles('bandung', { search: 'test' })

    expect(repo.findArticlesByIds).toHaveBeenCalledWith('bandung', ['art-1'], {})
    expect(result.items[0]).toMatchObject({ id: 'art-1', viewCount: 42 })
  })
})

describe('getArticleById — multi-site isolation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'reporter', kycStatus: 'APPROVED' } as unknown as User)
  })

  it('throw 404 jika artikel tidak ditemukan di site', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(null)
    const err = await getArticleById('art-1', 'surabaya').catch(e => e)
    expect(err.message).toContain('tidak ditemukan')
    expect(err.statusCode).toBe(404)
  })

  it('berhasil jika artikel ada di site yang benar', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle() as unknown as ArticleWithDetails)
    const result = await getArticleById('art-1', 'bandung')
    expect(result.id).toBe('art-1')
  })
})

describe('createArticle — siteId injection', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'reporter', kycStatus: 'APPROVED' } as unknown as User)
  })

  it('inject siteId dari request, bukan dari body', async () => {
    vi.mocked(repo.slugExists).mockResolvedValue(false)
    vi.mocked(repo.createArticle).mockResolvedValue(mockArticle() as unknown as ArticleWithDetails)

    await createArticle({ title: 'Artikel Baru' }, reporterBandung, 'bandung')

    expect(repo.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'bandung', authorId: 'u-1' })
    )
  })

  it('generate slug unik jika slug sudah ada', async () => {
    vi.mocked(repo.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    vi.mocked(repo.createArticle).mockResolvedValue(mockArticle() as unknown as ArticleWithDetails)

    await createArticle({ title: 'Artikel Baru' }, reporterBandung, 'bandung')

    expect(repo.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'artikel-baru-3' })
    )
  })
})

describe('updateArticle — ownership', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'reporter', kycStatus: 'APPROVED' } as unknown as User)
  })

  it('reporter hanya bisa edit artikel miliknya', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ authorId: 'user-lain' }) as unknown as ArticleWithDetails
    )
    const err = await updateArticle('art-1', 'bandung', { title: 'baru' }, reporterBandung).catch(e => e)
    expect(err.statusCode).toBe(403)
  })

  it('editor pusat bisa edit artikel siapapun', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'wapimred', kycStatus: 'APPROVED' } as unknown as User)
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ authorId: 'user-lain' }) as unknown as ArticleWithDetails
    )
    vi.mocked(repo.slugExists).mockResolvedValue(false)
    vi.mocked(repo.updateArticle).mockResolvedValue(mockArticle() as unknown as ArticleWithDetails)

    await expect(
      updateArticle('art-1', 'bandung', { title: 'baru' }, editorPusat)
    ).resolves.not.toThrow()
  })

  it('resolve category slug to UUID when updating article category', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'wapimred', kycStatus: 'APPROVED' } as unknown as User)
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle({ authorId: 'user-lain' }) as unknown as ArticleWithDetails)
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1' } as unknown as Category)
    vi.mocked(repo.updateArticle).mockResolvedValue(mockArticle() as unknown as ArticleWithDetails)
    vi.mocked(prisma.article.update).mockResolvedValue({} as unknown as Article)

    await updateArticle('art-1', 'bandung', { categoryIds: ['nasional'] }, editorPusat)

    // Phase 2: resolveCategoryId hanya cari kategori lokal (siteId saja)
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: {
        slug: { equals: 'nasional', mode: 'insensitive' },
        siteId: 'bandung'
      }
    })
    // Categories updated via separate prisma.article.update with nested write
    expect(prisma.article.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'art-1' },
      data: expect.objectContaining({
        categories: {
          deleteMany: {},
          create: [{ categoryId: 'cat-1' }]
        }
      })
    }))
  })
})

describe('publishArticle', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'wapimred', kycStatus: 'APPROVED' } as unknown as User)
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: 'bandung',
      domain: 'bandung.beritakarya.co',
      wapimredSettings: { canPublish: true, canSchedule: true, canForcePublish: true }
    } as any)
    vi.mocked(repo.getNextVersionNumber).mockResolvedValue(1)
    vi.mocked(repo.createVersion).mockResolvedValue({ id: 'v-1' } as unknown as CreateVersionReturn)
  })

  it('menolak publish dari status draft', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle({ status: 'draft' }) as unknown as ArticleWithDetails)
    const err = await publishArticle('art-1', 'bandung', editorPusat).catch((e) => e)
    expect(err.statusCode).toBe(400)
  })

  it('set status published dari approved', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ status: 'approved', blocks: publishReadyBlocks() }) as unknown as ArticleWithDetails
    )
    vi.mocked(repo.updateArticle).mockResolvedValue(
      mockArticle({ status: 'published', slug: 'test' }) as unknown as ArticleWithDetails
    )
    await publishArticle('art-1', 'bandung', editorPusat)
    expect(repo.updateArticle).toHaveBeenCalledWith(
      'art-1', 'bandung',
      expect.objectContaining({ status: 'published', publishedAt: expect.any(Date) })
    )
  })

  it('superadmin forcePublish dari draft', () => {
    expect(() =>
      assertCanPublish({ status: 'draft' }, { ...editorPusat, role: 'superadmin' }, true)
    ).not.toThrow()
  })

  it('re-indexes Meilisearch and invalidates Redis cache on publish', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ status: 'approved', blocks: publishReadyBlocks() }) as unknown as ArticleWithDetails
    )
    vi.mocked(repo.updateArticle).mockResolvedValue(
      mockArticle({ status: 'published', slug: 'test' }) as unknown as ArticleWithDetails
    )
    await publishArticle('art-1', 'bandung', editorPusat)
    expect(searchService.indexArticle).toHaveBeenCalled()
    expect(deleteCache).toHaveBeenCalledWith('article:bandung:test')
  })
})

describe('deleteArticle — permission', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'reporter', kycStatus: 'APPROVED' } as unknown as User)
  })

  it('reporter dari site lain tidak bisa delete', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(
      mockArticle({ authorId: 'u-1', siteId: 'bandung' }) as unknown as ArticleWithDetails
    )
    const err = await deleteArticle('art-1', 'bandung', reporterSurabaya).catch(e => e)
    expect(err.statusCode).toBe(403)
  })

  it('reporter bisa soft-delete artikel miliknya sendiri', async () => {
    vi.mocked(repo.findArticleById).mockResolvedValue(mockArticle({ slug: 'test' }) as unknown as ArticleWithDetails)
    vi.mocked(repo.softDeleteArticle).mockResolvedValue({ id: 'art-1', slug: 'test' } as unknown as SoftDeleteReturn)
    await expect(deleteArticle('art-1', 'bandung', reporterBandung)).resolves.not.toThrow()
    expect(repo.softDeleteArticle).toHaveBeenCalledWith('art-1')
    expect(searchService.deleteIndexedArticle).toHaveBeenCalledWith('art-1')
    expect(deleteCache).toHaveBeenCalledWith('article:bandung:test')
  })
})
