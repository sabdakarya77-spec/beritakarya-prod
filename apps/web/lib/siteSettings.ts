import { SITE_MAP } from '@beritakarya/config'

export type PublicSiteConfig = {
  id: string
  name: string
  logoUrl: string | null
  address: string | null
  contactEmail: string | null
  phone?: string | null
  appearance: { primaryColor?: string }
  socialLinks: Record<string, string>
  trendingTopics?: unknown[]
}

export async function fetchSiteSettings(site: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${site}`, {
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
        logoUrl?: string
        address?: string
        contactEmail?: string
        phone?: string
        appearance?: PublicSiteConfig['appearance']
        socialLinks?: Record<string, string>
      }
    | undefined

  return {
    id: siteParam,
    name: (siteSettings?.name as string) || fallback?.name || siteParam,
    logoUrl: (siteSettings?.logoUrl as string) || fallback?.logoUrl || null,
    address: (siteSettings?.address as string) || fallback?.address || null,
    contactEmail:
      (siteSettings?.contactEmail as string) || fallback?.contactEmail || null,
    phone: (siteSettings?.phone as string) || fallback?.phone || null,
    appearance:
      (siteSettings?.appearance as PublicSiteConfig['appearance']) ||
      fallback?.appearance ||
      { primaryColor: '#e11d48' },
    socialLinks:
      (siteSettings?.socialLinks as Record<string, string>) ||
      fallback?.socialLinks ||
      {},
    trendingTopics: (siteSettings?.trendingTopics as unknown[]) || undefined,
  }
}
