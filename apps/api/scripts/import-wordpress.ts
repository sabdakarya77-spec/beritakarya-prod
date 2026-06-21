/**
 * WordPress → BeritaKarya Import Script
 *
 * Usage:
 *   pnpm --filter @beritakarya/api tsx scripts/import-wordpress.ts --file=export.xml --siteId=pusat --authorId=<uuid>
 *   pnpm --filter @beritakarya/api tsx scripts/import-wordpress.ts --file=export.xml --siteId=pusat --authorId=<uuid> --dry-run
 *
 * Flags:
 *   --file=<path>      WordPress WXR/XML export file (required)
 *   --siteId=<id>      Target site ID (default: pusat)
 *   --authorId=<uuid>  Author userId to assign articles to (required)
 *   --dry-run          Parse & preview only, no DB writes
 */

import 'dotenv/config'
import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs/promises'
import * as path from 'path'
import { JSDOM } from 'jsdom'
import { prisma } from '../src/db/client'
import { generateSlug } from '@beritakarya/utils'
import { StorageService } from '../src/services/storage.service'
import { v4 as uuidv4 } from 'uuid'

// ── Utilities ────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')       // Remove HTML tags
    .replace(/&nbsp;/gi, ' ')       // Decode common entities
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .trim()
}

// ── Types ────────────────────────────────────────────────────────────────────

interface WordPressItem {
  title: string
  'content:encoded': string
  'wp:post_date': string
  pubDate: string
  category: string | string[]
  'dc:creator': string
  'wp:post_type': string
  'wp:status': string
}

interface ParsedArticle {
  title: string
  contentHtml: string
  publishedAt: Date
  categories: string[]
  author: string
}

interface EditorBlock {
  id: string
  type: string
  content?: string
  level?: number
  url?: string
  alt?: string
  caption?: string
  credit?: string
  items?: string[]
  ordered?: boolean
  embedType?: string
  variant?: string
  icon?: string
}

interface ImportResult {
  imported: number
  skipped: number
  failed: number
  imagesUploaded: number
  imagesFailed: number
}

// ── CLI Argument Parsing ─────────────────────────────────────────────────────

function parseArgs(): { file: string; siteId: string; authorId: string; dryRun: boolean } {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}

  for (const arg of args) {
    if (arg === '--dry-run') {
      parsed.dryRun = 'true'
      continue
    }
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/)
    if (match) {
      parsed[match[1]] = match[2]
    }
  }

  if (!parsed.file) {
    console.error('Error: --file=<path> is required')
    process.exit(1)
  }
  if (!parsed.authorId) {
    console.error('Error: --authorId=<uuid> is required')
    process.exit(1)
  }

  return {
    file: parsed.file,
    siteId: parsed.siteId || 'pusat',
    authorId: parsed.authorId,
    dryRun: parsed.dryRun === 'true',
  }
}

// ── XML Parsing ──────────────────────────────────────────────────────────────

function parseWXR(xmlContent: string): ParsedArticle[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  })

  const parsed = parser.parse(xmlContent)
  const channel = parsed?.rss?.channel
  if (!channel) {
    throw new Error('Invalid WXR format: missing <channel> element')
  }

  let items = channel.item || []
  if (!Array.isArray(items)) items = [items]

  const articles: ParsedArticle[] = []

  for (const item of items) {
    // Only import posts (not pages, attachments, nav_menu_item)
    const postType = item['wp:post_type']
    if (postType && postType !== 'post') continue

    // Only import published posts
    const status = item['wp:status']
    if (status && status !== 'publish') continue

    const title = item.title?.trim()
    const contentHtml = item['content:encoded'] || ''
    if (!title || !contentHtml.trim()) continue

    // Parse date — prefer wp:post_date, fallback to pubDate
    const dateStr = item['wp:post_date'] || item.pubDate
    const publishedAt = dateStr ? new Date(dateStr) : new Date()
    if (isNaN(publishedAt.getTime())) {
      console.warn(`  ⚠ Invalid date for "${title}", using current date`)
    }

    // Parse categories
    let categories: string[] = []
    const catField = item.category
    if (typeof catField === 'string') {
      categories = [catField]
    } else if (Array.isArray(catField)) {
      categories = catField
        .map((c: any) => (typeof c === 'string' ? c : c['#text'] || ''))
        .filter(Boolean)
    }

    const author = item['dc:creator'] || ''

    articles.push({ title, contentHtml, publishedAt, categories, author })
  }

  return articles
}

