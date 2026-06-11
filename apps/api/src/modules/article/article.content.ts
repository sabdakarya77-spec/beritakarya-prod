const MIN_WORDS = 50
const MAX_BLOCKS = 200
const MAX_WORDS = 100_000

// Photo journalism specific requirements
const PHOTO_JOURNALISM_MIN_IMAGES = 3
const PHOTO_JOURNALISM_MIN_WORDS = 15

// Video exclusive specific requirements
const VIDEO_EXCLUSIVE_MIN_WORDS = 15

export function extractTextFromBlocks(blocks: any[] | undefined): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((b) => b?.type === 'paragraph' || b?.type === 'heading')
    .map((b) => (typeof b.content === 'string' ? b.content : ''))
    .join(' ')
    .trim()
}

export function countWords(text: string): number {
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function buildMetaDescriptionExcerpt(blocks: any[] | undefined, maxLen = 160): string {
  const text = extractTextFromBlocks(blocks)
  if (!text) return ''
  return text.length <= maxLen ? text : `${text.slice(0, maxLen - 3).trim()}...`
}

export function trimExcerpt(text: string | undefined, maxLen = 160): string {
  const value = text?.trim() || ''
  if (!value) return ''
  return value.length <= maxLen ? value : `${value.slice(0, maxLen - 3).trim()}...`
}

/**
 * Menghitung jumlah foto di gallery block.
 * Digunakan untuk validasi foto jurnalistik.
 */
export function countGalleryImages(blocks: any[] | undefined): number {
  if (!Array.isArray(blocks)) return 0
  const gallery = blocks.find((b) => b?.type === 'gallery')
  if (!gallery || !Array.isArray(gallery.images)) return 0
  return gallery.images.length
}

/**
 * Validasi khusus untuk tipe konten foto jurnalistik.
 * - Minimal 3 foto di galeri
 * - Minimal 15 kata (narasi foto)
 */
export function validatePhotoJournalismRequirements(blocks: any[] | undefined): void {
  if (!blocks) return

  const imageCount = countGalleryImages(blocks)
  if (imageCount < PHOTO_JOURNALISM_MIN_IMAGES) {
    throw Object.assign(
      new Error(`Foto Jurnalistik wajib memiliki minimal ${PHOTO_JOURNALISM_MIN_IMAGES} foto di galeri (saat ini: ${imageCount})`),
      { statusCode: 400 }
    )
  }

  const words = countWords(extractTextFromBlocks(blocks))
  if (words < PHOTO_JOURNALISM_MIN_WORDS) {
    throw Object.assign(
      new Error(`Foto Jurnalistik wajib memiliki minimal ${PHOTO_JOURNALISM_MIN_WORDS} kata narasi foto (saat ini: ${words})`),
      { statusCode: 400 }
    )
  }
}

/**
 * Menghitung jumlah embed block (video).
 * Digunakan untuk validasi video eksklusif.
 */
export function countEmbedBlocks(blocks: any[] | undefined): number {
  if (!Array.isArray(blocks)) return 0
  return blocks.filter((b) => b?.type === 'embed').length
}

/**
 * Validasi khusus untuk tipe konten video eksklusif.
 * - Minimal 1 video embed
 * - Minimal 15 kata narasi
 */
export function validateVideoExclusiveRequirements(blocks: any[] | undefined): void {
  if (!blocks) return

  const embedCount = countEmbedBlocks(blocks)
  if (embedCount < 1) {
    throw Object.assign(
      new Error('Video Eksklusif wajib memiliki minimal 1 video embed'),
      { statusCode: 400 }
    )
  }

  const words = countWords(extractTextFromBlocks(blocks))
  if (words < VIDEO_EXCLUSIVE_MIN_WORDS) {
    throw Object.assign(
      new Error(`Video Eksklusif wajib memiliki minimal ${VIDEO_EXCLUSIVE_MIN_WORDS} kata narasi video (saat ini: ${words})`),
      { statusCode: 400 }
    )
  }
}

export type ArticleContentLimitOptions = {
  /** Wajib untuk submit/publish; draft boleh disimpan di bawah batas ini. */
  requireMinWords?: boolean
  /** Tipe konten artikel. Jika photo_journalism, validasi khusus dijalankan. */
  contentType?: string
}

export function validateArticleContentLimits(
  blocks?: any[],
  options: ArticleContentLimitOptions = {}
): void {
  if (!blocks) return
  if (blocks.length > MAX_BLOCKS) {
    throw Object.assign(
      new Error(`Maksimal ${MAX_BLOCKS} blok konten per artikel`),
      { statusCode: 400 }
    )
  }

  // Validasi khusus foto jurnalistik — hanya saat submit/publish (requireMinWords = true)
  // Draft boleh disimpan tanpa syarat ini agar auto-save tidak terblokir
  if (options.contentType === 'photo_journalism' && options.requireMinWords) {
    validatePhotoJournalismRequirements(blocks)
    return
  }

  // Validasi khusus video eksklusif — hanya saat submit/publish (requireMinWords = true)
  if (options.contentType === 'video_exclusive' && options.requireMinWords) {
    validateVideoExclusiveRequirements(blocks)
    return
  }

  // Validasi standar untuk artikel biasa
  const words = countWords(extractTextFromBlocks(blocks))
  if (options.requireMinWords && words < MIN_WORDS) {
    throw Object.assign(
      new Error(`Minimal ${MIN_WORDS} kata sebelum artikel dapat dikirim atau diterbitkan`),
      { statusCode: 400 }
    )
  }
  if (words > MAX_WORDS) {
    throw Object.assign(
      new Error(`Konten melebihi batas ${MAX_WORDS.toLocaleString('id-ID')} kata`),
      { statusCode: 400 }
    )
  }
}

export function applySeoDefaults<T extends { title: string; blocks?: any[]; excerpt?: string; metaDescription?: string }>(
  input: T
): T & { metaDescription?: string } {
  if (input.metaDescription?.trim()) return input
  const excerptFromField = trimExcerpt(input.excerpt)
  if (excerptFromField) return { ...input, metaDescription: excerptFromField }
  const excerptFromBlocks = buildMetaDescriptionExcerpt(input.blocks)
  if (!excerptFromBlocks) return input
  return { ...input, metaDescription: excerptFromBlocks }
}
