/**
 * Ticker — Template C (Data-Driven)
 *
 * Ticker berjalan di atas hero, menampilkan judul artikel trending.
 * Menggunakan marquee animation (CSS keyframe) seperti BreakingNewsTicker.
 * Mendukung prefers-reduced-motion.
 */

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { usePrefersReducedMotion } from '../../../../hooks/useReducedMotion'
import type { HomeArticle } from '../utils/distribution'

interface TickerProps {
  articles: HomeArticle[]
  site: string
}

export function Ticker({ articles, site }: TickerProps) {
  const shouldReduceMotion = usePrefersReducedMotion()

  if (articles.length === 0) return null

  const tickerContent = (
    <>
      {articles.slice(0, 8).map((article) => (
        <Link
          key={article.id}
          href={`/${site}/artikel/${article.slug}`}
          className="group flex shrink-0 items-center gap-3"
        >
          <span className="cursor-pointer text-[11px] font-bold tracking-tight text-brand-black transition-colors hover:text-brand-red dark:text-white/90 dark:hover:text-brand-red">
            {article.title}
          </span>
          <span className="h-1 w-1 rounded-full bg-brand-red/40" />
        </Link>
      ))}
    </>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-brand-red/20 bg-brand-red/5">
      <div className="flex h-10 items-center">
        {/* Label */}
        <div className="flex shrink-0 items-center gap-1.5 border-r border-brand-red/15 px-3.5">
          <TrendingUp size={12} className="text-brand-red" />
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">Trending</span>
        </div>

        {/* Marquee area */}
        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-brand-red/5 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-brand-red/5 to-transparent" />

          {shouldReduceMotion ? (
            // Static fallback — no animation
            <div className="flex h-full min-w-max items-center gap-5 whitespace-nowrap px-4">
              {tickerContent}
            </div>
          ) : (
            // Marquee animation
            <div
              className="flex min-w-max items-center gap-5 whitespace-nowrap pl-4 pr-3 will-change-transform animate-[ticker_35s_linear_infinite] hover:[animation-play-state:paused]"
            >
              {tickerContent}
              {/* Duplicate for seamless loop */}
              {articles.slice(0, 8).map((article) => (
                <Link
                  key={`dup-${article.id}`}
                  href={`/${site}/artikel/${article.slug}`}
                  className="group flex shrink-0 items-center gap-3"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <span className="cursor-pointer text-[11px] font-bold tracking-tight text-brand-black transition-colors hover:text-brand-red dark:text-white/90 dark:hover:text-brand-red">
                    {article.title}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-brand-red/40" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
