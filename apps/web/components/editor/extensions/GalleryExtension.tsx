'use client'

import { Node, mergeAttributes, type NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useCallback } from 'react'
import { Trash2, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, X } from 'lucide-react'
import { MediaLibraryModal } from '../MediaLibraryModal'
import { type MediaItem } from '../../../hooks/useMediaLibrary'
import { useImageUpload } from '../../../hooks/useImageUpload'
import { cn } from '../../../lib/utils'

interface GalleryImage {
  url: string
  alt?: string
  caption?: string
}

const GalleryComponent = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const images: GalleryImage[] = node.attrs.images || []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const { upload, uploading, reset: resetUpload } = useImageUpload()

  const handleMediaSelect = useCallback((media: MediaItem) => {
    const newImage: GalleryImage = {
      url: media.url,
      alt: media.altText || '',
      caption: media.caption || '',
    }
    updateAttributes({
      images: [...images, newImage]
    })
    setShowMediaLibrary(false)
  }, [images, updateAttributes])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await upload(file)
    if (result) {
      const newImage: GalleryImage = {
        url: result.url,
        alt: '',
        caption: '',
      }
      updateAttributes({
        images: [...images, newImage]
      })
    }
    resetUpload()
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    updateAttributes({ images: newImages })
    if (currentIndex >= newImages.length) {
      setCurrentIndex(Math.max(0, newImages.length - 1))
    }
  }

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  if (images.length === 0) {
    return (
      <NodeViewWrapper className="not-prose my-4">
        <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800/50 p-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Galeri Kosong</p>
              <p className="text-xs text-gray-400 mt-1">Tambahkan gambar untuk membuat galeri</p>
            </div>
            <div className="flex gap-3 mt-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm cursor-pointer hover:bg-brand-red/90 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Upload className="w-4 h-4" />
                Upload
              </label>
              <button
                onClick={() => setShowMediaLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Galeri
              </button>
            </div>
          </div>
        </div>
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
          allowMultiple
        />
      </NodeViewWrapper>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <NodeViewWrapper className="not-prose my-4">
      <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Galeri ({currentIndex + 1}/{images.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={deleteNode}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Main Image Display */}
        <div className="relative aspect-[16/9] bg-black">
          <img
            src={currentImage.url}
            alt={currentImage.alt || `Gallery ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Remove Button */}
          <button
            onClick={() => handleRemoveImage(currentIndex)}
            className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Caption */}
        {currentImage.caption && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">{currentImage.caption}</p>
          </div>
        )}

        {/* Thumbnails Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-200 dark:border-slate-700">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-brand-red ring-2 ring-brand-red/30'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600'
                )}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {/* Add More Button */}
            <button
              onClick={() => setShowMediaLibrary(true)}
              className="flex-shrink-0 w-16 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 hover:text-brand-red hover:border-brand-red transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex border-t border-gray-200 dark:border-slate-700">
          <label className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Upload className="w-4 h-4" />
            Upload
          </label>
          <button
            onClick={() => setShowMediaLibrary(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Galeri
          </button>
        </div>
      </div>

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
        allowMultiple
      />
    </NodeViewWrapper>
  )
}

export const GalleryExtension = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-gallery]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-gallery': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryComponent)
  },
})