export interface SiteConfig {
  id: string
  name: string
  domain: string
  description?: string
  logoUrl?: string
  faviconUrl?: string
  ogImageUrl?: string
  footerText?: string
  socialLinks?: {
    whatsapp?: string
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
    telegram?: string
    tiktok?: string
  }
  address?: string
  contactEmail?: string
  phone?: string
  aboutUs?: string
  codeOfEthics?: string
  editorial?: string
  advertising?: string
  privacyPolicy?: string
  termsOfService?: string
  cookiePolicy?: string
  appearance?: {
    primaryColor: string
  }
  devDomain: string
}

export const SITE_MAP: Record<string, SiteConfig> = {
  bandung: {
    id: 'bandung',
    name: 'BeritaKarya Bandung',
    domain: 'bandung.beritakarya.co',
    devDomain: 'bandung.localhost:3000',
    socialLinks: {
      facebook: 'https://facebook.com/beritakarya',
      twitter: 'https://twitter.com/beritakarya',
      instagram: 'https://instagram.com/beritakarya',
      youtube: 'https://youtube.com/beritakarya',
      whatsapp: 'https://wa.me/6281234567890',
      telegram: 'https://t.me/beritakarya',
      tiktok: 'https://tiktok.com/@beritakarya'
    }
  },
  surabaya: {
    id: 'surabaya',
    name: 'BeritaKarya Surabaya',
    domain: 'surabaya.beritakarya.co',
    devDomain: 'surabaya.localhost:3000',
    socialLinks: {
      facebook: 'https://facebook.com/beritakarya',
      twitter: 'https://twitter.com/beritakarya',
      instagram: 'https://instagram.com/beritakarya',
      youtube: 'https://youtube.com/beritakarya',
      whatsapp: 'https://wa.me/6281234567890',
      telegram: 'https://t.me/beritakarya',
      tiktok: 'https://tiktok.com/@beritakarya'
    }
  },
  pusat: {
    id: 'pusat',
    name: 'BeritaKarya',
    domain: 'beritakarya.co',
    devDomain: 'localhost:3000',
    socialLinks: {
      facebook: 'https://facebook.com/beritakarya',
      twitter: 'https://twitter.com/beritakarya',
      instagram: 'https://instagram.com/beritakarya',
      youtube: 'https://youtube.com/beritakarya',
      whatsapp: 'https://wa.me/6281234567890',
      telegram: 'https://t.me/beritakarya',
      tiktok: 'https://tiktok.com/@beritakarya'
    }
  }
}

export function getSiteFromHostname(
  hostname: string
): SiteConfig | null {
  const subdomain = hostname.split('.')[0]
  return SITE_MAP[subdomain] ?? null
}

export const KNOWN_SITE_IDS = Object.keys(SITE_MAP)
