'use client'

/**
 * Bento4Hero — Template A (Classic Editorial)
 *
 * Layout: gambar utama besar di kiri + 4 headline di kanan.
 * Auto-rotate 5 detik pada gambar utama.
 *
 * TODO: Implementasi penuh sesuai design-grid.md Design A
 */

import Link from 'next/link'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface Bento4HeroProps {
  articles: HomeArticle[]
  site: string
}

export function Bento4Hero({ articles, site }: Bento4HeroProps) {
  if (articles.length === 0) return null

  const main = articles[0]
  const headlines = articles.slice(1, 5)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      {/* Main image — col-span-8 */}
      <div className="md:col-span-8">
        <Link href={`/${site}/artikel/${main.slug}`} className="group block">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-900">
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
              <span className="mb-2 inline-block rounded-full bg-brand-red/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                {main.categories?.[0]?.category?.name || 'Berita Utama'}
              </span>
              <h2 className="mb-2 max-w-2xl font-sans text-xl font-extrabold leading-tight text-white md:text-2xl lg:text-3xl">
                {main.title}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <span className="font-semibold text-white/80">{main.author?.name || 'Redaksi'}</span>
                <span className="opacity-40">·</span>
                <span>{main.readingTimeMin || 3} min baca</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Headlines — col-span-4 */}
      <div className="flex flex-col gap-3 md:col-span-4">
        {headlines.map((article, index) => (
          <Link
            key={article.id}
            href={`/${site}/artikel/${article.slug}`}
            className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-brand-red/20 hover:shadow-md dark:border-white/5 dark:bg-white/[0.02]"
          >
            <span className="flex-shrink-0 font-sans text-2xl font-black leading-none text-gray-100 dark:text-white/10">
              {(index + 1).toString().padStart(2, '0')}
            </span>
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
