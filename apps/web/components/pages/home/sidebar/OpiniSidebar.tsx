import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { HomeArticle } from '../utils/distribution'

interface OpiniSidebarProps {
  articles: HomeArticle[]
  site: string
}

export function OpiniSidebar({ articles, site }: OpiniSidebarProps) {
  if (articles.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center gap-1.5">
        <MessageSquare size={12} className="text-brand-red" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
          Opini &amp; Analisis
        </span>
      </div>
      <div className="space-y-3">
        {articles.slice(0, 3).map((article) => (
          <Link
            key={article.id}
            href={`/${site}/artikel/${article.slug}`}
            className="group block"
          >
            <h4 className="line-clamp-2 text-[11px] font-bold leading-snug text-brand-black dark:text-white group-hover:text-brand-red transition-colors">
              &ldquo;{article.title}&rdquo;
            </h4>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-brand-text-muted">
              {article.author?.avatarUrl ? (
                <img
                  src={article.author.avatarUrl}
                  alt={article.author.name || 'Penulis'}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-red/10 text-[7px] font-black text-brand-red">
                  {(article.author?.name || 'S')[0]}
                </div>
              )}
              <span className="truncate font-medium">{article.author?.name || 'Redaksi'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
