import { Metadata } from 'next'
import { SITE_MAP } from '@beritakarya/config'

function resolveBaseUrl() {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
}

/**
 * Mengembalikan base URL yang tepat untuk setiap site:
 * - pusat  → https://beritakarya.co  (main domain)
 * - jombang → https://jombang.beritakarya.co  (subdomain)
 * - bandung → https://bandung.beritakarya.co  (subdomain)
 *
 * Urutan fallback:
 * 1. domain dari SITE_MAP (hardcoded config)
 * 2. pola {siteParam}.{rootDomain} (untuk site yang tidak ada di SITE_MAP, misal jombang)
 */
function resolveSubdomainUrl(siteParam?: string): string {
  const baseUrl = resolveBaseUrl()
  if (!siteParam || siteParam === 'pusat') return baseUrl

  // Cek SITE_MAP dulu (misal bandung, surabaya)
  const siteConfig = SITE_MAP[siteParam as keyof typeof SITE_MAP]
  if (siteConfig?.domain) {
    const protocol = baseUrl.startsWith('https') ? 'https' : 'http'
    return `${protocol}://${siteConfig.domain}`
  }

  // Fallback: pattern subdomain (misal jombang → jombang.beritakarya.co)
  const protocol = baseUrl.startsWith('https') ? 'https' : 'http'
  const rootDomain = baseUrl.replace(/^https?:\/\//, '').split('/')[0]
  return `${protocol}://${siteParam}.${rootDomain}`
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
  const isSubdomain = Boolean(siteParam && siteParam !== 'pusat')
  // subdomainUrl = https://jombang.beritakarya.co  OR  https://beritakarya.co (untuk pusat)
  const subdomainUrl = resolveSubdomainUrl(siteParam)

  /**
   * Logika canonical URL:
   *
   * PUSAT (main domain beritakarya.co):
   *   - artikel  → https://beritakarya.co/pusat/artikel/{slug}
   *   - halaman  → https://beritakarya.co/pusat  atau  https://beritakarya.co/
   *   - canonicalPath → https://beritakarya.co{canonicalPath}
   *
   * SUBDOMAIN (misal jombang.beritakarya.co):
   *   - artikel  → https://jombang.beritakarya.co/artikel/{slug}  (tanpa /jombang/ di path)
   *   - halaman  → https://jombang.beritakarya.co/
   *   - canonicalPath (/{site}/p/terms) → https://jombang.beritakarya.co/p/terms
   */
  const canonical = (() => {
    if (canonicalPath !== undefined) {
      const isEmpty = canonicalPath === '/' || canonicalPath === ''
      if (isEmpty) {
        return isSubdomain ? `${subdomainUrl}/` : `${baseUrl}/`
      }
      const raw = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`
      if (isSubdomain) {
        // Hapus prefix /{siteParam} dari canonicalPath agar tidak double
        // Contoh: /jombang/p/terms → /p/terms
        // Contoh: /jombang?cat=nasional → ?cat=nasional → /?cat=nasional
        const withoutSitePrefix = raw.replace(new RegExp(`^\\/${siteParam}`), '') || '/'
        let cleanPath = withoutSitePrefix
        if (cleanPath.startsWith('?')) {
          cleanPath = `/${cleanPath}`
        } else if (!cleanPath.startsWith('/')) {
          cleanPath = `/${cleanPath}`
        }
        return `${subdomainUrl}${cleanPath}`
      }
      return `${baseUrl}${raw}`
    }

    if (slug) {
      if (isSubdomain) {
        // jombang: https://jombang.beritakarya.co/artikel/{slug}
        return `${subdomainUrl}/artikel/${slug}`
      }
      // pusat: https://beritakarya.co/pusat/artikel/{slug}
      return `${baseUrl}/${siteParam}/artikel/${slug}`
    }

    if (isSubdomain) {
      // jombang home: https://jombang.beritakarya.co/
      return `${subdomainUrl}/`
    }
    if (siteParam) {
      // pusat: https://beritakarya.co/pusat
      return `${baseUrl}/${siteParam}`
    }
    return `${baseUrl}/`
  })()

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
    // Untuk subdomain, metadataBase menggunakan URL subdomain agar relative URLs di
    // OG image dan link lainnya resolve ke domain yang benar.
    metadataBase: new URL(subdomainUrl),
    ...(noIndex && {
      robots: {
        index: false,
        follow: true,
      },
    }),
  }
}
