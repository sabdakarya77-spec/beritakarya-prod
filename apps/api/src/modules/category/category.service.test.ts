import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../db/client', () => ({
  prisma: {
    category: { findMany: vi.fn() }
  }
}))

vi.mock('../site/site-category.utils', () => ({
  getSiteAssignmentFilter: vi.fn()
}))

import { prisma } from '../../db/client'
import { getSiteAssignmentFilter } from '../site/site-category.utils'
import { categoryService } from './category.service'

describe('CategoryService — site assignment filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
  })

  it('getSiteCategories memakai query legacy jika site belum dikonfigurasi', async () => {
    vi.mocked(getSiteAssignmentFilter).mockResolvedValue({ isConfigured: false })

    await categoryService.getSiteCategories('bandung')

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ siteId: 'bandung' }, { isGlobal: true }]
        }
      })
    )
  })

  it('getSiteCategories memfilter global ke expanded IDs jika dikonfigurasi', async () => {
    vi.mocked(getSiteAssignmentFilter).mockResolvedValue({
      isConfigured: true,
      expandedGlobalIds: ['cat-1', 'cat-2']
    })

    await categoryService.getSiteCategories('surabaya')

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { siteId: 'surabaya' },
            { isGlobal: true, id: { in: ['cat-1', 'cat-2'] } }
          ]
        }
      })
    )
  })

  it('getCategoryTree memakai filter yang sama', async () => {
    vi.mocked(getSiteAssignmentFilter).mockResolvedValue({
      isConfigured: true,
      expandedGlobalIds: ['root']
    })

    await categoryService.getCategoryTree('surabaya')

    expect(getSiteAssignmentFilter).toHaveBeenCalledWith('surabaya')
    expect(prisma.category.findMany).toHaveBeenCalled()
  })
})
