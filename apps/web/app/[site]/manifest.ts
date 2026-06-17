import { MetadataRoute } from 'next'
import { API_URL } from '../../lib/api'

/**
 * Manifest dinamis per-situs. Yang divariasikan per situs:
 * - name      → "BeritaKarya Bandung" / "BeritaKarya Surabaya" / "BeritaKarya"
 * - start_url → "/bandung/" / "/surabaya/" / "/"
 * - scope     → "/bandung/" / "/surabaya/" / "/"
 *
 * Branding korporat (ikon, warna, deskripsi) diseragamkan agar user
 * mendapat identitas brand yang konsisten, seperti analogi Aqua di
 * berbagai kota. Variasikan hanya nama & URL start.
 */
export default async function manifest({
  params,
}: {
  params: { site: string }
}): Promise<MetadataRoute.Manifest> {
  const resolvedParams = await params
  const siteParam = (resolvedParams?.site || 'pusat').toLowerCase()
  const isRoot = !siteParam || siteParam === 'pusat'

  const siteName = siteParam.charAt(0).toUpperCase() + siteParam.slice(1)
  const startUrl = isRoot ? '/' : `/${siteParam}/`
  const scope = isRoot ? '/' : `/${siteParam}/`

  // Tarik nama situs dari API (best-effort, fallback ke default)
  let displayName = isRoot ? 'BeritaKarya' : `BeritaKarya ${siteName}`
  let description = isRoot
    ? 'Jernih Melihat Nusantara - Portal Berita Terpercaya'
    : `Portal berita ${siteName} - Jernih Melihat Nusantara`

  try {
    const res = await fetch(
      `${API_URL}/api/v1/sites/settings?site=${siteParam}`,
      { next: { revalidate: 3600 } }
    )
    if (res.ok) {
      const json = await res.json()
      const data = json.data
      if (data?.name) displayName = data.name
      if (data?.description) description = data.description
    }
  } catch (_e) {
    // Silent fallback - manifest tetap valid dengan default
  }

  return {
    name: displayName,
    short_name: displayName,
    description,
    start_url: startUrl,
    scope,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617', // Brand dark color
    theme_color: '#B91C1C',      // Brand red
    lang: 'id-ID',
    categories: ['news', 'magazines', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
