/**
 * Luma Dream Machine Provider
 *
 * AI video generation dari Luma AI.
 * Gerakan natural, kualitas tinggi.
 *
 * API Docs: https://docs.lumalabs.ai
 */

import { BaseVideoProvider } from './base'
import type { VideoGenerateRequest, VideoGenerateResponse } from './index'

export class LumaProvider extends BaseVideoProvider {
  id = 'luma' as const
  name = 'Luma Dream Machine'
  tier = 'standard' as const
  costPerSecond = 0.08 // ~$0.08/detik
  maxDuration = 15

  constructor() {
    super('LUMA_API_KEY')
  }

  async generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse> {
    const duration = Math.min(request.duration || 10, this.maxDuration)

    try {
      const submitRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_url: request.imageUrl || undefined,
          duration: `${duration}s`,
          aspect_ratio: request.aspectRatio || '16:9',
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!submitRes.ok) {
        const err = await submitRes.text()
        return { success: false, error: `Luma API error: ${err}`, provider: 'luma' }
      }

      const submitData = await submitRes.json()
      const taskId = submitData.id

      if (!taskId) {
        return { success: false, error: 'Tidak ada task ID dari Luma', provider: 'luma' }
      }

      const result = await this.pollUntilDone(
        `https://api.lumalabs.ai/dream-machine/v1/videos/${taskId}`,
        { 'Authorization': `Bearer ${this.apiKey}` },
        180000, // Luma bisa lebih lambat
        5000
      )

      if (result.status === 'completed' && result.videoUrl) {
        return {
          success: true,
          videoUrl: result.videoUrl,
          provider: 'luma',
          costEstimate: this.costPerSecond * duration,
        }
      }

      return { success: false, error: result.error || 'Gagal generate video', provider: 'luma' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message, provider: 'luma' }
    }
  }
}
