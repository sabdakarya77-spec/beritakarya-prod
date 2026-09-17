import { describe, it, expect } from 'vitest'
import { sitemapToXml } from './sitemap-shared'

describe('sitemapToXml', () => {
  it('converts Sitemap entries into valid XML string', () => {
    const entries = [
      {
        url: 'https://beritakarya.co/',
        lastModified: new Date('2026-09-17T00:00:00.000Z'),
        changeFrequency: 'hourly' as const,
        priority: 1.0,
        images: ['https://beritakarya.co/logo.png'],
      },
      {
        url: 'https://beritakarya.co/pusat/artikel/test-artikel',
        lastModified: new Date('2026-09-17T05:00:00.000Z'),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ]

    const xml = sitemapToXml(entries)

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(xml).toContain('<loc>https://beritakarya.co/</loc>')
    expect(xml).toContain('<changefreq>hourly</changefreq>')
    expect(xml).toContain('<priority>1.0</priority>')
    expect(xml).toContain('<image:loc>https://beritakarya.co/logo.png</image:loc>')
    expect(xml).toContain('<loc>https://beritakarya.co/pusat/artikel/test-artikel</loc>')
    expect(xml).toContain('<priority>0.7</priority>')
  })

  it('handles XML special character escaping in URLs', () => {
    const entries = [
      {
        url: 'https://beritakarya.co/pusat/artikel/artikel-dengan-&-karakter',
      },
    ]

    const xml = sitemapToXml(entries)
    expect(xml).toContain('<loc>https://beritakarya.co/pusat/artikel/artikel-dengan-&amp;-karakter</loc>')
  })
})
