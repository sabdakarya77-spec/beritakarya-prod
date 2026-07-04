/**
 * apps/web/components/pages/home/utils/distribution.ts
 *
 * Article scoring & zone allocation engine for the homepage.
 * Replaces the old position-based `distributeArticles()`.
 *
 * Perubahan penting dari draft awal (hasil review):
 * 1. Engagement dapat "grace period" — artikel baru tidak dihukum karena
 *    belum sempat dilihat orang. Bobot direalokasikan ke dimensi lain,
 *    bukan ditebak dengan nilai netral 0.5.
 * 2. isBreaking = hard override (masuk hero di luar mekanisme skor),
 *    BUKAN bobot tambahan. Breaking yang overflow dari hero (kebagian
 *    slot lebih sedikit dari jumlah breaking yang ada) dipaksa masuk
 *    depan Fokus Redaksi, tidak dilepas ke kompetisi skor biasa.
 * 3. Semua pool editorial extras (editorChoice/opinion/photo/video/
 *    trending) di-fetch mandiri oleh caller (Server Component, paralel,
 *    tidak nambah latency user) — bukan mengambil sisa dari pool utama.
 * 4. Dedup antar zona editorial extras berjalan progresif (usedIds
 *    di-update satu per satu), bukan dihitung sekali di awal — supaya
 *    satu artikel tidak muncul di dua section editorial sekaligus.
 */

// ---------------------------------------------------------------------------
// Types — disesuaikan dengan HomeArticle yang ada di SiteHomePage.tsx
// ---------------------------------------------------------------------------

export interface HomeArticle {
  id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: string
  contentType?: string
  publishedAt?: string
  createdAt?: string
  isFeatured?: boolean
  isExclusive?: boolean
  isBreaking?: boolean
  viewCount?: number
  readingTimeMin?: number
  wordCount?: number
  author?: { name: string; avatarUrl?: string | null }
  category?: { name: string; slug?: string; parentSlug?: string } // legacy
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null
  blocks?: Array<{ type: string; url?: string; embedType?: string; images?: { url: string }[] }>
}

export interface ScoringWeights {
  freshness: number   // default 0.3
  engagement: number  // default 0.3
  editorial: number   // default 0.3
  relevance: number   // default 0.1
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  freshness: 0.3,
  engagement: 0.3,
  editorial: 0.3,
  relevance: 0.1,
}

interface ArticleSignals {
  freshness: number
  engagement: number
  editorial: number
  relevance: number
}

interface ScoredArticle {
  article: HomeArticle
  signals: ArticleSignals
  score: number
  inGracePeriod: boolean
}

export type HeroMode = 'SINGLE_HEADLINE' | 'BENTO_4' | 'BENTO_3' | 'MAGAZINE_COVER_550'

export interface HomepagePools {
  /** Pool utama untuk hero/fokus/feed — hasil query utama (limit ~25). */
  main: HomeArticle[]
  /** 5 artikel by views — fetch terpisah, TETAP terpisah (hanya di-dedup belakangan). */
  trending: HomeArticle[]
  /** Fetch mandiri, bukan sisa pool utama. */
  editorChoicePool: HomeArticle[]
  opinionPool: HomeArticle[]
  photoPool: HomeArticle[]
  videoPool: HomeArticle[]
}

export interface DistributionOptions {
  heroMode?: HeroMode
  weights?: ScoringWeights
  /** Batas umur artikel (jam) yang dianggap "belum adil" dinilai dari engagement. */
  engagementGracePeriodHours?: number
}

export interface DistributionResult {
  hero: HomeArticle[]
  fokusRedaksi: HomeArticle[]
  feedFeatured: HomeArticle[]
  feedStream: HomeArticle[]
  editorChoice: HomeArticle[]
  opinion: HomeArticle[]
  photoJournal: HomeArticle[]
  videoStories: HomeArticle[]
  trending: HomeArticle[]
  popular: HomeArticle[]
  /** Breaking news yang tidak kebagian slot hero — untuk logging/observability. */
  overflowBreakingCount: number
}

const ENGAGEMENT_GRACE_PERIOD_HOURS_DEFAULT = 2

// ---------------------------------------------------------------------------
// Signal calculators
// ---------------------------------------------------------------------------

function hoursSince(date: Date): number {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60)
}

function getPublishedDate(article: HomeArticle): Date {
  return new Date(article.publishedAt || article.createdAt || Date.now())
}

