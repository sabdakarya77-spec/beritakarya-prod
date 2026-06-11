'use client'

import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Code2,
  Unlink,
  GalleryHorizontal,
  Grid,
  Columns,
  AlertCircle,
  Video,
  ChevronDown,
  Pilcrow,
  CaseUpper
} from 'lucide-react'
import { MediaLibraryModal } from './MediaLibraryModal'
import { type MediaItem } from '../../hooks/useMediaLibrary'

interface TiptapEditorToolbarProps {
  editor: Editor
}

/**
 * Toolbar for Tiptap Editor
 * Provides formatting controls and actions
 */
export function TiptapEditorToolbar({ editor }: TiptapEditorToolbarProps) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [showAlignMenu, setShowAlignMenu] = useState(false)
  const [headingMenuPos, setHeadingMenuPos] = useState({ top: 0, left: 0 })
  const [alignMenuPos, setAlignMenuPos] = useState({ top: 0, left: 0 })
  const headingRef = useRef<HTMLDivElement>(null)
  const alignRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headingRef.current && !headingRef.current.contains(event.target as Node)) {
        setShowHeadingMenu(false)
      }
      if (alignRef.current && !alignRef.current.contains(event.target as Node)) {
        setShowAlignMenu(false)
      }
    }
    const handleScroll = () => {
      setShowHeadingMenu(false)
      setShowAlignMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  const toggleHeadingMenu = () => {
    if (!showHeadingMenu && headingRef.current) {
      const rect = headingRef.current.getBoundingClientRect()
      setHeadingMenuPos({
        top: rect.bottom + 4,
        left: rect.left
      })
    }
    setShowHeadingMenu(!showHeadingMenu)
    setShowAlignMenu(false)
  }

  const toggleAlignMenu = () => {
    if (!showAlignMenu && alignRef.current) {
      const rect = alignRef.current.getBoundingClientRect()
      const menuWidth = 145
      const leftPos = rect.left + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 8 : rect.left
      setAlignMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, leftPos)
      })
    }
    setShowAlignMenu(!showAlignMenu)
    setShowHeadingMenu(false)
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Masukkan URL:', previousUrl)
    
    if (url === null) return
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleMediaSelect = (media: MediaItem) => {
    if (media.url) {
      editor.chain().focus().setImage({ 
        src: media.url,
        alt: media.altText || ''
      }).run()
    }
    setShowMediaLibrary(false)
  }

  const addImage = () => {
    setShowMediaLibrary(true)
  }

  return (
    <div className="tiptap-editor-toolbar-container max-w-full relative z-20">
      <div className="tiptap-toolbar flex flex-nowrap items-center gap-1 p-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-t-lg overflow-x-auto lg:overflow-visible no-scrollbar max-w-full">
      {/* Undo/Redo */}
      <div className="flex shrink-0 items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Text Formatting */}
      <div className="flex shrink-0 items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Headings Dropdown */}
      <div ref={headingRef} className="relative shrink-0 pr-2 border-r border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={toggleHeadingMenu}
          active={editor.isActive('heading')}
          title="Format Heading"
          className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
        >
          {editor.isActive('heading', { level: 1 }) ? <Heading1 className="w-4 h-4" /> :
           editor.isActive('heading', { level: 2 }) ? <Heading2 className="w-4 h-4" /> :
           editor.isActive('heading', { level: 3 }) ? <Heading3 className="w-4 h-4" /> :
           <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">H</span>}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </ToolbarButton>
        {showHeadingMenu && (
          <div 
            style={{ top: headingMenuPos.top, left: headingMenuPos.left }}
            className="fixed z-50 min-w-[130px] rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg flex flex-col gap-0.5"
          >
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setParagraph().run()
                setShowHeadingMenu(false)
              }}
              className={`flex w-full items-center px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${!editor.isActive('heading') ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              Teks Normal
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run()
                setShowHeadingMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive('heading', { level: 1 }) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <Heading1 className="w-3.5 h-3.5" /> Heading 1
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run()
                setShowHeadingMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive('heading', { level: 2 }) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <Heading2 className="w-3.5 h-3.5" /> Heading 2
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run()
                setShowHeadingMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive('heading', { level: 3 }) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <Heading3 className="w-3.5 h-3.5" /> Heading 3
            </button>
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="flex shrink-0 items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Blockquote & Code Block */}
      <div className="flex shrink-0 items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleDropCap().run()}
          active={Boolean(editor.getAttributes('paragraph').dropCap)}
          disabled={!editor.isActive('paragraph')}
          title="Drop Cap (huruf awal besar)"
          className="text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-950/30"
        >
          <span className="flex items-baseline gap-0.5 leading-none">
            <CaseUpper className="w-3.5 h-3.5" />
            <Pilcrow className="w-3 h-3" />
          </span>
        </ToolbarButton>
      </div>

      {/* Alignment Dropdown */}
      <div ref={alignRef} className="relative shrink-0 pr-2 border-r border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={toggleAlignMenu}
          active={editor.isActive({ textAlign: 'center' }) || editor.isActive({ textAlign: 'right' }) || editor.isActive({ textAlign: 'justify' })}
          title="Perataan Teks"
          className="flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
        >
          {editor.isActive({ textAlign: 'center' }) ? <AlignCenter className="w-4 h-4" /> :
           editor.isActive({ textAlign: 'right' }) ? <AlignRight className="w-4 h-4" /> :
           editor.isActive({ textAlign: 'justify' }) ? <AlignJustify className="w-4 h-4" /> :
           <AlignLeft className="w-4 h-4" />}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </ToolbarButton>
        {showAlignMenu && (
          <div 
            style={{ top: alignMenuPos.top, left: alignMenuPos.left }}
            className="fixed z-50 min-w-[145px] rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg flex flex-col gap-0.5"
          >
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setTextAlign('left').run()
                setShowAlignMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' })) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <AlignLeft className="w-3.5 h-3.5" /> Rata Kiri
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setTextAlign('center').run()
                setShowAlignMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive({ textAlign: 'center' }) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <AlignCenter className="w-3.5 h-3.5" /> Rata Tengah
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setTextAlign('right').run()
                setShowAlignMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive({ textAlign: 'right' }) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <AlignRight className="w-3.5 h-3.5" /> Rata Kanan
            </button>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().setTextAlign('justify').run()
                setShowAlignMenu(false)
              }}
              className={`flex w-full items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 ${editor.isActive({ textAlign: 'justify' }) ? 'font-bold text-brand-red bg-brand-red/[0.05]' : ''}`}
            >
              <AlignJustify className="w-3.5 h-3.5" /> Rata Kiri Kanan
            </button>
          </div>
        )}
      </div>

      {/* Link & Image */}
      <div className="flex shrink-0 items-center gap-1">
        <ToolbarButton
          onClick={addLink}
          active={editor.isActive('link')}
          title="Insert Link (Ctrl+K)"
        >
          <Link className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink className="w-4 h-4" />
          </ToolbarButton>
        )}
      </div>

      {/* Premium Interactive Blocks */}
      <div className="flex shrink-0 items-center gap-1 pl-2 border-l border-gray-200 dark:border-slate-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().insertContent({ type: 'gallery', attrs: { images: [] } }).run()}
          active={editor.isActive('gallery')}
          title="Sisipkan Galeri Gambar"
          className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/30"
        >
          <GalleryHorizontal className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertContent({ type: 'imageGrid', attrs: { cols: 2, images: [] } }).run()}
          active={editor.isActive('imageGrid')}
          title="Sisipkan Grid Gambar"
          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/30"
        >
          <Grid className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertContent({ type: 'mediaText', attrs: { layout: 'left', imageUrl: '' }, content: [{ type: 'paragraph' }] }).run()}
          active={editor.isActive('mediaText')}
          title="Sisipkan Media + Teks"
          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
        >
          <Columns className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertContent({ type: 'callout', attrs: { variant: 'info', icon: '💡' }, content: [{ type: 'paragraph' }] }).run()}
          active={editor.isActive('callout')}
          title="Sisipkan Callout Box"
          className="text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30"
        >
          <AlertCircle className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Masukkan URL Embed (YouTube, Twitter, dll.):')
            if (url) {
              editor.chain().focus().setEmbed({ src: url }).run()
            }
          }}
          active={editor.isActive('embed')}
          title="Embed Video / URL"
          className="text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30"
        >
          <Video className="w-4 h-4" />
        </ToolbarButton>
      </div>
      
      {showMediaLibrary && (
          <MediaLibraryModal
            isOpen={showMediaLibrary}
            onClose={() => setShowMediaLibrary(false)}
            onSelect={handleMediaSelect}
          />
        )}
      </div>
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  className?: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, className, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      className={`
        p-2 rounded transition-colors duration-200
        ${active
          ? 'bg-brand-red text-white'
          : className || 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  )
}

export default TiptapEditorToolbar