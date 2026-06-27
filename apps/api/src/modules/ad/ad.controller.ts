import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { adTrackingLimiter, bookingLimiter } from '../../lib/rateLimit'
import { isDuplicateImpression, syncTrackingToBooking, sanitizeAdCode } from './ad.service'
import { processAdSmart, AD_VARIANTS } from '../../lib/ad-image-processor'
import { StorageService } from '../../services/storage.service'
import * as repo from './ad.repository'
import { emailService } from '../../services/email.service'
import { sendNotification } from '../notification/notification.controller'
import { createSnapTransaction, verifyMidtransSignature, mapMidtransStatus } from '../../services/midtrans.service'
import { logger } from '../../lib/logger'

export const adRouter = Router()

// ─── Helper: Auto-generate variants from image URL ───────────────────────────
// Downloads image from URL, generates all variants for the slot, uploads to storage.
// Returns { imageUrl, imageUrlTablet, imageUrlMobile } or null on failure.

async function generateVariantsFromUrl(
  imageUrl: string,
  slot: string
): Promise<{ imageUrl: string; imageUrlTablet: string | null; imageUrlMobile: string | null } | null> {
  const variants = AD_VARIANTS[slot]
  if (!variants) return null

  try {
    // Download image from URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      logger.warn(`[AdController] Failed to download image for variant generation: ${response.status}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const mediaBucket = StorageService.mediaBucket
    const id = uuidv4()
    const results: Record<string, string> = {}

    // Generate all variants in parallel
    const entries = Object.entries(variants)
    await Promise.all(
      entries.map(async ([variantName, dims]) => {
        const result = await processAdSmart(buffer, dims.width, dims.height, `${slot}_${variantName}`)
        const suffix = variantName !== 'desktop' ? `-${variantName}` : ''
        const key = `ads/${id}${suffix}.webp`
        await StorageService.uploadBuffer(result.buffer, key, 'image/webp', mediaBucket, { isPublic: true })
        results[variantName] = StorageService.getPublicUrl(mediaBucket, key)
      })
    )

    return {
      imageUrl: results.desktop || imageUrl,
      imageUrlTablet: results.tablet || null,
      imageUrlMobile: results.mobile || null,
    }
  } catch (err) {
    logger.warn('[AdController] Variant generation failed, falling back to original URL:', err)
    return null
  }
}

// Public endpoint for tracking views/clicks — with rate limiting & dedup
adRouter.post('/track/:id',
  adTrackingLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { action } = req.query // 'impression' | 'click'
    const ip = req.ip || req.socket.remoteAddress || 'unknown'

    try {
      const ad = await repo.findAdById(id)
      if (!ad) return res.json({ success: true })

      if (action === 'impression') {
        const isDup = await isDuplicateImpression(id, ip)
        if (!isDup) {
          await repo.incrementAdMetric(id, 'impressions')
          await syncTrackingToBooking(ad.siteId, ad.slot, 'impression', ad.bookingId, id)
        }
      } else if (action === 'click') {
        await repo.incrementAdMetric(id, 'clicks')
        await syncTrackingToBooking(ad.siteId, ad.slot, 'click', ad.bookingId, id)
      }
    } catch (_e) {
      // Ignore if ad not found
    }

    res.json({ success: true })
  })
)

// Public endpoint for fetching active advertisements for a specific site
adRouter.get('/public',
  asyncHandler(async (req: Request, res: Response) => {
    const siteId = req.query.site as string
    if (!siteId) {
      return res.status(400).json({ success: false, message: 'site query parameter is required' })
    }
    const ads = await repo.findActiveAdsBySite(siteId)
    res.json({ success: true, data: ads })
  })
)

  // Public endpoint for fetching fallback ads (e.g., static examples for empty slots)
  // This is a simple hard‑coded response that can later be hooked into a CMS.
  adRouter.get('/fallback',
    asyncHandler(async (req: Request, res: Response) => {
      const slot = req.query.slot as string || 'leaderboard'
      // Minimal static fallback data – matches the shape used by the front‑end fallback UI.
      const fallbackAds = [
        {
          id: 'fallback-1',
          slot,
          mediaType: 'image',
          // Next.js serves files from the `public` folder at the root URL without the `/public` prefix
          mediaUrl: '/fallbacks/leaderboard.svg',
          headline: 'Ruang Iklan Premium',
          subheadline: 'Jangkau audiens luas dengan banner berkualitas tinggi di BeritaKarya',
        }
      ]
      res.json({ success: true, data: fallbackAds })
    })
  )

