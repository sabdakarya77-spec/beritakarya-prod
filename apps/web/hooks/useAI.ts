'use client'

import { useState, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────────

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

// ── State types ──────────────────────────────────────────────────

interface AIState<T> {
  loading: boolean
  result: T | null
  error: string | null
}

function useAIState<T>() {
  return useState<AIState<T>>({
    loading: false,
    result: null,
    error: null,
  })
}

// ── Backend API helper ───────────────────────────────────────────

interface BackendAIResult<T> {
  success: boolean
  data?: T
  error?: string
}

async function callBackendAPI<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/v1/ai/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}))
    if (data.error?.code === 'CONSENT_REQUIRED') {
      throw new Error('CONSENT_REQUIRED')
    }
    throw new Error(data.error?.message || 'Access denied')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error?.message || 'AI request failed')
  }

  const result: BackendAIResult<T> = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'AI request failed')
  }
  return result.data as T
}

// ── Hooks ────────────────────────────────────────────────────────

// Rewrite Hook
export function useRewrite() {
  const [state, setState] = useAIState<RewriteResult>()

  const rewrite = useCallback(async (options: RewriteOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<string>('rewrite', {
        content: options.content,
        tone: options.tone || 'berita',
        length: options.length || 'sama',
        prevContent: options.prevContent,
        nextContent: options.nextContent,
      })

      setState({
        loading: false,
        result: {
          rewritten: data,
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
  }, [])

  return { ...state, rewrite }
}

// Expand Hook
export function useExpand() {
  const [state, setState] = useAIState<{ expanded: string; original: string }>()

  const expand = useCallback(async (options: ExpandOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<string>('expand', {
        content: options.content,
        prevContent: options.prevContent,
      })

      setState({
        loading: false,
        result: {
          expanded: data,
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
  }, [])

  return { ...state, expand }
}

// Transcript to Quote Hook
export function useTranscriptToQuote() {
  const [state, setState] = useAIState<{ quote: string; speaker: string; context: string }>()

  const transcript = useCallback(async (options: TranscriptOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{ quote: string; attribution: string; context: string }>(
        'transcript-to-quote',
        { transcript: options.transcript }
      )

      setState({
        loading: false,
        result: {
          quote: data.quote,
          speaker: data.attribution,
          context: data.context,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to convert transcript',
      })
    }
  }, [])

  return { ...state, transcript }
}

// Headlines Hook
export function useHeadlines() {
  const [state, setState] = useAIState<HeadlineResult>()

  const generate = useCallback(async (options: HeadlineOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{ headlines: string[] }>('headline', {
        title: options.title,
        contentExcerpt: options.contentExcerpt,
      })

      setState({
        loading: false,
        result: {
          headlines: data.headlines,
          title: options.title,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate headlines',
      })
    }
  }, [])

  return { ...state, generate }
}

// SEO Hook
export function useSEO() {
  const [state, setState] = useAIState<SEOResult>()

  const generate = useCallback(async (options: SEOOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{ metaTitle: string; metaDescription: string; keywords: string[] }>(
        'seo',
        {
          title: options.title,
          contentExcerpt: options.contentExcerpt,
        }
      )

      setState({
        loading: false,
        result: {
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          focusKeyword: data.keywords[0] || '',
          suggestions: data.keywords,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate SEO',
      })
    }
  }, [])

  return { ...state, generate }
}

// Caption Hook
export function useCaption() {
  const [state, setState] = useAIState<CaptionResult>()

  const generate = useCallback(async (options: CaptionOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{ caption: string; altText: string }>('caption', {
        imageUrl: options.imageUrl,
      })

      setState({
        loading: false,
        result: {
          altText: data.altText,
          caption: data.caption,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate caption',
      })
    }
  }, [])

  return { ...state, generate }
}

// Grammar Hook
export function useGrammar() {
  const [state, setState] = useAIState<GrammarResult>()

  const check = useCallback(async (options: GrammarOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{
        corrections: { original: string; suggestion: string; reason: string }[]
        totalIssues: number
      }>('grammar', { text: options.text })

      // Build corrected text by applying each correction sequentially
      let corrected = options.text
      for (const c of data.corrections) {
        corrected = corrected.replace(c.original, c.suggestion)
      }

      setState({
        loading: false,
        result: {
          corrected,
          corrections: data.corrections,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to check grammar',
      })
    }
  }, [])

  return { ...state, check }
}

// Readability Hook
export function useReadability() {
  const [state, setState] = useAIState<ReadabilityResult>()

  const analyze = useCallback(async (options: ReadabilityOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{
        score: number
        level: string
        summary: string
        suggestions: string[]
      }>('readability', { text: options.text })

      setState({
        loading: false,
        result: {
          score: data.score,
          level: data.level,
          suggestions: data.suggestions,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to analyze readability',
      })
    }
  }, [])

  return { ...state, analyze }
}

// Fact Check Hook
export function useFactCheck() {
  const [state, setState] = useAIState<FactCheckResult>()

  const check = useCallback(async (options: FactCheckOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{
        claims: { claim: string; verdict: string; explanation: string; sources: string[] }[]
        summary: string
        trustScore: number
      }>('fact-check', { text: options.text })

      setState({
        loading: false,
        result: {
          claims: data.claims.map((c) => ({
            text: c.claim,
            verified: c.verdict === 'Benar',
            explanation: c.explanation,
          })),
          accuracy_score: data.trustScore,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to fact check',
      })
    }
  }, [])

  return { ...state, check }
}

// Objectivity Hook
export function useObjectivity() {
  const [state, setState] = useAIState<ObjectivityResult>()

  const analyze = useCallback(async (options: ObjectivityOptions) => {
    setState({ loading: true, result: null, error: null })

    try {
      const data = await callBackendAPI<{
        score: number
        issues: { original: string; suggested: string; reason: string; severity: string }[]
        ethicalCompliance: string
        suggestions: string[]
      }>('objectivity', { text: options.text })

      setState({
        loading: false,
        result: {
          score: data.score,
          biased_phrases: data.issues.map((issue) => ({
            phrase: issue.original,
            suggestion: issue.suggested,
          })),
          overall_verdict: data.ethicalCompliance,
        },
        error: null,
      })
    } catch (error) {
      setState({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to analyze objectivity',
      })
    }
  }, [])

  return { ...state, analyze }
}
