import nodemailer from 'nodemailer'
import { logger } from '../lib/logger'
import { ROLE_LABELS } from '@beritakarya/config'


class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isEnabled: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    const emailEnabled = process.env.EMAIL_ENABLED === 'true'
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587')
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (emailEnabled && host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true for 465, false for other ports
          auth: { user, pass },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          }
        })
        this.isEnabled = true
        logger.info('Email service initialized successfully')
      } catch (error) {
        logger.error('Failed to initialize email service:', error)
        this.isEnabled = false
      }
    } else {
      logger.warn('Email service is disabled or configuration incomplete')
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.isEnabled) {
      logger.warn('Email service is disabled. Skipping email to:', to)
      return false
    }

    // Check if we should use Resend's REST API (bypasses SMTP port blocking)
    const isResend = process.env.SMTP_HOST === 'smtp.resend.com' || (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('re_'))
    if (isResend) {
      try {
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'Redaksi BeritaKarya <redaksi@beritakarya.co>'
        const replyToAddress = process.env.EMAIL_REPLY_TO || fromAddress
        
        logger.info(`Sending email to ${to} via Resend REST API...`)
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SMTP_PASS}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject: subject,
            html: html,
            reply_to: replyToAddress
          })
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Resend REST API returned status ${response.status}: ${errText}`)
        }

        const data: { id?: string } = await response.json() as { id?: string }
        logger.info(`Email successfully sent via Resend REST API. ID: ${data.id}`)
        return true
      } catch (error) {
        logger.error('Failed to send email via Resend REST API, falling back to SMTP...', error)
        // Fallback to standard SMTP below if API call failed
      }
    }

    try {
      // Build from address - prefer EMAIL_FROM_ADDRESS, fallback to SMTP_USER
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
      if (!fromAddress) {
        throw new Error('No from address configured. Set EMAIL_FROM_ADDRESS or SMTP_USER')
      }

      const replyToAddress = process.env.EMAIL_REPLY_TO || fromAddress

      if (!this.transporter) {
        throw new Error('SMTP Transporter not initialized')
      }

      await this.transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        replyTo: replyToAddress,
        text: text || html.replace(/<[^>]*>/g, '')
      })

      logger.info(`Email sent successfully to ${to}: ${subject}`)
      return true
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error)
      return false
    }
  }

  async sendKYCNotification(userEmail: string, userName: string, status: 'approved' | 'rejected', reason?: string): Promise<boolean> {
    const subject = status === 'approved' 
      ? '✅ KYC Disetujui - BeritaKarya' 
      : '❌ KYC Ditolak - BeritaKarya'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="background: #e11d48; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">BeritaKarya</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: ${status === 'approved' ? '#22c55e' : '#dc2626'}; margin-top: 0;">
            ${status === 'approved' ? 'Selamat!' : 'Mohon Maaf'}
          </h2>
          
          <p>Halo <strong>${userName}</strong>,</p>
          
          ${status === 'approved' 
            ? `<p>Verifikasi identitas Anda (KYC) telah <strong style="color: #22c55e;">DISETUJUI</strong>. 
               Anda sekarang dapat sepenuhnya menggunakan fitur platform BeritaKarya sebagai <strong>Reporter</strong>.</p>
               <p>Anda bisa:</p>
               <ul>
                 <li>Membuat dan menerbitkan artikel</li>
                 <li>Mengupload gambar dan media</li>
                 <li>Menggunakan fitur AI bantu penulisan</li>
               </ul>`
            : `<p>Verifikasi identitas Anda (KYC) telah <strong style="color: #dc2626;">DITOLAK</strong>.</p>
               <p>Alasan: ${reason || 'Tidak memenuhi syarat verifikasi'}</p>
               <p>Anda dapat mengajukan kembali dengan dokumen yang lebih jelas dan sesuai persyaratan.</p>`
          }
        </div>
        
        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Email ini dikirim otomatis. Mohon jangan membalas email ini.</p>
          <p>&copy; ${new Date().getFullYear()} BeritaKarya Nusantara</p>
        </div>
      </div>
    `

    return this.sendEmail(userEmail, subject, html)
  }

  async sendRoleChangeNotification(
    userEmail: string,
    userName: string,
    oldRole: string,
    newRole: string,
    changedByName: string,
    siteId?: string | null
  ): Promise<boolean> {
    const subject = `🔄 Perubahan Peran Akun Anda - BeritaKarya`
    
    const baseUrl = process.env.FRONTEND_URL || 'https://beritakarya.co'
    const dashboardSlug = siteId || 'pusat'
    const dashboardUrl = `${baseUrl}/${dashboardSlug}/dashboard`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
        <div style="background: #e11d48; padding: 20px; text-align: center;">
          <img src="${baseUrl}/logo.png" alt="BeritaKarya" style="max-height: 40px; margin: 0 auto; display: block;" onerror="this.onerror=null; this.parentNode.innerHTML='<h1 style=\\'margin: 0; font-size: 24px; color: white;\\'>BeritaKarya</h1>';"/>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #3b82f6;">Perubahan Peran Akun</h2>
          
          <p>Halo <strong>${userName}</strong>,</p>
          
          <p>Peran akun Anda telah diubah oleh <strong>${changedByName}</strong>:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin-top: 0;"><strong>Peran sebelumnya:</strong> ${ROLE_LABELS[oldRole] || oldRole}</p>
            <p style="margin-bottom: 0;"><strong>Peran baru:</strong> <span style="color: #3b82f6; font-weight: bold;">${ROLE_LABELS[newRole] || newRole}</span></p>
          </div>
          
          <p>Perubahan ini berlaku langsung. Silakan akses Dashboard Redaksi untuk melihat menu dan izin akses baru Anda.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Buka Dashboard Redaksi</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Jika Anda merasa tidak menyetujui perubahan ini atau butuh bantuan, <a href="mailto:support@beritakarya.co" style="color: #3b82f6; text-decoration: none;">hubungi administrator</a>.
          </p>
        </div>
        
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin-bottom: 10px;">Email ini dikirim otomatis. Mohon jangan membalas email ini.</p>
          <p style="font-weight: bold; margin-bottom: 5px;">PT. BeritaKarya Nusantara</p>
          <p style="margin-top: 0; margin-bottom: 15px;">Jl. Kembang Raya No.10, Jakarta Selatan, 12190</p>
          <p>&copy; ${new Date().getFullYear()} BeritaKarya Nusantara</p>
        </div>
      </div>
    `

    return this.sendEmail(userEmail, subject, html)
  }

  async sendAccountLockedNotification(
    userEmail: string,
    userName: string,
    reason: 'kyc' | 'login',
    lockedUntil?: Date
  ): Promise<boolean> {
    let subject: string
    let message: string

    if (reason === 'kyc') {
      subject = '🔒 Akun KYC Terkunci - BeritaKarya'
      const unlockTime = lockedUntil ? `pukul ${lockedUntil.toLocaleString('id-ID')}` : 'nanti'
      message = `
        <p>Akun Anda telah dikunci sementara karena terlalu banyak percobaan submit KYC yang gagal.</p>
        <p>Waktu bisa mencoba kembali: ${unlockTime}</p>
        <p>Jika Anda mengalami kendala, silakan hubungi tim support.</p>
      `
    } else {
      subject = '🔒 Akun Terkunci - BeritaKarya'
      message = `
        <p>Akun Anda telah dikunci sementara karena terlalu banyak percobaan login yang gagal.</p>
        <p>Silakan coba login kembali setelah 15 menit.</p>
        <p>Jika Anda lupa password, gunakan fitur "Lupa Password".</p>
      `
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="background: #e11d48; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">BeritaKarya</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #dc2626;">Pemberitahuan Pemblokiran Akun</h2>
          
          <p>Halo <strong>${userName}</strong>,</p>
          
          ${message}
          
          <p>Terima kasih atas pengertian Anda.</p>
        </div>
        
        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Email ini dikirim otomatis. Mohon jangan membalas email ini.</p>
          <p>&copy; ${new Date().getFullYear()} BeritaKarya Nusantara</p>
        </div>
      </div>
    `

    return this.sendEmail(userEmail, subject, html)
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetLink: string): Promise<boolean> {
    const subject = '🔒 Reset Password - BeritaKarya'
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="background: #e11d48; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">BeritaKarya</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #3b82f6;">Reset Password</h2>
          
          <p>Halo <strong>${userName}</strong>,</p>
          
          <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
          <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          
          <p>Jika Anda tidak meminta reset password, abaikan email ini. Tautan ini akan kedaluwarsa dalam 1 jam.</p>
        </div>
        
        <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Email ini dikirim otomatis. Mohon jangan membalas email ini.</p>
          <p>&copy; ${new Date().getFullYear()} BeritaKarya Nusantara</p>
        </div>
      </div>
    `

    return this.sendEmail(userEmail, subject, html)
  }
}

export const emailService = new EmailService()