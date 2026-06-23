import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'
import { logger } from '../lib/logger'

interface GoogleServiceConfig {
  clientEmail: string
  privateKey: string
  isActive: boolean
}

interface GA4Result {
  success: boolean
  message?: string
  data?: unknown
  error?: string
}

interface GA4ReportRow {
  date?: string
  pagePath?: string
  sessionSource?: string
  sessionMedium?: string
  sessions: number
  totalUsers: number
  screenPageViews: number
  bounceRate?: number
  averageSessionDuration?: number
}

interface GA4RealtimeData {
  activeUsers: number
}

interface GA4TrafficOverTime {
  date: string
  sessions: number
  pageviews: number
}

interface GA4AudienceData {
  totalUsers: number
  totalSessions: number
  avgSessionDuration: number
  bounceRate: number
  sources: { source: string; sessions: number; percentage: number }[]
}

export class GoogleAnalyticsService {
  private async getAccessToken(config: GoogleServiceConfig): Promise<string> {
    const privateKey = config.privateKey.replace(/\\n/g, '\n')

    const payload = {
      iss: config.clientEmail,
      sub: config.clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
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
      throw new Error(`Gagal mendapatkan access token GA4: ${errText}`)
    }

    const data = (await res.json()) as { access_token: string }
    return data.access_token
  }

  private async getConfig(siteId: string): Promise<{ config: GoogleServiceConfig; propertyId: string } | null> {
    const site = await prisma.site.findUnique({ where: { id: siteId } })

    if (!site?.googleIndexingConfig || !site?.ga4PropertyId) return null

    const config =
      typeof site.googleIndexingConfig === 'string'
        ? (JSON.parse(site.googleIndexingConfig) as GoogleServiceConfig)
        : (site.googleIndexingConfig as unknown as GoogleServiceConfig)

    if (!config?.clientEmail || !config?.privateKey || !config?.isActive) return null

    return { config, propertyId: site.ga4PropertyId }
  }

  private async runReport(
    propertyId: string,
    accessToken: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
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
      throw new Error(`GA4 API error: ${errText}`)
    }

    return res.json()
  }

  public async getTrafficOverTime(siteId: string, days = 7): Promise<GA4Result> {
    try {
      const ctx = await this.getConfig(siteId)
      if (!ctx) return { success: false, message: 'GA4 tidak dikonfigurasi.' }

      const accessToken = await this.getAccessToken(ctx.config)
      const startDate = `${days}daysAgo`

      const raw = (await this.runReport(ctx.propertyId, accessToken, {
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      })) as {
        rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>
      }

      const data: GA4TrafficOverTime[] = (raw.rows || []).map((row) => ({
        date: row.dimensionValues[0]?.value || '',
        sessions: parseInt(row.metricValues[0]?.value || '0', 10),
        pageviews: parseInt(row.metricValues[1]?.value || '0', 10),
      }))

      return { success: true, data }
    } catch (error: unknown) {
      logger.error('GA4 traffic over time failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  public async getRealtime(siteId: string): Promise<GA4Result> {
    try {
      const ctx = await this.getConfig(siteId)
      if (!ctx) return { success: false, message: 'GA4 tidak dikonfigurasi.' }

      const accessToken = await this.getAccessToken(ctx.config)

      const res = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${ctx.propertyId}:runRealtimeReport`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            metrics: [{ name: 'activeUsers' }],
          }),
        }
      )

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`GA4 Realtime API error: ${errText}`)
      }

      const raw = (await res.json()) as {
        rows?: Array<{ metricValues: Array<{ value: string }> }>
      }

      const activeUsers = parseInt(raw.rows?.[0]?.metricValues[0]?.value || '0', 10)
      const data: GA4RealtimeData = { activeUsers }

      return { success: true, data }
    } catch (error: unknown) {
      logger.error('GA4 realtime failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  public async getAudience(siteId: string, days = 7): Promise<GA4Result> {
    try {
      const ctx = await this.getConfig(siteId)
      if (!ctx) return { success: false, message: 'GA4 tidak dikonfigurasi.' }

      const accessToken = await this.getAccessToken(ctx.config)
      const startDate = `${days}daysAgo`

      const [overviewRaw, sourceRaw] = await Promise.all([
        this.runReport(ctx.propertyId, accessToken, {
          dateRanges: [{ startDate, endDate: 'today' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }) as Promise<{
          rows?: Array<{ metricValues: Array<{ value: string }> }>
        }>,
        this.runReport(ctx.propertyId, accessToken, {
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        }) as Promise<{
          rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>
        }>,
      ])

      const overviewRow = overviewRaw.rows?.[0]
      const totalUsers = parseInt(overviewRow?.metricValues[0]?.value || '0', 10)
      const totalSessions = parseInt(overviewRow?.metricValues[1]?.value || '0', 10)
      const avgSessionDuration = parseFloat(overviewRow?.metricValues[2]?.value || '0')
      const bounceRate = parseFloat(overviewRow?.metricValues[3]?.value || '0')

      const sources = (sourceRaw.rows || []).map((row) => ({
        source: row.dimensionValues[0]?.value || '(direct)',
        sessions: parseInt(row.metricValues[0]?.value || '0', 10),
        percentage: totalSessions > 0
          ? Math.round((parseInt(row.metricValues[0]?.value || '0', 10) / totalSessions) * 100)
          : 0,
      }))

      const data: GA4AudienceData = {
        totalUsers,
        totalSessions,
        avgSessionDuration: Math.round(avgSessionDuration),
        bounceRate: Math.round(bounceRate * 100) / 100,
        sources,
      }

      return { success: true, data }
    } catch (error: unknown) {
      logger.error('GA4 audience failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService()
