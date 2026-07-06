import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const hostname = req.headers.get('host') || ''

  // bandung.localhost:3000 -> bandung
  // bandung.beritakarya.co -> bandung
  // beritakarya.co -> '' (pusat)

  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  let subdomain = ''
  if (isLocalhost) {
    // Handle bandung.localhost:3000 or localhost:3000
    const parts = hostname.split('.')
    if (parts.length > 1 && !parts[0].includes(':') && parts[0] !== 'localhost') {
      subdomain = parts[0]
    }
  } else {
    // Handle bandung.beritakarya.co, beritakarya.co
    const parts = hostname.split('.')
    if (parts.length > 2) {
      subdomain = parts[0]
    }
  }

  let siteId = subdomain

  const url = req.nextUrl.clone()

  // [FIX-MULTISITE] Deteksi site dari URL path ketika tidak ada subdomain.
  // Contoh: /nganjuk/dashboard → siteId = 'nganjuk'
  // Path root yang BUKAN site prefix (login, register, dll) di-skip.
  const RESERVED_ROOT_SEGMENTS = new Set([
    'login', 'register', 'forgot-password', 'reset-password',
    'sitemap.xml', 'robots.txt', 'manifest.webmanifest', 'dashboard',
    'api', '_next', 'favicon.ico',
  ])
  const SITE_SUBPATHS = new Set([
    'dashboard', 'artikel', 'penulis', 'p', 'kebijakan-privasi',
  ])
  const pathSegmentsForSite = url.pathname.split('/').filter(Boolean)
  let siteFromPath: string | null = null
  if (pathSegmentsForSite.length > 0) {
    const firstSeg = pathSegmentsForSite[0]
    if (firstSeg && /^[a-zA-Z0-9-]+$/.test(firstSeg)) {
      const isMultiSegment = pathSegmentsForSite.length >= 2
      const isSingleReserved = pathSegmentsForSite.length === 1 && RESERVED_ROOT_SEGMENTS.has(firstSeg)
      if (isMultiSegment) {
        // /[site]/[known_subpath]/...  → pasti site
        if (SITE_SUBPATHS.has(pathSegmentsForSite[1])) {
          siteFromPath = firstSeg
        }
      } else if (!isSingleReserved) {
        // /[site] → home page sebuah site (mis. /nganjuk)
        siteFromPath = firstSeg
      }
    }
  }

  if (isLocalhost) {
    // Prioritaskan ?site= parameter untuk testing manual tanpa edit hosts
    const siteParam = req.nextUrl.searchParams.get('site')
    if (siteParam) {
      siteId = siteParam
    } else if (siteFromPath) {
      // [FIX] Pakai site dari path, BUKAN default 'pusat'
      siteId = siteFromPath
    } else if (!subdomain || subdomain === 'www') {
      siteId = 'pusat'
    }
  } else {
    if (siteFromPath) {
      // [FIX] Subdomain tidak ada tapi path punya site → pakai path
      siteId = siteFromPath
    } else if (!subdomain || subdomain === 'www') {
      siteId = 'pusat'
    }
  }

  // Sanitize siteId: only alphanumeric and hyphens allowed to prevent issues like 'pusat:1'
  const rawSiteId = siteId
  siteId = siteId.replace(/[^a-zA-Z0-9-]/g, '') || 'pusat'

  const pathname = url.pathname

  // Redirect known alternative root paths to proper site-scoped paths.
  // Prevents Google from indexing /privacy, /terms, /cookies etc. as noindex pages.
  const ROOT_REDIRECTS: Record<string, string> = {
    'privacy': 'kebijakan-privasi',
    'terms': 'p/terms',
    'cookies': 'cookies',
  }
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase()
  if (firstSegment && ROOT_REDIRECTS[firstSegment] && !subdomain) {
    const target = `/${siteId}/${ROOT_REDIRECTS[firstSegment]}`
    return NextResponse.redirect(new URL(target, req.url), 301)
  }

  // Reject paths with encoded special characters (e.g. /%26, /%24, /&).
  // These get sanitized away in siteId but still render pages Google shouldn't index.
  // NOTE: dots (.) are intentionally allowed so static files like
  // /manifest.webmanifest, /robots.txt, /sitemap.xml are not blocked.
  if (rawSiteId !== siteId || /[^a-zA-Z0-9\-./_]/.test(pathname)) {
    const decoded = decodeURIComponent(pathname).replace(/\/+$/, '')
    const decodedFirst = decoded.split('/').filter(Boolean)[0] || ''
    if (/[^a-zA-Z0-9-.]/.test(decodedFirst) || rawSiteId !== siteId) {
      const notFoundUrl = new URL(`/${siteId}/404-not-found`, req.url)
      return NextResponse.rewrite(notFoundUrl)
    }
  }

  // Guard both `/dashboard` and `/{site}/dashboard` URLs before they reach the app.
  const token = req.cookies.get('accessToken')?.value
  const isDashboardRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    /^\/[a-zA-Z0-9-]+\/dashboard(?:\/|$)/.test(pathname)

  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  const res = NextResponse.next()
  res.cookies.set('siteId', siteId, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  })
  res.headers.set('x-site-id', siteId)

  // Internal rewrite:
  // Point '/', '/dashboard', '/sitemap.xml', '/robots.txt' ke '/[siteId]/...' secara internal
  const shouldRewrite =
    url.pathname === '/' ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt'

  if (shouldRewrite) {
    url.pathname = `/${siteId}${url.pathname === '/' ? '' : url.pathname}`
    const rewriteRes = NextResponse.rewrite(url)

    rewriteRes.cookies.set('siteId', siteId, {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })
    rewriteRes.headers.set('x-site-id', siteId)

    return rewriteRes
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
