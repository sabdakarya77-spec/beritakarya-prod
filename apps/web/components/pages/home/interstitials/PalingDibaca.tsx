import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { HomeArticle } from '../utils/distribution'

interface PalingDibacaProps {
  articles: HomeArticle[]
  site: string
}

export function PalingDibaca({ articles, site }: PalingDibacaProps) {
  if (articles.length === 0) return null

  return (
    <section className="my-8 rounded-2xl bg-brand-grey/30 px-6 py-8 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp size={14} className="text-brand-red" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black dark:text-white">
          Paling Dibaca
        </h3>
      </div>
      <div className="grid gap-0 divide-y divide-black/5 dark:divide-white/5">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/${site}/artikel/${article.slug}`}
            className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0"
          >
            <span className="tabular-nums font-sans text-3xl font-bold leading-none tracking-tight text-gray-100 group-hover:text-brand-red dark:text-white/5">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 font-sans text-sm font-bold leading-snug tracking-tight text-brand-black group-hover:text-brand-red dark:text-white">
                {article.title}
              </h4>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-brand-text-muted">
                <span>{article.author?.name || 'Redaksi'}</span>
                <span className="opacity-30">·</span>
                <span>{article.readingTimeMin || 3} min baca</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
