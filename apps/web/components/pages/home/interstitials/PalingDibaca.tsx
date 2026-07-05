import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface PalingDibacaProps {
  articles: HomeArticle[]
  site: string
}

const getImageUrl = (article: HomeArticle): string =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg'

export function PalingDibaca({ articles, site }: PalingDibacaProps) {
  if (articles.length === 0) return null

  return (
    <section className="my-8 rounded-2xl bg-brand-grey/30 px-5 py-5 dark:bg-white/[0.02] md:px-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={14} className="text-brand-red" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black dark:text-white">
          Paling Dibaca
        </h3>
      </div>
      {/* Horizontal scrollable cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {articles.slice(0, 5).map((article, index) => {
          const imageUrl = getImageUrl(article)
          return (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="group flex w-40 flex-shrink-0 flex-col gap-2 md:w-48"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                <SmartImage
                  src={imageUrl}
                  context="card"
                  alt={article.title}
                  fill
                  sizes="192px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Rank number overlay */}
                <span className="absolute bottom-1.5 left-2 z-10 font-sans text-2xl font-black leading-none tracking-tight text-white/30">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="px-0.5">
                <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                  {article.title}
                </h4>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-brand-text-muted">
                  <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                  <span className="opacity-30">·</span>
                  <span>{article.readingTimeMin || 3} min</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
