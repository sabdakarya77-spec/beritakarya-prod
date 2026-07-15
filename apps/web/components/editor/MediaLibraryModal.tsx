'use client'

import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Image as ImageIcon, Check, 
  Loader2, Grid, List, UploadCloud, FolderOpen,
  FileImage, Filter, Info, ExternalLink, Calendar
} from 'lucide-react'
import { useMediaLibrary, type MediaItem } from '../../hooks/useMediaLibrary'
import { useImageUpload } from '../../hooks/useImageUpload'
import { useAuthStore } from '../../store/authStore'
import { useSiteStore } from '../../store/siteStore'
import { cn } from '../../lib/utils'

interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaItem) => void
  allowMultiple?: boolean
  maxSelect?: number
}

type FormatFilter = 'all' | 'jpg' | 'png' | 'webp' | 'gif'

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  allowMultiple = false,
  maxSelect = 10
}: MediaLibraryModalProps) {
  const { user } = useAuthStore()
  const siteIdFromStore = useSiteStore((s) => s.siteId)
  const { items, loading, hasMore, loadMore } = useMediaLibrary()
  const { uploading, upload, reset: resetUpload } = useImageUpload()
  
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery')
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all')
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  const restrictedRoles = ['reporter', 'kontributor']
  const isRestricted = restrictedRoles.includes(user?.role || '')

  const filteredItems = useMemo(() => {
    let result = items
    
    if (formatFilter !== 'all') {
      result = result.filter(item => 
        item.originalFormat.toLowerCase() === formatFilter
      )
    }
    
    if (search.trim()) {
      const keyword = search.toLowerCase()
      result = result.filter(item =>
        (item.altText || '').toLowerCase().includes(keyword) ||
        (item.caption || '').toLowerCase().includes(keyword) ||
        item.url.toLowerCase().includes(keyword)
      )
    }
    return result
  }, [items, search, formatFilter])

  const handleSelect = useCallback((item: MediaItem) => {
    if (allowMultiple) {
      setSelectedItems(prev => {
        const exists = prev.find(i => i.id === item.id)
        if (exists) {
          return prev.filter(i => i.id !== item.id)
        }
        if (prev.length >= maxSelect) {
          return prev
        }
        return [...prev, item]
      })
    } else {
      onSelect(item)
      onClose()
    }
  }, [allowMultiple, maxSelect, onSelect, onClose])

  const handleConfirmSelection = useCallback(() => {
    selectedItems.forEach(item => onSelect(item))
    onClose()
    setSelectedItems([])
  }, [selectedItems, onSelect, onClose])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await upload(file)
      if (result) {
        const newItem: MediaItem = {
          id: `temp-${Date.now()}`,
          url: result.url,
          thumbUrl: result.url,
          width: result.width,
          height: result.height,
          size: result.size,
          originalFormat: file.type.split('/')[1] || 'unknown',
          userId: user?.id || '',
          siteId: siteIdFromStore || 'pusat', // MASALAH 1 FIX: siteId wajib
          altText: null,
          caption: null,
          credit: null,
          createdAt: new Date().toISOString()
        }
        if (allowMultiple) {
          setSelectedItems(prev => [...prev, newItem])
        } else {
          onSelect(newItem)
          onClose()
        }
      }
    } finally {
      resetUpload()
    }
  }, [upload, user?.id, siteIdFromStore, allowMultiple, onSelect, onClose, resetUpload])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatFilters: { value: FormatFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'jpg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
    { value: 'gif', label: 'GIF' },
  ]

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-sm:bg-[#0d1527] max-sm:text-white max-sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 max-sm:border-slate-800/80 max-sm:px-5 max-sm:py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center max-sm:w-12 max-sm:h-12 max-sm:bg-red-500/10 max-sm:border max-sm:border-red-500/20 max-sm:rounded-2xl">
                <FolderOpen className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white max-sm:text-white max-sm:text-lg max-sm:font-bold">
                  Galeri Media
                </h2>
                <p className="text-xs text-gray-500 max-sm:text-slate-400 max-sm:text-[11px]">
                  {isRestricted ? 'Hanya menampilkan media Anda' : 'Seluruh media situs'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors max-sm:text-slate-400 max-sm:hover:bg-slate-800/50"
            >
              <X className="w-5 h-5 text-gray-500 max-sm:text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-700 max-sm:border-slate-800/80">
            <button
              onClick={() => setActiveTab('gallery')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 max-sm:border-b-2',
                activeTab === 'gallery'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 max-sm:text-slate-400 max-sm:hover:text-slate-200'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Galeri
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 max-sm:border-b-2',
                activeTab === 'upload'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 max-sm:text-slate-400 max-sm:hover:text-slate-200'
              )}
            >
              <UploadCloud className="w-4 h-4" />
              Upload Baru
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {activeTab === 'gallery' ? (
                <>
                  {/* Search, Filter & View Toggle */}
                  {/* Desktop Toolbar */}
                  <div className="hidden sm:flex items-center gap-4 px-6 py-3 border-b border-gray-100 dark:border-slate-800">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari media..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                      />
                    </div>
                    
                    {/* Format Filter */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                      <Filter className="w-4 h-4 text-gray-500 ml-2" />
                      {formatFilters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setFormatFilter(filter.value)}
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                            formatFilter === filter.value
                              ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-red'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-2 rounded-md transition-colors',
                          viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''
                        )}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'p-2 rounded-md transition-colors',
                          viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''
                        )}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Toolbar */}
                  <div className="flex sm:hidden items-center w-full">
                    {showMobileSearch ? (
                      <div className="flex items-center gap-3 w-full px-5 py-3 border-b border-slate-800/60 bg-[#0d1527] transition-all duration-300">
                        <button 
                          onClick={() => { setShowMobileSearch(false); setSearch(''); }}
                          className="p-2 bg-slate-800/80 rounded-xl text-slate-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari media..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/35"
                            autoFocus
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 w-full px-5 py-3 border-b border-slate-800/60 bg-[#0d1527]">
                        {/* Square Search Button */}
                        <button
                          onClick={() => setShowMobileSearch(true)}
                          className="w-12 h-12 flex items-shrink-0 items-center justify-center bg-slate-800/50 border border-slate-700/40 rounded-xl text-slate-400 hover:bg-slate-800/80 transition-colors"
                        >
                          <Search className="w-5 h-5" />
                        </button>
                        
                        {/* Funnel Icon */}
                        <div className="flex items-center justify-center text-slate-400 shrink-0 pl-1">
                          <Filter className="w-5 h-5" />
                        </div>
                        
                        {/* Horizontal Filter List */}
                        <div 
                          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none whitespace-nowrap py-1"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {formatFilters.map((filter) => (
                            <button
                              key={filter.value}
                              onClick={() => setFormatFilter(filter.value)}
                              className={cn(
                                "transition-all shrink-0 px-3.5 py-1.5 rounded-xl text-sm",
                                formatFilter === filter.value
                                  ? "bg-brand-red/20 border border-brand-red/30 text-brand-red font-semibold"
                                  : "text-slate-400 hover:text-slate-200 font-medium"
                              )}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Media Grid/List */}
                  <div className="flex-1 overflow-y-auto p-6 max-sm:px-5 max-sm:py-5 max-sm:overflow-x-hidden">
                    {loading && items.length === 0 ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {search || formatFilter !== 'all' ? 'Tidak ada hasil pencarian' : 'Belum ada media'}
                        </p>
                        <button
                          onClick={() => { setSearch(''); setFormatFilter('all'); }}
                          className="mt-3 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red/90 transition-colors"
                        >
                          Reset filter
                        </button>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-sm:-mr-6 max-sm:grid-cols-[repeat(3,115px)]">
                        {filteredItems.map((item) => {
                          const isSelected = selectedItems.some(i => i.id === item.id)
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              onDoubleClick={() => setPreviewItem(item)}
                              className={cn(
                                'relative aspect-square rounded-xl max-sm:rounded-2xl overflow-hidden group transition-all cursor-pointer',
                                'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 max-sm:ring-offset-[#0d1527]',
                                isSelected
                                  ? 'ring-brand-red scale-[0.98]'
                                  : 'ring-transparent hover:ring-brand-red/50'
                              )}
                            >
                              <img
                                src={item.thumbUrl || item.url}
                                alt={item.altText || 'Media'}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-brand-red/20 flex items-center justify-center">
                                  <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              )}
                              {allowMultiple && (
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className={cn(
                                    'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                                    isSelected
                                      ? 'bg-brand-red border-brand-red'
                                      : 'bg-white/80 border-gray-300'
                                  )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredItems.map((item) => {
                          const isSelected = selectedItems.some(i => i.id === item.id)
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              onDoubleClick={() => setPreviewItem(item)}
                              className={cn(
                                'w-full flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer',
                                'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900',
                                isSelected
                                  ? 'bg-brand-red/5 ring-brand-red'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-800 ring-transparent'
                              )}
                            >
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={item.thumbUrl || item.url}
                                  alt={item.altText || 'Media'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.altText || 'Tanpa judul'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.width}×{item.height} • {formatFileSize(item.size)} • {item.originalFormat.toUpperCase()}
                                </p>
                                {item.caption && (
                                  <p className="text-xs text-gray-400 mt-1 truncate">
                                    {item.caption}
                                  </p>
                                )}
                              </div>
                              <Info className="w-4 h-4 text-gray-400" />
                              {isSelected && (
                                <div className="w-8 h-8 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
                                  <Check className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {hasMore && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={loadMore}
                          disabled={loading}
                          className="px-6 py-2 bg-gray-100 dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <label className="w-full max-w-md aspect-video border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-red hover:bg-brand-red/5 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    {uploading ? (
                      <>
                        <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Mengupload...
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Klik untuk upload
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, WebP, GIF • Maks 10MB
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            {previewItem && (
              <div className="max-sm:fixed max-sm:inset-0 max-sm:z-[110] max-sm:bg-[#0d1527] max-sm:text-white max-sm:p-5 w-80 border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white max-sm:text-white">Detail</h3>
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded max-sm:text-slate-400 max-sm:hover:bg-slate-800/50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="rounded-xl overflow-hidden mb-4">
                  <img
                    src={previewItem.url}
                    alt={previewItem.altText || 'Preview'}
                    className="w-full h-48 object-contain bg-black"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Alt Text</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {previewItem.altText || '-'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Caption</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {previewItem.caption || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Credit</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {previewItem.credit || '-'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-3 h-3" />
                    <span>{previewItem.width} × {previewItem.height} px</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileImage className="w-3 h-3" />
                    <span>{formatFileSize(previewItem.size)} • {previewItem.originalFormat.toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(previewItem.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-brand-red hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Buka di tab baru
                  </a>
                </div>

                <button
                  onClick={() => {
                    handleSelect(previewItem)
                    setPreviewItem(null)
                  }}
                  className="w-full mt-4 px-4 py-2 bg-brand-red text-white rounded-lg text-sm font-medium hover:bg-brand-red/90 transition-colors"
                >
                  Pilih Media Ini
                </button>
              </div>
            )}
          </div>

          {/* Footer - Multi-select actions */}
          {allowMultiple && selectedItems.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 max-sm:bg-[#0d1527] max-sm:border-slate-800/80 max-sm:px-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 max-sm:text-slate-400">
                {selectedItems.length} media dipilih
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors max-sm:text-slate-400 max-sm:hover:bg-slate-800/50"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmSelection}
                  className="px-6 py-2 bg-brand-red text-white text-sm font-medium rounded-lg hover:bg-brand-red/90 transition-colors"
                >
                  Pilih {selectedItems.length} Media
                </button>
              </div>
            </div>
          )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}