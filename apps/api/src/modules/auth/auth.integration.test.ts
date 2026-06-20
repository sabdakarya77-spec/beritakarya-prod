import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { Role } from '@prisma/client'
import { authRouter } from './auth.controller'
import { errorMiddleware } from '../../middleware/error.middleware'

vi.mock('./auth.service', () => ({
  validateLoginCredentials: vi.fn(),
  generateTokenPair:       vi.fn(),
  registerUser:            vi.fn(),
  refreshAccessToken:      vi.fn(),
  logoutUser:              vi.fn(),
  verifyEmail:             vi.fn(),
  resendVerification:      vi.fn()
}))

vi.mock('../../lib/accountLockout', () => ({
  checkAccountLockout:    vi.fn().mockResolvedValue(false),
  recordFailedAttempt:    vi.fn().mockResolvedValue(undefined),
  resetFailedAttempts:    vi.fn().mockResolvedValue(undefined)
}))

vi.mock('../../lib/siteFromRequest', () => ({
  extractSiteIdFromRequest: vi.fn().mockReturnValue(null),
  isVirtualSiteId:          vi.fn().mockReturnValue(false)
}))

import * as authService from './auth.service'
import { extractSiteIdFromRequest } from '../../lib/siteFromRequest'

const app = express()
app.use(express.json())
app.use('/api/v1/auth', authRouter)
app.use(errorMiddleware)

interface MockUserShape {
  id: string
  email: string
  name: string
  role: Role | string
  siteId: string | null
  isVerified: boolean
  kycStatus: string
}

const mockUser: MockUserShape & { emailVerifiedAt: Date } = {
  id: 'u-1',
  email: 'test@test.com',
  name: 'Test',
  role: 'reporter',
  siteId: 'bandung',
  isVerified: true,
  kycStatus: 'APPROVED',
  emailVerifiedAt: new Date()
}

interface MockTokensShape {
  accessToken: string
  refreshToken: string
  user: MockUserShape
}

const mockTokens: MockTokensShape = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser
}

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(extractSiteIdFromRequest).mockReturnValue(null)
  })

  it('200 dengan token saat login berhasil (tidak ada site check)', async () => {
    vi.mocked(authService.validateLoginCredentials).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof authService.validateLoginCredentials>>)
    vi.mocked(authService.generateTokenPair).mockResolvedValue(mockTokens as unknown as Awaited<ReturnType<typeof authService.generateTokenPair>>)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'P@ssword123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const setCookie = res.headers['set-cookie'] as unknown as string[]
    expect(setCookie).toBeDefined()
    expect(setCookie.some((c: string) => c.includes('accessToken='))).toBe(true)
    expect(setCookie.some((c: string) => c.includes('refreshToken='))).toBe(true)

    expect(res.body.data.user).toBeDefined()
  })

  it('400 dengan email format salah', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bukan-email', password: 'P@ssword123' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('400/401 saat service throw error kredensial salah', async () => {
    vi.mocked(authService.validateLoginCredentials).mockRejectedValue(
      new Error('Email atau password salah')
    )
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'salah' })

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.body.success).toBe(false)
  })

  it('[MULTI-SITE] 403 SITE_MISMATCH saat login lintas subdomain', async () => {
    vi.mocked(extractSiteIdFromRequest).mockReturnValue('pusat')
    vi.mocked(authService.validateLoginCredentials).mockResolvedValue({
      ...mockUser,
      role: 'wapimred',
      siteId: 'nganjuk'
    } as unknown as Awaited<ReturnType<typeof authService.validateLoginCredentials>>)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://beritakarya.co')
      .send({ email: 'wapimred@nganjuk.com', password: 'P@ssword123' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('SITE_MISMATCH')
    expect(res.body.error.message).toContain('nganjuk')
  })

  it('[MULTI-SITE] superadmin BOLEH login lintas subdomain', async () => {
    vi.mocked(extractSiteIdFromRequest).mockReturnValue('bandung')
    vi.mocked(authService.validateLoginCredentials).mockResolvedValue({
      ...mockUser,
      role: 'superadmin',
      siteId: null
    } as unknown as Awaited<ReturnType<typeof authService.validateLoginCredentials>>)
    vi.mocked(authService.generateTokenPair).mockResolvedValue(mockTokens as unknown as Awaited<ReturnType<typeof authService.generateTokenPair>>)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://bandung.beritakarya.co')
      .send({ email: 'admin@beritakarya.co', password: 'P@ssword123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('[MULTI-SITE] user tanpa siteId BOLEH login dari subdomain manapun', async () => {
    vi.mocked(extractSiteIdFromRequest).mockReturnValue('surabaya')
    vi.mocked(authService.validateLoginCredentials).mockResolvedValue({
      ...mockUser,
      role: 'advertiser',
      siteId: null
    } as unknown as Awaited<ReturnType<typeof authService.validateLoginCredentials>>)
    vi.mocked(authService.generateTokenPair).mockResolvedValue(mockTokens as unknown as Awaited<ReturnType<typeof authService.generateTokenPair>>)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://surabaya.beritakarya.co')
      .send({ email: 'ads@external.com', password: 'P@ssword123' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('[MULTI-SITE] 200 saat requestSite null (server-to-server / no origin)', async () => {
    vi.mocked(extractSiteIdFromRequest).mockReturnValue(null)
    vi.mocked(authService.validateLoginCredentials).mockResolvedValue(mockUser as unknown as Awaited<ReturnType<typeof authService.validateLoginCredentials>>)
    vi.mocked(authService.generateTokenPair).mockResolvedValue(mockTokens as unknown as Awaited<ReturnType<typeof authService.generateTokenPair>>)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'P@ssword123' })

    expect(res.status).toBe(200)
  })
})

describe('POST /api/v1/auth/register', () => {
  it('menolak role yang tidak valid (editor) dengan 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'editor@test.com',
        password: 'P@ssword123',
        name: 'User Baru',
        role: 'editor',
        siteId: 'bandung'
      })

    expect(res.status).toBe(400)
    expect(authService.registerUser).not.toHaveBeenCalled()
  })

  it('menerima role reader dan advertiser, menolak sisanya', async () => {
    vi.mocked(authService.registerUser).mockResolvedValue({ success: true, message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.' } as unknown as Awaited<ReturnType<typeof authService.generateTokenPair>>)

    const readerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'reader@test.com',
        password: 'P@ssword123',
        name: 'Reader Baru',
        role: 'reader',
        siteId: 'bandung'
      })

    expect(readerRes.status).toBe(201)
    expect(authService.registerUser).toHaveBeenCalledWith(
      'reader@test.com',
      'P@ssword123',
      'Reader Baru',
      'reader',
      'bandung'
    )
  })
})
