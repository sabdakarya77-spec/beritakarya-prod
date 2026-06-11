import { useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'

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
  siteId?: string
  altText: string | null
  caption: string | null
  credit: string | null
  dominantColor?: string
  createdAt: string
}

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchMedia = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true)
    try {
      const response = await api.get('/media', {
        params: {
          page: pageNum,
          limit: 30
        }
      })
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
  }, [])

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

  // Initial fetch on mount
  useEffect(() => {
    fetchMedia(1, true)
  }, [fetchMedia])

  return { items, setItems, loading, hasMore, total, loadMore, refresh }
}
