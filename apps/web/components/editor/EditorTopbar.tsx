'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Send,
  Globe,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Edit3,
  PanelRightOpen,
  PanelRightClose
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ArticleStatus } from '@beritakarya/types'
import { STATUS_CONFIG, getStatusConfig } from '@beritakarya/config'
import type { ArticleStatusKey } from '@beritakarya/config'
import { useEditorStore } from '../../store/editorStore'

interface EditorTopbarProps {
  siteId: string
  isLoading?: boolean
  saveError?: string | null
  saving?: boolean
  isDirty?: boolean
  lastSaved?: string
  status?: ArticleStatus
  wordCount?: number
  onSave: () => void
  onSubmit: () => void
  onPublish: () => void
  onStatusChange?: (status: ArticleStatus) => void
}

export function EditorTopbar({
  siteId,
  isLoading,
  saveError,
  saving,
  isDirty,
  lastSaved,
  status = 'draft',
  wordCount = 0,
  onSave,
  onSubmit,
  onPublish,
  onStatusChange,
}: EditorTopbarProps) {
  const router = useRouter()
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const { isSidebarOpen, toggleSidebar, activeTab, setActiveTab } = useEditorStore()

  const statusConfig = getStatusConfig(status)
  const isSettingsPanelOpen = isSidebarOpen && activeTab === 'settings'
  const handleMobilePanelToggle = () => {
    if (isSettingsPanelOpen) {
      toggleSidebar(false)
      return
    }

    setActiveTab('settings')
    toggleSidebar(true)
  }

  const handleBackToArticles = () => {
    router.push(`/${siteId}/dashboard/articles`)
  }
  
  return (
    <div className="editor-topbar relative z-30 flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/80 backdrop-blur-sm">
      {/* Left: Back, Status, Save Info */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={handleBackToArticles}
          className="inline-flex lg:hidden items-center justify-center rounded-lg p-2 text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          aria-label="Kembali ke daftar artikel"
          title="Kembali ke daftar artikel"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Status Badge with dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
              statusConfig.color
            )}
          >
            <span>{statusConfig.label}</span>
            <ChevronDown size={12} />
          </button>
          
          {showStatusMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowStatusMenu(false)} 
              />
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 min-w-[140px]">
                {(Object.keys(STATUS_CONFIG) as ArticleStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      if (onStatusChange) {
                        onStatusChange(s)
                      }
                      setShowStatusMenu(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2',
                      status === s ? 'text-brand-red' : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {status === s && <Check size={12} />}
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Save Status */}
        <div className="flex min-w-0 flex-1 items-center gap-1 text-[10px] sm:gap-2 sm:text-xs">
          {saving ? (
            <>
              <Loader2 size={12} className="shrink-0 animate-spin text-gray-400" />
              <span className="truncate text-gray-500">Saving...</span>
            </>
          ) : saveError ? (
            <>
              <AlertCircle size={12} className="shrink-0 text-red-500" />
              <span className="truncate text-red-500">{saveError}</span>
            </>
          ) : isDirty ? (
            <>
              <Edit3 size={12} className="shrink-0 text-amber-500" />
              <span className="truncate font-medium text-amber-600">Unsaved</span>
            </>
          ) : lastSaved ? (
            <>
              <Clock size={12} className="shrink-0 text-gray-400" />
              <span className="truncate text-gray-500">{lastSaved}</span>
            </>
          ) : null}
        </div>
      </div>
      
      {/* Center: Word Count */}
      <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
        <span>{wordCount.toLocaleString()} kata</span>
      </div>
      
      {/* Right: Actions */}
      <div className="ml-2 flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleMobilePanelToggle}
          className={cn(
            'inline-flex lg:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
            isSettingsPanelOpen
              ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-white/20 dark:text-white dark:hover:bg-white/30'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
          )}
          aria-label={isSettingsPanelOpen ? 'Tutup panel editor' : 'Buka panel editor'}
          title={isSettingsPanelOpen ? 'Tutup panel editor' : 'Buka panel editor'}
        >
          {isSettingsPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          <span className="hidden sm:inline">Panel</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving}
          className={cn(
            'inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all',
            saving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
          )}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span className="hidden sm:inline">Save</span>
        </button>
        
        {/* Submit Button */}
        <button
          onClick={onSubmit}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          <Send size={14} />
          <span className="hidden sm:inline">Submit</span>
        </button>
        
        {/* Publish Button (dropdown) */}
        <button
          onClick={onPublish}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold bg-brand-red hover:bg-red-700 text-white transition-all"
        >
          <Globe size={14} />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>
    </div>
  )
}

export default EditorTopbar
