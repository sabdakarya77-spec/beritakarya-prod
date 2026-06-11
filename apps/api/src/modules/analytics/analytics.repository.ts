import { prisma } from '../../db/client'

export async function getTrafficStats(siteId: string, days: number = 7, authorId?: string) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const views = await prisma.pageView.groupBy({
    by: ['createdAt'],
    where: {
      siteId,
      createdAt: { gte: startDate },
      ...(authorId && { article: { authorId } })
    },
    _count: {
      id: true
    }
  })

  // Group by day since createdAt is a full timestamp
  const dailyData: Record<string, number> = {}
  
  // Initialize last X days
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyData[key] = 0
  }

  views.forEach((v: any) => {
    const key = v.createdAt.toISOString().split('T')[0]
    if (dailyData[key] !== undefined) {
      dailyData[key] += v._count.id
    }
  })

  // Convert to array for Recharts
  return Object.entries(dailyData)
    .map(([date, count]) => ({
      date,
      views: count
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
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
      category: { select: { name: true } }
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
