/** Public marketing pages (not legal documents). */

export const ADS_PUBLIC_SLUG = 'ads' as const

export const ADS_PUBLIC_PAGE = {
  slug: ADS_PUBLIC_SLUG,
  /** H1 on the landing page */
  title: 'Layanan Iklan Mandiri',
  /** Browser tab / metadata */
  metadataTitle: 'Layanan Iklan',
  eyebrow: 'Layanan Iklan',
} as const

export function isAdsPublicSlug(slug: string): slug is typeof ADS_PUBLIC_SLUG {
  return slug === ADS_PUBLIC_SLUG
}

type SiteSettingsLike = {
  advertising?: string | null
}

/** CMS copy for “Syarat & Ketentuan Umum Periklanan” on the public ads landing. */
export function resolveAdsTermsContent(
  siteSettings: SiteSettingsLike | null | undefined
): string | null | undefined {
  return siteSettings?.advertising ?? null
}
