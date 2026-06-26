'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

// ─── Rectangle Showcase ──────────────────────────────────────────────────────
// Fallback untuk slot rectangle utama di sidebar artikel.
// Tampil sebagai card vertikal dengan gradient dan ikon.

interface RectangleAd {
  id: string;
  headline: string;
  subheadline: string;
  category: string;
  accentFrom: string;
  accentTo: string;
  ctaText: string;
  icon: React.ReactNode;
}

const RECTANGLE_ADS: RectangleAd[] = [
  {
    id: 'rect-fnb',
    headline: 'Kuliner Nusantara',
    subheadline: 'Jangkau ribuan pembaca lokal yang mencari rekomendasi kuliner terbaik.',
    category: 'Kuliner & F&B',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-700',
    ctaText: 'Pasang Iklan',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-20">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
        <path d="M22 40c0-6 4-11 10-11s10 5 10 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 30c3 0 6 2 6 5s-3 5-6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M29 22c0-3 1.5-5 3-5s3 2 3 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'rect-tech',
    headline: 'Produk Teknologi',
    subheadline: 'Promosikan gadget, software, dan layanan digital Anda.',
    category: 'Teknologi',
    accentFrom: 'from-blue-500',
    accentTo: 'to-indigo-700',
    ctaText: 'Mulai Beriklan',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-20">
        <rect x="12" y="16" width="40" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M22 42h20v3a2 2 0 01-2 2H24a2 2 0 01-2-2v-3z" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="29" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M29 29l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'rect-umkm',
    headline: 'Produk Lokal',
    subheadline: 'Dukung dan promosikan produk UMKM Indonesia.',
    category: 'UMKM & Lokal',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-green-700',
    ctaText: 'Promosikan',
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full opacity-20">
        <path d="M32 16l14 7v12c0 8-6 13-14 16-8-3-14-8-14-16V23l14-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 32l5 5 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

interface RectangleShowcaseProps {
  site: string;
  className?: string;
}

export default function RectangleShowcase({ site: _site, className }: RectangleShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = RECTANGLE_ADS.length;

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
      {RECTANGLE_ADS.map((ad, index) => (
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
          <div className="absolute right-3 bottom-3 w-20 h-20 text-white pointer-events-none">
            {ad.icon}
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-5">
            {/* Badge */}
            <span className="self-start rounded-sm bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/90">
              Iklan
            </span>

            {/* Text */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">
                {ad.category}
              </p>
              <h4 className="text-lg font-black text-white tracking-tight leading-tight mb-1.5">
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
                {RECTANGLE_ADS.map((_, i) => (
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
      ))}
    </div>
  );
}