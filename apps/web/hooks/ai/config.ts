import type {
  RewriteOptions,
  RewriteResult,
  ExpandOptions,
  HeadlineOptions,
  HeadlineResult,
  SEOOptions,
  SEOResult,
  CaptionOptions,
  CaptionResult,
  GrammarOptions,
  GrammarResult,
  ReadabilityOptions,
  ReadabilityResult,
  FactCheckOptions,
  FactCheckResult,
  ObjectivityOptions,
  ObjectivityResult,
  TranscriptOptions,
  SummarizeOptions,
  SummarizeResult,
  TranslateOptions,
  TranslateResult,
  ImageGenOptions,
  ImageGenResult,
} from './types'

export const rewriteConfig = {
  endpoint: 'rewrite',
  methodName: 'rewrite' as const,
  buildPayload: (options: RewriteOptions) => ({
    content: options.content,
    tone: options.tone || 'berita',
    length: options.length || 'sama',
    prevContent: options.prevContent,
    nextContent: options.nextContent,
  }),
  transformResult: (data: string, options: RewriteOptions): RewriteResult => ({
    rewritten: data,
    original: options.content,
    tone: options.tone || 'berita',
    length: options.length || 'sama',
  }),
  errorMessage: 'Failed to rewrite',
}

export const expandConfig = {
  endpoint: 'expand',
  methodName: 'expand' as const,
  buildPayload: (options: ExpandOptions) => ({
    content: options.content,
    prevContent: options.prevContent,
  }),
  transformResult: (data: string, options: ExpandOptions) => ({
    expanded: data,
    original: options.content,
  }),
  errorMessage: 'Failed to expand',
}

export const transcriptToQuoteConfig = {
  endpoint: 'transcript-to-quote',
  methodName: 'transcript' as const,
  buildPayload: (options: TranscriptOptions) => ({
    transcript: options.transcript,
  }),
  transformResult: (data: { quote: string; attribution: string; context: string }) => ({
    quote: data.quote,
    speaker: data.attribution,
    context: data.context,
  }),
  errorMessage: 'Failed to convert transcript',
}

export const headlinesConfig = {
  endpoint: 'headline',
  methodName: 'generate' as const,
  buildPayload: (options: HeadlineOptions) => ({
    title: options.title,
    contentExcerpt: options.contentExcerpt,
  }),
  transformResult: (data: { headlines: string[] }, options: HeadlineOptions): HeadlineResult => ({
    headlines: data.headlines,
    title: options.title,
  }),
  errorMessage: 'Failed to generate headlines',
}

export const seoConfig = {
  endpoint: 'seo',
  methodName: 'generate' as const,
  buildPayload: (options: SEOOptions) => ({
    title: options.title,
    contentExcerpt: options.contentExcerpt,
  }),
  transformResult: (data: { metaTitle: string; metaDescription: string; keywords: string[] }): SEOResult => ({
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    focusKeyword: data.keywords[0] || '',
    suggestions: data.keywords,
  }),
  errorMessage: 'Failed to generate SEO',
}

export const captionConfig = {
  endpoint: 'caption',
  methodName: 'generate' as const,
  buildPayload: (options: CaptionOptions) => ({
    imageUrl: options.imageUrl,
  }),
  transformResult: (data: { caption: string; altText: string }): CaptionResult => ({
    altText: data.altText,
    caption: data.caption,
  }),
  errorMessage: 'Failed to generate caption',
}

export const grammarConfig = {
  endpoint: 'grammar',
  methodName: 'check' as const,
  buildPayload: (options: GrammarOptions) => ({
    text: options.text,
  }),
  transformResult: (
    data: { corrections: { original: string; suggestion: string; reason: string }[]; totalIssues: number },
    options: GrammarOptions
  ): GrammarResult => {
    let corrected = options.text
    for (const c of data.corrections) {
      corrected = corrected.replace(c.original, c.suggestion)
    }
    return {
      corrected,
      corrections: data.corrections,
    }
  },
  errorMessage: 'Failed to check grammar',
}

export const readabilityConfig = {
  endpoint: 'readability',
  methodName: 'analyze' as const,
  buildPayload: (options: ReadabilityOptions) => ({
    text: options.text,
  }),
  transformResult: (data: { score: number; level: string; summary: string; suggestions: string[] }): ReadabilityResult => ({
    score: data.score,
    level: data.level,
    suggestions: data.suggestions,
  }),
  errorMessage: 'Failed to analyze readability',
}

export const factCheckConfig = {
  endpoint: 'fact-check',
  methodName: 'check' as const,
  buildPayload: (options: FactCheckOptions) => ({
    text: options.text,
  }),
  transformResult: (
    data: { claims: { claim: string; verdict: string; explanation: string; sources: string[] }[]; trustScore: number }
  ): FactCheckResult => ({
    claims: data.claims.map((c) => ({
      text: c.claim,
      verified: c.verdict === 'Benar',
      explanation: c.explanation,
    })),
    accuracy_score: data.trustScore,
  }),
  errorMessage: 'Failed to fact check',
}

export const objectivityConfig = {
  endpoint: 'objectivity',
  methodName: 'analyze' as const,
  buildPayload: (options: ObjectivityOptions) => ({
    text: options.text,
  }),
  transformResult: (
    data: { score: number; issues: { original: string; suggested: string; reason: string; severity: string }[]; ethicalCompliance: string }
  ): ObjectivityResult => ({
    score: data.score,
    biased_phrases: data.issues.map((issue) => ({
      phrase: issue.original,
      suggestion: issue.suggested,
    })),
    overall_verdict: data.ethicalCompliance,
  }),
  errorMessage: 'Failed to analyze objectivity',
}

export const summarizeConfig = {
  endpoint: 'summarize',
  methodName: 'generate' as const,
  buildPayload: (options: SummarizeOptions) => ({
    text: options.text,
    style: options.style || 'excerpt',
  }),
  transformResult: (data: string, options: SummarizeOptions): SummarizeResult => ({
    summary: data,
    style: options.style || 'excerpt',
  }),
  errorMessage: 'Failed to summarize',
}

export const translateConfig = {
  endpoint: 'translate',
  methodName: 'translate' as const,
  buildPayload: (options: TranslateOptions) => ({
    text: options.text,
    targetLang: options.targetLang,
  }),
  transformResult: (data: string, options: TranslateOptions): TranslateResult => ({
    translated: data,
    targetLang: options.targetLang,
  }),
  errorMessage: 'Failed to translate',
}

export const imageGenConfig = {
  endpoint: 'image-gen',
  methodName: 'generate' as const,
  buildPayload: (options: ImageGenOptions) => ({
    prompt: options.prompt,
    size: options.size || '1024x1024',
  }),
  transformResult: (data: { url: string; revisedPrompt: string }): ImageGenResult => ({
    url: data.url,
    revisedPrompt: data.revisedPrompt,
  }),
  errorMessage: 'Failed to generate image',
}
