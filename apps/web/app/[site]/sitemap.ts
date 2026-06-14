import { MetadataRoute } from 'next'
import { API_URL } from '../../lib/api'

const SITEMAP_MAX_PAGES = 50 // Safety cap
const DEFAULT_IMAGE = '/logo.png'

async function getArticles(site: string) {
  const all: any[] = []

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

export default async function sitemap({ params }: { params: { site: string } }): Promise<MetadataRoute.Sitemap> {
  const { site } = await params
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const siteUrl = `${baseUrl}/${site}`

  const [articles, categories, authors] = await Promise.all([
    getArticles(site),
    getCategories(site),
    getAuthors(site),
  ])

  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
      images: [toAbsolute(baseUrl, DEFAULT_IMAGE)],
    },
  ]

  // Legal page
  entries.push({
    url: `${siteUrl}/kebijakan-privasi`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.3,
  })

  // Authors index
  entries.push({
    url: `${siteUrl}/penulis`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  })

  // Categories
  categories.forEach((cat: { name: string; updatedAt?: string }) => {
    entries.push({
      url: `${siteUrl}?cat=${encodeURIComponent(cat.name)}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
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
      article.blocks?.find((b) => b.type === 'image')?.url ||
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