// ── HTML → TipTap Blocks ─────────────────────────────────────────────────────

/**
 * Decode common HTML entities to their character equivalents.
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8230;/g, '\u2026')
}

/**
 * Strip Gutenberg block comments from WordPress content.
 * Removes <!-- wp:... -->, <!-- /wp:... -->, and <!-- wp:... /--> patterns.
 */
function stripGutenbergComments(html: string): string {
  return html
    .replace(/<!--\s*\/?wp:[^>]*-->/g, '')
    .replace(/<!--\s*nextpage\s*-->/g, '')
    .replace(/<!--\s*more\s*[^>]*-->/g, '')
    .trim()
}

// Block-level HTML tags that should break out of inline context
const BLOCK_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'blockquote', 'pre', 'hr',
  'figure', 'div', 'table', 'img',
  'section', 'article', 'aside', 'header', 'footer',
])

/**
 * Serialize inline DOM nodes to a clean HTML string.
 * Keeps only standard formatting tags: strong, em, u, s, code, a, br.
 */
function serializeInlineNodes(nodes: NodeListOf<ChildNode> | ChildNode[]): string {
  let html = ''
  for (const node of Array.from(nodes)) {
    if (node.nodeType === 3) {
      // Text node
      html += decodeEntities(node.textContent || '')
    } else if (node.nodeType === 1) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()

      if (tag === 'br') {
        html += '<br>'
        continue
      }

      if (tag === 'img') {
        // Skip inline images, block-level image handler will catch block images
        continue
      }

      const innerContent = serializeInlineNodes(el.childNodes)

      if (tag === 'strong' || tag === 'b') {
        html += `<strong>${innerContent}</strong>`
      } else if (tag === 'em' || tag === 'i') {
        html += `<em>${innerContent}</em>`
      } else if (tag === 'u') {
        html += `<u>${innerContent}</u>`
      } else if (tag === 's' || tag === 'strike' || tag === 'del') {
        html += `<s>${innerContent}</s>`
      } else if (tag === 'code') {
        html += `<code>${innerContent}</code>`
      } else if (tag === 'a') {
        const href = el.getAttribute('href') || ''
        html += `<a href="${href}" target="_blank" rel="noopener noreferrer">${innerContent}</a>`
      } else {
        // Unrecognized tag (span, font, sub, sup, etc.) - unwrap it
        html += innerContent
      }
    }
  }
  return html
}

/**
 * Parse all direct children of a container element into custom editor blocks.
 * Bare inline nodes that appear outside block elements are wrapped in a paragraph.
 */
function parseChildrenAsBlocks(container: Element, imageUrls: string[]): EditorBlock[] {
  const blocks: EditorBlock[] = []
  let inlineBuffer: ChildNode[] = []

  function flushInline() {
    if (inlineBuffer.length === 0) return
    const content = serializeInlineNodes(inlineBuffer)
    if (content.trim()) {
      blocks.push({
        id: uuidv4(),
        type: 'paragraph',
        content,
      })
    }
    inlineBuffer = []
  }

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === 3) {
      if ((child.textContent || '').trim()) inlineBuffer.push(child)
      continue
    }
    if (child.nodeType !== 1) continue
    const el = child as Element
    const tag = el.tagName.toLowerCase()

    if (BLOCK_TAGS.has(tag)) {
      flushInline()
      blocks.push(...parseBlockNode(el, imageUrls))
    } else {
      inlineBuffer.push(child)
    }
  }

  flushInline()
  return blocks
}

