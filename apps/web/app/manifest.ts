import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeritaKarya',
    short_name: 'BeritaKarya',
    description: 'Nusantara Bersuara - Portal Berita Terpercaya',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617', // Sesuai warna dark brand-dark
    theme_color: '#B91C1C',      // Sesuai warna utama brand-red
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
