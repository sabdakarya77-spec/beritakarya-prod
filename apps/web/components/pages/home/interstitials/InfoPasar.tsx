'use client'

/**
 * InfoPasar.tsx — Interstitial ticker strip (Design F)
 *
 * Layout: full-width, bg brand-grey/10, 2×2 grid.
 * Bukan card — ini strip tipis ala ticker di antara feed rows.
 */

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ─── Types (sama dengan MarketWidget) ──────────────────────────────────────

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

// ─── Formatters ────────────────────────────────────────────────────────────

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatCurrency(n: number): string {
  return n.toLocaleString('id-ID', { maximumFractionDigits: 0 })
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

// ─── Item Config ───────────────────────────────────────────────────────────

interface TickerItem {
  label: string
  key: keyof Omit<MarketSnapshot, 'updatedAt'>
  formatter: (n: number) => string
}

const TICKER_ITEMS: TickerItem[] = [
  { label: 'IHSG', key: 'ihsg', formatter: (n) => formatNumber(n, 2) },
  { label: 'USD/IDR', key: 'usdIdr', formatter: (n) => formatNumber(n, 0) },
  { label: 'Emas', key: 'gold', formatter: (n) => `Rp ${formatCurrency(n)}` },
  { label: 'SGD/IDR', key: 'sgdIdr', formatter: (n) => formatNumber(n, 0) },
]

// ─── Main Component ────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

interface InfoPasarProps {
  initialData?: MarketSnapshot | null
}

export function InfoPasar({ initialData }: InfoPasarProps) {
  const [data, setData] = useState<MarketSnapshot | null>(initialData ?? null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!initialData) {
      fetch('/api/v1/market/snapshot')
        .then(r => r.ok ? r.json() : null)
        .then(json => { if (json?.data) setData(json.data) })
        .catch(() => {})
    }

    intervalRef.current = setInterval(() => {
      fetch('/api/v1/market/snapshot')
        .then(r => r.ok ? r.json() : null)
        .then(json => { if (json?.data) setData(json.data) })
        .catch(() => {})
    }, REFRESH_INTERVAL_MS)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) return null

  const items = TICKER_ITEMS
    .map(item => ({ ...item, indicator: data[item.key] as MarketIndicator | null }))
    .filter(item => item.indicator != null)

  if (items.length === 0) return null

  return (
    <section className="my-8 rounded-2xl bg-brand-grey/10 px-6 py-5 dark:bg-white/[0.02]">
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
        {items.map(({ label, indicator, formatter }) => {
          const up = indicator!.up
          return (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <span className="font-semibold text-brand-black dark:text-white">
                {label}
              </span>
              <span className="text-brand-text-muted">
                {formatter(indicator!.value)}
              </span>
              <span className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPct(indicator!.changePct)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
