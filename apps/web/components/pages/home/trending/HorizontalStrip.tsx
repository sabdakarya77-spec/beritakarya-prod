/**
 * HorizontalStrip — Template A (Classic Editorial)
 *
 * 5 artikel dalam strip horizontal, numbered.
 * Terinspirasi NYT "Most Read" horizontal.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design A
 */

import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Container } from '../../../layout/Container'
import type { HomeArticle } from '../utils/distribution'
import { sectionEyebrowClass } from '../constants'

interface HorizontalStripProps {
  articles: HomeArticle[]
  site: string
}

export function HorizontalStrip({ articles, site }: HorizontalStripProps) {
  if (articles.length === 0) return null

  return (
    <Container className="pb-4 md:pb-6">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-brand-red" />
          <span className={`${sectionEyebrowClass} text-brand-black dark:text-white`}>
            Trending
          </span>
        </div>
        <div className="flex gap-0 divide-x divide-black/5 overflow-x-auto scrollbar-none dark:divide-white/5">
          {articles.slice(0, 5).map((article, index) => (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="group flex min-w-[200px] flex-1 flex-col gap-2 px-4 first:pl-0 last:pr-0"
            >
              <span className="font-sans text-3xl font-black leading-none text-gray-100 dark:text-white/10">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                {article.title}
              </h4>
              <div className="text-[10px] text-brand-text-muted">
                {article.author?.name || 'Redaksi'} · {article.readingTimeMin || 3} min
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  )
}
