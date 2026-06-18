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
    return [
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
