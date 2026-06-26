'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

// ─── Category Example Ads ────────────────────────────────────────────────────
// Contoh iklan kategori yang tampil saat slot leaderboard kosong.
// Tujuan: menunjukkan visualisasi billboard kepada calon advertiser.

interface CategoryAd {
  id: string;
  headline: string;
  subheadline: string;
  category: string;
  accentFrom: string;
  accentTo: string;
  ctaText: string;
  icon: React.ReactNode;
  /** Optional media type for the fallback showcase. */
  mediaType?: 'image' | 'video';
  /** URL to image or video when mediaType is defined. */
  mediaUrl?: string;
}

const CATEGORY_ADS: CategoryAd[] = [
  {
    id: 'fnb',
    headline: 'Nikmati Kopi Nusantara',
    subheadline: 'Beriklan di BeritaKarya — Jangkau ribuan pembaca lokal setiap hari',
    category: 'Kuliner & F&B',
    accentFrom: 'from-amber-600',
    accentTo: 'to-orange-800',
    ctaText: 'Kopi & Makanan',
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full opacity-20">
        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" />
        <path d="M28 50c0-8 5-14 12-14s12 6 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 38c4 0 8 2 8 6s-4 6-8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 28c0-4 2-6 4-6s4 2 4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M32 30c0-3 1.5-5 3-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'tech',
    headline: 'Upgrade Produktivitas Anda',
    subheadline: 'Promosikan produk tech Anda di platform berita terpercaya',
    category: 'Teknologi',
    accentFrom: 'from-blue-600',
    accentTo: 'to-indigo-800',
    ctaText: 'Gadget & Software',
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full opacity-20">
        <rect x="16" y="20" width="48" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M28 52h24v4a2 2 0 01-2 2H30a2 2 0 01-2-2v-4z" stroke="currentColor" strokeWidth="2" />
        <circle cx="40" cy="36" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M37 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'edu',
    headline: 'Belajar Tanpa Batas',
    subheadline: 'Tampilkan kursus atau program Anda di depan audiens yang tepat',
    category: 'Edukasi',
    accentFrom: 'from-violet-600',
    accentTo: 'to-purple-800',
    ctaText: 'Kursus & Pelatihan',
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full opacity-20">
        <path d="M40 20l20 10-20 10-20-10 20-10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 32v12c0 4 7 8 16 8s16-4 16-8V32" stroke="currentColor" strokeWidth="2" />
        <path d="M60 30v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="46" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'umkm',
    headline: 'Dukung Produk Indonesia',
    subheadline: 'Beriklan di BeritaKarya — media untuk Indonesia',
    category: 'UMKM & Lokal',
    accentFrom: 'from-emerald-600',
    accentTo: 'to-green-800',
    ctaText: 'Produk Lokal',
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full opacity-20">
        <path d="M40 22l16 8v14c0 10-7 16-16 20-9-4-16-10-16-20V30l16-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M30 40l6 6 12-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // Video demo ad – demonstrates that the fallback can show a video banner
  {
    id: 'video_demo',
    headline: 'Video Demo Billboard',
    subheadline: 'Contoh iklan video pada slot leaderboard',
    category: 'Demo Video',
    accentFrom: 'from-pink-600',
    accentTo: 'to-rose-800',
    ctaText: 'Lihat Demo',
    icon: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full opacity-20">
        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" />
        <path d="M30 35h20v10H30z" fill="currentColor" />
      </svg>
    ),
    mediaType: 'video',
    mediaUrl: '/videos/leaderboard-demo.mp4',
  },
];

// ─── BillboardShowcase Component ─────────────────────────────────────────────

interface BillboardShowcaseProps {
  site: string;
  className?: string;
}

export default function BillboardShowcase({ site, className }: BillboardShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSlides = CATEGORY_ADS.length;

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
    }, 8000);
  }, [stopRotation, totalSlides]);

  useEffect(() => {
    if (!isPaused) startRotation();
    return stopRotation;
  }, [isPaused, startRotation, stopRotation]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    // Reset timer on manual navigation
    stopRotation();
    if (!isPaused) startRotation();
  };

  return (
    <div
      className={cn(
        "relative w-full h-24 md:h-[250px] overflow-hidden rounded-xl",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {CATEGORY_ADS.map((ad, index) => (
        <div
          key={ad.id}
          className={cn(
            "absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            index === currentIndex
              ? "translate-x-0 z-10"
              : index < currentIndex
                ? "-translate-x-full z-0"
                : "translate-x-full z-0"
          )}
        >
          {/* Background gradient */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r",
            ad.accentFrom,
            ad.accentTo,
            "transition-transform duration-[8000ms] ease-out",
            index === currentIndex ? "scale-100" : "scale-110"
          )} />

          {/* Decorative icon */}
          <div className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 w-16 h-16 md:w-32 md:h-32 text-white pointer-events-none">
            {ad.icon}
          </div>

          {/* Media handling – show video when defined */}
          {ad.mediaType === 'video' && ad.mediaUrl ? (
            <video
              src={ad.mediaUrl}
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-4 md:px-10 max-w-container mx-auto">
            {/* Badge — kiri atas */}
            <span className="absolute left-3 md:left-6 top-2 md:top-4 z-20 rounded-sm bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.14em] text-white/90">
              Iklan
            </span>

            {/* Text */}
            <div className="ml-0 md:ml-0">
              <p className="text-[9px] md:text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-0.5 md:mb-1">
                {ad.category}
              </p>
              <h3 className="text-sm md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                {ad.headline}
              </h3>
              <p className="text-[9px] md:text-sm text-white/70 mt-0.5 md:mt-2 max-w-md hidden sm:block">
                {ad.subheadline}
              </p>
            </div>

            {/* CTA — kanan bawah */}
            <Link
              href="https://beritakarya.co/pusat/p/adss"
              className="absolute right-3 md:right-6 bottom-2 md:bottom-4 z-20 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-[9px] md:text-xs font-semibold px-2.5 md:px-4 py-1 md:py-1.5 rounded-full transition-colors"
            >
              Pasang Iklan Anda →
            </Link>
          </div>
        </div>
      ))}

      {/* Dot indicators */}
      <div className="absolute bottom-1.5 md:bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 md:gap-1.5">
        {CATEGORY_ADS.map((ad, index) => (
          <button
            key={ad.id}
            onClick={() => goToSlide(index)}
            className={cn(
              "rounded-full transition-all duration-300",
              index === currentIndex
                ? "w-4 md:w-6 h-1 md:h-1.5 bg-white"
                : "w-1 md:w-1.5 h-1 md:h-1.5 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Lihat contoh ${ad.category}`}
          />
        ))}
      </div>
    </div>
  );
}
