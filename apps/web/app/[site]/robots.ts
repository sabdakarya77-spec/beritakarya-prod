import { MetadataRoute } from 'next'

export default function robots({ params }: { params: { site: string } }): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const siteUrl = `${baseUrl}/${params.site}`

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/login', '/register', '/api/', '/auth/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/login', '/register', '/api/'],
        crawlDelay: 0,
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/uploads/', '/icons/', '/logos/'],
        disallow: ['/dashboard/'],
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot'],
        disallow: '/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
