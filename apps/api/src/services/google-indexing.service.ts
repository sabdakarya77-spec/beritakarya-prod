import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'

interface GoogleIndexingConfig {
  clientEmail: string
  privateKey: string
  isActive: boolean
}

interface GoogleIndexingResult {
  success: boolean
  message?: string
  data?: unknown
  error?: string
}

export class GoogleIndexingService {
  private async getAccessToken(config: GoogleIndexingConfig): Promise<string> {
    const clientEmail = config.clientEmail
    // Replace literal '\n' characters if they exist in the raw pasted string
    const privateKey = config.privateKey.replace(/\\n/g, '\n')

    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/indexing',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }

    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      }).toString()
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gagal mendapatkan access token Google: ${errText}`)
    }

    const data = await res.json() as { access_token: string }
    return data.access_token
  }

  public async submitUrl(siteId: string, url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<GoogleIndexingResult> {
    try {
      const site = await prisma.site.findUnique({
        where: { id: siteId }
      })

      if (!site || !site.googleIndexingConfig) {
        return { success: false, message: 'Google Indexing tidak dikonfigurasi untuk situs ini.' }
      }

      const config = typeof site.googleIndexingConfig === 'string'
        ? JSON.parse(site.googleIndexingConfig) as GoogleIndexingConfig
        : (site.googleIndexingConfig as unknown as GoogleIndexingConfig)

      if (!config || !config.clientEmail || !config.privateKey || !config.isActive) {
        return { success: false, message: 'Google Indexing dinonaktifkan atau kredensial kosong.' }
      }

      const accessToken = await this.getAccessToken(config)

      const res = await fetch('https://indexing.googleapis.com/v1/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          url,
          type
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Google Indexing API error: ${errText}`)
      }

      const result = await res.json()
      return { success: true, data: result }
    } catch (error: unknown) {
      logger.error('Google Indexing API failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const googleIndexingService = new GoogleIndexingService()
