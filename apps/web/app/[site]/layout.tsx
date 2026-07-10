import type { Metadata } from 'next'
import { PWAInstallPrompt } from '../../components/pwa/PWAInstallPrompt'
import { SwRegister } from '../SwRegister'
import { fetchSiteSettings, buildPublicSiteConfig } from '../../lib/siteSettings'
import { GoogleAnalytics } from '../../components/layout/GoogleAnalytics'

export async function generateMetadata({
  params,
}: {
  params: { site: string }
}): Promise<Metadata> {
  const resolvedParams = await params
  const siteParam = (resolvedParams?.site || 'pusat').toLowerCase()
  const siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1)
  const displayName =
    siteParam === 'pusat' ? 'BeritaKarya' : `BeritaKarya ${siteName}`

  return {
    // manifest: root manifest (app/manifest.ts) dipakai otomatis
    // [site]/manifest.ts tidak di-build Next.js untuk dynamic routes
    title: {
      default: displayName,
      template: `%s | ${displayName}`,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: displayName,
    },
    other: {
      'theme-color': '#B91C1C',
    },
  }
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ site: string }>
}) {
  const resolvedParams = await params
  const site = (resolvedParams?.site || 'pusat').toLowerCase()
  const siteName = site.charAt(0).toUpperCase() + site.slice(1)
  const displayName =
    site === 'pusat' ? 'BeritaKarya' : `BeritaKarya ${siteName}`

  // Fetch site settings untuk GA measurement ID
  const siteSettings = await fetchSiteSettings(site)
  const siteConfig = buildPublicSiteConfig(site, siteSettings)

  return (
    <>
      <SwRegister site={site} />
      {children}
      <PWAInstallPrompt site={site} siteName={displayName} />
      {siteConfig.gaMeasurementId && (
        <GoogleAnalytics gaMeasurementId={siteConfig.gaMeasurementId} />
      )}
    </>
  )
}
