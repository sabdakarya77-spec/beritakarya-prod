'use client'

import { useState, useEffect, useRef } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Link as LinkIcon,
  List,
  ListOrdered,
  Italic,
  Underline,
} from 'lucide-react'
import { legalProseClassName } from '../../legal/legalStyles'
import { parseLegalContent, serializeLegalContent, type LegalAlignment } from '../../../lib/legalUtils'

const LEGAL_EDITOR_MIN_HEIGHT = 'min-h-[550px]'

export function LegalRichTextEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedValueRef = useRef<string>('')
  const [alignment, setAlignment] = useState<LegalAlignment>('left')
  const editorPreviewClassName = `${legalProseClassName} !max-w-none px-4 py-3 text-base outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:marker:text-gray-500 dark:[&_li]:marker:text-gray-400`

  const isSelectionInsideEditor = (selection: Selection | null, editor: HTMLDivElement) => {
    if (!selection || selection.rangeCount === 0) return false
    const range = selection.getRangeAt(0)
    return editor.contains(range.commonAncestorContainer)
  }

  const ensureEditorSelection = () => {
    const editor = editorRef.current
    if (!editor) return null

    const selection = window.getSelection()
    if (isSelectionInsideEditor(selection, editor)) {
      return selection
    }

    editor.focus()
    const nextSelection = window.getSelection()
    if (!nextSelection) return null

    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    nextSelection.removeAllRanges()
    nextSelection.addRange(range)
    return nextSelection
  }

  const placeCaretAtEnd = (node: Node) => {
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const insertListFallback = (listTag: 'ul' | 'ol') => {
    const editor = editorRef.current
    const selection = ensureEditorSelection()
    if (!editor || !selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()
    const list = document.createElement(listTag)
    const item = document.createElement('li')

    if (selectedText) {
      item.textContent = selectedText
    } else {
      item.appendChild(document.createElement('br'))
    }

    list.appendChild(item)
    range.deleteContents()
    range.insertNode(list)
    placeCaretAtEnd(item)
  }

  const normalizeEditorLists = () => {
    const editor = editorRef.current
    if (!editor) return

    editor.querySelectorAll('ul, ol').forEach((list) => {
      list.classList.remove('list-disc', 'list-decimal')
      if (list.tagName.toLowerCase() === 'ul') {
        list.classList.add('list-disc')
      } else {
        list.classList.add('list-decimal')
      }
    })
  }

  // Deteksi alignment paragraf di posisi kursor saat ini
  const detectAlignment = (): LegalAlignment => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return 'left'
    let node: Node | null = selection.anchorNode
    const editor = editorRef.current
    while (node && node !== editor) {
      if (node instanceof HTMLElement) {
        const computedAlign = window.getComputedStyle(node).textAlign
        if (computedAlign === 'center') return 'center'
        if (computedAlign === 'right') return 'right'
        if (computedAlign === 'justify') return 'justify'
        if (computedAlign === 'left' || computedAlign === 'start') return 'left'
      }
      node = node.parentNode
    }
    return 'left'
  }

  const updateToolbarAlignment = () => {
    setAlignment(detectAlignment())
  }

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // Jika nilai yang masuk sama dengan nilai terakhir yang dikirim (internal update),
    // jangan perbarui DOM agar caret/kursor tidak melompat.
    if (value === lastEmittedValueRef.current) {
      return
    }

    const parsed = parseLegalContent(value)
    if (editor.innerHTML !== parsed.html) {
      editor.innerHTML = parsed.html
    }

    // Sinkronisasi nilai terakhir agar tetap up-to-date saat ada pembaruan eksternal
    lastEmittedValueRef.current = value
  }, [value])

  const emitChange = () => {
    const editor = editorRef.current
    if (!editor) return
    normalizeEditorLists()
    editor.querySelectorAll('a').forEach((anchor) => {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener noreferrer')
    })
    const serialized = serializeLegalContent(editor.innerHTML)
    lastEmittedValueRef.current = serialized
    onChange(serialized)
  }

  const runCommand = (
    command:
      | 'bold'
      | 'italic'
      | 'underline'
      | 'insertUnorderedList'
      | 'insertOrderedList'
  ) => {
    const editor = editorRef.current
    if (!editor) return
    ensureEditorSelection()
    document.execCommand(command)
    emitChange()
  }

  const isSelectionInsideList = () => {
    const editor = editorRef.current
    const selection = window.getSelection()

    if (!editor || !selection || selection.rangeCount === 0) return false

    let node: Node | null = selection.anchorNode
    while (node && node !== editor) {
      if (
        node instanceof HTMLElement &&
        ['UL', 'OL', 'LI'].includes(node.tagName)
      ) {
        return true
      }
      node = node.parentNode
    }

    return false
  }

  const applyList = (listTag: 'ul' | 'ol') => {
    const command = listTag === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'
    const wasInsideList = isSelectionInsideList()
    runCommand(command)

    const insideList = isSelectionInsideList()

    if (!wasInsideList && !insideList) {
      insertListFallback(listTag)
      emitChange()
    }
  }

  const applyBlock = (block: 'h2' | 'h3' | 'p') => {
    const editor = editorRef.current
    if (!editor) return
    ensureEditorSelection()
    document.execCommand('formatBlock', false, block)
    emitChange()
  }

  const insertLink = () => {
    const editor = editorRef.current
    if (!editor) return
    ensureEditorSelection()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      window.alert('Sorot teks terlebih dahulu untuk menambahkan tautan.')
      return
    }

    const url = window.prompt('Masukkan URL tautan', 'https://')
    if (!url) return

    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    document.execCommand('createLink', false, normalizedUrl)
    emitChange()
  }

  // Alignment per-paragraf menggunakan execCommand (seperti Microsoft Word)
  const applyAlignment = (nextAlign: LegalAlignment) => {
    const editor = editorRef.current
    if (!editor) return
    ensureEditorSelection()
    const commandMap: Record<LegalAlignment, string> = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    }
    document.execCommand(commandMap[nextAlign])
    setAlignment(nextAlign)
    emitChange()
  }

  const toolbarButtonClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors'
  const toolbarIdleClass =
    'border-gray-200 bg-white text-gray-600 hover:border-brand-red/30 hover:text-brand-red dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300'
  const toolbarActiveClass =
    'border-brand-red/30 bg-brand-red/10 text-brand-red dark:border-brand-red/30 dark:bg-brand-red/15'
  const preserveSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="overflow-x-auto border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="flex min-w-max items-center gap-2 px-3 py-3">
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => runCommand('bold')}
            className={`${toolbarButtonClass} ${toolbarIdleClass}`}
            title="Tebal"
            aria-label="Tebal"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => runCommand('italic')}
            className={`${toolbarButtonClass} ${toolbarIdleClass}`}
            title="Miring"
            aria-label="Miring"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => runCommand('underline')}
            className={`${toolbarButtonClass} ${toolbarIdleClass}`}
            title="Garis bawah"
            aria-label="Garis bawah"
          >
            <Underline size={16} />
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-800" />
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyBlock('h2')}
            className={`${toolbarButtonClass} ${toolbarIdleClass} text-[11px] font-black`}
            title="Heading besar"
            aria-label="Heading besar"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyBlock('h3')}
            className={`${toolbarButtonClass} ${toolbarIdleClass} text-[11px] font-black`}
            title="Heading sedang"
            aria-label="Heading sedang"
          >
            H3
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyBlock('p')}
            className={`${toolbarButtonClass} ${toolbarIdleClass} text-[11px] font-black`}
            title="Paragraf normal"
            aria-label="Paragraf normal"
          >
            P
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-800" />
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyList('ul')}
            className={`${toolbarButtonClass} ${toolbarIdleClass}`}
            title="Bullet list"
            aria-label="Bullet list"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyList('ol')}
            className={`${toolbarButtonClass} ${toolbarIdleClass}`}
            title="Number list"
            aria-label="Number list"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={insertLink}
            className={`${toolbarButtonClass} ${toolbarIdleClass}`}
            title="Tautan"
            aria-label="Tautan"
          >
            <LinkIcon size={16} />
          </button>
          <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-800" />
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyAlignment('left')}
            className={`${toolbarButtonClass} ${alignment === 'left' ? toolbarActiveClass : toolbarIdleClass}`}
            title="Rata kiri"
            aria-label="Rata kiri"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyAlignment('center')}
            className={`${toolbarButtonClass} ${alignment === 'center' ? toolbarActiveClass : toolbarIdleClass}`}
            title="Rata tengah"
            aria-label="Rata tengah"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyAlignment('right')}
            className={`${toolbarButtonClass} ${alignment === 'right' ? toolbarActiveClass : toolbarIdleClass}`}
            title="Rata kanan"
            aria-label="Rata kanan"
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            onMouseDown={preserveSelection}
            onClick={() => applyAlignment('justify')}
            className={`${toolbarButtonClass} ${alignment === 'justify' ? toolbarActiveClass : toolbarIdleClass}`}
            title="Rata kiri kanan"
            aria-label="Rata kiri kanan"
          >
            <AlignJustify size={16} />
          </button>
        </div>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={() => emitChange()}
          onKeyUp={updateToolbarAlignment}
          onMouseUp={updateToolbarAlignment}
          className={`${editorPreviewClassName} ${LEGAL_EDITOR_MIN_HEIGHT} before:pointer-events-none before:text-gray-400 empty:before:content-[attr(data-placeholder)]`}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Toolbar: tebal, miring, garis bawah, heading, list, tautan, rata kiri, rata tengah, rata kanan, dan rata kiri kanan.
      </p>
    </div>
  )
}
