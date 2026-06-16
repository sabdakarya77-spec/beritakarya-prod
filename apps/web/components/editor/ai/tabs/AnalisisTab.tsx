'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, BookOpen, ShieldCheck, Eye } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useEditorStore } from '../../../../store/editorStore'
import { useReadability, useFactCheck, useObjectivity } from '../../../../hooks/useAI'
import type { ReadabilityResult, FactCheckResult, ObjectivityResult } from '../../../../hooks/useAI'

type Section = 'readability' | 'factcheck' | 'objectivity'

export function AnalisisTab() {
  const { blocks } = useEditorStore()
  const [text, setText] = useState('')
  const [activeSection, setActiveSection] = useState<Section | null>(null)

  const readabilityState = useReadability()
  const factCheckState = useFactCheck()
  const objectivityState = useObjectivity()

  // Pull text from editor blocks
  const getFullText = () => {
    return blocks.reduce((acc, block) => {
      const content = (block as any).content || ''
      const items = (block as any).items || []
      const cleanText = content.replace(/<[^>]*>/g, ' ').trim()
      const listText = items.map((item: string) => item.replace(/<[^>]*>/g, ' ').trim()).join('\n')
      let res = acc
      if (cleanText) res += cleanText + '\n'
      if (listText) res += listText + '\n'
      return res
    }, '').trim()
  }

  useEffect(() => {
    const docText = getFullText()
    if (docText && !text) setText(docText)
  }, [blocks])

  const handlePullText = () => setText(getFullText())

  const handleReadability = async () => {
    if (!text.trim()) return
    setActiveSection('readability')
    await readabilityState.analyze({ text })
  }

  const handleFactCheck = async () => {
    if (!text.trim()) return
    setActiveSection('factcheck')
    await factCheckState.check({ text })
  }

  const handleObjectivity = async () => {
    if (!text.trim()) return
    setActiveSection('objectivity')
    await objectivityState.analyze({ text })
  }

  const isLoading = readabilityState.loading || factCheckState.loading || objectivityState.loading

  return (
    <div className="p-4 space-y-4">
      {/* Text input */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">Teks Analisis</span>
        <button
          onClick={handlePullText}
          className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-semibold"
        >
          <RefreshCw size={10} />
          Ambil dari Dokumen
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Salin teks atau klik tombol di atas..."
        className="w-full h-24 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
      />

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleReadability}
          disabled={!text.trim() || isLoading}
          className="flex flex-col items-center gap-1 px-2 py-2.5 bg-blue-600 text-white text-[10px] font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {readabilityState.loading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
          Keterbacaan
        </button>
        <button
          onClick={handleFactCheck}
          disabled={!text.trim() || isLoading}
          className="flex flex-col items-center gap-1 px-2 py-2.5 bg-emerald-600 text-white text-[10px] font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {factCheckState.loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Cek Fakta
        </button>
        <button
          onClick={handleObjectivity}
          disabled={!text.trim() || isLoading}
          className="flex flex-col items-center gap-1 px-2 py-2.5 bg-violet-600 text-white text-[10px] font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {objectivityState.loading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Objektivitas
        </button>
      </div>

      {/* Results */}
      {readabilityState.result && activeSection === 'readability' && (
        <ReadabilityCard result={readabilityState.result} />
      )}
      {factCheckState.result && activeSection === 'factcheck' && (
        <FactCheckCard result={factCheckState.result} />
      )}
      {objectivityState.result && activeSection === 'objectivity' && (
        <ObjectivityCard result={objectivityState.result} />
      )}

      {/* Errors */}
      {(readabilityState.error || factCheckState.error || objectivityState.error) && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {readabilityState.error || factCheckState.error || objectivityState.error}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
  if (score >= 60) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
  return 'text-red-600 bg-red-50 dark:bg-red-900/20'
}

function verdictColor(verdict: string): string {
  if (verdict === 'Benar') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (verdict === 'Sebagian Benar') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (verdict === 'Salah') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

function severityColor(severity: string): string {
  if (severity === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (severity === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

function ReadabilityCard({ result }: { result: ReadabilityResult }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-medium text-blue-600">Hasil Keterbacaan</span>
      <div className="flex items-center gap-3">
        <div className={cn('px-3 py-2 rounded-lg text-center', scoreColor(result.score))}>
          <div className="text-lg font-bold">{result.score}</div>
          <div className="text-[9px]">Skor</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Level: {result.level}
          </div>
        </div>
      </div>
      {result.suggestions.length > 0 && (
        <ul className="space-y-1">
          {result.suggestions.map((s, i) => (
            <li key={i} className="text-[10px] text-gray-600 dark:text-gray-400 flex gap-1.5">
              <span className="text-blue-400">•</span> {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FactCheckCard({ result }: { result: FactCheckResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-emerald-600">Hasil Cek Fakta</span>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', scoreColor(result.accuracy_score))}>
          Skor: {result.accuracy_score}
        </span>
      </div>
      <div className="space-y-2">
        {result.claims.map((c, i) => (
          <div key={i} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-1">
            <div className="flex items-start gap-2">
              <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0', verdictColor(c.verified ? 'Benar' : 'Salah'))}>
                {c.verified ? 'Benar' : 'Perlu Verifikasi'}
              </span>
            </div>
            <p className="text-[10px] text-gray-700 dark:text-gray-300">{c.text}</p>
            {c.explanation && (
              <p className="text-[9px] text-gray-500">{c.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ObjectivityCard({ result }: { result: ObjectivityResult }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-violet-600">Hasil Objektivitas</span>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', scoreColor(result.score))}>
          Skor: {result.score}
        </span>
      </div>

      {result.overall_verdict && (
        <p className="text-[10px] text-gray-600 dark:text-gray-400 italic">
          {result.overall_verdict}
        </p>
      )}

      {result.biased_phrases.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-gray-500">
            Frasa Bias ({result.biased_phrases.length}):
          </span>
          {result.biased_phrases.map((p, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-[10px] space-y-1">
              <div>
                <span className="line-through text-red-500">{p.phrase}</span>
                <span className="text-gray-400"> → </span>
                <span className="text-green-600">{p.suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
