'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

interface GoogleAnalyticsProps {
  gaMeasurementId: string
}

/**
 * Google Analytics 4 (gtag.js) client-side tracking component.
 *
 * Catatan penting:
 * - gaMeasurementId bersumber dari database per-site (gaMeasurementId = "G-XXXXXXXXXX"
 *   atau format Google Tag "GT-XXXXXXX"), BUKAN dari env var NEXT_PUBLIC_GA_ID (yang single global).
 * - Dipasang di layout root per-site ([site]/layout.tsx) agar tracking SPA navigation.
 *
 * PERBAIKAN (audit poin 1):
 * - SEBELUMNYA: script gtag.js diinject manual via `document.createElement` di dalam
 *   `useEffect`, yang baru jalan SETELAH hydration React selesai. Visitor yang bounce
 *   cepat (buka halaman lalu langsung pindah/close sebelum hydration kelar) tidak
 *   pernah ter-track sama sekali — script belum sempat ke-load.
 * - SEKARANG: pakai `next/script` dengan strategy="afterInteractive", mekanisme
 *   loading resmi Next.js yang dioptimalkan untuk load lebih awal & lebih konsisten,
 *   mendekati instruksi Google "tepat setelah elemen <head>".
 * - Initial pageview dikirim langsung dari inline script (tidak bergantung pada
 *   timing React effect), sedangkan `useEffect` di bawah HANYA menangani perubahan
 *   halaman berikutnya (SPA navigation) supaya initial pageview tidak ter-hitung dobel.
 */
export function GoogleAnalytics({ gaMeasurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  // Track SPA navigation (pathname/searchParams berubah), skip render pertama
  // karena initial pageview sudah dikirim oleh inline script (lihat return di bawah).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!gaMeasurementId || typeof window.gtag !== 'function') return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    window.gtag('config', gaMeasurementId, { page_path: url })
  }, [pathname, searchParams, gaMeasurementId])

  if (!gaMeasurementId) return null

  return (
    <>
      {/* Loader gtag.js — id disertakan gaMeasurementId supaya kalau pindah
          site dengan ID berbeda, script yang lama diganti (bukan di-skip). */}
      <Script
        id={`ga-gtag-loader-${gaMeasurementId}`}
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script id={`ga-gtag-init-${gaMeasurementId}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
          window.gtag('js', new Date());
          window.gtag('config', '${gaMeasurementId}');
        `}
      </Script>
    </>
  )
}

// Type augmentation untuk window.gtag
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}