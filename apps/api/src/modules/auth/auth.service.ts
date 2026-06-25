import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../db/client'
import { env } from '../../lib/env'
import type { JWTPayload } from '@beritakarya/types'
import { emailService } from '../../services/email.service'
import { Role } from '@prisma/client'
import { AppError } from '../../utils/AppError'

const ACCESS_SECRET = env.JWT_SECRET
const ACCESS_EXPIRES = env.JWT_ACCESS_EXPIRES
const REFRESH_EXPIRES_DAYS = 7

export function validatePassword(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*]/.test(password)

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  )
}

export async function loginUser(email: string, password: string) {
  const user = await validateLoginCredentials(email, password)
  return generateTokenPair(user)
}

export async function validateLoginCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null }
  })
  if (!user) throw new AppError('Email atau password salah', 401, 'UNAUTHORIZED')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AppError('Email atau password salah', 401, 'UNAUTHORIZED')

  return user
}

export async function registerUser(
  email: string, password: string, name: string,
  role: Role, siteId: string | null
) {
  const normalizedEmail = email.toLowerCase().trim()
  const exists = await prisma.user.findFirst({
    where: { email: normalizedEmail }
  })
  if (exists) throw new AppError('Email sudah terdaftar', 400, 'BAD_REQUEST')

  if (!validatePassword(password)) {
    throw new AppError('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus (!@#$%^&*)', 400, 'BAD_REQUEST')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, name, role, siteId }
  })

  // Reader & advertiser: no email verification needed — direct login allowed
  // Email verification is sent later when superadmin upgrades role (e.g. to reporter)
  return { success: true, message: 'Registrasi berhasil. Silakan login.' }
}

export async function refreshAccessToken(refreshToken: string) {
  const isBlacklisted = await prisma.blacklistedToken.findUnique({
    where: { token: refreshToken }
  })
  if (isBlacklisted) {
    throw new AppError('Refresh token tidak valid atau sudah expired', 401, 'UNAUTHORIZED')
  }

  const record = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  })
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new AppError('Refresh token tidak valid atau sudah expired', 401, 'UNAUTHORIZED')
  }

  // [H-010] Refresh Token Rotation: Delete used token
  await prisma.refreshToken.delete({ where: { token: refreshToken } })

  return generateTokenPair(record.user)
}

export async function logoutUser(userId: string, refreshToken: string) {
  const refreshTokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken, userId }
  })

  if (refreshTokenRecord) {
    await prisma.blacklistedToken.create({
      data: {
        token: refreshToken,
        expiresAt: refreshTokenRecord.expiresAt
      }
    })

    await prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id }
    })
  }
}

export async function verifyEmail(email: string, token: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) throw new AppError('Token tidak valid atau sudah expired', 400, 'BAD_REQUEST')

  if (user.emailVerifiedAt) {
    return { success: true, message: 'Email sudah terverifikasi sebelumnya.' }
  }

  const secret = env.EMAIL_VERIFICATION_SECRET || env.JWT_SECRET
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { userId?: string; purpose?: string }
    if (decoded.userId !== user.id || decoded.purpose !== 'email-verify') {
      throw new AppError('Token tidak valid', 400, 'BAD_REQUEST')
    }
  } catch {
    throw new AppError('Token tidak valid atau sudah expired', 400, 'BAD_REQUEST')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() }
  })

  return { success: true, message: 'Email berhasil diverifikasi. Silakan login.' }
}

export async function resendVerification(email: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null }
  })
  // Return success even if user not found (prevent enumeration)
  if (!user) return { success: true, message: 'Jika email terdaftar, email verifikasi telah dikirim.' }

  if (user.emailVerifiedAt) {
    return { success: true, message: 'Email sudah terverifikasi.' }
  }

  const secret = env.EMAIL_VERIFICATION_SECRET || env.JWT_SECRET
  const token = jwt.sign({ userId: user.id, purpose: 'email-verify' }, secret, { expiresIn: '24h' })
  const frontendUrl = process.env.FRONTEND_URL || 'https://beritakarya.co'
  const verifyLink = `${frontendUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`
  const emailSent = await emailService.sendVerificationEmail(normalizedEmail, user.name, verifyLink)

  if (!emailSent) {
    return { success: false, emailSent: false, message: 'Gagal mengirim email verifikasi. Silakan coba lagi nanti atau hubungi admin.' }
  }

  return { success: true, emailSent: true, message: 'Jika email terdaftar, email verifikasi telah dikirim.' }
}

export async function forgotPassword(email: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findFirst({ 
    where: { email: normalizedEmail, deletedAt: null } 
  })
  if (!user) {
    // Return success to prevent email enumeration
    return { success: true }
  }

  const secret = env.RESET_SECRET || ACCESS_SECRET!
  const token = jwt.sign({ userId: user.id, purpose: 'reset-password' }, secret, { expiresIn: '1h' })

  // Define frontend URL, assuming a web application runs somewhere
  const frontendUrl = process.env.FRONTEND_URL || 'https://beritakarya.co'
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  await emailService.sendPasswordResetEmail(user.email, user.name, resetLink)

  return { success: true, message: 'Instruksi reset password telah dikirim ke email Anda' }
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) throw new AppError('Token tidak valid atau sudah expired', 401, 'UNAUTHORIZED')

  const secret = env.RESET_SECRET || ACCESS_SECRET!
  
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { userId?: string; purpose?: string }
    if (decoded.userId !== user.id || decoded.purpose !== 'reset-password') {
      throw new AppError('Token tidak valid', 401, 'UNAUTHORIZED')
    }
  } catch {
    throw new AppError('Token tidak valid atau sudah expired', 401, 'UNAUTHORIZED')
  }

  if (!validatePassword(newPassword)) {
    throw new AppError('Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus (!@#$%^&*)', 400, 'BAD_REQUEST')
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    })

    // Invalidate all refresh tokens for security
    await tx.refreshToken.deleteMany({
      where: { userId: user.id }
    })
  })

  return { success: true, message: 'Password berhasil diubah' }
}

export async function generateTokenPair(user: { id: string; role: Role; siteId: string | null; email: string; name: string; avatarUrl?: string | null; isVerified: boolean; kycStatus: string; kycNotes?: string | null; kycSubmittedAt?: Date | null }) {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    role: user.role,
    siteId: user.siteId
  }
  const accessToken = jwt.sign(payload, ACCESS_SECRET!, {
    expiresIn: ACCESS_EXPIRES as string
  } as jwt.SignOptions)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS)

  const { v4: uuidv4 } = await import('uuid')
  const refreshToken = uuidv4()
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt }
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
      siteId: user.siteId,
      isVerified: user.isVerified,
      kycStatus: user.kycStatus,
      kycNotes: user.kycNotes,
      kycSubmittedAt: user.kycSubmittedAt
    }
  }
}