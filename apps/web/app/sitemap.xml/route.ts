import { NextResponse } from 'next/server'
import { generateSiteSitemap, sitemapToXml } from '../../lib/sitemap-shared'

function extractSubdomain(hostname: string): string {
  if (!hostname) return 'pusat'
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  if (isLocalhost) {
    const parts = hostname.split('.')
    if (parts.length > 1 && !parts[0].includes(':') && parts[0] !== 'localhost') {
      return parts[0].toLowerCase()
    }
  } else {
    const parts = hostname.split('.')
    if (parts.length > 2) {
      const sub = parts[0].toLowerCase()
      if (sub !== 'www' && sub !== 'media') {
        return sub
      }
    }
  }
  return 'pusat'
}

export async function GET(req: Request) {
  const host = req.headers.get('host') || 'beritakarya.co'
  const site = extractSubdomain(host)

  try {
    const entries = await generateSiteSitemap(site)
    const xml = sitemapToXml(entries)

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (err) {
    console.error(`[Sitemap Error] Failed to generate sitemap for ${site}:`, err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
