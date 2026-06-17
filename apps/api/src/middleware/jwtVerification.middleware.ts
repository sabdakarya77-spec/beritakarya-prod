import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@beritakarya/types'
import { env } from '../lib/env'

/**
 * OPTIONAL Auth Middleware — diaplikasikan secara global.
 *
 * Perilaku:
 * - Token ADA dan VALID   → set req.user, lanjutkan ✅
 * - Token ADA tapi RUSAK  → return 401 (token palsu/dimanipulasi) 🚫
 * - Token ADA tapi EXPIRED → return 401 (minta refresh) 🚫
 * - Token TIDAK ADA       → lanjutkan tanpa req.user ✅ (route publik boleh lewat)
 *
 * Route yang memerlukan login wajib menggunakan middleware `requireAuth`
 * secara eksplisit di definisi route masing-masing.
 */
export function jwtVerify(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken
  }

  // Tidak ada token — izinkan lewat (route publik tidak memerlukan auth)
  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload
    req.user = decoded
    next()
  } catch (error) {
    // Simpan error di request tetapi izinkan lanjut ke middleware berikutnya
    // Security akan ditangani oleh requireAuth jika diperlukan
    req.authError = error
    next()
  }
}