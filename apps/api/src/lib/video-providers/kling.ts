/**
 * Kling Provider (Kuaishou)
 *
 * AI video generation dari Kuaishou.
 * Alternatif solid dengan harga kompetitif.
 *
 * API Docs: https://docs.kling.ai
 */

import { BaseVideoProvider } from './base'
import type { VideoGenerateRequest, VideoGenerateResponse } from './index'

export class KlingProvider extends BaseVideoProvider {
  id = 'kling' as const
  name = 'Kling'
  tier = 'standard' as const
  costPerSecond = 0.08 // ~$0.08/detik
  maxDuration = 15

  constructor() {
    super('KLING_API_KEY')
  }

  async generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      return { success: false, error: 'Kling API key tidak dikonfigurasi', provider: 'kling' }
    }

    const duration = Math.min(request.duration || 10, this.maxDuration)

    try {
      const submitRes = await fetch('https://api.kling.ai/v1/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image: request.imageUrl || undefined,
          duration: duration,
          aspect_ratio: request.aspectRatio || '16:9',
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!submitRes.ok) {
        const err = await submitRes.text()
        return { success: false, error: `Kling API error: ${err}`, provider: 'kling' }
      }

      const submitData = await submitRes.json()
      const taskId = submitData.data?.task_id || submitData.task_id

      if (!taskId) {
        return { success: false, error: 'Tidak ada task ID dari Kling', provider: 'kling' }
      }

      const result = await this.pollUntilDone(
        `https://api.kling.ai/v1/videos/generations/${taskId}`,
        { 'Authorization': `Bearer ${apiKey}` },
        120000,
        3000
      )

      if (result.status === 'completed' && result.videoUrl) {
        return {
          success: true,
          videoUrl: result.videoUrl,
          provider: 'kling',
          costEstimate: this.costPerSecond * duration,
        }
      }

      return { success: false, error: result.error || 'Gagal generate video', provider: 'kling' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message, provider: 'kling' }
    }
  }
}
