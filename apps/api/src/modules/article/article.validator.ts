import { z } from 'zod'
import { normalizeArticleBlocks } from '@beritakarya/utils'

const baseBlock = z.object({ id: z.string() })
const textAlignSchema = z.enum(['left', 'center', 'right', 'justify'])
const imageItemSchema = z.object({
  url: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional()
})

export const blockSchema = z.discriminatedUnion('type', [
  baseBlock.extend({
    type: z.literal('paragraph'),
    content: z.string(),
    dropCap: z.boolean().optional(),
    textAlign: textAlignSchema.optional()
  }),
  baseBlock.extend({
    type: z.literal('heading'),
    level: z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6)]),
    content: z.string(),
    textAlign: textAlignSchema.optional()
  }),
  baseBlock.extend({
    type: z.literal('quote'),
    content: z.string(),
    attribution: z.string().optional(),
    textAlign: textAlignSchema.optional()
  }),
  baseBlock.extend({
    type: z.literal('image'),
    url: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
    credit: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional()
  }),
  baseBlock.extend({
    type: z.literal('imageGrid'),
    columns: z.union([z.literal(2), z.literal(3)]),
    images: z.array(imageItemSchema)
  }),
  baseBlock.extend({
    type: z.literal('gallery'),
    images: z.array(imageItemSchema)
  }),
  baseBlock.extend({
    type: z.literal('embed'),
    url: z.string(),
    embedType: z.enum(['youtube','twitter','instagram','other']),
    title: z.string().optional()
  }),
  // [FIX] Previously missing block types that caused silent save failures
  baseBlock.extend({
    type: z.literal('list'),
    items: z.array(z.string()),
    ordered: z.boolean().optional()
  }),
  baseBlock.extend({
    type: z.literal('callout'),
    content: z.string(),
    variant: z.enum(['info', 'warning', 'error', 'success', 'editorial']).optional(),
    icon: z.string().optional()
  }),
  baseBlock.extend({
    type: z.literal('mediaText'),
    url: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
    content: z.string(),
    align: z.enum(['left', 'right'])
  }),
])

export const blocksArraySchema = z
  .array(blockSchema)
  .max(500, 'Maksimal 500 blok konten per artikel')

const blocksField = z.preprocess(
  (val) => normalizeArticleBlocks(val),
  blocksArraySchema.default([])
)

/** Validasi array blok (bukan single block). */
export function parseArticleBlocks(blocks: unknown) {
  return blocksArraySchema.parse(normalizeArticleBlocks(blocks))
}

// Legacy single categoryId (untuk backward compat)
const optionalCategoryId = z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().nullable().optional()
)

// Multi-category: max 3, normalisasi dari string tunggal atau array
const optionalCategoryIds = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return []
    if (typeof val === 'string') return [val]
    return val
  },
  z.array(z.string()).max(3, 'Maksimal 3 kategori per artikel').default([])
)

export const createArticleSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  excerpt: z.string().trim().max(280).optional(),
  categoryId: optionalCategoryId,       // legacy field
  categoryIds: optionalCategoryIds,     // baru: array max 3
  tags: z.array(z.string()).default([]),
  blocks: blocksField,
  contentType: z.enum(['article', 'photo_journalism', 'video_exclusive']).default('article'),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  isBreaking: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  featuredImage: z.string().optional(),
}).transform((data) => {
  // Konsolidasikan categoryId (legacy) dan categoryIds (baru)
  const categoryIds = [...data.categoryIds]
  if (data.categoryId && !categoryIds.includes(data.categoryId)) {
    categoryIds.unshift(data.categoryId) // legacy → index 0 (primary)
  }
  const { categoryId, ...rest } = data
  return {
    ...rest,
    categoryIds: Array.from(new Set(categoryIds)).slice(0, 3)
  }
})

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().trim().max(280).optional(),
  categoryId: optionalCategoryId,       // legacy field
  categoryIds: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      if (typeof val === 'string') return [val]
      return val
    },
    z.array(z.string()).max(3, 'Maksimal 3 kategori per artikel').optional()
  ),
  tags: z.array(z.string()).optional(),
  blocks: blocksField.optional(),
  contentType: z.enum(['article', 'photo_journalism', 'video_exclusive']).optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(['draft','submitted','review','revision','approved','scheduled','published','archived']).optional(),
  publishedAt: z.coerce.date().optional(),
  isBreaking: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  featuredImage: z.string().optional(),
  reviewNotes: z.string().optional(),
  reviewedBy: z.string().optional(),
}).transform((data) => {
  const result = { ...data } as Record<string, unknown>
  // Konsolidasikan hanya jika salah satu dikirim
  if (data.categoryId !== undefined || data.categoryIds !== undefined) {
    let resolved: string[] = []
    if (data.categoryIds) resolved = [...data.categoryIds]
    if (data.categoryId) {
      if (!resolved.includes(data.categoryId)) resolved.unshift(data.categoryId)
    }
    result.categoryIds = Array.from(new Set(resolved)).slice(0, 3)
  }
  delete result.categoryId
  return result
})

export const articleQuerySchema = z.object({
  status: z.enum(['draft','submitted','review','revision','approved','scheduled','published','archived']).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(), // ISO date string for date range filtering
  endDate: z.string().optional(),   // ISO date string for date range filtering
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20)
})

/** Public list / sitemap — allows larger page size. */
export const publicArticleQuerySchema = articleQuerySchema.extend({
  limit: z.coerce.number().positive().max(100).default(100)
})

export const publishArticleSchema = z.object({
  forcePublish: z.coerce.boolean().optional().default(false)
})
