import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'

interface GoogleServiceConfig {
  clientEmail: string
  privateKey: string
  isActive: boolean
}

interface GSCResult {
  success: boolean
  message?: string
  data?: unknown
  error?: string
}

interface GSCPerformanceRow {
  date?: string
  query?: string
  page?: string
  country?: string
  device?: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface GSCPerformanceOverTime {
  date: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface GSCSummary {
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  avgPosition: number
  overTime: GSCPerformanceOverTime[]
}

export class GoogleSearchConsoleService {
  private async getAccessToken(config: GoogleServiceConfig): Promise<string> {
    const privateKey = config.privateKey.replace(/\\n/g, '\n')

    const payload = {
      iss: config.clientEmail,
      sub: config.clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }

    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }).toString(),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gagal mendapatkan access token GSC: ${errText}`)
    }

    const data = (await res.json()) as { access_token: string }
    return data.access_token
  }

  private async getConfig(siteId: string): Promise<{ config: GoogleServiceConfig; siteUrl: string } | null> {
    const site = await prisma.site.findUnique({ where: { id: siteId } })

    if (!site?.googleIndexingConfig || !site?.gscSiteUrl) return null

    const config =
      typeof site.googleIndexingConfig === 'string'
        ? (JSON.parse(site.googleIndexingConfig) as GoogleServiceConfig)
        : (site.googleIndexingConfig as unknown as GoogleServiceConfig)

    if (!config?.clientEmail || !config?.privateKey || !config?.isActive) return null

    return { config, siteUrl: site.gscSiteUrl }
  }

  private async query(
    siteUrl: string,
    accessToken: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    const encodedSiteUrl = encodeURIComponent(siteUrl)
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`GSC API error: ${errText}`)
    }

    return res.json()
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  public async getPerformance(siteId: string, days = 28): Promise<GSCResult> {
    try {
      const ctx = await this.getConfig(siteId)
      if (!ctx) return { success: false, message: 'GSC tidak dikonfigurasi.' }

      const accessToken = await this.getAccessToken(ctx.config)

      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 3) // GSC data has 2-3 day delay
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - days)

      const raw = (await this.query(ctx.siteUrl, accessToken, {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        dimensions: ['date'],
        rowLimit: days,
      })) as {
        rows?: Array<{
          keys: Array<string>
          impressions: number
          clicks: number
          ctr: number
          position: number
        }>
      }

      const overTime: GSCPerformanceOverTime[] = (raw.rows || []).map((row) => ({
        date: row.keys[0] || '',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100, // percentage
        position: Math.round((row.position || 0) * 10) / 10,
      }))

      const totalImpressions = overTime.reduce((sum, r) => sum + r.impressions, 0)
      const totalClicks = overTime.reduce((sum, r) => sum + r.clicks, 0)
      const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0
      const avgPosition = overTime.length > 0
        ? Math.round((overTime.reduce((sum, r) => sum + r.position, 0) / overTime.length) * 10) / 10
        : 0

      const data: GSCSummary = {
        totalImpressions,
        totalClicks,
        avgCtr,
        avgPosition,
        overTime,
      }

      return { success: true, data }
    } catch (error: unknown) {
      logger.error('GSC performance failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  public async getTopQueries(siteId: string, limit = 10): Promise<GSCResult> {
    try {
      const ctx = await this.getConfig(siteId)
      if (!ctx) return { success: false, message: 'GSC tidak dikonfigurasi.' }

      const accessToken = await this.getAccessToken(ctx.config)

      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 3)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 28)

      const raw = (await this.query(ctx.siteUrl, accessToken, {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        dimensions: ['query'],
        rowLimit: limit,
        orderBy: 'clicks',
      })) as {
        rows?: Array<{
          keys: Array<string>
          impressions: number
          clicks: number
          ctr: number
          position: number
        }>
      }

      const data: GSCPerformanceRow[] = (raw.rows || []).map((row) => ({
        query: row.keys[0] || '',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100,
        position: Math.round((row.position || 0) * 10) / 10,
      }))

      return { success: true, data }
    } catch (error: unknown) {
      logger.error('GSC top queries failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  public async getTopPages(siteId: string, limit = 10): Promise<GSCResult> {
    try {
      const ctx = await this.getConfig(siteId)
      if (!ctx) return { success: false, message: 'GSC tidak dikonfigurasi.' }

      const accessToken = await this.getAccessToken(ctx.config)

      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 3)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 28)

      const raw = (await this.query(ctx.siteUrl, accessToken, {
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        dimensions: ['page'],
        rowLimit: limit,
        orderBy: 'clicks',
      })) as {
        rows?: Array<{
          keys: Array<string>
          impressions: number
          clicks: number
          ctr: number
          position: number
        }>
      }

      const data: GSCPerformanceRow[] = (raw.rows || []).map((row) => ({
        page: row.keys[0] || '',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100,
        position: Math.round((row.position || 0) * 10) / 10,
      }))

      return { success: true, data }
    } catch (error: unknown) {
      logger.error('GSC top pages failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const googleSearchConsoleService = new GoogleSearchConsoleService()
