'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useCallback } from 'react'
import { Trash2, Grid, Upload, Image as ImageIcon, X } from 'lucide-react'
import { MediaLibraryModal } from '../MediaLibraryModal'
import { type MediaItem } from '../../../hooks/useMediaLibrary'
import { useImageUpload } from '../../../hooks/useImageUpload'
import { cn } from '../../../lib/utils'

interface ImageGridItem {
  url: string
  alt?: string
  caption?: string
}

const ImageGridComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const images: ImageGridItem[] = node.attrs.images || []
  const cols = node.attrs.cols || 2
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const { upload, uploading, reset: resetUpload } = useImageUpload()

  const handleMediaSelect = useCallback((media: MediaItem) => {
    const newImage: ImageGridItem = {
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
      const newImage: ImageGridItem = {
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
  }

  const handleToggleCols = () => {
    updateAttributes({ cols: cols === 2 ? 3 : 2 })
  }

  const gridColsClass = cols === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <NodeViewWrapper className="not-prose my-4">
      <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Grid Gambar ({cols}x)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleCols}
              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
              title={`Ubah ke ${cols === 2 ? '3' : '2'} kolom`}
            >
              <Grid className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={deleteNode}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {images.length > 0 ? (
          <div className={cn('grid gap-2 p-3', gridColsClass)}>
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={img.url}
                  alt={img.alt || `Image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada gambar</p>
          </div>
        )}

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
        maxSelect={cols === 2 ? 2 : 3}
      />
    </NodeViewWrapper>
  )
}

export const ImageGridExtension = Node.create({
  name: 'imageGrid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
      },
      cols: {
        default: 2,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-image-grid]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-image-grid': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGridComponent)
  },

})