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

function useSafePattern(pattern: RowPattern, articles: HomeArticle[]): RowPattern {
  if (articles.length >= PATTERN_REQUIREMENTS[pattern]) return pattern
  if (articles.length >= 1) return 'single_feature'
  return pattern
}

export function FeedRow({ articles, pattern: intendedPattern, site, rowIndex }: FeedRowProps) {
  if (articles.length === 0) return null

  const pattern = useSafePattern(intendedPattern, articles)

  if (process.env.NODE_ENV !== 'production' && pattern !== intendedPattern) {
    console.warn(
      `[FeedRow] Row ${rowIndex}: pola "${intendedPattern}" butuh ${PATTERN_REQUIREMENTS[intendedPattern]} artikel, ` +
      `cuma dapat ${articles.length}. Diturunkan ke "${pattern}".`
    )
  }

  switch (pattern) {
    case 'hero_pair':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="large" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" site={site} />
        </div>
      )

    case 'triplet':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" site={site} />
          ))}
        </div>
      )

    case 'asymmetric':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-7">
            <NewsCard article={articles[0]} variant="large" site={site} />
          </div>
          <div className="flex flex-col gap-4 md:col-span-5">
            <NewsCard article={articles[1]} variant="horizontal" site={site} />
            <NewsCard article={articles[2]} variant="horizontal" site={site} />
          </div>
        </div>
      )

    case 'text_heavy':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="horizontal" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" site={site} />
        </div>
      )

    case 'compact_triplet':
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" site={site} />
          ))}
        </div>
      )

    case 'single_feature':
      return (
        <div className="grid grid-cols-1">
          <NewsCard article={articles[0]} variant="large" site={site} />
        </div>
      )

    default:
      return ((_: never) => null)(pattern)
  }
}
