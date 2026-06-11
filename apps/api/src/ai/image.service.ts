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
      timeout: 30_000,
    })
  }

  return client
}

export interface CaptionResult {
  caption: string
  altText: string
}

export async function generateCaption(
  imageUrl: string
): Promise<AIResult<CaptionResult>> {
  return callAI(async () => {
    const res = await getClient().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Deskripsikan gambar ini untuk caption berita dan alt text.
Kembalikan JSON: {"caption":"kalimat caption singkat max 100 karakter","altText":"deskripsi singkat untuk aksesibilitas"}
Gunakan bahasa Indonesia. Kembalikan HANYA JSON.`
          },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }
        ]
      }]
    })
    const raw = res.choices[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    if (!result.caption) throw new Error('Format tidak valid')
    return result
  })
}
