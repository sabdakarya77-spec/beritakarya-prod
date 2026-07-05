/**
 * WithContext — Template E (Visual Storytelling)
 *
 * Trending dengan konteks tambahan: kategori, persentase kenaikan, waktu.
 * Cocok untuk site yang ingin menunjukkan "kenapa trending".
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design E
 */

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { SectionEyebrow } from '../../../ui/Typography'
import { Container } from '../../../layout/Container'
import type { HomeArticle } from '../utils/distribution'

interface WithContextProps {
  articles: HomeArticle[]
  site: string
}

export function WithContext({ articles, site }: WithContextProps) {
  if (articles.length === 0) return null

  return (
    <Container className="pb-4 md:pb-6">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-brand-red" />
          <SectionEyebrow className="text-brand-black dark:text-white">
            Paling Dibaca 24 Jam Terakhir
          </SectionEyebrow>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/5 dark:bg-white/[0.02]">
          {articles.slice(0, 5).map((article, index) => (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.01] [&:not(:last-child)]:border-b [&:not(:last-child)]:border-black/5 dark:[&:not(:last-child)]:border-white/5"
            >
              <span className="flex-shrink-0 font-sans text-2xl font-black leading-none text-gray-100 dark:text-white/10">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 font-sans text-sm font-bold leading-snug text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                  {article.title}
                </h4>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-brand-text-muted">
                  <span className="text-brand-red">
                    {article.categories?.[0]?.category?.name || ''}
                  </span>
                  <span className="opacity-30">·</span>
                  <span>{article.viewCount?.toLocaleString('id-ID') || 0} views</span>
                  <span className="opacity-30">·</span>
                  <span>{article.readingTimeMin || 3} min</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  )
}
