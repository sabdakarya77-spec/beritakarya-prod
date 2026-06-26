'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

// ─── In-Feed Showcase ────────────────────────────────────────────────────────
// Fallback untuk slot in-feed saat tidak ada iklan yang aktif.
// Tampil sebagai native content card yang menyatu dengan artikel.

interface InFeedAd {
  id: string;
  headline: string;
  subheadline: string;
  category: string;
  accentFrom: string;
  accentTo: string;
  icon: React.ReactNode;
}

const IN_FEED_ADS: InFeedAd[] = [
  {
    id: 'infeed-content',
    headline: 'Jangkau Pembaca Tepat Sasaran',
    subheadline: 'Iklan konten native tampil alami di antara artikel, meningkatkan engagement tanpa mengganggu.',
    category: 'Iklan Native',
    accentFrom: 'from-sky-500',
    accentTo: 'to-cyan-700',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-15">
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
    headline: 'Promosikan Bisnis Anda',
    subheadline: 'Tampilkan produk atau layanan Anda langsung di tengah konten yang dibaca audiens.',
    category: 'Promosi Bisnis',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-700',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-15">
        <path d="M32 8l20 12v16c0 12-8 20-20 24-12-4-20-12-20-24V20L32 8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 32l6 6 12-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'infeed-brand',
    headline: 'Bangun Brand Awareness',
    subheadline: 'Posisikan brand Anda di antara konten berkualitas untuk kesan profesional dan terpercaya.',
    category: 'Branding',
    accentFrom: 'from-violet-500',
    accentTo: 'to-purple-700',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-15">
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
    }, 6000);
  }, [stopRotation, totalSlides]);

  useEffect(() => {
    if (!isPaused) startRotation();
    return stopRotation;
  }, [isPaused, startRotation, stopRotation]);

  const ad = IN_FEED_ADS[currentIndex];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 dark:from-white/[0.03] dark:to-white/[0.06] border border-gray-100 dark:border-white/5 rounded-xl px-5 py-4">
        {/* Badge */}
        <span className="inline-block rounded-sm bg-black/[0.06] dark:bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-brand-text-muted mb-3">
          Iklan
        </span>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-[9px] font-bold uppercase tracking-[0.2em] mb-1 transition-colors duration-500",
              `bg-gradient-to-r ${ad.accentFrom} ${ad.accentTo} bg-clip-text text-transparent`
            )}>
              {ad.category}
            </p>
            <h4 className="text-sm md:text-base font-black text-brand-black dark:text-white tracking-tight leading-tight mb-1 transition-all duration-500">
              {ad.headline}
            </h4>
            <p className="text-[11px] md:text-xs text-brand-text-muted leading-relaxed transition-all duration-500">
              {ad.subheadline}
            </p>
          </div>

          {/* Decorative icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 md:w-16 md:h-16 text-brand-text-muted transition-all duration-500"
          )}>
            {ad.icon}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3 flex items-center justify-between">
          <Link
            href="https://beritakarya.co/pusat/p/ads"
            className="text-[10px] md:text-[11px] font-bold text-brand-red hover:text-brand-red/80 transition-colors"
          >
            Pelajari Selengkapnya →
          </Link>

          {/* Dots */}
          <div className="flex gap-1">
            {IN_FEED_ADS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-3 h-1 bg-brand-red"
                    : "w-1 h-1 bg-gray-300 dark:bg-white/20 hover:bg-gray-400"
                )}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
