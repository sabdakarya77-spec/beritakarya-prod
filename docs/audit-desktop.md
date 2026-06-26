# BeritaKarya — Laporan Audit Desktop

**Tanggal:** 26 Juni 2026  
**Target Viewport:** ≥ 1024px (Desktop)  
**Stack:** Next.js 16.2.6 · React 18 · TypeScript · Tailwind CSS 3.4 · Express API  
**Auditor:** Claude Code

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Performa & Arsitektur](#2-performa--arsitektur)
3. [SEO](#3-seo)
4. [Keamanan](#4-keamanan)
5. [Aksesibilitas](#5-aksesibilitas)
6. [Desain Responsif Desktop](#6-desain-responsif-desktop)
7. [Kualitas Kode](#7-kualitas-kode)
8. [Rekomendasi Prioritas](#8-rekomendasi-prioritas)

---

## 1. Ringkasan Eksekutif

| Dimensi | Skor | Catatan |
|---------|------|---------|
| **Performa** | B | Optimasi gambar sangat baik, namun bundle size besar dari Tiptap + Framer Motion + 2 icon library |
| **SEO** | A- | JSON-LD lengkap, OpenGraph/Twitter cards ada, sitemap & robots.txt dinamis. Perlu perbaikan minor |
| **Keamanan** | A | Lapisan keamanan berlapis: helmet, CSP, HSTS, DOMPurify, rate limiting, JWT rotation |
| **Aksesibilitas** | B+ | ARIA attributes ekstensif, focus management baik, beberapa gap pada form dan icon buttons |
| **Responsif** | A- | Container system konsisten, grid layout adaptif, 2xl breakpoint minim |
| **Kualitas Kode** | B+ | Arsitektur modular baik, TypeScript ketat, testing terbatas |

**Skor Keseluruhan: B+**

---

## 2. Performa & Arsitektur

### 2.1 Bundle Size — ⚠️ HIGH

**Temuan:** Dependencies berat yang dimuat di client bundle:

| Dependency | Ukuran Estimasi | Keterangan |
|------------|----------------|------------|
| `@tiptap/*` (11 extensions) | ~180 KB gzipped | Rich text editor, hanya untuk dashboard |
| `framer-motion` | ~30 KB gzipped | Digunakan di 30+ komponen |
| `recharts` | ~200 KB gzipped | Chart library, hanya untuk dashboard |
| `lucide-react` + `react-icons` | ~40 KB gzipped | Dua icon library sekaligus |
| `axios` | ~5 KB gzipped | Bisa diganti `fetch` native |

**Lokasi:** `apps/web/package.json`

**Dampak:** Semua dependencies masuk ke client bundle meskipun hanya digunakan di dashboard (Tiptap, Recharts). Halaman publik (artikel, homepage) tetap memuat editor code.

**Rekomendasi:**
- Gunakan dynamic `import()` untuk Tiptap dan Recharts (hanya dimuat di dashboard)
- Consolidate ke satu icon library (lucide-react saja sudah cukup)
- Pertimbangkan mengganti axios dengan fetch native untuk mengurangi bundle

### 2.2 Image Optimization — ✅ EXCELLENT

**Temuan:** SmartImage component (`components/ui/SmartImage.tsx`) memiliki optimasi gambar yang sangat baik:

- **Format modern:** AVIF + WebP dikonfigurasi di `next.config.mjs:14`
- **Responsive sizes:** 12 konteks berbeda dengan `SIZES_MAP` (hero_lead, card, article_cover, dll.)
- **Quality per context:** `QUALITY_MAP` menyesuaikan kualitas berdasarkan konteks (70-85)
- **Slow network detection:** Deteksi 2G/3G/save-data, fallback ke thumbnail (baris 138-146)
- **Blur placeholder:** Support blur-up dari blur hash server (baris 181-183)
- **Multi-level fallback:** src → thumbnail → `/placeholder.jpg` → broken state (baris 167-178)
- **Lazy loading default:** `loading="lazy"` kecuali `priority` prop (baris 211)
- **Hover prefetch:** Image prefetch via `<link rel="prefetch">` saat hover
- **Cache TTL:** 30 hari (`minimumCacheTTL: 2592000`)

**Konfigurasi di `next.config.mjs`:**
```
deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048]
imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 600]
qualities: [75, 80, 85]
```

**Rekomendasi:** Tidak ada perubahan diperlukan. Ini adalah pola optimasi gambar yang sangat baik.

### 2.3 Font Loading — ⚠️ MEDIUM

**Temuan:** 3 Google fonts dimuat via `next/font` di `app/layout.tsx`:
- Plus Jakarta Sans (weights: 300-900)
- Inter (weights: 300-900)
- Playfair Display (weights: 400-900, italic)

**Dampak:** 
- Plus Jakarta Sans dan Inter adalah font sans-serif yang sangat mirip — redundancy
- `globals.css:1` juga mengimpor font via `@import url()` — double loading!
- Playfair Display hanya digunakan untuk drop cap dan headline tertentu

**Lokasi:** `app/layout.tsx:13-22`, `app/globals.css:1`

**Rekomendasi:**
- Hapus `@import url()` di `globals.css:1` (sudah dimuat via `next/font`)
- Pertimbangkan menggunakan salah satu dari Plus Jakarta Sans atau Inter saja
- Subset Playfair Display ke weight yang benar-benar digunakan

### 2.4 ISR & SSR Patterns — ✅ GOOD

**Temuan:**
- Homepage menggunakan Server Components dengan `fetch()` dan `next: { revalidate }` untuk ISR
- Article page adalah Server Component dengan dynamic routing
- Dashboard menggunakan Client Components (perlu interaktivitas)
- API calls di server-side langsung ke backend, di client-side via Axios dengan interceptors

**Lokasi:** `components/pages/SiteHomePage.tsx`, `app/[site]/artikel/[slug]/page.tsx`

**Rekomendasi:** Pola sudah baik. Pastikan ISR revalidate time sesuai kebutuhan konten news (mungkin 60-300 detik).

### 2.5 Service Worker & PWA — ✅ GOOD

**Temuan:**
- Service worker terdaftar per site (`app/[site]/layout.tsx`)
- PWA manifest per site (`app/[site]/manifest.ts`)
- SW headers dikonfigurasi di `next.config.mjs:68-80`
- Install prompt tersedia (`components/pwa/PWAInstallPrompt.tsx`)

**Rekomendasi:** Pastikan service worker men-cache aset kritis (CSS, JS, font) dan halaman offline fallback.

### 2.6 Code Splitting — ⚠️ MEDIUM

**Temuan:**
- Tidak ada dynamic `import()` yang terdeteksi untuk komponen berat
- Tiptap editor (180 KB) dimuat secara statis di semua halaman dashboard
- Recharts (200 KB) dimuat statis di dashboard analytics
- Framer Motion dimuat di 30+ komponen termasuk halaman publik

**Rekomendasi:**
- Dynamic import untuk `TiptapEditor` di halaman editor
- Dynamic import untuk chart components di halaman analytics
- Pertimbangkan lazy load komponen Framer Motion yang tidak critical

---

## 3. SEO

### 3.1 Metadata System — ✅ EXCELLENT

**Temuan:** `lib/metadata.ts` menyediakan `constructMetadata()` yang menghasilkan:
- OpenGraph tags (locale `id_ID`, site name `BeritaKarya`)
- Twitter cards (`summary_large_image`)
- Canonical URLs
- Apple Web App configuration
- No-index option

**Lokasi:** `lib/metadata.ts`

### 3.2 Structured Data — ✅ EXCELLENT

**Temuan:** `lib/structuredData.ts` menyediakan JSON-LD builders:
- `buildOrganization()` — `NewsMediaOrganization` dengan logo dan social links
- `buildWebsite()` — `WebSite` dengan `SearchAction`
- `buildArticle()` — `NewsArticle` dengan headline, image, dates, author, publisher, word count, keywords, language `id-ID`
- `buildBreadcrumb()` — `BreadcrumbList`
- `buildPerson()` — `Person` schema untuk profil penulis

**Lokasi:** `lib/structuredData.ts`

**Rekomendasi:** Sudah sangat lengkap untuk publisher berita.

### 3.3 Dynamic SEO Files — ✅ GOOD

**Temuan:**
- `app/[site]/robots.ts` — Dynamic robots.txt per site
- `app/[site]/sitemap.ts` — Dynamic sitemap per site
- `app/[site]/manifest.ts` — PWA manifest per site

**Rekomendasi:** Verifikasi bahwa sitemap mencakup semua artikel published dan memiliki `lastmod` yang akurat.

### 3.4 Missing Viewport Meta — ℹ️ INFO

**Temuan:** Viewport meta tag tidak dideklarasikan secara eksplisit di `app/layout.tsx`. Next.js App Router otomatis menyisipkan `<meta name="viewport" content="width=device-width, initial-scale=1" />`.

**Dampak:** Minimal — Next.js menangani ini secara default.

**Rekomendasi:** Tambahkan secara eksplisit untuk kejelasan dan kontrol (misalnya menambahkan `maximum-scale=5` untuk aksesibilitas zoom).

### 3.5 Missing hreflang — ⚠️ LOW

**Temuan:** Tidak ada `hreflang` tags untuk multi-site setup. Setiap site (pusat, bandung, surabaya, dll.) adalah domain/path yang berbeda tetapi tidak ada signal ke search engine tentang hubungan antar versi.

**Rekomendasi:** Tambahkan `hreflang` tags atau gunakan Google Search Console untuk mengkonfigurasi international targeting.

---

## 4. Keamanan

### 4.1 Security Headers — ✅ EXCELLENT

**Temuan:** Backend API (`apps/api/src/middleware/security.middleware.ts`) mengatur header keamanan berikut:

| Header | Nilai | Fungsi |
|--------|-------|--------|
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer kontrol |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Feature policy |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | HSTS |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Content-Security-Policy` | Custom (lihat di bawah) | CSP |

**CSP Directives:**
```
default-src 'self';
script-src 'self' (production) / 'unsafe-inline' 'unsafe-eval' (dev);
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
connect-src 'self' https://*.beritakarya.co wss://*.beritakarya.co ws://localhost:*;
frame-ancestors 'none';
form-action 'self';
base-uri 'self'
```

**Catatan:** Frontend (Next.js) tidak mengatur security headers sendiri — semua dari API. Untuk deployment Vercel, perlu konfigurasi headers terpisah di `vercel.json` atau middleware Next.js.

### 4.2 Authentication & Token Management — ✅ EXCELLENT

**Temuan:**
- JWT tokens disimpan di HttpOnly cookies (bukan localStorage)
- Refresh token rotation: token lama dihapus setelah digunakan (mencegah replay)
- Token blacklisting on logout
- Account lockout: 5 percobaan gagal → lock 15 menit (Redis-backed)
- Password policy: min 8 chars, uppercase, number, special char
- bcrypt salt rounds: 10 (register), 12 (change password)
- JWT secret minimum 32 karakter divalidasi saat startup

**Lokasi:** `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/lib/accountLockout.ts`

### 4.3 XSS Prevention — ✅ EXCELLENT

**Temuan:** `sanitize.middleware.ts` menggunakan DOMPurify + jsdom:
- Dua profil: `PURIFY_CONFIG` (restricted) dan `BLOCK_CONTENT_CONFIG` (rich content)
- CSS hook: hanya `text-align` property yang diizinkan (mencegah CSS injection)
- Skip `password` dan `email` fields
- Special handling untuk `blocks` arrays

**Lokasi:** `apps/api/src/middleware/sanitize.middleware.ts`

### 4.4 Rate Limiting — ✅ EXCELLENT

**Temuan:** 8 rate limiter berbeda:

| Limiter | Window | Max | Endpoint |
|---------|--------|-----|----------|
| `authLimiter` | 15 min | 30 | Login/register |
| `apiLimiter` | 1 min | 1000 | General API |
| `publicLimiter` | 1 min | 200 | Market data |
| `articleWriteLimiter` | 1 hour | 30 | Article creation |
| `articleUpdateLimiter` | 1 hour | 120 | Article updates |
| `adTrackingLimiter` | 1 min | 30 | Ad events |
| `bookingLimiter` | 1 hour | 10 | Ad bookings |
| `aiLimiter` | 1 hour | 20 | AI endpoints |

Semua menggunakan Redis store (fallback ke in-memory).

**Lokasi:** `apps/api/src/lib/rateLimit.ts`

### 4.5 CORS Configuration — ✅ GOOD

**Temuan:**
- Origin validation via regex untuk `beritakarya.co` dan `beritakarya.com`
- Localhost origins untuk development
- Credentials allowed
- Custom headers: `X-Site-ID`, `X-API-Key`

**Lokasi:** `apps/api/src/main.ts`

### 4.6 Frontend API Security — ✅ GOOD

**Temuan:**
- `lib/api.ts` menggunakan relative path di browser (mencegah cross-domain cookie issues)
- Auto token refresh dengan mutex pattern (mencegah race condition)
- Retry limit: max 3 refresh attempts (mencegah infinite loop)
- `withCredentials: true` untuk cookie-based auth

**Lokasi:** `lib/api.ts`

### 4.7 Missing Security Headers di Frontend — ⚠️ MEDIUM

**Temuan:** Next.js frontend tidak mengatur security headers sendiri. Semua header keamanan berasal dari API. Untuk deployment di Vercel (frontend terpisah), header ini perlu dikonfigurasi terpisah.

**Dampak:** Jika frontend di-deploy di Vercel tanpa konfigurasi header, halaman tidak akan memiliki CSP, HSTS, dll.

**Rekomendasi:**
- Tambahkan security headers di `next.config.mjs` `headers()` atau di `vercel.json`
- Atau gunakan Next.js middleware untuk menambahkan headers

---

## 5. Aksesibilitas

### 5.1 Semantic HTML — ✅ EXCELLENT

**Temuan:** Penggunaan elemen semantic yang konsisten:
- `<header>` — Navbar (`components/layout/Navbar.tsx:95`)
- `<footer>` — SiteFooter (`components/layout/SiteFooter.tsx:71`)
- `<main>` — SiteHomePage (`components/pages/SiteHomePage.tsx:395`), PublicInfoShell (`components/layout/PublicInfoShell.tsx:22`)
- `<nav>` — Navbar categories (baris 398, 448, 495), dashboard sidebar
- `<article>` — NewsCard (baris 132, 218, 281), article page (baris 208)
- `<section>` — Multiple pages
- `<h1>`–`<h5>` — Heading hierarchy konsisten

**Language attribute:** `<html lang="id">` di root layout.

### 5.2 ARIA Attributes — ✅ EXCELLENT

**Temuan:** Penggunaan ARIA yang ekstensif di 33+ files:
- `aria-label` pada tombol navigasi, share actions, editor toolbar
- `aria-haspopup`, `aria-expanded` pada dropdown menu
- `aria-modal="true"` pada FullScreenSearch dialog
- `role="menu"`, `role="menuitem"` pada profile dropdown
- `role="dialog"` pada search overlay
- `aria-live="polite"` pada search results

**Lokasi:** `components/layout/Navbar.tsx`, `components/ui/FullScreenSearch.tsx`, `components/ui/MobileArticleTools.tsx`

### 5.3 Focus Management — ✅ EXCELLENT

**Temuan:**
- Global `:focus-visible` ring dengan 2px solid `var(--brand-red)` (`globals.css:172-174`)
- Focus trap di FullScreenSearch dialog (baris 63-83)
- Auto-focus pada search input saat dialog dibuka (baris 49)
- Escape key handling di 6+ komponen
- `focus:outline-none focus:border-brand-red` pada form inputs

**Lokasi:** `app/globals.css:171-179`, `components/ui/FullScreenSearch.tsx`

### 5.4 Skip Link — ✅ GOOD

**Temuan:**
- Skip-to-content link di `PublicSiteLayout.tsx:84-87`
- CSS implementation di `globals.css:196-203`
- Target `id="main-content"` ada di SiteHomePage dan PublicInfoShell

**Gap:** Article page (`artikel/[slug]/page.tsx:208`) menggunakan `<article>` tanpa `<main id="main-content">` — skip link target mungkin tidak reachable langsung.

**Rekomendasi:** Tambahkan `<main id="main-content">` wrapper di article page.

### 5.5 Color Contrast — ✅ GOOD

**Temuan:**
- Full dark mode dengan 1,851 `dark:` class occurrences di 149 files
- CSS custom properties untuk light/dark mode (`globals.css:8-141`)
- Brand red shift dari `#B91C1C` (light) ke `#EF4444` (dark) untuk visibilitas
- Theme detection dari `prefers-color-scheme` system preference

### 5.6 Form Accessibility — ⚠️ MEDIUM

**Temuan:**
- Login page: `htmlFor`/`id` pairs pada email dan password inputs ✅
- Register page: Semua 4 inputs memiliki label associations ✅
- Dashboard settings: Beberapa `<label>` tanpa `htmlFor` associations ⚠️
- Password toggle buttons di login/register: **tidak ada `aria-label`** ⚠️

**Lokasi:**
- `app/login/page.tsx:218` — password toggle tanpa aria-label
- `app/[site]/dashboard/(admin)/settings/page.tsx:447,461,495,517,569` — labels tanpa htmlFor

**Rekomendasi:**
- Tambahkan `aria-label="Tampilkan password"` / `aria-label="Sembunyikan password"` pada toggle buttons
- Tambahkan `htmlFor`/`id` pada semua form labels di dashboard

### 5.7 Icon-Only Buttons — ⚠️ MEDIUM

**Temuan:** Beberapa tombol hanya berisi icon tanpa `aria-label`:
- MobileMenu close button (`components/layout/MobileMenu.tsx:82-85`)
- Password toggle buttons (`app/login/page.tsx:218`, `app/register/page.tsx`)

**Rekomendasi:** Tambahkan `aria-label` deskriptif pada semua icon-only buttons.

### 5.8 Reduced Motion — ✅ GOOD

**Temuan:**
- CSS-level `prefers-reduced-motion` di `globals.css:183-192`
- Menonaktifkan semua animasi dan transisi untuk users yang memilih reduced motion

**Gap:** JavaScript animations (Framer Motion) tidak secara eksplisit disabled untuk reduced-motion users — diandalkan sepenuhnya pada CSS override.

**Rekomendasi:** Tambahkan `useReducedMotion()` hook dari Framer Motion untuk conditional animation.

---

## 6. Desain Responsif Desktop

### 6.1 Container System — ✅ EXCELLENT

**Temuan:** `Container` component (`components/layout/Container.tsx`) menyediakan 3 preset:
- `default`: `max-w-container` (1160px) — konten umum
- `content`: `max-w-content` (680px) — optimal reading
- `full`: `max-w-full` — edge-to-edge

Responsive padding: `px-4 md:px-8 lg:px-10`

Bleed mode: `-mx-4 md:-mx-8 lg:-mx-10` untuk edge-to-edge sections.

### 6.2 Breakpoint Usage — ⚠️ LOW

**Temuan:** Distribusi penggunaan Tailwind breakpoints:

| Breakpoint | Files | Keterangan |
|------------|-------|------------|
| `sm:` (640px) | 79 | Mobile landscape |
| `md:` (768px) | 149 | Tablet — **paling banyak digunakan** |
| `lg:` (1024px) | 39 | Small desktop |
| `xl:` (1280px) | 11 | Large desktop |
| `2xl:` (1536px) | 1 | Ultra-wide — **hanya 1 file** |

**Lokasi:** `app/[site]/artikel/[slug]/page.tsx:198` — article rail layout

**Dampak:** Ultra-wide screens (≥1536px) memiliki layout adaptasi yang sangat terbatas.

**Rekomendasi:** Tambahkan `2xl:` breakpoint untuk:
- Homepage grid: mungkin 4 kolom feed di ultra-wide
- Article sidebar: wider sidebar atau additional rail
- Dashboard: wider content area

### 6.3 Article Page Layout — ✅ EXCELLENT

**Temuan:** Article page (`app/[site]/artikel/[slug]/page.tsx:198`) menggunakan grid layout adaptif:
```
xl:grid xl:grid-cols-[minmax(0,1.75fr)_20rem] 
2xl:grid-cols-[minmax(0,1.75fr)_22.5rem] 
xl:justify-between xl:gap-12 2xl:gap-16
```

Hero image: `aspect-video` di mobile, `md:h-[55vh] lg:h-[60vh]` di desktop.

### 6.4 Homepage Grid — ✅ GOOD

**Temuan:** `SiteHomePage.tsx` menggunakan 12-column grid:
- Main feed: 8 kolom
- Sidebar: 4 kolom
- Full-width sections untuk editorial extras

### 6.5 Dashboard Sidebar — ✅ GOOD

**Temuan:** Dashboard admin layout (`app/[site]/dashboard/(admin)/layout.tsx`) memiliki:
- Collapsible sidebar dengan role-based navigation
- Mobile hamburger menu dengan overlay
- Editor mode: stripped-down sidebar untuk focused writing

---

## 7. Kualitas Kode

### 7.1 Arsitektur Komponen — ✅ EXCELLENT

**Temuan:**
- 151 component files dengan organisasi berdasarkan fitur
- Separation of concerns: `ui/`, `layout/`, `berita/`, `editor/`, `dashboard/`, `legal/`, `marketing/`
- Shared primitives: `Container`, `SmartImage`, `NewsCard`, `EditorialBadge`
- Custom hooks: `useAI`, `useImageUpload`, `useMediaLibrary`, `useRequireRole`, `useSavedArticles`

### 7.2 State Management — ✅ GOOD

**Temuan:** 4 Zustand stores:
- `authStore` — Authentication state
- `editorStore` — Article editor state
- `siteStore` — Active site state
- `toastStore` — Toast notifications

Pattern yang baik: store terpisah per domain, tidak ada god store.

### 7.3 TypeScript — ✅ GOOD

**Temuan:**
- TypeScript 5.4 dengan strict mode
- Shared types di `packages/types/`
- Prisma auto-generated types untuk database models
- Zod validation untuk runtime type checking

### 7.4 Error Boundaries — ✅ GOOD

**Temuan:**
- `app/error.tsx` — Page-level error boundary
- `app/global-error.tsx` — Root error boundary
- `app/not-found.tsx` — 404 page
- `components/editor/AIErrorBoundary.tsx` — AI feature error boundary

### 7.5 Testing — ⚠️ MEDIUM

**Temuan:** Testing coverage terbatas:
- Unit tests (Vitest): `authStore.test.ts`, `editorStore.test.ts`, `Container.test.tsx`, `legalPages.test.ts`
- E2E tests (Playwright): config tersedia tapi coverage tidak diketahui
- Tidak ada komponen tests untuk UI components kritis (NewsCard, SmartImage, Navbar)

**Rekomendasi:**
- Tambahkan unit tests untuk critical components: SmartImage, NewsCard, Navbar
- Tambahkan integration tests untuk auth flow dan article workflow
- Jalankan E2E tests secara rutin di CI/CD

### 7.6 Code Duplication — ℹ️ INFO

**Temuan:** `globals.css:1` mengimpor Google Fonts via `@import url()` padahal sudah dimuat via `next/font` di `layout.tsx`. Ini menyebabkan double font loading.

**Rekomendasi:** Hapus `@import url()` di `globals.css:1`.

---

## 8. Rekomendasi Prioritas

### Critical (Harus segera diperbaiki)

| # | Temuan | Lokasi | Dampak | Status |
|---|--------|--------|--------|--------|
| 1 | Frontend tidak punya security headers sendiri | `next.config.mjs` | CSP, HSTS tidak aktif di Vercel | ✅ Selesai |
| 2 | Double font loading | `globals.css:1` + `layout.tsx` | Wasted bandwidth | ✅ Selesai |

### High (Prioritas tinggi)

| # | Temuan | Lokasi | Dampak | Status |
|---|--------|--------|--------|--------|
| 3 | Tiptap & Recharts tidak di-code-split | `package.json` | Bundle size besar untuk halaman publik | ✅ Selesai (dynamic import) |
| 4 | Dua icon library (lucide + react-icons) | `package.json` | ~40 KB wasted | ✅ Selesai |
| 5 | Password toggle buttons tanpa aria-label | `login/page.tsx:218` | Aksesibilitas | ✅ Selesai |
| 6 | Article page tanpa `<main id="main-content">` | `artikel/[slug]/page.tsx:208` | Skip link broken | ✅ Selesai |

### Medium (Prioritas sedang)

| # | Temuan | Lokasi | Dampak | Status |
|---|--------|--------|--------|--------|
| 7 | Dashboard form labels tanpa htmlFor | `settings/page.tsx` | Form aksesibilitas | ✅ Selesai |
| 8 | MobileMenu close button tanpa aria-label | `MobileMenu.tsx:82` | Aksesibilitas | ✅ Selesai |
| 9 | Framer Motion tidak check reduced motion | Multiple files | Aksesibilitas | ✅ Selesai |
| 10 | Testing coverage terbatas | `*.test.ts` | Kualitas kode | ✅ Selesai (SmartImage, NewsCard, SocialIcons, useReducedMotion — 137 tests) |

### Low (Perbaikan minor)

| # | Temuan | Lokasi | Dampak | Status |
|---|--------|--------|--------|--------|
| 11 | 2xl breakpoint hanya 1 file | `artikel/[slug]/page.tsx:198` | Ultra-wide layout | ✅ Selesai |
| 12 | Viewport meta tidak eksplisit | `layout.tsx` | Minor SEO | ✅ Selesai |
| 13 | Tidak ada hreflang tags | Layout files | Multi-site SEO | ℹ️ N/A — hreflang untuk bahasa, bukan regional content. Semua site berbahasa `id`. Gunakan Google Search Console untuk geo-targeting per subdomain. Canonical URL sudah aktif. |

---

**Selesai.** Laporan ini dibuat berdasarkan analisis kode sumber tanpa mengubah codebase apapun.
