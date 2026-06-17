'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, X, GripVertical, ImageIcon, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import { useEditorStore } from '../../store/editorStore'
import type { ImageItem } from '@beritakarya/types'

interface GalleryImage {
  id: string
  url: string
  alt: string
  caption?: string
  credit?: string
  width?: number
  height?: number
  file?: File
  uploading?: boolean
  previewUrl?: string
}

interface PhotoGalleryUploadProps {
  onImagesChange?: (images: ImageItem[]) => void
}

const MAX_IMAGES = 20
const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function PhotoGalleryUpload({ onImagesChange }: PhotoGalleryUploadProps) {
  const { blocks, updateBlock, addBlock } = useEditorStore()
  
  // Find existing gallery block or create one
  const existingGalleryBlock = blocks.find(b => b.type === 'gallery')
  const galleryImages = existingGalleryBlock && 'images' in existingGalleryBlock ? existingGalleryBlock.images : []
  const initialImages: GalleryImage[] = (galleryImages as ImageItem[]).map((img: ImageItem, idx: number) => ({
    ...img,
    id: `existing-${idx}`,
  }))
  
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Narrative text for photo journalism
  const existingParagraph = blocks.find(b => b.type === 'paragraph')
  const [narrativeText, setNarrativeText] = useState(existingParagraph && 'content' in existingParagraph && typeof existingParagraph.content === 'string' ? existingParagraph.content : '')

  // Auto-sync images to editor store whenever they change
  useEffect(() => {
    // Only sync if we have images that are fully uploaded (not still uploading)
    const uploadedImages = images.filter(img => !img.uploading && img.url && !img.url.startsWith('blob:'))
    if (uploadedImages.length === 0) return

    const currentBlocks = useEditorStore.getState().blocks
    const galleryBlock = currentBlocks.find(b => b.type === 'gallery')
    const imageItems: ImageItem[] = uploadedImages.map(({ url, alt, caption, credit }) => ({
      url, alt: alt || '', caption, credit
    }))

    if (galleryBlock) {
      updateBlock(galleryBlock.id, { images: imageItems })
    } else {
      addBlock('gallery')
      setTimeout(() => {
        const freshBlocks = useEditorStore.getState().blocks
        const newBlock = freshBlocks.find(b => b.type === 'gallery')
        if (newBlock) {
          updateBlock(newBlock.id, { images: imageItems })
        }
      }, 0)
    }
  }, [images, updateBlock, addBlock])

  // Auto-sync narrative text to paragraph block in store
  useEffect(() => {
    const currentBlocks = useEditorStore.getState().blocks
    const paragraphBlock = currentBlocks.find(b => b.type === 'paragraph')

    if (narrativeText.trim()) {
      if (paragraphBlock) {
        updateBlock(paragraphBlock.id, { content: narrativeText })
      } else {
        addBlock('paragraph')
        setTimeout(() => {
          const freshBlocks = useEditorStore.getState().blocks
          const newParagraph = freshBlocks.find(b => b.type === 'paragraph')
          if (newParagraph) {
            updateBlock(newParagraph.id, { content: narrativeText })
          }
        }, 0)
      }
    }
  }, [narrativeText, updateBlock, addBlock])
  
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Check max limit
    if (images.length + files.length > MAX_IMAGES) {
      alert(`Maksimal ${MAX_IMAGES} foto per galeri`)
      return
    }
    
    // Validate file types
    const invalidFiles = files.filter(f => !ACCEPTED_FORMATS.includes(f.type))
    if (invalidFiles.length > 0) {
      alert('Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF')
      return
    }
    
    // Create preview URLs and add to state
    const newImages: GalleryImage[] = files.map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      alt: file.name.replace(/\.[^/.]+$/, ''),
      file,
      uploading: true,
      previewUrl: URL.createObjectURL(file),
    }))
    
    setImages(prev => [...prev, ...newImages])
    
    // Upload files
    setUploading(true)
    
    for (const img of newImages) {
      if (!img.file) continue
      
      try {
        const formData = new FormData()
        formData.append('file', img.file)

        const { data } = await api.post('/media/upload?purpose=gallery', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        setImages(prev => prev.map(i => 
          i.id === img.id 
            ? { ...i, url: data.data.url, uploading: false, previewUrl: undefined }
            : i
        ))
      } catch (err) {
        console.error('Upload failed:', err)
        setImages(prev => prev.filter(i => i.id !== img.id))
      }
    }
    
    setUploading(false)
    e.target.value = '' // Reset input
  }, [images.length])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => 
      ACCEPTED_FORMATS.includes(f.type)
    )
    
    if (files.length === 0) return
    
    // Create a fake event to reuse the handler
    const syntheticEvent = {
      target: { files, value: '' },
    } as unknown as React.ChangeEvent<HTMLInputElement>
    handleFileSelect(syntheticEvent)
  }, [handleFileSelect])
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const updateImage = (id: string, updates: Partial<GalleryImage>) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ))
  }
  
  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      // Revoke object URL to free memory
      const removed = prev.find(img => img.id === id)
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }
      return filtered
    })
  }
  
  // Drag to reorder
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }
  
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }
  
  const handleDragOverItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return
    
    setImages(prev => {
      const next = [...prev]
      const [removed] = next.splice(draggedIndex, 1)
      next.splice(targetIndex, 0, removed)
      return next
    })
    setDraggedIndex(targetIndex)
  }
  
  // Sync to editor store when images change
  const handleSaveToGallery = useCallback(() => {
    const currentBlocks = useEditorStore.getState().blocks
    const galleryBlock = currentBlocks.find(b => b.type === 'gallery')
    const imageItems: ImageItem[] = images.map(({ url, alt, caption, credit }) => ({
      url, alt: alt || '', caption, credit
    }))

    if (galleryBlock) {
      updateBlock(galleryBlock.id, { images: imageItems })
    } else {
      // Add new gallery block
      addBlock('gallery')
      // Get the newly added block from fresh state
      setTimeout(() => {
        const freshBlocks = useEditorStore.getState().blocks
        const newBlock = freshBlocks.find(b => b.type === 'gallery')
        if (newBlock) {
          updateBlock(newBlock.id, { images: imageItems })
        }
      }, 0)
    }

    onImagesChange?.(imageItems)
  }, [images, updateBlock, addBlock, onImagesChange])
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-panel-text-primary">Galeri Foto</h3>
          <p className="text-[10px] text-panel-text-secondary">
            {images.length} / {MAX_IMAGES} foto • JPG, PNG, WebP, GIF
          </p>
        </div>
        {images.length > 0 && (
          <button
            onClick={handleSaveToGallery}
            className="px-3 py-1.5 bg-panel-accent text-white text-[10px] font-bold rounded-lg hover:bg-panel-accent/80 transition-colors"
          >
            Simpan ke Galeri
          </button>
        )}
      </div>
      
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-all",
          "border-panel-border bg-panel-surface hover:border-panel-accent/40 hover:bg-panel-elevated",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="photo-gallery-upload"
        />
        
        <label htmlFor="photo-gallery-upload" className="cursor-pointer">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-panel-accent animate-spin" />
              <span className="text-xs text-panel-text-secondary">Mengunggah foto...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-panel-elevated rounded-full">
                <Upload size={20} className="text-panel-text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-panel-text-primary">
                  Seret & taruh foto atau klik untuk pilih
                </p>
                <p className="text-[10px] text-panel-text-muted mt-1">
                  Maksimal {MAX_IMAGES} foto • Maks 10MB per foto
                </p>
              </div>
            </div>
          )}
        </label>
      </div>
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              className={cn(
                "relative group rounded-xl overflow-hidden border-2 transition-all cursor-move",
                draggedIndex === index 
                  ? "border-panel-accent opacity-50" 
                  : "border-panel-border hover:border-panel-accent/40",
                img.uploading && "opacity-50"
              )}
            >
              <div className="aspect-square">
                <img
                  src={img.previewUrl || img.url}
                  alt={img.alt || `Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay with controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Seret untuk ururkan"
                >
                  <GripVertical size={14} className="text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="p-1.5 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
                  title="Hapus"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              
              {/* Upload indicator */}
              {img.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
              
              {/* Image metadata */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="text"
                  value={img.alt || ''}
                  onChange={(e) => updateImage(img.id, { alt: e.target.value })}
                  placeholder="Alt text..."
                  className="w-full px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-[9px] text-white placeholder-white/50 border-0 outline-none"
                />
              </div>
            </div>
          ))}
          
          {/* Add more button */}
          {images.length < MAX_IMAGES && (
            <label
              htmlFor="photo-gallery-upload"
              className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-panel-border bg-panel-surface hover:bg-panel-elevated hover:border-panel-accent/40 cursor-pointer transition-all"
            >
              <ImageIcon size={20} className="text-panel-text-muted" />
              <span className="text-[9px] text-panel-text-muted mt-1">Tambah</span>
            </label>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-8">
          <ImageIcon size={32} className="mx-auto text-panel-text-muted/50 mb-2" />
          <p className="text-xs text-panel-text-muted">
            Belum ada foto. Seret foto ke area di atas atau klik untuk pilih.
          </p>
        </div>
      )}

      {/* Narrative Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-panel-text-primary">
            Narasi Foto
          </label>
          <span className="text-[10px] text-panel-text-muted">
            {(() => {
              const content = narrativeText.replace(/<[^>]*>/g, '')
              const count = content.split(/\s+/).filter(Boolean).length
              return `${count} kata`
            })()}
          </span>
        </div>
        <textarea
          value={narrativeText}
          onChange={(e) => setNarrativeText(e.target.value)}
          placeholder="Tulis narasi foto jurnalistik di sini... (minimal 15 kata)"
          rows={6}
          className="w-full px-4 py-3 bg-panel-surface border border-panel-border rounded-xl text-sm text-panel-text-primary placeholder-panel-text-muted resize-y focus:outline-none focus:ring-2 focus:ring-panel-accent/30 focus:border-panel-accent"
        />
      </div>
    </div>
  )
}

export default PhotoGalleryUpload