'use client'
import { useState } from 'react'

interface Props {
  label: string
  content: string
  onApply: () => void
  showCompare?: boolean
  originalContent?: string
  model?: string
}

export function AIResultCard({ label, content, onApply, showCompare = false, originalContent = '', model }: Props) {
  const [applied, setApplied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleApply = () => {
    onApply()
    setApplied(true)
  }

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border-b border-amber-100">
          <span className="text-xs font-medium text-amber-700">{label}</span>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-600 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}
      
      {showCompare && originalContent && (
        <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
          <div className="bg-gray-50 p-2 border-r border-gray-200">
            <p className="text-[10px] font-medium text-gray-500 mb-1">Original</p>
            <p className="text-xs text-gray-700 leading-relaxed max-h-32 overflow-auto">
              {originalContent}
            </p>
          </div>
          <div className="bg-amber-50 p-2">
            <p className="text-[10px] font-medium text-amber-600 mb-1">AI Result</p>
            <p className="text-xs text-gray-800 leading-relaxed max-h-32 overflow-auto">
              {content}
            </p>
          </div>
        </div>
      )}
      
      {!showCompare && (
        <div className="p-3 bg-white">
          <p className="text-xs text-gray-700 leading-relaxed max-h-28 overflow-auto">
            {content}
          </p>
        </div>
      )}
      
      <div className="flex border-t border-amber-100">
        <button
          onClick={() => setDismissed(true)}
          className="flex-1 text-xs py-2 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          Abaikan
        </button>
        <div className="w-px bg-amber-100" />
        <button
          onClick={handleApply}
          disabled={applied}
          className="flex-1 text-xs py-2 text-amber-700 font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
        >
          {applied ? '✓ Diterapkan' : 'Terapkan'}
        </button>
      </div>
    </div>
  )
}