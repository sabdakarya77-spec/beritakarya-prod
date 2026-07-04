/**
 * apps/web/components/pages/home/utils/feedPatterns.ts
 *
 * Chunking logic untuk feed pattern rotation. Ini fungsi yang sebelumnya
 * cuma disebut (`chunkIntoRows(articles, DEFAULT_PATTERN_ROTATION)`) tapi
 * tidak pernah didefinisikan di proposal awal.
 *
 * Prinsip utama: kalau artikel yang tersisa tidak cukup untuk pola yang
 * seharusnya giliran jalan (rotasi), turunkan ke pola yang lebih kecil —
 * JANGAN render pola besar dengan artikel kurang dari kebutuhannya (itu
 * yang menyebabkan `articles[2]` undefined dan NewsCard crash).
 */

export type RowPattern =
  | 'hero_pair'        // 2 kolom: background + right
  | 'triplet'          // 3 kolom: semua image=top
  | 'asymmetric'       // 2 kolom: background besar + 2 stacked left
  | 'text_heavy'       // 2 kolom: left + right, excerpt visible
  | 'compact_triplet'  // 3 kolom: image=top, no excerpt
  | 'single_feature'   // 1 kolom: full-width background

export interface HomeArticleLike {
  id: string
  [key: string]: unknown
}

export interface FeedRowData<T extends HomeArticleLike = HomeArticleLike> {
  pattern: RowPattern
  articles: T[]
  rowIndex: number
}

/** Berapa artikel yang dibutuhkan tiap pola — dipakai untuk validasi & fallback. */
export const PATTERN_REQUIREMENTS: Record<RowPattern, number> = {
  hero_pair: 2,
  triplet: 3,
  asymmetric: 3,
  text_heavy: 2,
  compact_triplet: 3,
  single_feature: 1,
}

/**
 * Kalau pola yang seharusnya giliran (sesuai rotasi) butuh lebih banyak
 * artikel dari yang tersisa, turun ke pola berikut secara berurutan sampai
 * ketemu yang muat. `single_feature` selalu jadi jaring pengaman terakhir
 * karena cuma butuh 1 artikel.
 */
const FALLBACK_CHAIN: Record<RowPattern, RowPattern[]> = {
  hero_pair: ['text_heavy', 'single_feature'],
  triplet: ['text_heavy', 'hero_pair', 'single_feature'],
  asymmetric: ['hero_pair', 'text_heavy', 'single_feature'],
  text_heavy: ['single_feature'],
  compact_triplet: ['hero_pair', 'text_heavy', 'single_feature'],
  single_feature: [], // sudah paling minimal, tidak ada fallback lagi
}

export const DEFAULT_PATTERN_ROTATION: RowPattern[] = [
  'hero_pair',
  'triplet',
  'asymmetric',
  'text_heavy',
  'compact_triplet',
  'single_feature',
]

/** Pilih pola yang benar-benar bisa dirender dengan jumlah artikel yang tersisa. */
function resolvePattern(intended: RowPattern, availableCount: number): RowPattern {
  if (availableCount >= PATTERN_REQUIREMENTS[intended]) return intended
  const chain = FALLBACK_CHAIN[intended]
  for (const candidate of chain) {
    if (availableCount >= PATTERN_REQUIREMENTS[candidate]) return candidate
  }
  // Jaring pengaman mutlak — seharusnya tidak pernah sampai sini kalau
  // availableCount >= 1, karena single_feature ada di semua fallback chain.
  return 'single_feature'
}

/**
 * Pecah daftar artikel jadi baris-baris dengan pola bervariasi.
 *
 * @param startRowIndex - index baris awal, untuk kontinuitas rotasi lintas
 *   halaman "Load More" (supaya klik "muat lagi" tidak selalu mulai dari
 *   `hero_pair` lagi). Caller (mis. `LoadMoreArticles`) perlu menyimpan
 *   jumlah baris yang sudah dirender dan meneruskannya sebagai nilai ini
 *   di fetch berikutnya.
 */
export function chunkIntoRows<T extends HomeArticleLike>(
  articles: T[],
  rotation: RowPattern[] = DEFAULT_PATTERN_ROTATION,
  startRowIndex = 0
): FeedRowData<T>[] {
  const rows: FeedRowData<T>[] = []
  let remaining = [...articles]
  let rotationCursor = startRowIndex

  while (remaining.length > 0) {
    const intended = rotation[rotationCursor % rotation.length]
    const pattern = resolvePattern(intended, remaining.length)
    const count = PATTERN_REQUIREMENTS[pattern]

    rows.push({
      pattern,
      articles: remaining.slice(0, count),
      rowIndex: rotationCursor,
    })

    remaining = remaining.slice(count)
    rotationCursor += 1
  }

  return rows
}
