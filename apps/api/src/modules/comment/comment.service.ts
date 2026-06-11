import * as repo from './comment.repository'
import { JWTPayload } from '@beritakarya/types'

export async function addComment(
  articleId: string, 
  siteId: string, 
  input: { content: string; parentId?: string },
  user: JWTPayload
) {
  return repo.createComment({
    ...input,
    articleId,
    siteId,
    authorId: user.userId
  })
}

export async function getArticleComments(articleId: string, siteId: string) {
  return repo.findCommentsByArticle(articleId, siteId)
}

export async function getModerationQueue(siteId: string) {
  return repo.findPendingComments(siteId)
}

export async function approveComment(id: string) {
  return repo.updateCommentStatus(id, 'approved')
}

export async function rejectComment(id: string) {
  return repo.updateCommentStatus(id, 'spam')
}

export async function deleteComment(id: string, _siteId: string, _user: JWTPayload) {
  // Logic to ensure user has access (author of article or pimred/superadmin)
  return repo.deleteComment(id)
}
