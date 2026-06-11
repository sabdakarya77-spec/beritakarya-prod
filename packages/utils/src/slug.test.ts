import { describe, it, expect } from 'vitest'
import { generateSlug } from './slug'

describe('generateSlug', () => {
  it('lowercase dan replace spasi dengan dash', () => {
    expect(generateSlug('BeritaKarya Terbaru Hari Ini')).toBe('beritakarya-terbaru-hari-ini')
  })

  it('hapus karakter non-alphanumeric', () => {
    expect(generateSlug('BeritaKarya v2.0 Launch!')).toBe('beritakarya-v20-launch')
  })

  it('handle multiple spasi', () => {
    expect(generateSlug('beritakarya  terbaru')).toBe('beritakarya-terbaru')
  })

  it('handle leading/trailing spasi', () => {
    expect(generateSlug('  beritakarya terbaru  ')).toBe('beritakarya-terbaru')
  })

  it('handle karakter beraksara latin (é, ü, dll)', () => {
    expect(generateSlug('BeritaKarya Café')).toBe('beritakarya-cafe')
  })

  it('tidak menghasilkan double dash', () => {
    const result = generateSlug('beritakarya -- terbaru')

    expect(result).not.toContain('--')
  })
})
