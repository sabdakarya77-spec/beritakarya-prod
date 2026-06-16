import { callAI } from './base.service'
import OpenAI from 'openai'
import type { AIResult } from './base.service'
import { env } from '../lib/env'

let client: OpenAI | null = null

function getClient() {
  const apiKey = env.OPENAI_API_KEY || (process.env.VITEST ? 'test-key' : undefined)

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
      timeout: 60_000, // Image generation can take longer
    })
  }

  return client
}

export interface ImageGenResult {
  url: string
  revisedPrompt: string
}

export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792'

export async function generateImage(
  prompt: string,
  size: ImageSize = '1024x1024'
): Promise<AIResult<ImageGenResult>> {
  return callAI(async () => {
    const res = await getClient().images.generate({
      model: 'dall-e-3',
      prompt: `Gambar untuk artikel berita Indonesia: ${prompt}`,
      n: 1,
      size,
      quality: 'standard',
    })

    const image = res.data?.[0]
    if (!image?.url) throw new Error('Gagal menghasilkan gambar')

    return {
      url: image.url,
      revisedPrompt: image.revised_prompt || prompt,
    }
  })
}
