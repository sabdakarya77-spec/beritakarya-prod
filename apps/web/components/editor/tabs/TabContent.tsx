import { useEditorStore } from '../../../store/editorStore'
import { FileText, Hash, Image, Layout, Clock, Type } from 'lucide-react'

export function TabContent() {
  const { blocks, categoryId, tags, featuredImage } = useEditorStore()
  
  // Calculate stats
  const paragraphCount = blocks.filter(b => b.type === 'paragraph').length
  const headingCount = blocks.filter(b => b.type === 'heading').length
  const imageCount = blocks.filter(b => b.type === 'image').length
  const totalCount = blocks.length || 1 // Avoid divide-by-zero
  
  // Calculate block percentages
  const pPercent = Math.round((paragraphCount / totalCount) * 100)
  const hPercent = Math.round((headingCount / totalCount) * 100)
  const iPercent = Math.round((imageCount / totalCount) * 100)

  // Estimate reading time (200 words per minute) - accurate sync including list items
  const wordCount = blocks.reduce((count, block) => {
    const content = (block as any).content || ''
    const items = (block as any).items || []
    
    // Count words in content
    const textContent = content.replace(/<[^>]*>/g, ' ').trim()
    const words = textContent.split(/\s+/).filter((w: string) => w.length > 0)
    
    // Count words in list items
    const listWords = items.reduce((acc: number, item: string) => {
      const clean = item.replace(/<[^>]*>/g, ' ').trim()
      return acc + clean.split(/\s+/).filter(w => w.length > 0).length
    }, 0)
    
    return count + words.length + listWords
  }, 0)
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Editorial readiness checkpoints
  const criteria = [
    { label: 'Minimal 150 Kata', checked: wordCount >= 150 },
    { label: 'Memiliki Judul & Subjudul', checked: headingCount >= 1 },
    { label: 'Gambar Utama Terpasang', checked: !!featuredImage },
    { label: 'Kategori Dipilih', checked: !!categoryId },
    { label: 'Tag Ditambahkan', checked: tags && tags.length > 0 },
  ]
  const completedCheckpoints = criteria.filter(c => c.checked).length
  const readinessPercent = Math.round((completedCheckpoints / criteria.length) * 100)

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Premium Statistics Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Words Card */}
        <div className="p-3 bg-panel-surface border border-panel-border rounded-xl border-l-2 border-l-accent-red relative overflow-hidden group hover:border-panel-border-hover transition-all">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-panel-text-secondary">Kata</span>
            <Type size={12} className="text-panel-text-muted group-hover:text-accent-red transition-colors" />
          </div>
          <div className="text-2xl font-extrabold text-panel-text-primary tracking-tight">
            {wordCount.toLocaleString()}
          </div>
        </div>

        {/* Reading Time Card */}
        <div className="p-3 bg-panel-surface border border-panel-border rounded-xl border-l-2 border-l-accent-purple relative overflow-hidden group hover:border-panel-border-hover transition-all">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-panel-text-secondary">Read Time</span>
            <Clock size={12} className="text-panel-text-muted group-hover:text-accent-purple transition-colors" />
          </div>
          <div className="text-2xl font-extrabold text-panel-text-primary tracking-tight flex items-baseline gap-1">
            {readingTime}
            <span className="text-[10px] font-normal text-panel-text-secondary">min</span>
          </div>
        </div>
      </div>

      {/* Article Readiness Score */}
      <div className="p-3 bg-panel-surface border border-panel-border rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-semibold text-panel-text-primary">Kesiapan Publikasi</span>
          <span className="text-[11px] font-bold text-accent-red">{readinessPercent}%</span>
        </div>
        <div className="w-full bg-panel-elevated h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-accent-red h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
        <ul className="text-[10px] space-y-1 text-panel-text-secondary">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className={c.checked ? 'text-emerald-500 font-bold' : 'text-panel-text-muted'}>
                {c.checked ? '✓' : '○'}
              </span>
              <span className={c.checked ? 'text-panel-text-primary line-through opacity-60' : ''}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Block Statistics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-panel-text-secondary whitespace-nowrap">Distribusi Blok</span>
          <div className="w-full h-px bg-panel-border" />
        </div>
        
        <div className="space-y-3">
          {/* Paragraphs */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-2 text-panel-text-secondary">
                <FileText size={12} className="text-blue-400" />
                Paragraf
              </span>
              <span className="font-semibold text-panel-text-primary">{paragraphCount} <span className="text-[10px] text-panel-text-muted font-normal">({pPercent}%)</span></span>
            </div>
            <div className="w-full bg-panel-elevated h-1 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pPercent}%` }} />
            </div>
          </div>

          {/* Headings */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-2 text-panel-text-secondary">
                <Hash size={12} className="text-violet-400" />
                Subjudul
              </span>
              <span className="font-semibold text-panel-text-primary">{headingCount} <span className="text-[10px] text-panel-text-muted font-normal">({hPercent}%)</span></span>
            </div>
            <div className="w-full bg-panel-elevated h-1 rounded-full overflow-hidden">
              <div className="bg-violet-400 h-full rounded-full" style={{ width: `${hPercent}%` }} />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-2 text-panel-text-secondary">
                <Image size={12} className="text-amber-400" />
                Media / Gambar
              </span>
              <span className="font-semibold text-panel-text-primary">{imageCount} <span className="text-[10px] text-panel-text-muted font-normal">({iPercent}%)</span></span>
            </div>
            <div className="w-full bg-panel-elevated h-1 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${iPercent}%` }} />
            </div>
          </div>

          {/* Total Blocks */}
          <div className="flex justify-between items-center pt-2 border-t border-panel-border text-xs text-panel-text-secondary">
            <span className="flex items-center gap-2">
              <Layout size={12} />
              Total Blok
            </span>
            <span className="font-bold text-panel-text-primary">{blocks.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TabContent