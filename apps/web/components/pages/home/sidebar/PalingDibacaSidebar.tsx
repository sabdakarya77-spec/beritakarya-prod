import { Flame } from 'lucide-react'
import Link from 'next/link'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface PalingDibacaSidebarProps {
  articles: HomeArticle[]
  site: string
}

const getImageUrl = (article: HomeArticle): string =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg'

export function PalingDibacaSidebar({ articles, site }: PalingDibacaSidebarProps) {
  if (articles.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center gap-1.5">
        <Flame size={12} className="text-brand-red" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
          Paling Dibaca
        </span>
      </div>
      <div className="space-y-3">
        {articles.slice(0, 5).map((article, index) => {
          const imageUrl = getImageUrl(article)
          return (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="group flex items-start gap-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-black text-brand-text-muted group-hover:bg-brand-red group-hover:text-white transition-colors dark:bg-white/5 dark:text-brand-text-muted dark:group-hover:bg-brand-red">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[11px] font-bold leading-snug text-brand-black dark:text-white group-hover:text-brand-red transition-colors">
                  {article.title}
                </p>
              </div>
              <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                <SmartImage
                  src={imageUrl}
                  context="thumbnail"
                  alt={article.title}
                  fill
                  sizes="52px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
