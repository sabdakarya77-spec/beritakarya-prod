'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Users, FileText, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import { API_URL } from '@/lib/api'

interface Author {
  id: string
  name: string
  role: string
  bio: string | null
  avatarUrl?: string | null
  createdAt: string
  publishedCount: number
  totalViews: number
}

interface AuthorsResponse {
  success: boolean
  data: Author[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const ITEMS_PER_PAGE = 12

export default function AuthorsPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.site as string
  const _siteName = siteId === 'pusat' ? 'Pusat' : siteId.charAt(0).toUpperCase() + siteId.slice(1)

  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'articles'>('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchAuthors = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/v1/users/authors?site=${siteId}&limit=100`, {
          cache: 'no-store'
        })
        if (res.ok) {
          const json: AuthorsResponse = await res.json()
          setAuthors(json.data || [])
          setTotalPages(Math.ceil((json.data?.length || 0) / ITEMS_PER_PAGE))
        }
      } catch (err) {
        console.error('Failed to fetch authors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuthors()
  }, [siteId])

  // Filter and sort authors
  const filteredAuthors = authors
    .filter(author => 
      author.name.toLowerCase().includes(search.toLowerCase()) ||
      author.role.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'id')
      }
      if (sortBy === 'articles') {
        return b.publishedCount - a.publishedCount
      }
      // Default: recent (by createdAt)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  // Paginate
  const paginatedAuthors = filteredAuthors.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}jt`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}rb`
    return views.toLocaleString('id-ID')
  }

  const getRoleRingClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return 'ring-2 ring-brand-red/40 ring-offset-2 dark:ring-offset-slate-950 bg-gradient-to-br from-brand-red to-red-600'
      case 'wapimred':
        return 'ring-2 ring-amber-500/40 ring-offset-2 dark:ring-offset-slate-950 bg-gradient-to-br from-amber-500 to-amber-700'
      case 'reporter':
        return 'ring-2 ring-blue-500/40 ring-offset-2 dark:ring-offset-slate-950 bg-gradient-to-br from-blue-500 to-blue-700'
      default:
        return 'ring-2 ring-slate-200 dark:ring-slate-800 ring-offset-2 dark:ring-offset-slate-950 bg-gradient-to-br from-slate-600 to-slate-800'
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return 'bg-red-50 text-brand-red dark:bg-brand-red/10 dark:text-red-400'
      case 'wapimred':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
      case 'reporter':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
      default:
        return 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-[#020617]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-white/70 pt-12 pb-8 dark:border-white/5 dark:bg-white/[0.01] md:pt-16 md:pb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.06),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.04),transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.02),transparent_50%)]" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-gray-600 backdrop-blur-sm transition-all hover:border-brand-red/30 hover:text-brand-red dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-brand-red"
          >
            <ArrowLeft size={13} />
            Kembali
          </button>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/20 bg-brand-red/5 px-3 py-1">
              <Users size={12} className="text-brand-red" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
                Tim Editorial
              </span>
            </div>
            
            <h1 className="mt-4 text-2xl font-sans font-extrabold tracking-tight text-brand-black dark:text-white md:text-3xl lg:text-4xl">
              Para Penulis Kami
            </h1>
            
            <p className="mx-auto mt-2.5 max-w-2xl text-xs text-slate-500 dark:text-slate-400 md:text-sm">
              Kenali tim redaksi dan kontributor yang menghadirkan berita berkualitas untuk Anda
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="border-b border-gray-100 bg-white/50 py-3 dark:border-white/5 dark:bg-white/[0.01]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari penulis..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs text-gray-900 outline-none transition-all placeholder:text-brand-text-muted focus:border-brand-red/30 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'articles')}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 outline-none transition-all focus:border-brand-red/30 dark:border-white/10 dark:bg-slate-900 dark:text-gray-300"
              >
                <option value="recent">Terbaru</option>
                <option value="name">Nama A-Z</option>
                <option value="articles">Paling Aktif</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
            </div>
          ) : paginatedAuthors.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-650" />
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                {search ? 'Penulis tidak ditemukan' : 'Belum ada penulis'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedAuthors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/${siteId}/penulis/${author.id}`}
                    className="group block"
                  >
                    <article className="h-full rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-brand-red/30">
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-black text-white shadow-md",
                          author.avatarUrl ? '' : getRoleRingClass(author.role)
                        )}>
                          {author.avatarUrl ? (
                            <img
                              src={author.avatarUrl}
                              alt={author.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(author.name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors">
                            {author.name}
                          </h3>
                          <span className={cn(
                            "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                            getRoleBadgeClass(author.role)
                          )}>
                            {ROLE_LABELS[author.role] || author.role}
                          </span>
                        </div>
                      </div>

                      {/* Bio Preview */}
                      {author.bio && (
                        <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {author.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/5 dark:text-slate-400">
                          <FileText size={10} className="text-brand-red" />
                          {author.publishedCount} artikel
                        </span>
                        {author.totalViews > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/5 dark:text-slate-400">
                            {formatViews(author.totalViews)} views
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-red opacity-0 transition-opacity group-hover:opacity-100">
                        <span>Lihat Profil</span>
                        <ArrowRight size={10} />
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  >
                    ← Prev
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                            page === pageNum
                              ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                          )}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}