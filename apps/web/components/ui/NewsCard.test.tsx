import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import NewsCard from './NewsCard'

// Mock dependencies
vi.mock('./SmartImage', () => ({
  SmartImage: ({ src, alt, ...props }: Record<string, unknown>) => (
    <div data-testid="smart-image" data-src={src} data-alt={alt} {...props} />
  ),
  prefetchImage: vi.fn(),
}))

vi.mock('./EditorialBadge', () => ({
  default: ({ variant }: { variant: string }) => (
    <span data-testid="editorial-badge">{variant}</span>
  ),
}))

vi.mock('./ArticleBookmarkButton', () => ({
  default: () => <button data-testid="bookmark-btn">Bookmark</button>,
}))

vi.mock('../../lib/resolveArticleBadge', () => ({
  resolveArticleBadge: () => null,
}))

vi.mock('../../lib/constants', () => ({
  getCategoryColor: () => 'bg-gray-100 text-gray-800',
}))

const baseArticle = {
  slug: 'test-article',
  title: 'Test Article Title',
  featuredImage: '/test-image.jpg',
  publishedAt: '2026-01-15T10:00:00Z',
  readingTimeMin: 5,
  author: { name: 'John Doe' },
  category: { name: 'Teknologi' },
  blocks: [],
}

describe('NewsCard', () => {
  describe('Null/undefined article', () => {
    it('renders placeholder when article is null', () => {
      const { getByText } = render(
        <NewsCard article={null as unknown as Parameters<typeof NewsCard>[0]['article']} />
      )
      expect(getByText('Artikel tidak tersedia')).toBeTruthy()
    })

    it('renders placeholder when article is undefined', () => {
      const { getByText } = render(
        <NewsCard article={undefined as unknown as Parameters<typeof NewsCard>[0]['article']} />
      )
      expect(getByText('Artikel tidak tersedia')).toBeTruthy()
    })
  })

  describe('Medium variant (default)', () => {
    it('renders article title', () => {
      const { getByText } = render(
        <NewsCard article={baseArticle} />
      )
      expect(getByText('Test Article Title')).toBeTruthy()
    })

    it('renders author name', () => {
      const { getByText } = render(
        <NewsCard article={baseArticle} />
      )
      expect(getByText('John Doe')).toBeTruthy()
    })

    it('renders reading time', () => {
      const { getByText } = render(
        <NewsCard article={baseArticle} />
      )
      expect(getByText('5 min baca')).toBeTruthy()
    })

    it('renders default reading time when not provided', () => {
      const article = { ...baseArticle, readingTimeMin: null }
      const { getByText } = render(
        <NewsCard article={article} />
      )
      expect(getByText('3 min baca')).toBeTruthy()
    })

    it('renders category name', () => {
      const { getByText } = render(
        <NewsCard article={baseArticle} />
      )
      expect(getByText('Teknologi')).toBeTruthy()
    })

    it('renders with default site (pusat)', () => {
      const { container } = render(
        <NewsCard article={baseArticle} />
      )
      const link = container.querySelector('a')
      expect(link?.getAttribute('href')).toContain('/pusat/artikel/test-article')
    })

    it('renders with custom site', () => {
      const { container } = render(
        <NewsCard article={baseArticle} site="bandung" />
      )
      const link = container.querySelector('a')
      expect(link?.getAttribute('href')).toContain('/bandung/artikel/test-article')
    })

    it('renders date in Indonesian format', () => {
      const { getByText } = render(
        <NewsCard article={baseArticle} />
      )
      // Date should be formatted as "15 Jan 2026"
      expect(getByText(/15.*Jan.*2026/)).toBeTruthy()
    })
  })

  describe('Large variant', () => {
    it('renders article with large variant', () => {
      const { getByText, container } = render(
        <NewsCard article={baseArticle} variant="large" />
      )
      expect(getByText('Test Article Title')).toBeTruthy()
      // Large variant should have article element
      const article = container.querySelector('article')
      expect(article).toBeTruthy()
    })

    it('renders bookmark button in large variant', () => {
      const { getByTestId } = render(
        <NewsCard article={baseArticle} variant="large" />
      )
      expect(getByTestId('bookmark-btn')).toBeTruthy()
    })
  })

  describe('Horizontal variant', () => {
    it('renders article with horizontal variant', () => {
      const { getByText } = render(
        <NewsCard article={baseArticle} variant="horizontal" />
      )
      expect(getByText('Test Article Title')).toBeTruthy()
    })
  })

  describe('Image fallback logic', () => {
    it('uses featuredImage when available', () => {
      const { getByTestId } = render(
        <NewsCard article={baseArticle} />
      )
      const img = getByTestId('smart-image')
      expect(img.getAttribute('data-src')).toBe('/test-image.jpg')
    })

    it('falls back to YouTube embed thumbnail', () => {
      const article = {
        ...baseArticle,
        featuredImage: null,
        blocks: [{ type: 'embed', embedType: 'youtube', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }],
      }
      const { getByTestId } = render(
        <NewsCard article={article} />
      )
      const img = getByTestId('smart-image')
      expect(img.getAttribute('data-src')).toContain('img.youtube.com')
    })

    it('falls back to gallery image', () => {
      const article = {
        ...baseArticle,
        featuredImage: null,
        blocks: [{ type: 'gallery', images: [{ url: '/gallery-1.jpg' }] }],
      }
      const { getByTestId } = render(
        <NewsCard article={article} />
      )
      const img = getByTestId('smart-image')
      expect(img.getAttribute('data-src')).toBe('/gallery-1.jpg')
    })

    it('falls back to image block', () => {
      const article = {
        ...baseArticle,
        featuredImage: null,
        blocks: [{ type: 'image', url: '/block-image.jpg' }],
      }
      const { getByTestId } = render(
        <NewsCard article={article} />
      )
      const img = getByTestId('smart-image')
      expect(img.getAttribute('data-src')).toBe('/block-image.jpg')
    })

    it('falls back to placeholder when no images', () => {
      const article = {
        ...baseArticle,
        featuredImage: null,
        blocks: [],
      }
      const { getByTestId } = render(
        <NewsCard article={article} />
      )
      const img = getByTestId('smart-image')
      expect(img.getAttribute('data-src')).toBe('/placeholder.jpg')
    })
  })

  describe('Excerpt (large variant)', () => {
    it('uses article.excerpt when available', () => {
      const article = { ...baseArticle, excerpt: 'Custom excerpt text' }
      const { getByText } = render(
        <NewsCard article={article} variant="large" />
      )
      expect(getByText('Custom excerpt text')).toBeTruthy()
    })

    it('falls back to first paragraph block content', () => {
      const article = {
        ...baseArticle,
        excerpt: null,
        blocks: [{ type: 'paragraph', content: 'Block paragraph text' }],
      }
      const { getByText } = render(
        <NewsCard article={article} variant="large" />
      )
      expect(getByText('Block paragraph text')).toBeTruthy()
    })
  })

  describe('Author fallback', () => {
    it('shows Redaksi when author is null', () => {
      const article = { ...baseArticle, author: null }
      const { getByText } = render(
        <NewsCard article={article} />
      )
      expect(getByText('Redaksi')).toBeTruthy()
    })
  })

  describe('Legacy vs new categories', () => {
    it('uses categories array when available', () => {
      const article = {
        ...baseArticle,
        category: null,
        categories: [{ category: { name: 'Politik', slug: 'politik' } }],
      }
      const { getByText } = render(
        <NewsCard article={article} />
      )
      expect(getByText('Politik')).toBeTruthy()
    })

    it('falls back to legacy category field', () => {
      const article = {
        ...baseArticle,
        categories: null,
        category: { name: 'Olahraga' },
      }
      const { getByText } = render(
        <NewsCard article={article} />
      )
      expect(getByText('Olahraga')).toBeTruthy()
    })
  })
})
