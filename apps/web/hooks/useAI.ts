'use client'

import { useState, useCallback } from 'react'

// Types
export interface RewriteOptions {
  content: string
  tone?: 'formal' | 'santai' | 'berita'
  length?: 'lebih_pendek' | 'sama' | 'lebih_panjang'
  prevContent?: string
  nextContent?: string
}

export interface ExpandOptions {
  content: string
  prevContent?: string
}

export interface HeadlineOptions {
  title: string
  contentExcerpt: string
  count?: number
}

export interface SEOOptions {
  title: string
  contentExcerpt: string
}

export interface CaptionOptions {
  imageUrl: string
}

export interface GrammarOptions {
  text: string
}

export interface ReadabilityOptions {
  text: string
}

export interface FactCheckOptions {
  text: string
}

export interface ObjectivityOptions {
  text: string
}

export interface RewriteResult {
  rewritten: string
  original: string
  tone: string
  length: string
}

export interface HeadlineResult {
  headlines: string[]
  title: string
}

export interface SEOResult {
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  suggestions: string[]
}

export interface CaptionResult {
  altText: string
  caption: string
}

export interface GrammarResult {
  corrected: string
  corrections: { original: string; suggestion: string; reason: string }[]
}

export interface ReadabilityResult {
  score: number
  level: string
  suggestions: string[]
}

export interface FactCheckResult {
  claims: { text: string; verified: boolean; explanation: string }[]
  accuracy_score: number
}

export interface ObjectivityResult {
  score: number
  biased_phrases: { phrase: string; suggestion: string }[]
  overall_verdict: string
}

export interface TranscriptOptions {
  transcript: string
  speakerName?: string
}

// State types
interface AIState<T> {
  loading: boolean
  result: T | null
  error: string | null
}

// Helper hook for AI state
function useAIState<T>() {
  return useState<AIState<T>>({
    loading: false,
    result: null,
    error: null,
  })
}

// OpenAI API call helper
async function callOpenAI(model: string, messages: { role: string; content: string }[]) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  })
  
  if (!response.ok) {
    throw new Error('AI request failed')
  }
  
  const data = await response.json()
  return data.content as string
}

// Rewrite Hook
export function useRewrite(model = 'gpt-4o') {
  const [state, setState] = useAIState<RewriteResult>()

  const rewrite = useCallback(async (options: RewriteOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const toneLabel = { formal: 'formal', santai: 'santai', berita: 'gaya berita Indonesia' }[options.tone || 'berita']
      const lengthLabel = { lebih_pendek: 'lebih singkat', sama: 'sepanjang original', lebih_panjang: 'lebih detail' }[options.length || 'sama']
      
      const context = options.prevContent || options.nextContent 
        ? `\nKonteks sebelumnya: "${options.prevContent || ''}"\nKonteks sesudahnya: "${options.nextContent || ''}"`
        : ''
      
      const prompt = `Tulis ulang teks berikut dengan gaya ${toneLabel} dan ${lengthLabel}:\n\nTeks: ${options.content}${context}\n\nHanya kembalikan teks yang sudah ditulis ulang, tanpa penjelasan.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      setState({
        loading: false,
        result: {
          rewritten: result,
          original: options.content,
          tone: options.tone || 'berita',
          length: options.length || 'sama',
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to rewrite',
      })
    }
  }, [model])

  return { ...state, rewrite }
}

// Expand Hook
export function useExpand(model = 'gpt-4o') {
  const [state, setState] = useAIState<{ expanded: string; original: string }>()

  const expand = useCallback(async (options: ExpandOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const context = options.prevContent ? `\nParagraf sebelumnya: "${options.prevContent}"` : ''
      
      const prompt = `Perluas paragraf berikut dengan detail tambahan yang relevan dan natural:${context}\n\nParagraf: ${options.content}\n\nHanya kembalikan hasil expand, tanpa penjelasan.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      setState({
        loading: false,
        result: {
          expanded: result,
          original: options.content,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to expand',
      })
    }
  }, [model])

  return { ...state, expand }
}

// Transcript to Quote Hook
export function useTranscriptToQuote(model = 'gpt-4o') {
  const [state, setState] = useAIState<{ quote: string; speaker: string; context: string }>()

  const transcript = useCallback(async (options: TranscriptOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const speakerContext = options.speakerName ? ` dari ${options.speakerName}` : ''
      
      const prompt = `Ubah transkrip berikut${speakerContext} menjadi kutipan berita yang profesional dalam format JSON:\n\nTranskrip: ${options.transcript}\n\nFormat JSON: {"quote": "kutipan dalam tanda kutip", "speaker": "nama pembicara", "context": "konteks 1-2 kalimat"}\n\nHanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to convert transcript',
      })
    }
  }, [model])

  return { ...state, transcript }
}

// Headlines Hook
export function useHeadlines(model = 'gpt-4o') {
  const [state, setState] = useAIState<HeadlineResult>()

  const generate = useCallback(async (options: HeadlineOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const count = options.count || 5
      
      const prompt = `Buat ${count} headline berita yang menarik dalam Bahasa Indonesia berdasarkan:\n\nJudul: ${options.title}\nKonten: ${options.contentExcerpt}\n\nKembalikan dalam format JSON: {"headlines": ["headline 1", "headline 2", ...]}\n\nGunakan gaya berita yang profesional dan menarik perhatian. Hanya kembalikan JSON.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: {
            ...parsed,
            title: options.title,
          },
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate headlines',
      })
    }
  }, [model])

  return { ...state, generate }
}