adRouter.get('/',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await repo.findAdsBySite(req.site!, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    })
    res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages } })
  })
)

adRouter.post('/',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { slot, code, imageUrl, imageUrlTablet, imageUrlMobile, linkUrl, isActive } = req.body

    let sanitizedCode = code || null
    if (code) {
      const { valid, sanitized } = sanitizeAdCode(code)
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Kode HTML mengandung pola yang tidak diizinkan' })
      }
      sanitizedCode = sanitized
    }

    const nextOrder = await repo.getNextOrder(req.site!, slot)

    const ad = await repo.createAd({
      siteId: req.site!,
      slot,
      code: sanitizedCode,
      imageUrl: imageUrl || null,
      imageUrlTablet: imageUrlTablet || null,
      imageUrlMobile: imageUrlMobile || null,
      linkUrl: linkUrl || null,
      isActive: isActive ?? true,
      order: nextOrder,
    })
    res.status(201).json({ success: true, data: ad })
  })
)

adRouter.patch('/:id',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { slot, code, imageUrl, imageUrlTablet, imageUrlMobile, linkUrl, isActive, order } = req.body

    let sanitizedCode = code || null
    if (code) {
      const { valid, sanitized } = sanitizeAdCode(code)
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Kode HTML mengandung pola yang tidak diizinkan' })
      }
      sanitizedCode = sanitized
    }

    const ad = await repo.updateAd(id, {
      slot,
      code: sanitizedCode,
      imageUrl: imageUrl || null,
      imageUrlTablet: imageUrlTablet || null,
      imageUrlMobile: imageUrlMobile || null,
      linkUrl: linkUrl || null,
      isActive,
      order,
    })
    res.json({ success: true, data: ad })
  })
)

adRouter.delete('/:id',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await repo.deleteAd(id)
    res.json({ success: true, message: 'Advertisement deleted' })
  })
)

// PATCH /reorder — Update rotation order of ads within a slot
adRouter.patch('/reorder',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items harus berupa array' })
    }

    await repo.reorderAds(items)
    res.json({ success: true, message: 'Urutan iklan berhasil diperbarui' })
  })
)

// ==========================================
// 🚀 DYNAMIC AD PACKAGES & BOOKINGS ENDPOINTS
// ==========================================

// 1. GET /packages — Public & Advertiser to view active packages
adRouter.get('/packages',
  asyncHandler(async (req: Request, res: Response) => {
    const packages = await repo.findActivePackages()
    res.json({ success: true, data: packages })
  })
)

// 2. GET /availability — Check if a slot is available for given dates
adRouter.get('/availability',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: Request, res: Response) => {
    const { slot, startDate, endDate, siteId } = req.query as Record<string, string>

    if (!slot || !startDate || !endDate || !siteId) {
      return res.status(400).json({ success: false, message: 'slot, startDate, endDate, siteId wajib diisi' })
    }

    // Semua slot mendukung rotasi — selalu tersedia
    res.json({ success: true, data: { available: true } })
  })
)

// 3. POST /bookings — Advertiser to book an ad slot
adRouter.post('/bookings',
  bookingLimiter,
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: Request, res: Response) => {
    const { packageId, siteId, campaignName, imageUrl, imageUrlTablet, imageUrlMobile, linkUrl, startDate, animationEffect } = req.body

    const pkg = await repo.findPackageById(packageId)
    if (!pkg || !pkg.isActive) {
      return res.status(400).json({ success: false, message: 'Paket iklan tidak ditemukan atau tidak aktif' })
    }

    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (start < today) {
      return res.status(400).json({ success: false, message: 'Tanggal mulai tidak boleh di masa lalu' })
    }

    const computedEndDate = new Date(start)
    computedEndDate.setDate(computedEndDate.getDate() + pkg.durationDays)

    // Semua slot mendukung rotasi — tidak perlu cek overlap

    const booking = await repo.createBooking({
      userId: req.user!.userId,
      siteId,
      packageId,
      campaignName: campaignName || null,
      imageUrl: imageUrl || null,
      imageUrlTablet: imageUrlTablet || null,
      imageUrlMobile: imageUrlMobile || null,
      linkUrl: linkUrl || null,
      animationEffect: animationEffect || null,
      startDate: start,
      endDate: computedEndDate,
    })
    res.status(201).json({ success: true, data: booking })
  })
)

