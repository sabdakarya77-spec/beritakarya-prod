'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import { cn } from '../../lib/utils';
import { getCategoryColor } from '../../lib/constants';

type HeroArticle = {
  id: string | number;
  title: string;
  slug?: string;
  featuredImage?: string | null;
  featuredImageBlur?: string | null;
  featuredImageColor?: string | null;
  category?: { name?: string | null } | null;
  blocks?: Array<{ type?: string; url?: string; width?: number; height?: number }>;
};

const getImageUrl = (article: HeroArticle) =>
  article.featuredImage || (Array.isArray(article.blocks) ? article.blocks : []).find((block) => block.type === 'image')?.url || '/placeholder.jpg';

const getPrimaryImageBlock = (article: HeroArticle) => {
  const imageUrl = getImageUrl(article);

  return (
    (Array.isArray(article.blocks) ? article.blocks : []).find((block) => block.type === 'image' && block.url === imageUrl) ||
    (Array.isArray(article.blocks) ? article.blocks : []).find((block) => block.type === 'image')
  );
};

const getHeroImagePosition = (article: HeroArticle, variant: 'lead' | 'side') => {
  const imageBlock = getPrimaryImageBlock(article);
  const width = imageBlock?.width;
  const height = imageBlock?.height;

  if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
    const ratio = width / height;

    if (ratio < 0.9) {
      return variant === 'lead' ? '50% 20%' : '50% 16%';
    }

    if (ratio < 1.2) {
      return variant === 'lead' ? '50% 23%' : '50% 20%';
    }

    if (ratio > 1.8) {
      return variant === 'lead' ? '50% 30%' : '50% 26%';
    }
  }

  return variant === 'lead' ? '50% 26%' : '50% 22%';
};

export function MagazineBentoHero({ articles, site }: { articles: HeroArticle[], site: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerTrigger, setTimerTrigger] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const heroArticles = articles?.slice(0, 4) || [];

  // Interval otomatis berganti slide setiap 5 detik, berhenti saat user hover
  useEffect(() => {
    if (heroArticles.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroArticles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [timerTrigger, heroArticles.length, isPaused]);

  if (!articles || articles.length === 0) return null;

  const currentArticle = heroArticles[activeIndex] || heroArticles[0];

  const handleNavClick = (idx: number) => {
    setActiveIndex(idx);
    setTimerTrigger((prev) => prev + 1); // Mereset interval timer ke 0
  };

  return (
    <section
      className="relative mb-6 w-full md:mb-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-brand-red/5 dark:bg-brand-red/10 blur-[80px] -z-10 rounded-full" />
      
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 h-auto lg:h-[350px] xl:h-[380px]">
        
        {/* Kiri: Slider Gambar Utama */}
        <div className="relative overflow-hidden rounded-2xl lg:col-span-8 h-[220px] sm:h-[280px] md:h-[320px] lg:h-full w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <Link href={`/${site}/artikel/${currentArticle.slug}`} className="relative block w-full h-full group">
                <SmartImage 
                  src={getImageUrl(currentArticle)} 
                  blur={currentArticle.featuredImageBlur}
                  dominantColor={currentArticle.featuredImageColor}
                  context="hero_lead"
                  alt={currentArticle.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  style={{ objectPosition: getHeroImagePosition(currentArticle, 'lead') }}
                  priority
                />
                
                {/* Gradient overlay gelap agar judul mudah terbaca */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent min-h-[50%]" />
                
                {/* Overlay Konten Teks */}
                <div className="absolute bottom-0 left-0 w-full p-5 sm:p-7 md:p-8 lg:p-10">
                  <div className="mb-2.5 sm:mb-3">
                    <span className={cn("px-2.5 py-1 text-[10px] sm:text-[10px] font-black uppercase tracking-[0.14em] rounded-sm shadow-sm", getCategoryColor(currentArticle.category?.name ?? undefined))}>
                      {currentArticle.category?.name || 'Headline'}
                    </span>
                  </div>
                  
                  <h1 className="line-clamp-2 max-w-[22ch] text-balance font-sans text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold leading-[1.2] tracking-tight text-white transition-colors group-hover:text-white/90">
                    {currentArticle.title}
                  </h1>
                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Kanan: Navigasi Menu Vertikal (Hanya tampil di Desktop) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-3 h-full justify-between rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-3">
          {heroArticles.map((article, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={article.id}
                onClick={() => handleNavClick(idx)}
                className={cn(
                  "relative w-full text-left rounded-xl p-3.5 border transition-all duration-300 flex-1 flex flex-col justify-center min-h-0",
                  isActive
                    ? "bg-white dark:bg-white/[0.04] border-l-4 border-l-brand-red border-y-slate-200 dark:border-y-white/5 border-r-slate-200 dark:border-r-white/5 shadow-md shadow-black/10"
                    : "bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-white/[0.02]"
                )}
              >
                {/* Label Kategori */}
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] xl:text-[10px] font-extrabold uppercase tracking-widest",
                    isActive ? "text-brand-red" : "text-slate-400 dark:text-brand-text-muted"
                  )}>
                    {article.category?.name || 'Headline'}
                  </span>
                  
                  {/* Indikator Progres Aktif Mini */}
                  {isActive && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-brand-red animate-ping" />
                  )}
                </div>

                {/* Judul Berita Pendek */}
                <h3 className={cn(
                  "line-clamp-2 font-sans text-[0.78rem] xl:text-[0.82rem] leading-[1.25] tracking-tight font-bold transition-colors",
                  isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/80"
                )}>
                  {article.title}
                </h3>
              </button>
            );
          })}
        </div>

      </div>

      {/* Indikator Slider dots (Hanya tampil di Mobile/Tablet) */}
      {heroArticles.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3 lg:hidden">
          {heroArticles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleNavClick(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === activeIndex 
                  ? "w-6 bg-brand-red" 
                  : "w-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
