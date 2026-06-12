/**
 * cron.router.ts
 *
 * HTTP endpoints yang dipanggil oleh Vercel Cron Jobs.
 * Setiap endpoint dilindungi dengan Authorization header berisi CRON_SECRET.
 *
 * Konfigurasi jadwal ada di vercel.json (apps/api/vercel.json).
 */
import { Router, Request, Response } from 'express'
import { runKYCCleanup } from './kyc-cleanup'
import { runTokenCleanup } from './token-cleanup'
import { runAdExpiry } from './ad-expiry'
import { runPageViewCleanup } from './pageview-cleanup'
import { checkAllQuotas } from '../services/quotaNotifications.service'
import { processDueScheduledArticles } from '../modules/article/article.service'
import { logger } from '../lib/logger'

export const cronRouter: Router = Router()

/** Middleware: validasi CRON_SECRET agar endpoint tidak bisa dipanggil sembarangan */
function requireCronSecret(req: Request, res: Response, next: () => void) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Kalau secret tidak diset, tolak semua akses ke cron (fail-safe)
    return res.status(503).json({ success: false, message: 'Cron not configured' })
  }
  const authHeader = req.headers['authorization']
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  next()
}

// ── POST /api/cron/quota-check — setiap jam ───────────────────────────────────
cronRouter.post('/quota-check', requireCronSecret, async (_req: Request, res: Response) => {
  logger.info('[Cron] quota-check triggered')
  try {
    await checkAllQuotas()
    res.json({ success: true, job: 'quota-check' })
  } catch (err) {
    logger.error('[Cron] quota-check failed:', err)
    res.status(500).json({ success: false, error: String(err) })
  }
})

// ── POST /api/cron/kyc-cleanup — setiap hari tengah malam ────────────────────
cronRouter.post('/kyc-cleanup', requireCronSecret, async (_req: Request, res: Response) => {
  logger.info('[Cron] kyc-cleanup triggered')
  try {
    await runKYCCleanup()
    res.json({ success: true, job: 'kyc-cleanup' })
  } catch (err) {
    logger.error('[Cron] kyc-cleanup failed:', err)
    res.status(500).json({ success: false, error: String(err) })
  }
})

// ── POST /api/cron/token-cleanup — setiap hari jam 01.00 ─────────────────────
cronRouter.post('/token-cleanup', requireCronSecret, async (_req: Request, res: Response) => {
  logger.info('[Cron] token-cleanup triggered')
  try {
    await runTokenCleanup()
    res.json({ success: true, job: 'token-cleanup' })
  } catch (err) {
    logger.error('[Cron] token-cleanup failed:', err)
    res.status(500).json({ success: false, error: String(err) })
  }
})

// ── POST /api/cron/scheduled-publish — setiap 5 menit ───────────────────────
cronRouter.post('/scheduled-publish', requireCronSecret, async (_req: Request, res: Response) => {
  logger.info('[Cron] scheduled-publish triggered')
  try {
    const result = await processDueScheduledArticles()
    logger.info(`[Cron] scheduled-publish: ${result.published} published, ${result.failed} failed`)
    res.json({ success: true, job: 'scheduled-publish', result })
  } catch (err) {
    logger.error('[Cron] scheduled-publish failed:', err)
    res.status(500).json({ success: false, error: String(err) })
  }
})

// ── POST /api/cron/ad-expiry — setiap jam ─────────────────────────────────────
cronRouter.post('/ad-expiry', requireCronSecret, async (_req: Request, res: Response) => {
  logger.info('[Cron] ad-expiry triggered')
  try {
    const result = await runAdExpiry()
    logger.info(`[Cron] ad-expiry: ${result.expired} expired out of ${result.total} total`)
    res.json({ success: true, job: 'ad-expiry', result })
  } catch (err) {
    logger.error('[Cron] ad-expiry failed:', err)
    res.status(500).json({ success: false, error: String(err) })
  }
})

// ── POST /api/cron/pageview-cleanup — setiap hari jam 03.00 ─────────────────
cronRouter.post('/pageview-cleanup', requireCronSecret, async (_req: Request, res: Response) => {
  logger.info('[Cron] pageview-cleanup triggered')
  try {
    await runPageViewCleanup()
    res.json({ success: true, job: 'pageview-cleanup' })
  } catch (err) {
    logger.error('[Cron] pageview-cleanup failed:', err)
    res.status(500).json({ success: false, error: String(err) })
  }
})