// 3. GET /bookings/my — Advertiser to view their own bookings
adRouter.get('/bookings/my',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: Request, res: Response) => {
    const bookings = await repo.findBookingsByUser(req.user!.userId)
    res.json({ success: true, data: bookings })
  })
)

// 3b. GET /bookings/:id/stats — Time-series analytics for a booking
adRouter.get('/bookings/:id/stats',
  requireAuth,
  requireRole(['advertiser', 'superadmin', 'wapimred']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const days = parseInt(req.query.days as string) || 30

    const booking = await repo.findBookingById(id)
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' })
    }

    // Advertiser hanya bisa lihat stats booking sendiri
    if (req.user!.role === 'advertiser' && booking.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    const stats = await repo.getAdStatsByBooking(id, Math.min(days, 90))
    res.json({ success: true, data: stats })
  })
)

// 4. POST /bookings/:id/pay — Advertiser to upload payment proof image URL
adRouter.post('/bookings/:id/pay',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { paymentProof } = req.body

    const existing = await repo.findBookingById(id)
    if (!existing || existing.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    if (existing.paymentStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Bukti bayar sudah diupload atau booking sudah diproses' })
    }

    if (!paymentProof) {
      return res.status(400).json({ success: false, message: 'URL bukti bayar wajib diisi' })
    }

    const booking = await repo.updateBooking(id, { paymentProof, paymentStatus: 'VERIFYING' })
    res.json({ success: true, data: booking })
  })
)

