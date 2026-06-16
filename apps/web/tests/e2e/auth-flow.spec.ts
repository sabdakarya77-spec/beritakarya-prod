import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test.describe('Login Page', () => {
    test('menampilkan form login dengan field yang benar', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByText('Masuk ke Portal')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#login-email')).toBeVisible();
      await expect(page.locator('#login-password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
    });

    test('menampilkan link ke register dan forgot password', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByText('Daftar di sini')).toBeVisible();
      await expect(page.getByText('Lupa Password?')).toBeVisible();
    });

    test('menampilkan logo BERITAKARYA', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByText('BERITA')).toBeVisible();
      await expect(page.getByText('KARYA')).toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    test('menampilkan form register reader', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByText('Buat Akun Baru')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#register-name')).toBeVisible();
      await expect(page.locator('#register-email')).toBeVisible();
      await expect(page.locator('#register-password')).toBeVisible();
      await expect(page.locator('#register-confirm-password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Daftar Sekarang' })).toBeVisible();
    });

    test('menampilkan form register advertiser', async ({ page }) => {
      await page.goto('/register?role=advertiser');

      await expect(page.getByText('Pendaftaran Mitra Pengiklan')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('#register-name')).toBeVisible();
      await expect(page.locator('#register-email')).toBeVisible();
    });

    test('menampilkan link ke login', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByText('Masuk di sini')).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('redirect ke login jika tidak authenticated', async ({ page }) => {
      await page.goto('/pusat/dashboard');

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  });
});
