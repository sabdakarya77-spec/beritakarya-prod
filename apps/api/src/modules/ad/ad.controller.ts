import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { adTrackingLimiter } from '../../lib/rateLimit'
import { isDuplicateImpression, syncTrackingToBooking, sanitizeAdCode } from './ad.service'
import * as repo from './ad.repository'

export const adRouter = Router()

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
          await syncTrackingToBooking(ad.siteId, ad.slot, 'impression', ad.bookingId)
        }
      } else if (action === 'click') {
        await repo.incrementAdMetric(id, 'clicks')
        await syncTrackingToBooking(ad.siteId, ad.slot, 'click', ad.bookingId)
      }
    } catch (e) {
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
    const { slot, code, imageUrl, linkUrl, isActive } = req.body

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
    const { slot, code, imageUrl, linkUrl, isActive, order } = req.body

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

// 2. POST /bookings — Advertiser to book an ad slot
adRouter.post('/bookings',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: any, res: Response) => {
    const { packageId, siteId, imageUrl, linkUrl, startDate } = req.body

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

    const booking = await repo.createBooking({
      userId: req.user.userId,
      siteId,
      packageId,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
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
  asyncHandler(async (req: any, res: Response) => {
    const bookings = await repo.findBookingsByUser(req.user.userId)
    res.json({ success: true, data: bookings })
  })
)

// 4. POST /bookings/:id/pay — Advertiser to upload payment proof image URL
adRouter.post('/bookings/:id/pay',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params
    const { paymentProof } = req.body

    const existing = await repo.findBookingById(id)
    if (!existing || existing.userId !== req.user.userId) {
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

    const booking = await repo.findBookingById(id, { package: true })
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan' })
    }

    if (booking.paymentStatus !== 'VERIFYING') {
      return res.status(400).json({ success: false, message: 'Booking belum menunggu verifikasi pembayaran' })
    }

    // Validasi overlap: non-leaderboard slot tidak boleh ada booking aktif yang tanggalnya overlap
    if (booking.package.slot !== 'leaderboard') {
      const overlapping = await repo.findOverlappingBooking(
        booking.siteId,
        booking.package.slot,
        booking.id,
        booking.startDate,
        booking.endDate
      )
      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: `Slot "${booking.package.slot}" sudah ditempati booking lain (${overlapping.id}) pada rentang tanggal ${overlapping.startDate.toISOString().slice(0, 10)} — ${overlapping.endDate.toISOString().slice(0, 10)}. Tolak atau tunggu hingga booking tersebut berakhir.`
        })
      }
    }

    // Update booking status
    const updatedBooking = await repo.updateBooking(id, {
      paymentStatus: 'PAID',
      status: 'ACTIVE',
    })

    // AUTO-INTEGRATION: Sync to active Advertisement table
    const adData = {
      imageUrl: booking.imageUrl,
      linkUrl: booking.linkUrl,
      code: null,
      isActive: true,
      impressions: 0,
      clicks: 0,
      bookingId: booking.id,
    }

    if (booking.package.slot === 'leaderboard') {
      const nextOrder = await repo.getNextOrder(booking.siteId, 'leaderboard')
      await repo.createAd({
        siteId: booking.siteId,
        slot: 'leaderboard',
        ...adData,
        order: nextOrder,
      })
    } else {
      await repo.createOrUpdateAdForSlot(booking.siteId, booking.package.slot, adData)
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
    const booking = await repo.updateBooking(id, {
      paymentStatus: 'REJECTED',
      status: 'REJECTED',
      rejectionNotes: rejectionNotes || null,
    })
    res.json({ success: true, data: booking })
  })
)
