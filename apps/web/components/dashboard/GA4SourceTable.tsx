'use client'

interface GA4Source {
  source: string
  sessions: number
  percentage: number
}

interface GA4SourceTableProps {
  sources: GA4Source[]
}

export function GA4SourceTable({ sources }: GA4SourceTableProps) {
  if (!sources || sources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-white/10">
        <p className="text-sm text-brand-text-muted">Data sumber traffic tidak tersedia</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]">
      <div className="border-b border-gray-100 px-5 py-3 dark:border-white/5">
        <h3 className="text-sm font-bold text-brand-black dark:text-white">Sumber Traffic</h3>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-white/5">
        {sources.map((src, idx) => (
          <div key={idx} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-brand-text-muted dark:bg-white/10">
                {idx + 1}
              </span>
              <span className="truncate text-sm font-medium text-brand-black dark:text-white">
                {src.source}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-brand-black dark:text-white">
                {src.sessions.toLocaleString('id-ID')}
              </span>
              <span className="w-12 text-right text-xs text-brand-text-muted">
                {src.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
