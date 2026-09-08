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

export async function generateSiteSitemap(site: string): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  // Resolve the correct public URL for this site:
  // - pusat  → https://beritakarya.co  (main domain)
  // - jombang → https://jombang.beritakarya.co  (subdomain)
  // Using the subdomain URL ensures sitemap URLs match what Google actually crawls,
  // preventing 404s caused by sitemap pointing to beritakarya.co/jombang/artikel/xxx.
  const protocol = baseUrl.startsWith('https') ? 'https' : 'http'
  const rootDomain = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
  // siteUrl mencakup prefix /pusat untuk domain utama, karena route konten adalah
  // /[site]/artikel/[slug] — di domain utama URL valid harus /pusat/artikel/{slug}.
  // Subdomain tidak perlu prefix (middleware me-rewrite /artikel → /{site}/artikel).
  const siteUrl = site === 'pusat'
    ? `${baseUrl}/pusat`
    : `${protocol}://${site}.${rootDomain}`

  const [articles, authors, categories] = await Promise.all([
    getArticles(site),
    getAuthors(site),
    getCategories(site),
  ])

  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: site === 'pusat' ? `${baseUrl}/` : siteUrl,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
      images: [toAbsolute(baseUrl, DEFAULT_IMAGE)],
    },
  ]

  // Categories
  categories.forEach((category: { slug?: string; updatedAt?: string }) => {
    if (!category?.slug) return
    const slug = category.slug.toLowerCase().trim()
    if (slug === 'tersimpan' || slug === 'terbaru') return

    const categoryUrl = site === 'pusat'
      ? `${baseUrl}/pusat?cat=${encodeURIComponent(slug)}`
      : `${siteUrl}/?cat=${encodeURIComponent(slug)}`

    entries.push({
      url: categoryUrl,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
  })

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
  // page.href(site) returns /{site}/p/about — strip the /{site} prefix for subdomain sites
  // since siteUrl already encodes the correct domain (jombang.beritakarya.co).
  ALL_LEGAL_PAGES.forEach((page) => {
    const href = page.href(site)
    // Remove the /{site} prefix: /jombang/p/about → /p/about
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
