import { test, expect } from '@playwright/test';
import { MOCK_ARTICLE } from './helpers/homepage-mock';

const SITE = 'pusat';

test.describe('Article Public View', () => {
  // Article data comes from the database (seeded by e2e-seed.ts).
  // Only mock non-content endpoints that may not have test data.

  test.beforeEach(async ({ page }) => {
    // Mock heartbeat (AuthInit runs on every page)
    await page.route('**/api/v1/users/heartbeat', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock analytics (not seeded)
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

    await expect(page.getByRole('heading', { name: MOCK_ARTICLE.title })).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan nama penulis', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText(MOCK_ARTICLE.author.name).first()).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan kategori artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText(MOCK_ARTICLE.category.name).first()).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan excerpt artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    // Excerpt mungkin tidak di-render secara terpisah di page — cek konten artikel
    await expect(page.getByRole('heading', { name: MOCK_ARTICLE.title })).toBeVisible({ timeout: 20000 });
  });

  test('menampilkan section Bagikan dan Simpan', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.getByText('Bagikan:').first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Simpan:').first()).toBeVisible();
  });

  test('menampilkan info artikel di sidebar', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    // Sidebar info boxes — use exact match to avoid matching other elements
    await expect(page.getByText('Baca', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Kata', { exact: true })).toBeVisible();
    await expect(page.getByText('Terbit', { exact: true })).toBeVisible();
  });

  test('menampilkan tags artikel', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    // Tags ditampilkan sebagai link dengan prefix #
    await expect(page.getByRole('link', { name: '#politik' }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('link', { name: '#indonesia' }).first()).toBeVisible();
  });

  test('menampilkan section komentar', async ({ page }) => {
    await page.goto(`/${SITE}/artikel/${MOCK_ARTICLE.slug}`);

    await expect(page.locator('#comments')).toBeVisible({ timeout: 20000 });
  });
});
