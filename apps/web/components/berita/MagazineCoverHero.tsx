'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import { cn } from '../../lib/utils';

type HeroArticle = {
  id: string | number;
  title: string;
  slug?: string;
  excerpt?: string;
  featuredImage?: string | null;
  featuredImageBlur?: string | null;
  featuredImageColor?: string | null;
  readingTimeMin?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  author?: { name?: string | null } | null;
  category?: { name?: string | null } | null;
  categories?: Array<{ category?: { name?: string | null } | null }> | null;
  blocks?: Array<{ type?: string; url?: string }>;
};

const getImageUrl = (article: HeroArticle) =>
  article.featuredImage ||
  (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'image')?.url ||
  '/placeholder.jpg';

const getCategoryName = (article: HeroArticle) =>
  article.categories?.[0]?.category?.name || article.category?.name || 'Berita Utama';

const ROTATE_INTERVAL_MS = 5000;

interface MagazineCoverHeroProps {
  articles: HeroArticle[];
  site: string;
}

export function MagazineCoverHero({ articles, site }: MagazineCoverHeroProps) {
  const heroArticles = articles.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToNext = useCallback(() => {
    if (heroArticles.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(prev => (prev + 1) % heroArticles.length);
      setIsTransitioning(false);
    }, 200);
  }, [heroArticles.length]);

  const goToIndex = useCallback((index: number) => {
    if (index === activeIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 200);
  }, [activeIndex]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || heroArticles.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(goToNext, ROTATE_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, heroArticles.length, goToNext]);

  if (heroArticles.length === 0) return null;

  const active = heroArticles[activeIndex];
  const imageUrl = getImageUrl(active);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Hero Image — 550px desktop, 350px mobile */}
      <div className="relative h-[350px] overflow-hidden rounded-2xl sm:h-[400px] md:h-[450px] lg:h-[550px]">
        {/* Background Image */}
        <SmartImage
          src={imageUrl}
          context="hero_lead"
          alt={active.title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px"
          className={cn(
            'object-cover transition-all duration-500',
            isTransitioning ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100'
          )}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content Overlay */}
        <div className={cn(
          'absolute bottom-0 left-0 z-10 w-full p-5 md:p-8 lg:p-10 transition-all duration-500',
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        )}>
          {/* Category Badge */}
          <span className="mb-2 inline-block rounded-full bg-brand-red/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
            {getCategoryName(active)}
          </span>

          {/* Title */}
          <Link href={`/${site}/artikel/${active.slug}`}>
            <h1 className="mb-3 max-w-3xl font-sans text-xl font-extrabold leading-tight tracking-tight text-white transition-colors hover:text-white/85 md:text-2xl lg:text-3xl xl:text-4xl">
              {active.title}
            </h1>
          </Link>

          {/* Excerpt */}
          {active.excerpt && (
            <p className="mb-3 max-w-2xl line-clamp-2 text-sm leading-relaxed text-white/70 md:text-base">
              {active.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span className="font-semibold text-white/80">{active.author?.name || 'Redaksi'}</span>
            <span className="opacity-40">·</span>
            <span>{active.readingTimeMin || 3} min baca</span>
          </div>
        </div>

        {/* Progress bar — visual indicator auto-rotate */}
        {heroArticles.length > 1 && !isPaused && (
          <div className="absolute bottom-0 left-0 z-20 h-0.5 w-full bg-white/10">
            <div
              className="h-full bg-brand-red transition-all ease-linear"
              style={{ width: '100%', animation: `shrink ${ROTATE_INTERVAL_MS}ms linear` }}
            />
          </div>
        )}
      </div>

      {/* Thumbnail Bar — klik untuk ganti artikel utama */}
      {heroArticles.length > 1 && (
        <div className="mt-3 flex gap-2 md:gap-3">
          {heroArticles.map((article, index) => {
            const thumbUrl = getImageUrl(article);
            const isActive = index === activeIndex;

            return (
              <button
                key={article.id}
                onClick={() => goToIndex(index)}
                className={cn(
                  'group relative h-14 flex-1 overflow-hidden rounded-xl transition-all duration-300 md:h-16 lg:h-20',
                  isActive
                    ? 'ring-2 ring-brand-red ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    : 'opacity-60 hover:opacity-100'
                )}
                aria-label={`Pilih artikel: ${article.title}`}
              >
                <SmartImage
                  src={thumbUrl}
                  context="gallery_thumb"
                  alt={article.title}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
                {/* Active indicator overlay */}
                {isActive && (
                  <div className="absolute inset-0 border-2 border-brand-red rounded-xl" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* CSS animation untuk progress bar */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
