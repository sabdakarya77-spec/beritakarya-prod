'use client';

import { useState, useEffect } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useReducedMotion';

interface BreakingNewsTickerProps {
  news?: string[];
}

export default function BreakingNewsTicker({
  news: initialNews = [
    "Sri Mulyani Paparkan Strategi Fiskal 2026 di Hadapan DPR",
    "Rupiah Menguat ke Level Rp 15.200 per Dolar AS Pagi Ini",
    "Timnas Indonesia Siap Hadapi Laga Krusial di Kualifikasi Piala Dunia",
    "Pemerintah Resmi Luncurkan Program Insentif Kendaraan Listrik Tahap II"
  ]
}: BreakingNewsTickerProps) {
  const [tickerNews, setTickerNews] = useState<string[]>(initialNews);
  const shouldReduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    async function fetchBreakingNews() {
      try {
        const res = await fetch('/api/breaking-news');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setTickerNews(json.data);
          }
        }
      } catch (err) {
        console.error('Gagal memuat breaking news dari API:', err);
      }
    }
    fetchBreakingNews();
  }, []);

  const tickerContent = (
    <>
      {tickerNews.map((item, i) => (
        <div key={i} className="flex items-center gap-5 sm:gap-7 lg:gap-10">
          <span className="cursor-pointer text-[10px] font-medium tracking-tight text-white/90 transition-colors hover:text-brand-red sm:text-[11px] lg:text-[12px]">
            {item}
          </span>
          <span className="h-1 w-1 rounded-full bg-brand-red sm:h-1 sm:w-1 lg:h-1.5 lg:w-1.5" />
        </div>
      ))}
    </>
  )

  return (
    <div className="flex h-8 max-w-full items-center overflow-hidden text-white sm:h-9 lg:h-10">
      <div className="flex items-center gap-1.5 shrink-0 px-2 sm:px-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-red">TERKINI</span>
      </div>
      <div className="relative flex h-full min-w-0 flex-1 items-center overflow-hidden group">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-6 bg-gradient-to-r from-brand-black to-transparent sm:w-10 lg:w-14 dark:from-brand-dark" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-6 bg-gradient-to-l from-brand-black to-transparent sm:w-10 lg:w-14 dark:from-brand-dark" />

        {shouldReduceMotion ? (
          <div className="flex h-full min-w-max items-center gap-5 whitespace-nowrap px-6 sm:gap-7 sm:px-10 lg:gap-10 lg:px-14">
            {tickerContent}
          </div>
        ) : (
          <div
            className="absolute inset-y-0 left-0 flex h-full min-w-max items-center gap-5 whitespace-nowrap pl-6 pr-3 will-change-transform sm:gap-7 sm:pl-10 sm:pr-4 lg:gap-10 lg:pl-14 lg:pr-5 animate-[ticker_40s_linear_infinite] hover:[animation-play-state:paused]"
          >
            {tickerContent}
            {tickerNews.map((item, i) => (
              <div key={`dup-${i}`} aria-hidden="true" className="flex items-center gap-5 sm:gap-7 lg:gap-10">
                <span className="cursor-pointer text-[10px] font-medium tracking-tight text-white/90 transition-colors hover:text-brand-red sm:text-[11px] lg:text-[12px]">
                  {item}
                </span>
                <span className="h-1 w-1 rounded-full bg-brand-red sm:h-1 sm:w-1 lg:h-1.5 lg:w-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