// 4b. POST /bookings/:id/pay-gateway — Advertiser to pay via Midtrans Snap
adRouter.post('/bookings/:id/pay-gateway',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const existing = await repo.findBookingById(id, { package: true }) as unknown as {
      id: string; userId: string; paymentStatus: string; siteId: string;
      snapToken: string | null; externalOrderId: string | null;
      package: { name: string; price: { toString(): string } }
    } | null
    if (!existing || existing.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    if (existing.paymentStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Booking sudah diproses' })
    }

    // Jika sudah ada snap token, return langsung
    if (existing.snapToken) {
      return res.json({ success: true, data: { snapToken: existing.snapToken } })
    }

    // Buat external order ID unik
    const externalOrderId = `BK-AD-${existing.id.slice(0, 8)}-${Date.now()}`
    const grossAmount = Math.round(Number(existing.package.price.toString()))

    const user = await repo.findBookingById(id, { user: true }) as unknown as { user: { name: string; email: string } } | null
    const customerName = user?.user?.name || 'Pengiklan'
    const customerEmail = user?.user?.email || 'unknown@beritakarya.co'

    try {
      const snapResult = await createSnapTransaction({
        orderId: externalOrderId,
        grossAmount,
        customerName,
        customerEmail,
        itemDetails: [{
          id: existing.package ? 'pkg' : 'ad',
          name: existing.package?.name || 'Iklan BeritaKarya',
          price: grossAmount,
          quantity: 1,
        }],
      })

      // Simpan snap token dan external order ID
      await repo.updateBooking(id, {
        snapToken: snapResult.token,
        externalOrderId,
      })

      res.json({ success: true, data: { snapToken: snapResult.token, redirectUrl: snapResult.redirect_url } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuat transaksi Midtrans'
      res.status(500).json({ success: false, message })
    }
  })
)

// 4c. POST /webhook/midtrans — Midtrans notification callback (public)
adRouter.post('/webhook/midtrans',
  asyncHandler(async (req: Request, res: Response) => {
    const notification = req.body

    // Verifikasi signature
    const isValid = verifyMidtransSignature({
      order_id: notification.order_id,
      status_code: notification.status_code,
      gross_amount: notification.gross_amount,
      signature_key: notification.signature_key,
    })

    if (!isValid) {
      return res.status(403).json({ success: false, message: 'Invalid signature' })
    }

    // Cari booking berdasarkan externalOrderId
    const booking = await repo.findBookingByExternalOrderId(notification.order_id)
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    // Map status Midtrans ke status kita
    const { paymentStatus, shouldActivate } = mapMidtransStatus(
      notification.transaction_status,
      notification.fraud_status
    )

    // Update booking
    const updateData: Record<string, unknown> = { paymentStatus }
    if (paymentStatus === 'PAID') {
      updateData.status = 'ACTIVE'
    } else if (paymentStatus === 'REJECTED') {
      updateData.status = 'REJECTED'
      updateData.rejectionNotes = `Pembayaran ${notification.transaction_status} via Midtrans`
    }

    await repo.updateBooking(booking.id, updateData)

    // Jika aktif, sync ke Advertisement table
    if (shouldActivate) {
      try {
        const fullBooking = await repo.findBookingById(booking.id, { package: true }) as unknown as {
          siteId: string; imageUrl: string | null; imageUrlTablet: string | null;
          imageUrlMobile: string | null; linkUrl: string | null; animationEffect: string | null;
          package: { slot: string }
        } | null
        if (fullBooking) {
          // Auto-generate variants from imageUrl if tablet/mobile URLs are missing
          let finalImageUrl = fullBooking.imageUrl
          let finalTabletUrl = fullBooking.imageUrlTablet || null
          let finalMobileUrl = fullBooking.imageUrlMobile || null

          if (fullBooking.imageUrl && (!finalTabletUrl || !finalMobileUrl)) {
            const generated = await generateVariantsFromUrl(fullBooking.imageUrl, fullBooking.package.slot)
            if (generated) {
              finalImageUrl = generated.imageUrl
              finalTabletUrl = generated.imageUrlTablet
              finalMobileUrl = generated.imageUrlMobile
            }
          }

          const adData = {
            imageUrl: finalImageUrl,
            imageUrlTablet: finalTabletUrl,
            imageUrlMobile: finalMobileUrl,
            linkUrl: fullBooking.linkUrl,
            animationEffect: fullBooking.animationEffect || null,
            code: null,
            isActive: true,
            impressions: 0,
            clicks: 0,
            bookingId: booking.id,
          }
          const nextOrder = await repo.getNextOrder(fullBooking.siteId, fullBooking.package.slot)
          await repo.createAd({ siteId: fullBooking.siteId, slot: fullBooking.package.slot, ...adData, order: nextOrder })
        }
      } catch (err) {
        console.error('Gagal sync ad setelah pembayaran Midtrans:', err)
      }
    }

    // Kirim notifikasi ke pengiklan
    try {
      const pkg = (await repo.findBookingById(booking.id, { package: true, user: true })) as unknown as {
        package: { name: string }; user: { email: string; name: string }
      } | null
      if (pkg) {
        if (paymentStatus === 'PAID') {
          await sendNotification({ userId: booking.userId, siteId: booking.siteId, type: 'booking_approved', title: 'Pembayaran Berhasil', message: `Pembayaran iklan "${pkg.package.name}" berhasil. Iklan sedang aktif.`, link: `/${booking.siteId}/ads/bookings` })
          await emailService.sendBookingNotification(pkg.user.email, pkg.user.name, 'approved', pkg.package.name, null, booking.siteId)
        } else if (paymentStatus === 'REJECTED') {
          await sendNotification({ userId: booking.userId, siteId: booking.siteId, type: 'booking_rejected', title: 'Pembayaran Gagal', message: `Pembayaran iklan "${pkg.package.name}" gagal. Silakan coba lagi.`, link: `/${booking.siteId}/ads/bookings` })
        }
      }
    } catch (err) {
      console.error('Gagal kirim notifikasi setelah webhook Midtrans:', err)
    }

    // Return 200 agar Midtrans tidak retry
    res.json({ success: true })
  })
)

// 5. POST /packages — Superadmin only to create a new ad package
adRouter.post('/packages',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, slot, allowedFormat, durationDays, price, description } = req.body
    const pkg = await repo.createPackage({
      name,
      slot,
      allowedFormat: allowedFormat || 'ALL',
      durationDays: parseInt(durationDays),
      price: parseFloat(price),
      description: description || null,
    })
    res.status(201).json({ success: true, data: pkg })
  })
)

// 6. PATCH /packages/:id — Superadmin only to modify an ad package
adRouter.patch('/packages/:id',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, slot, allowedFormat, durationDays, price, description, isActive } = req.body
    const pkg = await repo.updatePackage(id, {
      name,
      slot,
      allowedFormat,
      durationDays: durationDays ? parseInt(durationDays) : undefined,
      price: price ? parseFloat(price) : undefined,
      description,
      isActive,
    })
    res.json({ success: true, data: pkg })
  })
)

// 7. DELETE /packages/:id — Superadmin only to delete an ad package
adRouter.delete('/packages/:id',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await repo.deletePackage(id)
    res.json({ success: true, message: 'Package deleted successfully' })
  })
)

