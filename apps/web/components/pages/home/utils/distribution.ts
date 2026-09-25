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
  /** Batas usia maksimal artikel (dalam hari) untuk kandidat Fokus Redaksi. Default: 14 hari */
  maxFokusAgeDays?: number
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
//
// [FIX] isFeatured virtual decay: flag isFeatured hanya diakui jika artikel
//   berusia ≤ FEATURED_DECAY_DAYS (7 hari). Artikel lebih lama diperlakukan
//   sebagai artikel biasa — tidak mendapat bonus editorial 0.5 — sehingga
//   artikel lama yang pernah ditandai editor tidak mendominasi Fokus Redaksi.
//
// [FIX] Hard age cap: artikel > EXTENDED_FOKUS_AGE_DAYS (30 hari) mendapat
//   score -Infinity dan tidak bisa menang scoring apapun.

const DEFAULT_SCORE_WEIGHTS = { freshness: 0.4, engagement: 0.3, editorial: 0.3 }
const FRESHNESS_DECAY_DAYS = 7

/** [FIX] Usia maks agar flag isFeatured masih diperhitungkan di scoring. */
const FEATURED_DECAY_DAYS = 7

/** [FIX] Hard cap usia untuk kandidat Fokus Redaksi.
 *  Artikel > 30 hari mendapat score -Infinity (tidak pernah menang). */
const EXTENDED_FOKUS_AGE_DAYS = 30

/** [FIX] isFeatured hanya berlaku jika artikel masih ≤ FEATURED_DECAY_DAYS.
 *  Ini mencegah artikel lama yang lupa di-uncheck oleh editor mendapat bonus score. */
function isEffectivelyFeatured(article: HomeArticle): boolean {
  if (!article.isFeatured) return false
  const ageDays = (Date.now() - getPublishedDate(article).getTime()) / (1000 * 60 * 60 * 24)
  return ageDays <= FEATURED_DECAY_DAYS
}

function scoreArticle(article: HomeArticle, maxViewCount: number, weights = DEFAULT_SCORE_WEIGHTS): number {
  // Freshness: 0 hari = 1.0, 7 hari = 0.0
  const daysSincePublish = (Date.now() - getPublishedDate(article).getTime()) / (1000 * 60 * 60 * 24)

  // [FIX] Hard age cap: artikel > 30 hari tidak bisa menang apapun
  if (daysSincePublish > EXTENDED_FOKUS_AGE_DAYS) return -Infinity

  const freshness = Math.max(0, 1 - daysSincePublish / FRESHNESS_DECAY_DAYS)

  // Engagement: normalised viewCount
  const engagement = maxViewCount > 0 ? (article.viewCount || 0) / maxViewCount : 0

  // [FIX] Editorial: gunakan isEffectivelyFeatured (bukan raw isFeatured)
  const editorial =
    (isEffectivelyFeatured(article) ? 0.5 : 0) +
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
  // 2. FOKUS REDAKSI: hard cutoff usia + filter isFeatured + scoring
  //
  //    [FIX] Candidate pool kini bertingkat (3 level):
  //      Level 1 (primary)  : artikel ≤ maxFokusAgeDays (default 14 hari)
  //      Level 2 (extended) : artikel ≤ EXTENDED_FOKUS_AGE_DAYS (30 hari)
  //      Level 3 (last-resort): semua remainingAfterHero — hanya aktif jika
  //                             level 1 + 2 keduanya menghasilkan < 2 artikel
  //                             (mis. situs baru / sepi konten / environment test).
  //                             Artikel > 30 hari tetap tidak menang karena hard cap
  //                             di scoreArticle mengembalikan -Infinity.
  //
  //    [FIX] featuredPool menggunakan isEffectivelyFeatured (bukan raw isFeatured)
  //    sehingga artikel lama yang lupa di-uncheck tidak masuk featured pool.
  // ─────────────────────────────────────────────
  const remainingAfterHero = articles.filter(a => !heroIds.has(a.id))
  const sortedRemaining = sortByNewest(remainingAfterHero)

  const maxFokusAgeDays = opts.maxFokusAgeDays ?? 14

  const getAgeDays = (a: HomeArticle) =>
    (Date.now() - getPublishedDate(a).getTime()) / (1000 * 60 * 60 * 24)

  const freshRemaining    = remainingAfterHero.filter(a => getAgeDays(a) <= maxFokusAgeDays)
  const extendedRemaining = remainingAfterHero.filter(a => getAgeDays(a) <= EXTENDED_FOKUS_AGE_DAYS)

  // [FIX] Fallback bertingkat — Level 3 hanya sebagai last-resort
  const candidatePool = freshRemaining.length >= 2
    ? freshRemaining
    : extendedRemaining.length >= 2
      ? extendedRemaining
      : remainingAfterHero

  // [FIX] featuredPool pakai isEffectivelyFeatured (artikel > 7 hari tidak masuk)
  const featuredPool = candidatePool.filter(a => isEffectivelyFeatured(a))
  const fokusRedaksi = featuredPool.length >= 2
    ? scoreAndSort(featuredPool, scoreWeights).slice(0, 4)
    : scoreAndSort(candidatePool, scoreWeights).slice(0, 4)
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

  const technology = takeUnused(pools.technologyPool, 3)
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
