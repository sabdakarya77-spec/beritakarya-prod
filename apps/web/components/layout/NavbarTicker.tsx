'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
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

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

// ─── Config ─────────────────────────────────────────────────────────────────

interface TickerItem {
  label: string
  key: keyof Omit<MarketSnapshot, 'updatedAt'>
  formatter: (n: number) => string
}

const TICKER_ITEMS: TickerItem[] = [
  { label: 'IHSG', key: 'ihsg', formatter: (n) => formatNumber(n, 2) },
  { label: 'USD/IDR', key: 'usdIdr', formatter: (n) => formatNumber(n, 0) },
  { label: 'Emas', key: 'gold', formatter: (n) => `Rp ${formatNumber(n, 0)}` },
  { label: 'SGD/IDR', key: 'sgdIdr', formatter: (n) => formatNumber(n, 0) },
]

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

// ─── Main Component ─────────────────────────────────────────────────────────

interface NavbarTickerProps {
  initialData?: MarketSnapshot | null
}

export function NavbarTicker({ initialData }: NavbarTickerProps) {
  const [data, setData] = useState<MarketSnapshot | null>(initialData ?? null)

  useEffect(() => {
    if (!data) {
      fetchMarket()
    }
    const interval = setInterval(fetchMarket, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  async function fetchMarket() {
    try {
      const res = await fetch(`${API_URL}/api/v1/market/snapshot`)
      if (!res.ok) return
      const json = await res.json()
      if (json?.data) setData(json.data)
    } catch {
      // silent
    }
  }

  if (!data) return null

  return (
    <div className="hidden items-center gap-4 lg:flex">
      {TICKER_ITEMS.map(({ label, key, formatter }) => {
        const indicator = data[key]
        if (!indicator) return null

        return (
          <div key={key} className="flex items-center gap-1.5 text-[10px]">
            <span className="font-bold text-brand-text-muted dark:text-white/50">
              {label}
            </span>
            <span className="font-semibold text-brand-black dark:text-white">
              {formatter(indicator.value)}
            </span>
            <span className={`flex items-center gap-0.5 font-bold ${
              indicator.up ? 'text-emerald-500' : 'text-red-500'
            }`}>
              {indicator.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {formatPct(indicator.changePct)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