/**
 * Parse a single DOM block element into one or more custom editor blocks.
 */
function parseBlockNode(el: Element, imageUrls: string[]): EditorBlock[] {
  const tag = el.tagName.toLowerCase()
  const classes = el.getAttribute('class') || ''

  // ── Standalone image ──
  if (tag === 'img') {
    const src = el.getAttribute('src') || ''
    if (!src) return []
    imageUrls.push(src)
    return [{
      id: uuidv4(),
      type: 'image',
      url: src,
      alt: el.getAttribute('alt') || '',
      caption: el.getAttribute('title') || '',
    }]
  }

  // ── Figure (image + optional caption) ──
  if (tag === 'figure') {
    const img = el.querySelector('img')
    if (img) {
      const src = img.getAttribute('src') || ''
      if (!src) return []
      imageUrls.push(src)
      const alt = img.getAttribute('alt') || ''
      const captionText = el.querySelector('figcaption')?.textContent?.trim() || ''
      return [{
        id: uuidv4(),
        type: 'image',
        url: src,
        alt: alt,
        caption: captionText,
      }]
    }
    // Figure with no img — recurse into children
    return parseChildrenAsBlocks(el, imageUrls)
  }

  // ── Headings ──
  if (/^h[1-6]$/.test(tag)) {
    const level = parseInt(tag[1]) as any
    const content = serializeInlineNodes(el.childNodes)
    return content.trim() ? [{
      id: uuidv4(),
      type: 'heading',
      level,
      content,
    }] : []
  }

  // ── Paragraph ──
  if (tag === 'p') {
    // Paragraph wrapping only an image → promote to image block
    const imgs = el.querySelectorAll('img')
    if (imgs.length === 1 && !(el.textContent || '').replace(/\s/g, '')) {
      const src = imgs[0].getAttribute('src') || ''
      if (src) {
        imageUrls.push(src)
        return [{
          id: uuidv4(),
          type: 'image',
          url: src,
          alt: imgs[0].getAttribute('alt') || '',
          caption: imgs[0].getAttribute('title') || '',
        }]
      }
    }
    const content = serializeInlineNodes(el.childNodes)
    return content.trim() ? [{
      id: uuidv4(),
      type: 'paragraph',
      content,
    }] : []
  }

  // ── Unordered list ──
  if (tag === 'ul') {
    const items = Array.from(el.querySelectorAll(':scope > li'))
    if (items.length === 0) return []
    return [{
      id: uuidv4(),
      type: 'list',
      items: items.map(li => serializeInlineNodes(li.childNodes)),
      ordered: false,
    }]
  }

  // ── Ordered list ──
  if (tag === 'ol') {
    const items = Array.from(el.querySelectorAll(':scope > li'))
    if (items.length === 0) return []
    return [{
      id: uuidv4(),
      type: 'list',
      items: items.map(li => serializeInlineNodes(li.childNodes)),
      ordered: true,
    }]
  }

  // ── Blockquote ──
  if (tag === 'blockquote') {
    const content = serializeInlineNodes(el.childNodes)
    return content.trim() ? [{
      id: uuidv4(),
      type: 'quote',
      content,
    }] : []
  }

  // ── Code block/Verse (<pre>…) ──
  if (tag === 'pre') {
    const content = serializeInlineNodes(el.childNodes)
    return content.trim() ? [{
      id: uuidv4(),
      type: 'paragraph',
      content,
    }] : []
  }

  // ── Div / section wrappers ──
  if (['div', 'section', 'article', 'aside', 'header', 'footer'].includes(tag)) {
    // Embed block handling
    if (classes.includes('wp-block-embed')) {
      const iframe = el.querySelector('iframe')
      const link = el.querySelector('a')
      const src = iframe?.getAttribute('src') || link?.getAttribute('href') || ''
      if (src) {
        let embedType = 'other'
        if (src.includes('youtube.com') || src.includes('youtu.be')) embedType = 'youtube'
        else if (src.includes('twitter.com') || src.includes('x.com')) embedType = 'twitter'
        else if (src.includes('instagram.com')) embedType = 'instagram'

        return [{
          id: uuidv4(),
          type: 'embed',
          url: src,
          embedType,
        }]
      }
    }

    // Gutenberg image block handler
    if (classes.includes('wp-block-image')) {
      const img = el.querySelector('img')
      if (img) {
        const src = img.getAttribute('src') || ''
        if (src) {
          imageUrls.push(src)
          const alt = img.getAttribute('alt') || ''
          const captionText = el.querySelector('figcaption')?.textContent?.trim() || ''
          return [{
            id: uuidv4(),
            type: 'image',
            url: src,
            alt: alt,
            caption: captionText,
          }]
        }
      }
    }

    // Generic container - recurse
    return parseChildrenAsBlocks(el, imageUrls)
  }

  // ── Table ──
  if (tag === 'table') {
    return Array.from(el.querySelectorAll('tr')).flatMap(row => {
      const text = Array.from(row.querySelectorAll('td, th'))
        .map(c => c.textContent?.trim())
        .filter(Boolean)
        .join(' | ')
      return text ? [{
        id: uuidv4(),
        type: 'paragraph',
        content: text,
      }] : []
    })
  }

  // ── Fallback ──
  const text = el.textContent?.trim()
  return text ? [{
    id: uuidv4(),
    type: 'paragraph',
    content: text,
  }] : []
}

