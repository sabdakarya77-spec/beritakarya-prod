import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../db/client', () => ({
  prisma: {
    category: { findMany: vi.fn() }
  }
}))

import { prisma } from '../../db/client'
import { categoryService } from './category.service'

describe('CategoryService — site local filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.category.findMany).mockResolvedValue([])
  })

  it('getSiteCategories hanya mengambil kategori lokal (siteId saja)', async () => {
    await categoryService.getSiteCategories('bandung')

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: 'bandung' }
      })
    )
  })

  it('getSiteCategories tidak mengambil kategori global', async () => {
    await categoryService.getSiteCategories('surabaya')

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: 'surabaya' }
      })
    )

    // Pastikan tidak ada OR dengan isGlobal
    const call = vi.mocked(prisma.category.findMany).mock.calls[0][0] as Record<string, unknown>
    const where = call.where as Record<string, unknown>
    expect(where).not.toHaveProperty('OR')
  })

  it('getCategoryTree menggunakan filter lokal saja', async () => {
    await categoryService.getCategoryTree('surabaya')

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { siteId: 'surabaya' }
      })
    )
  })
})
