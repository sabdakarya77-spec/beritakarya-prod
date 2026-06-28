/**
 * Bundle Pricing Logic
 *
 * Paket bundle untuk beberapa slot sekaligus.
 * Diskon otomatis berdasarkan durasi.
 *
 * Referensi: docs/harga.md Section 5
 */

// ─── Bundle Definitions ──────────────────────────────────────────────────────

export interface BundleDefinition {
  id: string
  name: string
  description: string
  slots: string[]
  discountPercent: number // Diskon vs beli satuan
}

export const BUNDLES: BundleDefinition[] = [
  {
    id: 'homepage_only',
    name: 'Homepage Only',
    description: 'HOME_TOP + HOME_FEED_1 + HOME_FEED_2',
    slots: ['HOME_TOP', 'HOME_FEED_1', 'HOME_FEED_2'],
    discountPercent: 19,
  },
  {
    id: 'article_only',
    name: 'Article Only',
    description: 'ARTICLE_TOP + ARTICLE_MIDDLE + ARTICLE_BOTTOM',
    slots: ['ARTICLE_TOP', 'ARTICLE_MIDDLE', 'ARTICLE_BOTTOM'],
    discountPercent: 21,
  },
  {
    id: 'all_in',
    name: 'All-In',
    description: 'Semua 6 slot',
    slots: ['HOME_TOP', 'HOME_FEED_1', 'HOME_FEED_2', 'ARTICLE_TOP', 'ARTICLE_MIDDLE', 'ARTICLE_BOTTOM'],
    discountPercent: 34,
  },
]

// ─── Duration Discount ───────────────────────────────────────────────────────

/**
 * Diskon otomatis berdasarkan durasi (vs beli 7 hari berulang)
 * Referensi: harga.md Section 4
 */
export function getDurationDiscount(durationDays: number): number {
  if (durationDays >= 30) return 25  // ~25% diskon
  if (durationDays >= 14) return 12.5 // ~12.5% diskon
  return 0 // 7 hari = harga normal
}

/**
 * Hitung harga dengan diskon durasi
 */
export function calculatePriceWithDurationDiscount(
  basePrice: number, // Harga 7 hari
  durationDays: number
): number {
  if (durationDays >= 30) {
    // Harga 30 hari = harga 7 hari × 3.75 (bukan 4× karena diskon 25%)
    const price7x4 = basePrice * 4
    return Math.round(price7x4 * (1 - 25 / 100))
  }

  if (durationDays >= 14) {
    // Harga 14 hari = harga 7 hari × 1.75 (bukan 2× karena diskon 12.5%)
    const price7x2 = basePrice * 2
    return Math.round(price7x2 * (1 - 12.5 / 100))
  }

  return basePrice // 7 hari = harga normal
}

// ─── Bundle Price Calculation ────────────────────────────────────────────────

export interface BundlePriceRequest {
  bundleId: string
  durationDays: number
  packagePrices: Record<string, number> // slot → harga 7 hari
}

export interface BundlePriceResult {
  bundleId: string
  bundleName: string
  durationDays: number
  slots: string[]
  individualTotal: number // Total harga satuan
  bundlePrice: number // Harga setelah diskon bundle
  durationDiscount: number // Persentase diskon durasi
  savings: number // Hemat berapa
  savingsPercent: number // Persentase hemat
}

/**
 * Hitung harga bundle
 */
export function calculateBundlePrice(request: BundlePriceRequest): BundlePriceResult | null {
  const bundle = BUNDLES.find(b => b.id === request.bundleId)
  if (!bundle) return null

  // Hitung total harga satuan (dengan diskon durasi)
  let individualTotal = 0
  for (const slot of bundle.slots) {
    const basePrice = request.packagePrices[slot]
    if (!basePrice) continue
    individualTotal += calculatePriceWithDurationDiscount(basePrice, request.durationDays)
  }

  // Terapkan diskon bundle
  const bundlePrice = Math.round(individualTotal * (1 - bundle.discountPercent / 100))
  const savings = individualTotal - bundlePrice
  const savingsPercent = individualTotal > 0 ? (savings / individualTotal) * 100 : 0

  return {
    bundleId: bundle.id,
    bundleName: bundle.name,
    durationDays: request.durationDays,
    slots: bundle.slots,
    individualTotal,
    bundlePrice,
    durationDiscount: getDurationDiscount(request.durationDays),
    savings,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
  }
}

// ─── All Bundles Preview ─────────────────────────────────────────────────────

/**
 * Hitung harga semua bundle untuk durasi tertentu
 */
export function calculateAllBundles(
  durationDays: number,
  packagePrices: Record<string, number>
): BundlePriceResult[] {
  return BUNDLES
    .map(bundle => calculateBundlePrice({
      bundleId: bundle.id,
      durationDays,
      packagePrices,
    }))
    .filter((result): result is BundlePriceResult => result !== null)
}
