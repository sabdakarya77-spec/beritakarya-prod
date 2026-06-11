'use client'

import { NodeViewWrapper, NodeViewProps, NodeViewContent } from '@tiptap/react'
import { useState } from 'react'
import { User, Edit3, Check, X } from 'lucide-react'

/**
 * QuoteView - React component untuk quote block
 * Mendukung inline editing attribution
 */
export function QuoteView({ node, updateAttributes, selected }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [attribution, setAttribution] = useState(node.attrs.attribution || '')
  
  const handleSave = () => {
    updateAttributes({ attribution })
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setAttribution(node.attrs.attribution || '')
    setIsEditing(false)
  }
  
  return (
    <NodeViewWrapper className="quote-view-wrapper my-6">
      <blockquote
        className={`
          relative border-l-4 border-brand-red pl-6 py-3 pr-4
          bg-gradient-to-r from-brand-red/5 to-transparent
          ${selected ? 'ring-2 ring-brand-red/50' : ''}
        `}
        data-quote
        data-attribution={node.attrs.attribution}
      >
        {/* Quote Icon */}
        <div className="absolute -left-3 -top-2 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 8c-1.105 0-2 .672-2 1.5S8.895 11 10 11s2-.672 2-1.5S11.105 8 10 8zm4 0c-1.105 0-2 .672-2 1.5S12.895 11 14 11s2-.672 2-1.5S15.105 8 14 8z" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="tiptap-editor-content text-lg italic text-gray-700 dark:text-gray-300 leading-relaxed">
          <NodeViewContent />
        </div>
        
        {/* Attribution */}
        {node.attrs.attribution || isEditing ? (
          <cite className="mt-4 block text-sm text-gray-500 dark:text-gray-400 not-italic">
            {isEditing ? (
              <div className="flex items-center gap-2 mt-2">
                <User className="w-4 h-4" />
                <input
                  type="text"
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  placeholder="Nama sumber atau attribution..."
                  className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 py-1 px-2 text-sm focus:outline-none focus:border-brand-red"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span>— {node.attrs.attribution}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </cite>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <User className="w-3 h-3" />
            Tambahkan attribution
          </button>
        )}
      </blockquote>
    </NodeViewWrapper>
  )
}

export default QuoteView