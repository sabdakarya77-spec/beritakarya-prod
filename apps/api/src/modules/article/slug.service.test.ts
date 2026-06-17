import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('./article.repository')

import * as repo from './article.repository'
import {
  isSlugUniqueViolation,
  resolveUniqueSlug,
  createArticleWithSlugRetry
} from './slug.service'

const uniqueError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: '5.0.0'
  })

describe('isSlugUniqueViolation', () => {
  it('returns true for Prisma P2002', () => {
    expect(isSlugUniqueViolation(uniqueError())).toBe(true)
  })

  it('returns false for other errors', () => {
    expect(isSlugUniqueViolation(new Error('other'))).toBe(false)
  })
})

describe('resolveUniqueSlug', () => {
  beforeEach(() => vi.clearAllMocks())

  it('appends counter when slug is taken', async () => {
    vi.mocked(repo.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const slug = await resolveUniqueSlug('Judul Berita', 'bandung')
    expect(slug).toBe('judul-berita-2')
  })

  it('keeps incrementing until the first available slug', async () => {
    vi.mocked(repo.slugExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const slug = await resolveUniqueSlug('Wanita', 'pusat')
    expect(slug).toBe('wanita-6')
  })
})

describe('createArticleWithSlugRetry', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retries with a new slug on P2002 race', async () => {
    vi.mocked(repo.slugExists).mockResolvedValue(false)
    vi.mocked(repo.createArticle)
      .mockRejectedValueOnce(uniqueError())
      .mockResolvedValueOnce({
        id: 'art-1',
        title: 'Test',
        slug: 'test-2',
        siteId: 'bandung'
      } as unknown as Awaited<ReturnType<typeof repo.createArticle>>)

    const result = await createArticleWithSlugRetry({
      title: 'Test',
      slug: 'test',
      siteId: 'bandung',
      authorId: 'u-1'
    })

    expect(result.slug).toBe('test-2')
    expect(repo.createArticle).toHaveBeenCalledTimes(2)
  })
})
