'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface GoogleAnalyticsProps {
  gaMeasurementId: string
}

/**
 * Google Analytics 4 (gtag.js) client-side tracking component.
 * 
 * Catatan penting:
 * - Komponen ini HANYA jalan di browser (client-side), jadi aman untuk Next.js App Router.
 * - gaMeasurementId bersumber dari database per-site (gaMeasurementId = "G-XXXXXXXXXX"),
 *   BUKAN dari env var NEXT_PUBLIC_GA_ID (yang single global).
 * - Dipasang di layout root per-site ([site]/layout.tsx) agar tracking SPA navigation.
 * - Menggunakan `next/navigation` hooks (usePathname, useSearchParams) untuk
 *   melacak navigasi client-side (tanpa reload halaman penuh).
 */
export function GoogleAnalytics({ gaMeasurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Inject gtag script sekali saat mount (client-side only)
  useEffect(() => {
    if (!gaMeasurementId) return

    // Cegah double-inject kalau hot-reload / fast-refresh
    if (document.getElementById('ga-gtag-script')) return

    // 1) Tambah script async ke <head>
    const script = document.createElement('script')
    script.id = 'ga-gtag-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
    document.head.appendChild(script)

    // 2) Inisialisasi window.dataLayer & fungsi gtag
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', gaMeasurementId, {
      // Kirim page_path agar GA4 tahu URL lengkap saat SPA navigation
      page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
    })
  }, [gaMeasurementId])

  // Track SPA navigation (pathname atau searchParams berubah)
  useEffect(() => {
    if (!gaMeasurementId || !window.gtag) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    window.gtag('config', gaMeasurementId, { page_path: url })
  }, [pathname, searchParams, gaMeasurementId])

  // Komponen ini tidak render apa-apa (hanya side-effect)
  return null
}

// Type augmentation untuk window.gtag
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}