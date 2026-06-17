import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

vi.mock('../../db/client', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst:  vi.fn(),
      create:     vi.fn()
    },
    refreshToken: {
      create:     vi.fn(),
      findUnique: vi.fn(),
      delete:     vi.fn(),
      deleteMany: vi.fn()
    },
    blacklistedToken: {
      findUnique: vi.fn(),
      create:     vi.fn()
    }
  }
}))



import { Role } from '@prisma/client'
import type { User, RefreshToken, BlacklistedToken } from '@prisma/client'
import { prisma } from '../../db/client'
import { loginUser, registerUser, refreshAccessToken, logoutUser } from './auth.service'

const mockUser = async (overrides = {}) => {
  const hash = await bcrypt.hash('password123', 10)
  return {
    id: 'u-1',
    email: 'test@bandung.com',
    name: 'Test User',
    role: Role.reporter,
    siteId: 'bandung',
    passwordHash: hash,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

describe('loginUser', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('berhasil dengan kredensial valid', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(await mockUser() as unknown as User)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({ token: 'rt' } as unknown as RefreshToken)

    const result = await loginUser('test@bandung.com', 'password123')
    expect(result.accessToken).toBeDefined()
    expect(result.refreshToken).toBeDefined()
    expect(result.user.email).toBe('test@bandung.com')
    expect(result.user).not.toHaveProperty('passwordHash')
  })

  it('gagal: email tidak ditemukan', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
    await expect(loginUser('tidak@ada.com', 'password123'))
      .rejects.toThrow('Email atau password salah')
  })

  it('gagal: password salah', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(await mockUser() as unknown as User)
    await expect(loginUser('test@bandung.com', 'salah'))
      .rejects.toThrow('Email atau password salah')
  })
})

describe('registerUser', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('gagal jika email sudah terdaftar', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(await mockUser() as unknown as User)
    await expect(registerUser('test@bandung.com', 'pass123', 'User', Role.reporter, 'bandung'))
      .rejects.toThrow('Email sudah terdaftar')
  })

  it('berhasil register user baru', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(await mockUser() as unknown as User)
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({ token: 'rt' } as unknown as RefreshToken)

    const result = await registerUser('baru@bandung.com', 'Pass123!', 'Baru', Role.reporter, 'bandung')
    expect(result.accessToken).toBeDefined()
  })
})

describe('refreshAccessToken', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('gagal jika token tidak ada di DB', async () => {
    vi.mocked(prisma.blacklistedToken.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null)
    await expect(refreshAccessToken('invalid-token'))
      .rejects.toThrow('Refresh token tidak valid atau sudah expired')
  })

  it('gagal jika token sudah expired', async () => {
    vi.mocked(prisma.blacklistedToken.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      token: 'old',
      userId: 'u-1',
      expiresAt: new Date(Date.now() - 1000),
      user: await mockUser()
    } as unknown as RefreshToken)
    await expect(refreshAccessToken('old'))
      .rejects.toThrow('Refresh token tidak valid atau sudah expired')
  })
})

describe('logoutUser', () => {
  it('menghapus refresh token dari DB', async () => {
    const fakeToken = { id: 'rt-1', token: 'some-refresh-token', userId: 'u-1', expiresAt: new Date() }
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(fakeToken as unknown as RefreshToken)
    vi.mocked(prisma.blacklistedToken.create).mockResolvedValue({} as unknown as BlacklistedToken)
    vi.mocked(prisma.refreshToken.delete).mockResolvedValue(fakeToken as unknown as RefreshToken)

    await logoutUser('u-1', 'some-refresh-token')

    expect(prisma.blacklistedToken.create).toHaveBeenCalled()
    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: 'rt-1' }
    })
  })
})
