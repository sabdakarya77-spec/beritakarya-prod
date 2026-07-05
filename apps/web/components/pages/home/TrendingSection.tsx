import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { SmartImage } from '../../ui/SmartImage'
import AnimateGrid from '../../ui/AnimateGrid'
import { SectionEyebrow } from '../../ui/Typography'
import { Container } from '../../layout/Container'
import type { HomeArticle } from './utils/distribution'

interface TrendingSectionProps {
  articles: HomeArticle[]
  site: string
}

const getImageUrl = (article: HomeArticle): string =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg'

export function TrendingSection({ articles, site }: TrendingSectionProps) {
  if (articles.length === 0) return null

  const top3 = articles.slice(0, 3)
  const rest = articles.slice(3, 5)

  return (
    <Container className="border-t border-gray-100 pt-6 pb-4 dark:border-white/5 md:pt-8 md:pb-8">
      <section>
        {/* Section Header */}
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-brand-red" />
          <SectionEyebrow className="text-brand-black dark:text-white">
            Trending
          </SectionEyebrow>
        </div>

        {/* Top 3 — Numbered Podium dengan gambar besar */}
        <AnimateGrid stagger={120}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {top3.map((article, index) => {
            const imageUrl = getImageUrl(article)
            const rank = index + 1

            return (
              <Link
                key={article.id}
                href={`/${site}/artikel/${article.slug}`}
                className="group relative aspect-[16/10] overflow-hidden rounded-2xl"
              >
                {/* Background Image */}
                <SmartImage
                  src={imageUrl}
                  context="card"
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Rank Number — besar di kiri bawah */}
                <span className="absolute bottom-3 left-3 z-10 font-sans text-5xl font-black leading-none tracking-tight text-white/20 md:text-6xl lg:text-7xl">
                  {rank.toString().padStart(2, '0')}
                </span>

                {/* Content */}
                <div className="absolute bottom-0 left-0 z-10 w-full p-4 pl-14 md:pl-16 lg:pl-20">
                  <h3 className="line-clamp-2 font-sans text-sm font-bold leading-snug tracking-tight text-white md:text-base">
                    {article.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/60">
                    <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                    <span className="opacity-40">·</span>
                    <span>{article.readingTimeMin || 3} min</span>
                  </div>
                </div>
              </Link>
            )
          })}
          </div>
        </AnimateGrid>

        {/* Ranking 4-5 — text-only, di bawah podium */}
        {rest.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-0 divide-y divide-black/5 dark:divide-white/5 md:grid-cols-2 md:divide-x md:divide-y-0">
            {rest.map((article, index) => (
              <Link
                key={article.id}
                href={`/${site}/artikel/${article.slug}`}
                className="group flex items-start gap-3 py-3 md:px-4 md:py-2 first:pt-0 last:pb-0"
              >
                <span className="tabular-nums font-sans text-2xl font-bold leading-none tracking-tight text-gray-100 transition-colors group-hover:text-brand-red dark:text-white/5 md:text-3xl">
                  {(index + 4).toString().padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[13px]">
                    {article.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-brand-text-muted">
                    <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                    <span className="opacity-30">·</span>
                    <span>{article.readingTimeMin || 3} min</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}
