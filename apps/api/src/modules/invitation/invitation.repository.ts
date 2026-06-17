import { prisma } from '../../db/client'
import { Role, Prisma } from '@prisma/client'
import { parsePagination, buildPaginatedResponse } from '@beritakarya/utils'

// ─── Invitation CRUD ──────────────────────────────────────────────────────────

export async function findInvitationByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    include: {
      invitedByUser: {
        select: { name: true, email: true, siteId: true },
      },
    },
  })
}

export async function findPendingInvitation(email: string) {
  return prisma.invitation.findFirst({
    where: {
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
}

export async function findInvitations(
  where: Record<string, unknown>,
  params: { page?: number; limit?: number } = {}
) {
  const { page, limit, skip } = parsePagination(params)
  const [items, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        invitedByUser: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.invitation.count({ where }),
  ])
  return buildPaginatedResponse(items, total, page, limit)
}

export async function createInvitation(data: {
  email: string
  token: string
  role: Role
  siteId: string | null
  invitedBy: string
  expiresAt: Date
}) {
  return prisma.invitation.create({
    data: data as unknown as Parameters<typeof prisma.invitation.create>[0]['data'],
    include: {
      invitedByUser: {
        select: { name: true, email: true },
      },
    },
  })
}

export async function markInvitationAccepted(id: string) {
  return prisma.invitation.update({
    where: { id },
    data: { acceptedAt: new Date() },
  })
}

export async function deleteInvitation(id: string) {
  return prisma.invitation.delete({ where: { id } })
}

// ─── User Operations (for invitation accept flow) ────────────────────────────

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email },
    select: { id: true, deletedAt: true },
  })
}

export async function createAuditLog(data: {
  userId: string
  siteId: string
  action: string
  entityType: string
  entityId: string
  newValue?: Prisma.InputJsonValue
}) {
  return prisma.auditLog.create({ data })
}
