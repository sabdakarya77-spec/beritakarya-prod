# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ad-booking.spec.ts >> Ad Booking — Advertiser Order Page >> displays available ad packages
- Location: tests\e2e\ad-booking.spec.ts:15:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/pusat/dashboard/ads/order", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAs } from './helpers/auth';
  3   | import {
  4   |   mockAdPackages,
  5   |   mockAdBookingsMy,
  6   |   mockMediaUpload,
  7   |   mockAllAdEndpoints,
  8   | } from './helpers/api-mock';
  9   | 
  10  | const SITE = 'pusat';
  11  | 
  12  | // ─── Advertiser: Order Page ──────────────────────────────────────────────────
  13  | 
  14  | test.describe('Ad Booking — Advertiser Order Page', () => {
  15  |   test('displays available ad packages', async ({ page }) => {
  16  |     await loginAs(page, 'advertiser', SITE);
  17  |     mockAdPackages(page);
  18  |     mockMediaUpload(page);
  19  | 
> 20  |     await page.goto(`/${SITE}/dashboard/ads/order`);
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  21  |     await expect(page.getByText('Pilih Paket & Format Iklan')).toBeVisible({ timeout: 15000 });
  22  |     // Package name appears twice (list + summary) — use first()
  23  |     await expect(page.getByText('Billboard Banner Pusat').first()).toBeVisible({ timeout: 20000 });
  24  |   });
  25  | 
  26  |   test('shows empty state when no packages available', async ({ page }) => {
  27  |     await loginAs(page, 'advertiser', SITE);
  28  |     // This test needs empty packages — mock overrides DB data
  29  |     mockAdPackages(page, []);
  30  | 
  31  |     await page.goto(`/${SITE}/dashboard/ads/order`);
  32  |     await expect(page.getByText('Belum Ada Paket Iklan Tersedia')).toBeVisible({ timeout: 10000 });
  33  |   });
  34  | });
  35  | 
  36  | // ─── Advertiser: Dashboard ───────────────────────────────────────────────────
  37  | 
  38  | test.describe('Ad Booking — Advertiser Dashboard', () => {
  39  |   test('displays advertiser sidebar', async ({ page }) => {
  40  |     await loginAs(page, 'advertiser', SITE);
  41  |     mockAdPackages(page);
  42  |     mockAdBookingsMy(page);
  43  | 
  44  |     await page.goto(`/${SITE}/dashboard/ads`);
  45  |     await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  46  |   });
  47  | 
  48  |   test('shows booking history tab', async ({ page }) => {
  49  |     await loginAs(page, 'advertiser', SITE);
  50  |     mockAdPackages(page);
  51  |     mockAdBookingsMy(page);
  52  | 
  53  |     await page.goto(`/${SITE}/dashboard/ads`);
  54  |     await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  55  |     // Sidebar link "Riwayat Iklan" navigates to booking history
  56  |     await page.getByText('Riwayat Iklan').click();
  57  |     await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 10000 });
  58  |   });
  59  | });
  60  | 
  61  | // ─── Superadmin: Ad Management ───────────────────────────────────────────────
  62  | 
  63  | test.describe('Ad Booking — Superadmin Management', () => {
  64  |   test('displays ads dashboard', async ({ page }) => {
  65  |     await loginAs(page, 'superadmin', SITE);
  66  |     mockAllAdEndpoints(page);
  67  | 
  68  |     await page.goto(`/${SITE}/dashboard/ads`);
  69  |     await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  70  |   });
  71  | 
  72  |   test('displays booking approval tab', async ({ page }) => {
  73  |     await loginAs(page, 'superadmin', SITE);
  74  |     mockAllAdEndpoints(page);
  75  | 
  76  |     await page.goto(`/${SITE}/dashboard/ads`);
  77  |     await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  78  |     await page.getByRole('button', { name: 'Antrean Validasi Booking' }).click();
  79  |     // Heading appears after tab click
  80  |     await expect(page.getByText('Antrean Validasi Pemesanan', { exact: false })).toBeVisible({ timeout: 10000 });
  81  |   });
  82  | 
  83  |   test('displays packages tab', async ({ page }) => {
  84  |     await loginAs(page, 'superadmin', SITE);
  85  |     mockAllAdEndpoints(page);
  86  | 
  87  |     await page.goto(`/${SITE}/dashboard/ads`);
  88  |     await expect(page.getByText('Portal Iklan & Monetisasi')).toBeVisible({ timeout: 15000 });
  89  |     await page.getByRole('button', { name: 'Katalog Paket Iklan' }).click();
  90  |     await expect(page.getByText('Katalog Paket Iklan', { exact: true })).toBeVisible({ timeout: 10000 });
  91  |   });
  92  | });
  93  | 
  94  | // ─── Access Control ──────────────────────────────────────────────────────────
  95  | 
  96  | test.describe('Ad Booking — Access Control', () => {
  97  |   test('advertiser cannot access editorial review page', async ({ page }) => {
  98  |     await loginAs(page, 'advertiser', SITE);
  99  |     await page.goto(`/${SITE}/dashboard/review`);
  100 |     // Review page shows "Akses Terbatas" for non-editorial roles (no redirect)
  101 |     await expect(page.getByText('Akses Terbatas')).toBeVisible({ timeout: 15000 });
  102 |   });
  103 | 
  104 |   test('superadmin sees full sidebar', async ({ page }) => {
  105 |     await loginAs(page, 'superadmin', SITE);
  106 |     mockAllAdEndpoints(page);
  107 | 
  108 |     await page.goto(`/${SITE}/dashboard`);
  109 |     await expect(page.getByText('Iklan & Banner')).toBeVisible({ timeout: 15000 });
  110 |     await expect(page.getByText('Antrian Review')).toBeVisible();
  111 |     await expect(page.getByText('Manajemen Situs')).toBeVisible();
  112 |   });
  113 | });
  114 | 
```