/**
 * Pika Provider
 *
 * AI video generation dari Pika Labs.
 * Mudah dipakai, kualitas konsisten.
 *
 * API Docs: https://docs.pika.art
 */

import { BaseVideoProvider } from './base'
import type { VideoGenerateRequest, VideoGenerateResponse } from './index'

export class PikaProvider extends BaseVideoProvider {
  id = 'pika' as const
  name = 'Pika'
  tier = 'standard' as const
  costPerSecond = 0.10 // ~$0.10/detik
  maxDuration = 15

  constructor() {
    super('PIKA_API_KEY')
  }

  async generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      return { success: false, error: 'Pika API key tidak dikonfigurasi', provider: 'pika' }
    }

    const duration = Math.min(request.duration || 10, this.maxDuration)

    try {
      const submitRes = await fetch('https://api.pika.art/v1/video/generate', {
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
        return { success: false, error: `Pika API error: ${err}`, provider: 'pika' }
      }

      const submitData = await submitRes.json()
      const taskId = submitData.task_id || submitData.id

      if (!taskId) {
        return { success: false, error: 'Tidak ada task ID dari Pika', provider: 'pika' }
      }

      const result = await this.pollUntilDone(
        `https://api.pika.art/v1/video/task/${taskId}`,
        { 'Authorization': `Bearer ${apiKey}` },
        120000,
        3000
      )

      if (result.status === 'completed' && result.videoUrl) {
        return {
          success: true,
          videoUrl: result.videoUrl,
          provider: 'pika',
          costEstimate: this.costPerSecond * duration,
        }
      }

      return { success: false, error: result.error || 'Gagal generate video', provider: 'pika' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message, provider: 'pika' }
    }
  }
}
