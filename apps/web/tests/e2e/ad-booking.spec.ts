import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import {
  mockAdPackages,
  mockAdBookingsMy,
  mockMediaUpload,
  mockAllAdEndpoints,
} from './helpers/api-mock';

const SITE = 'pusat';

// ─── Advertiser: Order Page ──────────────────────────────────────────────────

test.describe('Ad Booking — Advertiser Order Page', () => {
  test('displays available ad packages', async ({ page }) => {
    await loginAs(page, 'advertiser', SITE);
    mockAdPackages(page);
    mockMediaUpload(page);

    await page.goto(`/${SITE}/dashboard/ads/order`);
    await expect(page.getByText('Pilih Paket & Format Iklan')).toBeVisible({ timeout: 15000 });
    // Package name appears twice (list + summary) — use first()
    await expect(page.getByText('Billboard Banner Pusat').first()).toBeVisible({ timeout: 20000 });
  });

  test('shows empty state when no packages available', async ({ page }) => {
    await loginAs(page, 'advertiser', SITE);
    // This test needs empty packages — mock overrides DB data
    mockAdPackages(page, []);

    await page.goto(`/${SITE}/dashboard/ads/order`);
    await expect(page.getByText('Belum Ada Paket Iklan Tersedia')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Advertiser: Dashboard ───────────────────────────────────────────────────

test.describe('Ad Booking — Advertiser Dashboard', () => {
  test('displays advertiser sidebar', async ({ page }) => {
    await loginAs(page, 'advertiser', SITE);
    mockAdPackages(page);
    mockAdBookingsMy(page);

    await page.goto(`/${SITE}/dashboard/ads`);
    await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  });

  test('shows booking history tab', async ({ page }) => {
    await loginAs(page, 'advertiser', SITE);
    mockAdPackages(page);
    mockAdBookingsMy(page);

    await page.goto(`/${SITE}/dashboard/ads`);
    await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
    await page.getByText('Riwayat Booking', { exact: true }).click();
    await expect(page.getByText('Riwayat Booking').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Superadmin: Ad Management ───────────────────────────────────────────────

test.describe('Ad Booking — Superadmin Management', () => {
  test('displays ads dashboard', async ({ page }) => {
    await loginAs(page, 'superadmin', SITE);
    mockAllAdEndpoints(page);

    await page.goto(`/${SITE}/dashboard/ads`);
    await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  });

  test('displays booking approval tab', async ({ page }) => {
    await loginAs(page, 'superadmin', SITE);
    mockAllAdEndpoints(page);

    await page.goto(`/${SITE}/dashboard/ads`);
    await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
    await page.getByText('Antrean Validasi Booking', { exact: true }).click();
    await expect(page.getByText(/Antrean Validasi/)).toBeVisible({ timeout: 10000 });
  });

  test('displays packages tab', async ({ page }) => {
    await loginAs(page, 'superadmin', SITE);
    mockAllAdEndpoints(page);

    await page.goto(`/${SITE}/dashboard/ads`);
    await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
    await page.getByText('Katalog Paket Iklan', { exact: true }).click();
    await expect(page.getByText(/Katalog Paket/)).toBeVisible({ timeout: 10000 });
  });
});

// ─── Access Control ──────────────────────────────────────────────────────────

test.describe('Ad Booking — Access Control', () => {
  test('advertiser cannot access editorial review page', async ({ page }) => {
    await loginAs(page, 'advertiser', SITE);
    await page.goto(`/${SITE}/dashboard/review`);
    // Review page shows "Akses Terbatas" for non-editorial roles (no redirect)
    await expect(page.getByText('Akses Terbatas')).toBeVisible({ timeout: 15000 });
  });

  test('superadmin sees full sidebar', async ({ page }) => {
    await loginAs(page, 'superadmin', SITE);
    mockAllAdEndpoints(page);

    await page.goto(`/${SITE}/dashboard`);
    await expect(page.getByText('Iklan & Banner')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Antrian Review')).toBeVisible();
    await expect(page.getByText('Manajemen Situs')).toBeVisible();
  });
});
