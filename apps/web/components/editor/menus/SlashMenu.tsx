'use client'

import { forwardRef, useEffect, useImperativeHandle, useState, useCallback } from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  AlertCircle,
  Video,
  Minus,
  Grid,
  Columns,
  GalleryHorizontal,
} from 'lucide-react'
import { type MediaItem } from '../../../hooks/useMediaLibrary'
import type { Editor } from '@tiptap/react'

export interface SlashMenuItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor, ...args: unknown[]) => void
}

export interface SlashMenuProps {
  editor: Editor
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
}

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const MenuList = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm">
          No results found
        </div>
      )
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden max-h-[300px] overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => selectItem(index)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
              ${index === selectedIndex
                ? 'bg-brand-red/10 text-brand-red'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}
            `}
          >
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
              ${index === selectedIndex
                ? 'bg-brand-red/20'
                : 'bg-gray-100 dark:bg-slate-700'}
            `}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{item.title}</div>
              <div className="text-xs text-gray-500 truncate">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

MenuList.displayName = 'MenuList'

// Hook untuk handle Image command dengan modal
export function useImageCommand(editor: Editor | null | undefined) {
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleMediaSelect = useCallback((media: MediaItem) => {
    if (editor) {
      editor.chain().focus().setImage({
        src: media.url,
        alt: media.altText || '',
        caption: media.caption || '',
      } as Parameters<ReturnType<typeof editor.chain>['setImage']>[0]).run()
    }
    setShowMediaLibrary(false)
  }, [editor])

  const handleUrlSubmit = useCallback((url: string) => {
    if (editor && url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
    setShowUrlInput(false)
  }, [editor])

  const openMediaLibrary = useCallback(() => {
    setShowMediaLibrary(true)
  }, [])

  const openUrlInput = useCallback(() => {
    setShowUrlInput(true)
  }, [])

  return {
    showMediaLibrary,
    showUrlInput,
    setShowMediaLibrary,
    setShowUrlInput,
    handleMediaSelect,
    handleUrlSubmit,
    openMediaLibrary,
    openUrlInput,
  }
}

export const defaultSlashMenuItems: SlashMenuItem[] = [
  {
    title: 'Paragraph',
    description: 'Start writing plain text',
    icon: <Type size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a bulleted list',
    icon: <List size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: <ListOrdered size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    description: 'Capture a quote with attribution',
    icon: <Quote size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'quote',
        attrs: { variant: 'default' },
        content: [{ type: 'paragraph' }],
      }).run()
    },
  },
  {
    title: 'Code Block',
    description: 'Display code with syntax',
    icon: <Code size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: <Image size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (_editor, ...args) => {
      // Command ini akan dipanggil dengan callback untuk membuka modal
      // Di handleCommand di TiptapEditor, kita akan pass onOpenMediaLibrary
      const onOpenMediaLibrary = args[0] as (() => void) | undefined
      if (onOpenMediaLibrary) {
        onOpenMediaLibrary()
      }
    },
  },
  {
    title: 'Image Grid',
    description: 'Grid 2x1 or 3x1 images',
    icon: <Grid size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'imageGrid',
        attrs: { cols: 2, images: [] },
      }).run()
    },
  },
  {
    title: 'Gallery',
    description: 'Horizontal scrolling gallery',
    icon: <GalleryHorizontal size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'gallery',
        attrs: { images: [] },
      }).run()
    },
  },
  {
    title: 'Embed',
    description: 'Embed video or URL',
    icon: <Video size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => {
      const url = window.prompt('Enter embed URL (YouTube, Twitter, etc.)')
      if (url) {
        try {
          editor.chain().focus().setEmbed({ src: url }).run()
        } catch {
          // Fallback if setEmbed command not available
          editor.chain().focus().insertContent({
            type: 'embed',
            attrs: { url, embedType: 'other' },
          }).run()
        }
      }
    },
  },
  {
    title: 'Media + Text',
    description: 'Image with text side by side',
    icon: <Columns size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'mediaText',
        attrs: { layout: 'left', imageUrl: '' },
        content: [{ type: 'paragraph' }],
      }).run()
    },
  },
  {
    title: 'Callout Box',
    description: 'Add a highlighted box for notes or tips',
    icon: <AlertCircle size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'callout',
        attrs: { variant: 'info', icon: '💡' },
        content: [{ type: 'paragraph' }],
      }).run()
    },
  },
  {
    title: 'Divider',
    description: 'Visual separator between sections',
    icon: <Minus size={18} className="text-gray-600 dark:text-gray-400" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

export { MenuList }
export default MenuList
