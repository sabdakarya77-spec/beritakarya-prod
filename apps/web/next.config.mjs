import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {},
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Curated breakpoints tuned for news content delivery
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 600],
    qualities: [75, 80, 85],
    // Cache optimized images for 30 days (immutable in production)
    minimumCacheTTL: 2592000,
    // Note: 'quality' is not a valid images config key.
    // Default quality is 75 (per Next.js); we override per-context in SmartImage via QUALITY_MAP.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // MinIO via Cloudflare CDN (produksi self-hosted)
      {
        protocol: 'https',
        hostname: 'media.beritakarya.co',
        pathname: '/**',
      },
      // API lokal untuk development (gambar diakses via endpoint proxy jika perlu)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  async redirects() {
    return [
      {
        source: '/:site/dashboard/articles/create',
        destination: '/:site/dashboard/articles/new',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ]
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'

    // CSP directives — sesuaikan dengan environment
    const cspDirectives = [
      "default-src 'self'",
      isProd
        ? "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.beritakarya.co https://beritakarya.co wss://*.beritakarya.co https://www.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googletagmanager.com ws://localhost:*",
      "media-src 'self' https://media.beritakarya.co https://*.beritakarya.co blob:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join('; ')

    return [
      {
        // Security headers untuk SEMUA halaman (termasuk di Vercel)
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
      {
        // Service Worker butuh header Service-Worker-Allowed agar /sw.js
        // bisa di-scope ke path yang lebih dalam (mis. /bandung/, /surabaya/).
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