// SEO Hook
export function useSEO(model = 'gpt-4o') {
  const [state, setState] = useAIState<SEOResult>()

  const generate = useCallback(async (options: SEOOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const prompt = `Buat SEO optimization untuk artikel:\n\nJudul: ${options.title}\nKonten: ${options.contentExcerpt}\n\nKembalikan dalam format JSON:\n{\n  "metaTitle": "meta title 50-60 karakter",\n  "metaDescription": "meta description 120-160 karakter",\n  "focusKeyword": "kata kunci utama",\n  "suggestions": ["saran 1", "saran 2"]\n}\n\nHanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate SEO',
      })
    }
  }, [model])

  return { ...state, generate }
}

// Caption Hook
export function useCaption(model = 'gpt-4o') {
  const [state, setState] = useAIState<CaptionResult>()

  const generate = useCallback(async (options: CaptionOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const prompt = `Analisis gambar dari URL berikut dan generate alt text serta caption dalam Bahasa Indonesia:\n\nURL: ${options.imageUrl}\n\nKembalikan dalam format JSON:\n{\n  "altText": "deskripsi alt text untuk SEO (max 125 karakter)",\n  "caption": "caption informatif untuk pembaca"\n}\n\nHanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate caption',
      })
    }
  }, [model])

  return { ...state, generate }
}

// Grammar Hook
export function useGrammar(model = 'gpt-4o') {
  const [state, setState] = useAIState<GrammarResult>()

  const check = useCallback(async (options: GrammarOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const prompt = `Periksa dan perbaiki tata bahasa, ejaan, dan tanda baca dari teks berikut:\n\nTeks: ${options.text}\n\nKembalikan dalam format JSON:\n{\n  "corrected": "teks yang sudah diperbaiki",\n  "corrections": [\n    {"original": "teks asli", "suggestion": "perbaikan", "reason": "alasan perbaikan"}\n  ]\n}\n\nJika tidak ada koreksi, kembalikan corrections kosong. Hanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to check grammar',
      })
    }
  }, [model])

  return { ...state, check }
}

// Readability Hook
export function useReadability(model = 'gpt-4o') {
  const [state, setState] = useAIState<ReadabilityResult>()

  const analyze = useCallback(async (options: ReadabilityOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const prompt = `Analisis readability teks berikut (skala 0-100):\n\nTeks: ${options.text}\n\nKembalikan dalam format JSON:\n{\n  "score": [0-100],\n  "level": "tingkat keterbacaan (sangat mudah/mudah/sedang/sulit/sangat sulit)",\n  "suggestions": ["saran 1", "saran 2"]\n}\n\nHanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to analyze readability',
      })
    }
  }, [model])

  return { ...state, analyze }
}

// Fact Check Hook
export function useFactCheck(model = 'gpt-4o') {
  const [state, setState] = useAIState<FactCheckResult>()

  const check = useCallback(async (options: FactCheckOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const prompt = `Periksa fakta-fakta dalam teks berikut:\n\nTeks: ${options.text}\n\nKembalikan dalam format JSON:\n{\n  "claims": [\n    {"text": "pernyataan 1", "verified": true/false, "explanation": "penjelasan"}\n  ],\n  "accuracy_score": [0-100]\n}\n\nHanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to fact check',
      })
    }
  }, [model])

  return { ...state, check }
}

// Objectivity Hook
export function useObjectivity(model = 'gpt-4o') {
  const [state, setState] = useAIState<ObjectivityResult>()

  const analyze = useCallback(async (options: ObjectivityOptions) => {
    setState({ loading: true, result: null, error: null })
    
    try {
      const prompt = `Analisis objectivity dan potential bias dalam teks berita berikut:\n\nTeks: ${options.text}\n\nKembalikan dalam format JSON:\n{\n  "score": [0-100],\n  "biased_phrases": [\n    {"phrase": "frasa yang bias", "suggestion": "alternatif netral"}\n  ],\n  "overall_verdict": "verdict keseluruhan"\n}\n\nHanya kembalikan JSON valid.`
      
      const result = await callOpenAI(model, [
        { role: 'user', content: prompt }
      ])

      try {
        const parsed = JSON.parse(result)
        setState({
          loading: false,
          result: parsed,
          error: null,
        })
      } catch {
        throw new Error('Invalid JSON response')
      }
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to analyze objectivity',
      })
    }
  }, [model])

  return { ...state, analyze }
}