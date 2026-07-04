import { Metadata } from 'next'
import { API_URL } from '../../../../lib/api'
import { notFound } from 'next/navigation'
import { LegalStandardPage } from '../../../../components/legal'
import { AdsMarketingPage, type AdPackage } from '../../../../components/marketing'
import { LEGAL_SLUG_TITLES, isLegalSlug, resolveLegalPage } from '../../../../lib/legalPages'
import {
  ADS_PUBLIC_PAGE,
  isAdsPublicSlug,
  resolveAdsTermsContent,
} from '../../../../lib/marketingPages'
import { buildPublicSiteConfig, fetchSiteSettings } from '../../../../lib/siteSettings'
import { constructMetadata } from '../../../../lib/metadata'

export const dynamic = 'force-dynamic'

async function getAdPackages(site: string): Promise<AdPackage[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/ads/packages?site=${site}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.filter((pkg: AdPackage) => pkg.isActive) || []
  } catch (e) {
    console.error('Error fetching ad packages:', e)
    return []
  }
}

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
      image: ogImageUrl,
      icons: faviconUrl,
      siteParam,
      canonicalPath: `/${siteParam}/p/${slug}`,
    })
  }

  if (!isLegalSlug(slug)) {
    return constructMetadata({
      title: 'Informasi',
      image: ogImageUrl,
      icons: faviconUrl,
      siteParam,
      canonicalPath: `/${siteParam}/p/${slug}`,
    })
  }

  return constructMetadata({
    title: `${LEGAL_SLUG_TITLES[slug]} - ${siteName}`,
    image: ogImageUrl,
    icons: faviconUrl,
    siteParam,
    canonicalPath: `/${siteParam}/p/${slug}`,
  })
}

export default async function InfoPage({ params }: { params: { site: string; slug: string } }) {
  const resolvedParams = await params
  const siteParam = resolvedParams.site
  const slug = resolvedParams.slug

  const siteSettings = await fetchSiteSettings(siteParam)
  const siteConfig = buildPublicSiteConfig(siteParam, siteSettings)

  if (isAdsPublicSlug(slug)) {
    const adPackages = await getAdPackages(siteParam)
    return (
      <AdsMarketingPage
        siteConfig={siteConfig}
        siteParam={siteParam}
        adPackages={adPackages}
        termsContent={resolveAdsTermsContent(siteSettings)}
      />
    )
  }

  if (!isLegalSlug(slug)) {
    notFound()
  }

  const { title, content, intro } = resolveLegalPage(slug, siteSettings)

  return (
    <LegalStandardPage
      siteConfig={siteConfig}
      title={title}
      intro={intro}
      content={content}
    />
  )
}
