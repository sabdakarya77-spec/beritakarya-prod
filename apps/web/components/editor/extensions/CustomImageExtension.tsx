'use client'

import { Node, mergeAttributes, type NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useCallback } from 'react'
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { MediaLibraryModal } from '../MediaLibraryModal'
import { type MediaItem } from '../../../hooks/useMediaLibrary'
import { useImageUpload } from '../../../hooks/useImageUpload'

// [FIX] Augment Tiptap 'Commands<ReturnType>' dengan namespace 'image'
// agar TSC mengenali 'editor.chain().setImage(...)' di ChainedCommands.
// CustomImageExtension mendefinisikan command ini secara runtime.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: { src: string; alt?: string; caption?: string }) => ReturnType
    }
  }
}

/**
 * CustomImage NodeView Component
 *
 * Renders a single image with:
 * - Interactive caption input editable directly in the editor
 * - Hover controls: replace image, delete node
 * - Upload & media library support
 */
const CustomImageComponent = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const src: string = node.attrs.src || ''
  const alt: string = node.attrs.alt || ''
  const caption: string = node.attrs.caption || ''
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const { upload, uploading } = useImageUpload()

  const handleMediaSelect = useCallback((media: MediaItem) => {
    updateAttributes({
      src: media.url,
      alt: media.altText || '',
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
        src: result.url,
        alt: '',
        caption: '',
      })
    }
  }

  if (!src) {
    return (
      <NodeViewWrapper className="my-6">
        <div className="border border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-slate-800/50">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pilih gambar untuk disisipkan</p>
          <div className="flex items-center gap-3">
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
        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
        />
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="my-6">
      <figure className="not-prose m-0">
        {/* Image wrapper with hover overlay */}
        <div className="relative group rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-contain block"
            draggable={false}
          />
          {/* Hover controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
            <label
              className="p-2.5 bg-white rounded-full cursor-pointer hover:bg-gray-100 transition-colors shadow"
              title="Ganti gambar (Upload)"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <Upload className="w-4 h-4 text-gray-700" />
            </label>
            <button
              onClick={() => setShowMediaLibrary(true)}
              className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition-colors shadow"
              title="Ganti dari Galeri"
            >
              <ImageIcon className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => deleteNode()}
              className="p-2.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow"
              title="Hapus gambar"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Caption input */}
        <div className="mt-2 px-1">
          <input
            type="text"
            value={caption}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            placeholder="Ketik keterangan gambar (caption)..."
            className="w-full text-xs text-center italic text-gray-500 dark:text-gray-400 bg-transparent border-0 border-b border-dashed border-gray-200 dark:border-slate-700 focus:border-brand-red focus:outline-none pb-1 placeholder:text-gray-300 dark:placeholder:text-slate-600 transition-colors"
          />
        </div>
      </figure>

      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={handleMediaSelect}
      />
    </NodeViewWrapper>
  )
}

/**
 * CustomImage Tiptap Extension
 *
 * Replaces @tiptap/extension-image to support:
 * - caption attribute (maps to `title` for compatibility with standard Tiptap image)
 * - React NodeView with interactive caption input
 */
export const CustomImageExtension = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {}
          const el = element as HTMLImageElement
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt') || '',
            // Map title -> caption for backward compat with old @tiptap/extension-image nodes
            caption: el.getAttribute('data-caption') || el.getAttribute('title') || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...rest } = HTMLAttributes
    return [
      'img',
      mergeAttributes(rest, {
        'data-caption': caption || '',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageComponent)
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; caption?: string }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: 'image',
            attrs: {
              src: options.src,
              alt: options.alt || '',
              caption: options.caption || '',
            },
          })
        },
    }
  },
})
