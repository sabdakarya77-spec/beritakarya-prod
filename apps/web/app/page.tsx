import { headers } from 'next/headers'
import { SiteHomePage } from '../components/pages/home/SiteHomePage'
import type { Metadata } from 'next'
import { constructMetadata } from '../lib/metadata'
import { fetchSiteSettings, buildPublicSiteConfig } from '../lib/siteSettings'
import { GoogleAnalytics } from '../components/layout/GoogleAnalytics'

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers()
  const siteParam = headerList.get('x-site-id') || 'pusat'
  const siteSettings = await fetchSiteSettings(siteParam)
  const siteName = siteSettings?.name || (siteParam === 'pusat' ? 'BeritaKarya' : `BeritaKarya ${siteParam.charAt(0).toUpperCase() + siteParam.slice(1)}`)
  const description = siteSettings?.description || 'Portal berita independen menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.'

  return constructMetadata({
    title: `${siteName} — Portal Berita Terpercaya`,
    description,
    siteParam,
    canonicalPath: '/',
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
