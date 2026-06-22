import { describe, expect, it } from 'vitest'
import { updateArticleSchema } from './article.validator'

describe('updateArticleSchema', () => {
  it('tidak mengubah categoryIds jika field tidak dikirim', () => {
    const parsed = updateArticleSchema.parse({ status: 'submitted' })

    expect(parsed).toEqual({ status: 'submitted' })
    expect(parsed.categoryIds).toBeUndefined()
  })

  it('mengubah categoryId kosong menjadi array kosong', () => {
    const parsed = updateArticleSchema.parse({ categoryId: '' })

    expect(parsed.categoryIds).toEqual([])
  })

  it('mengubah categoryId string tunggal menjadi array', () => {
    const parsed = updateArticleSchema.parse({ categoryId: 'nasional' })

    expect(parsed.categoryIds).toEqual(['nasional'])
  })

  it('menerima categoryIds array langsung', () => {
    const parsed = updateArticleSchema.parse({ categoryIds: ['politik', 'nasional'] })

    expect(parsed.categoryIds).toEqual(['politik', 'nasional'])
  })

  it('menggabungkan categoryId dan categoryIds, dedup', () => {
    const parsed = updateArticleSchema.parse({
      categoryId: 'nasional',
      categoryIds: ['politik', 'nasional', 'ekonomi']
    })

    // nasional sudah ada di categoryIds, jadi tidak di-unshift lagi, hanya dedup
    expect(parsed.categoryIds).toEqual(['politik', 'nasional', 'ekonomi'])
  })

  it('menambahkan categoryId ke depan jika belum ada di categoryIds', () => {
    const parsed = updateArticleSchema.parse({
      categoryId: 'nasional',
      categoryIds: ['politik', 'ekonomi']
    })

    // nasional belum ada → unshift ke index 0
    expect(parsed.categoryIds).toEqual(['nasional', 'politik', 'ekonomi'])
  })
})
