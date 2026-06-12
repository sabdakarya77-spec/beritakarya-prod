# 🔍 BeritaKarya Full-Codebase Audit Report

**Tanggal:** 12 Juni 2026
**Scope:** Seluruh project (apps/api, apps/web, packages/*)
**Auditor:** Claude Code (4 parallel agents)

---

## 📊 Ringkasan Eksekutif

| Dimensi | CRIT | HIGH | MED | LOW | INFO | Total |
|---------|------|------|-----|-----|------|-------|
| Backend Security | 3 | 7 | 9 | 6 | 6 | **31** |
| Backend Architecture | 0 | 8 | 14 | 5 | 0 | **27** |
| Database Schema | 1 | 3 | 9 | 4 | 2 | **20*** |
| Frontend Security & Quality | 3 | 4 | 10 | 5 | 9 | **31** |
| **TOTAL** | **7** | **22** | **42** | **20** | **17** | **109** |

> *Beberapa temuan database overlap dengan backend architecture

**Skor Kesehatan Project: 5.5/10** — Banyak temuan kritis yang harus diperbaiki sebelum production.

---

## 🔴 CRITICAL FINDINGS (7) — Harus Diperbaiki Segera

### CRIT-01: XSS via `dangerouslySetInnerHTML` tanpa sanitasi
- **File:** `apps/web/app/[site]/artikel/[slug]/page.tsx` (6 lokasi: line 342, 683, 700, 708, 793, 812)
- **Masalah:** HTML dari API di-render langsung tanpa DOMPurify. Siapapun yang bisa author artikel bisa inject script yang execute di browser pembaca.
- **Fix:** Install `isomorphic-dompurify`, sanitize semua `dangerouslySetInnerHTML`.

### CRIT-02: `proxy.ts` (middleware keamanan) tidak aktif — dashboard tanpa server-side auth guard
- **File:** `apps/web/proxy.ts` (143 baris, dead code)
- **Masalah:** File berisi logic proteksi route dashboard, tapi **tidak pernah di-import** sebagai Next.js middleware. Tidak ada `middleware.ts` di project. Auth guard hanya client-side (Zustand localStorage) yang bisa di-bypass.
- **Fix:** Buat `apps/web/middleware.ts` yang meng-import dan me-re-export fungsi dari `proxy.ts`.

### CRIT-03: Production secrets hardcoded di `.env` dan `seed.ts`
- **File:** `apps/api/.env` (line 9-14, 22-25, 38-41), `apps/api/src/db/seed.ts` (line 27)
- **Masalah:** Password database, JWT secret, S3 key ada di `.env` di disk. Seed file commit password superadmin (`6669PusatKarya`) ke git.
- **Fix:** Rotasi semua secrets. Gunakan secrets manager. Hapus hardcoded credentials dari seed.

### CRIT-04: Registration endpoint bisa di-exploit untuk role escalation
- **File:** `apps/api/src/modules/auth/auth.controller.ts` (line 54-64)
- **Masalah:** `registerSchema` terima `role` dari request body. Meskipun ada guard `role === 'advertiser' ? 'advertiser' : 'reader'`, schema Zod tidak restrict.
- **Fix:** Gunakan `z.enum(['reader', 'advertiser'])` di schema.

### CRIT-05: Media FK `onDelete:SET NULL` kontradiksi dengan `NOT NULL` siteId
- **File:** `prisma/schema.prisma` (Media model), migration `20260612000000`
- **Masalah:** FK constraint masih `ON DELETE SET NULL` tapi column sudah `NOT NULL`. Hard-delete Site akan error.
- **Fix:** Buat migrasi baru: drop FK, recreate dengan `ON DELETE RESTRICT`.

### CRIT-06: User data di localStorage tanpa server-side validation
- **File:** `apps/web/store/authStore.ts` (line 101-107)
- **Masalah:** Zustand persist simpan `user` object di localStorage. Tanpa server-side middleware (CRIT-02), attacker bisa set fake user di localStorage.
- **Fix:** Aktifkan server-side middleware (CRIT-02). Validasi via `/auth/me` setiap load.

### CRIT-07: Seed file commit password superadmin ke repository
- **File:** `apps/api/src/db/seed.ts` (line 27)
- **Masalah:** Password `6669PusatKarya` dan email `sabdakarya77@gmail.com` committed ke git. Semua yang punya repo access tahu credentials.
- **Fix:** Rotasi password segera. Gunakan env variables untuk seed credentials.

---

## 🟠 HIGH FINDINGS (22) — Prioritas Tinggi

### Security (HIGH)

| # | Temuan | File | Rekomendasi |
|---|--------|------|-------------|
| H1 | JWT_SECRET tanpa minimum entropy enforcement | `lib/envValidation.ts:17` | Require 64+ hex chars |
| H2 | `requireSiteAccess` lolos jika tidak ada user | `middleware/site.middleware.ts:63` | Return 401 jika `!req.user` |
| H3 | Public routes tanpa rate limiting | `main.ts:168-169` | Tambah rate limiter |
| H4 | `sameSite: 'none'` cookies di production | `auth.controller.ts:16-27` | Gunakan `lax` + CSRF token |
| H5 | Tidak ada CSRF protection | `main.ts` (seluruh file) | Implement CSRF tokens |
| H6 | Comment moderation tanpa role check | `comment.controller.ts:130-166` | Tambah `requireRole` |
| H7 | Account lockout bypassable via email enumeration | `lib/accountLockout.ts` | Key by IP+email, uniform error |

### Architecture (HIGH)

| # | Temuan | File | Rekomendasi |
|---|--------|------|-------------|
| H8 | Error `Object.assign(new Error)` bukan `AppError` | `article.service.ts` (20+ lokasi) | Ganti ke `new AppError()` |
| H9 | Analytics `groupBy` createdAt salah — 1 row per PageView | `analytics.repository.ts:8-17` | Gunakan raw query `DATE()` |
| H10 | N+1 query di `getTeamStats` | `user.repository.ts:3-38` | Gunakan `_count`/`_sum` |
| H11 | N+1 query di `user.controller.ts` `/stats` | `user.controller.ts:254-310` | Aggregasi di query |
| H12 | `/bookings/all` tanpa pagination | `ad.controller.ts:383-393` | Tambah `take`/`skip` |
| H13 | 157 occurrences `: any` di 43 files | Seluruh backend | Set `noImplicitAny: true` |
| H14 | Invitation accept tanpa rate limiting | `invitation.controller.ts:261` | Tambah `authLimiter` |
| H15 | `/authors` fetch semua articles per user | `user.controller.ts:121-186` | Gunakan `_count`/`_sum` |

### Database (HIGH)

| # | Temuan | Model | Rekomendasi |
|---|--------|-------|-------------|
| H16 | `KYCViewLog.viewerId` tanpa FK constraint | KYCViewLog | Tambah FK `onDelete: Restrict` |
| H17 | Migration hardcode `'pusat'` tanpa guard | Migration 20260612 | Tambah existence check |
| H18 | `Article.reviewedBy` tanpa FK | Article, User | Tambah FK relation |

### Frontend (HIGH)

| # | Temuan | File | Rekomendasi |
|---|--------|------|-------------|
| H19 | Tidak ada CSRF protection di frontend | `lib/api.ts` | Implement CSRF pattern |
| H20 | URL params di-forward tanpa validasi | `register/page.tsx:21` | Validasi role allowlist |
| H21 | TypeScript strict mode disabled | `tsconfig.json:10` | Enable `strict: true` |
| H22 | `innerHTML` tanpa sanitization di settings | `dashboard/settings/page.tsx:112,272` | Sanitize output |

---

## 🟡 MEDIUM FINDINGS (42) — Prioritas Menengah

### Backend Security (MEDIUM)

| # | Temuan | Rekomendasi |
|---|--------|-------------|
| M1 | bcrypt cost factor tidak konsisten (10 vs 12) | Standarisasi ke 12 |
| M2 | Error messages leak internal detail di non-prod | Generic messages |
| M3 | Prisma error leak column names | Generic "data exists" |
| M4 | KYC file path bisa di-manipulasi | Validate path prefix |
| M5 | CORS allow semua `*.vercel.app` | Specific URLs only |
| M6 | Ad code sanitization pakai blocklist | Ganti ke allowlist |
| M7 | `express.json({ limit: '10mb' })` terlalu besar | Kurangi ke 1MB |
| M8 | CSP `unsafe-inline` di dev | Gunakan nonces |
| M9 | `CORS_ORIGIN=localhost` di production .env | Set URL production |

### Backend Architecture (MEDIUM)

| # | Temuan | Rekomendasi |
|---|--------|-------------|
| M10 | Banyak module tanpa service/repository layer | Standardisasi pattern |
| M11 | Category controller try/catch redundant | Hapus, pakai asyncHandler |
| M12 | Site controller try/catch redundant | Sama |
| M13 | Ad tracking silent error swallowing | Log errors |
| M14 | Missing `uncaughtException` handler tanpa Sentry | Selalu register |
| M15 | Article select clause diulang 6 kali | Extract constant |
| M16 | `updateArticle` pakai `data as any` | Proper typing |
| M17 | Tanpa connection pooling config | Tambah `connection_limit` |
| M18 | `console.error` di 16+ production files | Ganti ke `logger` |
| M19 | Duplicate Express type augmentation | Consolidate di satu file |
| M20 | Redis `KEYS()` untuk cache invalidation | Gunakan `SCAN` |
| M21 | N+1 Redis calls untuk online status | Gunakan `mget` |
| M22 | Comment POST tanpa input validation | Tambah Zod schema |
| M23 | Audit CSV export tanpa escape quotes | Proper CSV escaping |

### Database (MEDIUM)

| # | Temuan | Rekomendasi |
|---|--------|-------------|
| M24 | `Comment.status` String, bukan Enum | Buat `CommentStatus` enum |
| M25 | `Article.tags` Json, tidak queryable | Buat Tag join table |
| M26 | Missing index `[userId, isRead]` di Notification | Tambah composite index |
| M27 | Missing index `[articleId, status]` di Comment | Tambah composite index |
| M28 | Cross-site referential integrity gap | Validasi di service layer |
| M29 | Soft delete tidak konsisten (hanya 4/16 model) | Tambah `deletedAt` ke Media |
| M30 | Redundant index di BlacklistedToken & Invitation | Hapus `@@index([token])` |
| M31 | Enum naming inconsistency (3 konvensi) | Standarisasi lowercase |
| M32 | Missing index `[siteId, status, startDate, endDate]` di AdBooking | Tambah composite index |

### Frontend (MEDIUM)

| # | Temuan | Rekomendasi |
|---|--------|-------------|
| M33 | Monolithic page components (630-1800 lines) | Decompose ke sub-components |
| M34 | 200+ `any` types | Define proper interfaces |
| M35 | Zero `React.memo` usage | Wrap list items |
| M36 | Missing `useEffect` cleanup (AbortController) | Add AbortController |
| M37 | 113 `'use client'` files (almost entirely client-rendered) | Migrate public pages ke RSC |
| M38 | Form labels tanpa `htmlFor`/`id` | Add label associations |
| M39 | Clickable divs tanpa keyboard support | Add role/tabIndex/onKeyDown |
| M40 | Plain `<img>` di 20+ lokasi | Ganti ke `next/image` |
| M41 | siteId cookie tanpa `Secure` flag | Tambah flag untuk production |
| M42 | `document.cookie.includes('accessToken')` selalu false | Hapus check |

---

## 🟢 LOW FINDINGS (20) — Perbaikan Bertahap

| # | Dimensi | Temuan | Rekomendasi |
|---|---------|--------|-------------|
| L1 | Arch | Duplicate `requireSiteAccess` middleware (dead code) | Hapus `site-scope.middleware.ts` |
| L2 | Arch | Dead `scratch_test.ts` di source | Hapus atau pindah ke scripts/ |
| L3 | Arch | Inconsistent middleware naming | Standarisasi `.middleware.ts` |
| L4 | Arch | `Router() as any` di user/comment controller | Hapus `as any` |
| L5 | Arch | Article list queries return `blocks` (large) | Exclude dari list queries |
| L6 | DB | Ad ordering uniqueness gap | Unique constraint atau app-level |
| L7 | DB | `User.passwordHash` required (blocks SSO) | Make nullable jika SSO planned |
| L8 | DB | PageView grows unboundedly | Partitioning atau retention |
| L9 | DB | `Site.id` tanpa default value | Add `@default(uuid())` atau document |
| L10 | DB | AIUsage cascade-delete with User | Ganti ke `Restrict` |
| L11 | DB | Dead enum value `jurnalis` di PostgreSQL | Document only |
| L12 | Sec | CSP config di 2 places | Consolidate |
| L13 | Sec | Trust proxy config | Set explicit di production |
| L14 | Sec | Blacklisted tokens tidak auto-cleanup | Verify cron job |
| L15 | Sec | Refresh token cookie 30 hari, token 7 hari | Align maxAge |
| L16 | Sec | SSE tanpa connection limit | Limit per user |
| L17 | FE | Production Railway URL exposed | Remove hardcoded fallback |
| L18 | FE | Index used as key di BreakingNewsTicker | Stable identifier |
| L19 | FE | Module-level mutable state di editorStore | Move ke store |
| L20 | FE | Text sizes 7-10px fail WCAG AA | Minimum `text-xs` |

---

## ✅ POSITIVE FINDINGS (17)

| # | Temuan | Keterangan |
|---|--------|------------|
| P1 | JWT HttpOnly cookies | Token tidak di localStorage ✅ |
| P2 | Refresh token rotation | Prevents reuse attacks ✅ |
| P3 | DOMPurify sanitization di backend | Well-implemented ✅ |
| P4 | File upload security | Memory storage, MIME allowlist, Sharp processing ✅ |
| P5 | Password policy kuat | 8+ chars, upper/lower/number/special ✅ |
| P6 | `.gitignore` excludes `.env` | Properly configured ✅ |
| P7 | Prisma raw queries parameterized | No SQL injection risk ✅ |
| P8 | No secrets di NEXT_PUBLIC_ vars | OpenAI key server-side only ✅ |
| P9 | No `eval()` atau dynamic code execution | Clean ✅ |
| P10 | Zero `@ts-ignore` / `@ts-nocheck` | No type suppression ✅ |
| P11 | All `.map()` have `key` props | No missing React keys ✅ |
| P12 | SEO infrastructure lengkap | metadata, structuredData, sitemap, robots ✅ |
| P13 | `SmartImage` dengan next/image | Proper optimization di public pages ✅ |
| P14 | tree-shakeable imports | date-fns, lucide-react ✅ |
| P15 | CORS whitelist (bukan wildcard) | Specific origins ✅ |
| P16 | Redis rate limiting | 1000 req/min general, 30/15min auth ✅ |
| P17 | Helmet security headers | Properly configured ✅ |

---

## 🎯 Prioritas Perbaikan

### Phase 1 — Kritis (Minggu ini)
1. ✅ Wire up `proxy.ts` sebagai Next.js middleware (`middleware.ts`)
2. ✅ Install DOMPurify, sanitize semua `dangerouslySetInnerHTML`
3. ✅ Rotasi semua production secrets
4. ✅ Hapus hardcoded credentials dari `seed.ts`
5. ✅ Fix Media FK constraint (migration)
6. ✅ Tambah role check di comment moderation
7. ✅ Fix `requireSiteAccess` untuk reject unauthenticated

### Phase 2 — Tinggi (2 minggu)
1. Implement CSRF protection
2. Fix N+1 queries (user stats, analytics)
3. Fix analytics `groupBy` (raw query)
4. Enable TypeScript strict mode (incremental)
5. Tambah rate limiting di public endpoints
6. Standardisasi error handling (AppError)
7. Validasi URL params di frontend

### Phase 3 — Menengah (1 bulan)
1. Standardisasi controller/service/repository pattern
2. Replace `any` types dengan proper interfaces
3. Tambah missing database indexes
4. Implement `React.memo` untuk list items
5. Migrate public pages ke Server Components
6. Replace `console.error` dengan logger
7. Tambah tests untuk 8 untested modules

### Phase 4 — Rendah (Bertahap)
1. ✅ Decompose monolithic page components (ads 1801→1223, settings 1603→1097, dashboard 841→545)
2. ✅ Accessibility fixes (42 htmlFor added, 25 files text-[7-9px]→text-[10px], clickable div fixed)
3. ✅ PageView retention cron job (90-day default, batched deletes)
4. ✅ Cleanup dead code (7 files deleted: useKeyboardShortcuts, layoutStore, ArticleSharePanel, PublicGallery, SectionSuspense, cleanup.service)
5. ✅ Naming convention standardization (middleware .middleware.ts suffix, article service files renamed)

---

## 📈 Metrics

- **Total Files Changed (Last Commit):** 13 files, +395/-16 lines
- **Backend Files:** ~80 TypeScript files
- **Frontend Files:** ~150 TypeScript/TSX files
- **Database Models:** 16 models, 7 migrations
- **Test Coverage:** 6/14 backend modules tested (43%), 0 middleware tests
- **TypeScript Strictness:** `strict: false` (frontend), `noImplicitAny` not enforced (backend)

---

*Laporan ini dihasilkan oleh 4 audit agent paralel yang menganalisis security, architecture, database, dan frontend secara independen.*
