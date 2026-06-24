import { describe, it, expect } from 'vitest'
import {
  extractTextFromBlocks,
  buildMetaDescriptionExcerpt,
  validateArticleContentLimits,
  applySeoDefaults
} from './content.service'

describe('content.service', () => {
  it('extractTextFromBlocks joins paragraph and heading', () => {
    const text = extractTextFromBlocks([
      { type: 'paragraph', content: 'Paragraf satu.' },
      { type: 'heading', content: 'Judul Bagian' }
    ])
    expect(text).toContain('Paragraf satu.')
    expect(text).toContain('Judul Bagian')
  })

  it('buildMetaDescriptionExcerpt truncates long text', () => {
    const long = 'a'.repeat(200)
    const excerpt = buildMetaDescriptionExcerpt([
      { type: 'paragraph', content: long }
    ])
    expect(excerpt.length).toBeLessThanOrEqual(160)
    expect(excerpt.endsWith('...')).toBe(true)
  })

  it('applySeoDefaults does not auto-fill metaDescription (manual only)', () => {
    const result = applySeoDefaults({
      title: 'Judul',
      blocks: [{ type: 'paragraph', content: 'Isi artikel untuk SEO.' }]
    })
    expect(result.metaDescription).toBeUndefined()
  })

  it('applySeoDefaults preserves metaDescription when provided', () => {
    const result = applySeoDefaults({
      title: 'Judul',
      metaDescription: 'Deskripsi manual dari user',
      blocks: [{ type: 'paragraph', content: 'Isi artikel.' }]
    })
    expect(result.metaDescription).toBe('Deskripsi manual dari user')
  })

  it('validateArticleContentLimits rejects too many blocks', () => {
    const blocks = Array.from({ length: 201 }, (_, i) => ({
      type: 'paragraph' as const,
      content: `block ${i}`
    }))
    expect(() => validateArticleContentLimits(blocks)).toThrow(/200 blok/)
  })

  it('allows short draft content without requireMinWords', () => {
    const blocks = [{ type: 'paragraph' as const, content: 'Draft singkat.' }]
    expect(() => validateArticleContentLimits(blocks)).not.toThrow()
  })

  it('rejects short content when requireMinWords is set', () => {
    const blocks = [{ type: 'paragraph' as const, content: 'Draft singkat.' }]
    expect(() => validateArticleContentLimits(blocks, { requireMinWords: true })).toThrow(/50 kata/)
  })
})
