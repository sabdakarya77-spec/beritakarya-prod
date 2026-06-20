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
import { prisma } from '../src/db/client'
import { generateSlug } from '@beritakarya/utils'
import { StorageService } from '../src/services/storage.service'

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

interface TipTapMark {
  type: string
  attrs?: Record<string, any>
}

interface TipTapBlock {
  type: string
  attrs?: Record<string, any>
  text?: string
  marks?: TipTapMark[]
  content?: TipTapBlock[]
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
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
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

/**
 * Parse inline HTML content into TipTap inline nodes with marks.
 * Handles: <strong>, <b>, <em>, <i>, <a>, <code>, <br>
 * Returns an array of { text, marks? } nodes.
 */
function parseInlineHtml(html: string): TipTapBlock[] {
  const nodes: TipTapBlock[] = []

  // Tokenize inline HTML into segments: tags + text
  const tokens = html.split(/(<[^>]+>)/)

  let currentMarks: TipTapMark[] = []
  let pendingLink: TipTapMark | null = null

  for (const token of tokens) {
    if (!token) continue

    // Opening tags
    if (token.match(/^<(strong|b)(\s[^>]*)?>/i)) {
      currentMarks.push({ type: 'bold' })
      continue
    }
    if (token.match(/^<(em|i)(\s[^>]*)?>/i)) {
      currentMarks.push({ type: 'italic' })
      continue
    }
    if (token.match(/^<code(\s[^>]*)?>/i)) {
      currentMarks.push({ type: 'code' })
      continue
    }
    const linkOpen = token.match(/^<a\s[^>]*href=["']([^"']+)["'][^>]*>/i)
    if (linkOpen) {
      pendingLink = { type: 'link', attrs: { href: linkOpen[1] } }
      continue
    }

    // Closing tags
    if (token.match(/^<\/(strong|b)>/i)) {
      currentMarks = currentMarks.filter(m => m.type !== 'bold')
      continue
    }
    if (token.match(/^<\/(em|i)>/i)) {
      currentMarks = currentMarks.filter(m => m.type !== 'italic')
      continue
    }
    if (token.match(/^<\/code>/i)) {
      currentMarks = currentMarks.filter(m => m.type !== 'code')
      continue
    }
    if (token.match(/^<\/a>/i)) {
      pendingLink = null
      continue
    }

    // Self-closing tags
    if (token.match(/^<br\s*\/?>/i)) {
      nodes.push({ type: 'hardBreak' })
      continue
    }

    // Skip other tags (img handled at block level, etc.)
    if (token.match(/^<[^>]+>$/)) continue

    // Plain text
    const text = decodeEntities(token)
    if (!text) continue

    const allMarks = pendingLink
      ? [...currentMarks, pendingLink]
      : [...currentMarks]

    if (allMarks.length > 0) {
      nodes.push({ type: 'text', text, marks: allMarks })
    } else {
      nodes.push({ type: 'text', text })
    }
  }

  return nodes
}

/**
 * Strip all HTML tags, returning plain text only.
 */
function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Convert a single block-level HTML element into a TipTap block.
 * Returns null if the chunk is empty or unrecognizable.
 */
function parseBlockElement(chunk: string, imageUrls: string[]): TipTapBlock | null {
  const trimmed = chunk.trim()
  if (!trimmed) return null

  // ── Image (standalone <img> or inside <figure>) ──
  const imgInFigure = trimmed.match(/<figure[^>]*>[\s\S]*?<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>[\s\S]*?(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?[\s\S]*?<\/figure>/i)
  if (imgInFigure) {
    const src = imgInFigure[1]
    imageUrls.push(src)
    const block: TipTapBlock = { type: 'image', attrs: { src } }
    // If there's a caption, return image + caption paragraph
    if (imgInFigure[2]?.trim()) {
      const caption = stripHtml(imgInFigure[2])
      if (caption) {
        return { type: 'figure', content: [block, { type: 'paragraph', content: [{ type: 'text', text: caption }] }] }
      }
    }
    return block
  }

  const standaloneImg = trimmed.match(/^<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>$/i)
  if (standaloneImg) {
    const src = standaloneImg[1]
    imageUrls.push(src)
    return { type: 'image', attrs: { src } }
  }

  // ── Heading ──
  const headingMatch = trimmed.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>$/i)
  if (headingMatch) {
    const level = parseInt(headingMatch[1])
    const inlineNodes = parseInlineHtml(headingMatch[2])
    if (inlineNodes.length > 0) {
      return { type: 'heading', attrs: { level }, content: inlineNodes }
    }
  }

  // ── Unordered List ──
  const ulMatch = trimmed.match(/^<ul[^>]*>([\s\S]*?)<\/ul>$/i)
  if (ulMatch) {
    const items = ulMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
    const listItems = items.map((li) => {
      const liContent = li.replace(/^<li[^>]*>/i, '').replace(/<\/li>$/i, '')
      const inlineNodes = parseInlineHtml(liContent)
      return {
        type: 'listItem',
        content: [{ type: 'paragraph', content: inlineNodes.length > 0 ? inlineNodes : [{ type: 'text', text: '' }] }],
      }
    })
    if (listItems.length > 0) {
      return { type: 'bulletList', content: listItems }
    }
  }

  // ── Ordered List ──
  const olMatch = trimmed.match(/^<ol[^>]*>([\s\S]*?)<\/ol>$/i)
  if (olMatch) {
    const items = olMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
    const listItems = items.map((li) => {
      const liContent = li.replace(/^<li[^>]*>/i, '').replace(/<\/li>$/i, '')
      const inlineNodes = parseInlineHtml(liContent)
      return {
        type: 'listItem',
        content: [{ type: 'paragraph', content: inlineNodes.length > 0 ? inlineNodes : [{ type: 'text', text: '' }] }],
      }
    })
    if (listItems.length > 0) {
      return { type: 'orderedList', content: listItems }
    }
  }

  // ── Blockquote ──
  const bqMatch = trimmed.match(/^<blockquote[^>]*>([\s\S]*?)<\/blockquote>$/i)
  if (bqMatch) {
    // Blockquote may contain multiple paragraphs
    const innerHtml = bqMatch[1]
    const innerChunks = innerHtml
      .split(/<\/p>\s*<p[^>]*>/i)
      .map(s => s.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, '').trim())
      .filter(Boolean)
    const bqParagraphs = innerChunks.map(chunk => {
      const inlineNodes = parseInlineHtml(chunk)
      return { type: 'paragraph', content: inlineNodes.length > 0 ? inlineNodes : [{ type: 'text', text: stripHtml(chunk) }] }
    }).filter(p => (p.content as TipTapBlock[]).some(n => n.text?.trim()))
    if (bqParagraphs.length > 0) {
      return { type: 'blockquote', content: bqParagraphs }
    }
  }

