import { Router } from 'express'
import { z } from 'zod'
import * as service from './newsletter.service'
import { siteMiddleware } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'

export const newsletterRouter: Router = Router()

const subscribeSchema = z.object({
  email: z.string().email('Format email tidak valid')
})

newsletterRouter.post('/subscribe', siteMiddleware, asyncHandler(async (req, res) => {
  const { email } = subscribeSchema.parse(req.body)
  await service.subscribe(email, req.site!)
  res.json({ success: true, message: 'Berhasil berlangganan newsletter' })
}))
