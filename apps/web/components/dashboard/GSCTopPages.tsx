'use client'

interface GSCPage {
  page: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface GSCTopPagesProps {
  data: GSCPage[]
}

export function GSCTopPages({ data }: GSCTopPagesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-white/10">
        <p className="text-sm text-brand-text-muted">Data halaman tidak tersedia</p>
      </div>
    )
  }

  const extractPath = (url: string) => {
    try {
      return new URL(url).pathname || url
    } catch {
      return url
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]">
      <div className="border-b border-gray-100 px-5 py-3 dark:border-white/5">
        <h3 className="text-sm font-bold text-brand-black dark:text-white">Top Pages (Search)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted dark:border-white/5">
              <th className="px-5 py-2.5 text-left">#</th>
              <th className="px-5 py-2.5 text-left">Halaman</th>
              <th className="px-5 py-2.5 text-right">Clicks</th>
              <th className="px-5 py-2.5 text-right">Impressions</th>
              <th className="px-5 py-2.5 text-right">CTR</th>
              <th className="px-5 py-2.5 text-right">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                <td className="px-5 py-2.5 text-brand-text-muted">{String(idx + 1).padStart(2, '0')}</td>
                <td className="max-w-[250px] truncate px-5 py-2.5 font-medium text-brand-black dark:text-white">
                  {extractPath(row.page)}
                </td>
                <td className="px-5 py-2.5 text-right font-bold text-brand-black dark:text-white">
                  {row.clicks.toLocaleString('id-ID')}
                </td>
                <td className="px-5 py-2.5 text-right text-brand-text-muted">
                  {row.impressions.toLocaleString('id-ID')}
                </td>
                <td className="px-5 py-2.5 text-right text-brand-text-muted">{row.ctr}%</td>
                <td className="px-5 py-2.5 text-right text-brand-text-muted">{row.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
