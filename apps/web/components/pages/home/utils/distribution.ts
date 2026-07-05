/**
 * apps/web/components/pages/home/utils/distribution.ts
 *
 * Zone allocation engine for the homepage.
 * Logic sederhana: hero = terbaru, fokus = featured, feed = sisa.
 *
 * Prinsip:
 * 1. Hero = 5 artikel terbaru (publishedAt descending), tanpa scoring kompleks
 * 2. Fokus Redaksi = artikel featured (isFeatured), fallback ke terbaru
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
  category?: { name: string; slug?: string; parentSlug?: string }
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null
  blocks?: Array<{ type: string; url?: string; embedType?: string; images?: { url: string }[] }>
}

export type HeroMode = 'SINGLE_HEADLINE' | 'BENTO_4' | 'BENTO_3' | 'MAGAZINE_COVER_550'

export interface HomepagePools {
  /** Pool utama untuk hero/fokus/feed — hasil query utama (limit ~25). */
  main: HomeArticle[]
  /** 5 artikel by views — fetch terpisah, TETAP terpisah. */
  trending: HomeArticle[]
  /** Fetch mandiri, bukan sisa pool utama. */
  editorChoicePool: HomeArticle[]
  opinionPool: HomeArticle[]
  photoPool: HomeArticle[]
  videoPool: HomeArticle[]
}

export interface DistributionOptions {
  heroMode?: HeroMode
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
// Main entry point
// ---------------------------------------------------------------------------

export function scoreAndDistribute(pools: HomepagePools, opts: DistributionOptions = {}): DistributionResult {
  const heroMode: HeroMode = opts.heroMode ?? 'MAGAZINE_COVER_550'
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
  // 2. FOKUS REDAKSI: featured articles, fallback ke terbaru
  //    Prioritaskan isFeatured=true, maksimal 4.
  //    Kalau kurang dari 2 featured, fallback ke terbaru.
  // ─────────────────────────────────────────────
  const remainingAfterHero = articles.filter(a => !heroIds.has(a.id))
  const sortedRemaining = sortByNewest(remainingAfterHero)

  const featured = sortedRemaining.filter(a => a.isFeatured)
  const fokusRedaksi = featured.length >= 2
    ? featured.slice(0, 4)
    : sortedRemaining.slice(0, 4)
  const fokusIds = new Set(fokusRedaksi.map(a => a.id))

  // ─────────────────────────────────────────────
  // 3. BERITA TERBARU (Feed): sisa setelah hero + fokus
  //    Urut by publishedAt descending.
  // ─────────────────────────────────────────────
  const feedPool = sortedRemaining.filter(a => !fokusIds.has(a.id))
  const feedFeatured = feedPool.slice(0, 4)
  const feedStream = feedPool.slice(4, 16)

  // ─────────────────────────────────────────────
  // 4. EDITORIAL EXTRAS: pool terpisah, dedup progresif
  //    Urutan: editor choice → opini → foto → video → trending.
  //    Prioritas keputusan editor > metric views.
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // 5. POPULAR: untuk sidebar — non-hero, non-trending
  // ─────────────────────────────────────────────
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
  }
}
