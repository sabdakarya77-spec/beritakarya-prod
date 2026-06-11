import { describe, expect, it } from 'vitest'
import { updateArticleSchema } from './article.validator'

describe('updateArticleSchema', () => {
  it('tidak mengubah categoryId menjadi null jika field tidak dikirim', () => {
    const parsed = updateArticleSchema.parse({ status: 'submitted' })

    expect(parsed).toEqual({ status: 'submitted' })
    expect(parsed.categoryId).toBeUndefined()
  })

  it('mengubah categoryId kosong menjadi null saat memang ingin menghapus kategori', () => {
    const parsed = updateArticleSchema.parse({ categoryId: '' })

    expect(parsed.categoryId).toBeNull()
  })
})
