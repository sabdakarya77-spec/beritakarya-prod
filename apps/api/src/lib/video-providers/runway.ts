/**
 * Runway Provider
 *
 * AI video generation dari Runway.
 * Kualitas tertinggi, harga premium.
 *
 * API Docs: https://docs.dev.runwayml.com
 */

import { BaseVideoProvider } from './base'
import type { VideoGenerateRequest, VideoGenerateResponse } from './index'

export class RunwayProvider extends BaseVideoProvider {
  id = 'runway' as const
  name = 'Runway'
  tier = 'premium' as const
  costPerSecond = 0.20 // ~$0.20/detik
  maxDuration = 15

  constructor() {
    super('RUNWAY_API_KEY')
  }

  async generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse> {
    const duration = Math.min(request.duration || 10, this.maxDuration)

    try {
      const submitRes = await fetch('https://api.dev.runwayml.com/v1/video_generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
        body: JSON.stringify({
          promptText: request.prompt,
          promptImage: request.imageUrl || undefined,
          duration: duration,
          ratio: request.aspectRatio || '16:9',
          model: 'gen3a',
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!submitRes.ok) {
        const err = await submitRes.text()
        return { success: false, error: `Runway API error: ${err}`, provider: 'runway' }
      }

      const submitData = await submitRes.json()
      const taskId = submitData.id

      if (!taskId) {
        return { success: false, error: 'Tidak ada task ID dari Runway', provider: 'runway' }
      }

      const result = await this.pollUntilDone(
        `https://api.dev.runwayml.com/v1/video_generations/${taskId}`,
        {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
        180000,
        5000
      )

      if (result.status === 'completed' && result.videoUrl) {
        return {
          success: true,
          videoUrl: result.videoUrl,
          provider: 'runway',
          costEstimate: this.costPerSecond * duration,
        }
      }

      return { success: false, error: result.error || 'Gagal generate video', provider: 'runway' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message, provider: 'runway' }
    }
  }
}
