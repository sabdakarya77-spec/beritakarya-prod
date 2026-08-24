import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 1. Block placeholder query strings that leaked from SearchAction templates (e.g. ?q={search_term_string})
  const rawQuery = req.nextUrl.search
  if (rawQuery.includes('{') || rawQuery.includes('}')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // 2. Reject URLs with special character garbage segments (e.g. /&, /$, /%26, /%24)
  const decodedPath = decodeURIComponent(pathname)
  if (/^(\/&|\/\$|\/\*|\/\+)/.test(decodedPath) || /[^a-zA-Z0-9\-./_]/.test(pathname)) {
    const firstSegment = decodedPath.split('/').filter(Boolean)[0] || ''
    if (/[^a-zA-Z0-9-.]/.test(firstSegment)) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  // 3. Redirect known legacy root paths to proper canonical URLs
  const ROOT_REDIRECTS: Record<string, string> = {
    privacy: '/pusat/kebijakan-privasi',
    terms: '/pusat/p/terms',
    cookies: '/pusat/cookies',
    bantuan: '/pusat/p/about',
    arsip: '/',
  }
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase()
  if (firstSegment && ROOT_REDIRECTS[firstSegment]) {
    return NextResponse.redirect(new URL(ROOT_REDIRECTS[firstSegment], req.url), 301)
  }

  // 4. Redirect auth pages with ?next= query parameters to clean canonical auth pages for bots
  if ((firstSegment === 'login' || firstSegment === 'register') && url.searchParams.has('next')) {
    const cleanUrl = new URL(`/${firstSegment}`, req.url)
    return NextResponse.redirect(cleanUrl, 301)
  }

  // 5. Guard /dashboard routes
  const token = req.cookies.get('accessToken')?.value
  const isDashboardRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    /^\/[a-zA-Z0-9-]+\/dashboard(?:\/|$)/.test(pathname)

  if (isDashboardRoute && !token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|robots.txt|sitemap.xml|ads.txt).*)'],
}
