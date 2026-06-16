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

interface TipTapBlock {
  type: string
  attrs?: Record<string, any>
  text?: string
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

function htmlToBlocks(html: string): { blocks: TipTapBlock[]; imageUrls: string[] } {
  const blocks: TipTapBlock[] = []
  const imageUrls: string[] = []

  // Simple HTML parser using regex (sufficient for WordPress export)
  // Split by block-level elements
  const tagPattern = /<(p|h[1-6]|img|ul|ol|blockquote|div|figure)[^>]*>[\s\S]*?<\/\1>|<(img|hr)\s[^>]*\/?>/gi
  const singleTagPattern = /<(img|hr)\s[^>]*\/?>/gi

  // Extract segments: text before first tag, then each tag block
  const segments: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // First, try to split by common block tags
  const blockSplit = /(<(?:p|h[1-6]|img|ul|ol|blockquote|figure)[\s\S]*?(?:<\/(?:p|h[1-6]|ul|ol|blockquote|figure)>|\/>))/gi
  const parts: string[] = []

  // Reset and collect all block-level segments
  const fullHtml = html.trim()

  // Simple approach: split by newlines and common block boundaries
  // Then process each chunk
  const chunks = fullHtml
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>\s*/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)

  for (const chunk of chunks) {
    // Check if chunk is an image
    const imgMatch = chunk.match(/^<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>$/i)
    if (imgMatch) {
      const src = imgMatch[1]
      imageUrls.push(src)
      blocks.push({ type: 'image', attrs: { src } })
      continue
    }

    // Check if chunk is a heading
    const headingMatch = chunk.match(/^<h([1-6])[^>]*>([\s\S]*?)<\/h\1>$/i)
    if (headingMatch) {
      const level = parseInt(headingMatch[1])
      const text = stripHtml(headingMatch[2])
      if (text) {
        blocks.push({
          type: 'heading',
          attrs: { level },
          content: [{ type: 'text', text }],
        })
      }
      continue
    }

    // Check if chunk is a list
    const ulMatch = chunk.match(/^<ul[^>]*>([\s\S]*?)<\/ul>$/i)
    if (ulMatch) {
      const items = ulMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
      const listItems = items.map((li) => {
        const text = stripHtml(li)
        return {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        }
      })
      if (listItems.length > 0) {
        blocks.push({ type: 'bulletList', content: listItems })
      }
      continue
    }

    const olMatch = chunk.match(/^<ol[^>]*>([\s\S]*?)<\/ol>$/i)
    if (olMatch) {
      const items = olMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
      const listItems = items.map((li) => {
        const text = stripHtml(li)
        return {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        }
      })
      if (listItems.length > 0) {
        blocks.push({ type: 'orderedList', content: listItems })
      }
      continue
    }

    // Check if chunk is a blockquote
    const bqMatch = chunk.match(/^<blockquote[^>]*>([\s\S]*?)<\/blockquote>$/i)
    if (bqMatch) {
      const text = stripHtml(bqMatch[1])
      if (text) {
        blocks.push({
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        })
      }
      continue
    }

    // Check for images embedded in figure/div
    const figureImgMatch = chunk.match(/<img\s[^>]*src=["']([^"']+)["'][^>]*\/?>/i)
    if (figureImgMatch) {
      imageUrls.push(figureImgMatch[1])
      blocks.push({ type: 'image', attrs: { src: figureImgMatch[1] } })
      // Also extract any caption text
      const captionMatch = chunk.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      if (captionMatch) {
        const text = stripHtml(captionMatch[1])
        if (text) {
          blocks.push({ type: 'paragraph', content: [{ type: 'text', text }] })
        }
      }
      continue
    }

    // Default: treat as paragraph
    const text = stripHtml(chunk)
    if (text) {
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text }],
      })
    }
  }

  // If no blocks were created, try a simpler approach
  if (blocks.length === 0 && html.trim()) {
    const text = stripHtml(html).trim()
    if (text) {
      // Split by double newline into paragraphs
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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
            blocks,
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
