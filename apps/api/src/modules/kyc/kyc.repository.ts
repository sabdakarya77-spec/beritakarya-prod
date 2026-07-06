import { prisma } from '../../db/client'
import { KycStatus } from '@prisma/client'
import type { Prisma, Role } from '@prisma/client'
import { parsePagination, buildPaginatedResponse } from '@beritakarya/utils'

// ─── KYC User Queries ────────────────────────────────────────────────────────

export async function findKycUsers(
  siteId: string,
  filters: { search?: string; status?: string },
  params: { page?: number; limit?: number } = {}
) {
  const { page, limit, skip } = parsePagination(params)

  const where: Prisma.UserWhereInput = { siteId, deletedAt: null }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.status === 'pending') {
    where.kycStatus = 'PENDING'
  } else if (filters.status === 'verified') {
    where.kycStatus = 'APPROVED'
  } else if (filters.status === 'rejected') {
    where.kycStatus = 'REJECTED'
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kycSubmittedAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
        kycStatus: true,
        kycNotes: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return buildPaginatedResponse(items, total, page, limit)
}

export async function findUserForKycDetail(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      role: true,
      isVerified: true,
      kycSubmittedAt: true,
      kycReviewedAt: true,
      kycStatus: true,
      kycNotes: true,
      kycDataExpiresAt: true,
      idCardPath: true,
      familyCardPath: true,
    },
  })
}

export async function findUserForKycSubmit(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { isVerified: true, kycAttempts: true, kycLockedUntil: true },
  })
}

export async function findUserForKycVerify(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { siteId: true, kycNotes: true, name: true, role: true },
  })
}

export async function findUserForKycView(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { siteId: true, idCardPath: true, familyCardPath: true },
  })
}

// ─── KYC Stats ───────────────────────────────────────────────────────────────

export async function getKycStats(siteId: string) {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [totalPending, approvedThisWeek, rejectedThisWeek, allVerifiedUsers] =
    await Promise.all([
      prisma.user.count({
        where: { siteId, kycStatus: 'PENDING', deletedAt: null },
      }),
      prisma.user.count({
        where: {
          siteId,
          kycStatus: 'APPROVED',
          kycReviewedAt: { gte: oneWeekAgo },
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          siteId,
          kycStatus: 'REJECTED',
          kycReviewedAt: { gte: oneWeekAgo },
          deletedAt: null,
        },
      }),
      prisma.user.findMany({
        where: {
          siteId,
          kycStatus: 'APPROVED',
          kycSubmittedAt: { not: null },
          kycReviewedAt: { not: null },
          deletedAt: null,
        },
        select: { kycSubmittedAt: true, kycReviewedAt: true },
      }),
    ])

  return { totalPending, approvedThisWeek, rejectedThisWeek, allVerifiedUsers, oneWeekAgo, now }
}

export async function getKycTrendData(siteId: string, oneWeekAgo: Date) {
  return prisma.$queryRaw<{ date: Date; count: number }[]>`
    SELECT
      "kycSubmittedAt"::date as date,
      COUNT(*)::int as count
    FROM "User"
    WHERE "siteId" = ${siteId}
      AND "kycSubmittedAt" >= ${oneWeekAgo}
    GROUP BY "kycSubmittedAt"::date
    ORDER BY date ASC
  `
}

// ─── KYC Updates ─────────────────────────────────────────────────────────────

export async function updateKycSubmission(
  userId: string,
  data: {
    bio?: string
    idCardPath: string
    familyCardPath?: string | null
    kycNotes: string
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      bio: data.bio,
      idCardPath: data.idCardPath,
      familyCardPath: data.familyCardPath || null,
      kycSubmittedAt: new Date(),
      kycConsentGivenAt: new Date(),
      kycDataExpiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
      isVerified: false,
      kycStatus: 'PENDING',
      kycNotes: data.kycNotes,
    },
  })
}

export async function updateKycVerification(
  userId: string,
  data: {
    isVerified: boolean
    kycStatus: KycStatus
    kycNotes: string
    kycReviewedBy: string
    role?: string
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: data.isVerified,
      kycStatus: data.kycStatus,
      kycNotes: data.kycNotes,
      kycReviewedBy: data.kycReviewedBy,
      kycReviewedAt: new Date(),
      ...(data.role ? { role: data.role as Role } : {}),
    },
  })
}

export async function resetKycLock(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { kycAttempts: 0, kycLockedUntil: null },
  })
}

export async function incrementKycAttempts(userId: string, shouldLock: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      kycAttempts: { increment: 1 },
      ...(shouldLock
        ? { kycLockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        : {}),
    },
  })
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

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

export async function createKycViewLog(data: {
  userId: string
  viewerId: string
  siteId: string
  fileType: string
  ipAddress: string
  userAgent?: string
}) {
  return prisma.kYCViewLog.create({ data })
}

// ─── Admin Notifications ─────────────────────────────────────────────────────

export async function findAdminsBySite(siteId: string | null) {
  const where = siteId
    ? { siteId, role: { in: ['superadmin', 'wapimred', 'kaperwil', 'kabiro'] as Role[] } }
    : { role: { in: ['superadmin'] as Role[] } }
  return prisma.user.findMany({
    where,
    select: { id: true, siteId: true },
  })
}
