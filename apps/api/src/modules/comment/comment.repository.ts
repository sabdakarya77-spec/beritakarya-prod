import { prisma } from '../../db/client'

export async function createComment(data: {
  content: string
  articleId: string
  siteId: string
  authorId?: string
  authorName?: string
  authorEmail?: string
  parentId?: string
}) {
  return prisma.comment.create({
    data,
    include: {
      user: { select: { name: true } }
    }
  })
}

export async function findCommentsByArticle(articleId: string, siteId: string) {
  return prisma.comment.findMany({
    where: {
      articleId,
      siteId,
      status: 'approved'
    },
    include: {
      user: { select: { name: true } },
      replies: {
        where: { status: 'approved' },
        include: { user: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function findPendingComments(siteId: string) {
  return prisma.comment.findMany({
    where: { siteId, status: 'pending' },
    include: {
      article: { select: { title: true } },
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateCommentStatus(id: string, status: string) {
  return prisma.comment.update({
    where: { id },
    data: { status }
  })
}

export async function deleteComment(id: string) {
  return prisma.comment.delete({
    where: { id }
  })
}
