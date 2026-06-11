import type { Block } from './block'

export type ArticleStatus = 'draft' | 'submitted' | 'review' | 'revision' | 'approved' | 'scheduled' | 'published' | 'archived' | 'rejected'

export type ContentType = 'article' | 'photo_journalism' | 'video_exclusive'

export interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
  siteId: string
  authorId: string
  blocks: Block[]
  contentType: ContentType
  status: ArticleStatus
  featuredImage?: string
  featuredImageBlur?: string
  featuredImageColor?: string
  metaTitle?: string
  metaDescription?: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateArticleInput {
  title: string
  excerpt?: string
  siteId: string
  blocks?: Block[]
}

export interface UpdateArticleInput {
  title?: string
  excerpt?: string
  blocks?: Block[]
  metaTitle?: string
  metaDescription?: string
  status?: string
  publishedAt?: Date
}

export interface ArticleListItem {
  id: string
  title: string
  slug: string
  excerpt?: string
  status: ArticleStatus
  authorId: string
  siteId: string
  publishedAt?: Date
  createdAt: Date
}
