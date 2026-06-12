'use client'

import { useState } from 'react'
import { Sparkles, Pencil, Lightbulb, ShieldCheck, Image, Search, ChevronDown, Circle } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { WriteTab } from './tabs/WriteTab'
import { OptimizeTab } from './tabs/OptimizeTab'
import { ValidateTab } from './tabs/ValidateTab'
import { ImageTab } from './tabs/ImageTab'
import { SEOAuditTab } from './tabs/SEOAuditTab'

type TabId = 'write' | 'optimize' | 'validate' | 'image' | 'seo'

const TABS = [
  { id: 'write' as const, label: 'Tulis', icon: Pencil },
  { id: 'optimize' as const, label: 'Optimasi', icon: Lightbulb },
  { id: 'validate' as const, label: 'Validasi', icon: ShieldCheck },
  { id: 'image' as const, label: 'Gambar', icon: Image },
  { id: 'seo' as const, label: 'SEO', icon: Search },
]

const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
]

interface AIPanelProps {
  isOpen?: boolean
  onClose?: () => void
  editor?: any
}

export function AIPanel({ isOpen = true, onClose, editor }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('write')
  const [model, setModel] = useState('gpt-4o')
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  if (!isOpen) return null

  const currentModelLabel = MODELS.find(m => m.id === model)?.label || model

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
        {activeTab === 'write' && <WriteTab model={model} />}
        {activeTab === 'optimize' && <OptimizeTab model={model} />}
        {activeTab === 'validate' && <ValidateTab model={model} />}
        {activeTab === 'image' && <ImageTab model={model} />}
        {activeTab === 'seo' && <SEOAuditTab />}
      </div>

      {/* Footer - Model selector */}
      <div className="px-3 py-2.5 border-t border-panel-border bg-panel-surface/50">
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-panel-elevated border border-panel-border rounded-lg text-[10px] font-medium text-panel-text-primary hover:border-accent-purple/40 transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-accent-purple" />
              <span>{currentModelLabel}</span>
            </div>
            <ChevronDown size={12} className={cn("text-panel-text-muted transition-transform", showModelDropdown && "rotate-180")} />
          </button>
          
          {showModelDropdown && (
            <>
              <div className="fixed inset-0 z-40" role="button" tabIndex={0} onClick={() => setShowModelDropdown(false)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowModelDropdown(false) }} />
              <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-panel-surface border border-panel-border rounded-lg shadow-xl overflow-hidden">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setModel(m.id)
                      setShowModelDropdown(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[10px] font-medium transition-colors flex items-center justify-between",
                      model === m.id
                        ? "bg-accent-purple/10 text-accent-purple"
                        : "text-panel-text-primary hover:bg-panel-elevated"
                    )}
                  >
                    <span>{m.label}</span>
                    {model === m.id && <span className="text-[9px] text-accent-purple">Active</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="text-[9px] text-panel-text-muted text-center mt-1.5">
          Powered by OpenAI
        </p>
      </div>
    </div>
  )
}
