# Cleanup Dead Code — Berdasarkan Verifikasi scan.md

Membersihkan dead code, build artifacts, dan one-off scripts sesuai temuan
verifikasi `docs/scan.md`. Sekaligus mengaktifkan Next.js middleware dengan
rename `proxy.ts → middleware.ts` yang selama ini tidak aktif.

---

## User Review Required

> [!IMPORTANT]
> **proxy.ts → middleware.ts**: Setelah rename, middleware akan langsung aktif di semua route Next.js. Ini berarti:
> - Subdomain routing (`bandung.beritakarya.co` → siteId) **mulai berjalan**
> - Auth guard `/dashboard` tanpa token **mulai redirect ke /login**
> - URL rewrite (`/` → `/{siteId}/`) **mulai aktif**
>
> Pastikan environment sudah siap sebelum deploy ke production.

> [!NOTE]
> **`apps/api/scripts/`** — 3 script (`backfill-blur.ts`, `import-wordpress.ts`, `query-media.ts`) **masih dipakai** (konfirmasi user 19 Juni 2026). Tidak dihapus.

---

## Open Questions

> [!IMPORTANT]
> 1. ~~Apakah `apps/api/scripts/backfill-blur.ts`, `import-wordpress.ts`, dan `query-media.ts` masih dibutuhkan?~~ ✅ **MASIH DIPAKAI** — konfirmasi user 19 Juni 2026
> 2. ~~Apakah rename `proxy.ts → middleware.ts` dijalankan sekarang atau nanti?~~ ✅ **SUDAH SELESAI** — 19 Juni 2026

---

## Proposed Changes

### Phase 1 — Aktivasi Next.js Middleware ✅ SELESAI

#### [MODIFY → RENAME] `proxy.ts` → `middleware.ts` ✅

- ✅ Rename file `apps/web/proxy.ts` → `apps/web/middleware.ts`
- ✅ Rename export function `proxy` → `middleware` (Next.js requirement)
- ✅ Update komentar di `lib/api.ts` dan `dashboard/layout.tsx`
- Next.js akan otomatis mengenali `middleware.ts` di root project dan menjalankannya pada setiap request

---

### Phase 2 — Hapus Dead Files di `apps/api`

#### [DELETE] 16 file berikut:

**Dead source files (`src/`):**
- `src/db/fix_id.ts` — one-off migration rename siteId
- `src/modules/user/user.repository.ts` — export `getTeamStats()` tidak diimport siapapun
- `src/scripts/backfill-kyc-fields.ts` — one-off backfill
- `src/scripts/migrate-kyc-status.ts` — one-off migration
- `src/scripts/migrate-kyc-to-r2.ts` — one-off migration

**Dead standalone scripts (root `apps/api/`):**
- `apply-email-notifications.js`
- `apply-kyc-retry-limit.js`
- `apply-role-change-email.js`
- `update-schema.js`
- `generate-migration.js` — tidak direferensikan di package.json
- `test-upload.js`
- `test-database-readiness.ts`
- `verify-database.ts`
- `verify-smtp.js`
- `temp_homepage.html` — file kosong 0 bytes

**Dead Vercel entry point:**
- `api/index.ts` → seluruh folder `api/` — Vercel serverless entry point, API self-hosted di CT 102

**Dead patch:**
- `patches/kyc-retry-limit.patch` → seluruh folder `patches/`

---

### Phase 3 — Hapus Dead Components di `apps/web`

#### [DELETE] 8 komponen dead (tidak diimport siapapun):

- `components/berita/ArticleGalleryViewer.tsx`
- `components/berita/PremiumHero.tsx`
- `components/berita/ShareButtons.tsx`
- `components/ui/ArticleActions.tsx`
- `components/ui/DateTimeWeather.tsx`
- `components/ui/FontSizeControl.tsx`
- `components/ui/MobileArticleTools.tsx` *(218 baris logika bookmark+share — tapi tidak ada yang menggunakannya)*
- `components/ui/NewsletterForm.tsx`

---

### Phase 4 — Hapus Build Artifacts

#### [DELETE] Build artifacts yang tidak perlu di-commit:

**`apps/web`:**
- `tsconfig.tsbuildinfo` (338 KB) — TypeScript incremental cache
- `.turbo/` — 4 log files Turborepo
- `test-results/` — hanya berisi `.last-run.json`

**`apps/api`:**
- `tsconfig.build.tsbuildinfo` (391 KB) — build cache, tercatat di scan.md section 2.5

> [!NOTE]
> Build artifacts ini akan di-regenerate otomatis saat `pnpm build`. Tidak ada informasi yang hilang.

---

### Phase 5 — Update `docs/scan.md`

#### [MODIFY] [scan.md](file:///d:/beritakarya-v.0.1/docs/scan.md)

Tambahkan section baru untuk mendokumentasikan gap yang ditemukan saat verifikasi:

- Tambah **Section 3.4** — File Aktif yang Tidak Tercakup Scan:
  - `components/berita/MagazineBentoHero.tsx` → aktif, diimport di `SiteHomePage.tsx`
  - `components/ui/ArticleFloatingTools.tsx` → aktif, diimport di halaman artikel
- Tambah **Section 2.7** — Scripts Root yang Perlu Dicek:
  - `scripts/backfill-blur.ts`, `scripts/import-wordpress.ts`, `scripts/query-media.ts`
- Update total hitungan dead files

---

## Verification Plan

### Automated Tests

Setelah semua perubahan, jalankan:

```bash
# Di apps/web — pastikan tidak ada broken import setelah delete components
pnpm --filter @beritakarya/web type-check

# Di apps/api — pastikan tidak ada broken import setelah delete src files
pnpm --filter @beritakarya/api type-check

# Jalankan test suite
pnpm test
```

### Manual Verification

1. **Middleware aktif**: Buka `http://localhost:3000/` → harus di-rewrite ke `/{siteId}/`
2. **Auth guard aktif**: Akses `/dashboard` tanpa login → harus redirect ke `/login`
3. **Subdomain routing**: Coba `bandung.localhost:3000` → cookie `siteId=bandung` harus ter-set
4. **API tetap berjalan**: `curl http://localhost:4000/health` → `{"status":"healthy"}`
5. **Build bersih**: Jalankan clean build dan pastikan tidak ada error

```bash
# Clean build
rm -rf apps/web/.next apps/api/dist
pnpm build
```
