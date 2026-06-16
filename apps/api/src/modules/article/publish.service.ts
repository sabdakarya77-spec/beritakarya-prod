import { prisma } from '../../db/client'
import { logger } from '../../lib/logger'
import { googleIndexingService } from '../../services/google-indexing.service'
import { sendNotification } from '../notification/notification.controller'
import * as repo from './article.repository'
import * as searchService from './search.service'
import { deleteCache } from '../../lib/redis'

type PublishActor = { userId: string; auditAction?: string }

/**
 * Shared publish side-effects (DB status, notify, index, cache).
 * Used by manual publish and scheduled auto-publish.
 */
export async function finalizeArticlePublish(
  id: string,
  siteId: string,
  articleBefore: { id: string; title: string; slug: string; authorId: string; status: string },
  actor: PublishActor
) {
  const existingArticle = await repo.findArticleById(id, siteId)
  const updated = await repo.updateArticle(id, siteId, {
    status: 'published',
    publishedAt: existingArticle?.publishedAt || new Date()
  } as any)

  await repo.createAuditLog({
    userId: actor.userId,
    siteId,
    action: actor.auditAction || 'post.publish',
    entityType: 'post',
    entityId: id,
    oldValue: articleBefore,
    newValue: updated
  })

  await sendNotification({
    userId: updated.authorId,
    siteId,
    type: 'post_reviewed',
    title: 'Post Berhasil Terbit!',
    message: `Selamat! Post "${updated.title}" Anda telah disetujui dan terbit sekarang.`,
    link: `/${siteId}/artikel/${updated.slug}`
  })

  prisma.site
    .findUnique({ where: { id: siteId } })
    .then((site) => {
      if (!site) return
      const domain = site.domain || 'beritakarya.co'
      const protocol =
        domain.includes('localhost') || domain.includes('127.0.0.1') ? 'http' : 'https'
      const articleUrl = `${protocol}://${domain}/artikel/${updated.slug}`
      return googleIndexingService.submitUrl(siteId, articleUrl, 'URL_UPDATED')
    })
    .catch((err) => logger.error('Auto Google Indexing API trigger error:', err))

  searchService.indexArticle(updated).catch((err) =>
    logger.error('Failed to index article on publish:', err)
  )
  deleteCache(`article:${siteId}:${updated.slug}`).catch((err) =>
    logger.error('Failed to invalidate article cache on publish:', err)
  )

  return updated
}
