'use client'

import { useState } from 'react'
import { Loader2, FileText, Languages, ImageIcon } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useSummarize, useTranslate, useImageGen } from '../../../../hooks/useAI'

type Section = 'summarize' | 'translate' | 'image'

const SUMMARY_STYLES = [
  { value: 'excerpt' as const, label: 'Excerpt', desc: '2-3 kalimat ringkas' },
  { value: 'social' as const, label: 'Social Media', desc: 'Max 280 karakter' },
  { value: 'bullet' as const, label: 'Bullet Points', desc: '5 poin utama' },
]

const LANGUAGES = [
  { value: 'en' as const, label: 'Inggris' },
  { value: 'ms' as const, label: 'Melayu' },
  { value: 'ar' as const, label: 'Arab' },
  { value: 'ja' as const, label: 'Jepang' },
  { value: 'zh' as const, label: 'Mandarin' },
]

const IMAGE_SIZES = [
  { value: '1024x1024' as const, label: '1:1' },
  { value: '1792x1024' as const, label: '16:9' },
  { value: '1024x1792' as const, label: '9:16' },
]

export function GenerateTab() {
  const [activeSection, setActiveSection] = useState<Section>('summarize')

  return (
    <div className="p-4 space-y-4">
      {/* Section selector */}
      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
        <SectionButton
          active={activeSection === 'summarize'}
          onClick={() => setActiveSection('summarize')}
          icon={<FileText size={12} />}
          label="Ringkasan"
        />
        <SectionButton
          active={activeSection === 'translate'}
          onClick={() => setActiveSection('translate')}
          icon={<Languages size={12} />}
          label="Terjemahan"
        />
        <SectionButton
          active={activeSection === 'image'}
          onClick={() => setActiveSection('image')}
          icon={<ImageIcon size={12} />}
          label="Gambar AI"
        />
      </div>

      {activeSection === 'summarize' && <SummarizeSection />}
      {activeSection === 'translate' && <TranslateSection />}
      {activeSection === 'image' && <ImageSection />}
    </div>
  )
}

// ── Section buttons ────────────────────────────────────────────

function SectionButton({ active, onClick, icon, label }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all',
        active
          ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Summarize Section ──────────────────────────────────────────

function SummarizeSection() {
  const [text, setText] = useState('')
  const [style, setStyle] = useState<'excerpt' | 'social' | 'bullet'>('excerpt')
  const summarizeState = useSummarize()

  const applyResult = (content: string) => {
    window.dispatchEvent(new CustomEvent('ai-apply-content', { detail: { content } }))
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tempel artikel untuk dibuat ringkasan..."
        className="w-full h-24 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
      />

      <div className="flex gap-1.5">
        {SUMMARY_STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStyle(s.value)}
            className={cn(
              'flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg border transition-colors',
              style === s.value
                ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-gray-300'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => summarizeState.generate({ text, style })}
        disabled={!text.trim() || summarizeState.loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {summarizeState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Buat Ringkasan
      </button>

      {summarizeState.result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-purple-600">Hasil Ringkasan</span>
            <button
              onClick={() => applyResult(summarizeState.result!.summary)}
              className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Terapkan ke Editor
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {summarizeState.result.summary}
          </div>
        </div>
      )}

      {summarizeState.error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{summarizeState.error}</div>
      )}
    </div>
  )
}

// ── Translate Section ──────────────────────────────────────────

function TranslateSection() {
  const [text, setText] = useState('')
  const [targetLang, setTargetLang] = useState<'en' | 'ms' | 'ar' | 'ja' | 'zh'>('en')
  const translateState = useTranslate()

  const applyResult = (content: string) => {
    window.dispatchEvent(new CustomEvent('ai-apply-content', { detail: { content } }))
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tempel teks yang ingin diterjemahkan..."
        className="w-full h-24 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
      />

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Bahasa Tujuan</label>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value as typeof targetLang)}
          className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={() => translateState.translate({ text, targetLang })}
        disabled={!text.trim() || translateState.loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {translateState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Terjemahkan
      </button>

      {translateState.result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-blue-600">
              Hasil Terjemahan ({LANGUAGES.find(l => l.value === translateState.result!.targetLang)?.label})
            </span>
            <button
              onClick={() => applyResult(translateState.result!.translated)}
              className="text-[10px] px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Terapkan ke Editor
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {translateState.result.translated}
          </div>
        </div>
      )}

      {translateState.error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{translateState.error}</div>
      )}
    </div>
  )
}

// ── Image Generation Section ───────────────────────────────────

function ImageSection() {
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const imageState = useImageGen()

  const insertImage = (url: string) => {
    window.dispatchEvent(new CustomEvent('ai-apply-content', {
      detail: { content: `<img src="${url}" alt="AI Generated" />` }
    }))
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Deskripsi Gambar</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Deskripsikan gambar yang ingin dibuat..."
          className="w-full h-20 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
        />
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Ukuran</label>
        <div className="flex gap-1.5">
          {IMAGE_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSize(s.value)}
              className={cn(
                'flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg border transition-colors',
                size === s.value
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-gray-300'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => imageState.generate({ prompt, size })}
        disabled={!prompt.trim() || imageState.loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {imageState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Buat Gambar
      </button>

      {imageState.result && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-indigo-600">Hasil:</span>
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <img
              src={imageState.result.url}
              alt={imageState.result.revisedPrompt}
              className="w-full h-auto"
            />
          </div>
          <p className="text-[9px] text-gray-400 italic">
            {imageState.result.revisedPrompt}
          </p>
          <button
            onClick={() => insertImage(imageState.result!.url)}
            className="w-full text-[10px] px-2 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            Sisipkan ke Editor
          </button>
        </div>
      )}

      {imageState.error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{imageState.error}</div>
      )}
    </div>
  )
}
