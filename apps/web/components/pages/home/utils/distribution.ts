/**
 * apps/web/components/pages/home/utils/distribution.ts
 *
 * Zone allocation engine for the homepage.
 *
 * Prinsip:
 * 1. Hero = 5 artikel terbaru (publishedAt descending), tanpa scoring
 * 2. Fokus Redaksi = scoring (freshness 40% + engagement 30% + editorial 30%)
 * 3. Feed = sisa setelah hero + fokus, urut by publishedAt descending
 * 4. Editorial extras = pool terpisah, dedup progresif
 * 5. Popular & Trending = fetch terpisah, tetap terpisah
 */

// ---------------------------------------------------------------------------
// Types
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
  category?: { name: string; slug?: string; parentSlug?: string; parent?: { slug?: string } | null }
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null
  blocks?: Array<{ type: string; url?: string; embedType?: string; images?: { url: string }[] }>
}

export type HeroMode = 'SINGLE_HEADLINE' | 'BENTO_4' | 'BENTO_3' | 'MAGAZINE_COVER_550'

export interface HomepagePools {
  /** Pool utama untuk hero/fokus/feed — hasil query utama (limit ~25). */
  main: HomeArticle[]
  /** 5 artikel by views — fetch terpisah, TETAP terpisah. */
  trending: HomeArticle[]
  opinionPool: HomeArticle[]
  photoPool: HomeArticle[]
  videoPool: HomeArticle[]
  /** Pool untuk section Teknologi — filter by category slug. */
  technologyPool: HomeArticle[]
}

export interface DistributionOptions {
  heroMode?: HeroMode
  /** Bobot scoring zona 2 Fokus Redaksi. Default: freshness=0.4, engagement=0.3, editorial=0.3 */
  scoreWeights?: {
    freshness?: number
    engagement?: number
    editorial?: number
  }
}

