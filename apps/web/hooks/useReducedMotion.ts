'use client'

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

/**
 * Hook untuk mendeteksi preferensi reduced motion user.
 *
 * Menggunakan framer-motion's useReducedMotion() yang membaca
 * `prefers-reduced-motion: reduce` media query dari browser.
 *
 * Penggunaan:
 * ```tsx
 * const shouldReduceMotion = usePrefersReducedMotion()
 *
 * <motion.div
 *   animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
 *   transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
 * >
 * ```
 *
 * Catatan: CSS-level `prefers-reduced-motion` di globals.css sudah
 * menonaktifkan CSS transitions/animations. Hook ini untuk Framer Motion
 * JavaScript animations yang tidak ter-cover oleh CSS override.
 */
export function usePrefersReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false
}

/**
 * Helper: mengembalikan motion props yang aman untuk reduced motion.
 * Jika user memilih reduced motion, kembalikan props tanpa animasi.
 *
 * @param motionProps - Framer Motion props yang ingin diterapkan
 * @returns Motion props (atau empty object jika reduced motion)
 */
export function useSafeMotion<T extends Record<string, unknown>>(motionProps: T): T | Record<string, unknown> {
  const shouldReduceMotion = usePrefersReducedMotion()
  return shouldReduceMotion ? {} : motionProps
}
