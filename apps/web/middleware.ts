import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware — Server-side route protection.
 *
 * Melindungi route /dashboard/* dengan memeriksa keberadaan token cookie.
 * Role-based check tetap dilakukan di client-side (layout + useRequireRole hook)
 * karena token JWT berisi role yang perlu di-decode.
 *
 * Middleware ini hanya melakukan "gate check" cepat:
 * - Jika tidak ada token → redirect ke login
 * - Jika ada token → lanjutkan (role check di client)
 */

// Route publik yang TIDAK perlu proteksi
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/p/',        // public pages (terms, ads, etc.)
  '/artikel/',  // public articles
  '/penulis/',  // public author pages
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.includes(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware untuk non-dashboard routes
  if (!pathname.includes('/dashboard')) {
    return NextResponse.next();
  }

  // Skip untuk public paths (shouldn't happen for /dashboard, but safety check)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Cek token cookie — support both 'token' dan 'accessToken' nama cookie
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('accessToken')?.value;

  if (!token) {
    // Extract site dari pathname: /{site}/dashboard → {site}
    const segments = pathname.split('/').filter(Boolean);
    const site = segments[0] || 'pusat';

    const loginUrl = new URL(`/${site}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:site/dashboard/:path*'],
};