// 8. GET /bookings/all — Superadmin only to view all incoming ad bookings
adRouter.get('/bookings/all',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const bookings = await repo.findAllBookings()
    res.json({ success: true, data: bookings })
  })
)

// 9. POST /bookings/:id/approve — Superadmin only to approve a booking and auto-sync active ad banner
adRouter.post('/bookings/:id/approve',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const _booking = await repo.findBookingById(id, { package: true, user: true })
    if (!_booking) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan' })
    }
    const booking = _booking as unknown as {
      id: string; siteId: string; userId: string; status: string; paymentStatus: string;
      startDate: Date; endDate: Date; imageUrl: string | null; imageUrlTablet: string | null; imageUrlMobile: string | null; linkUrl: string | null;
      animationEffect: string | null;
      package: { slot: string; name: string };
      user: { email: string; name: string };
    }

    if (booking.paymentStatus !== 'VERIFYING') {
      return res.status(400).json({ success: false, message: 'Booking belum menunggu verifikasi pembayaran' })
    }

    // Update booking status
    const updatedBooking = await repo.updateBooking(id, {
      paymentStatus: 'PAID',
      status: 'ACTIVE',
    })

    // AUTO-INTEGRATION: Sync to active Advertisement table
    // Auto-generate variants from imageUrl if tablet/mobile URLs are missing
    let finalImageUrl = booking.imageUrl
    let finalTabletUrl = booking.imageUrlTablet || null
    let finalMobileUrl = booking.imageUrlMobile || null

    if (booking.imageUrl && (!finalTabletUrl || !finalMobileUrl)) {
      const generated = await generateVariantsFromUrl(booking.imageUrl, booking.package.slot)
      if (generated) {
        finalImageUrl = generated.imageUrl
        finalTabletUrl = generated.imageUrlTablet
        finalMobileUrl = generated.imageUrlMobile
      }
    }

    const adData = {
      imageUrl: finalImageUrl,
      imageUrlTablet: finalTabletUrl,
      imageUrlMobile: finalMobileUrl,
      linkUrl: booking.linkUrl,
      animationEffect: booking.animationEffect || null,
      code: null,
      isActive: true,
      impressions: 0,
      clicks: 0,
      bookingId: booking.id,
    }

    const nextOrder = await repo.getNextOrder(booking.siteId, booking.package.slot)
    await repo.createAd({
      siteId: booking.siteId,
      slot: booking.package.slot,
      ...adData,
      order: nextOrder,
    })

    // Kirim notifikasi ke pengiklan (tidak gagalkan proses)
    try {
      await sendNotification({ userId: booking.userId, siteId: booking.siteId, type: 'booking_approved', title: 'Iklan Disetujui', message: `Iklan "${booking.package.name}" telah disetujui dan aktif.`, link: `/${booking.siteId}/ads/bookings` })
      await emailService.sendBookingNotification(booking.user.email, booking.user.name, 'approved', booking.package.name, null, booking.siteId)
    } catch (notifErr) {
      console.error('Gagal mengirim notifikasi booking approval:', notifErr)
    }

    res.json({ success: true, data: updatedBooking })
  })
)

// 10. POST /bookings/:id/reject — Superadmin only to reject a booking with notes
adRouter.post('/bookings/:id/reject',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { rejectionNotes } = req.body

    // Ambil booking dengan user untuk notifikasi
    const _existing = await repo.findBookingById(id, { package: true, user: true })
    if (!_existing) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan' })
    }
    const existing = _existing as unknown as {
      id: string; siteId: string; userId: string;
      user: { email: string; name: string };
      package: { name: string };
    }

    const booking = await repo.updateBooking(id, {
      paymentStatus: 'REJECTED',
      status: 'REJECTED',
      rejectionNotes: rejectionNotes || null,
    })

    // Kirim notifikasi ke pengiklan (tidak gagalkan proses)
    try {
      await sendNotification({ userId: existing.userId, siteId: existing.siteId, type: 'booking_rejected', title: 'Iklan Ditolak', message: `Iklan "${existing.package.name}" ditolak. ${rejectionNotes || ''}`.trim(), link: `/${existing.siteId}/ads/bookings` })
      await emailService.sendBookingNotification(existing.user.email, existing.user.name, 'rejected', existing.package.name, rejectionNotes, existing.siteId)
    } catch (notifErr) {
      console.error('Gagal mengirim notifikasi booking rejection:', notifErr)
    }

    res.json({ success: true, data: booking })
  })
)