  // ── Paragraph ──
  const pMatch = trimmed.match(/^<p[^>]*>([\s\S]*?)<\/p>$/i)
  if (pMatch) {
    const inlineNodes = parseInlineHtml(pMatch[1])
    if (inlineNodes.length > 0) {
      return { type: 'paragraph', content: inlineNodes }
    }
  }

  // ── WordPress image block (wp-block-image class) ──
  const wpImgMatch = trimmed.match(/<div\s+class=["'][^"']*wp-block-image[^"']*["'][^>]*>[\s\S]*?<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>[\s\S]*?<\/div>/i)
  if (wpImgMatch) {
    const src = wpImgMatch[1]
    imageUrls.push(src)
    return { type: 'image', attrs: { src } }
  }

  // ── Fallback: strip HTML and treat as paragraph ──
  const text = stripHtml(trimmed)
  if (text) {
    return { type: 'paragraph', content: [{ type: 'text', text }] }
  }

  return null
}

/**
 * Convert WordPress HTML content to TipTap JSON blocks.
 * Handles Gutenberg block comments, inline formatting, and standard HTML elements.
 */
function htmlToBlocks(html: string): { blocks: TipTapBlock[]; imageUrls: string[] } {
  const imageUrls: string[] = []

  // 1. Strip Gutenberg block comments
  let cleaned = stripGutenbergComments(html)

  // 2. Normalize whitespace between block elements
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!cleaned) {
    return { blocks: [], imageUrls }
  }

  // 3. Split into block-level chunks
  //    Match each block-level element individually
  const blockPattern = /(<(?:p|h[1-6]|ul|ol|blockquote|figure|div)[\s\S]*?(?:<\/(?:p|h[1-6]|ul|ol|blockquote|figure|div)>|\/>))/gi
  const chunks: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Reset lastIndex
  blockPattern.lastIndex = 0

  while ((match = blockPattern.exec(cleaned)) !== null) {
    // Any text before this match that isn't just whitespace
    const before = cleaned.slice(lastIndex, match.index).trim()
    if (before) {
      // Check if it's a standalone image
      const imgOnly = before.match(/^<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>$/i)
      if (imgOnly) {
        chunks.push(before)
      } else if (!before.match(/^<br\s*\/?>$/i)) {
        chunks.push(before)
      }
    }
    chunks.push(match[0])
    lastIndex = blockPattern.lastIndex
  }

  // Remaining text after last block
  const remaining = cleaned.slice(lastIndex).trim()
  if (remaining && !remaining.match(/^(<br\s*\/?>\s*)+$/i)) {
    chunks.push(remaining)
  }

  // If no chunks found (content has no block tags), treat entire content as one chunk
  if (chunks.length === 0) {
    chunks.push(cleaned)
  }

  // 4. Parse each chunk into TipTap blocks
  const blocks: TipTapBlock[] = []

  for (const chunk of chunks) {
    const block = parseBlockElement(chunk, imageUrls)
    if (block) {
      blocks.push(block)
    }
  }

  // 5. Fallback: if no blocks created, try plain text split
  if (blocks.length === 0) {
    const text = stripHtml(cleaned)
    if (text) {
      const paragraphs = text.split(/\n{2,}/).filter(Boolean)
      for (const p of paragraphs) {
        blocks.push({
          type: 'paragraph',
          content: [{ type: 'text', text: p.trim() }],
        })
      }
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

function replaceImageUrlsInBlocks(blocks: TipTapBlock[], urlMap: Map<string, string>): TipTapBlock[] {
  return blocks.map((block) => {
    if (block.type === 'image' && block.attrs?.src) {
      const newUrl = urlMap.get(block.attrs.src)
      if (newUrl) {
        return { ...block, attrs: { ...block.attrs, src: newUrl } }
      }
    }
    if (block.content) {
      return { ...block, content: replaceImageUrlsInBlocks(block.content, urlMap) }
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

function calculateWordCount(blocks: TipTapBlock[]): number {
  let count = 0
  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading') {
      const text = block.content
        ?.map((c) => c.text || '')
        .join(' ') || ''
      count += text.split(/\s+/).filter(Boolean).length
    }
    if (block.content) {
      count += calculateWordCount(block.content)
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
        const featuredImage = firstImage?.attrs?.src || null

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
              .map((b) => b.content?.map((c) => c.text || '').join('') || '')
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