/** Exponential decay: <6 jam ≈ 1.0, 24 jam ≈ 0.7, 72 jam ≈ 0.3, >168 jam → floor 0.1 */
function calcFreshness(publishedAt: Date): number {
  return Math.max(0.1, Math.exp(-hoursSince(publishedAt) / 48))
}

/**
 * Normalized viewCount — TAPI hanya berlaku setelah grace period lewat.
 * Selama grace period, dimensi ini dianggap tidak bisa dinilai adil dan
 * bobotnya direalokasikan di calcTotalScore(), bukan diisi nilai netral.
 */
function calcEngagement(article: HomeArticle, maxViews: number): number {
  if (maxViews === 0) return 0
  return Math.min(1, (article.viewCount ?? 0) / maxViews)
}

/**
 * isBreaking SENGAJA tidak masuk sini — breaking ditangani sebagai hard
 * override di scoreAndDistribute(), bukan sebagai bobot yang bisa kalah
 * oleh artikel lama yang kebetulan sangat viral.
 */
function calcEditorial(article: HomeArticle): number {
  let score = 0
  if (article.isFeatured) score += 0.35
  if (article.isExclusive) score += 0.25
  return Math.min(1, score)
}

// Helper: ambil semua slug kategori dari artikel (multi-category aware)
function getCategorySlugs(article: HomeArticle): string[] {
  const slugs: string[] = []
  // categories array (baru)
  if (article.categories) {
    for (const c of article.categories) {
      if (c.category?.slug) slugs.push(c.category.slug.toLowerCase())
    }
  }
  // category legacy
  if (article.category?.slug) slugs.push(article.category.slug.toLowerCase())
  if (article.category?.parentSlug) slugs.push(article.category.parentSlug.toLowerCase())
  return slugs
}

function calcRelevance(article: HomeArticle, targetCategorySlugs: string[] = []): number {
  if (targetCategorySlugs.length === 0) return 0.5
  const slugs = getCategorySlugs(article)
  return slugs.some(s => targetCategorySlugs.includes(s)) ? 1.0 : 0.3
}

/**
 * Total score. Kalau artikel masih dalam grace period engagement, bobot
 * `engagement` direalokasikan proporsional ke 3 dimensi lain — bukan
 * ditebak dengan nilai netral 0.5 yang arbitrer.
 */
function calcTotalScore(signals: ArticleSignals, weights: ScoringWeights, inGracePeriod: boolean): number {
  if (inGracePeriod) {
    const remaining = weights.freshness + weights.editorial + weights.relevance
    if (remaining === 0) return 0 // guard: hindari div-by-zero kalau site set semua bobot lain ke 0
    const partial =
      signals.freshness * weights.freshness +
      signals.editorial * weights.editorial +
      signals.relevance * weights.relevance
    const totalWeight = weights.freshness + weights.engagement + weights.editorial + weights.relevance
    return (partial / remaining) * totalWeight
  }
  return (
    signals.freshness * weights.freshness +
    signals.engagement * weights.engagement +
    signals.editorial * weights.editorial +
    signals.relevance * weights.relevance
  )
}

