export type JsonLdObject = Record<string, unknown>

const SITE_NAME = 'BeritaKarya'
const SITE_DEFAULT_DESCRIPTION =
  'Portal berita terpercaya dari berbagai penjuru daerah. Liputan terkini, investigasi, dan analisis tajam.'
const SITE_DEFAULT_LOGO = '/logo.png'

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
}

export interface OrganizationOptions {
  name?: string
  url?: string
  logo?: string
  description?: string
  socialLinks?: Record<string, string | null | undefined>
  siteParam?: string
}

export function buildOrganization(opts: OrganizationOptions = {}): JsonLdObject {
  const baseUrl = getBaseUrl()
  const url = opts.url || baseUrl
  const logo = opts.logo || `${baseUrl}${SITE_DEFAULT_LOGO}`
  const name = opts.name || SITE_NAME
  const description = opts.description || SITE_DEFAULT_DESCRIPTION
  const sameAs = Object.values(opts.socialLinks || {}).filter(Boolean) as string[]

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512,
    },
    description,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }
}

export interface WebsiteOptions {
  siteParam?: string
  siteName?: string
  searchPath?: string
}

export function buildWebsite(opts: WebsiteOptions = {}): JsonLdObject {
  const baseUrl = getBaseUrl()
  const url = opts.siteParam ? `${baseUrl}/${opts.siteParam}` : baseUrl
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: opts.siteName || SITE_NAME,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}${opts.searchPath || '?q={search_term_string}'}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'id-ID',
  }
}

export interface ArticleSchemaOptions {
  title: string
  description: string
  image: string | string[]
  datePublished: string
  dateModified?: string
  authorName: string
  authorUrl?: string
  siteName: string
  siteUrl: string
  articleUrl: string
  category?: string
  keywords?: string[]
  wordCount?: number
  publisherLogo?: string
}

export function buildArticle(opts: ArticleSchemaOptions): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: opts.title,
    description: opts.description,
    image: Array.isArray(opts.image) ? opts.image : [opts.image],
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: [
      {
        '@type': 'Person',
        name: opts.authorName,
        url: opts.authorUrl,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: opts.siteName,
      url: opts.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: opts.publisherLogo || `${getBaseUrl()}${SITE_DEFAULT_LOGO}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': opts.articleUrl,
    },
    articleSection: opts.category,
    keywords: opts.keywords?.join(', '),
    wordCount: opts.wordCount,
    inLanguage: 'id-ID',
  }
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export function buildBreadcrumb(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export interface PersonSchemaOptions {
  name: string
  url: string
  role?: string
  bio?: string
  image?: string
  worksFor?: string
}

export function buildPerson(opts: PersonSchemaOptions): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: opts.name,
    url: opts.url,
    description: opts.bio,
    image: opts.image,
    jobTitle: opts.role,
    worksFor: opts.worksFor
      ? { '@type': 'Organization', name: opts.worksFor }
      : undefined,
  }
}

export function buildJsonLd(...data: JsonLdObject[]): string {
  return JSON.stringify(data.length === 1 ? data[0] : data)
}
