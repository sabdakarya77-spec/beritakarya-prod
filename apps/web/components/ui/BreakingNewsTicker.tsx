'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Circle } from 'lucide-react';
import Link from 'next/link';
import { usePrefersReducedMotion } from '../../hooks/useReducedMotion';
import { API_URL } from '../../lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketIndicator {
  value: number;
  change: number;
  changePct: number;
  up: boolean;
}

interface MarketSnapshot {
  ihsg: MarketIndicator | null;
  usdIdr: MarketIndicator | null;
  sgdIdr: MarketIndicator | null;
  gold: MarketIndicator | null;
  updatedAt: string;
}

interface TickerArticle {
  id: string;
  title: string;
  slug: string;
}

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

// ─── Market Config ──────────────────────────────────────────────────────────

interface MarketItem {
  label: string;
  key: keyof Omit<MarketSnapshot, 'updatedAt'>;
  formatter: (n: number) => string;
}

const MARKET_ITEMS: MarketItem[] = [
  { label: 'IHSG', key: 'ihsg', formatter: (n) => formatNumber(n, 2) },
  { label: 'USD/IDR', key: 'usdIdr', formatter: (n) => formatNumber(n, 0) },
  { label: 'Emas', key: 'gold', formatter: (n) => `Rp ${formatNumber(n, 0)}` },
  { label: 'SGD/IDR', key: 'sgdIdr', formatter: (n) => formatNumber(n, 0) },
];

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// ─── Main Component ─────────────────────────────────────────────────────────

interface BreakingNewsTickerProps {
  site?: string;
  news?: string[];
}

export default function BreakingNewsTicker({
  site = 'pusat',
  news: initialNews = [
    "Sri Mulyani Paparkan Strategi Fiskal 2026 di Hadapan DPR",
    "Rupiah Menguat ke Level Rp 15.200 per Dolar AS Pagi Ini",
    "Timnas Indonesia Siap Hadapi Laga Krusial di Kualifikasi Piala Dunia",
    "Pemerintah Resmi Luncurkan Program Insentif Kendaraan Listrik Tahap II"
  ]
}: BreakingNewsTickerProps) {
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [articles, setArticles] = useState<TickerArticle[]>([]);
  const [antaraNews, setAntaraNews] = useState<string[]>(initialNews);
  const shouldReduceMotion = usePrefersReducedMotion();

  async function fetchMarket() {
    try {
      const res = await fetch(`${API_URL}/api/v1/market/snapshot`);
      if (!res.ok) return;
      const json = await res.json();
      if (json?.data) setMarket(json.data);
    } catch {
      // silent
    }
  }

  async function fetchLatest() {
    try {
      const res = await fetch(`${API_URL}/api/v1/articles/public?site=${site}&limit=5&sort=publishedAt&order=desc`);
      if (!res.ok) return;
      const json = await res.json();
      const items = json?.data?.articles || json?.data?.items || [];
      setArticles(items.slice(0, 5));
    } catch {
      // silent
    }
  }

  async function fetchAntara() {
    try {
      const res = await fetch('/api/breaking-news');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setAntaraNews(json.data.slice(0, 5));
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchMarket();
    fetchLatest();
    fetchAntara();
    const marketInterval = setInterval(fetchMarket, REFRESH_INTERVAL_MS);
    const articleInterval = setInterval(fetchLatest, REFRESH_INTERVAL_MS);
    const antaraInterval = setInterval(fetchAntara, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(marketInterval);
      clearInterval(articleInterval);
      clearInterval(antaraInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build ticker content items
  const tickerItems: React.ReactNode[] = [];

  // Market data
  if (market) {
    MARKET_ITEMS.forEach(({ label, key, formatter }) => {
      const indicator = market[key];
      if (!indicator) return;
      tickerItems.push(
        <span key={`market-${key}`} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px]">
          <span className="font-bold text-white/50">{label}</span>
          <span className="font-semibold text-white">{formatter(indicator.value)}</span>
          <span className={`flex items-center gap-0.5 font-bold ${indicator.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {indicator.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {formatPct(indicator.changePct)}
          </span>
        </span>
      );
    });
  }

  // Internal articles
  articles.forEach((article) => {
    tickerItems.push(
      <Link
        key={`article-${article.id}`}
        href={`/${site}/artikel/${article.slug}`}
        className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] transition-colors hover:text-brand-red"
      >
        <Circle size={4} className="fill-brand-red text-brand-red" />
        <span className="font-medium text-white/90">{article.title}</span>
      </Link>
    );
  });

  // Antara RSS news
  antaraNews.forEach((item, i) => {
    tickerItems.push(
      <span key={`antara-${i}`} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px]">
        <Circle size={4} className="fill-white/40 text-white/40" />
        <span className="font-medium text-white/80">{item}</span>
      </span>
    );
  });

  const tickerContent = (
    <>
      {tickerItems.map((item, i) => (
        <div key={i} className="flex items-center gap-5 sm:gap-7 lg:gap-10">
          {item}
          <span className="h-1 w-1 rounded-full bg-brand-red sm:h-1 sm:w-1 lg:h-1.5 lg:w-1.5" />
        </div>
      ))}
    </>
  );

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
            className="absolute inset-y-0 left-0 flex h-full min-w-max items-center gap-5 whitespace-nowrap pl-6 pr-3 will-change-transform sm:gap-7 sm:pl-10 sm:pr-4 lg:gap-10 lg:pl-14 lg:pr-5 animate-[ticker_80s_linear_infinite] hover:[animation-play-state:paused]"
          >
            {tickerContent}
            {tickerItems.map((item, i) => (
              <div key={`dup-${i}`} aria-hidden="true" className="flex items-center gap-5 sm:gap-7 lg:gap-10">
                {item}
                <span className="h-1 w-1 rounded-full bg-brand-red sm:h-1 sm:w-1 lg:h-1.5 lg:w-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
