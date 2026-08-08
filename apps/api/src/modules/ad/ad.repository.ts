import { prisma } from '../../db/client'
import type { Prisma } from '@prisma/client'
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
  imageUrl?: string | null
  linkUrl?: string | null
  isActive?: boolean
  order?: number
}) {
  return prisma.advertisement.create({
    data,
    select: {
      id: true,
      slot: true,
      imageUrl: true,
      linkUrl: true,
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
      imageUrl: true,
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

// ─── Ad Event Logs ────────────────────────────────────────────────────────────

export async function createAdEventLog(data: {
  adId: string
  siteId: string
  action: 'impression' | 'click'
}) {
  return prisma.adEventLog.create({ data })
}

export async function getAdStatsById(adId: string, days: number = 30) {
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
    WHERE "adId" = ${adId}
      AND "createdAt" >= ${startDate}
    GROUP BY date, "action"
    ORDER BY date ASC
  `

  // Build date map with zero-fill
  const impressionsMap: Record<string, number> = {}
  const clicksMap: Record<string, number> = {}

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

  // Get totals from advertisement
  const ad = await prisma.advertisement.findUnique({
    where: { id: adId },
    select: { impressions: true, clicks: true },
  })

  const totalImpressions = ad?.impressions ?? impressions.reduce((s, d) => s + d.value, 0)
  const totalClicks = ad?.clicks ?? clicks.reduce((s, d) => s + d.value, 0)

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