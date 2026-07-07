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

  describe('mediaText', () => {
    it('mempertahankan width/height untuk hitung rasio aspek (anti-cropping)', () => {
      const result = normalizeArticleBlocks([
        {
          id: 'm1',
          type: 'mediaText',
          url: '/uploads/abc.jpg',
          alt: 'Foto',
          content: 'Teks',
          align: 'left',
          width: 1600,
          height: 900,
          caption: 'Keterangan foto'
        }
      ])
      expect(result[0]).toMatchObject({
        id: 'm1',
        type: 'mediaText',
        width: 1600,
        height: 900,
        caption: 'Keterangan foto',
        align: 'left'
      })
    })

    it('menerima layout "center" (tidak dipaksa ke "left")', () => {
      const result = normalizeArticleBlocks([
        {
          id: 'm2',
          type: 'mediaText',
          url: '/uploads/abc.jpg',
          alt: '',
          content: 'Teks',
          align: 'center'
        }
      ])
      expect(result[0]?.align).toBe('center')
    })

    it('menjaga caption agar tidak hilang saat normalisasi', () => {
      const result = normalizeArticleBlocks([
        {
          id: 'm3',
          type: 'mediaText',
          url: '/uploads/abc.jpg',
          alt: '',
          content: 'Teks',
          align: 'right',
          caption: '  Spasi dibersihkan  '
        }
      ])
      // caption tetap diteruskan apa adanya (whitespace trimming adalah tanggung
      // jawab convertTiptapToBlocks, bukan normalizer)
      expect(result[0]?.caption).toBe('  Spasi dibersihkan  ')
    })

    it('mengabaikan width/height yang tidak valid (0 / NaN)', () => {
      const result = normalizeArticleBlocks([
        {
          id: 'm4',
          type: 'mediaText',
          url: '',
          alt: '',
          content: '',
          align: 'left',
          width: 0,
          height: 'abc'
        }
      ])
      expect(result[0]).not.toHaveProperty('width')
      expect(result[0]).not.toHaveProperty('height')
    })
  })
})
