import { prisma } from '../../db/client'
import { PaymentStatus } from '@prisma/client'
import type { Prisma, AdStatus } from '@prisma/client'
import { parsePagination, buildPaginatedResponse } from '@beritakarya/utils'

// ─── Advertisement CRUD ───────────────────────────────────────────────────────

export async function findAdById(id: string) {
  return prisma.advertisement.findUnique({ where: { id } })
}

export async function findActiveAdsBySite(siteId: string) {
  return prisma.advertisement.findMany({
    where: { siteId, isActive: true },
    orderBy: { order: 'asc' },
  })
}

export async function findAdsBySite(siteId: string, params: { page?: number; limit?: number } = {}) {
  const { page, limit, skip } = parsePagination(params, { limit: 50 })
  const [items, total] = await Promise.all([
    prisma.advertisement.findMany({
      where: { siteId },
      skip,
      take: limit,
      orderBy: [{ slot: 'asc' }, { order: 'asc' }],
    }),
    prisma.advertisement.count({ where: { siteId } }),
  ])
  return buildPaginatedResponse(items, total, page, limit)
}

export async function createAd(data: {
  siteId: string
  slot: string
  code?: string | null
  imageUrl?: string | null
  imageUrlTablet?: string | null
  imageUrlMobile?: string | null
  // New multi‑size fields (optional)
  imageUrlTabletAlt?: string | null
  imageUrlMobileAlt?: string | null
  // A/B testing fields (optional)
  variantAUrl?: string | null
  variantBUrl?: string | null
  winnerVariant?: string | null
  linkUrl?: string | null
  animationEffect?: string | null
  isActive?: boolean
  order?: number
  bookingId?: string | null
}) {
  return prisma.advertisement.create({
    data,
    select: {
      id: true,
      slot: true,
      code: true,
      imageUrl: true,
      imageUrlTablet: true,
      imageUrlMobile: true,
      imageUrlTabletAlt: true,
      imageUrlMobileAlt: true,
      variantAUrl: true,
      variantBUrl: true,
      winnerVariant: true,
      linkUrl: true,
      animationEffect: true,
      isActive: true,
      order: true,
      impressions: true,
      clicks: true,
      createdAt: true,
    },
  })
}

export async function updateAd(id: string, data: Prisma.AdvertisementUpdateInput) {
  return prisma.advertisement.update({
    where: { id },
    data,
    select: {
      id: true,
      slot: true,
      code: true,
      imageUrl: true,
      imageUrlTablet: true,
      imageUrlMobile: true,
      // new fields
      imageUrlTabletAlt: true,
      imageUrlMobileAlt: true,
      variantAUrl: true,
      variantBUrl: true,
      winnerVariant: true,
      linkUrl: true,
      isActive: true,
      order: true,
      impressions: true,
      clicks: true,
      createdAt: true,
    },
  })
}

export async function deleteAd(id: string) {
  return prisma.advertisement.delete({ where: { id } })
}

export async function incrementAdMetric(id: string, field: 'impressions' | 'clicks') {
  return prisma.advertisement.update({
    where: { id },
    data: { [field]: { increment: 1 } },
  })
}

export async function getNextOrder(siteId: string, slot: string) {
  const result = await prisma.advertisement.aggregate({
    where: { siteId, slot },
    _max: { order: true },
  })
  return (result._max.order ?? -1) + 1
}

export async function reorderAds(items: { id: string; order: number }[]) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.advertisement.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  )
}

// ─── Ad Packages ──────────────────────────────────────────────────────────────

export async function findActivePackages() {
  return prisma.adPackage.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  })
}

export async function findPackageById(id: string) {
  return prisma.adPackage.findUnique({ where: { id } })
}

export async function createPackage(data: {
  name: string
  slot: string
  allowedFormat?: string
  durationDays: number
  price: number
  description?: string | null
}) {
  return prisma.adPackage.create({ data })
}

