'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Circle } from 'lucide-react'
import Link from 'next/link'
import { API_URL } from '../../lib/api'

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketIndicator {
  value: number
  change: number
  changePct: number
  up: boolean
}

interface MarketSnapshot {
  ihsg: MarketIndicator | null
  usdIdr: MarketIndicator | null
  sgdIdr: MarketIndicator | null
  gold: MarketIndicator | null
  updatedAt: string
}

interface TickerArticle {
  id: string
  title: string
  slug: string
  category?: { name?: string | null } | null
}

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

// ─── Market Config ──────────────────────────────────────────────────────────

interface MarketItem {
  label: string
  key: keyof Omit<MarketSnapshot, 'updatedAt'>
  formatter: (n: number) => string
}

const MARKET_ITEMS: MarketItem[] = [
  { label: 'IHSG', key: 'ihsg', formatter: (n) => formatNumber(n, 2) },
  { label: 'USD/IDR', key: 'usdIdr', formatter: (n) => formatNumber(n, 0) },
  { label: 'Emas', key: 'gold', formatter: (n) => `Rp ${formatNumber(n, 0)}` },
  { label: 'SGD/IDR', key: 'sgdIdr', formatter: (n) => formatNumber(n, 0) },
]

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

// ─── Main Component ─────────────────────────────────────────────────────────

interface NavbarTickerProps {
  site?: string
  initialData?: MarketSnapshot | null
}

export function NavbarTicker({ site = 'pusat', initialData }: NavbarTickerProps) {
  const [market, setMarket] = useState<MarketSnapshot | null>(initialData ?? null)
  const [articles, setArticles] = useState<TickerArticle[]>([])

  async function fetchMarket() {
    try {
      const res = await fetch(`${API_URL}/api/v1/market/snapshot`)
      if (!res.ok) return
      const json = await res.json()
      if (json?.data) setMarket(json.data)
    } catch {
      // silent
    }
  }

  async function fetchLatest() {
    try {
      const res = await fetch(`${API_URL}/api/v1/articles/public?site=${site}&limit=5&sort=publishedAt&order=desc`)
      if (!res.ok) return
      const json = await res.json()
      const items = json?.data?.articles || json?.data?.items || []
      setArticles(items.slice(0, 5))
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchMarket()
    fetchLatest()
    const marketInterval = setInterval(fetchMarket, REFRESH_INTERVAL_MS)
    const articleInterval = setInterval(fetchLatest, REFRESH_INTERVAL_MS)
    return () => {
      clearInterval(marketInterval)
      clearInterval(articleInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!market && articles.length === 0) return null

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      {/* Label */}
      <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand-red">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-pulse" />
        Terkini
      </span>

      {/* Separator */}
      <span className="h-3 w-px bg-gray-300 dark:bg-white/20" />

      {/* Ticker Content — scrolling */}
      <div className="relative flex-1 overflow-hidden">
        <div className="flex items-center gap-6 whitespace-nowrap animate-ticker">
          {/* Market Data */}
          {market && MARKET_ITEMS.map(({ label, key, formatter }) => {
            const indicator = market[key]
            if (!indicator) return null
            return (
              <span key={key} className="flex items-center gap-1.5 text-[10px]">
                <span className="font-bold text-brand-text-muted dark:text-white/50">{label}</span>
                <span className="font-semibold text-brand-black dark:text-white">{formatter(indicator.value)}</span>
                <span className={`flex items-center gap-0.5 font-bold ${
                  indicator.up ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {indicator.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {formatPct(indicator.changePct)}
                </span>
              </span>
            )
          })}

          {/* Separator antara market dan berita */}
          {market && articles.length > 0 && (
            <span className="h-3 w-px bg-gray-300 dark:bg-white/20" />
          )}

          {/* Latest News */}
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="flex items-center gap-1.5 text-[10px] transition-colors hover:text-brand-red"
            >
              <Circle size={4} className="fill-brand-red text-brand-red" />
              <span className="font-semibold text-brand-black dark:text-white">
                {article.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
