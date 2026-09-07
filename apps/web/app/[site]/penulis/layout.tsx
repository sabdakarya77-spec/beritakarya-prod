import type { Metadata } from 'next'
import { constructMetadata } from '../../../lib/metadata'
import { fetchSiteSettings } from '../../../lib/siteSettings'
import { SITE_MAP } from '@beritakarya/config'

export async function generateMetadata({
  params,
}: {
  params: { site: string }
}): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams?.site || 'pusat'
  const siteSettings = await fetchSiteSettings(siteParam)
  const fallbackConfig = SITE_MAP[siteParam] || SITE_MAP.pusat
  const siteName = siteSettings?.name || fallbackConfig?.name || 'BeritaKarya'

  return constructMetadata({
    title: `Daftar Penulis & Jurnalis - ${siteName}`,
    description: `Kenali tim redaksi, jurnalis, reporter, dan kontributor berintegritas di balik berita terpercaya ${siteName}.`,
    siteParam,
    canonicalPath: `/${siteParam}/penulis`,
    noIndex: false,
  })
}

export default function PenulisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
