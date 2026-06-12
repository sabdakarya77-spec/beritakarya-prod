'use client'

import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { EditorTopbar } from './EditorTopbar'
import { EditorTitleStage } from './EditorTitleStage'
import { EditorContent } from './EditorContent'
import { formatDate } from '@beritakarya/utils'
import { PhotoGalleryUpload } from './PhotoGalleryUpload'
import { VideoEmbedZone } from './VideoEmbedZone'

interface EditorProps {
  articleId: string
  siteId: string
}

/**
 * Main Editor Component
 * 
 * Handles:
 * - Article loading/saving lifecycle
 * - Global keyboard shortcuts (Ctrl+S save, Ctrl+Z undo)
 * - Editor mode switching (GridBlock vs Classic)
 * - Integrates TiptapEditor with EditorStore
 */
export function Editor({ articleId, siteId }: EditorProps) {
  const {
    loadArticle,
    saveArticle,
    undo,
    isFocusMode,
    reset,
    setSiteId,
    isLoading,
    saveError,
    setActiveTab,
    toggleSidebar,
    saving,
    isDirty,
    lastSaved,
    status,
    title,
    blocks,
    metaTitle,
    metaDescription,
    submitForReview,
    publishArticle,
    updateArticleData,
    contentType,
  } = useEditorStore()

  // Load article on mount
  useEffect(() => {
    setSiteId(siteId)
    if (articleId && articleId !== 'new') {
      loadArticle(articleId, siteId)
    } else if (articleId === 'new') {
      reset(siteId)
    }

    // Open settings sidebar on desktop
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      setActiveTab('settings')
      toggleSidebar(true)
    }
  }, [articleId, siteId, loadArticle, reset, setSiteId, setActiveTab, toggleSidebar])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+Z / Cmd+Z for undo (HANYA jalankan jika fokus tidak di dalam editor visual Tiptap)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      const isInsideTiptap = document.activeElement?.closest('.tiptap') || document.activeElement?.classList.contains('tiptap-editor-content')
      if (!isInsideTiptap) {
        e.preventDefault()
        undo()
      }
    }
    // Ctrl+S / Cmd+S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveArticle()
    }
  }, [undo, saveArticle])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Peringatan sebelum menutup halaman jika ada perubahan kotor (Unsaved Changes Guard)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '' // Menampilkan dialog bawaan browser
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Calculate word count from blocks
  const wordCount = blocks.reduce((count, block) => {
    const content = (block as any).content || ''
    const items = (block as any).items || []
    
    // Count words in content
    const textContent = content.replace(/<[^>]*>/g, ' ').trim()
    const words = textContent.split(/\s+/).filter((w: string) => w.length > 0)
    
    // Count words in list items
    const listWords = items.reduce((acc: number, item: string) => {
      const clean = item.replace(/<[^>]*>/g, ' ').trim()
      return acc + clean.split(/\s+/).filter(w => w.length > 0).length
    }, 0)
    
    return count + words.length + listWords
  }, 0)

  // Format last saved time
  const lastSavedText = lastSaved 
    ? `Saved ${formatDate(lastSaved, { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : ''

  return (
    <div className="editor-wrapper h-full flex flex-col">
      {/* Topbar */}
      <EditorTopbar
        siteId={siteId}
        isLoading={isLoading}
        saveError={saveError}
        saving={saving}
        isDirty={isDirty}
        lastSaved={lastSavedText}
        status={status}
        wordCount={wordCount}
        onSave={saveArticle}
        onSubmit={submitForReview}
        onPublish={publishArticle}
        onStatusChange={(newStatus) => updateArticleData({ status: newStatus })}
      />
      
      {/* Main Content Area */}
      <EditorContent isFocusMode={isFocusMode}>
        <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-6">
          {/* Title Stage */}
          <EditorTitleStage isFocusMode={isFocusMode} />
          
          {/* Conditional Content based on Content Type */}
          {contentType === 'photo_journalism' ? (
            /* Foto Jurnalistik - Gallery Upload */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <PhotoGalleryUpload />
            </div>
          ) : contentType === 'video_exclusive' ? (
            /* Video Eksklusif - Embed Zone */
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
              <VideoEmbedZone />
            </div>
          ) : (
            /* Standard Article - Tiptap Editor */
            <div className="editor-canvas">
              {/* Dynamic import TiptapEditor to avoid SSR issues */}
              <TiptapEditorWrapper />
            </div>
          )}
        </div>
      </EditorContent>
    </div>
  )
}

// Lazy loaded Tiptap Editor component
import dynamic from 'next/dynamic'

const TiptapEditorWrapper = dynamic(
  () => import('./TiptapEditor').then(mod => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="tiptap-editor-wrapper animate-pulse">
        <div className="h-12 bg-gray-100 rounded-t-lg" />
        <div className="p-6 space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      </div>
    )
  }
)

export default Editor