export interface DistributionResult {
  hero: HomeArticle[]
  fokusRedaksi: HomeArticle[]
  feed: HomeArticle[]
  opinion: HomeArticle[]
  photoJournal: HomeArticle[]
  videoStories: HomeArticle[]
  trending: HomeArticle[]
  popular: HomeArticle[]
  technology: HomeArticle[]
  /** Semua artikel yang TIDAK dipakai di zona manapun — untuk Load More */
  remainingArticles: HomeArticle[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPublishedDate(article: HomeArticle): Date {
  return new Date(article.publishedAt || article.createdAt || Date.now())
}

function sortByNewest(articles: HomeArticle[]): HomeArticle[] {
  return [...articles].sort(
    (a, b) => getPublishedDate(b).getTime() - getPublishedDate(a).getTime()
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
// Scoring — Fokus Redaksi
// ---------------------------------------------------------------------------
// score = (freshness × 0.4) + (engagement × 0.3) + (editorial × 0.3)
//
// freshness  = max(0, 1 - daysSincePublish / 7)  → 0–1 (hari ke-7 = 0)
// engagement = viewCount / maxViewCount (normalised) → 0–1
// editorial  = isFeatured(0.5) + isExclusive(0.3) + isBreaking(0.2) → 0–1

const DEFAULT_SCORE_WEIGHTS = { freshness: 0.4, engagement: 0.3, editorial: 0.3 }
const FRESHNESS_DECAY_DAYS = 7

function scoreArticle(article: HomeArticle, maxViewCount: number, weights = DEFAULT_SCORE_WEIGHTS): number {
  // Freshness: 0 hari = 1.0, 7 hari = 0.0
  const daysSincePublish = (Date.now() - getPublishedDate(article).getTime()) / (1000 * 60 * 60 * 24)
  const freshness = Math.max(0, 1 - daysSincePublish / FRESHNESS_DECAY_DAYS)

  // Engagement: normalised viewCount
  const engagement = maxViewCount > 0 ? (article.viewCount || 0) / maxViewCount : 0

  // Editorial: isFeatured + isExclusive + isBreaking
  const editorial =
    (article.isFeatured ? 0.5 : 0) +
    (article.isExclusive ? 0.3 : 0) +
    (article.isBreaking ? 0.2 : 0)

  return (freshness * weights.freshness)
    + (engagement * weights.engagement)
    + (editorial * weights.editorial)
}

function scoreAndSort(articles: HomeArticle[], weights = DEFAULT_SCORE_WEIGHTS): HomeArticle[] {
  if (articles.length === 0) return []
  const maxViewCount = Math.max(...articles.map(a => a.viewCount || 0), 1)
  return [...articles]
    .map(a => ({ article: a, score: scoreArticle(a, maxViewCount, weights) }))
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article)
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function scoreAndDistribute(pools: HomepagePools, opts: DistributionOptions = {}): DistributionResult {
  const heroMode: HeroMode = opts.heroMode ?? 'MAGAZINE_COVER_550'
  const scoreWeights = { ...DEFAULT_SCORE_WEIGHTS, ...opts.scoreWeights }
  const articles = dedupById(pools.main)

  // ─────────────────────────────────────────────
  // 1. HERO: 5 artikel terbaru (publishedAt desc)
  //    Tanpa breaking override, tanpa scoring kompleks.
  // ─────────────────────────────────────────────
  const heroCount = heroMode === 'SINGLE_HEADLINE' ? 1
    : heroMode === 'BENTO_3' ? 3
    : heroMode === 'MAGAZINE_COVER_550' ? 5
    : 4

  const sortedByNewest = sortByNewest(articles)
  const hero = sortedByNewest.slice(0, heroCount)
  const heroIds = new Set(hero.map(a => a.id))

  // ─────────────────────────────────────────────
  // 2. FOKUS REDAKSI: filter isFeatured + scoring
  //    Filter dulu: hanya artikel featured yang masuk zona ini.
  //    Di antara featured, pakai scoring untuk urutan supaya rotasi.
  //    Fallback: jika featured kurang dari 2, pakai scoring semua sisa.
  // ─────────────────────────────────────────────
  const remainingAfterHero = articles.filter(a => !heroIds.has(a.id))
  const sortedRemaining = sortByNewest(remainingAfterHero)

  const featuredPool = remainingAfterHero.filter(a => a.isFeatured)
  const fokusRedaksi = featuredPool.length >= 2
    ? scoreAndSort(featuredPool, scoreWeights).slice(0, 4)
    : scoreAndSort(remainingAfterHero, scoreWeights).slice(0, 4)
  const fokusIds = new Set(fokusRedaksi.map(a => a.id))

  // ─────────────────────────────────────────────
  // 3. BERITA TERBARU (Feed): sisa setelah hero + fokus
  //    Urut by publishedAt descending.
  // ─────────────────────────────────────────────
  const feedPool = sortedRemaining.filter(a => !fokusIds.has(a.id))
  const feed = feedPool.slice(0, 16)

  // ─────────────────────────────────────────────
  // 4. EDITORIAL EXTRAS: pool terpisah, dedup progresif
  //    Urutan: teknologi → opini → foto → video → trending.
  //    Prioritas keputusan editor > metric views.
  // ─────────────────────────────────────────────
  const usedIds = new Set([...hero, ...fokusRedaksi, ...feed].map(a => a.id))

  const takeUnused = (pool: HomeArticle[], limit: number): HomeArticle[] => {
    const picked = dedupById(pool).filter(a => !usedIds.has(a.id)).slice(0, limit)
    picked.forEach(a => usedIds.add(a.id))
    return picked
  }

  const technology = takeUnused(pools.technologyPool, 4)
  const opinion = takeUnused(pools.opinionPool, 3)
  const photoJournal = takeUnused(pools.photoPool, 3)
  const videoStories = takeUnused(pools.videoPool, 3)
  const trending = takeUnused(pools.trending, 5)

  // ─────────────────────────────────────────────
  // 5. POPULAR: untuk sidebar — non-hero, non-trending
  // ─────────────────────────────────────────────
  const trendingIds = new Set(trending.map(a => a.id))
  const popular = articles
    .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id))
    .slice(0, 5)

  // ─────────────────────────────────────────────
  // 6. REMAINING: semua artikel yang TIDAK dipakai di zona manapun
  //    Untuk Load More — hindari duplikat dengan zona yang sudah tampil.
  // ─────────────────────────────────────────────
  const allUsedIds = new Set([
    ...hero,
    ...fokusRedaksi,
    ...feed,
    ...technology,
    ...opinion,
    ...photoJournal,
    ...videoStories,
    ...trending,
  ].map(a => a.id))

  const remainingArticles = articles.filter(a => !allUsedIds.has(a.id))

  return {
    hero,
    fokusRedaksi,
    feed,
    technology,
    opinion,
    photoJournal,
    videoStories,
    trending,
    popular,
    remainingArticles,
  }
}
