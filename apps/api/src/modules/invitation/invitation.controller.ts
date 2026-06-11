import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { emailService } from '../../services/email.service'
import { logger } from '../../lib/logger'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Helper function to generate cryptographically secure token
// Menggunakan crypto.randomBytes() — jauh lebih aman dari Math.random()
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex') // 64 karakter hex, 256-bit entropy
}

export const invitationRouter = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]
const adminOnly = requireRole(['superadmin', 'wapimred'])

// POST /invitations - Create a new invitation (admin only)
invitationRouter.post('/',
  ...withSite,
  adminOnly,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, role = 'reader', siteId } = req.body
    const inviterId = req.user!.userId
    const currentSiteId = req.site!

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email harus diisi' }
      })
    }

    // Validate role
    const allowedRoles = ['reader', 'reporter', 'kontributor', 'wapimred', 'advertiser']
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Role tidak valid' }
      })
    }

    // Check if email already exists as active user
    const existingUser = await prisma.user.findFirst({
      where: { email },
      select: { id: true, deletedAt: true }
    })

    if (existingUser) {
      if (!existingUser.deletedAt) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email sudah terdaftar sebagai pengguna aktif' }
        })
      }
      // Soft deleted user - can be invited again (will be restored on accept)
    }

    // [C-004] Wrap in transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check for pending invitation within the transaction
      const pending = await tx.invitation.findFirst({
        where: {
          email,
          acceptedAt: null,
          expiresAt: { gt: new Date() }
        }
      })

      if (pending) {
        throw new Error('PENDING_INVITATION_EXISTS')
      }

      // Generate unique token
      const token = generateInvitationToken()

      // Set expiry: 7 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Determine invite siteId:
      let inviteSiteId: string | null = null
      if (req.user!.role === 'wapimred') {
        inviteSiteId = currentSiteId
      } else if (siteId && req.user!.role === 'superadmin') {
        inviteSiteId = siteId
      }

      const createdInvitation = await tx.invitation.create({
        data: {
          email,
          token,
          role,
          siteId: inviteSiteId,
          invitedBy: inviterId,
          expiresAt
        },
        include: {
          invitedByUser: {
            select: { name: true, email: true }
          }
        }
      })

      return { success: true, invitation: createdInvitation }
    }).catch(err => {
      if (err.message === 'PENDING_INVITATION_EXISTS') {
        return { success: false, error: 'PENDING_INVITATION_EXISTS' }
      }
      throw err
    })

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email sudah memiliki undangan yang belum kadaluarsa' }
      })
    }

    const invitation = (result as any).invitation
    const expiresAt = invitation.expiresAt
    const inviteSiteId = invitation.siteId

    // Send invitation email
    const acceptLink = `${process.env.APP_URL || 'https://beritakarya.co'}/invite/${invitation.token}`
    
    try {
      await emailService.sendEmail(email, 'Undangan Bergabung ke BeritaKarya', `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
          <div style="background: #e11d48; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">BeritaKarya</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #3b82f6;">Undangan Bergabung</h2>
            
            <p>Halo,</p>
            
            <p><strong>${invitation.invitedByUser.name}</strong> telah mengundang Anda untuk bergabung ke platform BeritaKarya dengan peran: <strong>${role}</strong>.</p>
            
            <p>Untuk menerima undangan ini, silakan klik tombol di bawah ini:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptLink}" 
                 style="background: #e11d48; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Terima Undangan
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Link ini berlaku sampai: ${expiresAt.toLocaleDateString('id-ID')} (7 hari)<br>
              Jika Anda tidak merasa mendapatkan undangan, abaikan email ini.
            </p>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} BeritaKarya Nusantara</p>
          </div>
        </div>
      `)

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: inviterId,
          siteId: inviteSiteId || currentSiteId,
          action: 'invitation.create',
          entityType: 'invitation',
          entityId: invitation.id,
          newValue: { email, role, siteId: inviteSiteId, expiresAt }
        }
      })
    } catch (error) {
      logger.error('Failed to send invitation email:', error)
      // Don't fail the invitation creation if email fails, but delete the invitation
      await prisma.invitation.delete({ where: { id: invitation.id } })
      return res.status(500).json({
        success: false,
        error: { message: 'Gagal mengirim email undangan. Silakan coba lagi.' }
      })
    }

    res.status(201).json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email,
          role,
          siteId: inviteSiteId,
          expiresAt,
          createdAt: invitation.createdAt
        }
      }
    })
  })
)

