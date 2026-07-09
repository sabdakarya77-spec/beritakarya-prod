'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { TiptapEditorToolbar } from './TiptapEditorToolbar'
import { BubbleMenuBar } from './menus/BubbleMenuBar'
import { FloatingMenuBar } from './menus/FloatingMenu'
import { useEditorStore } from '../../store/editorStore'
import type { Block, TextAlign as TextAlignType, ImageItem } from '@beritakarya/types'

// Custom extensions imports
import { CalloutExtension } from './extensions/CalloutExtension'
import { EmbedExtension } from './extensions/EmbedExtension'
import { QuoteExtension } from './extensions/QuoteExtension'
import { GalleryExtension } from './extensions/GalleryExtension'
import { ImageGridExtension } from './extensions/ImageGridExtension'
import { MediaTextExtension } from './extensions/MediaTextExtension'
import { SlashMenuExtension } from './extensions/SlashMenuExtension'
import { DropCapParagraph } from './extensions/DropCapExtension'

/** Represents a ProseMirror JSON node from editor.getJSON() */
interface JSONNode {
  type: string
  text?: string
  content?: JSONNode[]
  marks?: JSONMark[]
  attrs?: Record<string, unknown>
}

/** Represents a ProseMirror JSON mark */
interface JSONMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TiptapEditorProps {
  initialContent?: string
  editable?: boolean
}

/**
 * Main Tiptap Editor Component with Store Integration
 *
 * Features:
 * - StarterKit (paragraphs, headings, lists, bold, italic, etc.)
 * - Link insertion
 * - Image support
 * - Text alignment
 * - Underline & Highlight
 * - Placeholder text
 * - Bubble Menu (text formatting on selection)
 * - Floating Menu (insert blocks)
 * - Store sync
 */
