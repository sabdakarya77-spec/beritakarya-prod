import { API_URL } from './api'
import type { AdItem } from '../components/ui/AdSpace'

/**
 * Fetch ads for a specific slot server-side (SSR).
 * Used for above-the-fold ad slots like HOME_TOP to optimize LCP.
 * Returns empty array on failure — AdSpace will fall back to client-side fetch.
 */
export async function fetchAdsForSlot(site: string, slot: string): Promise<AdItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/ads/public?site=${site}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []

    const json = await res.json()
    if (!json.success || !Array.isArray(json.data)) return []

    const matched = json.data.filter((a: AdItem) => a.slot === slot && a.isActive)
    // Shuffle for random rotation (same logic as client-side)
    return matched.sort(() => Math.random() - 0.5)
  } catch {
    return []
  }
}
