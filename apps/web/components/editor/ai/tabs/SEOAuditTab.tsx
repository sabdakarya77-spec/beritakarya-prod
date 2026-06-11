import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { useEditorStore } from '../../../../store/editorStore'

export function SEOAuditTab() {
  const { 
    title, 
    metaTitle, 
    metaDescription,
    setTitle,
    updateArticleData 
  } = useEditorStore()
  
  const [focusKeyword, setFocusKeyword] = useState('')

  useEffect(() => {
    const savedKeyword = sessionStorage.getItem('seo-focus-keyword')
    if (savedKeyword) setFocusKeyword(savedKeyword)
  }, [])

  const handleKeywordChange = (val: string) => {
    setFocusKeyword(val)
    sessionStorage.setItem('seo-focus-keyword', val)
  }

  // Validation checks
  const titleLength = title?.length || 0
  const isTitleValid = titleLength >= 40 && titleLength <= 70
  const hasKeywordInTitle = focusKeyword.trim() && title
    ? title.toLowerCase().includes(focusKeyword.toLowerCase())
    : false

  const metaTitleLen = metaTitle?.length || 0
  const isMetaTitleValid = metaTitleLen >= 50 && metaTitleLen <= 60
  const hasKeywordInMetaTitle = focusKeyword.trim() && metaTitle
    ? metaTitle.toLowerCase().includes(focusKeyword.toLowerCase())
    : false

  const metaDescLen = metaDescription?.length || 0
  const isMetaDescValid = metaDescLen >= 120 && metaDescLen <= 160
  const hasKeywordInMetaDesc = focusKeyword.trim() && metaDescription
    ? metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())
    : false

  return (
    <div className="p-4 space-y-4">
      {/* Focus Keyword */}
      <div>
        <label className="text-[10px] font-medium text-gray-500 mb-1 block">
          🎯 Focus Keyword
        </label>
        <input
          value={focusKeyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="Masukkan kata kunci..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
      </div>

      {/* Title Input */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Judul Artikel</label>
        <input
          value={title || ''}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul artikel..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">{titleLength}/70 karakter</span>
          {titleLength > 0 && (
            <span className={cn(
              'text-[9px] font-medium',
              isTitleValid ? 'text-green-600' : 'text-red-500'
            )}>
              {isTitleValid ? '✓ Valid' : '⚠️ Optimal 40-70 karakter'}
            </span>
          )}
        </div>
      </div>

      {/* Meta Title Input */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Meta Title</label>
        <input
          value={metaTitle || ''}
          onChange={(e) => updateArticleData({ metaTitle: e.target.value })}
          placeholder="Meta title untuk SEO..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">{metaTitleLen}/60 karakter</span>
          {metaTitleLen > 0 && (
            <span className={cn(
              'text-[9px] font-medium',
              isMetaTitleValid ? 'text-green-600' : 'text-red-500'
            )}>
              {isMetaTitleValid ? '✓ Valid' : '⚠️ Optimal 50-60 karakter'}
            </span>
          )}
        </div>
      </div>

      {/* Meta Description Input */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Meta Description</label>
        <textarea
          value={metaDescription || ''}
          onChange={(e) => updateArticleData({ metaDescription: e.target.value })}
          placeholder="Meta description untuk SEO..."
          className="w-full h-16 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">{metaDescLen}/160 karakter</span>
          {metaDescLen > 0 && (
            <span className={cn(
              'text-[9px] font-medium',
              isMetaDescValid ? 'text-green-600' : 'text-red-500'
            )}>
              {isMetaDescValid ? '✓ Valid' : '⚠️ Optimal 120-160 karakter'}
            </span>
          )}
        </div>
      </div>

      {/* Keyword Checks */}
      {focusKeyword.trim() && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-gray-500">Keyword Checks:</span>
          
          <div className="flex items-center gap-2 text-xs">
            {hasKeywordInTitle ? (
              <CheckCircle2 size={14} className="text-green-600" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
            <span>Keyword di Judul</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {hasKeywordInMetaTitle ? (
              <CheckCircle2 size={14} className="text-green-600" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
            <span>Keyword di Meta Title</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {hasKeywordInMetaDesc ? (
              <CheckCircle2 size={14} className="text-green-600" />
            ) : (
              <XCircle size={14} className="text-red-500" />
            )}
            <span>Keyword di Meta Description</span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-[10px] text-blue-700 dark:text-blue-400">
          💡 Tips: Gunakan focus keyword di awal judul dan meta description untuk hasil SEO terbaik.
        </p>
      </div>
    </div>
  )
}