/**
 * Convert WordPress HTML content to custom editor blocks.
 */
function htmlToBlocks(html: string): { blocks: EditorBlock[]; imageUrls: string[] } {
  const imageUrls: string[] = []

  // 1. Strip Gutenberg block comments
  let cleaned = stripGutenbergComments(html)
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  if (!cleaned) return { blocks: [], imageUrls }

  // 2. Parse with JSDOM
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${cleaned}</body></html>`)
  const body = dom.window.document.body as unknown as Element

  // 3. Walk all top-level DOM children
  const blocks = parseChildrenAsBlocks(body, imageUrls)

  // 4. Fallback
  if (blocks.length === 0) {
    const text = stripHtml(cleaned)
    if (text) {
      text.split(/\n{2,}/).filter(Boolean).forEach(p => {
        blocks.push({
          id: uuidv4(),
          type: 'paragraph',
          content: p.trim(),
        })
      })
    }
  }

  return { blocks, imageUrls }
}

// ── Image Processing ─────────────────────────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BeritaKarya-Importer/1.0',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`  ⚠ Image download failed (${response.status}): ${url}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err: any) {
    console.warn(`  ⚠ Image download error: ${url} — ${err.message}`)
    return null
  }
}

function getContentTypeFromUrl(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || ''
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return mimeMap[ext] || 'image/jpeg'
}

function generateImageKey(url: string, articleSlug: string): string {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || 'jpg'
  const cleanExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg'
  const hash = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  return `imports/${articleSlug}/${hash}.${cleanExt}`
}

async function processImages(
  imageUrls: string[],
  articleSlug: string
): Promise<{ urlMap: Map<string, string>; uploaded: number; failed: number }> {
  const urlMap = new Map<string, string>()
  let uploaded = 0
  let failed = 0

  // Deduplicate URLs
  const uniqueUrls = [...new Set(imageUrls)]

  for (const url of uniqueUrls) {
    const buffer = await downloadImage(url)
    if (!buffer) {
      failed++
      continue
    }

    try {
      const key = generateImageKey(url, articleSlug)
      const contentType = getContentTypeFromUrl(url)
      await StorageService.uploadBuffer(buffer, key, contentType, StorageService.mediaBucket, {
        isPublic: true,
      })
      const publicUrl = StorageService.getPublicUrl(StorageService.mediaBucket, key)
      urlMap.set(url, publicUrl)
      uploaded++
    } catch (err: any) {
      console.warn(`  ⚠ Image upload failed: ${url} — ${err.message}`)
      failed++
    }
  }

  return { urlMap, uploaded, failed }
}

