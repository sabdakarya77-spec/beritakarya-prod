import { PrismaClient } from '@prisma/client'
import { env } from '../lib/env'
import { logger } from '../lib/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.DIRECT_URL || env.DATABASE_URL,
      },
    },
    log: env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error', 'info'],
  })

// Configure database connection with error handling
prisma.$connect().then(() => {
  logger.info('Database connected successfully')
}).catch((error) => {
  logger.error('Database connection failed:', error)
  if (env.NODE_ENV !== 'test') {
    process.exit(1)
  }
})

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
