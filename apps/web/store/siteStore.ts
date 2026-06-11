import { create } from 'zustand'
import type { Site } from '@beritakarya/types'
import { api } from '../lib/api'

interface SiteState {
  currentSite: Site | null
  siteId: string | null
  setSiteId: (id: string) => void
  fetchSite: (id: string) => Promise<void>
}

export const useSiteStore = create<SiteState>((set) => ({
  currentSite: null,
  siteId: null,

  setSiteId: (id) => set({ siteId: id }),

  fetchSite: async (id) => {
    try {
      const { data } = await api.get(`/sites/${id}`)
      set({ currentSite: data.data, siteId: id })
    } catch {
      set({ siteId: id })
    }
  }
}))