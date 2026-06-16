import { test, expect } from '@playwright/test';
import { mockPublicArticle, mockPublicArticlesList, MOCK_ARTICLE } from './helpers/homepage-mock';

const SITE = 'pusat';

test.describe('Article Public View', () => {
  test.beforeEach(async ({ page }) => {
    mockPublicArticle(page);
    mockPublicArticlesList(page);

    // Mock comments
    await page.route('**/api/v1/comments**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    // Mock ads
    await page.route('**/api/v1/ads/public**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    // Mock analytics
    await page.route('**/api/v1/analytics**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
  });

  test('menampilkan judul artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText(MOCK_ARTICLE.title)).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan nama penulis', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText(MOCK_ARTICLE.author.name)).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan kategori artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText(MOCK_ARTICLE.category.name)).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan excerpt artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText(MOCK_ARTICLE.excerpt)).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan section Bagikan dan Simpan', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText('Bagikan:')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Simpan:')).toBeVisible();
  });

  test('menampilkan info artikel di sidebar', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    // Sidebar info boxes
    await expect(page.getByText('Baca')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Kata')).toBeVisible();
    await expect(page.getByText('Terbit')).toBeVisible();
  });

  test('menampilkan tags artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    // Tags ditampilkan sebagai link
    await expect(page.getByText('#politik')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('#indonesia')).toBeVisible();
  });

  test('menampilkan section komentar', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.locator('#comments')).toBeVisible({ timeout: 20000 });
  });
});
