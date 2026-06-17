import { MeiliSearch } from 'meilisearch'
import { env } from '../../lib/env'
import { createMeilisearchBreaker } from '../../lib/circuitBreaker'
import { logger } from '../../lib/logger'

export interface MeilisearchSearchResult {
  hits: Array<{ id?: string; [key: string]: unknown }>
  estimatedTotalHits?: number
  limit?: number
  offset?: number
  processingTimeMs?: number
  query?: string
}

// ─── Client Setup ─────────────────────────────────────────────────────────────

const isEnabled = !!env.MEILISEARCH_KEY && !!env.MEILISEARCH_HOST

const client = isEnabled
  ? new MeiliSearch({ host: env.MEILISEARCH_HOST, apiKey: env.MEILISEARCH_KEY })
  : null

const index = client ? client.index('articles') : null

// ─── Core Meilisearch Operations ─────────────────────────────────────────────

async function _indexArticle(article: Record<string, unknown>): Promise<void> {
  if (!index) return
  await index.addDocuments([{
    id: article.id,
    title: article.title,
    slug: article.slug,
    siteId: article.siteId,
    categoryId: article.categoryId,
    authorId: article.authorId,
    status: article.status,
    blocks: article.blocks,
    tags: article.tags,
    featuredImage: article.featuredImage,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
  }])
}

async function _deleteIndexedArticle(id: string): Promise<void> {
  if (!index) return
  await index.deleteDocument(id)
}

async function _searchArticles(
  query: string,
  filters: { siteId: string; status?: string }
): Promise<MeilisearchSearchResult | null> {
  if (!index) return null
  const safeSiteId = filters.siteId.replace(/[^a-zA-Z0-9-]/g, '')
  let filter = `siteId = "${safeSiteId}"`
  if (filters.status) {
    const safeStatus = filters.status.replace(/[^a-zA-Z]/g, '')
    filter += ` AND status = "${safeStatus}"`
  }
  return index.search(query, {
    filter,
    sort: ['publishedAt:desc'],
    limit: 20,
  })
}

// ─── Circuit Breakers ─────────────────────────────────────────────────────────

const indexBreaker    = createMeilisearchBreaker(_indexArticle, 'index')
const deleteBreaker   = createMeilisearchBreaker(_deleteIndexedArticle, 'delete')
const searchBreaker   = createMeilisearchBreaker(_searchArticles, 'search')

// ─── Public API (with circuit breakers) ──────────────────────────────────────

/**
 * Index an article into Meilisearch.
 * If Meilisearch is unavailable, the circuit opens and calls are skipped silently.
 */
export async function indexArticle(article: Record<string, unknown>): Promise<void> {
  if (!isEnabled) return
  try {
    await indexBreaker.fire(article)
  } catch (error) {
    logger.error(`[Search] indexArticle failed — circuit may be open: ${error}`)
  }
}

/**
 * Delete an article from Meilisearch index.
 * If Meilisearch is unavailable, the circuit opens and calls are skipped silently.
 */
export async function deleteIndexedArticle(id: string): Promise<void> {
  if (!isEnabled) return
  try {
    await deleteBreaker.fire(id)
  } catch (error) {
    logger.error(`[Search] deleteIndexedArticle failed — circuit may be open: ${error}`)
  }
}

/**
 * Search articles via Meilisearch.
 * Falls back to null (caller will use DB query instead) when circuit is open.
 */
export async function searchArticles(
  query: string,
  filters: { siteId: string; status?: string }
): Promise<MeilisearchSearchResult | null> {
  if (!isEnabled) return null
  try {
    return await searchBreaker.fire(query, filters)
  } catch (error) {
    logger.warn(`[Search] searchArticles failed — falling back to DB search: ${error}`)
    return null  // article.service.ts falls back to repo.findArticlesBySite
  }
}

// ─── Circuit Breaker Health Status ───────────────────────────────────────────

/**
 * Returns health status of all Meilisearch circuit breakers.
 * Used by /health endpoint.
 */
export function getMeilisearchCircuitStatus() {
  return {
    index: {
      state: indexBreaker.opened ? 'open' : indexBreaker.halfOpen ? 'half-open' : 'closed',
      enabled: isEnabled,
    },
    delete: {
      state: deleteBreaker.opened ? 'open' : deleteBreaker.halfOpen ? 'half-open' : 'closed',
      enabled: isEnabled,
    },
    search: {
      state: searchBreaker.opened ? 'open' : searchBreaker.halfOpen ? 'half-open' : 'closed',
      enabled: isEnabled,
    },
  }
}
