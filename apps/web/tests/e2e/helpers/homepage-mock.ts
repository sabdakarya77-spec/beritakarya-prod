import type { Page } from '@playwright/test';

/**
 * Mock data for public article view tests.
 */
export const MOCK_ARTICLE = {
  id: 'art-001',
  title: 'Judul Artikel Test yang Menarik',
  slug: 'judul-artikel-test-yang-menarik',
  excerpt: 'Ini adalah excerpt dari artikel test yang digunakan untuk E2E testing.',
  blocks: [
    {
      type: 'paragraph',
      id: 'block-1',
      content: '<p>Ini adalah konten paragraf pertama dari artikel test.</p>',
    },
    {
      type: 'heading',
      id: 'block-2',
      content: 'Sub Judul Artikel',
      level: 2,
    },
    {
      type: 'paragraph',
      id: 'block-3',
      content: '<p>Konten paragraf kedua dengan <strong>teks tebal</strong> dan <em>teks miring</em>.</p>',
    },
  ],
  status: 'published',
  authorId: 'test-reporter-id',
  author: {
    id: 'test-reporter-id',
    name: 'Test Reporter',
    email: 'reporter@test.com',
  },
  siteId: 'pusat',
  categoryId: 'cat-001',
  category: {
    id: 'cat-001',
    name: 'Politik',
    slug: 'politik',
    color: '#ef4444',
  },
  featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168d5c',
  contentType: 'article',
  tags: ['politik', 'indonesia', 'test'],
  isBreaking: false,
  isExclusive: false,
  isFeatured: false,
  viewCount: 150,
  wordCount: 850,
  readingTime: 4,
  publishedAt: '2026-06-16T10:00:00.000Z',
  createdAt: '2026-06-15T08:00:00.000Z',
  updatedAt: '2026-06-16T10:00:00.000Z',
};

/**
 * Mock data for homepage articles.
 */
export const MOCK_HOMEPAGE_ARTICLES = {
  items: [
    {
      id: 'art-001',
      title: 'Berita Utama Hari Ini',
      slug: 'berita-utama-hari-ini',
      excerpt: 'Excerpt berita utama.',
      featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168d5c',
      category: { id: 'cat-001', name: 'Politik', slug: 'politik', color: '#ef4444' },
      author: { id: 'u-1', name: 'Reporter One' },
      publishedAt: '2026-06-16T10:00:00.000Z',
      readingTime: 3,
      viewCount: 500,
      isBreaking: false,
      isExclusive: false,
    },
    {
      id: 'art-002',
      title: 'Ekonomi Indonesia Meningkat',
      slug: 'ekonomi-indonesia-meningkat',
      excerpt: 'Excerpt berita ekonomi.',
      featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e',
      category: { id: 'cat-002', name: 'Ekonomi', slug: 'ekonomi', color: '#3b82f6' },
      author: { id: 'u-2', name: 'Reporter Two' },
      publishedAt: '2026-06-16T09:00:00.000Z',
      readingTime: 5,
      viewCount: 320,
      isBreaking: false,
      isExclusive: false,
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};

/**
 * Mock the public article API endpoint.
 */
export function mockPublicArticle(page: Page, article = MOCK_ARTICLE) {
  page.route('**/api/v1/articles/slug/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: article }),
    });
  });
}

/**
 * Mock the public articles list API endpoint (for homepage).
 */
export function mockPublicArticlesList(page: Page, data = MOCK_HOMEPAGE_ARTICLES) {
  page.route('**/api/v1/articles**', (route) => {
    const url = route.request().url();
    // Skip slug requests — they are handled by mockPublicArticle
    if (url.includes('/articles/slug/')) {
      route.fallback();
      return;
    }
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Mock comments stats endpoint.
 */
export function mockCommentsStats(page: Page) {
  page.route('**/api/v1/comments**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}
