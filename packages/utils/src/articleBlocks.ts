/** Normalisasi blok editor sebelum validasi API (perbaiki slash-menu / field hilang). */
export function normalizeArticleBlocks(blocks: unknown): Record<string, unknown>[] {
  if (!Array.isArray(blocks)) return []
  return blocks
    .map((raw) => normalizeBlock(raw))
    .filter((b): b is Record<string, unknown> => b !== null)
}

function normalizeTextAlign(value: unknown): 'left' | 'center' | 'right' | 'justify' | undefined {
  if (['left', 'center', 'right', 'justify'].includes(String(value))) {
    return String(value) as 'left' | 'center' | 'right' | 'justify'
  }
  return undefined
}

function normalizeImageItem(img: unknown): {
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
} {
  if (!img || typeof img !== 'object') return { url: '', alt: '' }
  const o = img as Record<string, unknown>
  return {
    url: String(o.url ?? ''),
    alt: String(o.alt ?? ''),
    ...(o.caption ? { caption: String(o.caption) } : {}),
    ...(typeof o.width === 'number' ? { width: o.width } : {}),
    ...(typeof o.height === 'number' ? { height: o.height } : {}),
  }
}

function normalizeMediaTextAlign(value: unknown): 'left' | 'right' | 'center' {
  if (value === 'right' || value === 'center') return value
  return 'left'
}

function normalizeBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const b = raw as Record<string, unknown>
  if (!b.type || !b.id) return null

  const id = String(b.id)
  const type = String(b.type)

  switch (type) {
    case 'paragraph': {
      const textAlign = normalizeTextAlign(b.textAlign)
      return {
        id,
        type,
        content: String(b.content ?? ''),
        ...(typeof b.dropCap === 'boolean' ? { dropCap: b.dropCap } : {}),
        ...(textAlign ? { textAlign } : {})
      }
    }
    case 'heading': {
      let level = Number(b.level)
      if (![1, 2, 3, 4, 5, 6].includes(level)) level = 2
      const textAlign = normalizeTextAlign(b.textAlign)
      return {
        id,
        type,
        level,
        content: String(b.content ?? ''),
        ...(textAlign ? { textAlign } : {})
      }
    }
    case 'quote': {
      const textAlign = normalizeTextAlign(b.textAlign)
      return {
        id,
        type,
        content: String(b.content ?? ''),
        ...(b.attribution != null && b.attribution !== ''
          ? { attribution: String(b.attribution) }
          : {}),
        ...(textAlign ? { textAlign } : {})
      }
    }
    case 'image':
      return {
        id,
        type,
        url: String(b.url ?? ''),
        alt: String(b.alt ?? ''),
        ...(b.caption ? { caption: String(b.caption) } : {}),
        ...(b.credit ? { credit: String(b.credit) } : {}),
        ...(typeof b.width === 'number' ? { width: b.width } : {}),
        ...(typeof b.height === 'number' ? { height: b.height } : {})
      }
    case 'imageGrid': {
      const columns = b.columns === 3 ? 3 : 2
      const images = Array.isArray(b.images)
        ? b.images.map(normalizeImageItem)
        : []
      return { id, type, columns, images }
    }
    case 'gallery':
      return {
        id,
        type,
        images: Array.isArray(b.images) ? b.images.map(normalizeImageItem) : []
      }
    case 'embed': {
      const embedType = ['youtube', 'twitter', 'instagram', 'other'].includes(
        String(b.embedType)
      )
        ? String(b.embedType)
        : 'other'
      return {
        id,
        type,
        url: String(b.url ?? ''),
        embedType,
        ...(b.title ? { title: String(b.title) } : {})
      }
    }
    case 'list': {
      const items = Array.isArray(b.items)
        ? b.items.map((i) => String(i))
        : ['']
      return {
        id,
        type,
        items: items.length > 0 ? items : [''],
        ordered: Boolean(b.ordered)
      }
    }
    case 'callout':
      return {
        id,
        type,
        content: String(b.content ?? ''),
        variant: b.variant ? String(b.variant) : 'editorial',
        ...(b.icon ? { icon: String(b.icon) } : {})
      }
    case 'mediaText':
      return {
        id,
        type,
        url: String(b.url ?? ''),
        content: String(b.content ?? ''),
        alt: String(b.alt ?? ''),
        align: normalizeMediaTextAlign(b.align),
        ...(b.caption ? { caption: String(b.caption) } : {}),
        ...(typeof b.width === 'number' && b.width > 0 ? { width: b.width } : {}),
        ...(typeof b.height === 'number' && b.height > 0 ? { height: b.height } : {})
      }
    default:
      if (typeof b.content === 'string') {
        return { id, type: 'paragraph', content: b.content }
      }
      return { id, type: 'paragraph', content: '' }
  }
}
