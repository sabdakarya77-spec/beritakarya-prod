import { Metadata } from 'next'

function resolveBaseUrl() {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
}

function resolveTwitterHandle() {
  return process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@beritakarya'
}

export function constructMetadata({
  title = 'BeritaKarya — Portal Berita Terpercaya',
  description = 'Informasi terkini dan terpercaya dari berbagai penjuru daerah. Liputan terkini, investigasi, dan analisis tajam.',
  image = '/logo.png',
  icons = '/favicon.ico',
  noIndex = false,
  siteParam = '',
  slug = '',
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords,
  category,
  canonicalPath,
  twitterHandle,
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
  siteParam?: string
  slug?: string
  type?: 'website' | 'article' | 'profile' | 'book'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
  category?: string
  canonicalPath?: string
  twitterHandle?: string
} = {}): Metadata {
  const baseUrl = resolveBaseUrl()
  const twitter = twitterHandle || resolveTwitterHandle()

  const canonical = canonicalPath
    ? `${baseUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
    : slug
    ? siteParam
      ? `${baseUrl}/${siteParam}/artikel/${slug}`
      : `${baseUrl}/artikel/${slug}`
    : siteParam
    ? `${baseUrl}/${siteParam}`
    : `${baseUrl}/`

  const rawUrl = image.startsWith('http') ? image : `${baseUrl}${image}`
  // Use Next.js Image Optimization for external images (e.g. MinIO storage).
  // This produces a properly sized & compressed version for social crawlers.
  // Internal paths (e.g. /api/og, /logo.png) are kept as-is.
  const imageUrl = image.startsWith('http')
    ? `${baseUrl}/_next/image?url=${encodeURIComponent(rawUrl)}&w=1200&q=75`
    : rawUrl
  const resolvedType = slug ? 'article' : type

  return {
    title,
    description,
    keywords,
    authors: author ? [{ name: author }] : undefined,
    category,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'BeritaKarya',
      locale: 'id_ID',
      type: resolvedType,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(author ? { authors: [author] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: twitter,
      site: twitter,
    },
    icons,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'BeritaKarya',
    },
    metadataBase: new URL(baseUrl),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}