function replaceImageUrlsInBlocks(blocks: EditorBlock[], urlMap: Map<string, string>): EditorBlock[] {
  return blocks.map((block) => {
    if (block.type === 'image' && block.url) {
      const newUrl = urlMap.get(block.url)
      if (newUrl) {
        return { ...block, url: newUrl }
      }
    }
    return block
  })
}

// ── Category Matching ────────────────────────────────────────────────────────

async function buildCategoryMap(
  siteId: string
): Promise<Map<string, string>> {
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ siteId }, { isGlobal: true }],
      deletedAt: null,
    },
  })

  const map = new Map<string, string>()
  for (const cat of categories) {
    // Match by name (case-insensitive)
    map.set(cat.name.toLowerCase(), cat.id)
    // Also match by slug
    map.set(cat.slug.toLowerCase(), cat.id)
  }

  return map
}

function matchCategories(wpCategories: string[], categoryMap: Map<string, string>): string | null {
  for (const cat of wpCategories) {
    const id = categoryMap.get(cat.toLowerCase())
    if (id) return id
  }
  return null
}

// ── Duplicate Check ──────────────────────────────────────────────────────────

async function isDuplicate(
  title: string,
  siteId: string
): Promise<boolean> {
  const existing = await prisma.article.findFirst({
    where: {
      title: { equals: title, mode: 'insensitive' },
      siteId,
      deletedAt: null,
    },
  })
  return !!existing
}

// ── Word Count & Reading Time ────────────────────────────────────────────────

function calculateWordCount(blocks: EditorBlock[]): number {
  let count = 0
  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote') {
      const htmlText = block.content || ''
      const text = stripHtml(htmlText)
      count += text.split(/\s+/).filter(Boolean).length
    } else if (block.type === 'list' && block.items) {
      for (const item of block.items) {
        const text = stripHtml(item)
        count += text.split(/\s+/).filter(Boolean).length
      }
    }
  }
  return count
}

function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}

// ── Main Import Logic ────────────────────────────────────────────────────────

