import { NextResponse } from 'next/server'

/**
 * robots.txt — Crawler Directives & Crawl Budget Optimization
 * Berlaku untuk root domain (beritakarya.co) dan seluruh subdomain (multi-tenant).
 */
export function GET(req: Request) {
  const host = req.headers.get('host') || 'beritakarya.co'
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
  const baseUrl = process.env.NEXT_PUBLIC_URL || `${protocol}://${host}`

  const content = `# ==========================================
# BeritaKarya Robots.txt
# Standard Crawling Directives for Search Engines
# ==========================================

User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /login
Disallow: /register
Disallow: /api/
Disallow: /auth/
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /verify-email
Disallow: /*?q=*
Disallow: /*?site=*
Disallow: /_next/static/media/

# Dedicated Bot Rules
User-agent: Googlebot
Allow: /
Allow: /_next/static/
Allow: /_next/image
Allow: /uploads/
Disallow: /dashboard/
Disallow: /login
Disallow: /register
Disallow: /api/
Disallow: /auth/
Disallow: /*?q=*
Disallow: /*?site=*
Disallow: /_next/static/media/

User-agent: Googlebot-Image
Allow: /uploads/
Allow: /icons/
Allow: /logos/
Allow: /_next/image
Disallow: /dashboard/
Disallow: /api/

# Aggressive Crawlers Block
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

# Sitemap & Host
Sitemap: ${baseUrl}/sitemap.xml
Host: ${baseUrl}
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
