import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { adTrackingLimiter } from '../../lib/rateLimit'
import { isDuplicateImpression, syncTrackingToBooking, sanitizeAdCode } from './ad.service'

export const adRouter = Router()

// Public endpoint for tracking views/clicks — with rate limiting & dedup
adRouter.post('/track/:id',
  adTrackingLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { action } = req.query // 'impression' | 'click'
    const ip = req.ip || req.socket.remoteAddress || 'unknown'

    try {
      // Fetch ad to get siteId & slot for booking sync
      const ad = await prisma.advertisement.findUnique({ where: { id } })
      if (!ad) return res.json({ success: true })

      if (action === 'impression') {
        // Dedup: skip jika IP yang sama sudah track impression untuk ad ini
        const isDup = await isDuplicateImpression(id, ip)
        if (!isDup) {
          await prisma.advertisement.update({
            where: { id },
            data: { impressions: { increment: 1 } }
          })
          // Sync ke AdBooking yang terkait
          await syncTrackingToBooking(ad.siteId, ad.slot, 'impression', ad.bookingId)
        }
      } else if (action === 'click') {
        await prisma.advertisement.update({
          where: { id },
          data: { clicks: { increment: 1 } }
        })
        // Sync ke AdBooking yang terkait
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
    const ads = await prisma.advertisement.findMany({
      where: { siteId, isActive: true },
      orderBy: { order: 'asc' }
    })
    res.json({ success: true, data: ads })
  })
)

adRouter.get('/',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const skip = (page - 1) * limit

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        where: { siteId: req.site! },
        skip,
        take: limit,
        orderBy: [{ slot: 'asc' }, { order: 'asc' }]
      }),
      prisma.advertisement.count({ where: { siteId: req.site! } })
    ])

    res.json({ 
      success: true, 
      data: ads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

adRouter.post('/',
  requireAuth,
  siteMiddleware,
  requireRole(['superadmin', 'wapimred']),
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { slot, code, imageUrl, linkUrl, isActive } = req.body

    // Sanitasi HTML code field untuk mencegah XSS
    let sanitizedCode = code || null
    if (code) {
      const { valid, sanitized } = sanitizeAdCode(code)
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Kode HTML mengandung pola yang tidak diizinkan' })
      }
      sanitizedCode = sanitized
    }

    // Determine next order value for this slot
    const maxOrder = await prisma.advertisement.aggregate({
      where: { siteId: req.site!, slot },
      _max: { order: true }
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    const ad = await prisma.advertisement.create({
      data: {
        siteId: req.site!,
        slot,
        code: sanitizedCode,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isActive: isActive ?? true,
        order: nextOrder
      },
      select: { id: true, slot: true, code: true, imageUrl: true, linkUrl: true, isActive: true, order: true, impressions: true, clicks: true, createdAt: true }
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

    // Sanitasi HTML code field
    let sanitizedCode = code || null
    if (code) {
      const { valid, sanitized } = sanitizeAdCode(code)
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Kode HTML mengandung pola yang tidak diizinkan' })
      }
      sanitizedCode = sanitized
    }

    const ad = await prisma.advertisement.update({
      where: { id },
      data: {
        slot,
        code: sanitizedCode,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        isActive,
        order
      },
      select: { id: true, slot: true, code: true, imageUrl: true, linkUrl: true, isActive: true, order: true, impressions: true, clicks: true, createdAt: true }
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
    await prisma.advertisement.delete({
      where: { id }
    })
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
    const { items } = req.body // Array of { id, order }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items harus berupa array' })
    }

    await prisma.$transaction(
      items.map((item: { id: string; order: number }) =>
        prisma.advertisement.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    )

    res.json({ success: true, message: 'Urutan iklan berhasil diperbarui' })
  })
)

// ==========================================
// 🚀 DYNAMIC AD PACKAGES & BOOKINGS ENDPOINTS
// ==========================================

// 1. GET /packages — Public & Advertiser to view active packages
adRouter.get('/packages',
  asyncHandler(async (req: Request, res: Response) => {
    const packages = await prisma.adPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })
    res.json({ success: true, data: packages })
  })
)

// 2. POST /bookings — Advertiser to book an ad slot
adRouter.post('/bookings',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: any, res: Response) => {
    const { packageId, siteId, imageUrl, linkUrl, startDate } = req.body

    // Validasi: package exists dan aktif
    const pkg = await prisma.adPackage.findUnique({ where: { id: packageId } })
    if (!pkg || !pkg.isActive) {
      return res.status(400).json({ success: false, message: 'Paket iklan tidak ditemukan atau tidak aktif' })
    }

    // Validasi: site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return res.status(400).json({ success: false, message: 'Site tidak ditemukan' })
    }

    // Validasi: startDate tidak di masa lalu
    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (start < today) {
      return res.status(400).json({ success: false, message: 'Tanggal mulai tidak boleh di masa lalu' })
    }

    // Auto-set endDate dari package durationDays
    const computedEndDate = new Date(start)
    computedEndDate.setDate(computedEndDate.getDate() + pkg.durationDays)

    const booking = await prisma.adBooking.create({
      data: {
        userId: req.user.userId,
        siteId,
        packageId,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        startDate: start,
        endDate: computedEndDate,
        paymentStatus: 'PENDING',
        status: 'PENDING_REVIEW'
      }
    })
    res.status(201).json({ success: true, data: booking })
  })
)

