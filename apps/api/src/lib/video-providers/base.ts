/**
 * Base Video Provider
 *
 * Abstract class untuk semua video provider.
 * Setiap provider harus mengimplementasikan generate().
 */

import type { VideoProvider, VideoProviderId, VideoGenerateRequest, VideoGenerateResponse } from './index'

export abstract class BaseVideoProvider implements VideoProvider {
  abstract id: VideoProviderId
  abstract name: string
  abstract tier: 'budget' | 'standard' | 'premium'
  abstract costPerSecond: number
  abstract maxDuration: number

  protected apiKey: string | undefined

  constructor(envKey: string) {
    this.apiKey = process.env[envKey]
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
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
