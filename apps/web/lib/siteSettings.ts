import { SITE_MAP } from '@beritakarya/config'
import { API_URL } from './api'

export type PublicSiteConfig = {
  id: string
  name: string
  domain: string
  description: string
  logoUrl: string | null
  footerText: string
  address: string | null
  contactEmail: string | null
  phone?: string | null
  appearance: { primaryColor?: string }
  socialLinks: Record<string, string>
  trendingTopics?: unknown[]
  aboutUs?: string | null
  codeOfEthics?: string | null
  editorial?: string | null
  advertising?: string | null
  devDomain: string
  // Google Analytics gtag.js Measurement ID (format: "G-XXXXXXXXXX")
  gaMeasurementId?: string | null
}

export async function fetchSiteSettings(site: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/sites/settings?site=${site}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export function buildPublicSiteConfig(
  siteParam: string,
  siteSettings: Record<string, unknown> | null | undefined
): PublicSiteConfig {
  const fallback = SITE_MAP[siteParam as keyof typeof SITE_MAP] as
    | {
        name?: string
        domain?: string
        description?: string
        logoUrl?: string
        footerText?: string
        address?: string
        contactEmail?: string
        phone?: string
        appearance?: PublicSiteConfig['appearance']
        socialLinks?: Record<string, string>
        devDomain?: string
      }
    | undefined

  const name = (siteSettings?.name as string) || fallback?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1))
  const domain = (siteSettings?.domain as string) || fallback?.domain || `${siteParam}.beritakarya.co`
  const description = (siteSettings?.description as string) || fallback?.description || `Portal berita independen ${name} menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.`
  const footerText = (siteSettings?.footerText as string) || fallback?.footerText || `© ${new Date().getFullYear()} BERITA KARYA. ALL RIGHTS RESERVED.`
  const devDomain = fallback?.devDomain || `${siteParam}.localhost:3000`

  return {
    id: siteParam,
    name,
    domain,
    description,
    logoUrl: (siteSettings?.logoUrl as string) || fallback?.logoUrl || null,
    footerText,
    address: (siteSettings?.address as string) || fallback?.address || 'Jl Semeru No.54 Wonotakan Kecamatan Berbek Kabupaten Nganjuk',
    contactEmail: (siteSettings?.contactEmail as string) || fallback?.contactEmail || 'support.beritakarya@gmail.com',
    phone: (siteSettings?.phone as string) || fallback?.phone || null,
    appearance: (siteSettings?.appearance as PublicSiteConfig['appearance']) || fallback?.appearance || { primaryColor: '#e11d48' },
    socialLinks: (siteSettings?.socialLinks as Record<string, string>) || fallback?.socialLinks || { facebook: '', twitter: '', instagram: '', youtube: '' },
    trendingTopics: (siteSettings?.trendingTopics as unknown[]) || [],
    aboutUs: (siteSettings?.aboutUs as string) || null,
    codeOfEthics: (siteSettings?.codeOfEthics as string) || null,
    editorial: (siteSettings?.editorial as string) || null,
    advertising: (siteSettings?.advertising as string) || null,
    devDomain,
    // Google Analytics gtag.js Measurement ID
    gaMeasurementId: (siteSettings?.gaMeasurementId as string) || null,
  }
}
