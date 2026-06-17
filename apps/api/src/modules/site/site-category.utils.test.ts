import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../db/client', () => ({
  prisma: {
    siteCategory: { findMany: vi.fn() },
    category: { findMany: vi.fn() }
  }
}))

import { prisma } from '../../db/client'
import {
  expandWithAncestors,
  getSiteAssignmentFilter
} from './site-category.utils'

describe('expandWithAncestors', () => {
  const index = [
    { id: 'parent', parentId: null },
    { id: 'child', parentId: 'parent' },
    { id: 'grandchild', parentId: 'child' }
  ]

  it('menambahkan semua ancestor dari child terpilih', () => {
    const result = expandWithAncestors(['grandchild'], index)
    expect(result.sort()).toEqual(['child', 'grandchild', 'parent'].sort())
  })

  it('mengembalikan id asli jika sudah root', () => {
    expect(expandWithAncestors(['parent'], index)).toEqual(['parent'])
  })
})

describe('getSiteAssignmentFilter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('isConfigured false jika belum ada assignment', async () => {
    vi.mocked(prisma.siteCategory.findMany).mockResolvedValue([])

    const result = await getSiteAssignmentFilter('bandung')
    expect(result).toEqual({ isConfigured: false })
    expect(prisma.category.findMany).not.toHaveBeenCalled()
  })

  it('isConfigured true dengan expandedGlobalIds', async () => {
    vi.mocked(prisma.siteCategory.findMany).mockResolvedValue([
      { categoryId: 'grandchild' }
    ] as unknown as Awaited<ReturnType<typeof prisma.siteCategory.findMany>>)
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: 'parent', parentId: null },
      { id: 'child', parentId: 'parent' },
      { id: 'grandchild', parentId: 'child' }
    ] as unknown as Awaited<ReturnType<typeof prisma.category.findMany>>)

    const result = await getSiteAssignmentFilter('bandung')
    expect(result.isConfigured).toBe(true)
    if (result.isConfigured) {
      expect(result.expandedGlobalIds.sort()).toEqual(
        ['child', 'grandchild', 'parent'].sort()
      )
    }
  })
})