export async function updatePackage(id: string, data: Prisma.AdPackageUpdateInput) {
  return prisma.adPackage.update({ where: { id }, data })
}

export async function deletePackage(id: string) {
  return prisma.adPackage.delete({ where: { id } })
}

// ─── Ad Bookings ──────────────────────────────────────────────────────────────

export async function findBookingById<T extends Record<string, boolean> | undefined>(id: string, include?: T) {
  return prisma.adBooking.findUnique({ where: { id }, include }) as Promise<Record<string, unknown>>
}

export async function findBookingsByUser(userId: string) {
  return prisma.adBooking.findMany({
    where: { userId },
    include: { package: true, site: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findAllBookings() {
  return prisma.adBooking.findMany({
    include: { package: true, site: true, user: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createBooking(data: {
  userId: string
  siteId: string
  packageId: string
  imageUrl?: string | null
  imageUrlTablet?: string | null
  imageUrlMobile?: string | null
  linkUrl?: string | null
  animationEffect?: string | null
  startDate: Date
  endDate: Date
  paymentStatus?: PaymentStatus
  status?: AdStatus
}) {
  return prisma.adBooking.create({ data })
}

export async function updateBooking(id: string, data: Prisma.AdBookingUpdateInput) {
  return prisma.adBooking.update({ where: { id }, data })
}

export async function findOverlappingBooking(siteId: string, slot: string, excludeId: string, startDate: Date, endDate: Date) {
  return prisma.adBooking.findFirst({
    where: {
      siteId,
      status: 'ACTIVE',
      id: { not: excludeId },
      package: { slot },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: { package: true },
  })
}

// ─── Ad Slot Management (for booking approval) ───────────────────────────────

export async function findAdBySiteAndSlot(siteId: string, slot: string) {
  return prisma.advertisement.findFirst({ where: { siteId, slot } })
}

export async function createOrUpdateAdForSlot(siteId: string, slot: string, data: Prisma.AdvertisementUpdateInput) {
  const existing = await findAdBySiteAndSlot(siteId, slot)
  if (existing) {
    return prisma.advertisement.update({ where: { id: existing.id }, data })
  }
  return prisma.advertisement.create({ data: { siteId, slot, ...data } as Prisma.AdvertisementCreateInput })
}

// ─── Ad Event Logs (Time-Series Analytics) ───────────────────────────────────

export async function getAdStatsByBooking(bookingId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Raw SQL: group by date + action, fill missing days with zeros
  const rows = await prisma.$queryRaw<{ date: string; action: string; count: bigint }[]>`
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
      "action",
      COUNT(*) as count
    FROM "AdEventLog"
    WHERE "bookingId" = ${bookingId}
      AND "createdAt" >= ${startDate}
    GROUP BY date, "action"
    ORDER BY date ASC
  `

  // Build date map with zero-fill
  const impressionsMap: Record<string, number> = {}
  const clicksMap: Record<string, number> = {}

  const now = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().split('T')[0]
    impressionsMap[key] = 0
    clicksMap[key] = 0
  }

  for (const row of rows) {
    const count = Number(row.count)
    if (row.action === 'impression') {
      impressionsMap[row.date] = count
    } else if (row.action === 'click') {
      clicksMap[row.date] = count
    }
  }

  const impressions = Object.entries(impressionsMap).map(([date, value]) => ({ date, value }))
  const clicks = Object.entries(clicksMap).map(([date, value]) => ({ date, value }))

  // Get totals from booking
  const booking = await prisma.adBooking.findUnique({
    where: { id: bookingId },
    select: { impressions: true, clicks: true },
  })

  const totalImpressions = booking?.impressions ?? impressions.reduce((s, d) => s + d.value, 0)
  const totalClicks = booking?.clicks ?? clicks.reduce((s, d) => s + d.value, 0)

  return {
    impressions,
    clicks,
    total: {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    },
  }
}
