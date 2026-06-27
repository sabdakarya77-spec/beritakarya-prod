'use client'

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  CaseUpper,
} from 'lucide-react'
import { cn } from '../../../lib/utils'

interface BubbleMenuBarProps {
  editor: Editor
}

/**
 * Bubble Menu - appears on text selection using Tiptap React BubbleMenu component
 *
 * On mobile devices, the menu appears below the selection to avoid overlapping
 * with the native context menu (cut/copy/paste) which typically appears above.
 */
export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-1 p-1 bg-slate-900 dark:bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50"
      options={{
        placement: isMobile ? 'bottom' : 'top',
        offset: isMobile ? 16 : 8,
      }}
    >
      <BubbleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </BubbleButton>

      <BubbleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </BubbleButton>

      <BubbleButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline size={16} />
      </BubbleButton>

      <BubbleButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </BubbleButton>

      <BubbleButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code"
      >
        <Code size={16} />
      </BubbleButton>

      <div className="w-px h-5 bg-slate-600 mx-1" />

      <BubbleButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Add Link (Ctrl+K)"
      >
        <Link size={16} />
      </BubbleButton>

      <BubbleButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter size={16} />
      </BubbleButton>

      <div className="w-px h-5 bg-slate-600 mx-1" />

      <BubbleButton
        onClick={() => editor.chain().focus().toggleDropCap().run()}
        isActive={Boolean(editor.getAttributes('paragraph').dropCap)}
        disabled={!editor.isActive('paragraph')}
        title="Drop Cap (huruf awal besar)"
      >
        <CaseUpper size={16} />
      </BubbleButton>
    </BubbleMenu>
  )
}

interface BubbleButtonProps {
  onClick: () => void
  isActive: boolean
  title: string
  disabled?: boolean
  children: React.ReactNode
}

function BubbleButton({ onClick, isActive, title, disabled, children }: BubbleButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-2 lg:p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
        isActive
          ? 'bg-brand-red text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

export default BubbleMenuBar
