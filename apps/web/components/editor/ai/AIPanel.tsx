'use client'

import { useState } from 'react'
import { Sparkles, Pencil, Search, ShieldCheck, Image, BarChart3, Wand2, Circle } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { WriteTab } from './tabs/WriteTab'
import { SEOTab } from './tabs/SEOTab'
import { ValidateTab } from './tabs/ValidateTab'
import { ImageTab } from './tabs/ImageTab'
import { AnalisisTab } from './tabs/AnalisisTab'
import { GenerateTab } from './tabs/GenerateTab'
import { AIErrorBoundary } from './AIErrorBoundary'

type TabId = 'write' | 'seo' | 'validate' | 'image' | 'analisis' | 'generate'

const TABS = [
  { id: 'write' as const, label: 'Tulis', icon: Pencil },
  { id: 'seo' as const, label: 'SEO', icon: Search },
  { id: 'validate' as const, label: 'Validasi', icon: ShieldCheck },
  { id: 'image' as const, label: 'Gambar', icon: Image },
  { id: 'analisis' as const, label: 'Analisis', icon: BarChart3 },
  { id: 'generate' as const, label: 'Buat', icon: Wand2 },
]

interface AIPanelProps {
  isOpen?: boolean
  onClose?: () => void
  editor?: any
}

export function AIPanel({ isOpen = true, onClose, editor }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('write')

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-panel-bg dark:bg-panel-bg">
      {/* Header - Gradient with AI glow */}
      <div className="relative px-4 py-3 border-b border-panel-border overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-purple/10 to-transparent" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* AI Icon with subtle glow animation */}
            <div className="relative">
              <div className="p-1.5 rounded-lg bg-accent-purple/20">
                <Sparkles size={16} className="text-accent-purple" />
              </div>
              {/* Animated glow dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-panel-text-primary">AI Assistant</span>
              <div className="flex items-center gap-1 text-[9px] text-emerald-500">
                <Circle size={6} fill="currentColor" />
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Pill Design */}
      <div className="px-3 py-2 border-b border-panel-border">
        <div className="flex bg-panel-elevated rounded-xl p-1 gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-panel-bg text-accent-purple shadow-sm'
                    : 'text-panel-text-muted hover:text-panel-text-secondary'
                )}
              >
                <Icon size={12} />
                <span className="text-[8px] font-semibold tracking-wide truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AIErrorBoundary key={activeTab}>
          {activeTab === 'write' && <WriteTab />}
          {activeTab === 'seo' && <SEOTab />}
          {activeTab === 'validate' && <ValidateTab />}
          {activeTab === 'image' && <ImageTab />}
          {activeTab === 'analisis' && <AnalisisTab />}
          {activeTab === 'generate' && <GenerateTab />}
        </AIErrorBoundary>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t border-panel-border bg-panel-surface/50">
        <p className="text-[9px] text-panel-text-muted text-center">
          Powered by OpenAI
        </p>
      </div>
    </div>
  )
}
