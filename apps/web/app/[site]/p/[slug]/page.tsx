import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalStandardPage } from '../../../../components/legal'
import { AdsMarketingPage } from '../../../../components/marketing'
import {
  LEGAL_SLUG_TITLES,
  LEGAL_PAGE_INTROS,
  LegalSlug,
  isLegalSlug,
  resolveLegalPage,
} from '../../../../lib/legalPages'
import {
  ADS_PUBLIC_PAGE,
  isAdsPublicSlug,
  resolveAdsTermsContent,
} from '../../../../lib/marketingPages'
import { buildPublicSiteConfig, fetchSiteSettings } from '../../../../lib/siteSettings'
import { constructMetadata } from '../../../../lib/metadata'
import { JsonLd } from '../../../../components/ui/JsonLd'
import { buildBreadcrumb } from '../../../../lib/structuredData'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { site: string; slug: string }
}): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const slug = resolvedParams.slug

  const siteSettings = await fetchSiteSettings(siteParam)
  const siteName = siteSettings?.name || siteParam.charAt(0).toUpperCase() + siteParam.slice(1)
  const faviconUrl = siteSettings?.faviconUrl || '/favicon.ico'
  const ogImageUrl = siteSettings?.ogImageUrl || '/logo.png'

  if (isAdsPublicSlug(slug)) {
    return constructMetadata({
      title: `${ADS_PUBLIC_PAGE.metadataTitle} - ${siteName}`,
      description: 'Informasi penempatan iklan, kemitraan media, dan advertorial resmi.',
      image: ogImageUrl,
      icons: faviconUrl,
      siteParam,
      canonicalPath: `/${siteParam}/p/${slug}`,
      noIndex: true,
    })
  }

  if (!isLegalSlug(slug)) {
    return constructMetadata({
      title: 'Informasi',
      description: 'Halaman informasi resmi portal berita.',
      image: ogImageUrl,
      icons: faviconUrl,
      siteParam,
      canonicalPath: `/${siteParam}/p/${slug}`,
      noIndex: false,
    })
  }

  const intro = LEGAL_PAGE_INTROS[slug as LegalSlug] || 'Informasi dan dokumen resmi portal berita.'

  return constructMetadata({
    title: `${LEGAL_SLUG_TITLES[slug]} - ${siteName}`,
    description: intro,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam,
    canonicalPath: `/${siteParam}/p/${slug}`,
    noIndex: false,
  })
}

export default async function InfoPage({ params }: { params: { site: string; slug: string } }) {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const slug = resolvedParams.slug

  const siteSettings = await fetchSiteSettings(siteParam)
  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)

  if (isAdsPublicSlug(slug)) {
    return (
      <AdsMarketingPage
        siteConfig={siteConfig}
        siteParam={siteParam}
        termsContent={resolveAdsTermsContent(siteSettings)}
      />
    )
  }

  if (!isLegalSlug(slug)) {
    notFound()
  }

  const { title, content, intro } = resolveLegalPage(slug, siteSettings)
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://beritakarya.co'
  const siteUrl = siteParam === 'pusat' ? baseUrl : `https://${siteParam}.beritakarya.co`
  const pageUrl = siteParam === 'pusat' ? `${siteUrl}/pusat/p/${slug}` : `${siteUrl}/p/${slug}`

  return (
    <>
      <JsonLd
        id={`ld-breadcrumb-${slug}`}
        data={buildBreadcrumb([
          { name: siteConfig.name, url: siteUrl },
          { name: title, url: pageUrl },
        ])}
      />
      <LegalStandardPage
        siteConfig={siteConfig}
        title={title}
        intro={intro}
        content={content}
      />
    </>
  )
}
