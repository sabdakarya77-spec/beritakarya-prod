import { MetadataRoute } from 'next'
import { API_URL } from './api'
import { ALL_LEGAL_PAGES } from './legalPages'

const SITEMAP_MAX_PAGES = 50 // Safety cap
const DEFAULT_IMAGE = '/logo.png'

interface SitemapArticle {
  slug: string
  publishedAt?: string
  updatedAt?: string
  featuredImage?: string | null
  blocks?: Array<{ type?: string; url?: string }>
}

async function getArticles(site: string) {
  const all: SitemapArticle[] = []

  try {
    for (let page = 1; page <= SITEMAP_MAX_PAGES; page++) {
      const params = new URLSearchParams({
        site,
        limit: '1000',
        page: String(page),
      })
      const res = await fetch(`${API_URL}/api/v1/articles/public?${params.toString()}`, {
        cache: 'no-store',
      })
      if (!res.ok) break

      const json = await res.json()
      const data = json.data
      const items = data?.articles || data?.items || []
      all.push(...items)

      const totalPages = data?.totalPages ?? 1
      if (page >= totalPages || items.length === 0) break
    }
  } catch {
    return []
  }

  return all
}

async function getCategories(site: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/categories?site=${site}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

async function getAuthors(site: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/users/authors?site=${site}&limit=200`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

function toAbsolute(baseUrl: string, path: string) {
  if (path.startsWith('http')) return path
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function sitemapToXml(entries: MetadataRoute.Sitemap): string {
  const xmlEntries = entries
    .map((entry) => {
      const loc = `<loc>${escapeXml(entry.url)}</loc>`
      const lastmod = entry.lastModified
        ? `<lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : new Date(entry.lastModified).toISOString()}</lastmod>`
        : ''
      const changefreq = entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : ''
      const priority = entry.priority !== undefined ? `<priority>${entry.priority.toFixed(1)}</priority>` : ''

      const images = (entry.images || [])
        .map((img) => `<image:image><image:loc>${escapeXml(img)}</image:loc></image:image>`)
        .join('')

      return `<url>${loc}${lastmod}${changefreq}${priority}${images}</url>`
    })
    .join('\n  ')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n  ${xmlEntries}\n</urlset>`
}

export async function generateSiteSitemap(site: string): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  // Resolve the correct public URL for this site:
  // - pusat  → https://beritakarya.co  (main domain)
  // - jombang → https://jombang.beritakarya.co  (subdomain)
  const protocol = baseUrl.startsWith('https') ? 'https' : 'http'
  const rootDomain = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
  const siteUrl = site === 'pusat'
    ? `${baseUrl}/pusat`
    : `${protocol}://${site}.${rootDomain}`

  const [articles, authors] = await Promise.all([
    getArticles(site),
    getAuthors(site),
  ])

  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: site === 'pusat' ? `${baseUrl}/` : `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
      images: [toAbsolute(baseUrl, DEFAULT_IMAGE)],
    },
  ]

  // Legal pages
  entries.push({
    url: `${siteUrl}/kebijakan-privasi`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  })
  entries.push({
    url: `${siteUrl}/cookies`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  })

  // Legal/info pages (/p/*)
  ALL_LEGAL_PAGES.forEach((page) => {
    const href = page.href(site)
    const subPath = href.replace(new RegExp(`^\\/${site}`), '') || '/'
    entries.push({
      url: `${siteUrl}${subPath}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  })

  // Authors index
  entries.push({
    url: `${siteUrl}/penulis`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  })

  // Author profiles
  authors.forEach((author: { id: string; updatedAt?: string }) => {
    if (!author?.id) return
    entries.push({
      url: `${siteUrl}/penulis/${author.id}`,
      lastModified: author.updatedAt ? new Date(author.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  })

  // Articles
  articles.forEach((article: {
    slug: string
    publishedAt?: string
    updatedAt?: string
    featuredImage?: string | null
    blocks?: Array<{ type?: string; url?: string }>
  }) => {
    if (!article?.slug) return
    const cleanSlug = article.slug.toLowerCase().trim()
    if (
      cleanSlug.startsWith('uji-coba') ||
      cleanSlug.startsWith('test-') ||
      cleanSlug.startsWith('dummy-') ||
      cleanSlug === 'test'
    ) {
      return
    }
    const image = article.featuredImage ||
      (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
      DEFAULT_IMAGE
    entries.push({
      url: `${siteUrl}/artikel/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt || now),
      changeFrequency: 'weekly',
      priority: 0.7,
      images: [toAbsolute(baseUrl, image)],
    })
  })

  return entries
}
