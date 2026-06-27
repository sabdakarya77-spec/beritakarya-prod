'use client'

import { useCallback, useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { FloatingMenu } from '@tiptap/react/menus'
import {
  Plus,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Image,
  AlertCircle,
  Columns,
  GalleryHorizontal,
  Grid,
  Trash2,
} from 'lucide-react'
import { cn } from '../../../lib/utils'

interface FloatingMenuBarProps {
  editor: Editor
}

/**
 * Floating Menu — appears on empty paragraph lines as a single "+" button.
 * Clicking the "+" button expands a beautiful vertical menu, preventing horizontal clutter.
 * Also appears on non-paragraph blocks (quote, heading, etc.) with a "Hapus Blok" option.
 */
export function FloatingMenuBar({ editor }: FloatingMenuBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isOnNonParagraphBlock, setIsOnNonParagraphBlock] = useState(false)

  // Track selection changes to detect non-paragraph blocks
  useEffect(() => {
    if (!editor) return
    const handleSelectionUpdate = () => {
      setIsOpen(false)
      const { $anchor } = editor.state.selection
      const nodeType = $anchor.parent.type.name
      setIsOnNonParagraphBlock(nodeType !== 'paragraph' && nodeType !== 'doc')
    }
    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor])

  const deleteCurrentBlock = () => {
    if (!editor) return
    const { $anchor } = editor.state.selection
    const depth = $anchor.depth
    if (depth > 0) {
      const node = $anchor.node(depth)
      const pos = $anchor.before(depth)
      editor.chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .insertContentAt(pos, { type: 'paragraph' })
        .run()
    }
    setIsOpen(false)
  }

  const insertImage = useCallback(() => {
    const url = window.prompt('Masukkan URL gambar')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const menuItems = [
    {
      icon: <Image size={16} />,
      title: 'Gambar',
      action: () => insertImage(),
    },
    { divider: true },
    {
      icon: <Heading1 size={16} />,
      title: 'Heading 1',
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor?.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 size={16} />,
      title: 'Heading 2',
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor?.isActive('heading', { level: 2 }),
    },
    {
      icon: <Heading3 size={16} />,
      title: 'Heading 3',
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor?.isActive('heading', { level: 3 }),
    },
    { divider: true },
    {
      icon: <List size={16} />,
      title: 'Bullet List',
      action: () => editor?.chain().focus().toggleBulletList().run(),
      isActive: () => editor?.isActive('bulletList'),
    },
    {
      icon: <ListOrdered size={16} />,
      title: 'Numbered List',
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      isActive: () => editor?.isActive('orderedList'),
    },
    { divider: true },
    {
      icon: <Quote size={16} />,
      title: 'Kutipan',
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: 'quote',
            attrs: { variant: 'default' },
            content: [{ type: 'paragraph' }],
          })
          .run(),
      isActive: () => editor?.isActive('quote'),
    },
    {
      icon: <AlertCircle size={16} />,
      title: 'Callout',
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: 'callout',
            attrs: { variant: 'info', icon: '💡' },
            content: [{ type: 'paragraph' }],
          })
          .run(),
      isActive: () => editor?.isActive('callout'),
    },
    {
      icon: <Columns size={16} />,
      title: 'Media + Teks',
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: 'mediaText',
            attrs: { layout: 'left', imageUrl: '' },
            content: [{ type: 'paragraph' }],
          })
          .run(),
    },
    {
      icon: <Grid size={16} />,
      title: 'Image Grid',
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: 'imageGrid',
            attrs: { cols: 2, images: [] },
          })
          .run(),
    },
    {
      icon: <GalleryHorizontal size={16} />,
      title: 'Galeri',
      action: () =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: 'gallery',
            attrs: { images: [] },
          })
          .run(),
    },
    { divider: true },
    {
      icon: <Code size={16} />,
      title: 'Code Block',
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      isActive: () => editor?.isActive('codeBlock'),
    },
    {
      icon: <Minus size={16} />,
      title: 'Pemisah',
      action: () => editor?.chain().focus().setHorizontalRule().run(),
    },
  ]

  return (
    <FloatingMenu
      editor={editor}
      options={{
        placement: 'bottom-start',
        offset: 8,
      }}
      shouldShow={({ state }) => {
        const { $anchor, empty } = state.selection
        if (!empty) return false
        const nodeType = $anchor.parent.type.name
        // Show on empty paragraphs (for insert menu)
        if (nodeType === 'paragraph' && $anchor.parent.content.size === 0) return true
        // Show on non-paragraph blocks (for delete option)
        if (nodeType !== 'paragraph' && nodeType !== 'doc') return true
        return false
      }}
    >
      <div className="relative z-50">
        {/* Toggle Button (Plus icon rotates to cross when open) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full border shadow-md transition-all duration-200 cursor-pointer",
            isOpen
              ? "bg-brand-red border-brand-red text-white rotate-45"
              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-gray-200"
          )}
          title="Sisipkan Blok"
        >
          <Plus size={16} />
        </button>

        {/* Dropdown Menu (Premium Vertical List) */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-60 max-h-[280px] overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-2xl flex flex-col gap-0.5 z-[9999] no-scrollbar">
            {/* Delete block option - only show when on non-paragraph block */}
            {isOnNonParagraphBlock && (
              <button
                type="button"
                onClick={deleteCurrentBlock}
                className="flex items-center gap-3 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-red-100 dark:bg-red-900/30 text-red-500">
                  <Trash2 size={16} />
                </span>
                <span>Hapus Blok</span>
              </button>
            )}
            {isOnNonParagraphBlock && <div className="my-1 border-t border-gray-100 dark:border-slate-700/50" />}
            {menuItems.map((item, index) => {
              if ('divider' in item) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-1 border-t border-gray-100 dark:border-slate-700/50"
                  />
                )
              }

              const isActive = 'isActive' in item && item.isActive?.()

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    item.action()
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-brand-red/[0.08] text-brand-red font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-md transition-colors",
                    isActive
                      ? "bg-brand-red/10 text-brand-red"
                      : "bg-gray-100 dark:bg-slate-700/85 text-gray-500 dark:text-gray-400"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </FloatingMenu>
  )
}

export default FloatingMenuBar