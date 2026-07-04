import NewsCard from '../../ui/NewsCard'
import type { HomeArticle } from './utils/distribution'
import type { RowPattern } from './utils/feedPatterns'
import { PATTERN_REQUIREMENTS } from './utils/feedPatterns'

interface FeedRowProps {
  articles: HomeArticle[]
  pattern: RowPattern
  site: string
  rowIndex: number
}

function getSafePattern(pattern: RowPattern, articles: HomeArticle[]): RowPattern {
  if (articles.length >= PATTERN_REQUIREMENTS[pattern]) return pattern
  if (articles.length >= 1) return 'single_feature'
  return pattern
}

export function FeedRow({ articles, pattern: intendedPattern, site, rowIndex }: FeedRowProps) {
  if (articles.length === 0) return null

  const pattern = getSafePattern(intendedPattern, articles)

  if (process.env.NODE_ENV !== 'production' && pattern !== intendedPattern) {
    console.warn(
      `[FeedRow] Row ${rowIndex}: pola "${intendedPattern}" butuh ${PATTERN_REQUIREMENTS[intendedPattern]} artikel, ` +
      `cuma dapat ${articles.length}. Diturunkan ke "${pattern}".`
    )
  }

  switch (pattern) {
    // Design F Row 1: background besar + right (text left, image right)
    case 'hero_pair':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="medium" imagePosition="background" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" imagePosition="right" site={site} />
        </div>
      )

    // Design F Row 2: 3 kartu sejajar, image di atas
    case 'triplet':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" imagePosition="top" site={site} />
          ))}
        </div>
      )

    // Design F Row 3: kiri besar background + kanan 2 stacked (image left)
    case 'asymmetric':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-7">
            <NewsCard article={articles[0]} variant="medium" imagePosition="background" site={site} />
          </div>
          <div className="flex flex-col gap-4 md:col-span-5">
            <NewsCard article={articles[1]} variant="horizontal" imagePosition="left" site={site} />
            <NewsCard article={articles[2]} variant="horizontal" imagePosition="left" site={site} />
          </div>
        </div>
      )

    // Design F Row 4: 2 kartu horizontal, kiri + kanan (image right untuk kontras)
    case 'text_heavy':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="horizontal" imagePosition="left" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" imagePosition="right" site={site} />
        </div>
      )

    // Design F Row 5: 3 kartu compact, ukuran lebih kecil dari triplet
    case 'compact_triplet':
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="compact" site={site} />
          ))}
        </div>
      )

    // Fallback: 1 kartu full-width background
    case 'single_feature':
      return (
        <div className="grid grid-cols-1">
          <NewsCard article={articles[0]} variant="medium" imagePosition="background" site={site} />
        </div>
      )

    default:
      return ((_: never) => null)(pattern)
  }
}
