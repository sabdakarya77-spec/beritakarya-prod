import { prisma } from '../db/client'
import { logger } from '../lib/logger'

/**
 * ad-expiry.ts
 *
 * Cron job yang berjalan setiap jam untuk:
 * 1. Mengubah status AdBooking yang endDate-nya sudah lewat dari ACTIVE → COMPLETED
 * 2. Menonaktifkan Advertisement slot yang terkait
 *
 * Dipanggil via POST /api/cron/ad-expiry
 */
export async function runAdExpiry() {
  const now = new Date()

  // Cari semua booking ACTIVE yang sudah lewat endDate
  const expiredBookings = await prisma.adBooking.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now },
    },
    include: { package: true },
  })

  let expiredCount = 0

  for (const booking of expiredBookings) {
    try {
      // 1. Set booking ke COMPLETED
      await prisma.adBooking.update({
        where: { id: booking.id },
        data: { status: 'COMPLETED' },
      })

      // 2. Nonaktifkan Advertisement slot terkait
      //    Gunakan bookingId untuk link langsung, fallback ke imageUrl match
      let adv = await prisma.advertisement.findFirst({
        where: {
          bookingId: booking.id,
          isActive: true,
        },
      })

      // Fallback: jika bookingId belum di-backfill (data lama), coba match via imageUrl
      if (!adv) {
        adv = await prisma.advertisement.findFirst({
          where: {
            siteId: booking.siteId,
            slot: booking.package.slot,
            imageUrl: booking.imageUrl,
            isActive: true,
          },
        })
      }

      if (adv) {
        await prisma.advertisement.update({
          where: { id: adv.id },
          data: { isActive: false },
        })
      }

      expiredCount++
    } catch (err) {
      logger.error(`[AdExpiry] Failed to process booking ${booking.id}:`, err)
    }
  }

  logger.info(`[AdExpiry] Processed ${expiredCount}/${expiredBookings.length} expired bookings`)
  return { expired: expiredCount, total: expiredBookings.length }
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
