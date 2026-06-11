import { describe, it, expect } from 'vitest'
import { normalizeArticleBlocks } from './articleBlocks'

describe('normalizeArticleBlocks', () => {
  it('memperbaiki blok image dari slash menu (hanya type + content)', () => {
    const result = normalizeArticleBlocks([
      { id: 'a1', type: 'image', content: '' }
    ])
    expect(result[0]).toMatchObject({
      id: 'a1',
      type: 'image',
      url: '',
      alt: ''
    })
  })

  it('memperbaiki blok list tanpa items', () => {
    const result = normalizeArticleBlocks([
      { id: 'a2', type: 'list', content: '' }
    ])
    expect(result[0]).toMatchObject({
      type: 'list',
      items: ['']
    })
  })

  it('mengkoersi level heading ke number', () => {
    const result = normalizeArticleBlocks([
      { id: 'a3', type: 'heading', level: '3', content: 'Sub' }
    ])
    expect(result[0]).toMatchObject({ level: 3, content: 'Sub' })
  })
})