// GET /invitations - List invitations (admin only)
invitationRouter.get('/',
  ...withSite,
  adminOnly,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const status = req.query.status as string // 'pending' | 'accepted' | 'expired'
    const skip = (page - 1) * limit

    const where: any = {}

    // Filter by site for wapimred
    if (req.user!.role === 'wapimred') {
      where.siteId = req.site
    }

    // Filter by status
    if (status === 'pending') {
      where.acceptedAt = null
      where.expiresAt = { gt: new Date() }
    } else if (status === 'accepted') {
      where.acceptedAt = { not: null }
    } else if (status === 'expired') {
      where.expiresAt = { lt: new Date() }
      where.acceptedAt = null
    }

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invitedByUser: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.invitation.count({ where })
    ])

    res.json({
      success: true,
      data: invitations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  })
)

// POST /invitations/:token/accept - Accept invitation
invitationRouter.post('/:token/accept',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params
    const { password, name } = req.body

    if (!password || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password dan nama harus diisi' }
      })
    }

    // Find valid invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedByUser: {
          select: { name: true, email: true, siteId: true }
        }
      }
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invitation token tidak ditemukan' }
      })
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invitation sudah digunakan' }
      })
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invitation telah kadaluarsa' }
      })
    }

    // Check if email already exists as active user
    const existingUser = await prisma.user.findFirst({
      where: { email: invitation.email },
      select: { id: true, deletedAt: true }
    })

    if (existingUser && !existingUser.deletedAt) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email sudah terdaftar sebagai pengguna aktif' }
      })
    }

    // Hash password with bcrypt (cost factor 12 untuk keamanan optimal)
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user or restore soft-deleted user
    let user
    if (existingUser) {
      // Restore soft-deleted user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: invitation.email,
          passwordHash,
          name,
          role: invitation.role,
          siteId: invitation.siteId,
          deletedAt: null
        }
      })
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          name,
          role: invitation.role,
          siteId: invitation.siteId
        }
      })
    }

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    })

    // Determine siteId for audit log (fallback to 'pusat' if both are null)
    const auditSiteId = invitation.siteId || invitation.invitedByUser.siteId || 'pusat'

    // Audit log - Prisma expects actual JSON object, not string, for JSON fields
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        siteId: auditSiteId,
        action: 'invitation.accept',
        entityType: 'user',
        entityId: user.id,
        oldValue: undefined, // Will be stored as JSON null
        newValue: { 
          email: user.email, 
          role: user.role, 
          invitedBy: invitation.invitedBy 
        }
      }
    })

    // Send notification to inviter
    try {
      await emailService.sendEmail(
        invitation.invitedByUser.email,
        'Undangan Diterima',
        `<p>Undangan ke ${invitation.email} telah diterima dan akun berhasil dibuat.</p>`
      )
    } catch (error) {
      logger.error('Failed to send acceptance notification to inviter:', error)
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Invitation accepted successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          siteId: user.siteId
        }
      }
    })
  })
)

// GET /invitations/:token/verify - Verify invitation token (for frontend)
invitationRouter.get('/:token/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedByUser: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Invitation token tidak ditemukan' }
      })
    }

    if (invitation.acceptedAt) {
      return res.json({
        success: true,
        data: { valid: false, reason: 'used' }
      })
    }

    if (invitation.expiresAt < new Date()) {
      return res.json({
        success: true,
        data: { valid: false, reason: 'expired' }
      })
    }

    res.json({
      success: true,
      data: {
        valid: true,
        invitation: {
          email: invitation.email,
          role: invitation.role,
          siteId: invitation.siteId,
          expiresAt: invitation.expiresAt,
          invitedBy: invitation.invitedByUser
        }
      }
    })
  })
)

export default invitationRouter