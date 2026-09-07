import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalStandardPage } from '../../../components/legal'
import { PRIVACY_PAGE } from '../../../lib/legalPages'
import { buildPublicSiteConfig, fetchSiteSettings } from '../../../lib/siteSettings'
import { constructMetadata } from '../../../lib/metadata'
import { JsonLd } from '../../../components/ui/JsonLd'
import { buildBreadcrumb } from '../../../lib/structuredData'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { site: string }
}): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const siteSettings = await fetchSiteSettings(siteParam)
  const siteName = siteSettings?.name || siteParam.charAt(0).toUpperCase() + siteParam.slice(1)
  const faviconUrl = siteSettings?.faviconUrl || '/favicon.ico'
  const ogImageUrl = siteSettings?.ogImageUrl || '/logo.png'

  return constructMetadata({
    title: `${PRIVACY_PAGE.title} - ${siteName}`,
    description: PRIVACY_PAGE.intro,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam,
    canonicalPath: `/${siteParam}/kebijakan-privasi`,
    noIndex: false,
  })
}

export default async function PrivacyPolicyPage({ params }: { params: { site: string } }) {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const siteSettings = await fetchSiteSettings(siteParam)

  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://beritakarya.co'
  const siteUrl = siteParam === 'pusat' ? baseUrl : `https://${siteParam}.beritakarya.co`
  const pageUrl = siteParam === 'pusat' ? `${siteUrl}/pusat/kebijakan-privasi` : `${siteUrl}/kebijakan-privasi`

  return (
    <>
      <JsonLd
        id="ld-breadcrumb-privacy"
        data={buildBreadcrumb([
          { name: siteConfig.name, url: siteUrl },
          { name: PRIVACY_PAGE.title, url: pageUrl },
        ])}
      />
      <LegalStandardPage
        siteConfig={siteConfig}
        title={PRIVACY_PAGE.title}
        intro={PRIVACY_PAGE.intro}
        content={siteSettings?.privacyPolicy}
        emptyMessage={`Konten kebijakan privasi belum tersedia. Silakan hubungi redaksi ${siteConfig.name} untuk informasi lebih lanjut.`}
      />
    </>
  )
}
