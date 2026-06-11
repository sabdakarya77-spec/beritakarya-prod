import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn()
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}))



import { prisma } from '../../db/client'
import { loginUser } from './auth.service'
import bcrypt from 'bcryptjs'

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login berhasil dengan kredensial valid', async () => {
    const hash = await bcrypt.hash('password123', 10)
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-1', email: 'test@test.com', name: 'Test',
      role: 'reporter', siteId: 'bandung', passwordHash: hash,
      createdAt: new Date(), updatedAt: new Date()
    } as any)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({} as any)

    const result = await loginUser('test@test.com', 'password123')
    expect(result.accessToken).toBeDefined()
    expect(result.user.email).toBe('test@test.com')
  })

  it('login gagal dengan password salah', async () => {
    const hash = await bcrypt.hash('benar123', 10)
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-1', email: 'test@test.com', passwordHash: hash
    } as any)

    await expect(loginUser('test@test.com', 'salah123'))
      .rejects.toThrow('Email atau password salah')
  })

  it('login gagal jika user tidak ditemukan', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
    await expect(loginUser('tidak@ada.com', 'password123'))
      .rejects.toThrow('Email atau password salah')
  })
})