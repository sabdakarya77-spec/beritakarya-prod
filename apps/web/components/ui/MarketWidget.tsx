'use client'

/**
 * MarketWidget.tsx
 *
 * Widget sidebar "Info Pasar" yang menampilkan data pasar real-time:
 *   - IHSG (Bursa Efek Indonesia)
 *   - USD/IDR
 *   - SGD/IDR
 *   - Emas (Rp/gram)
 *
 * Data di-fetch dari /api/v1/market/snapshot (backend proxy → Yahoo Finance).
 * Auto-refresh setiap 5 menit.
 */

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Formatters ────────────────────────────────────────────────────────────────

function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatCurrency(n: number): string {
  return `Rp ${n.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
}

function formatChange(n: number, decimals = 2): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  return `${Math.floor(diff / 3600)} jam lalu`
}

// ─── Individual Row ────────────────────────────────────────────────────────────

function MarketRow({
  label,
  indicator,
  formatter,
  isLast = false,
  isNew = false,
}: {
  label: string
  indicator: MarketIndicator | null
  formatter: (n: number) => string
  isLast?: boolean
  isNew?: boolean
}) {
  if (!indicator) {
    return (
      <div className={`flex items-center justify-between ${!isLast ? 'border-b border-black/5 pb-2.5 dark:border-white/5' : ''}`}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted">{label}</div>
          <div className="mt-0.5 h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        </div>
        <div className="h-3 w-12 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
      </div>
    )
  }

  const upColor = indicator.up
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div
      className={`flex items-center justify-between transition-colors ${!isLast ? 'border-b border-black/5 pb-2.5 dark:border-white/5' : ''} ${isNew ? 'animate-[fadeIn_0.4s_ease]' : ''}`}
    >
      {/* Left: label + value */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-text-muted">
          {label}
        </div>
        <div className="text-sm font-extrabold text-brand-black dark:text-white">
          {formatter(indicator.value)}
        </div>
      </div>

      {/* Right: change */}
      <div className="text-right">
        <div className={`flex items-center gap-1 text-[10px] font-bold ${upColor}`}>
          {indicator.up ? (
            <TrendingUp size={11} className="shrink-0" />
          ) : (
            <TrendingDown size={11} className="shrink-0" />
          )}
          <span>{formatChange(indicator.changePct)}%</span>
        </div>
        <div className="text-[10px] text-brand-text-muted">
          {formatChange(indicator.change, indicator.value > 10000 ? 0 : 2)}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 menit

export default function MarketWidget({
  initialData,
  apiBase = '',
}: {
  initialData?: MarketSnapshot | null
  apiBase?: string
}) {
  const [data, setData] = useState<MarketSnapshot | null>(initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setLoading(true)
      const res = await fetch(`${apiBase}/api/v1/market/snapshot`)
      if (!res.ok) throw new Error('Non-OK response')
      const json = await res.json()
      setData(json.data)
      setError(false)
      if (isManual) {
        setIsNew(true)
        setTimeout(() => setIsNew(false), 500)
      }
    } catch {
      setError(true)
    } finally {
      if (isManual) setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch segera saat mount jika tidak ada initialData
    if (!initialData) fetchData()

    // Auto-refresh setiap 5 menit
    intervalRef.current = setInterval(() => fetchData(), REFRESH_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows: { label: string; key: keyof Omit<MarketSnapshot, 'updatedAt'>; formatter: (n: number) => string }[] = [
    { label: 'IHSG', key: 'ihsg', formatter: (n) => formatNumber(n, 2) },
    { label: 'USD/IDR', key: 'usdIdr', formatter: (n) => formatNumber(n, 0) },
    { label: 'SGD/IDR', key: 'sgdIdr', formatter: (n) => formatNumber(n, 0) },
    { label: 'Emas/gram', key: 'gold', formatter: formatCurrency },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Live pulse dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-red">
            Info Pasar
          </span>
        </div>

        {/* Refresh button + timestamp */}
        <div className="flex items-center gap-2">
          {data?.updatedAt && (
            <span className="text-[9px] text-brand-text-muted">
              {formatRelativeTime(data.updatedAt)}
            </span>
          )}
          <button
            type="button"
            aria-label="Refresh data pasar"
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex h-6 w-6 items-center justify-center rounded-full text-brand-text-muted transition-colors hover:text-brand-red disabled:opacity-40"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !data && (
        <p className="text-center text-[11px] text-brand-text-muted py-3">
          Data tidak tersedia saat ini
        </p>
      )}

      {/* Rows */}
      <div className="space-y-2.5">
        {rows.map(({ label, key, formatter }, idx) => (
          <MarketRow
            key={label}
            label={label}
            indicator={data ? (data[key] as MarketIndicator | null) : null}
            formatter={formatter}
            isLast={idx === rows.length - 1}
            isNew={isNew}
          />
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-3 text-[9px] text-brand-text-muted opacity-60">
        Sumber: Yahoo Finance · Diperbarui setiap 5 menit
      </p>
    </div>
  )
}
