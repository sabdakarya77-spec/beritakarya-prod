'use client'

/**
 * Bento3Hero — Template D (Compact Dense)
 *
 * Layout: 3 kartu sejajar, masing-masing dengan overlay text.
 * Cocok untuk site dengan konten sedikit atau mobile-first.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design D
 */

import Link from 'next/link'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface Bento3HeroProps {
  articles: HomeArticle[]
  site: string
}

export function Bento3Hero({ articles, site }: Bento3HeroProps) {
  if (articles.length === 0) return null

  const cards = articles.slice(0, 3)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((article) => (
        <Link
          key={article.id}
          href={`/${site}/artikel/${article.slug}`}
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl md:aspect-[3/4]"
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
          <div className="absolute bottom-0 left-0 w-full p-4 md:p-5">
            <span className="mb-2 inline-block rounded-full bg-brand-red/90 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              {article.categories?.[0]?.category?.name || 'Berita Utama'}
            </span>
            <h2 className="font-sans text-base font-extrabold leading-tight text-white md:text-lg">
              {article.title}
            </h2>
            <div className="mt-2 text-[10px] text-white/60">
              {article.author?.name || 'Redaksi'} · {article.readingTimeMin || 3} min
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
