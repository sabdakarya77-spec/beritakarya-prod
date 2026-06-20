import { vi, afterAll } from 'vitest'

// Set test environment variables
process.env.NODE_ENV      = 'test'
process.env.JWT_SECRET    = 'test-secret-key-minimal-32-chars-long'
process.env.RESET_SECRET  = 'test-reset-secret-key-minimal-32-chars-long'
process.env.DATABASE_URL  = 'postgresql://postgres:postgres@localhost:5432/beritakarya_test'
process.env.API_URL       = 'http://localhost:3001'

// Mock logger to keep test output clean
vi.mock('../lib/logger', () => ({
  logger: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

afterAll(async () => {
  // Disconnect Prisma after all tests
  try {
    const { prisma } = await import('../db/client.js')
    await prisma.$disconnect()
  } catch {}
})
