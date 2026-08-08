import { logger } from '../lib/logger'

/**
 * ad-expiry.ts
 *
 * Cron job yang berjalan setiap jam untuk auto-nonaktifkan iklan expired.
 *
 * CATATAN (SIMPLIFIKASI-IKLAN.md):
 * Model `AdBooking` sudah dihapus dan model `Advertisement` yang baru
 * tidak lagi memiliki `startDate`/`endDate` — iklan diaktifkan/nonaktifkan
 * manual oleh admin via toggle `isActive`.
 *
 * Cron ini dipertahankan sebagai no-op agar route `/api/cron/ad-expiry`
 * tetap berfungsi tanpa error, namun tidak melakukan apa-apa.
 *
 * Dipanggil via POST /api/cron/ad-expiry
 */
export async function runAdExpiry() {
  logger.info('[AdExpiry] No-op — AdBooking dihapus, iklan dikelola manual via toggle isActive')
  return { expired: 0, total: 0 }
}

// Allow standalone execution for manual trigger
if (require.main === module) {
  runAdExpiry()
    .then((r) => {
      console.log('[AdExpiry] Done:', r)
      process.exit(0)
    })
    .catch((err) => {
      logger.error('[AdExpiry] Failed:', err)
      process.exit(1)
    })
}