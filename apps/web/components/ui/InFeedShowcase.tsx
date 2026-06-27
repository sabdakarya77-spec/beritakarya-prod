'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

// ─── In-Feed Showcase ────────────────────────────────────────────────────────
// Fallback untuk slot feed (HOME_FEED_1, HOME_FEED_2, ARTICLE_MIDDLE) saat tidak ada iklan yang aktif.
// Gaya visual compact dengan gradient + icon, konsisten dengan showcase lain.

interface InFeedAd {
  id: string;
  headline: string;
  subheadline: string;
  category: string;
  accentFrom: string;
  accentTo: string;
  ctaText: string;
  icon: React.ReactNode;
}

const IN_FEED_ADS: InFeedAd[] = [
  {
    id: 'infeed-native',
    headline: 'Iklan Native',
    subheadline: 'Tampil alami di antara konten, tanpa mengganggu pengalaman baca.',
    category: 'Konten Native',
    accentFrom: 'from-sky-500',
    accentTo: 'to-cyan-700',
    ctaText: 'Pelajari',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-20">
        <rect x="8" y="12" width="48" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="8" y="24" width="32" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="32" width="40" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="40" width="28" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="8" y="48" width="36" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'infeed-promo',
    headline: 'Promosikan Bisnis',
    subheadline: 'Tampilkan produk langsung di tengah konten yang dibaca audiens.',
    category: 'Promosi',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-700',
    ctaText: 'Mulai',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-20">
        <path d="M32 8l20 12v16c0 12-8 20-20 24-12-4-20-12-20-24V20L32 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 32l6 6 12-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'infeed-brand',
    headline: 'Bangun Brand',
    subheadline: 'Posisikan brand di antara konten berkualitas untuk kesan profesional.',
    category: 'Branding',
    accentFrom: 'from-violet-500',
    accentTo: 'to-purple-700',
    ctaText: 'Eksplor',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-20">
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2" />
        <path d="M20 32h24M32 20v24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

interface InFeedShowcaseProps {
  site: string;
  className?: string;
}

export default function InFeedShowcase({ site: _site, className }: InFeedShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = IN_FEED_ADS.length;

  const stopRotation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRotation = useCallback(() => {
    stopRotation();
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalSlides);
    }, 7000);
  }, [stopRotation, totalSlides]);

  useEffect(() => {
    if (!isPaused) startRotation();
    return stopRotation;
  }, [isPaused, startRotation, stopRotation]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    stopRotation();
    if (!isPaused) startRotation();
  };

  return (
    <div
      className={cn(
        "relative w-full h-[100px] min-h-[100px] md:h-[250px] md:min-h-[250px] overflow-hidden rounded-xl",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {IN_FEED_ADS.map((ad, index) => (
        <div
          key={ad.id}
          className={cn(
            "absolute inset-0 transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            index === currentIndex
              ? "opacity-100 z-10"
              : "opacity-0 z-0"
          )}
        >
          {/* Background gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            ad.accentFrom,
            ad.accentTo,
            "transition-transform duration-[7000ms] ease-out",
            index === currentIndex ? "scale-100" : "scale-110"
          )} />

          {/* Decorative icon */}
          <div className="absolute right-3 bottom-3 w-16 h-16 md:w-20 md:h-20 text-white pointer-events-none">
            {ad.icon}
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-5">
            {/* Mobile: Badge + CTA side by side */}
            <div className="flex items-center justify-between sm:hidden">
              <span className="rounded-sm bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/90">
                Iklan
              </span>
              <Link
                href="https://beritakarya.co/pusat/p/ads"
                className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-[9px] font-bold px-2.5 py-1 rounded-full transition-colors"
              >
                {ad.ctaText} →
              </Link>
            </div>

            {/* Mobile: headline only */}
            <div className="sm:hidden">
              <h4 className="text-sm font-black text-white tracking-tight leading-tight">
                {ad.headline}
              </h4>
            </div>

            {/* Desktop: full layout */}
            <div className="hidden sm:flex sm:flex-col sm:justify-between sm:h-full">
              {/* Badge */}
              <span className="self-start rounded-sm bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/90">
                Iklan
              </span>

              {/* Text */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
                  {ad.category}
                </p>
                <h4 className="text-lg font-black text-white tracking-tight leading-tight mb-1">
                  {ad.headline}
                </h4>
                <p className="text-[11px] text-white/60 leading-relaxed max-w-[200px]">
                  {ad.subheadline}
                </p>
              </div>

              {/* CTA + Dots */}
              <div className="flex items-center justify-between">
                <Link
                  href="https://beritakarya.co/pusat/p/ads"
                  className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors"
                >
                  {ad.ctaText} →
                </Link>
                <div className="flex gap-1">
                  {IN_FEED_ADS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        i === currentIndex
                          ? "w-3 h-1 bg-white"
                          : "w-1 h-1 bg-white/30 hover:bg-white/50"
                      )}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
