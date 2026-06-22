'use client'

import { useEffect, useMemo, useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { CATEGORIES_CONFIG, CategoryItem } from '../../../lib/constants'
import { api } from '../../../lib/api'
import { MediaLibraryModal } from '../MediaLibraryModal'
import { type MediaItem } from '../../../hooks/useMediaLibrary'
import { Image as ImageIconIcon, Tag, Zap, Star, Sparkles, ChevronDown, Upload, X, FolderOpen, FileText, Camera, Video } from 'lucide-react'
import { useImageUpload } from '../../../hooks/useImageUpload'
import { cn } from '../../../lib/utils'

interface EditorCategoryItem extends CategoryItem {
  id?: string
  subCategories?: EditorCategoryItem[]
}

export function TabSettings() {
  const {
    siteId,
    categoryIds,
    tags,
    featuredImage,
    isBreaking,
    isExclusive,
    isFeatured,
    contentType,
    setContentType,
    updateArticleData
  } = useEditorStore()

  const { upload, uploading, reset: resetUpload } = useImageUpload()

  const [categories, setCategories] = useState<EditorCategoryItem[]>(CATEGORIES_CONFIG)
  const [localTags, setLocalTags] = useState<string[]>(tags)
  const [tagInput, setTagInput] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    setLocalTags(tags)
  }, [tags])

  useEffect(() => {
    let cancelled = false

    const loadCategories = async () => {
      try {
        const { data } = await api.get('/categories/tree', {
          params: siteId ? { site: siteId } : undefined
        })

        if (!cancelled && Array.isArray(data?.data) && data.data.length > 0) {
          setCategories(data.data)
        }
      } catch (error) {
        console.error('Gagal memuat kategori editor:', error)
      }
    }

    void loadCategories()

    return () => {
      cancelled = true
    }
  }, [siteId])

  // Get flat list of categories for dropdown
  const flatCategories = useMemo(() => {
    const result: EditorCategoryItem[] = []

    const collect = (items: EditorCategoryItem[]) => {
      items.forEach(item => {
        result.push(item)
        if (item.subCategories?.length) {
          collect(item.subCategories)
        }
      })
    }

    collect(categories)
    return result
  }, [categories])

  // Find selected category names
  const selectedCategoryNames = useMemo(() => {
    return categoryIds.map(slug => {
      const found = flatCategories.find(c => c.slug === slug || c.id === slug)
      return found?.name || slug
    })
  }, [categoryIds, flatCategories])

  const handleAddTag = () => {
    if (tagInput.trim() && !localTags.includes(tagInput.trim())) {
      const newTags = [...localTags, tagInput.trim()]
      setLocalTags(newTags)
      updateArticleData({ tags: newTags })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    const newTags = localTags.filter(t => t !== tag)
    setLocalTags(newTags)
    updateArticleData({ tags: newTags })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleCategorySelect = (slug: string) => {
    if (categoryIds.includes(slug)) {
      // Deselect
      updateArticleData({ categoryIds: categoryIds.filter(s => s !== slug) })
    } else {
      // Select (max 3)
      if (categoryIds.length >= 3) return
      updateArticleData({ categoryIds: [...categoryIds, slug] })
    }
    // Jangan tutup dropdown — biarkan user pilih beberapa
  }

  const handleSetPrimary = (slug: string) => {
    const reordered = [slug, ...categoryIds.filter(s => s !== slug)]
    updateArticleData({ categoryIds: reordered })
  }

  const handleMediaSelect = (media: MediaItem) => {
    updateArticleData({ featuredImage: media.url })
    setShowMediaLibrary(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const result = await upload(file)
      if (result) {
        updateArticleData({ featuredImage: result.url })
      }
    } finally {
      setUploadingImage(false)
      resetUpload()
    }
  }

  const handleRemoveFeaturedImage = () => {
    updateArticleData({ featuredImage: '' })
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Content Type Selector */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
          <FileText size={12} />
          Tipe Konten
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setContentType('article')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
              contentType === 'article'
                ? "border-panel-accent bg-panel-accent/5 text-panel-accent"
                : "border-panel-border bg-panel-surface hover:border-panel-accent/40 hover:bg-panel-elevated text-panel-text-secondary"
            )}
          >
            <FileText size={18} />
            <span className="text-[10px] font-bold">Artikel</span>
          </button>
          <button
            onClick={() => setContentType('photo_journalism')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
              contentType === 'photo_journalism'
                ? "border-panel-accent bg-panel-accent/5 text-panel-accent"
                : "border-panel-border bg-panel-surface hover:border-panel-accent/40 hover:bg-panel-elevated text-panel-text-secondary"
            )}
          >
            <Camera size={18} />
            <span className="text-[10px] font-bold">Foto Jurnalistik</span>
          </button>
          <button
            onClick={() => setContentType('video_exclusive')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
              contentType === 'video_exclusive'
                ? "border-panel-accent bg-panel-accent/5 text-panel-accent"
                : "border-panel-border bg-panel-surface hover:border-panel-accent/40 hover:bg-panel-elevated text-panel-text-secondary"
            )}
          >
            <Video size={18} />
            <span className="text-[10px] font-bold">Video Eksklusif</span>
          </button>
        </div>
        {contentType === 'photo_journalism' && (
          <p className="text-[9px] text-panel-text-muted">Min. 3 foto, min. 15 kata narasi • Kategori: Foto Jurnalistik • Badge: Eksklusif</p>
        )}
        {contentType === 'video_exclusive' && (
          <p className="text-[9px] text-panel-text-muted">Kategori: Video • Badge: Eksklusif</p>
        )}
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
          <ImageIconIcon size={12} />
          Gambar Utama
        </label>
        
        {featuredImage ? (
          <div className="relative group overflow-hidden rounded-xl border border-panel-border aspect-video">
            <img 
              src={featuredImage} 
              alt="Featured" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
              <button
                onClick={() => setShowMediaLibrary(true)}
                className="p-2.5 bg-white text-gray-800 rounded-lg hover:bg-gray-100 active:scale-95 transition-all shadow-md"
                title="Pilih dari Galeri"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={handleRemoveFeaturedImage}
                className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all shadow-md"
                title="Hapus Gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group rounded-xl border border-dashed border-panel-border bg-panel-surface hover:bg-panel-elevated hover:border-panel-accent transition-all duration-300 overflow-hidden">
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              {uploadingImage || uploading ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-8 h-8 border-2 border-panel-accent/20 border-t-panel-accent rounded-full animate-spin" />
                  <span className="text-[11px] text-panel-text-secondary">Mengunggah berkas...</span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-panel-elevated rounded-full text-panel-text-secondary group-hover:scale-110 transition-transform duration-300">
                    <Upload size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-panel-text-primary">Seret & taruh gambar utama</p>
                    <p className="text-[10px] text-panel-text-muted">Resolusi rekomendasi 1200x675px</p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    {/* Upload Baru */}
                    <label className="px-3 py-1.5 bg-panel-elevated border border-panel-border rounded-lg text-[10px] font-semibold text-panel-text-primary hover:bg-panel-bg cursor-pointer hover:border-panel-accent/40 active:scale-95 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      Upload Baru
                    </label>

                    {/* Pilih Galeri */}
                    <button
                      onClick={() => setShowMediaLibrary(true)}
                      className="px-3 py-1.5 bg-panel-elevated border border-panel-border rounded-lg text-[10px] font-semibold text-panel-text-primary hover:bg-panel-bg hover:border-panel-purple/40 active:scale-95 transition-all"
                    >
                      Pilih dari Galeri
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Multi-Select (maks 3) */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
          <Tag size={12} />
          Kategori
        </label>

        {/* Selected Categories as chips */}
        {categoryIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categoryIds.map((slug, index) => {
              const name = flatCategories.find(c => c.slug === slug)?.name || slug
              const isPrimary = index === 0
              return (
                <span key={slug} className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  isPrimary
                    ? "bg-panel-accent/20 text-panel-accent ring-1 ring-panel-accent/30"
                    : "bg-panel-accent/10 text-panel-accent"
                )}>
                  {isPrimary && <Star size={8} className="fill-current" />}
                  {name}
                  {!isPrimary && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(slug) }}
                      className="ml-0.5 hover:text-panel-accent/70 text-[8px] underline"
                      title="Jadikan Kategori Utama"
                    >
                      Utama
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCategorySelect(slug) }}
                    className="hover:text-panel-accent/70"
                  >
                    <X size={10} />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-panel-border bg-panel-surface text-xs font-medium text-panel-text-primary hover:bg-panel-elevated hover:border-panel-border-hover transition-all text-left"
          >
            <span className={categoryIds.length > 0 ? 'text-panel-text-primary font-semibold' : 'text-panel-text-muted'}>
              {categoryIds.length > 0 ? `${categoryIds.length}/3 dipilih` : 'Pilih kategori...'}
            </span>
            <ChevronDown size={14} className="text-panel-text-secondary" />
          </button>

          {showCategoryDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCategoryDropdown(false)}
              />
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-panel-surface dark:bg-panel-elevated rounded-lg border border-panel-border shadow-xl max-h-[220px] overflow-y-auto animate-fade-in py-1">
                {categoryIds.length > 0 && (
                  <button
                    onClick={() => updateArticleData({ categoryIds: [] })}
                    className="w-full px-3 py-2 text-left text-[11px] font-semibold text-red-500 hover:bg-panel-elevated border-b border-panel-border"
                  >
                    Hapus Semua Kategori
                  </button>
                )}
                {(() => {
                  const isMaxReached = categoryIds.length >= 3
                  return categories.map((cat) => (
                    <div key={cat.slug} className="border-b border-panel-border/30 last:border-0">
                      {/* Parent Category */}
                      <button
                        onClick={() => handleCategorySelect(cat.slug)}
                        disabled={isMaxReached && !categoryIds.includes(cat.slug)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between",
                          categoryIds.includes(cat.slug) ? 'text-panel-accent bg-panel-accent/5' : 'text-panel-text-primary',
                          isMaxReached && !categoryIds.includes(cat.slug)
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-panel-elevated cursor-pointer"
                        )}
                        title={isMaxReached && !categoryIds.includes(cat.slug) ? "Maksimal 3 kategori telah dipilih" : undefined}
                      >
                        <span>{cat.name}</span>
                        <span className={cn(
                          "w-3.5 h-3.5 rounded border flex items-center justify-center",
                          categoryIds.includes(cat.slug)
                            ? "bg-panel-accent border-panel-accent text-white"
                            : "border-panel-border"
                        )}>
                          {categoryIds.includes(cat.slug) && <span className="text-[8px]">✓</span>}
                        </span>
                      </button>
                      {/* Sub Categories */}
                      {cat.subCategories?.map((sub) => (
                        <div key={sub.slug}>
                          <button
                            onClick={() => handleCategorySelect(sub.slug)}
                            disabled={isMaxReached && !categoryIds.includes(sub.slug)}
                            className={cn(
                              "w-full px-5 py-1.5 text-left text-[11px] transition-colors flex items-center justify-between",
                              categoryIds.includes(sub.slug) ? 'text-panel-accent bg-panel-accent/5 font-semibold' : 'text-panel-text-secondary',
                              isMaxReached && !categoryIds.includes(sub.slug)
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-panel-elevated cursor-pointer"
                            )}
                            title={isMaxReached && !categoryIds.includes(sub.slug) ? "Maksimal 3 kategori telah dipilih" : undefined}
                          >
                            <span className="flex items-center gap-1">
                              <span className="text-panel-text-muted/60">↳</span> {sub.name}
                            </span>
                            <span className={cn(
                              "w-3 h-3 rounded border flex items-center justify-center",
                              categoryIds.includes(sub.slug)
                                ? "bg-panel-accent border-panel-accent text-white"
                                : "border-panel-border"
                            )}>
                              {categoryIds.includes(sub.slug) && <span className="text-[7px]">✓</span>}
                            </span>
                          </button>
                          {/* Sub-Sub Categories */}
                          {sub.subCategories?.map((subsub) => (
                            <button
                              key={subsub.slug}
                              onClick={() => handleCategorySelect(subsub.slug)}
                              disabled={isMaxReached && !categoryIds.includes(subsub.slug)}
                              className={cn(
                                "w-full py-1 text-left text-[10px] transition-colors flex items-center justify-between",
                                categoryIds.includes(subsub.slug) ? 'text-panel-accent bg-panel-accent/5 font-semibold' : 'text-panel-text-muted',
                                isMaxReached && !categoryIds.includes(subsub.slug)
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-panel-elevated cursor-pointer"
                              )}
                              style={{ paddingLeft: '2.75rem' }}
                              title={isMaxReached && !categoryIds.includes(subsub.slug) ? "Maksimal 3 kategori telah dipilih" : undefined}
                            >
                              <span className="flex items-center gap-1">
                                <span className="text-panel-text-muted/40">↳</span> {subsub.name}
                              </span>
                              <span className={cn(
                                "w-2.5 h-2.5 rounded border flex items-center justify-center",
                                categoryIds.includes(subsub.slug)
                                  ? "bg-panel-accent border-panel-accent text-white"
                                  : "border-panel-border"
                              )}>
                                {categoryIds.includes(subsub.slug) && <span className="text-[6px]">✓</span>}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))
                })()}
              </div>
            </>
          )}
        </div>
        <p className="text-[10px] text-panel-text-muted leading-relaxed">
          * Kategori pertama = kategori utama (URL kanonis). Klik "Utama" pada chip lain untuk mengubah.
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
          <Tag size={12} />
          Tags
        </label>
        
        {localTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 bg-panel-surface border border-panel-border rounded-xl">
            {localTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-panel-elevated border border-panel-border rounded-lg text-[10px] font-semibold text-panel-text-primary group"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-panel-text-muted hover:text-red-500 rounded-full hover:bg-panel-surface p-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        
        <div className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tambah tag baru..."
            className="w-full px-3 py-2 rounded-lg border border-panel-border bg-panel-surface text-xs font-medium text-panel-text-primary focus:outline-none focus:border-panel-accent transition-all placeholder-panel-text-muted"
          />
          {tagInput.trim() && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-panel-text-muted font-bold tracking-wide uppercase pointer-events-none">
              Enter
            </span>
          )}
        </div>
      </div>

      {/* Editorial Badges */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary whitespace-nowrap">Badge Editorial</span>
          <div className="w-full h-px bg-panel-border" />
        </div>
        
        {/* Breaking News Toggle */}
        <label 
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300",
            isBreaking 
              ? "border-red-500/30 bg-red-500/5 shadow-sm" 
              : "border-panel-border bg-panel-surface hover:border-panel-border-hover"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors", 
              isBreaking ? "bg-red-500 text-white" : "bg-panel-elevated text-red-500"
            )}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-panel-text-primary block">Breaking News</span>
              <span className="text-[10px] text-panel-text-secondary">Tampilkan badge merah menyala</span>
            </div>
          </div>
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => updateArticleData({ isBreaking: e.target.checked })}
              className="sr-only"
            />
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors",
              isBreaking ? "bg-red-500" : "bg-panel-elevated"
            )} />
            <div className={cn(
              "absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-sm",
              isBreaking ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </label>
        
        {/* Eksklusif Toggle */}
        <label 
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300",
            isExclusive 
              ? "border-purple-500/30 bg-purple-500/5 shadow-sm" 
              : "border-panel-border bg-panel-surface hover:border-panel-border-hover"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors", 
              isExclusive ? "bg-purple-500 text-white" : "bg-panel-elevated text-purple-500"
            )}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-panel-text-primary block">Eksklusif</span>
              <span className="text-[10px] text-panel-text-secondary">Tampilkan label artikel eksklusif</span>
            </div>
          </div>
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={isExclusive}
              onChange={(e) => updateArticleData({ isExclusive: e.target.checked })}
              className="sr-only"
            />
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors",
              isExclusive ? "bg-purple-500" : "bg-panel-elevated"
            )} />
            <div className={cn(
              "absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-sm",
              isExclusive ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </label>
        
        {/* Featured Toggle */}
        <label 
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-300",
            isFeatured 
              ? "border-amber-500/30 bg-amber-500/5 shadow-sm" 
              : "border-panel-border bg-panel-surface hover:border-panel-border-hover"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors", 
              isFeatured ? "bg-amber-500 text-white" : "bg-panel-elevated text-amber-500"
            )}>
              <Star className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-panel-text-primary block">Featured</span>
              <span className="text-[10px] text-panel-text-secondary">Utamakan di beranda situs</span>
            </div>
          </div>
          <div className="relative shrink-0">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => updateArticleData({ isFeatured: e.target.checked })}
              className="sr-only"
            />
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors",
              isFeatured ? "bg-amber-500" : "bg-panel-elevated"
            )} />
            <div className={cn(
              "absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow-sm",
              isFeatured ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </label>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  )
}

export default TabSettings
