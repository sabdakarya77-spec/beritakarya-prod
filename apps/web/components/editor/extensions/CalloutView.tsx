'use client'

import { NodeViewWrapper, NodeViewProps, NodeViewContent } from '@tiptap/react'
import { useState, useCallback } from 'react'
import { 
  Lightbulb, AlertTriangle, XCircle, CheckCircle, MessageCircle,
  ChevronDown, ChevronUp, MoreHorizontal
} from 'lucide-react'
import { CalloutVariant, CALLOUT_VARIANTS } from './CalloutExtension'

const CALLOUT_CONFIG: Record<CalloutVariant, { 
  icon: React.ReactNode
  bg: string
  border: string
  text: string
  label: string
}> = {
  info: { 
    icon: <Lightbulb className="w-5 h-5" />, 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-200',
    label: 'Informasi'
  },
  warning: { 
    icon: <AlertTriangle className="w-5 h-5" />, 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    label: 'Peringatan'
  },
  error: { 
    icon: <XCircle className="w-5 h-5" />, 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    label: 'Error'
  },
  success: { 
    icon: <CheckCircle className="w-5 h-5" />, 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-800 dark:text-green-200',
    label: 'Berhasil'
  },
  tip: { 
    icon: <MessageCircle className="w-5 h-5" />, 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    label: 'Tips'
  },
}

/**
 * CalloutView - React component untuk callout block
 */
export function CalloutView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  
  const variant = (node.attrs.variant || 'info') as CalloutVariant
  const config = CALLOUT_CONFIG[variant]
  
  const handleVariantChange = useCallback((newVariant: CalloutVariant) => {
    updateAttributes({ variant: newVariant })
    setShowVariantPicker(false)
  }, [updateAttributes])
  
  return (
    <NodeViewWrapper className="callout-view-wrapper my-4 group">
      <div
        className={`
          relative rounded-lg border p-4 ${config.bg} ${config.border}
          ${selected ? 'ring-2 ring-offset-2 ring-brand-red' : ''}
        `}
        data-callout
        data-variant={variant}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={config.text}>{config.icon}</span>
            <span className={`font-semibold text-sm ${config.text}`}>
              {node.attrs.title || config.label}
            </span>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1 rounded hover:bg-black/10 ${config.text}`}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowVariantPicker(!showVariantPicker)}
                className={`p-1 rounded hover:bg-black/10 ${config.text}`}
                title="Change variant"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showVariantPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-10 min-w-[120px]">
                  {CALLOUT_VARIANTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => handleVariantChange(v)}
                      className={`
                        w-full px-3 py-2 text-left text-sm flex items-center gap-2
                        hover:bg-gray-100 dark:hover:bg-slate-700
                        ${v === variant ? 'bg-gray-100 dark:bg-slate-700' : ''}
                      `}
                    >
                      <span className={CALLOUT_CONFIG[v].text}>{CALLOUT_CONFIG[v].icon}</span>
                      <span className={CALLOUT_CONFIG[v].text}>{CALLOUT_CONFIG[v].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        {!isCollapsed && (
          <div className={`${config.text} leading-relaxed`}>
            <NodeViewContent />
          </div>
        )}
        
        {isCollapsed && (
          <div className={`text-sm ${config.text} opacity-60 italic`}>
            Klik untuk expand...
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default CalloutView