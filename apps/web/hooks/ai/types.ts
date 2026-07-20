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

export interface TranscriptOptions {
  transcript: string
  speakerName?: string
}

export interface SummarizeOptions {
  text: string
  style?: 'excerpt' | 'social' | 'bullet'
}

export interface TranslateOptions {
  text: string
  targetLang: 'en' | 'ms' | 'ar' | 'ja' | 'zh'
}

export interface ImageGenOptions {
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
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

export interface SummarizeResult {
  summary: string
  style: string
}

export interface TranslateResult {
  translated: string
  targetLang: string
}

export interface ImageGenResult {
  url: string
  revisedPrompt: string
}

export interface AIState<T> {
  loading: boolean
  result: T | null
  error: string | null
}
