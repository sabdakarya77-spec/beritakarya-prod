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

  if (users.length === 0) return []

  // Single aggregation query for all users (avoids N+1)
  const userIds = users.map(u => u.id)
  const aggregated = await prisma.article.groupBy({
    by: ['authorId'],
    where: { authorId: { in: userIds }, siteId, status: 'published' },
    _sum: { viewCount: true },
    _avg: { wordCount: true }
  })

  const statsMap = new Map(aggregated.map(a => [a.authorId, a]))

  return users
    .map(u => {
      const agg = statsMap.get(u.id)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        publishedCount: u._count.articles,
        totalViews: agg?._sum?.viewCount || 0,
        avgWords: Math.round(agg?._avg?.wordCount || 0),
        isOnline: false
      }
    })
    .sort((a, b) => b.publishedCount - a.publishedCount)
}
