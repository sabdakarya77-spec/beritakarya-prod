/**
 * apps/web/components/pages/home/FeedRow.tsx
 *
 * Render satu baris feed sesuai pola visual (hero_pair, triplet, dst).
 *
 * PENTING: komponen ini idealnya SELALU dipanggil lewat `chunkIntoRows()`
 * (utils/feedPatterns.ts), yang sudah menjamin `articles.length` sesuai
 * kebutuhan pola yang dipilih. Tapi kita tetap pasang guard defensif di
 * sini — kalau suatu saat ada pemanggil lain (refactor, komponen baru)
 * yang lupa lewat chunkIntoRows, baris ini tidak boleh crash. Yang boleh
 * terjadi paling buruk adalah tampilan sedikit kurang rapi (fallback grid
 * generik), bukan seluruh homepage blank karena satu NewsCard undefined.
 */

import { NewsCard } from '../../ui/NewsCard'
import type { RowPattern, HomeArticleLike, PATTERN_REQUIREMENTS } from './utils/feedPatterns'
import { PATTERN_REQUIREMENTS as REQUIREMENTS } from './utils/feedPatterns'

interface FeedRowProps<T extends HomeArticleLike = HomeArticleLike> {
  articles: T[]
  pattern: RowPattern
  site: string
  rowIndex: number
}

/**
 * Guard defensif: kalau jumlah artikel yang diterima kurang dari yang
 * dibutuhkan pola aslinya, turunkan lagi ke `single_feature` on-the-fly.
 * Ini lapis pengaman KEDUA (yang pertama ada di chunkIntoRows) — sengaja
 * didobel karena biaya defensifnya murah dan konsekuensi kalau salah satu
 * lapis lupa dipanggil itu crash total di homepage publik.
 */
function useSafePattern<T extends HomeArticleLike>(pattern: RowPattern, articles: T[]): RowPattern {
  if (articles.length >= REQUIREMENTS[pattern]) return pattern
  if (articles.length >= 1) return 'single_feature'
  return pattern // articles kosong — akan ditangani sebagai render null di bawah
}

export function FeedRow<T extends HomeArticleLike>({ articles, pattern: intendedPattern, site, rowIndex }: FeedRowProps<T>) {
  if (articles.length === 0) return null

  const pattern = useSafePattern(intendedPattern, articles)

  if (process.env.NODE_ENV !== 'production' && pattern !== intendedPattern) {
    // eslint-disable-next-line no-console
    console.warn(
      `[FeedRow] Row ${rowIndex}: pola "${intendedPattern}" butuh ${REQUIREMENTS[intendedPattern]} artikel, ` +
      `cuma dapat ${articles.length}. Diturunkan ke "${pattern}". ` +
      `Kalau ini sering muncul, cek pemanggil FeedRow — seharusnya selalu lewat chunkIntoRows().`
    )
  }

  switch (pattern) {
    case 'hero_pair':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="large" imagePosition="background" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" imagePosition="right" site={site} />
        </div>
      )

    case 'triplet':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" imagePosition="top" site={site} />
          ))}
        </div>
      )

    case 'asymmetric':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-7">
            <NewsCard article={articles[0]} variant="large" imagePosition="background" site={site} />
          </div>
          <div className="flex flex-col gap-4 md:col-span-5">
            <NewsCard article={articles[1]} variant="horizontal" imagePosition="left" site={site} />
            <NewsCard article={articles[2]} variant="horizontal" imagePosition="left" site={site} />
          </div>
        </div>
      )

    case 'text_heavy':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="horizontal" imagePosition="left" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" imagePosition="right" site={site} />
        </div>
      )

    case 'compact_triplet':
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" imagePosition="top" size="compact" site={site} />
          ))}
        </div>
      )

    case 'single_feature':
      return (
        <div className="grid grid-cols-1">
          <NewsCard article={articles[0]} variant="large" imagePosition="background" site={site} />
        </div>
      )

    default:
      // Exhaustiveness guard — kalau ada RowPattern baru ditambahkan tapi
      // lupa di-handle di switch ini, TypeScript akan menandai error di
      // baris berikut (bukan runtime crash diam-diam).
      return ((_: never) => null)(pattern)
  }
}
