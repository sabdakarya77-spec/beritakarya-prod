import { Router, Request, Response } from 'express'
import { z } from 'zod'
import * as authService from './auth.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { checkAccountLockout, recordFailedAttempt, resetFailedAttempts } from '../../lib/accountLockout'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '../../db/client'
import { env } from '../../lib/env'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import { extractSiteIdFromRequest } from '../../lib/siteFromRequest'
import bcrypt from 'bcryptjs'

export const authRouter: Router = Router()

const getCookieOptions = (isProd: boolean, maxAge: number) => {
  const options: any = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge
  }
  if (isProd && env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN
  }
  return options
}

const getClearCookieOptions = (isProd: boolean) => {
  const options: any = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  }
  if (isProd && env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN
  }
  return options
}

authRouter.get('/me', requireAuth, asyncHandler(async (req: any, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, role: true, siteId: true, isVerified: true, kycStatus: true, kycNotes: true, kycSubmittedAt: true }
  })
  res.json({ success: true, data: { user } })
}))

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Harus mengandung huruf kapital')
    .regex(/[0-9]/, 'Harus mengandung angka')
    .regex(/[^A-Za-z0-9]/, 'Harus mengandung karakter spesial'),
  name: z.string().min(2),
  siteId: z.string().nullable().default(null),
  role: z.enum(['reader', 'advertiser']).optional().default('reader')
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid')
})

const resetPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
  token: z.string(),
  newPassword: z.string()
})

authRouter.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)
  
  // Check account lockout
  if (await checkAccountLockout(email)) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Akun terkunci sementara. Coba lagi dalam 15 menit.'
      }
    })
  }
  
  try {
    // [MULTI-SITE] Validasi kredensial dulu (return user, bukan token)
    const user = await authService.validateLoginCredentials(email, password)

    // [MULTI-SITE] Enforce site-scope: tolak login lintas subdomain
    // - Superadmin: bebas lintas situs
    // - User tanpa siteId (global user): bebas
    // - User dengan siteId: HARUS login dari subdomain situsnya
    const requestSite = extractSiteIdFromRequest(req)
    if (
      user.role !== 'superadmin' &&
      user.siteId &&
      requestSite &&
      user.siteId !== requestSite
    ) {
      logger.warn(
        `[AUTH] Cross-site login blocked: user ${user.email} (site:${user.siteId}, role:${user.role}) attempted login from site ${requestSite}`
      )
      throw new AppError(
        `Akun ini terdaftar di situs "${user.siteId}". Silakan login melalui subdomain ${user.siteId}.beritakarya.co`,
        403,
        'SITE_MISMATCH'
      )
    }

    // Site check passed, generate token pair
    const result = await authService.generateTokenPair(user)
    await resetFailedAttempts(email)
    
    // Set httpOnly cookies
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('accessToken', result.accessToken, getCookieOptions(isProd, 15 * 60 * 1000))
    res.cookie('refreshToken', result.refreshToken, getCookieOptions(isProd, 30 * 24 * 60 * 60 * 1000))

    res.json({ success: true, data: { user: result.user } })
  } catch (error) {
    await recordFailedAttempt(email)
    throw error
  }
}))

authRouter.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body)
  const role = input.role === 'advertiser' ? 'advertiser' : 'reader'
  const result = await authService.registerUser(
    input.email, input.password, input.name,
    role as any, input.siteId
  )
  
  // Set httpOnly cookies
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('accessToken', result.accessToken, getCookieOptions(isProd, 15 * 60 * 1000))
  res.cookie('refreshToken', result.refreshToken, getCookieOptions(isProd, 30 * 24 * 60 * 60 * 1000))

  res.status(201).json({ success: true, data: { user: result.user } })
}))

authRouter.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  let refreshToken = req.body.refreshToken || (req.cookies ? req.cookies.refreshToken : undefined)
  
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' })
  }

  const result = await authService.refreshAccessToken(refreshToken)
  
  // Update cookies
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('accessToken', result.accessToken, getCookieOptions(isProd, 15 * 60 * 1000))
  res.cookie('refreshToken', result.refreshToken, getCookieOptions(isProd, 30 * 24 * 60 * 60 * 1000))

  res.json({ success: true, data: { user: result.user } })
}))

authRouter.post('/logout', asyncHandler(async (req: any, res: Response) => {
  const refreshToken = req.body.refreshToken || (req.cookies ? req.cookies.refreshToken : undefined)
  
  // Clear cookies regardless of auth status
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('accessToken', getClearCookieOptions(isProd))
  res.clearCookie('refreshToken', getClearCookieOptions(isProd))

  // If we have user info from jwtVerify middleware, blacklist the token
  if (refreshToken && req.user?.userId) {
    try {
      await authService.logoutUser(req.user.userId, refreshToken)
    } catch (_err) {
      // Silently ignore - cookie is already cleared
    }
  }
  res.json({ success: true, message: 'Logout berhasil' })
}))

authRouter.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body)
  const result = await authService.forgotPassword(email)
  res.json(result)
}))

// POST /api/v1/auth/change-password - Change password for authenticated user
authRouter.post('/change-password', 
  requireAuth, 
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.userId
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Password saat ini dan password baru wajib diisi' }
      })
    }

    if (!authService.validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus (!@#$%^&*)' }
      })
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User tidak ditemukan' }
      })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Password saat ini tidak correct' }
      })
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    })

    res.json({ success: true, message: 'Password berhasil diubah' })
  })
)

authRouter.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { email, token, newPassword } = resetPasswordSchema.parse(req.body)
  const result = await authService.resetPassword(email, token, newPassword)
  res.json(result)
}))
