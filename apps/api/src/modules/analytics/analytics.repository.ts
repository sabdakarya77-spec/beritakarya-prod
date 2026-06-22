import { prisma } from '../../db/client'

export async function getTrafficStats(siteId: string, days: number = 7, authorId?: string) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Use raw query with DATE() to properly group by day
  // Prisma groupBy on createdAt returns one row per unique timestamp, which is wrong
  const rows = authorId
    ? await prisma.$queryRaw<{ date: string; views: bigint }[]>`
        SELECT DATE(pv."createdAt")::text AS date, COUNT(pv.id)::bigint AS views
        FROM "PageView" pv
        INNER JOIN "Article" a ON a.id = pv."articleId"
        WHERE pv."siteId" = ${siteId}
          AND pv."createdAt" >= ${startDate}
          AND a."authorId" = ${authorId}
        GROUP BY DATE(pv."createdAt")
        ORDER BY date ASC
      `
    : await prisma.$queryRaw<{ date: string; views: bigint }[]>`
        SELECT DATE(pv."createdAt")::text AS date, COUNT(pv.id)::bigint AS views
        FROM "PageView" pv
        WHERE pv."siteId" = ${siteId}
          AND pv."createdAt" >= ${startDate}
        GROUP BY DATE(pv."createdAt")
        ORDER BY date ASC
      `

  // Build a map from DB results
  const dbData = new Map(rows.map(r => [r.date, Number(r.views)]))

  // Fill in all days (including zero-view days) for Recharts
  const result: { date: string; views: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    result.push({ date: key, views: dbData.get(key) || 0 })
  }

  return result
}

export async function getTopContent(siteId: string, limit: number = 5, authorId?: string) {
  return prisma.article.findMany({
    where: { 
      siteId, 
      status: 'published',
      ...(authorId && { authorId })
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      categories: { include: { category: { select: { name: true } } } }
    }
  })
}

export async function getEngagementStats(siteId: string, authorId?: string) {
  const [viewStats, shareStats, totalComments] = await Promise.all([
    prisma.article.aggregate({
      where: { siteId, deletedAt: null, ...(authorId && { authorId }) },
      _sum: { viewCount: true }
    }),
    prisma.article.aggregate({
      where: { siteId, deletedAt: null, ...(authorId && { authorId }) },
      _sum: { shareCount: true }
    }),
    prisma.comment.count({
      where: { 
        siteId, 
        status: 'approved',
        ...(authorId && { article: { authorId } })
      }
    })
  ])

  const views = viewStats._sum.viewCount || 0
  const interactions = (shareStats._sum.shareCount || 0) + totalComments
  const rate = views > 0 ? (interactions / views) * 100 : 0

  return {
    views,
    shares: shareStats._sum.shareCount || 0,
    comments: totalComments,
    rate: parseFloat(rate.toFixed(2))
  }
}
