'use client'

import { useState, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { generateSlug } from '@beritakarya/utils'

interface EditorTitleStageProps {
  isFocusMode?: boolean
}

export function EditorTitleStage({ isFocusMode = false }: EditorTitleStageProps) {
  const { title, setTitle, excerpt, setExcerpt } = useEditorStore()
  const [localTitle, setLocalTitle] = useState(title)
  const [localExcerpt, setLocalExcerpt] = useState(excerpt)
  
  // Debounce title changes to store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTitle !== title) {
        setTitle(localTitle)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localTitle, title, setTitle])
  
  // Debounce excerpt changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localExcerpt !== excerpt) {
        setExcerpt(localExcerpt)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localExcerpt, excerpt, setExcerpt])
  
  // Sync with store on mount
  useEffect(() => {
    setLocalTitle(title)
  }, [title])
  
  useEffect(() => {
    setLocalExcerpt(excerpt)
  }, [excerpt])
  
  const charCount = localTitle.length
  const isTitleValid = charCount > 0 && charCount <= 200
  
  return (
    <div className={`
      editor-title-stage
      ${isFocusMode ? 'max-w-3xl mx-auto' : ''}
    `}>
      {/* Title Input */}
      <div className="relative">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Ketik judul di sini..."
          className={`
            w-full text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight
            bg-transparent border-none outline-none
            text-gray-900 dark:text-white
            placeholder:text-gray-300 dark:placeholder:text-gray-600
            ${isFocusMode ? 'text-center' : ''}
          `}
          style={{ lineHeight: '1.2' }}
        />
        
        {/* Character Count */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span className={isTitleValid ? 'text-green-500' : 'text-gray-400'}>
            {charCount} karakter
          </span>
          <span>Slug: /{generateSlug(localTitle || 'untitled')}</span>
        </div>
      </div>
      
      {/* Excerpt / Deck Input */}
      <div className="mt-6">
        <textarea
          value={localExcerpt}
          onChange={(e) => setLocalExcerpt(e.target.value)}
          placeholder="Tambahkan ringkasan singkat artikel (deck)..."
          rows={2}
          maxLength={280}
          className={`
            w-full text-lg text-gray-600 dark:text-gray-400
            bg-transparent border-none outline-none resize-none
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            leading-relaxed
            ${isFocusMode ? 'text-center' : ''}
          `}
        />
        
        {/* Excerpt Character Count */}
        <div className="mt-1 text-xs text-gray-400">
          {localExcerpt.length}/280 karakter
        </div>
      </div>
    </div>
  )
}

export default EditorTitleStage