import { useState, useEffect } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useGrammar } from '../../../../hooks/useAI'
import { useEditorStore } from '../../../../store/editorStore'

interface Props {
  model?: string
}

export function ValidateTab({ model = 'gpt-4o' }: Props) {
  const { blocks } = useEditorStore()
  const [text, setText] = useState('')
  const grammarState = useGrammar(model)

  // Menggabungkan seluruh teks dari blok dokumen
  const getFullDocumentText = () => {
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

  // Isi teks otomatis saat pertama kali dimuat
  useEffect(() => {
    const docText = getFullDocumentText()
    if (docText && !text) {
      setText(docText)
    }
  }, [blocks])

  const handlePullText = () => {
    setText(getFullDocumentText())
  }

  const handleCheck = async () => {
    if (!text.trim()) return
    await grammarState.check({ text })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Periksa Tata Bahasa
        </label>
        <button
          onClick={handlePullText}
          className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-700 font-semibold"
          title="Ambil seluruh tulisan dari editor"
        >
          <RefreshCw size={10} />
          Ambil Teks Dokumen
        </button>
      </div>

      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Salin teks atau klik tombol di atas untuk menarik tulisan..."
          className="w-full h-32 px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 resize-none"
        />
      </div>

      <button
        onClick={handleCheck}
        disabled={!text.trim() || grammarState.loading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {grammarState.loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Periksa
      </button>

      {grammarState.result && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-green-600">Hasil:</span>
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {grammarState.result.corrected}
          </div>
          {grammarState.result.corrections.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] font-medium text-gray-500">Koreksi ({grammarState.result.corrections.length}):</span>
              <ul className="mt-1 space-y-1">
                {grammarState.result.corrections.map((c, i) => (
                  <li key={i} className="text-[10px] p-1 bg-amber-50 rounded">
                    <span className="line-through text-red-500">{c.original}</span>
                    {' → '}
                    <span className="text-green-600">{c.suggestion}</span>
                    {c.reason && <span className="text-gray-400"> ({c.reason})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {grammarState.error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">
          {grammarState.error}
        </div>
      )}
    </div>
  )
}