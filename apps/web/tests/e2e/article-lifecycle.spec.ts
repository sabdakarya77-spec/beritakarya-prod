import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const SITE = 'pusat';

// Mock articles data
const MOCK_ARTICLES_LIST = {
  items: [
    {
      id: 'art-001',
      title: 'Artikel Draft Test',
      slug: 'artikel-draft-test',
      excerpt: 'Excerpt draft',
      status: 'draft',
      author: { id: 'u-1', name: 'Test Reporter' },
      category: { id: 'cat-1', name: 'Politik', slug: 'politik', color: '#ef4444' },
      createdAt: '2026-06-16T08:00:00.000Z',
      updatedAt: '2026-06-16T08:00:00.000Z',
      publishedAt: null,
      featuredImage: null,
      contentType: 'article',
      isBreaking: false,
      isExclusive: false,
      isFeatured: false,
    },
    {
      id: 'art-002',
      title: 'Artikel Published Test',
      slug: 'artikel-published-test',
      excerpt: 'Excerpt published',
      status: 'published',
      author: { id: 'u-1', name: 'Test Reporter' },
      category: { id: 'cat-1', name: 'Politik', slug: 'politik', color: '#ef4444' },
      createdAt: '2026-06-15T08:00:00.000Z',
      updatedAt: '2026-06-16T10:00:00.000Z',
      publishedAt: '2026-06-16T10:00:00.000Z',
      featuredImage: 'https://example.com/image.jpg',
      contentType: 'article',
      isBreaking: false,
      isExclusive: false,
      isFeatured: false,
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 1,
};

test.describe('Article Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'superadmin', SITE);

    // Mock articles list API
    await page.route('**/api/v1/articles**', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_ARTICLES_LIST }),
        });
      } else {
        route.continue();
      }
    });
  });

  test('articles list page menampilkan heading "Kelola Post"', async ({ page }) => {
    await page.goto(`/${SITE}/dashboard/articles`);

    await expect(page.getByText('Kelola Post')).toBeVisible({ timeout: 15000 });
  });

  test('articles list page menampilkan tombol "Post Berita"', async ({ page }) => {
    await page.goto(`/${SITE}/dashboard/articles`);

    await expect(page.getByText('Post Berita')).toBeVisible({ timeout: 15000 });
  });

  test('articles list menampilkan data artikel', async ({ page }) => {
    await page.goto(`/${SITE}/dashboard/articles`);

    await expect(page.getByText('Artikel Draft Test')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Artikel Published Test')).toBeVisible();
  });

  test('status filter tabs tersedia', async ({ page }) => {
    await page.goto(`/${SITE}/dashboard/articles`);

    await expect(page.getByText('Semua')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Draft')).toBeVisible();
    await expect(page.getByText('Terbit')).toBeVisible();
  });

  test('search input tersedia', async ({ page }) => {
    await page.goto(`/${SITE}/dashboard/articles`);

    await expect(page.getByPlaceholder('Cari judul post')).toBeVisible({ timeout: 15000 });
  });

  test('klik "Post Berita" navigasi ke editor', async ({ page }) => {
    await page.goto(`/${SITE}/dashboard/articles`);

    const createButton = page.getByText('Post Berita');
    await createButton.waitFor({ timeout: 15000 });
    await createButton.click();

    await page.waitForURL(new RegExp(`/${SITE}/dashboard/articles/new`), { timeout: 10000 });
    expect(page.url()).toContain('/articles/new');
  });
});
