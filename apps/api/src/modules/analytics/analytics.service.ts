import { prisma } from '../../db/client'
import { redis } from '../../lib/redis'
import { anonymizeIP } from '@beritakarya/utils'
import crypto from 'crypto'

export async function recordView(data: {
  siteId: string
  articleId?: string
  path: string
  referrer?: string
  ipAddress?: string
  userAgent?: string
}) {
  try {
    // Record the page view in DB
    await prisma.pageView.create({
      data: {
        siteId: data.siteId,
        articleId: data.articleId,
        path: data.path,
        referrer: data.referrer,
        ipAddress: anonymizeIP(data.ipAddress),
        userAgent: data.userAgent
      }
    })

    // Track active reader in Redis (last 5 minutes) - skip if Redis not available
    if (data.ipAddress && data.siteId && redis) {
      const visitorHash = crypto
        .createHash('md5')
        .update(`${data.ipAddress}-${data.userAgent || ''}`)
        .digest('hex')
      
      const now = Date.now()
      const key = `site:${data.siteId}:active_readers`
      
      // Add to sorted set with current timestamp as score
      await redis.zadd(key, now, visitorHash)
      // Cleanup old entries (> 5 mins)
      await redis.zremrangebyscore(key, 0, now - 300000)
      // Set expiry on the whole set
      await redis.expire(key, 305)
    }

    // Increment article view count if articleId is provided
    if (data.articleId) {
      await prisma.article.update({
        where: { id: data.articleId },
        data: { viewCount: { increment: 1 } }
      })
    }
  } catch (error) {
    console.error('Failed to record view:', error)
  }
}

export async function getActiveReaderCount(siteId: string): Promise<number> {
  if (!process.env.REDIS_HOST) return 0
  try {
    const now = Date.now()
    const key = `site:${siteId}:active_readers`
    // Cleanup first to be accurate
    await redis.zremrangebyscore(key, 0, now - 300000)
    return await redis.zcard(key)
  } catch {
    return 0
  }
}
