'use client';

import Link from 'next/link';
import { cn } from '../../lib/utils';

// ─── Secondary Rectangle Showcase ────────────────────────────────────────────
// Fallback untuk slot rectangle sekunder di sidebar artikel.
// Tampil sebagai kartu editorial / newsletter-style yang lebih ringan.

interface SecondaryRectangleShowcaseProps {
  site: string;
  className?: string;
}

export default function SecondaryRectangleShowcase({ site, className }: SecondaryRectangleShowcaseProps) {
  return (
    <div
      className={cn(
        "relative w-full h-[250px] min-h-[250px] overflow-hidden rounded-xl border border-gray-100 dark:border-white/5 bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.03] dark:to-white/[0.06]",
        className
      )}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
          <pattern id="grid-secondary" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
          <rect width="200" height="200" fill="url(#grid-secondary)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-5">
        {/* Badge */}
        <span className="self-start rounded-sm bg-brand-red/10 text-brand-red px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]">
          Sponsor
        </span>

        {/* Main content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-10 h-10 mb-3 text-brand-text-muted">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M6 18l18 10 18-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h4 className="text-base font-black text-brand-black dark:text-white tracking-tight mb-1">
            Ikuti Berita Terbaru
          </h4>
          <p className="text-[11px] text-brand-text-muted leading-relaxed max-w-[200px]">
            Dapatkan informasi terkini langsung dari sumber terpercaya.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href={`/${site}/ads`}
            className="w-full text-center bg-brand-black dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/15 text-white text-[11px] font-bold py-2 rounded-lg transition-colors"
          >
            Pelajari Lebih Lanjut
          </Link>
          <span className="text-[9px] text-brand-text-muted">
            Beriklan di BeritaKarya
          </span>
        </div>
      </div>
    </div>
  );
}
