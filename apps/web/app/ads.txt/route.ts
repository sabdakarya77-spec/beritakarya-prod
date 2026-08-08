import { NextResponse } from 'next/server'

/**
 * ads.txt — Google AdSense verification
 * Berlaku untuk root domain dan semua subdomain (multi-tenant).
 * Format: google.com, <publisher-id>, DIRECT, f08c47fec0942fa0
 */
export function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'pub-XXXXXXXXXXXXXXXX'

  const content = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}