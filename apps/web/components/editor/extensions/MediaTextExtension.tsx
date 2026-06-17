'use client'

import { Node, mergeAttributes, type NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { useState, useCallback } from 'react'
import { Trash2, Upload, Image as ImageIcon, X, AlignLeft, AlignRight, AlignCenter } from 'lucide-react'
import { MediaLibraryModal } from '../MediaLibraryModal'
import { type MediaItem } from '../../../hooks/useMediaLibrary'
import { useImageUpload } from '../../../hooks/useImageUpload'
import { cn } from '../../../lib/utils'

type LayoutType = 'left' | 'right' | 'center'

const MediaTextComponent = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const imageUrl: string = node.attrs.imageUrl || ''
  const layout: LayoutType = node.attrs.layout || 'left'
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const { upload, uploading, reset: resetUpload } = useImageUpload()

  const handleMediaSelect = useCallback((media: MediaItem) => {
    updateAttributes({
      imageUrl: media.url,
      altText: media.altText || '',
      caption: media.caption || '',
    })
    setShowMediaLibrary(false)
  }, [updateAttributes])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await upload(file)
    if (result) {
      updateAttributes({
        imageUrl: result.url,
        altText: '',
        caption: '',
      })
    }
    resetUpload()
  }

  const toggleLayout = (newLayout: LayoutType) => {
    updateAttributes({ layout: newLayout })
  }

  const imageOrderClass = layout === 'left' ? 'order-1' : 'order-2'
  const textOrderClass = layout === 'left' ? 'order-2' : 'order-1'

  return (
    <NodeViewWrapper className="not-prose my-4">
      <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Media + Teks
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Layout Toggle */}
            <div className="flex border border-gray-200 dark:border-slate-600 rounded-md overflow-hidden mr-2">
              <button
                onClick={() => toggleLayout('left')}
                className={cn(
                  'p-1.5 transition-colors',
                  layout === 'left' 
                    ? 'bg-brand-red text-white' 
                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                )}
                title="Gambar di kiri"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleLayout('center')}
                className={cn(
                  'p-1.5 transition-colors',
                  layout === 'center' 
                    ? 'bg-brand-red text-white' 
                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                )}
                title="Gambar di atas"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleLayout('right')}
                className={cn(
                  'p-1.5 transition-colors',
                  layout === 'right' 
                    ? 'bg-brand-red text-white' 
                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                )}
                title="Gambar di kanan"
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={deleteNode}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={cn(
          'flex',
          layout === 'center' ? 'flex-col' : 'flex-row'
        )}>
          {/* Image Section */}
          {imageUrl ? (
            <div className={cn(
              'relative group',
              layout === 'center' ? 'w-full' : 'flex-1 min-w-0',
              imageOrderClass
            )}>
              <img
                src={imageUrl}
                alt={node.attrs.altText || 'Media'}
                className={cn(
                  'w-full object-cover',
                  layout === 'center' ? 'h-64' : 'h-full min-h-[200px]'
                )}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMediaLibrary(true)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => updateAttributes({ imageUrl: '', altText: '', caption: '' })}
                    className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              'flex flex-col items-center justify-center gap-3 p-6 w-full',
              layout === 'center' ? 'w-full' : 'flex-1 min-w-0',
              imageOrderClass
            )}>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg text-sm cursor-pointer hover:bg-brand-red/90 transition-colors whitespace-nowrap">
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
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4" />
                  Galeri
                </button>
              </div>
            </div>
          )}

          {/* Text Section */}
          <div className={cn(
            'flex-1 p-4 bg-white dark:bg-slate-800 min-w-0 max-w-full overflow-hidden',
            textOrderClass
          )}>
            <NodeViewContent
              className="prose prose-sm dark:prose-invert max-w-none break-words focus:outline-none min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
      />
    </NodeViewWrapper>
  )
}

export const MediaTextExtension = Node.create({
  name: 'mediaText',
  group: 'block',
  draggable: true,
  content: 'block+',

  addAttributes() {
    return {
      imageUrl: {
        default: '',
      },
      altText: {
        default: '',
      },
      caption: {
        default: '',
      },
      layout: {
        default: 'left',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-media-text]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-media-text': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaTextComponent)
  },
})