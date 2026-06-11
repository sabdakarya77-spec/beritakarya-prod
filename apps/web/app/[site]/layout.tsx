import type { Metadata } from 'next'
import { PWAInstallPrompt } from '../../components/pwa/PWAInstallPrompt'
import { SwRegister } from '../SwRegister'

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
    manifest: `/${siteParam}/manifest.webmanifest`,
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

  return (
    <>
      <SwRegister site={site} />
      {children}
      <PWAInstallPrompt site={site} siteName={displayName} />
    </>
  )
}
