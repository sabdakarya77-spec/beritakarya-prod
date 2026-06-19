# Scan Report: Dead Code & Irrelevant Files

> **Tanggal**: 19 Juni 2026
> **Scope**: `apps/api/` dan `apps/web/`
> **Metode**: Grep import analysis, file existence check, config reference check

---

## Daftar Isi

1. [Temuan Kritis](#1-temuan-kritis)
2. [apps/api — Dead Files](#2-appsapi--dead-files)
3. [apps/web — Dead Files](#3-appsweb--dead-files)
4. [Rekomendasi](#4-rekomendasi)

---

## 1. Temuan Kritis

### ⚠️ `apps/web/proxy.ts` — Middleware Tidak Aktif

**Masalah**: File `proxy.ts` berisi logic Next.js middleware (subdomain detection, auth guard, URL rewrite) tapi **tidak pernah dijalankan** karena Next.js hanya membaca file bernama `middleware.ts`.

**Bukti**:
- Tidak ada `middleware.ts` di project
- Tidak ada file yang import dari `proxy.ts`
- Export `proxy` function + `config` object = signature Next.js middleware

**Dampak**:
- Subdomain routing (`bandung.beritakarya.co` → siteId) **tidak aktif**
- Auth guard `/dashboard` **tidak aktif** (user tanpa token bisa akses)
- URL rewrite (`/` → `/pusat/`) **tidak aktif**

**Opsi**:
1. **Rename** `proxy.ts` → `middleware.ts` agar aktif (recommended)
2. **Hapus** jika memang tidak dibutuhkan

---

## 2. apps/api — Dead Files

### 2.1 Dead Source Files (src/)

| # | File | Alasan Dead |
|---|------|-------------|
| 1 | `src/db/fix_id.ts` | One-off migration script (rename site ID). Sudah dijalankan, tidak diimport |
| 2 | `src/modules/user/user.repository.ts` | Export `getTeamStats()` tapi tidak ada yang import |
| 3 | `src/scripts/backfill-kyc-fields.ts` | One-off backfill script. Sudah dijalankan |
| 4 | `src/scripts/migrate-kyc-status.ts` | One-off migration script. Sudah dijalankan |
| 5 | `src/scripts/migrate-kyc-to-r2.ts` | One-off migration script. Sudah dijalankan |

### 2.2 Dead Standalone Scripts (root apps/api/)

| # | File | Alasan Dead |
|---|------|-------------|
| 6 | `apply-email-notifications.js` | One-off patch script. Sudah diterapkan |
| 7 | `apply-kyc-retry-limit.js` | One-off patch script. Sudah diterapkan |
| 8 | `apply-role-change-email.js` | One-off patch script. Sudah diterapkan |
| 9 | `update-schema.js` | One-off schema patch. Sudah diterapkan |
| 10 | `generate-migration.js` | Standalone utility. Tidak direferensikan di package.json |
| 11 | `test-upload.js` | Manual test script. Tidak direferensikan |
| 12 | `test-database-readiness.ts` | Manual test script. Tidak direferensikan |
| 13 | `verify-database.ts` | Manual verification script. Tidak direferensikan |
| 14 | `verify-smtp.js` | Manual verification script. Tidak direferensikan |
| 15 | `temp_homepage.html` | File kosong (0 bytes) |

### 2.3 Dead Vercel Entry Point

| # | File | Alasan Dead |
|---|------|-------------|
| 16 | `api/index.ts` | Vercel serverless entry point. Project sudah self-hosted, tidak pakai Vercel |

### 2.4 Dead Patch Files

| # | File | Alasan Dead |
|---|------|-------------|
| 17 | `patches/kyc-retry-limit.patch` | Patch file yang sudah diterapkan |

### 2.5 Stale dist/ Artifacts

> Catatan: Semua akan bersih saat clean build (`rm -rf dist`). Tidak perlu hapus manual.

| # | File | Alasan Stale |
|---|------|-------------|
| 18 | `dist/scratch_test.js` | Source `src/scratch_test.ts` tidak ada |
| 19 | `dist/modules/category/global-categories.seed-data.js` | Source sudah dihapus |
| 20 | `dist/middleware/site-scope.middleware.js` | Source sudah dihapus |
| 21 | `dist/modules/article/article.slug.js` | Source sudah direfaktor ke `slug.service.ts` |
| 22 | `dist/modules/article/article.content.js` | Source sudah direfaktor |
| 23 | `dist/modules/article/article.publish.js` | Source sudah direfaktor ke `publish.service.ts` |
| 24 | `dist/middleware/aiQuota.js` | Source rename ke `aiQuota.middleware.ts` |
| 25 | `dist/middleware/quotaNotifications.js` | Source pindah ke `services/quotaNotifications.service.ts` |

### 2.6 Config yang Masih Dipakai

| File | Status | Catatan |
|------|--------|---------|
| `tsconfig.scripts.json` | ✅ Aktif | Dipakai oleh `db:seed` script di package.json |
| `vitest.config.mts` | ✅ Aktif | Dipakai oleh test runner |
| `.env.example` | ✅ Aktif | Template dokumentasi |
| `.env.example.selfhosted` | ✅ Aktif | Template dokumentasi self-hosted |

---

## 3. apps/web — Dead Files

### 3.1 Dead Components

| # | File | Alasan Dead |
|---|------|-------------|
| 1 | `components/berita/ArticleGalleryViewer.tsx` | Tidak ada yang import |
| 2 | `components/berita/PremiumHero.tsx` | Tidak ada yang import |
| 3 | `components/berita/ShareButtons.tsx` | Tidak ada yang import |
| 4 | `components/ui/ArticleActions.tsx` | Tidak ada yang import |
| 5 | `components/ui/DateTimeWeather.tsx` | Tidak ada yang import |
| 6 | `components/ui/FontSizeControl.tsx` | Tidak ada yang import |
| 7 | `components/ui/MobileArticleTools.tsx` | Tidak ada yang import (wrapper) |
| 8 | `components/ui/NewsletterForm.tsx` | Tidak ada yang import |

### 3.2 Build Artifacts (seharusnya di .gitignore)

| # | File | Alasan |
|---|------|--------|
| 9 | `tsconfig.tsbuildinfo` | TypeScript incremental build cache (330KB). Regenerated setiap `tsc` |
| 10 | `.turbo/` (4 log files) | Turborepo local cache/logs |
| 11 | `test-results/` (5 dirs) | Playwright test failure screenshots dari run sebelumnya |

### 3.3 File Aktif yang Terdeteksi (BUAN dead)

| File | Status | Catatan |
|------|--------|---------|
| `components/layout/Container.test.tsx` | ✅ Aktif | Unit test |
| `store/editorStore.test.ts` | ✅ Aktif | Unit test |
| `store/authStore.test.ts` | ✅ Aktif | Unit test |
| `lib/legalPages.test.ts` | ✅ Aktif | Unit test |
| `public/placeholder.jpg` | ✅ Aktif | Fallback image untuk SmartImage, NewsCard |
| `public/sw.js` | ✅ Aktif | Service Worker |
| `postcss.config.js` | ✅ Aktif | Tailwind/PostCSS config |

---

## 4. Rekomendasi

### Aksi Segera (Safe to Delete)

**apps/api** — 16 file:
```
src/db/fix_id.ts
src/modules/user/user.repository.ts
src/scripts/backfill-kyc-fields.ts
src/scripts/migrate-kyc-status.ts
src/scripts/migrate-kyc-to-r2.ts
api/index.ts                          (entire api/ folder)
apply-email-notifications.js
apply-kyc-retry-limit.js
apply-role-change-email.js
update-schema.js
generate-migration.js
test-upload.js
test-database-readiness.ts
verify-database.ts
verify-smtp.js
temp_homepage.html
patches/kyc-retry-limit.patch         (entire patches/ folder)
```

**apps/web** — 11 file:
```
components/berita/ArticleGalleryViewer.tsx
components/berita/PremiumHero.tsx
components/berita/ShareButtons.tsx
components/ui/ArticleActions.tsx
components/ui/DateTimeWeather.tsx
components/ui/FontSizeControl.tsx
components/ui/MobileArticleTools.tsx
components/ui/NewsletterForm.tsx
tsconfig.tsbuildinfo
.turbo/
test-results/
```

### Perlu Keputusan

| Item | Opsi | Dampak |
|------|------|--------|
| `proxy.ts` | Rename → `middleware.ts` | Aktifkan multisite routing + auth guard |
| `proxy.ts` | Hapus | Multisite routing tidak jalan (perlu tulis ulang) |

### Clean Build (Setelah Hapus File)

```bash
rm -rf .turbo .next dist node_modules apps/api/dist apps/web/.next
pnpm install --frozen-lockfile
pnpm build
pnpm type-check
```

---

> **Total**: 27 file dead + 11 build artifacts = **38 file** bisa dihapus
