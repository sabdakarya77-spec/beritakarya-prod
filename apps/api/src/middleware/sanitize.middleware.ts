import { Request, Response, NextFunction } from 'express'
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

const { window } = new JSDOM('')
const purify = DOMPurify(window as any)

// Hook: hanya izinkan properti CSS text-align pada atribut style
// Ini mencegah CSS injection (expression(), javascript:, dll) sambil
// tetap mempertahankan perataan teks (center/right/justify) dari editor.
purify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'style') {
    const raw = data.attrValue || ''
    // Ekstrak hanya nilai text-align yang valid
    const match = raw.match(/text-align\s*:\s*(left|center|right|justify)/i)
    if (match) {
      data.attrValue = `text-align: ${match[1].toLowerCase()}`
    } else {
      data.attrValue = ''
    }
  }
})

// Config untuk field non-blocks: tag terbatas untuk rich text sederhana
// (settings, excerpt, dll.)
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'div', 'h2', 'h3', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'align', 'style'],
  FORCE_BODY: true
}

// [FIX] Config untuk konten HTML di dalam blocks artikel:
// Mengizinkan SEMUA tag yang dihasilkan editor Tiptap, termasuk heading levels,
// blockquote, img, code, mark, s (strikethrough), sub, sup, cite, table, dll.
// Tetap memblokir tag berbahaya (script, iframe, object, embed, form, input, dll.)
// dan atribut berbahaya (onerror, onclick, onload, onmouseover, dll.)
const BLOCK_CONTENT_CONFIG = {
  ALLOWED_TAGS: [
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup',
    'mark', 'code', 'a', 'br', 'hr',
    // Block elements
    'p', 'div', 'blockquote', 'pre', 'cite',
    // Lists
    'ul', 'ol', 'li',
    // Media
    'img',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Semantic
    'span', 'small', 'abbr', 'time', 'figure', 'figcaption',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'align', 'style',
    'src', 'alt', 'title', 'width', 'height', // img attributes
    'colspan', 'rowspan', // table attributes
    'level', // heading level (for custom rendering)
  ],
  FORCE_BODY: true
}

/**
 * Fields within block objects that contain HTML content and should be sanitized
 * with the rich-text config. Other string fields (type, id, url, etc.) are NOT
 * HTML content and should not be sanitized.
 */
const BLOCK_HTML_CONTENT_FIELDS = new Set([
  'content',    // paragraph, heading, quote, callout, mediaText
  'attribution', // quote
  'icon',       // callout
])

/**
 * Check if a block object has a valid `type` field from our known block types.
 * This prevents arbitrary objects from being treated as blocks.
 */
const KNOWN_BLOCK_TYPES = new Set([
  'paragraph', 'heading', 'quote', 'image', 'imageGrid', 'gallery',
  'embed', 'list', 'callout', 'mediaText'
])

function isBlockObject(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return typeof obj.type === 'string' && KNOWN_BLOCK_TYPES.has(obj.type)
}

function sanitizeBlockValue(value: unknown, key: string): any {
  // Sanitize known HTML content fields within blocks using the rich-text config
  if (typeof value === 'string' && BLOCK_HTML_CONTENT_FIELDS.has(key)) {
    return purify.sanitize(value, BLOCK_CONTENT_CONFIG)
  }
  // All other block fields (id, type, url, alt, level, etc.) are preserved as-is
  return value
}

function sanitizeValue(value: any, key?: string, parentIsBlocks?: boolean): any {
  // Jangan sanitize field password atau email untuk mencegah kerusakan data kredensial
  if (key === 'password' || key === 'email') {
    return value
  }

  // [FIX] Khusus handle field "blocks" — konten blok artikel berisi HTML rich-text
  // yang perlu disanitize secara berbeda dari field lain:
  // - Tag HTML diizinkan secara luas (h1-h6, blockquote, img, code, mark, dll.)
  // - Atribut berbahaya (onerror, onclick, onload, dll.) tetap diblokir
  // - Hanya field yang diketahui berisi HTML (content, attribution, icon) yang disanitize
  // - Field lain (type, id, url, level, items, images, dll.) dipertahankan as-is
  if (key === 'blocks' && Array.isArray(value)) {
    return value.map((item: unknown) => {
      if (isBlockObject(item)) {
        const result: Record<string, any> = {}
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          result[k] = sanitizeBlockValue(v, k)
        }
        return result
      }
      // Non-block items in the array: sanitize normally (shouldn't happen with valid data)
      return sanitizeValue(item, undefined, true)
    })
  }

  if (typeof value === 'string') {
    return purify.sanitize(value, PURIFY_CONFIG)
  }
  if (Array.isArray(value)) {
    return value.map(v => sanitizeValue(v, undefined, parentIsBlocks))
  }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeValue(v, k, parentIsBlocks)
    }
    return result
  }
  return value
}

/**
 * Middleware untuk membersihkan input HTML dari request body
 * Mencegah XSS dengan membatasi tag yang diizinkan
 */
export function sanitizeMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body) {
    req.body = sanitizeValue(req.body)
  }
  next()
}