// 3. GET /bookings/my — Advertiser to view their own bookings
adRouter.get('/bookings/my',
  requireAuth,
  requireRole(['advertiser']),
  asyncHandler(async (req: any, res: Response) => {
    const bookings = await prisma.adBooking.findMany({
      where: { userId: req.user.userId },
      include: { package: true, site: true },
      orderBy: { createdAt: 'desc' }
    })
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

    // Ownership check: hanya pemilik booking yang bisa upload bukti bayar
    const existing = await prisma.adBooking.findUnique({ where: { id } })
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' })
    }

    // Validasi: hanya booking dengan paymentStatus PENDING yang bisa di-update
    if (existing.paymentStatus !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Bukti bayar sudah diupload atau booking sudah diproses' })
    }

    if (!paymentProof) {
      return res.status(400).json({ success: false, message: 'URL bukti bayar wajib diisi' })
    }

    const booking = await prisma.adBooking.update({
      where: { id },
      data: {
        paymentProof,
        paymentStatus: 'VERIFYING'
      }
    })
    res.json({ success: true, data: booking })
  })
)

// 5. POST /packages — Superadmin only to create a new ad package
adRouter.post('/packages',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, slot, allowedFormat, durationDays, price, description } = req.body
    const pkg = await prisma.adPackage.create({
      data: {
        name,
        slot,
        allowedFormat: allowedFormat || 'ALL',
        durationDays: parseInt(durationDays),
        price: parseFloat(price),
        description: description || null
      }
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
    const pkg = await prisma.adPackage.update({
      where: { id },
      data: {
        name,
        slot,
        allowedFormat,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        price: price ? parseFloat(price) : undefined,
        description,
        isActive
      }
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
    await prisma.adPackage.delete({
      where: { id }
    })
    res.json({ success: true, message: 'Package deleted successfully' })
  })
)

// 8. GET /bookings/all — Superadmin only to view all incoming ad bookings
adRouter.get('/bookings/all',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const bookings = await prisma.adBooking.findMany({
      include: { package: true, site: true, user: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: bookings })
  })
)

// 9. POST /bookings/:id/approve — Superadmin only to approve a booking and auto-sync active ad banner
adRouter.post('/bookings/:id/approve',
  requireAuth,
  requireRole(['superadmin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const booking = await prisma.adBooking.findUnique({
      where: { id },
      include: { package: true }
    })
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan' })
    }

    // Validasi: hanya booking yang menunggu verifikasi yang bisa di-approve
    if (booking.paymentStatus !== 'VERIFYING') {
      return res.status(400).json({
        success: false,
        message: 'Booking belum menunggu verifikasi pembayaran'
      })
    }

    // Validasi overlap: non-leaderboard slot tidak boleh ada booking aktif yang tanggalnya overlap
    if (booking.package.slot !== 'leaderboard') {
      const overlapping = await prisma.adBooking.findFirst({
        where: {
          siteId: booking.siteId,
          status: 'ACTIVE',
          id: { not: booking.id },
          package: { slot: booking.package.slot },
          startDate: { lte: booking.endDate },
          endDate: { gte: booking.startDate },
        },
        include: { package: true }
      })
      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: `Slot "${booking.package.slot}" sudah ditempati booking lain (${overlapping.id}) pada rentang tanggal ${overlapping.startDate.toISOString().slice(0, 10)} — ${overlapping.endDate.toISOString().slice(0, 10)}. Tolak atau tunggu hingga booking tersebut berakhir.`
        })
      }
    }

    // Update booking status
    const updatedBooking = await prisma.adBooking.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        status: 'ACTIVE'
      }
    })

    // AUTO-INTEGRATION: Sync to active Advertisement table
    const adData = {
      imageUrl: booking.imageUrl,
      linkUrl: booking.linkUrl,
      code: null,
      isActive: true,
      impressions: 0,
      clicks: 0,
      bookingId: booking.id
    }

    if (booking.package.slot === 'leaderboard') {
      // Leaderboard: ADD to carousel (create new row, don't replace)
      const maxOrder = await prisma.advertisement.aggregate({
        where: { siteId: booking.siteId, slot: 'leaderboard' },
        _max: { order: true }
      })
      await prisma.advertisement.create({
        data: {
          siteId: booking.siteId,
          slot: 'leaderboard',
          ...adData,
          order: (maxOrder._max.order ?? -1) + 1
        }
      })
    } else {
      // Other slots: REPLACE existing (find-first-then-update-or-create)
      const existing = await prisma.advertisement.findFirst({
        where: { siteId: booking.siteId, slot: booking.package.slot }
      })
      if (existing) {
        await prisma.advertisement.update({
          where: { id: existing.id },
          data: adData
        })
      } else {
        await prisma.advertisement.create({
          data: {
            siteId: booking.siteId,
            slot: booking.package.slot,
            ...adData
          }
        })
      }
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
    const booking = await prisma.adBooking.update({
      where: { id },
      data: {
        paymentStatus: 'REJECTED',
        status: 'REJECTED',
        rejectionNotes: rejectionNotes || null
      }
    })
    res.json({ success: true, data: booking })
  })
)