import { useState, useEffect } from 'react'

/**
 * useMounted — hook untuk mendeteksi apakah komponen sudah ter-mount di client-side.
 *
 * Dipakai untuk menghindari hydration mismatch di Next.js: komponen yang
 * bergantung pada API browser (seperti Recharts' ResponsiveContainer) perlu
 * ditunda render-nya hingga setelah hidrasi selesai di client.
 *
 * @example
 * function MyChart({ data }) {
 *   const mounted = useMounted()
 *   if (!mounted || !data?.length) return <EmptyChartState message="Data tidak tersedia" />
 *   return <ResponsiveContainer>...</ResponsiveContainer>
 * }
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
