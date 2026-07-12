import { SiteHomePage } from '../components/pages/home/SiteHomePage'
import type { Metadata } from 'next'
import { constructMetadata } from '../lib/metadata'
import { fetchSiteSettings, buildPublicSiteConfig } from '../lib/siteSettings'
import { GoogleAnalytics } from '../components/layout/GoogleAnalytics'

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: 'BeritaKarya — Portal Berita Terpercaya',
    description: 'BeritaKarya pusat: informasi terkini dari seluruh Nusantara tanpa perlu menambahkan /pusat di URL.',
    siteParam: '',
    canonicalPath: '/pusat',
  })
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string }
}) {
  // PENTING: route '/' ini TIDAK melewati app/[site]/layout.tsx, jadi
  // <GoogleAnalytics> harus dipasang di sini juga. Tanpa ini, gtag.js
  // tidak pernah ter-inject di homepage https://beritakarya.co.
  const siteSettings = await fetchSiteSettings('pusat')
  const siteConfig = buildPublicSiteConfig('pusat', siteSettings)

  return (
    <>
      <SiteHomePage siteParam="pusat" searchParams={searchParams} />
      {siteConfig.gaMeasurementId && (
        <GoogleAnalytics gaMeasurementId={siteConfig.gaMeasurementId} />
      )}
    </>
  )
}
