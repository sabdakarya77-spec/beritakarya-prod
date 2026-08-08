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

// ─── HTML Code Sanitization ───────────────────────────────────────────────────
// Validasi field `code` lama di Advertisement untuk mencegah XSS.
// Field `code` sudah dihapus (full image only) — fungsi ini dipertahankan
// untuk backward compatibility bila ada data lama yang masih memakai code.

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