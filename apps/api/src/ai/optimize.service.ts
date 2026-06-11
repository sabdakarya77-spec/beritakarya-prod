import { callAI, chatComplete } from './base.service'
import type { AIResult } from './base.service'

export interface HeadlineResult {
  headlines: string[]
}

export interface SEOResult {
  metaTitle: string
  metaDescription: string
  keywords: string[]
}

function extractJSON<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function generateHeadlines(
  title: string,
  contentExcerpt: string
): Promise<AIResult<HeadlineResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah editor berita senior Indonesia.
Tugasmu membuat judul berita yang menarik dan SEO-friendly.
Setiap judul maksimal 70 karakter.
Gunakan gaya jurnalistik Indonesia yang lazim.
Kembalikan HANYA array JSON, tanpa teks lain: ["judul1","judul2","judul3","judul4","judul5"]`,
      `Judul saat ini: "${title}"
Isi artikel: "${contentExcerpt.slice(0, 500)}"`
    )
    const headlines = extractJSON<string[]>(raw)
    if (!Array.isArray(headlines) || headlines.length === 0) {
      throw new Error('Format respons tidak valid')
    }
    return { headlines: headlines.slice(0, 5) }
  })
}

export async function generateSEOMeta(
  title: string,
  contentExcerpt: string
): Promise<AIResult<SEOResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah spesialis SEO untuk media berita Indonesia.
Buat meta SEO untuk artikel berikut.
Rules:
- metaTitle: max 60 karakter, mengandung kata kunci utama
- metaDescription: max 155 karakter, ringkas dan mengundang klik
- keywords: 5-8 kata kunci relevan
Kembalikan HANYA JSON: {"metaTitle":"...","metaDescription":"...","keywords":["..."]}`,
      `Judul: "${title}"
Isi: "${contentExcerpt.slice(0, 800)}"`
    )
    const result = extractJSON<SEOResult>(raw)
    if (!result.metaTitle || !result.metaDescription) {
      throw new Error('Format SEO tidak valid')
    }
    return result
  })
}