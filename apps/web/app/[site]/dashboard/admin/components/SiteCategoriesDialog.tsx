'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FolderOpen, X, Loader2, Info } from 'lucide-react'
import { api } from '../../../../../lib/api'
import {
  CategoryTreePicker,
  CategoryTreeNode,
  getAllTreeIds
} from './CategoryTreePicker'

interface SiteRef {
  id: string
  name: string
}

interface SiteCategoriesDialogProps {
  site: SiteRef | null
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

interface AssignmentsResponse {
  siteId: string
  isConfigured: boolean
  assignedCategoryIds: string[]
  masterTree: CategoryTreeNode[]
  assignedTree: CategoryTreeNode[]
}

export function SiteCategoriesDialog({
  site,
  open,
  onClose,
  onSaved,
  onToast
}: SiteCategoriesDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [masterTree, setMasterTree] = useState<CategoryTreeNode[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open || !site) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get<{ success: boolean; data: AssignmentsResponse }>(
          `/sites/${site.id}/category-assignments`
        )
        if (cancelled || !data.success) return

        setMasterTree(data.data.masterTree || [])
        setIsConfigured(data.data.isConfigured)
        setSelectedIds(data.data.assignedCategoryIds || [])
      } catch (error: unknown) {
        if (!cancelled) {
          const msg = error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
            : undefined
          onToast(
            msg || 'Gagal memuat kategori situs',
            'error'
          )
          onClose()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, site?.id, onClose, onToast])

  const handleSave = async () => {
    if (!site) return
    setSaving(true)
    try {
      await api.put(`/sites/${site.id}/category-assignments`, {
        categoryIds: selectedIds
      })
      setIsConfigured(selectedIds.length > 0)
      onToast(`Kategori untuk ${site.name} berhasil disimpan`)
      onSaved?.()
      onClose()
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : undefined
      onToast(
        msg || 'Gagal menyimpan kategori',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const selectAll = () => setSelectedIds(getAllTreeIds(masterTree))
  const clearAll = () => setSelectedIds([])

  const handleSeedGlobal = async () => {
    setSaving(true)
    try {
      const { data } = await api.post<{
        success: boolean
        data: { created: number; message: string; skipped?: boolean }
      }>('/categories/seed-global', { sourceSiteId: 'pusat' })

      if (data.success) {
        onToast(data.data.message)
        const reload = await api.get<{ success: boolean; data: AssignmentsResponse }>(
          `/sites/${site!.id}/category-assignments`
        )
        if (reload.data.success) {
          setMasterTree(reload.data.data.masterTree || [])
          setIsConfigured(reload.data.data.isConfigured)
          setSelectedIds(reload.data.data.assignedCategoryIds || [])
        }
      }
    } catch (error: unknown) {
      const msg = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
        : undefined
      onToast(
        msg || 'Gagal memuat kategori global',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open || !site || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl relative z-10">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg transition-all"
          >
            <X size={18} />
          </button>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase mb-1 flex items-center gap-2 pr-10">
            <FolderOpen size={20} className="text-brand-red" />
            Kategori — {site.name}
          </h2>
          <p className="text-sm text-gray-500">
            Pilih kategori master yang aktif di portal ini
          </p>

          {!loading && !isConfigured && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>
                Belum dikonfigurasi — portal menampilkan <strong>semua</strong> kategori global.
                Simpan pilihan untuk membatasi kategori di situs ini.
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[200px]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                  style={{ marginLeft: `${(i % 3) * 16}px` }}
                />
              ))}
            </div>
          ) : masterTree.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Belum ada <strong>kategori global</strong> di sistem. Kategori yang ada di statistik
                pusat (48) kemungkinan milik situs <code className="text-brand-red">pusat</code> saja,
                bukan master global.
              </p>
              <button
                type="button"
                onClick={handleSeedGlobal}
                disabled={saving}
                className="px-5 py-2.5 bg-brand-red hover:bg-red-600 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Muat Kategori Global
              </button>
              <p className="text-xs text-gray-400">
                Menyalin dari kategori situs pusat, atau template standar jika kosong.
              </p>
            </div>
          ) : (
            <CategoryTreePicker
              tree={masterTree}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
              disabled={saving}
            />
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={loading || saving || masterTree.length === 0}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Pilih semua
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={loading || saving}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Hapus semua
            </button>
            <span className="text-xs text-gray-400 self-center">
              {selectedIds.length} dipilih
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving || masterTree.length === 0}
              className="px-5 py-2.5 bg-brand-red hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
