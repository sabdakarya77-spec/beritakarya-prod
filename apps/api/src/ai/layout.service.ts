import { callAI, chatComplete } from './base.service'
import type { AIResult } from './base.service'
import type { Block } from '@beritakarya/types'

export interface LayoutSuggestion {
  type: 'split_paragraph' | 'insert_image_after' | 'add_heading' | 'reorder'
  targetBlockId: string
  reason: string
  data?: Record<string, any>
}

export interface LayoutResult {
  suggestions: LayoutSuggestion[]
  summary: string
}

function summarizeBlocks(blocks: Block[]): string {
  return blocks.map((b, i) => {
    if (b.type === 'paragraph') return `[${i}] paragraph: ${(b as any).content?.slice(0, 80)}...`
    if (b.type === 'heading') return `[${i}] heading H${(b as any).level}: ${(b as any).content}`
    if (b.type === 'image') return `[${i}] image`
    return `[${i}] ${b.type}`
  }).join('\n')
}

export async function analyzeLayout(
  blocks: Block[]
): Promise<AIResult<LayoutResult>> {
  return callAI(async () => {
    const summary = summarizeBlocks(blocks)
    const raw = await chatComplete(
      `Kamu adalah editor layout media berita Indonesia.
Analisis struktur artikel dan berikan saran perbaikan layout.
Kembalikan HANYA JSON:
{
  "suggestions": [
    {
      "type": "split_paragraph"|"insert_image_after"|"add_heading"|"reorder",
      "targetBlockId": "id blok yang dimaksud",
      "reason": "alasan singkat dalam bahasa Indonesia",
      "data": {}
    }
  ],
  "summary": "ringkasan analisis dalam 1 kalimat"
}
Berikan maksimal 5 saran. Jika artikel sudah bagus, kembalikan suggestions kosong.`,
      `Struktur artikel (total ${blocks.length} blok):
${summary}

ID tiap blok:
${blocks.map(b => `${b.id}: ${b.type}`).join('\n')}`,
      { temperature: 0.4 }
    )
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return {
      suggestions: result.suggestions || [],
      summary: result.summary || 'Analisis selesai.'
    }
  })
}