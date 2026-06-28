/**
 * Seedance Provider (ByteDance)
 *
 * AI video generation dari ByteDance.
 * Kualitas terbaik di harga menengah.
 *
 * API Docs: https://docs.seedance.ai
 */

import { BaseVideoProvider } from './base'
import type { VideoGenerateRequest, VideoGenerateResponse } from './index'

export class SeedanceProvider extends BaseVideoProvider {
  id = 'seedance' as const
  name = 'Seedance'
  tier = 'standard' as const
  costPerSecond = 0.10 // ~$0.10/detik
  maxDuration = 15

  constructor() {
    super('SEEDANCE_API_KEY')
  }

  async generate(request: VideoGenerateRequest): Promise<VideoGenerateResponse> {
    const duration = Math.min(request.duration || 10, this.maxDuration)

    try {
      // Step 1: Submit generation task
      const submitRes = await fetch('https://api.seedance.ai/v1/video/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_url: request.imageUrl || undefined,
          duration: duration,
          aspect_ratio: request.aspectRatio || '16:9',
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!submitRes.ok) {
        const err = await submitRes.text()
        return { success: false, error: `Seedance API error: ${err}`, provider: 'seedance' }
      }

      const submitData = await submitRes.json()
      const taskId = submitData.task_id || submitData.id

      if (!taskId) {
        return { success: false, error: 'Tidak ada task ID dari Seedance', provider: 'seedance' }
      }

      // Step 2: Poll sampai selesai
      const result = await this.pollUntilDone(
        `https://api.seedance.ai/v1/video/task/${taskId}`,
        { 'Authorization': `Bearer ${this.apiKey}` },
        120000, // 2 menit max
        3000    // poll setiap 3 detik
      )

      if (result.status === 'completed' && result.videoUrl) {
        return {
          success: true,
          videoUrl: result.videoUrl,
          provider: 'seedance',
          costEstimate: this.costPerSecond * duration,
        }
      }

      return { success: false, error: result.error || 'Gagal generate video', provider: 'seedance' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message, provider: 'seedance' }
    }
  }
}
