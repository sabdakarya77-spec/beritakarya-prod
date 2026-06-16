'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useEditorStore } from '../../../../store/editorStore'
import { useHeadlines, useSEO } from '../../../../hooks/useAI'

export function SEOTab() {
  const {
    title: storeTitle,
    excerpt: storeExcerpt,
    metaTitle: storeMetaTitle,
    metaDescription: storeMetaDescription,
    setTitle,
    updateArticleData,
  } = useEditorStore()

  const [focusKeyword, setFocusKeyword] = useState('')
  const [excerpt, setExcerpt] = useState('')

  const headlineState = useHeadlines()
  const seoState = useSEO()

  // Init from store
  useEffect(() => {
    if (storeExcerpt) setExcerpt(storeExcerpt)
    const savedKeyword = sessionStorage.getItem('seo-focus-keyword')
    if (savedKeyword) setFocusKeyword(savedKeyword)
  }, [storeExcerpt])

  const handleKeywordChange = (val: string) => {
    setFocusKeyword(val)
    sessionStorage.setItem('seo-focus-keyword', val)
  }

  const handlePullFromDocument = () => {
    setTitle(storeTitle || '')
    setExcerpt(storeExcerpt || '')
  }

  const handleGenerateHeadlines = async () => {
    if (!storeTitle?.trim()) return
    await headlineState.generate({ title: storeTitle, contentExcerpt: excerpt || storeTitle })
  }

  const handleGenerateSEO = async () => {
    if (!storeTitle?.trim()) return
    await seoState.generate({ title: storeTitle, contentExcerpt: excerpt || storeTitle })
  }

  // Auto-fill meta fields when AI generates SEO
  useEffect(() => {
    if (seoState.result) {
      if (seoState.result.metaTitle) updateArticleData({ metaTitle: seoState.result.metaTitle })
      if (seoState.result.metaDescription) updateArticleData({ metaDescription: seoState.result.metaDescription })
    }
  }, [seoState.result])

  // ── Client-side validation ──
  const titleLength = storeTitle?.length || 0
  const isTitleValid = titleLength >= 40 && titleLength <= 70
  const hasKeywordInTitle = focusKeyword.trim() && storeTitle
    ? storeTitle.toLowerCase().includes(focusKeyword.toLowerCase())
    : false

  const metaTitleLen = storeMetaTitle?.length || 0
  const isMetaTitleValid = metaTitleLen >= 50 && metaTitleLen <= 60
  const hasKeywordInMetaTitle = focusKeyword.trim() && storeMetaTitle
    ? storeMetaTitle.toLowerCase().includes(focusKeyword.toLowerCase())
    : false

  const metaDescLen = storeMetaDescription?.length || 0
  const isMetaDescValid = metaDescLen >= 120 && metaDescLen <= 160
  const hasKeywordInMetaDesc = focusKeyword.trim() && storeMetaDescription
    ? storeMetaDescription.toLowerCase().includes(focusKeyword.toLowerCase())
    : false

  return (
    <div className="p-4 space-y-4">
      {/* Pull button */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">SEO & Optimasi</span>
        <button
          onClick={handlePullFromDocument}
          className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-semibold"
        >
          <RefreshCw size={10} />
          Ambil dari Dokumen
        </button>
      </div>

      {/* Focus Keyword */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 mb-1 block">🎯 Focus Keyword</label>
        <input
          value={focusKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="Masukkan kata kunci..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
      </div>

      {/* Title */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Judul Artikel</label>
        <input
          value={storeTitle || ''}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul artikel..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">{titleLength}/70 karakter</span>
          {titleLength > 0 && (
            <span className={cn('text-[9px] font-medium', isTitleValid ? 'text-green-600' : 'text-red-500')}>
              {isTitleValid ? '✓ Valid' : '⚠️ Optimal 40-70 karakter'}
            </span>
          )}
        </div>
      </div>

      {/* Meta Title */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Meta Title</label>
        <input
          value={storeMetaTitle || ''}
          onChange={(e) => updateArticleData({ metaTitle: e.target.value })}
          placeholder="Meta title untuk SEO..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">{metaTitleLen}/60 karakter</span>
          {metaTitleLen > 0 && (
            <span className={cn('text-[9px] font-medium', isMetaTitleValid ? 'text-green-600' : 'text-red-500')}>
              {isMetaTitleValid ? '✓ Valid' : '⚠️ Optimal 50-60 karakter'}
            </span>
          )}
        </div>
      </div>

      {/* Meta Description */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Meta Description</label>
        <textarea
          value={storeMetaDescription || ''}
          onChange={(e) => updateArticleData({ metaDescription: e.target.value })}
          placeholder="Meta description untuk SEO..."
          className="w-full h-16 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">{metaDescLen}/160 karakter</span>
          {metaDescLen > 0 && (
            <span className={cn('text-[9px] font-medium', isMetaDescValid ? 'text-green-600' : 'text-red-500')}>
              {isMetaDescValid ? '✓ Valid' : '⚠️ Optimal 120-160 karakter'}
            </span>
          )}
        </div>
      </div>

      {/* Keyword checks */}
      {focusKeyword.trim() && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-gray-500">Keyword Checks:</span>
          <KeywordCheck label="Keyword di Judul" ok={hasKeywordInTitle} />
          <KeywordCheck label="Keyword di Meta Title" ok={hasKeywordInMetaTitle} />
          <KeywordCheck label="Keyword di Meta Description" ok={hasKeywordInMetaDesc} />
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-slate-700" />

      {/* AI Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateHeadlines}
          disabled={!storeTitle?.trim() || headlineState.loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {headlineState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Generate Headline
        </button>
        <button
          onClick={handleGenerateSEO}
          disabled={!storeTitle?.trim() || seoState.loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {seoState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Generate SEO
        </button>
      </div>

      {/* AI Headline results */}
      {headlineState.result && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-amber-600">Headline yang Dibuat:</span>
          <div className="space-y-1">
            {headlineState.result.headlines.map((h, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-xs">
                {h}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI SEO result */}
      {seoState.result && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-green-600">SEO dari AI (sudah otomatis terisi):</span>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs space-y-1">
            <div><span className="font-medium">Meta Title:</span> {seoState.result.metaTitle}</div>
            <div><span className="font-medium">Meta Description:</span> {seoState.result.metaDescription}</div>
          </div>
        </div>
      )}

      {/* Errors */}
      {(headlineState.error || seoState.error) && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {headlineState.error || seoState.error}
        </div>
      )}

      {/* Tips */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-[10px] text-blue-700 dark:text-blue-400">
          💡 Tips: Gunakan &quot;Generate SEO&quot; untuk mengisi meta title & description secara otomatis, lalu sesuaikan manual jika perlu.
        </p>
      </div>
    </div>
  )
}

function KeywordCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? (
        <CheckCircle2 size={14} className="text-green-600" />
      ) : (
        <XCircle size={14} className="text-red-500" />
      )}
      <span>{label}</span>
    </div>
  )
}
