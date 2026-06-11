import { prisma } from '../../db/client'

export async function subscribe(email: string, siteId: string) {
  return prisma.newsletterSubscriber.upsert({
    where: {
      siteId_email: { siteId, email }
    },
    update: {
      isActive: true
    },
    create: {
      email,
      siteId
    }
  })
}

export async function getSubscribers(siteId: string) {
  return prisma.newsletterSubscriber.findMany({
    where: { siteId, isActive: true },
    orderBy: { createdAt: 'desc' }
  })
}
