'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { api } from '../../../lib/api'
import { cn } from '../../../lib/utils'
import {
  Clock,
  Save,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface ArticleVersion {
  id: string
  title: string
  version: number
  createdAt: string
  authorId: string
}

export function HistoryPanel() {
  const { articleId, siteId, loadArticle } = useEditorStore()

  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    if (!articleId) return
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.get(`/articles/${articleId}/versions`, {
        params: siteId ? { site: siteId } : undefined,
      })
      setVersions(data.data || [])
    } catch (err) {
      console.error('Gagal memuat riwayat versi:', err)
      setError('Gagal memuat riwayat versi.')
    } finally {
      setIsLoading(false)
    }
  }, [articleId, siteId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const handleSaveVersion = async () => {
    if (!articleId) return
    setIsSaving(true)
    setError(null)
    try {
      await api.post(
        `/articles/${articleId}/versions/save`,
        {},
        { params: siteId ? { site: siteId } : undefined }
      )
      await fetchVersions()
    } catch (err) {
      console.error('Gagal menyimpan versi:', err)
      setError('Gagal menyimpan versi.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRestore = async (versionId: string, versionNum: number) => {
    if (!articleId || !siteId) return
    const confirmed = window.confirm(
      `Kembalikan artikel ke versi ${versionNum}? Konten saat ini akan ditimpa.`
    )
    if (!confirmed) return

    setRestoringId(versionId)
    setError(null)
    try {
      await api.post(
        `/articles/versions/${versionId}/restore`,
        {},
        { params: siteId ? { site: siteId } : undefined }
      )
      await loadArticle(articleId, siteId)
      await fetchVersions()
    } catch (err) {
      console.error('Gagal mengembalikan versi:', err)
      setError('Gagal mengembalikan versi.')
    } finally {
      setRestoringId(null)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Baru saja'
    if (diffMin < 60) return `${diffMin} menit lalu`
    if (diffHour < 24) return `${diffHour} jam lalu`
    if (diffDay < 7) return `${diffDay} hari lalu`
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (!articleId) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="p-3 bg-panel-surface border border-panel-border rounded-xl">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-panel-elevated rounded-lg shrink-0">
              <AlertCircle size={14} className="text-panel-text-muted" />
            </div>
            <p className="text-[10px] text-panel-text-secondary leading-relaxed">
              Simpan artikel terlebih dahulu untuk melihat riwayat versi.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header + Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
            Riwayat Versi
          </span>
          <div className="w-full h-px bg-panel-border" />
        </div>
        <button
          onClick={fetchVersions}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-panel-text-muted hover:text-panel-text-primary hover:bg-panel-elevated transition-colors"
          title="Muat ulang"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Save Version Button */}
      <button
        onClick={handleSaveVersion}
        disabled={isSaving}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold transition-all',
          'bg-accent-purple/10 border border-accent-purple/20 text-accent-purple hover:bg-accent-purple/20 hover:border-accent-purple/40',
          isSaving && 'opacity-60 cursor-not-allowed'
        )}
      >
        {isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {isSaving ? 'Menyimpan...' : 'Simpan Versi Sekarang'}
      </button>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-6">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-panel-border" />
              <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-panel-border bg-panel-bg" />
              <div className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-10 bg-panel-elevated rounded animate-pulse" />
                  <div className="h-3 w-20 bg-panel-elevated rounded animate-pulse" />
                </div>
                <div className="h-3.5 w-3/4 bg-panel-elevated rounded animate-pulse opacity-60" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && versions.length === 0 && (
        <div className="p-3 bg-panel-surface border border-panel-border rounded-xl">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-panel-elevated rounded-lg shrink-0">
              <Clock size={14} className="text-panel-text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-panel-text-primary">
                Belum ada versi tersimpan
              </p>
              <p className="text-[10px] text-panel-text-secondary leading-relaxed">
                Versi otomatis tersimpan saat Anda mengirim atau menerbitkan artikel. Anda juga bisa menyimpan versi manual.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version Timeline */}
      {!isLoading && versions.length > 0 && (
        <div className="space-y-1">
          {versions.map((v, i) => {
            const isRestoring = restoringId === v.id
            return (
              <div key={v.id} className="relative pl-6 group">
                {/* Timeline line */}
                {i < versions.length - 1 && (
                  <div className="absolute left-[7px] top-0 bottom-0 w-px bg-panel-border" />
                )}

                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-colors',
                    i === 0
                      ? 'bg-accent-purple border-accent-purple'
                      : 'bg-panel-bg border-panel-border group-hover:border-accent-purple/50'
                  )}
                />

                {/* Content */}
                <div className="pb-3 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-panel-text-primary">
                        v{v.version}
                      </span>
                      <span className="text-[9px] text-panel-text-muted whitespace-nowrap">
                        {formatTime(v.createdAt)}
                      </span>
                    </div>
                    {i > 0 && (
                      <button
                        onClick={() => handleRestore(v.id, v.version)}
                        disabled={isRestoring || restoringId !== null}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all shrink-0',
                          'text-panel-text-muted hover:text-accent-purple hover:bg-accent-purple/10',
                          'opacity-0 group-hover:opacity-100',
                          isRestoring && 'opacity-100'
                        )}
                        title={`Kembalikan ke versi ${v.version}`}
                      >
                        {isRestoring ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <RotateCcw size={10} />
                        )}
                        {isRestoring ? 'Mengembalikan...' : 'Restore'}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-panel-text-secondary truncate">
                    {v.title || '(Tanpa judul)'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Footer */}
      {!isLoading && versions.length > 0 && (
        <p className="text-[9px] text-panel-text-muted text-center">
          {versions.length} versi tersimpan
        </p>
      )}
    </div>
  )
}

export default HistoryPanel
