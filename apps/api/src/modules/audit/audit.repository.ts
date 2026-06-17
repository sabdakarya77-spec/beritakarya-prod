import { prisma } from '../../db/client'
import type { Prisma } from '@prisma/client'

export async function findAuditLogs(
  siteId: string,
  opts: {
    action?: string
    entityType?: string
    userId?: string
    page?: number
    limit?: number
  } = {}
) {
  const { action, entityType, userId, page = 1, limit = 30 } = opts

  const where: Prisma.AuditLogWhereInput = {
    siteId,
    ...(action && { action: { contains: action, mode: 'insensitive' } }),
    ...(entityType && { entityType }),
    ...(userId && { userId }),
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  // Enrich with user info in-memory to avoid relation constraint
  const userIds = [...new Set(items.map((i) => i.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true, email: true },
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const enriched = items.map((log) => ({
    ...log,
    user: userMap[log.userId] ?? { id: log.userId, name: 'Pengguna Dihapus', role: 'unknown', email: '' },
  }))

  return { items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getAuditStats(siteId: string) {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [total, last7d, byAction] = await Promise.all([
    prisma.auditLog.count({ where: { siteId } }),
    prisma.auditLog.count({ where: { siteId, createdAt: { gte: since7d } } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { siteId },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
  ])

  return {
    total,
    last7d,
    byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
  }
}

export async function findAllAuditLogsForExport(siteId: string) {
  const items = await prisma.auditLog.findMany({
    where: { siteId },
    orderBy: { createdAt: 'desc' },
    take: 1000 // Limit to 1000 for safety
  })

  const userIds = [...new Set(items.map((i) => i.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  })
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return items.map((log) => ({
    ...log,
    user: userMap[log.userId]
  }))
}
