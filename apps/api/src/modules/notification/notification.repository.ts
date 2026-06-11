import { prisma } from '../../db/client'

export async function createNotification(data: {
  userId: string;
  siteId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({ data })
  return notification
}

export async function findUserNotifications(
  userId: string,
  siteId: string,
  opts: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = opts
  const where = { userId, siteId }
  
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.notification.count({ where })
  ])
  
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })
}

export async function markAllAsRead(userId: string, siteId: string) {
  return prisma.notification.updateMany({
    where: { userId, siteId, isRead: false },
    data: { isRead: true }
  })
}

export async function getUnreadCount(userId: string, siteId: string) {
  return prisma.notification.count({
    where: { userId, siteId, isRead: false }
  })
}
