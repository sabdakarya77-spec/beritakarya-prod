import { useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'
import { useSiteStore } from '../store/siteStore'

export interface MediaItem {
  id: string
  url: string
  thumbUrl: string
  blurHash?: string
  width: number
  height: number
  originalFormat: string
  size: number
  userId: string
  siteId: string // MASALAH 1 FIX: wajib — semua media terikat site
  altText: string | null
  caption: string | null
  credit: string | null
  dominantColor?: string
  contentHash?: string // MASALAH 4: hash untuk deduplikasi
  createdAt: string
}

/**
 * Hook untuk mengakses media library.
 * MASALAH 2 FIX: siteId kini dikirim secara eksplisit sebagai query param,
 * tidak hanya mengandalkan axios interceptor.
 *
 * @param siteId - Opsional. Jika diberikan, override site dari store/cookie.
 *                 Jika tidak, hook akan membaca dari siteStore secara reaktif.
 */
export function useMediaLibrary(siteId?: string) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  // MASALAH 2 FIX: Baca site dari Zustand store secara reaktif sebagai fallback
  const storeSiteId = useSiteStore((s) => s.siteId)

  // Prioritas: param eksplisit > store > undefined (interceptor akan handle via cookie)
  const effectiveSiteId = siteId || storeSiteId

  const fetchMedia = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page: pageNum,
        limit: 30
      }

      // MASALAH 2 FIX: Kirim siteId secara eksplisit sebagai query param
      if (effectiveSiteId) {
        params.site = effectiveSiteId
      }

      const response = await api.get('/media', { params })
      const { items: newItems, total: totalItems, totalPages } = response.data.data
      
      setItems(prev => {
        if (reset || pageNum === 1) return newItems
        // Filter out duplicates just in case
        const existingIds = new Set(prev.map(i => i.id))
        const filteredNew = newItems.filter((i: MediaItem) => !existingIds.has(i.id))
        return [...prev, ...filteredNew]
      })
      setTotal(totalItems)
      setHasMore(pageNum < totalPages)
    } catch (err) {
      console.error('Failed to fetch media:', err)
    } finally {
      setLoading(false)
    }
  }, [effectiveSiteId])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    setPage(p => {
      const nextPage = p + 1
      fetchMedia(nextPage)
      return nextPage
    })
  }, [loading, hasMore, fetchMedia])

  const refresh = useCallback(async () => {
    setPage(1)
    setHasMore(true)
    await fetchMedia(1, true)
  }, [fetchMedia])

  // Re-fetch ketika siteId berubah (MASALAH 2 FIX: reaktif terhadap perubahan site)
  useEffect(() => {
    fetchMedia(1, true)
  }, [fetchMedia])

  return { items, setItems, loading, hasMore, total, loadMore, refresh }
}