'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRewrite, useExpand } from '../../../../hooks/useAI'

interface Props {
  model?: string
}

type Tone = 'formal' | 'santai' | 'berita'
type Length = 'lebih_pendek' | 'sama' | 'lebih_panjang'

const TONE_OPTIONS = [
  { value: 'berita' as Tone, label: 'Gaya Berita' },
  { value: 'formal' as Tone, label: 'Formal' },
  { value: 'santai' as Tone, label: 'Santai' }
]

const LENGTH_OPTIONS = [
  { value: 'lebih_pendek' as Length, label: 'Lebih Pendek' },
  { value: 'sama' as Length, label: 'Sama' },
  { value: 'lebih_panjang' as Length, label: 'Lebih Panjang' }
]

export function WriteTab({ model = 'gpt-4o' }: Props) {
  const [text, setText] = useState('')
  const [tone, setTone] = useState<Tone>('berita')
  const [length, setLength] = useState<Length>('sama')
  
  const rewriteState = useRewrite(model)
  const expandState = useExpand(model)

  const handleRewrite = async () => {
    if (!text.trim()) return
    await rewriteState.rewrite({ content: text, tone, length })
  }

  const handleExpand = async () => {
    if (!text.trim()) return
    await expandState.expand({ content: text })
  }

  const applyResult = (result: string) => {
    // Dispatch event untuk apply ke editor
    window.dispatchEvent(new CustomEvent('ai-apply-content', { detail: { content: result } }))
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Masukkan teks untuk diproses:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Salin teks dari artikel Anda di sini..."
          className="w-full h-24 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Gaya</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            {TONE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-1 block">Panjang</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value as Length)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          >
            {LENGTH_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleRewrite}
          disabled={!text.trim() || rewriteState.loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {rewriteState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Tulis Ulang
        </button>
        <button
          onClick={handleExpand}
          disabled={!text.trim() || expandState.loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {expandState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Perluas
        </button>
      </div>

      {rewriteState.result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-purple-600">Hasil Tulis Ulang</span>
            <button
              onClick={() => applyResult(rewriteState.result!.rewritten)}
              className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Terapkan ke Editor
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 max-h-40 overflow-auto">
            {rewriteState.result.rewritten}
          </div>
        </div>
      )}

      {expandState.result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-amber-600">Hasil Perluas</span>
            <button
              onClick={() => applyResult(expandState.result!.expanded)}
              className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
            >
              Terapkan ke Editor
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 max-h-40 overflow-auto">
            {expandState.result.expanded}
          </div>
        </div>
      )}

      {(rewriteState.error || expandState.error) && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {rewriteState.error || expandState.error}
        </div>
      )}
    </div>
  )
}