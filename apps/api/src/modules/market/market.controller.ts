/**
 * market.controller.ts
 *
 * Endpoint publik untuk data snapshot pasar keuangan.
 *
 * Routes:
 *   GET /api/v1/market/snapshot  →  data IHSG, kurs, & emas terbaru (cache 5 mnt)
 */

import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { getMarketSnapshot } from './market.service'

export const marketRouter: Router = Router()

/**
 * GET /api/v1/market/snapshot
 *
 * @swagger
 * /market/snapshot:
 *   get:
 *     summary: Ambil snapshot data pasar keuangan
 *     description: >
 *       Mengembalikan data terbaru IHSG, kurs USD/IDR, SGD/IDR, dan harga emas
 *       dalam IDR/gram. Data di-cache di server selama 5 menit.
 *     tags:
 *       - Market
 *     responses:
 *       200:
 *         description: Snapshot berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 */
marketRouter.get(
  '/snapshot',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getMarketSnapshot()

    // Cache-Control: browser & CDN boleh cache 4 menit (beri sedikit margin dari server cache 5 mnt)
    res.set('Cache-Control', 'public, max-age=240, stale-while-revalidate=60')
    res.json({ data })
  })
)
