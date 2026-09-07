import { headers } from 'next/headers'
import { SiteHomePage } from '../components/pages/home/SiteHomePage'
import type { Metadata } from 'next'
import { constructMetadata } from '../lib/metadata'
import { fetchSiteSettings, buildPublicSiteConfig } from '../lib/siteSettings'
import { GoogleAnalytics } from '../components/layout/GoogleAnalytics'

function formatCategoryTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string; q?: string }> | { cat?: string; q?: string }
} = {}): Promise<Metadata> {
  const headerList = await headers()
  const siteParam = headerList.get('x-site-id') || 'pusat'
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const siteSettings = await fetchSiteSettings(siteParam)
  const siteName = siteSettings?.name || (siteParam === 'pusat' ? 'BeritaKarya' : `BeritaKarya ${siteParam.charAt(0).toUpperCase() + siteParam.slice(1)}`)
  const description = siteSettings?.description || 'Portal berita independen menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.'

  const rawCat = resolvedSearchParams?.cat?.trim()
  const rawQuery = resolvedSearchParams?.q?.trim()
  const hasSearchQuery = Boolean(rawQuery)
  const isSavedFilter = rawCat === 'tersimpan'
  const isDefaultFeed = rawCat === 'terbaru'
  const isRealCategory = Boolean(rawCat && !isSavedFilter && !isDefaultFeed)

  if (hasSearchQuery) {
    return constructMetadata({
      title: `Hasil Pencarian: "${rawQuery}" — ${siteName}`,
      description,
      siteParam,
      noIndex: true,
      canonicalPath: '/',
    })
  }

  if (isSavedFilter) {
    return constructMetadata({
      title: `Artikel Tersimpan — ${siteName}`,
      description,
      siteParam,
      noIndex: true,
      canonicalPath: '/',
    })
  }

  if (isRealCategory && rawCat) {
    const formattedCat = formatCategoryTitle(rawCat)
    return constructMetadata({
      title: `Berita ${formattedCat} Terkini — ${siteName}`,
      description: `Kumpulan berita ${formattedCat} terbaru, informasi terpercaya, dan analisis mendalam seputar ${formattedCat} di ${siteName}.`,
      siteParam,
      canonicalPath: `/?cat=${encodeURIComponent(rawCat)}`,
      noIndex: false,
    })
  }

  return constructMetadata({
    title: `${siteName} — Portal Berita Terpercaya`,
    description,
    siteParam,
    canonicalPath: '/',
    noIndex: false,
  })
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string }
}) {
  const headerList = await headers()
  const siteParam = headerList.get('x-site-id') || 'pusat'

  const siteSettings = await fetchSiteSettings(siteParam)
  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)

  return (
    <>
      <SiteHomePage siteParam={siteParam} searchParams={searchParams} />
      {siteConfig.gaMeasurementId && (
        <GoogleAnalytics gaMeasurementId={siteConfig.gaMeasurementId} />
      )}
    </>
  )
}