export function TiptapEditor({
  initialContent = '',
  editable = true
}: TiptapEditorProps) {
  const {
    blocks,
    setBlocks,
    isLoading,
  } = useEditorStore()

  const isInitializedRef = useRef(false)
  const contentFromStoreRef = useRef<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        blockquote: false, // Nonaktifkan blockquote default untuk memakai QuoteExtension custom kita yang hebat
        paragraph: false, // Disable default so DropCapParagraph node is used
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      DropCapParagraph,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Ketik subjudul...'
          }
          return "Tulis paragraf baru, atau ketik '/' untuk menyisipkan galeri, gambar, callout..."
        },
        showOnlyCurrent: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'quote'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      CalloutExtension,
      EmbedExtension,
      QuoteExtension,
      GalleryExtension,
      ImageGridExtension,
      MediaTextExtension,
      SlashMenuExtension,
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      // Ambil blocks lama untuk mencocokkan ID secara stabil
      const oldBlocks = useEditorStore.getState().blocks
      const blocks = convertTiptapToBlocks(editor, oldBlocks)
      setBlocks(blocks)
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content max-w-none focus:outline-none min-h-[200px] py-4',
      },
    },
  })

  // Load initial content from store when blocks change (e.g., after loadArticle)
  useEffect(() => {
    if (!editor || isLoading) return

    // [FIX] Check if store has meaningful content different from what's in the editor
    // Previously, the editor's initial empty paragraph was treated as "has content",
    // preventing store content from loading after an article fetch.
    const currentContent = editor.getJSON()
    const hasContent = currentContent.content && currentContent.content.length > 0

    // Check if editor only has a single empty paragraph (Tiptap's default initial state)
    const isOnlyEmptyParagraph =
      currentContent.content &&
      currentContent.content.length === 1 &&
      currentContent.content[0]?.type === 'paragraph' &&
      (!currentContent.content[0]?.content || currentContent.content[0].content.length === 0)

    // Check if store blocks have meaningful content (not just empty paragraphs)
    const storeHasContent =
      blocks &&
      blocks.length > 0 &&
      blocks.some(b => {
        if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote' || b.type === 'callout')
          return 'content' in b && typeof b.content === 'string' && b.content.trim()
        if (b.type === 'image' || b.type === 'embed' || b.type === 'gallery' || b.type === 'imageGrid' || b.type === 'mediaText')
          return true
        if (b.type === 'list') return 'items' in b && Array.isArray(b.items) && b.items.length > 0
        return false
      })

    // Load from store if: editor is empty OR editor only has default empty paragraph,
    // AND store has blocks with actual content
    if ((!hasContent || isOnlyEmptyParagraph) && storeHasContent) {
      const html = convertBlocksToHTML(blocks)

      // Avoid infinite loop by checking if content is different
      if (html !== contentFromStoreRef.current) {
        contentFromStoreRef.current = html
        editor.commands.setContent(html)
      }
    }
  }, [editor, blocks, isLoading])

  // Mark as initialized after first content set
  useEffect(() => {
    if (editor && !isInitializedRef.current) {
      const content = editor.getJSON()
      if (content.content && content.content.length > 0) {
        isInitializedRef.current = true
      }
    }
  }, [editor])

  // Listen to AI apply content event
  useEffect(() => {
    if (!editor) return

    const handleAIApply = (e: Event) => {
      const customEvent = e as CustomEvent
      const content = customEvent.detail?.content
      if (content) {
        editor.commands.insertContent(content)
      }
    }

    window.addEventListener('ai-apply-content', handleAIApply)
    return () => {
      window.removeEventListener('ai-apply-content', handleAIApply)
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    )
  }

  return (
    <div className="tiptap-editor-wrapper">
      {/* Bubble Menu (appears on text selection) */}
      <BubbleMenuBar editor={editor} />

      {/* Toolbar */}
      <TiptapEditorToolbar editor={editor} />

      {/* Floating Menu (appears on empty lines) */}
      <FloatingMenuBar editor={editor} />

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}

/**
 * Convert Tiptap JSON content to Block[] with stable ID mapping and custom extension support
 */
function convertTiptapToBlocks(editor: Editor, oldBlocks: Block[] = []): Block[] {
  const doc = editor.getJSON()
  const content: JSONNode[] = doc.content || []

  return content.map((node: JSONNode, index: number): Block => {
    let blockId = ''

    // Konversi tipe tiptap ke tipe block kita demi pencocokan ID
    let mappedType = node.type
    if (node.type === 'blockquote') mappedType = 'quote'
    else if (node.type === 'bulletList' || node.type === 'orderedList') mappedType = 'list'
    else if (node.type === 'codeBlock') mappedType = 'paragraph'

    // Pencocokan 1: periksa index yang sama
    const oldBlockAtIndex = oldBlocks[index]
    if (oldBlockAtIndex && oldBlockAtIndex.type === mappedType) {
      blockId = oldBlockAtIndex.id
    } else {
      // Pencocokan 2: cari blok lama terdekat dengan tipe yang sama yang belum diklaim
      const foundBlock = oldBlocks.find(b => b.type === mappedType && !content.some((n: JSONNode, idx: number) => idx < index && oldBlocks[idx]?.id === b.id))
      if (foundBlock) {
        blockId = foundBlock.id
      } else {
        // Fallback: buat ID baru yang unik dan stabil
        blockId = `block-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
      }
    }

    const baseBlock = {
      id: blockId,
    }

    switch (node.type) {
      case 'paragraph':
        return {
          ...baseBlock,
          type: 'paragraph' as const,
          content: extractTextContent(node),
          dropCap: node.attrs?.dropCap === true,
          textAlign: node.attrs?.textAlign as TextAlignType | undefined,
        }
      case 'heading':
        return {
          ...baseBlock,
          type: 'heading' as const,
          level: ((node.attrs?.level as number) || 2) as 1 | 2 | 3 | 4 | 5 | 6,
          content: extractTextContent(node),
          textAlign: node.attrs?.textAlign as TextAlignType | undefined,
        }
      case 'blockquote':
      case 'quote':
        return {
          ...baseBlock,
          type: 'quote' as const,
          content: extractTextContent(node),
          attribution: (node.attrs?.attribution as string) || '',
        }
      case 'callout':
        return {
          ...baseBlock,
          type: 'callout' as const,
          content: extractTextContent(node),
          variant: ((node.attrs?.variant as string) || 'editorial') as 'info' | 'warning' | 'error' | 'success' | 'editorial' | 'tip',
          icon: (node.attrs?.icon as string) || '💡',
        }
      case 'embed':
        return {
          ...baseBlock,
          type: 'embed' as const,
          url: (node.attrs?.src as string) || '',
          embedType: ((node.attrs?.embedType as string) || 'other') as 'youtube' | 'twitter' | 'instagram' | 'other',
        }
      case 'gallery':
        return {
          ...baseBlock,
          type: 'gallery' as const,
          images: (node.attrs?.images as ImageItem[]) || [],
        }
      case 'imageGrid':
        return {
          ...baseBlock,
          type: 'imageGrid' as const,
          columns: (node.attrs?.cols === 3 ? 3 : 2) as 2 | 3,
          images: (node.attrs?.images as ImageItem[]) || [],
        }
      case 'mediaText':
        // [FIX] Map Tiptap attrs (imageUrl, altText, layout, caption, width, height)
        // to API block schema (url, alt, content, align, caption, width, height)
        // per article.validator.ts.
        // Text content is stored as child nodes (content: 'block+'), not as an attribute.
        // align: 'left' | 'right' | 'center' — all three are preserved (was previously
        // dropped to 'left' | 'right', causing 'center' to be silently forced to 'left').
        return {
          ...baseBlock,
          type: 'mediaText' as const,
          url: (node.attrs?.imageUrl as string) || '',
          alt: (node.attrs?.altText as string) || '',
          // [FIX] Caption was dropped here, so any caption typed in the editor
          // never reached the published page.
          caption: ((node.attrs?.caption as string) || '').trim() || undefined,
          content: extractTextContent(node),
          align: ((): 'left' | 'right' | 'center' => {
            const layout = node.attrs?.layout as string | undefined
            if (layout === 'right' || layout === 'center') return layout
            return 'left'
          })(),
          // [FIX] Carry through original image dimensions so the renderer can
          // preserve aspect ratio and avoid forced cropping.
          ...(typeof node.attrs?.width === 'number' && (node.attrs.width as number) > 0
            ? { width: node.attrs.width as number }
            : {}),
          ...(typeof node.attrs?.height === 'number' && (node.attrs.height as number) > 0
            ? { height: node.attrs.height as number }
            : {})
        }
      case 'image':
        return {
          ...baseBlock,
          type: 'image' as const,
          url: (node.attrs?.src as string) || '',
          alt: (node.attrs?.alt as string) || '',
          caption: (node.attrs?.title as string) || '',
        }
      case 'bulletList':
        return {
          ...baseBlock,
          type: 'list' as const,
          ordered: false,
          items: extractListItems(node),
        }
      case 'orderedList':
        return {
          ...baseBlock,
          type: 'list' as const,
          ordered: true,
          items: extractListItems(node),
        }
      case 'codeBlock':
        return {
          ...baseBlock,
          type: 'paragraph' as const,
          content: extractTextContent(node),
        }
      default:
        return {
          ...baseBlock,
          type: 'paragraph' as const,
          content: extractTextContent(node),
        }
    }
  })
}

/**
 * Extract text content from Tiptap node with marks
 */
function extractTextContent(node: JSONNode): string {
  if (!node.content) return ''

  return node.content
    .map((child: JSONNode) => {
      if (child.type === 'text') {
        let text = child.text || ''
        if (child.marks) {
          child.marks.forEach((mark: JSONMark) => {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`
                break
              case 'italic':
                text = `<em>${text}</em>`
                break
              case 'underline':
                text = `<u>${text}</u>`
                break
              case 'link':
                text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`
                break
              case 'highlight':
                text = `<mark>${text}</mark>`
                break
              case 'code':
                text = `<code>${text}</code>`
                break
              case 'strike':
                text = `<s>${text}</s>`
                break
            }
          })
        }
        return text
      }
      if (child.type === 'hardBreak') return '<br>'
      if (child.type === 'taskList') {
        // Handle task list items
        const items = child.content?.map((item: JSONNode) => {
          const text = extractTextContent(item)
          const checked = item.attrs?.checked
          return `<li>${checked ? '☑' : '☐'} ${text}</li>`
        }).join('') || ''
        return `<ul>${items}</ul>`
      }
      // Recurse into block children (paragraph, heading, etc.) used by mediaText, callout, etc.
      if (child.content && child.type !== 'text') {
        const inner = extractTextContent(child)
        switch (child.type) {
          case 'paragraph':
            return `<p>${inner}</p>`
          case 'heading': {
            const level = child.attrs?.level || 2
            return `<h${level}>${inner}</h${level}>`
          }
          case 'blockquote':
          case 'quote':
            return `<blockquote>${inner}</blockquote>`
          case 'listItem':
            return `<li>${inner}</li>`
          default:
            return inner
        }
      }
      return ''
    })
    .join('')
}

/**
 * Extract list items from list node
 */
function extractListItems(node: JSONNode): string[] {
  if (!node.content) return []

  return node.content.map((item: JSONNode) => extractTextContent(item))
}

/**
 * Safely encode a value as a JSON string for use inside an HTML attribute.
 * Double-quotes are replaced with &quot; so the attribute value doesn't break.
 */
function encodeJsonAttr(value: unknown): string {
  return JSON.stringify(value).replace(/"/g, '&quot;')
}

/**
 * Convert Block[] to HTML for Tiptap
 */
function convertBlocksToHTML(blocks: Block[]): string {
  if (!blocks || blocks.length === 0) return ''

  return blocks
    .map((block) => {
      const content = 'content' in block && typeof block.content === 'string' ? block.content : ''

      switch (block.type) {
        case 'paragraph': {
          const dropCap = block.dropCap === true
          const dataAttr = dropCap ? ' data-drop-cap="true"' : ''
          return content ? `<p${dataAttr}>${content}</p>` : `<p${dataAttr}></p>`
        }
        case 'heading': {
          const level = block.level || 2
          return content ? `<h${level}>${content}</h${level}>` : `<h${level}></h${level}>`
        }
        case 'quote': {
          const cite = block.attribution ? `<cite>${block.attribution}</cite>` : ''
          return content ? `<blockquote><p>${content}</p>${cite}</blockquote>` : '<blockquote><p></p></blockquote>'
        }
        case 'image': {
          const alt = block.alt || ''
          const caption = block.caption ? `<p>${block.caption}</p>` : ''
          return block.url ? `<img src="${block.url}" alt="${alt}" />${caption}` : ''
        }
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul'
          const items = (block.items || []).map((item: string) => `<li>${item}</li>`).join('')
          return items ? `<${tag}>${items}</${tag}>` : `<${tag}></${tag}>`
        }
        case 'callout': {
          const calloutVariant = block.variant || 'editorial'
          const calloutIcon = block.icon || '💡'
          return `<div data-callout="${calloutVariant}">${calloutIcon} ${content}</div>`
        }
        case 'embed': {
          const embedUrl = block.url || ''
          const embedType = block.embedType || 'other'
          return `<div data-embed-type="${embedType}">${embedUrl}</div>`
        }
        case 'gallery': {
          const galleryImages = block.images || []
          return `<div data-gallery="" data-images="${encodeJsonAttr(galleryImages)}"></div>`
        }
        case 'imageGrid': {
          const gridImages = block.images || []
          const gridCols = block.columns ?? 2
          return `<div data-image-grid="" data-images="${encodeJsonAttr(gridImages)}" data-cols="${gridCols}"></div>`
        }
        case 'mediaText': {
          const mtUrl = block.url || ''
          const mtAlt = block.alt || ''
          const mtLayout = block.align || 'left'
          const mtCaption = block.caption || ''
          // [FIX] Bawa dimensi asli supaya editor preview konsisten dengan publish
          // dan tidak memaksa rasio aspek yang berbeda.
          const mtWidth = typeof block.width === 'number' && block.width > 0 ? block.width : ''
          const mtHeight = typeof block.height === 'number' && block.height > 0 ? block.height : ''
          const dimAttrs = mtWidth !== '' || mtHeight !== ''
            ? ` data-width="${mtWidth}" data-height="${mtHeight}"`
            : ''
          return `<div data-media-text="" data-layout="${mtLayout}" data-image-url="${mtUrl}" data-alt-text="${mtAlt}" data-caption="${mtCaption}"${dimAttrs}>${content}</div>`
        }
        default:
          return content ? `<p>${content}</p>` : '<p></p>'
      }
    })
    .join('')
}

export default TiptapEditor
