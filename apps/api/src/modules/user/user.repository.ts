import { prisma } from '../../db/client'

export async function getTeamStats(siteId: string) {
  const users = await prisma.user.findMany({
    where: { siteId, role: { in: ['reporter', 'kontributor'] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          articles: { where: { status: 'published' } }
        }
      }
    }
  })

  // Get total views per user
  const userStats = await Promise.all(users.map(async (u: any) => {
    const aggregate = await prisma.article.aggregate({
      where: { authorId: u.id, siteId, status: 'published' },
      _sum: { viewCount: true },
      _avg: { wordCount: true }
    })
    
    return {
      ...u,
      publishedCount: u._count.articles,
      totalViews: aggregate._sum.viewCount || 0,
      avgWords: Math.round(aggregate._avg.wordCount || 0),
      isOnline: false // Status online akan diimplementasikan via Heartbeat/WebSocket
    }
  }))

  return userStats.sort((a: any, b: any) => b.publishedCount - a.publishedCount)
}
