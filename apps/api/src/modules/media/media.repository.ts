import { prisma } from '../../db/client'

export async function createMedia(data: {
  url: string;
  thumbUrl: string;
  blurHash?: string;
  width: number;
  height: number;
  originalFormat: string;
  size: number;
  userId: string;
  siteId?: string;
  altText?: string;
  caption?: string;
  credit?: string;
  dominantColor?: string;
}) {
  return prisma.media.create({ data })
}

export async function findMediaBySite(
  siteId: string, 
  page: number = 1, 
  limit: number = 30,
  userId?: string
) {
  const where: any = { siteId }
  if (userId) {
    where.userId = userId
  }
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.media.count({ where })
  ])
  
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function findMediaById(id: string) {
  return prisma.media.findUnique({ where: { id } })
}

export async function updateMedia(id: string, data: Partial<{ altText: string; caption: string; credit: string }>) {
  return prisma.media.update({
    where: { id },
    data
  })
}

export async function deleteMedia(id: string) {
  return prisma.media.delete({ where: { id } })
}
