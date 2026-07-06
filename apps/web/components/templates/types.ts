/**
 * Shared types untuk semua template orchestrators.
 * Setiap template menerima props yang sama — yang beda hanya komponen yang dipakai.
 */

import type { HomeArticle } from '../pages/home/utils/distribution'

export interface TemplateProps {
  heroArticles: HomeArticle[]
  fokusRedaksi: HomeArticle[]
  trendingArticles: HomeArticle[]
  feedArticles: HomeArticle[]
  trending: HomeArticle[]
  popular: HomeArticle[]
  opinionArticles: HomeArticle[]
  photoJournal: HomeArticle[]
  videoStories: HomeArticle[]
  technologyArticles: HomeArticle[]
  site: string
  searchQuery: string
  isCategoryFilter: boolean
  categoryFilter: string
  categoriesTree: Array<{ id: string; name: string; slug: string; subCategories?: { name: string; slug: string }[] }>
  showSavedFeed: boolean
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
  siteName?: string
  marketData: Record<string, unknown> | null
  showPhotoSection: boolean
  showVideoSection: boolean
  showOpinionSection: boolean
  showTechnologySection: boolean
  siteSettings?: Record<string, unknown>
  siteConfigId: string
  homeTopAds?: unknown[]
  resolveCategoryName: (slug: string, tree: TemplateProps['categoriesTree']) => string
  getVideoThumbnail: (article: HomeArticle) => string | null
  /** Artikel sisa dari distribusi — untuk Load More */
  remainingArticles?: HomeArticle[]
  /** ID artikel yang sudah dirender di beranda — untuk disaring dari hasil Load More */
  excludeIds?: string[]
}
