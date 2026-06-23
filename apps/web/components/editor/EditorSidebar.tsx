'use client'

import { cn } from '../../lib/utils'
import { PanelRightClose, FileText, Settings, Search, History, Sparkles } from 'lucide-react'
import { SEOPanel } from './seo/SEOPanel'
import { TabSettings } from './tabs/TabSettings'
import { TabContent } from './tabs/TabContent'
import { AIPanel } from './ai/AIPanel'
import { HistoryPanel } from './tabs/HistoryPanel'
import { useEditorStore } from '../../store/editorStore'
import { getStatusConfig } from '@beritakarya/config'

interface EditorSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

type TabType = 'content' | 'settings' | 'seo' | 'history' | 'assist'

// Short labels for tabs (2-3 characters)
const TAB_SHORT_LABELS: Record<TabType, string> = {
  content: 'Info',
  settings: 'Sett',
  seo: 'SEO',
  history: 'Hist',
  assist: 'AI',
}

export function EditorSidebar({ isOpen, onToggle }: EditorSidebarProps) {
  const { activeTab, setActiveTab, status, isBreaking } = useEditorStore()
  
  const tabs: { id: TabType; label: string; shortLabel: string; icon: typeof FileText }[] = [
    { id: 'content', label: 'Info Artikel', shortLabel: TAB_SHORT_LABELS.content, icon: FileText },
    { id: 'settings', label: 'Pengaturan', shortLabel: TAB_SHORT_LABELS.settings, icon: Settings },
    { id: 'seo', label: 'SEO', shortLabel: TAB_SHORT_LABELS.seo, icon: Search },
    { id: 'history', label: 'Riwayat', shortLabel: TAB_SHORT_LABELS.history, icon: History },
    { id: 'assist', label: 'AI Assistant', shortLabel: TAB_SHORT_LABELS.assist, icon: Sparkles },
  ]

  // Get current status config
  const currentStatus = getStatusConfig(status)
  const showBreakingDot = status === 'published' && isBreaking
  
  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-35 hidden lg:flex flex-col gap-1 p-1.5 bg-panel-bg dark:bg-panel-bg border border-panel-border dark:border-panel-border rounded-l-xl shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                onToggle()
              }}
              className={cn(
                'p-2.5 rounded-lg transition-all relative group',
                isActive
                  ? 'bg-accent-red-muted text-accent-red'
                  : 'text-panel-text-secondary hover:bg-panel-elevated hover:text-panel-text-primary'
              )}
              title={tab.label}
            >
              <Icon size={16} />
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-red" />
              )}
              {/* Tooltip */}
              <span className="absolute right-full mr-2 px-2 py-1 text-[10px] font-medium bg-panel-elevated text-panel-text-primary rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }
  
  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        onClick={onToggle}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
      />
      <aside className="fixed lg:static inset-y-0 right-0 z-50 w-80 max-w-[85%] lg:max-w-none flex-shrink-0 flex flex-col overflow-hidden shadow-2xl lg:shadow-none
        bg-panel-bg dark:bg-panel-bg border-l border-panel-border dark:border-panel-border">
      
      {/* Header - Dynamic Status */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-panel-border dark:border-panel-border">
        <div className="flex items-center gap-2">
          {/* Status dot indicator */}
          <div className="relative">
            <div className={cn('w-2 h-2 rounded-full', currentStatus.color)} />
            {showBreakingDot && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <span className="text-[11px] font-medium text-panel-text-secondary">
            {currentStatus.label}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-panel-elevated text-panel-text-secondary hover:text-panel-text-primary transition-all"
          title="Tutup panel"
        >
          <PanelRightClose size={16} />
        </button>
      </div>
      
      {/* Tab Navigation - Premium with labels */}
      <div className="flex border-b border-panel-border dark:border-panel-border p-1.5 gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg transition-all duration-150 relative group',
                isActive
                  ? 'bg-accent-red-muted text-accent-red shadow-sm'
                  : 'text-panel-text-secondary hover:bg-panel-elevated hover:text-panel-text-primary'
              )}
              title={tab.label}
            >
              <Icon size={14} />
              <span className="text-[9px] font-semibold tracking-wide">
                {tab.shortLabel}
              </span>
            </button>
          )
        })}
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-panel-bg dark:bg-panel-bg">
        {activeTab === 'content' && <TabContent />}
        {activeTab === 'settings' && <TabSettings />}
        {activeTab === 'seo' && <SEOPanel />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'assist' && <AIPanel />}
      </div>
    </aside>
    </>
  )
}

export default EditorSidebar
