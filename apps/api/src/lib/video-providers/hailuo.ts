/**
 * Hailuo AI Provider (MiniMax)
 *
 * AI video generation dari MiniMax.
 * Opsi termurah, cocok untuk testing dan volume tinggi.
 *
 * API Docs: https://docs.hailuoai.com
 */

import { BaseVideoProvider } from './base'
import type { VideoGenerateRequest, VideoGenerateResponse } from './index'

export class HailuoProvider extends BaseVideoProvider {
  id = 'hailuo' as const
  name = 'Hailuo AI'
  tier = 'budget' as const
  costPerSecond = 0.04 // ~$0.04/detik
  maxDuration = 15

  constructor() {
    super('HAILUO_API_KEY')
  }

  async generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      return { success: false, error: 'Hailuo API key tidak dikonfigurasi', provider: 'hailuo' }
    }

    const duration = Math.min(request.duration || 10, this.maxDuration)

    try {
      const submitRes = await fetch('https://api.hailuoai.com/v1/video/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_url: request.imageUrl || undefined,
          duration: duration,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!submitRes.ok) {
        const err = await submitRes.text()
        return { success: false, error: `Hailuo API error: ${err}`, provider: 'hailuo' }
      }

      const submitData = await submitRes.json()
      const taskId = submitData.task_id || submitData.id

      if (!taskId) {
        return { success: false, error: 'Tidak ada task ID dari Hailuo', provider: 'hailuo' }
      }

      const result = await this.pollUntilDone(
        `https://api.hailuoai.com/v1/video/task/${taskId}`,
        { 'Authorization': `Bearer ${apiKey}` },
        120000,
        3000
      )

      if (result.status === 'completed' && result.videoUrl) {
        return {
          success: true,
          videoUrl: result.videoUrl,
          provider: 'hailuo',
          costEstimate: this.costPerSecond * duration,
        }
      }

      return { success: false, error: result.error || 'Gagal generate video', provider: 'hailuo' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message, provider: 'hailuo' }
    }
  }
}