async function main() {
  const { file, siteId, authorId, dryRun } = parseArgs()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  WordPress → BeritaKarya Import')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  File:     ${file}`)
  console.log(`  Site:     ${siteId}`)
  console.log(`  Author:   ${authorId}`)
  console.log(`  Mode:     ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. Read & parse XML
  console.log('📄 Reading XML file...')
  const xmlContent = await fs.readFile(path.resolve(file), 'utf-8')
  const articles = parseWXR(xmlContent)
  console.log(`   Found ${articles.length} articles to import\n`)

  if (articles.length === 0) {
    console.log('No articles found. Exiting.')
    return
  }

  // Dry-run summary
  if (dryRun) {
    console.log('── Dry Run Summary ──────────────────────────────')
    const allCategories = new Set<string>()
    for (const a of articles) {
      a.categories.forEach((c) => allCategories.add(c))
    }
    console.log(`  Articles:    ${articles.length}`)
    console.log(`  Categories:  ${allCategories.size} unique`)
    console.log(`  Date range:  ${articles[articles.length - 1]?.publishedAt.toLocaleDateString()} – ${articles[0]?.publishedAt.toLocaleDateString()}`)
    console.log('\n  Categories found:')
    for (const c of [...allCategories].sort()) {
      console.log(`    - ${c}`)
    }
    console.log('\n  First 5 articles:')
    for (const a of articles.slice(0, 5)) {
      console.log(`    - "${a.title}" (${a.publishedAt.toLocaleDateString()})`)
    }
    if (articles.length > 5) {
      console.log(`    ... and ${articles.length - 5} more`)
    }
    console.log('─────────────────────────────────────────────────\n')
    console.log('Dry run complete. No database changes made.')
    return
  }

  // 2. Verify DB connection
  try {
    // Verify site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      console.error(`Error: Site "${siteId}" not found`)
      process.exit(1)
    }

    // Verify author exists
    const author = await prisma.user.findUnique({ where: { id: authorId } })
    if (!author) {
      console.error(`Error: User "${authorId}" not found`)
      process.exit(1)
    }

    // Build category map
    console.log('📂 Loading categories...')
    const categoryMap = await buildCategoryMap(siteId)
    console.log(`   Loaded ${categoryMap.size} category mappings\n`)

    // 3. Process articles
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      imagesUploaded: 0,
      imagesFailed: 0,
    }

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]
      const num = `[${i + 1}/${articles.length}]`

      process.stdout.write(`${num} Importing: "${article.title}"... `)

      try {
        // Check duplicate
        if (await isDuplicate(article.title, siteId)) {
          console.log('⏭ (already exists)')
          result.skipped++
          continue
        }

        // Convert HTML → blocks
        const { blocks, imageUrls } = htmlToBlocks(article.contentHtml)

        // Generate slug
        const baseSlug = generateSlug(article.title)
        let slug = baseSlug
        let counter = 2
        while (
          await prisma.article.findFirst({
            where: { siteId, slug, deletedAt: null },
          })
        ) {
          slug = `${baseSlug}-${counter++}`
        }

        // Process images
        let imageNote = ''
        if (imageUrls.length > 0) {
          const { urlMap, uploaded, failed } = await processImages(imageUrls, slug)
          result.imagesUploaded += uploaded
          result.imagesFailed += failed

          if (urlMap.size > 0) {
            // Replace URLs in blocks
            const updatedBlocks = replaceImageUrlsInBlocks(blocks, urlMap)
            blocks.length = 0
            blocks.push(...updatedBlocks)
          }

          if (uploaded > 0 || failed > 0) {
            const parts: string[] = []
            if (uploaded > 0) parts.push(`${uploaded} img uploaded`)
            if (failed > 0) parts.push(`${failed} img failed`)
            imageNote = ` (${parts.join(', ')})`
          }
        }

        // Match category
        const categoryId = matchCategories(article.categories, categoryMap)
        if (article.categories.length > 0 && !categoryId) {
          console.warn(`\n  ⚠ No category match for: ${article.categories.join(', ')}`)
        }

        // Calculate metadata
        const wordCount = calculateWordCount(blocks)
        const readingTimeMin = estimateReadingTime(wordCount)

        // Set featured image (first image in content)
        const firstImage = blocks.find((b) => b.type === 'image')
        const featuredImage = firstImage?.url || null

        // Insert article
        await prisma.article.create({
          data: {
            title: article.title,
            slug,
            siteId,
            authorId,
            categoryId,
            blocks: blocks as any,
            status: 'draft',
            publishedAt: article.publishedAt,
            wordCount,
            readingTimeMin,
            featuredImage,
            excerpt: blocks
              .filter((b) => b.type === 'paragraph')
              .map((b) => stripHtml(b.content || ''))
              .find((t) => t.trim()) || null,
          },
        })

        console.log(`✓${imageNote}`)
        result.imported++
      } catch (err: any) {
        console.log(`✗ (${err.message})`)
        result.failed++
      }
    }

    // 4. Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  Import Complete')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  Imported:      ${result.imported}`)
    console.log(`  Skipped:       ${result.skipped}`)
    console.log(`  Failed:        ${result.failed}`)
    console.log(`  Images uploaded: ${result.imagesUploaded}`)
    console.log(`  Images failed:   ${result.imagesFailed}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
