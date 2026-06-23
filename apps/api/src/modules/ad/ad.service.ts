import { prisma } from '../../db/client'
import { getCache, setCache } from '../../lib/redis'
import { logger } from '../../lib/logger'

// ─── Impression Deduplication ─────────────────────────────────────────────────
// Mencegah impression dihitung ganda dari IP yang sama untuk ad yang sama.
// TTL 30 menit — setelah itu impression dari IP yang sama dihitung ulang.

const IMPRESSION_TTL_SECONDS = 30 * 60 // 30 menit

export async function isDuplicateImpression(adId: string, ip: string): Promise<boolean> {
  const key = `ad:imp:${adId}:${ip}`
  try {
    const existing = await getCache<string>(key)
    if (existing) return true
    await setCache(key, '1', IMPRESSION_TTL_SECONDS)
    return false
  } catch (err) {
    // Jika Redis error, allow impression (fail-open)
    logger.warn('[AdService] Dedup check failed, allowing impression:', err)
    return false
  }
}

// ─── Sync Tracking ke AdBooking ───────────────────────────────────────────────
// Saat impression/click di-track, increment counter di AdBooking yang terkait.
// Prioritas: gunakan bookingId dari Advertisement (link langsung).
// Fallback: cari berdasarkan siteId+slot+tanggal (untuk data lama yang belum punya bookingId).

export async function syncTrackingToBooking(
  siteId: string,
  slot: string,
  action: 'impression' | 'click',
  bookingId?: string | null,
  adId?: string
) {
  try {
    const field = action === 'impression' ? 'impressions' : 'clicks'

    // Prioritas 1: gunakan bookingId langsung dari Advertisement
    if (bookingId) {
      await prisma.adBooking.update({
        where: { id: bookingId },
        data: { [field]: { increment: 1 } },
      })
      // Log event untuk time-series analytics
      if (adId) {
        await prisma.adEventLog.create({
          data: { adId, bookingId, siteId, action },
        }).catch(() => {}) // non-critical
      }
      return
    }

    // Fallback: cari booking aktif yang paling relevan (data lama tanpa bookingId)
    const now = new Date()
    const booking = await prisma.adBooking.findFirst({
      where: {
        siteId,
        package: { slot },
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
    })

    if (booking) {
      await prisma.adBooking.update({
        where: { id: booking.id },
        data: { [field]: { increment: 1 } },
      })
      // Log event untuk time-series analytics
      if (adId) {
        await prisma.adEventLog.create({
          data: { adId, bookingId: booking.id, siteId, action },
        }).catch(() => {})
      }
    }
  } catch (err) {
    // Non-critical: jangan ganggu tracking utama jika ini gagal
    logger.warn('[AdService] Failed to sync tracking to booking:', err)
  }
}

// ─── HTML Code Sanitization ───────────────────────────────────────────────────
// Validasi field `code` di Advertisement untuk mencegah XSS.
// Hanya allow pola yang aman (AdSense, tagihan script standar).

const DANGEROUS_PATTERNS: RegExp[] = [
  /eval\s*\(/i,
  /document\.cookie/i,
  /XMLHttpRequest/i,
  /document\.write\s*\(/i,
  /window\.location/i,
  /on\w+\s*=\s*["'][^"']*["']/i, // inline event handlers
]

export function sanitizeAdCode(code: string): { valid: boolean; sanitized: string | null } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      return { valid: false, sanitized: null }
    }
  }
  return { valid: true, sanitized: code }
}
