import { callAI, chatComplete } from './base.service'
import type { AIResult } from './base.service'

export interface GrammarCorrection {
  original: string
  suggestion: string
  reason: string
}

export interface GrammarResult {
  corrections: GrammarCorrection[]
  totalIssues: number
}

export interface ReadabilityResult {
  score: number
  level: 'SD' | 'SMP' | 'SMA' | 'Perguruan Tinggi' | 'Profesional'
  summary: string
  suggestions: string[]
}

function extractJSON<T>(raw: string): T {
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

export async function checkGrammar(
  text: string
): Promise<AIResult<GrammarResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah editor bahasa Indonesia.
Temukan kesalahan grammar, ejaan, dan tanda baca dalam teks berikut.
Kembalikan HANYA JSON:
{"corrections":[{"original":"kata salah","suggestion":"kata benar","reason":"alasan singkat"}],"totalIssues":N}
Jika tidak ada kesalahan, kembalikan: {"corrections":[],"totalIssues":0}`,
      `Teks yang harus dicek:
"${text.slice(0, 2000)}"`,
      { temperature: 0.2 }
    )
    const result = extractJSON<GrammarResult>(raw)
    return {
      corrections: result.corrections || [],
      totalIssues: result.totalIssues || 0
    }
  })
}

export async function checkReadability(
  text: string
): Promise<AIResult<ReadabilityResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah ahli linguistik dan keterbacaan teks bahasa Indonesia.
Analisis keterbacaan teks berikut.
Kembalikan HANYA JSON:
{
  "score": 0-100,
  "level": "SD"|"SMP"|"SMA"|"Perguruan Tinggi"|"Profesional",
  "summary": "penjelasan singkat 1 kalimat",
  "suggestions": ["saran1","saran2","saran3"]
}`,
      `Teks:
"${text.slice(0, 2000)}"`,
      { temperature: 0.3 }
    )
    const result = extractJSON<ReadabilityResult>(raw)
    if (typeof result.score !== 'number') throw new Error('Format tidak valid')
    return result
  })
}

export interface FactCheckClaim {
  claim: string
  verdict: 'Benar' | 'Sebagian Benar' | 'Salah' | 'Belum Terverifikasi'
  explanation: string
  sources: string[]
}

export interface FactCheckResult {
  claims: FactCheckClaim[]
  summary: string
  trustScore: number
}

export interface BiasIssue {
  original: string
  suggested: string
  reason: string
  severity: 'low' | 'medium' | 'high'
}

export interface ObjectivityResult {
  score: number
  issues: BiasIssue[]
  ethicalCompliance: string
  suggestions: string[]
}

export async function auditObjectivity(
  text: string
): Promise<AIResult<ObjectivityResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah Dewan Pers Indonesia dan Ombudsman media profesional.
Tugasmu adalah menganalisis draf berita dari segi objektivitas, netralitas, dan kepatuhan Kode Etik Jurnalistik (KEJ).
- Cari kata-kata bias, opini menghakimi, klaim tanpa atribusi, atau istilah emosional yang melanggar objektivitas.
- Berikan skor objektivitas (0-100).
- Berikan rekomendasi perbaikan kalimat alternatif.
Kembalikan HANYA JSON:
{
  "score": 85,
  "issues": [
    {
      "original": "kata/kalimat bias",
      "suggested": "kalimat objektif pengganti",
      "reason": "mengapa ini bias/melanggar aturan",
      "severity": "low"|"medium"|"high"
    }
  ],
  "ethicalCompliance": "Analisis singkat kepatuhan terhadap Kode Etik Jurnalistik (misal Pasal 1 atau Pasal 3).",
  "suggestions": ["Saran umum 1", "Saran umum 2"]
}`,
      `Teks berita:
"${text.slice(0, 3000)}"`,
      { temperature: 0.2 }
    )
    const result = extractJSON<ObjectivityResult>(raw)
    if (typeof result.score !== 'number') throw new Error('Format hasil audit objektivitas tidak valid')
    return {
      score: result.score,
      issues: Array.isArray(result.issues) ? result.issues : [],
      ethicalCompliance: result.ethicalCompliance || '',
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
    }
  })
}

export async function checkFact(
  text: string
): Promise<AIResult<FactCheckResult>> {
  return callAI(async () => {
    const raw = await chatComplete(
      `Kamu adalah pemeriksa fakta (fact-checker) profesional dan reporter investigasi senior Indonesia.
Tugasmu adalah menganalisis klaim-klaim faktual utama dalam teks yang diberikan dan memverifikasi kredibilitasnya.
Rules:
- Pilah maksimal 5 klaim penting dalam teks yang membutuhkan verifikasi fakta.
- Berikan keputusan (verdict) untuk setiap klaim: "Benar" | "Sebagian Benar" | "Salah" | "Belum Terverifikasi".
- Berikan penjelasan singkat dan objektif mengenai alasan keputusan tersebut.
- Berikan daftar sumber referensi terpercaya yang relevan (misalnya: kementerian terkait, media arus utama, data statistik resmi) untuk memverifikasi klaim tersebut.
- Hitung "trustScore" (0-100) berdasarkan rasio klaim yang benar dibanding klaim yang salah/belum terverifikasi.
- Buat kesimpulan ringkas (summary) dalam 1-2 kalimat.
Kembalikan HANYA JSON:
{
  "claims": [
    {
      "claim": "pernyataan klaim dari teks",
      "verdict": "Benar"|"Sebagian Benar"|"Salah"|"Belum Terverifikasi",
      "explanation": "penjelasan logis",
      "sources": ["nama sumber/instansi", "sumber kedua"]
    }
  ],
  "summary": "kesimpulan analisis fakta",
  "trustScore": 85
}`,
      `Teks berita yang harus diverifikasi fakta-faktanya:
"${text.slice(0, 3000)}"`,
      { temperature: 0.2 }
    )
    const result = extractJSON<FactCheckResult>(raw)
    if (!Array.isArray(result.claims) || typeof result.trustScore !== 'number') {
      throw new Error('Format hasil cek fakta tidak valid')
    }
    return result
  })
}