function dedupById(articles: HomeArticle[]): HomeArticle[] {
  const seen = new Set<string>()
  return articles.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function scoreAndDistribute(pools: HomepagePools, opts: DistributionOptions = {}): DistributionResult {
  const weights = opts.weights ?? DEFAULT_WEIGHTS
  const graceHours = opts.engagementGracePeriodHours ?? ENGAGEMENT_GRACE_PERIOD_HOURS_DEFAULT
  const heroMode: HeroMode = opts.heroMode ?? 'BENTO_4'

  const articles = dedupById(pools.main)
  const maxViews = Math.max(...articles.map(a => a.viewCount ?? 0), 1)

  // 1. Score semua artikel di pool utama.
  const scored: ScoredArticle[] = articles.map(article => {
    const publishedAt = getPublishedDate(article)
    const inGracePeriod = hoursSince(publishedAt) < graceHours
    const signals: ArticleSignals = {
      freshness: calcFreshness(publishedAt),
      engagement: calcEngagement(article, maxViews),
      editorial: calcEditorial(article),
      relevance: calcRelevance(article),
    }
    return {
      article,
      signals,
      inGracePeriod,
      score: calcTotalScore(signals, weights, inGracePeriod),
    }
  })

  // 2. Pisahkan breaking news — ini hard override, bukan ikut sort by score.
  //    Di antara sesama breaking, urutkan by publishedAt terbaru dulu.
  const breaking = scored
    .filter(s => s.article.isBreaking)
    .sort((a, b) => getPublishedDate(b.article).getTime() - getPublishedDate(a.article).getTime())
  const nonBreaking = scored
    .filter(s => !s.article.isBreaking)
    .sort((a, b) => b.score - a.score)

  // 3. Hero: breaking selalu didahulukan, sisanya diisi by score.
  const heroCount = heroMode === 'SINGLE_HEADLINE' ? 1
    : heroMode === 'BENTO_3' ? 3
    : heroMode === 'MAGAZINE_COVER_550' ? 5 // 1 utama + 4 thumbnail
    : 4
  const heroPicks = [...breaking, ...nonBreaking].slice(0, heroCount)
  const hero = heroPicks.map(s => s.article)
  const heroIds = new Set(hero.map(a => a.id))

  // 3b. Breaking yang TIDAK kebagian slot hero wajib tetap diprioritaskan —
  //     dipaksa masuk depan Fokus Redaksi, bukan dilepas ke skor biasa
  //     (yang sudah tidak punya bonus breaking sama sekali).
  const overflowBreaking = breaking.map(s => s.article).filter(a => !heroIds.has(a.id))
  if (overflowBreaking.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `[homepage] ${overflowBreaking.length} breaking news tidak muat di hero ` +
      `(heroMode=${heroMode}, kapasitas=${heroCount}) — dipindah ke depan Fokus Redaksi.`
    )
  }

  // 4. Fokus Redaksi: overflow breaking di depan, sisanya diisi dari
  //    artikel ber-flag editorial (isFeatured/isExclusive), fallback ke
  //    top-by-score kalau flag editorial kurang dari 2 artikel.
  const remainingAfterHero = nonBreaking.filter(s => !heroIds.has(s.article.id))
  const editorialFlagged = remainingAfterHero.filter(s => s.signals.editorial >= 0.35).map(s => s.article)
  const fokusBase = editorialFlagged.length >= 2
    ? editorialFlagged.slice(0, 4)
    : remainingAfterHero.slice(0, 4).map(s => s.article)
  const fokusRedaksi = dedupById([...overflowBreaking, ...fokusBase]).slice(0, 4)
  const fokusIds = new Set(fokusRedaksi.map(a => a.id))

  // 5. Feed: sisa artikel pool utama setelah hero+fokus, urut by score.
  const feedPool = remainingAfterHero
    .filter(s => !fokusIds.has(s.article.id))
    .map(s => s.article)
  const feedFeatured = feedPool.slice(0, 4)
  const feedStream = feedPool.slice(4, 16)

  // DEBUG — hapus setelah selesai
  console.log('[distribution DEBUG]', {
    totalArticles: articles.length,
    breakingCount: breaking.length,
    nonBreakingCount: nonBreaking.length,
    heroCount: hero.length,
    heroIds: [...heroIds],
    remainingAfterHeroCount: remainingAfterHero.length,
    editorialFlaggedCount: editorialFlagged.length,
    fokusRedaksiCount: fokusRedaksi.length,
    fokusIds: [...fokusIds],
    feedPoolCount: feedPool.length,
    feedFeaturedCount: feedFeatured.length,
    feedStreamCount: feedStream.length,
  })

  // 6. Editorial extras — dedup PROGRESIF. Urutan sengaja: editorial dulu,
  //    trending terakhir, supaya prioritas keputusan editor > metric views.
  const usedIds = new Set([...hero, ...fokusRedaksi, ...feedFeatured, ...feedStream].map(a => a.id))

  const takeUnused = (pool: HomeArticle[], limit: number): HomeArticle[] => {
    const picked = dedupById(pool).filter(a => !usedIds.has(a.id)).slice(0, limit)
    picked.forEach(a => usedIds.add(a.id))
    return picked
  }

  const editorChoice = takeUnused(pools.editorChoicePool, 3)
  const opinion = takeUnused(pools.opinionPool, 3)
  const photoJournal = takeUnused(pools.photoPool, 3)
  const videoStories = takeUnused(pools.videoPool, 3)
  const trending = takeUnused(pools.trending, 5)

  // 7. Popular: untuk sidebar — non-hero, non-trending
  const trendingIds = new Set(trending.map(a => a.id))
  const popular = articles
    .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id))
    .slice(0, 5)

  return {
    hero,
    fokusRedaksi,
    feedFeatured,
    feedStream,
    editorChoice,
    opinion,
    photoJournal,
    videoStories,
    trending,
    popular,
    overflowBreakingCount: overflowBreaking.length,
  }
}
