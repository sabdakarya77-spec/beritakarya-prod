'use client'

import { useEffect } from 'react'

/**
 * Mendaftarkan Service Worker PWA dengan scope berbasis site.
 * - Untuk root/pusat: scope '/'
 * - Untuk situs lain: scope '/[site]/'
 *
 * Header 'Service-Worker-Allowed: /' harus diset di next.config.mjs
 * agar SW di /sw.js bisa memiliki scope yang lebih dalam.
 */
export function SwRegister({ site }: { site: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const normalizedSite = (site || 'pusat').toLowerCase()
    const isRoot = normalizedSite === 'pusat' || normalizedSite === 'root'
    const scope = isRoot ? '/' : `/${normalizedSite}/`

    // Hindari double registration di scope yang sama
    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration(scope)
        if (existing && existing.active) {
          return
        }
        await navigator.serviceWorker.register('/sw.js', { scope })
      } catch (err) {
        console.error('[PWA] ServiceWorker registration failed:', err)
      }
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [site])

  return null
}
