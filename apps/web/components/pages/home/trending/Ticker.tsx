/**
 * Ticker — Template C (Data-Driven)
 *
 * Ticker berjalan di atas hero, menampilkan judul artikel trending.
 * Cocok untuk site berita cepat.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design C
 */

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { HomeArticle } from '../utils/distribution'

interface TickerProps {
  articles: HomeArticle[]
  site: string
}

export function Ticker({ articles, site }: TickerProps) {
  if (articles.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-brand-red/20 bg-brand-red/5 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <TrendingUp size={12} className="text-brand-red" />
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">Trending</span>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-none">
          {articles.slice(0, 5).map((article) => (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="group flex-shrink-0 text-xs font-bold text-brand-black transition-colors hover:text-brand-red dark:text-white"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
