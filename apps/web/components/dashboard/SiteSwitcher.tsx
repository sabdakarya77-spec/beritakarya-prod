'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import {
  Activity,
  ChevronDown,
  Search,
  Settings,
  Lock,
  Check,
  Loader2,
  Globe,
  Users,
  FileText,
  Tag,
} from 'lucide-react'

interface SiteOption {
  id: string
  domain: string
  name: string
  logoUrl?: string
  isActive?: boolean
  stats?: {
    users: number
    articles: number
    categories: number
    recentActivity: number
  }
}

interface SiteSwitcherProps {
  activeSiteId: string
  isCollapsed?: boolean
}

const SET_SITE_ID_COOKIE = (siteId: string) => {
  // Set cookie siteId agar interceptor axios mengirim X-Site-ID yang benar
  document.cookie = `siteId=${siteId}; path=/; max-age=86400; samesite=lax`
}

const formatSiteName = (siteId: string) =>
  siteId === 'pusat' ? 'Pusat (Nasional)' : siteId.charAt(0).toUpperCase() + siteId.slice(1)

export function SiteSwitcher({ activeSiteId, isCollapsed = false }: SiteSwitcherProps) {
  const router = useRouter()
  const { user, setLastActiveSite } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState<SiteOption[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Hanya superadmin yang boleh switch
  const canSwitch = user?.role === 'superadmin'

  // Fetch sites lazy — hanya saat pertama dibuka
  const fetchSites = useCallback(async () => {
    if (sites.length > 0 || loading) return
    setLoading(true)
    try {
      const { data } = await api.get('/sites', { params: { includeStats: true } })
      if (data.success) {
        setSites(data.data as SiteOption[])
      }
    } catch (err) {
      // silent: dropdown tetap bisa ditutup
      console.error('[SiteSwitcher] Gagal memuat daftar situs:', err)
    } finally {
      setLoading(false)
    }
  }, [sites.length, loading])

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Auto-focus search saat dropdown dibuka
  useEffect(() => {
    if (open) {
      // Tunda agar transition selesai
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearch('')
      setHighlightedIndex(0)
    }
  }, [open])

  // Filter berdasarkan search
  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites
    const q = search.toLowerCase()
    return sites.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q)
    )
  }, [sites, search])

  // Handler switch
  const handleSwitch = useCallback(
    (siteId: string) => {
      if (siteId === activeSiteId) {
        setOpen(false)
        return
      }
      SET_SITE_ID_COOKIE(siteId)
      setLastActiveSite(siteId)
      setOpen(false)
      router.push(`/${siteId}/dashboard`)
    },
    [activeSiteId, router, setLastActiveSite]
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, filteredSites.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filteredSites[highlightedIndex]) {
        e.preventDefault()
        handleSwitch(filteredSites[highlightedIndex].id)
      }
    },
    [filteredSites, highlightedIndex, handleSwitch]
  )

  // ── Render: Locked state (non-superadmin) ─────────────────────────
  if (!canSwitch) {
    return (
      <div
        className={cn(
          'mx-4 mt-4 mb-2 px-3 py-2.5 bg-white/5 rounded-lg border border-white/5',
          isCollapsed && 'mx-2'
        )}
        title="Akses situs terkunci sesuai role Anda"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Lock size={12} className="text-gray-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Portal Aktif
            </span>
          </div>
        </div>
        {!isCollapsed && (
          <p className="text-xs font-black text-white uppercase tracking-tight mt-1 truncate">
            {formatSiteName(activeSiteId)}
          </p>
        )}
      </div>
    )
  }

  // ── Render: Switcher aktif (superadmin) ────────────────────────────
  return (
    <div ref={containerRef} className="relative mx-4 mt-4 mb-2" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) fetchSites()
        }}
        className={cn(
          'w-full px-3 py-2.5 bg-white/5 rounded-lg border border-white/5',
          'hover:bg-white/10 hover:border-white/10 transition-all',
          'flex items-center justify-between text-left',
          open && 'bg-white/10 border-white/10'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Activity size={12} className="text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Portal Aktif
          </span>
        </div>
        <ChevronDown
          size={12}
          className={cn(
            'text-gray-500 flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180 text-white'
          )}
        />
      </button>

      {!isCollapsed && (
        <p className="text-xs font-black text-white uppercase tracking-tight mt-1 truncate">
          {formatSiteName(activeSiteId)}
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-slate-800 dark:bg-slate-900 border border-white/10 rounded-xl',
            'shadow-2xl shadow-black/50 overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="listbox"
        >
          {/* Search input */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder="Cari portal..."
                className={cn(
                  'w-full bg-slate-900/60 border border-white/5 rounded-lg',
                  'pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500',
                  'outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/20',
                  'transition-all'
                )}
              />
            </div>
          </div>

          {/* List */}
          <ul
            ref={listRef}
            className="overflow-y-auto max-h-[320px] py-1"
            role="listbox"
          >
            {loading && sites.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <Loader2
                  size={18}
                  className="mx-auto text-gray-500 animate-spin mb-2"
                />
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Memuat portal...
                </p>
              </li>
            ) : filteredSites.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <Globe size={20} className="mx-auto text-gray-600 mb-2" />
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {search ? 'Portal tidak ditemukan' : 'Belum ada portal'}
                </p>
              </li>
            ) : (
              filteredSites.map((s, idx) => {
                const isActive = s.id === activeSiteId
                const isHighlighted = idx === highlightedIndex
                return (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSwitch(s.id)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-all',
                      isHighlighted && 'bg-white/5',
                      isActive && 'bg-brand-red/10 border border-brand-red/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar/logo */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                          'text-[11px] font-black uppercase',
                          isActive
                            ? 'bg-brand-red text-white'
                            : 'bg-slate-700 text-gray-300'
                        )}
                      >
                        {s.logoUrl ? (
                          <img
                            src={s.logoUrl}
                            alt={s.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          s.id.slice(0, 2)
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'text-xs font-black uppercase tracking-tight truncate',
                              isActive ? 'text-white' : 'text-gray-200'
                            )}
                          >
                            {formatSiteName(s.id)}
                          </p>
                          {/* Health indicator */}
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full flex-shrink-0',
                              s.isActive ? 'bg-emerald-400' : 'bg-yellow-400'
                            )}
                            title={
                              s.isActive
                                ? 'Aktif (ada aktivitas 30 hari terakhir)'
                                : 'Idle (tidak ada aktivitas 30 hari)'
                            }
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {s.domain}
                        </p>
                        {s.stats && (
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                              <Users size={9} /> {s.stats.users}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                              <FileText size={9} /> {s.stats.articles}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                              <Tag size={9} /> {s.stats.categories}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Checkmark untuk site aktif */}
                      {isActive && (
                        <Check
                          size={14}
                          className="text-brand-red flex-shrink-0 mt-2"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {/* Footer link ke Manajemen Situs */}
          <Link
            href={`/${activeSiteId}/dashboard/admin`}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest',
              'text-gray-400 hover:text-white hover:bg-white/5 transition-colors',
              'border-t border-white/5'
            )}
          >
            <Settings size={12} />
            Kelola Semua Portal
          </Link>
        </div>
      )}
    </div>
  )
}

// Re-export untuk konsistensi dengan import di layout
export default SiteSwitcher
