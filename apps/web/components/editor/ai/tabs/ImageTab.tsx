import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useCaption } from '../../../../hooks/useAI'

export function ImageTab() {
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const captionState = useCaption()

  const handleGenerate = async () => {
    if (!imageUrl.trim()) return
    await captionState.generate({ imageUrl })
  }

  // Update local state when result comes using useEffect to prevent render loop
  useEffect(() => {
    if (captionState.result && !captionState.loading) {
      if (captionState.result.altText !== altText) {
        setAltText(captionState.result.altText)
      }
      if (captionState.result.caption !== caption) {
        setCaption(captionState.result.caption)
      }
    }
  }, [captionState.result, captionState.loading, altText, caption])

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">URL Gambar</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!imageUrl.trim() || captionState.loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {captionState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Generate Alt Text & Caption
      </button>

      {altText && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Alt Text</label>
            <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs">
              {altText}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Caption</label>
            <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs">
              {caption}
            </div>
          </div>
        </div>
      )}

      {captionState.error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {captionState.error}
        </div>
      )}
    </div>
  )
}