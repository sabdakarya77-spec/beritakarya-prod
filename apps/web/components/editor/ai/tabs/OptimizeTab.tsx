import { useState, useEffect } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useHeadlines, useSEO } from '../../../../hooks/useAI'
import { useEditorStore } from '../../../../store/editorStore'

export function OptimizeTab() {
  const { title: storeTitle, excerpt: storeExcerpt } = useEditorStore()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  
  // Inisialisasi awal dengan data store
  useEffect(() => {
    if (storeTitle) setTitle(storeTitle)
    if (storeExcerpt) setExcerpt(storeExcerpt)
  }, [storeTitle, storeExcerpt])

  const handlePullFromDocument = () => {
    setTitle(storeTitle || '')
    setExcerpt(storeExcerpt || '')
  }
  
  const headlineState = useHeadlines()
  const seoState = useSEO()

  const handleGenerateHeadlines = async () => {
    if (!title.trim()) return
    await headlineState.generate({ title, contentExcerpt: excerpt || title })
  }

  const handleGenerateSEO = async () => {
    if (!title.trim()) return
    await seoState.generate({ title, contentExcerpt: excerpt || title })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400">Input Optimasi AI</span>
        <button
          onClick={handlePullFromDocument}
          className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-semibold"
          title="Ambil judul dan ringkasan terbaru dari editor"
        >
          <RefreshCw size={10} />
          Ambil dari Dokumen
        </button>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Judul Artikel</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masukkan judul..."
          className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
        />
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">Ringkasan/Konten (opsional)</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Ringkasan atau cuplikan artikel..."
          className="w-full h-16 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleGenerateHeadlines}
          disabled={!title.trim() || headlineState.loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {headlineState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Headline
        </button>
        <button
          onClick={handleGenerateSEO}
          disabled={!title.trim() || seoState.loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {seoState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
          SEO
        </button>
      </div>

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

      {seoState.result && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-green-600">SEO yang Dibuat:</span>
          <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-xs space-y-2">
            <div>
              <span className="font-medium">Meta Title:</span> {seoState.result.metaTitle}
            </div>
            <div>
              <span className="font-medium">Meta Description:</span> {seoState.result.metaDescription}
            </div>
          </div>
        </div>
      )}

      {(headlineState.error || seoState.error) && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {headlineState.error || seoState.error}
        </div>
      )}
    </div>
  )
}