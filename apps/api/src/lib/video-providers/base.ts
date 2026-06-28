/**
 * Base Video Provider
 *
 * Abstract class untuk semua video provider.
 * Setiap provider harus mengimplementasikan generate().
 *
 * API key dibaca dari:
 * 1. Database (VideoProviderConfig) — prioritas utama
 * 2. Environment variable (.env) — fallback
 */

import { prisma } from '../../db/client'
import type { VideoProvider, VideoProviderId, VideoGenerateRequest, VideoGenerateResponse } from './index'

export abstract class BaseVideoProvider implements VideoProvider {
  abstract id: VideoProviderId
  abstract name: string
  abstract tier: 'budget' | 'standard' | 'premium'
  abstract costPerSecond: number
  abstract maxDuration: number

  private envKey: string

  constructor(envKey: string) {
    this.envKey = envKey
  }

  /**
   * Ambil API key: database dulu, fallback ke .env
   */
  protected async getApiKey(): Promise<string | null> {
    // 1. Coba dari database
    try {
      const config = await prisma.videoProviderConfig.findUnique({
        where: { provider: this.id },
      })
      if (config?.apiKey && config.isActive) {
        return config.apiKey
      }
    } catch { /* ignore */ }

    // 2. Fallback ke environment variable
    const envKey = process.env[this.envKey]
    if (envKey && envKey.length > 0) {
      return envKey
    }

    return null
  }

  async isAvailable(): Promise<boolean> {
    const key = await this.getApiKey()
    return !!key
  }

  abstract generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse>

  /**
   * Helper: Poll URL sampai selesai (untuk provider async)
   */
  protected async pollUntilDone(
    pollUrl: string,
    headers: Record<string, string>,
    maxWaitMs: number = 120000,
    intervalMs: number = 3000
  ): Promise<{ status: string; videoUrl?: string; error?: string }> {
    const start = Date.now()

    while (Date.now() - start < maxWaitMs) {
      const res = await fetch(pollUrl, { headers, signal: AbortSignal.timeout(10000) })
      const data = await res.json()

      if (data.status === 'completed' || data.status === 'succeeded') {
        return { status: 'completed', videoUrl: data.videoUrl || data.output }
      }

      if (data.status === 'failed' || data.status === 'error') {
        return { status: 'failed', error: data.error || 'Generation failed' }
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    return { status: 'timeout', error: 'Timeout menunggu video selesai' }
  }
}
