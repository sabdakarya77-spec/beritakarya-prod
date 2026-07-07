export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type CalloutVariant = 'info' | 'warning' | 'error' | 'success' | 'editorial' | 'tip'

export interface BaseBlock {
  id: string
  type: string
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'
  content: string
  dropCap?: boolean
  textAlign?: TextAlign
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: string
  textAlign?: TextAlign
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote'
  content: string
  attribution?: string
  textAlign?: TextAlign
}

export interface ListBlock extends BaseBlock {
  type: 'list'
  items: string[]
  ordered: boolean
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout'
  content: string
  icon?: string
  variant: CalloutVariant
}

export interface ImageItem {
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
  credit?: string
  width?: number
  height?: number
}

export interface ImageGridBlock extends BaseBlock {
  type: 'imageGrid'
  images: ImageItem[]
  columns: 2 | 3
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery'
  images: ImageItem[]
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed'
  url: string
  embedType: 'youtube' | 'twitter' | 'instagram' | 'other'
  title?: string
}

export interface MediaTextBlock extends BaseBlock {
  type: 'mediaText'
  url: string
  alt: string
  caption?: string
  content: string
  /**
   * Tata letak gambar terhadap teks.
   * - 'left'  → gambar di kiri, teks di kanan (default)
   * - 'right' → gambar di kanan, teks di kiri
   * - 'center' → gambar di atas, teks di bawah (stack vertikal)
   */
  align: 'left' | 'right' | 'center'
  /** Lebar gambar asli (px) — dipakai untuk hitung rasio aspek agar tidak terpotong. */
  width?: number
  /** Tinggi gambar asli (px) — dipakai untuk hitung rasio aspek agar tidak terpotong. */
  height?: number
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | CalloutBlock
  | ImageBlock
  | ImageGridBlock
  | GalleryBlock
  | EmbedBlock
  | MediaTextBlock
