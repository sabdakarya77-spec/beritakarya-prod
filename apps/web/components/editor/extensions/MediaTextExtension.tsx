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
    // [FIX] Bawa dimensi asli dari media library (jika ada) supaya editor
    // preview dan halaman publish tidak terpotong.
    updateAttributes({
      imageUrl: media.url,
      altText: media.altText || '',
      caption: media.caption || '',
      ...(typeof media.width === 'number' && media.width > 0 ? { width: media.width } : {}),
      ...(typeof media.height === 'number' && media.height > 0 ? { height: media.height } : {})
    })
    setShowMediaLibrary(false)
  }, [updateAttributes])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await upload(file)
    if (result) {
      // [FIX] useImageUpload sudah mengembalikan width/height, simpan juga
      // agar renderer tidak perlu fallback hardcoded.
      updateAttributes({
        imageUrl: result.url,
        altText: '',
        caption: '',
        ...(typeof result.width === 'number' && result.width > 0 ? { width: result.width } : {}),
        ...(typeof result.height === 'number' && result.height > 0 ? { height: result.height } : {})
      })
    }
    resetUpload()
  }

  const toggleLayout = (newLayout: LayoutType) => {
    updateAttributes({ layout: newLayout })
  }

  const handleClearImage = useCallback(() => {
    updateAttributes({ imageUrl: '', altText: '', caption: '', width: 0, height: 0 })
  }, [updateAttributes])

  return (
    <NodeViewWrapper className="my-4">
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
            {/* Layout Toggle — sekarang termasuk 'center' */}
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
              <button
                onClick={() => toggleLayout('center')}
                className={cn(
                  'p-1.5 transition-colors',
                  layout === 'center'
                    ? 'bg-brand-red text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                )}
                title="Gambar di tengah (vertikal)"
              >
                <AlignCenter className="w-4 h-4" />
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

        {/* Content — [FIX] layout: 'center' ditambahkan, 'h-full min-h-[200px]' dihapus
            agar gambar tidak dipaksa menutupi area teks (penyebab preview != publish). */}
        <div className={cn(
          'flex',
          layout === 'center' ? 'flex-col' : 'flex-row'
        )}>
          {/* Image Section */}
          {imageUrl ? (
            <div className={cn(
              'relative group',
              layout === 'center' ? 'w-full' : 'flex-1 min-w-0',
            )}>
              <img
                src={imageUrl}
                alt={node.attrs.altText || 'Media'}
                className={cn(
                  // [FIX] Pakai h-auto + object-contain (bukan object-cover + h-full)
                  // supaya gambar tidak terpotong di editor preview.
                  'w-full h-auto object-contain bg-gray-100 dark:bg-slate-800',
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
                    onClick={handleClearImage}
                    className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              {node.attrs.caption ? (
                <div className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400 italic text-center bg-white/70 dark:bg-slate-900/60">
                  {node.attrs.caption}
                </div>
              ) : null}
            </div>
          ) : (
            <div className={cn(
              'flex flex-col items-center justify-center gap-3 p-6 w-full',
              layout === 'center' ? 'w-full' : 'flex-1 min-w-0',
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
          )}>
            <NodeViewContent
              className="max-w-none break-words focus:outline-none min-h-[100px] text-sm leading-relaxed text-gray-800 dark:text-gray-200"
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
      // [FIX] Tambahan: dimensi gambar asli untuk pertahankan rasio aspek
      // saat render di editor dan publish.
      width: {
        default: null,
        parseHTML: (element) => {
          const v = (element as HTMLElement).getAttribute('data-width')
          const n = v ? Number(v) : NaN
          return Number.isFinite(n) && n > 0 ? n : null
        },
        renderHTML: (attrs) => {
          const w = attrs.width as number | null | undefined
          return typeof w === 'number' && w > 0 ? { 'data-width': String(w) } : {}
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const v = (element as HTMLElement).getAttribute('data-height')
          const n = v ? Number(v) : NaN
          return Number.isFinite(n) && n > 0 ? n : null
        },
        renderHTML: (attrs) => {
          const h = attrs.height as number | null | undefined
          return typeof h === 'number' && h > 0 ? { 'data-height': String(h) } : {}
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-media-text]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {}
          const dom = element as HTMLElement
          const layoutAttr = dom.getAttribute('data-layout')
          const layout: LayoutType =
            layoutAttr === 'right' || layoutAttr === 'center' ? layoutAttr : 'left'
          const widthAttr = dom.getAttribute('data-width')
          const heightAttr = dom.getAttribute('data-height')
          const width = widthAttr ? Number(widthAttr) : NaN
          const height = heightAttr ? Number(heightAttr) : NaN
          return {
            imageUrl: dom.getAttribute('data-image-url') || '',
            altText: dom.getAttribute('data-alt-text') || '',
            caption: dom.getAttribute('data-caption') || '',
            layout,
            ...(Number.isFinite(width) && width > 0 ? { width } : {}),
            ...(Number.isFinite(height) && height > 0 ? { height } : {}),
          }
        },
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