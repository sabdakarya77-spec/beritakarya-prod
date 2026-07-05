'use client'

/**
 * DualHero — Template E (Visual Storytelling)
 *
 * Layout: 2 gambar besar sejajar, masing-masing dengan overlay text.
 * Cocok untuk site fotografi atau feature story.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design E
 */

import Link from 'next/link'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface DualHeroProps {
  articles: HomeArticle[]
  site: string
}

export function DualHero({ articles, site }: DualHeroProps) {
  if (articles.length === 0) return null

  const cards = articles.slice(0, 2)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cards.map((article) => (
        <Link
          key={article.id}
          href={`/${site}/artikel/${article.slug}`}
          className="group relative aspect-[16/9] overflow-hidden rounded-2xl"
        >
          <SmartImage
            src={article.featuredImage || '/placeholder.jpg'}
            context="hero_lead"
            alt={article.title}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-5 md:p-6">
            <span className="mb-2 inline-block rounded-full bg-brand-red/90 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              {article.categories?.[0]?.category?.name || 'Berita Utama'}
            </span>
            <h2 className="mb-2 font-sans text-xl font-extrabold leading-tight text-white md:text-2xl">
              {article.title}
            </h2>
            {article.excerpt && (
              <p className="mb-3 line-clamp-2 text-sm text-white/70">{article.excerpt}</p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <span className="font-semibold text-white/80">{article.author?.name || 'Redaksi'}</span>
              <span className="opacity-40">·</span>
              <span>{article.readingTimeMin || 3} min baca</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
