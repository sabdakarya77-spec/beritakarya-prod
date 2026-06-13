/**
 * market.service.ts
 *
 * Mengambil data pasar keuangan dari Yahoo Finance (free, tanpa API key)
 * secara paralel dan menyimpannya di in-memory cache selama 5 menit.
 *
 * Indikator yang di-fetch:
 *   - IHSG        → ^JKSE
 *   - USD/IDR     → USDIDR=X
 *   - SGD/IDR     → SGDIDR=X
 *   - Emas (gram) → GC=F (Gold Futures USD/troy oz) × USDIDR / 31.1035
 */

import { logger } from '../../lib/logger'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketIndicator {
  /** Nilai harga/indeks saat ini */
  value: number
  /** Perubahan absolut dari penutupan sebelumnya */
  change: number
  /** Perubahan persentase (%) */
  changePct: number
  /** true jika naik, false jika turun */
  up: boolean
}

export interface MarketSnapshot {
  ihsg: MarketIndicator | null
  usdIdr: MarketIndicator | null
  sgdIdr: MarketIndicator | null
  /** Harga emas Rp/gram, dikonversi dari Gold Futures internasional */
  gold: MarketIndicator | null
  updatedAt: string
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit

let cachedSnapshot: MarketSnapshot | null = null
let cacheExpiresAt = 0

// ─── Yahoo Finance fetcher ────────────────────────────────────────────────────

const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
}
const FETCH_TIMEOUT_MS = 8_000

/**
 * Fetch satu simbol dari Yahoo Finance.
 * Mengembalikan null jika gagal (graceful degradation).
 */
async function fetchYahooFinance(symbol: string): Promise<MarketIndicator | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const url = `${YF_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=2d`
    const res = await fetch(url, { headers: YF_HEADERS, signal: controller.signal })

    if (!res.ok) {
      logger.warn(`[Market] Yahoo Finance HTTP ${res.status} for ${symbol}`)
      return null
    }

    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta

    if (!meta) {
      logger.warn(`[Market] No meta in Yahoo Finance response for ${symbol}`)
      return null
    }

    const value: number = meta.regularMarketPrice ?? meta.previousClose
    const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? value
    const change = value - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0

    return {
      value: parseFloat(value.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      up: change >= 0,
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      logger.warn(`[Market] Timeout fetching ${symbol}`)
    } else {
      logger.warn(`[Market] Error fetching ${symbol}:`, err?.message)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Konversi harga emas dari USD/troy oz ke IDR/gram.
 *   1 troy oz = 31.1035 gram
 */
function convertGoldToIdrPerGram(
  goldFutures: MarketIndicator | null,
  usdIdr: MarketIndicator | null
): MarketIndicator | null {
  if (!goldFutures || !usdIdr) return null

  const TROY_OZ_TO_GRAM = 31.1035

  const value = parseFloat(((goldFutures.value / TROY_OZ_TO_GRAM) * usdIdr.value).toFixed(0))

  // Estimasi perubahan berdasarkan changePct gabungan (gold + fx)
  const combinedChangePct = goldFutures.changePct + usdIdr.changePct
  const change = parseFloat(((combinedChangePct / 100) * value).toFixed(0))

  return {
    value,
    change,
    changePct: parseFloat(combinedChangePct.toFixed(2)),
    up: combinedChangePct >= 0,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Mengembalikan snapshot data pasar terkini.
 * Jika cache masih valid, data dikembalikan dari cache.
 * Jika cache kedaluwarsa, fetch ulang secara paralel dari Yahoo Finance.
 */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const now = Date.now()

  if (cachedSnapshot && now < cacheExpiresAt) {
    return cachedSnapshot
  }

  logger.info('[Market] Refreshing market snapshot from Yahoo Finance...')

  // Fetch paralel — IHSG, USD/IDR, SGD/IDR, Gold Futures
  const [ihsg, usdIdr, sgdIdr, goldRaw] = await Promise.all([
    fetchYahooFinance('^JKSE'),
    fetchYahooFinance('USDIDR=X'),
    fetchYahooFinance('SGDIDR=X'),
    fetchYahooFinance('GC=F'),
  ])

  const gold = convertGoldToIdrPerGram(goldRaw, usdIdr)

  const snapshot: MarketSnapshot = {
    ihsg,
    usdIdr,
    sgdIdr,
    gold,
    updatedAt: new Date().toISOString(),
  }

  cachedSnapshot = snapshot
  cacheExpiresAt = now + CACHE_TTL_MS

  logger.info('[Market] Snapshot updated:', {
    ihsg: ihsg?.value,
    usdIdr: usdIdr?.value,
    sgdIdr: sgdIdr?.value,
    gold: gold?.value,
  })

  return snapshot
}
