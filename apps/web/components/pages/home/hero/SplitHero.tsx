'use client'

/**
 * SplitHero — Template C (Data-Driven)
 *
 * Layout: gambar utama di kiri + daftar kategori di kanan.
 * Cocok untuk site berita cepat yang mengutamakan akses konten.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design C
 */

import Link from 'next/link'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface SplitHeroProps {
  articles: HomeArticle[]
  site: string
}

export function SplitHero({ articles, site }: SplitHeroProps) {
  if (articles.length === 0) return null

  const main = articles[0]
  const categoryArticles = articles.slice(1, 6)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      {/* Main image — col-span-7 */}
      <div className="md:col-span-7">
        <Link href={`/${site}/artikel/${main.slug}`} className="group block">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-900">
            <SmartImage
              src={main.featuredImage || '/placeholder.jpg'}
              context="hero_lead"
              alt={main.title}
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-6">
              <h2 className="mb-2 font-sans text-xl font-extrabold leading-tight text-white md:text-2xl">
                {main.title}
              </h2>
              <p className="mb-3 line-clamp-2 text-sm text-white/70">{main.excerpt}</p>
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <span className="font-semibold text-white/80">{main.author?.name || 'Redaksi'}</span>
                <span className="opacity-40">·</span>
                <span>{main.readingTimeMin || 3} min baca</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Category list — col-span-5 */}
      <div className="flex flex-col gap-0 divide-y divide-black/5 dark:divide-white/5 md:col-span-5">
        {categoryArticles.map((article) => (
          <Link
            key={article.id}
            href={`/${site}/artikel/${article.slug}`}
            className="group flex items-start gap-3 py-3 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">
                {article.categories?.[0]?.category?.name || ''}
              </span>
              <h3 className="line-clamp-2 font-sans text-sm font-bold leading-snug text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                {article.title}
              </h3>
              <div className="mt-1 text-[10px] text-brand-text-muted">
                {article.author?.name || 'Redaksi'} · {article.readingTimeMin || 3} min
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
