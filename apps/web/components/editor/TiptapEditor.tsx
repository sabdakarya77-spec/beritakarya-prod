'use client'

import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
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

// Custom extensions imports
import { CalloutExtension } from './extensions/CalloutExtension'
import { EmbedExtension } from './extensions/EmbedExtension'
import { QuoteExtension } from './extensions/QuoteExtension'
import { GalleryExtension } from './extensions/GalleryExtension'
import { ImageGridExtension } from './extensions/ImageGridExtension'
import { MediaTextExtension } from './extensions/MediaTextExtension'
import { SlashMenuExtension } from './extensions/SlashMenuExtension'
import { DropCapParagraph } from './extensions/DropCapExtension'

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
    saveArticle,
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
        class: 'tiptap-editor-content prose prose-lg max-w-none focus:outline-none min-h-[200px] py-4',
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
          return (b as any).content?.trim()
        if (b.type === 'image' || b.type === 'embed' || b.type === 'gallery' || b.type === 'imageGrid' || b.type === 'mediaText')
          return true
        if (b.type === 'list') return (b as any).items?.length > 0
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
function convertTiptapToBlocks(editor: any, oldBlocks: any[] = []): any[] {
  const doc = editor.getJSON()
  const content = doc.content || []

  return content.map((node: any, index: number) => {
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
      const foundBlock = oldBlocks.find(b => b.type === mappedType && !content.some((n: any, idx: number) => idx < index && oldBlocks[idx]?.id === b.id))
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
          type: 'paragraph',
          content: extractTextContent(node),
          dropCap: node.attrs?.dropCap === true,
          textAlign: node.attrs?.textAlign,
        }
      case 'heading':
        return {
          ...baseBlock,
          type: 'heading',
          level: node.attrs?.level || 2,
          content: extractTextContent(node),
          textAlign: node.attrs?.textAlign,
        }
      case 'blockquote':
      case 'quote':
        return {
          ...baseBlock,
          type: 'quote',
          content: extractTextContent(node),
          attribution: node.attrs?.attribution || '',
          variant: node.attrs?.variant || 'default',
        }
      case 'callout':
        return {
          ...baseBlock,
          type: 'callout',
          content: extractTextContent(node),
          variant: node.attrs?.variant || 'editorial',
          icon: node.attrs?.icon || '💡',
        }
      case 'embed':
        return {
          ...baseBlock,
          type: 'embed',
          url: node.attrs?.src || '',
          embedType: node.attrs?.embedType || 'other',
        }
      case 'gallery':
        return {
          ...baseBlock,
          type: 'gallery',
          images: node.attrs?.images || [],
        }
      case 'imageGrid':
        return {
          ...baseBlock,
          type: 'imageGrid',
          columns: node.attrs?.cols === 3 ? 3 : 2,
          images: node.attrs?.images || [],
        }
      case 'mediaText':
        // [FIX] Map Tiptap attrs (imageUrl, altText, text, layout, caption)
        // to API block schema (url, alt, content, align, caption) per article.validator.ts
        return {
          ...baseBlock,
          type: 'mediaText',
          url: node.attrs?.imageUrl || '',
          alt: node.attrs?.altText || '',
          content: node.attrs?.text || '',
          align: node.attrs?.layout || 'left',
          ...(node.attrs?.caption ? { caption: node.attrs.caption } : {}),
        }
      case 'image':
        return {
          ...baseBlock,
          type: 'image',
          url: node.attrs?.src || '',
          alt: node.attrs?.alt || '',
          caption: node.attrs?.title || '',
        }
      case 'bulletList':
        return {
          ...baseBlock,
          type: 'list',
          ordered: false,
          items: extractListItems(node),
        }
      case 'orderedList':
        return {
          ...baseBlock,
          type: 'list',
          ordered: true,
          items: extractListItems(node),
        }
      case 'codeBlock':
        return {
          ...baseBlock,
          type: 'paragraph',
          content: extractTextContent(node),
        }
      default:
        return {
          ...baseBlock,
          type: 'paragraph',
          content: extractTextContent(node),
        }
    }
  })
}

/**
 * Extract text content from Tiptap node with marks
 */
function extractTextContent(node: any): string {
  if (!node.content) return ''

  return node.content
    .map((child: any) => {
      if (child.type === 'text') {
        let text = child.text || ''
        if (child.marks) {
          child.marks.forEach((mark: any) => {
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
        const items = child.content?.map((item: any) => {
          const text = extractTextContent(item)
          const checked = item.attrs?.checked
          return `<li>${checked ? '☑' : '☐'} ${text}</li>`
        }).join('') || ''
        return `<ul>${items}</ul>`
      }
      return ''
    })
    .join('')
}

/**
 * Extract list items from list node
 */
function extractListItems(node: any): string[] {
  if (!node.content) return []

  return node.content.map((item: any) => extractTextContent(item))
}

/**
 * Convert Block[] to HTML for Tiptap
 */
function convertBlocksToHTML(blocks: any[]): string {
  if (!blocks || blocks.length === 0) return ''

  return blocks
    .map((block) => {
      const content = block.content || ''

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
        case 'mediaText': {
          const mtUrl = block.url || ''
          const mtAlt = block.alt || ''
          const mtLayout = block.align || block.layout || 'left'
          const mtCaption = block.caption || ''
          return `<div data-media-text="" data-layout="${mtLayout}" data-image-url="${mtUrl}" data-alt-text="${mtAlt}" data-caption="${mtCaption}">${content}</div>`
        }
        default:
          return content ? `<p>${content}</p>` : '<p></p>'
      }
    })
    .join('')
}

export default TiptapEditor