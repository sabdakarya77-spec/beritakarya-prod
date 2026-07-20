import { createAIHook } from './ai/createAIHook'
import {
  rewriteConfig,
  expandConfig,
  transcriptToQuoteConfig,
  headlinesConfig,
  seoConfig,
  captionConfig,
  grammarConfig,
  readabilityConfig,
  factCheckConfig,
  objectivityConfig,
  summarizeConfig,
  translateConfig,
  imageGenConfig,
} from './ai/config'

export {
  type RewriteOptions,
  type ExpandOptions,
  type HeadlineOptions,
  type SEOOptions,
  type CaptionOptions,
  type GrammarOptions,
  type ReadabilityOptions,
  type FactCheckOptions,
  type ObjectivityOptions,
  type TranscriptOptions,
  type SummarizeOptions,
  type TranslateOptions,
  type ImageGenOptions,
  type RewriteResult,
  type HeadlineResult,
  type SEOResult,
  type CaptionResult,
  type GrammarResult,
  type ReadabilityResult,
  type FactCheckResult,
  type ObjectivityResult,
  type SummarizeResult,
  type TranslateResult,
  type ImageGenResult,
} from './ai/types'

export const useRewrite = createAIHook(rewriteConfig)
export const useExpand = createAIHook(expandConfig)
export const useTranscriptToQuote = createAIHook(transcriptToQuoteConfig)
export const useHeadlines = createAIHook(headlinesConfig)
export const useSEO = createAIHook(seoConfig)
export const useCaption = createAIHook(captionConfig)
export const useGrammar = createAIHook(grammarConfig)
export const useReadability = createAIHook(readabilityConfig)
export const useFactCheck = createAIHook(factCheckConfig)
export const useObjectivity = createAIHook(objectivityConfig)
export const useSummarize = createAIHook(summarizeConfig)
export const useTranslate = createAIHook(translateConfig)
export const useImageGen = createAIHook(imageGenConfig)
