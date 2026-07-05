/**
 * StickySidebar — Template D (Compact Dense)
 *
 * Trending di sidebar sticky, berdampingan dengan feed.
 * Cocok untuk site dengan volume artikel tinggi.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design D
 */

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { HomeArticle } from '../utils/distribution'

interface StickySidebarProps {
  articles: HomeArticle[]
  site: string
}

export function StickySidebar({ articles, site }: StickySidebarProps) {
  if (articles.length === 0) return null

  return (
    <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp size={12} className="text-brand-red" />
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">Trending</span>
      </div>
      <div className="space-y-0 divide-y divide-black/5 dark:divide-white/5">
        {articles.slice(0, 5).map((article, index) => (
          <Link
            key={article.id}
            href={`/${site}/artikel/${article.slug}`}
            className="group flex items-start gap-2.5 py-2.5 first:pt-0"
          >
            <span className="flex-shrink-0 font-sans text-lg font-black leading-none text-gray-100 dark:text-white/10">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 font-sans text-[11px] font-bold leading-snug text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                {article.title}
              </h4>
              <div className="mt-1 text-[9px] text-brand-text-muted">
                {article.viewCount?.toLocaleString('id-ID') || 0} views
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
