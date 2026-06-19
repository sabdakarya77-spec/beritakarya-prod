import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

const SITE = 'pusat';

test.describe('Dashboard Access Control', () => {
  test.describe('Superadmin', () => {
    test('dapat melihat semua section sidebar', async ({ page }) => {
      await loginAs(page, 'superadmin', SITE);
      await page.goto(`/${SITE}/dashboard`);

      // Section Utama
      await expect(page.getByText('Ringkasan')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Post')).toBeVisible();
      await expect(page.getByText('Media')).toBeVisible();

      // Section Editorial
      await expect(page.getByText('Antrian Review')).toBeVisible();
      await expect(page.getByText('Kategori')).toBeVisible();

      // Section Administrasi
      await expect(page.getByText('Pengguna')).toBeVisible();
      await expect(page.getByText('Audit Log')).toBeVisible();

      // Section Superadmin
      await expect(page.getByText('Manajemen Situs')).toBeVisible();
      await expect(page.getByText('AI Dashboard')).toBeVisible();
    });

    test('dapat mengakses halaman categories', async ({ page }) => {
      await loginAs(page, 'superadmin', SITE);
      await page.goto(`/${SITE}/dashboard/categories`);

      await expect(page).toHaveURL(new RegExp(`/${SITE}/dashboard/categories`));
    });
  });

  test.describe('Wapimred', () => {
    test('dapat melihat section Editorial tapi bukan Superadmin', async ({ page }) => {
      await loginAs(page, 'wapimred', SITE);
      await page.goto(`/${SITE}/dashboard`);

      // Section Utama
      await expect(page.getByText('Ringkasan')).toBeVisible({ timeout: 15000 });

      // Section Editorial
      await expect(page.getByText('Antrian Review')).toBeVisible();

      // Section Administrasi
      await expect(page.getByText('Pengguna')).toBeVisible();

      // Section Superadmin TIDAK terlihat
      await expect(page.getByText('Manajemen Situs')).not.toBeVisible();
      await expect(page.getByText('AI Dashboard')).not.toBeVisible();
    });
  });

  test.describe('Reporter', () => {
    test('hanya bisa melihat section Utama', async ({ page }) => {
      await loginAs(page, 'reporter', SITE);
      await page.goto(`/${SITE}/dashboard`);

      // Section Utama
      await expect(page.getByText('Ringkasan')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Post')).toBeVisible();
      await expect(page.getByText('Media')).toBeVisible();

      // Section Editorial TIDAK terlihat
      await expect(page.getByText('Antrian Review')).not.toBeVisible();

      // Section Administrasi TIDAK terlihat
      await expect(page.getByText('Pengguna')).not.toBeVisible();
    });
  });

  test.describe('Advertiser', () => {
    test('melihat sidebar advertiser yang terpisah', async ({ page }) => {
      await loginAs(page, 'advertiser', SITE);
      await page.goto(`/${SITE}/dashboard`);

      // Sidebar advertiser
      await expect(page.getByText('Statistik Iklan')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Riwayat Iklan')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Pasang Iklan Baru', exact: true })).toBeVisible();

      // Sidebar reguler TIDAK terlihat
      await expect(page.getByText('Ringkasan')).not.toBeVisible();
      await expect(page.getByText('Antrian Review')).not.toBeVisible();
    });
  });

  test.describe('Cross-site Guard', () => {
    test('non-superadmin diarahkan ke site sendiri', async ({ page }) => {
      await loginAs(page, 'reporter', 'bandung');
      await page.goto(`/pusat/dashboard`);

      // Harus redirect ke site sendiri
      await page.waitForURL(/\/bandung\/dashboard/, { timeout: 10000 });
      expect(page.url()).toContain('/bandung/dashboard');
    });
  });

  test.describe('Logout', () => {
    test('tombol logout tersedia di sidebar', async ({ page }) => {
      await loginAs(page, 'superadmin', SITE);
      await page.goto(`/${SITE}/dashboard`);

      await expect(page.getByText('Keluar Sistem')).toBeVisible({ timeout: 15000 });
    });
  });
});
