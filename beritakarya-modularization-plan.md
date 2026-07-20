# Implementation Plan — Modularisasi `beritakarya-prod`

**Tujuan:** Memecah file-file besar ("god files") jadi modul-modul kecil yang fokus satu tanggung jawab, tanpa mengubah behavior/API contract. Setiap fase = 1 branch = 1 PR, bisa direview dan di-merge terpisah.

**Prinsip kerja di semua fase:**
- Tidak ada perubahan behavior. Ini refactor murni (pindah kode, bukan tulis ulang logic).
- Public API/route/export lama tetap ada (re-export dari lokasi baru) supaya tidak ada breaking change di file lain yang meng-import.
- Tiap fase diakhiri dengan build + typecheck lokal sebelum PR dibuka.
- Urutan fase dari risiko paling rendah → paling tinggi.

---

## Fase 1 — `useAI.ts` Factory Pattern
**Branch:** `refactor/use-ai-factory`
**Risiko:** Rendah (frontend only, tidak nyentuh backend)
**File:** `apps/web/hooks/useAI.ts` (646 baris → target ~150 baris)

### Masalah
13 hook (`useRewrite`, `useExpand`, `useSummarize`, `useSEO`, `useTitleSuggestion`, dst) punya pola identik:
```
setState(loading) → callBackendAPI(endpoint, payload) → transform(result) → setState(success | error)
```
Cuma beda di: `endpoint`, bentuk `payload`, cara transform response, dan pesan error.

### Rencana
1. Buat `apps/web/hooks/ai/createAIHook.ts` — factory generik:
   ```ts
   function createAIHook<TInput, TOutput>(config: {
     endpoint: string
     transformResult?: (raw: unknown) => TOutput
     errorMessage?: string
   }) {
     return function useGeneratedHook() {
       const [state, setState] = useState<AIHookState<TOutput>>(initialState)
       const run = useCallback(async (input: TInput) => { ... }, [])
       return { ...state, run }
     }
   }
   ```
2. Buat `apps/web/hooks/ai/config.ts` — daftar 13 konfigurasi (endpoint + transform) satu-satu, ini file "data", bukan logic.
3. `useAI.ts` jadi barrel file: `export const useRewrite = createAIHook(config.rewrite)` dst — supaya semua import lama (`import { useRewrite } from '@/hooks/useAI'`) tetap jalan tanpa ubah satu pun file consumer.
4. Pindahkan type-type shared (`AIHookState`, dll) ke `apps/web/hooks/ai/types.ts`.

### File hasil
```
apps/web/hooks/
  useAI.ts                 (barrel export, ~20 baris)
  ai/
    createAIHook.ts         (factory, ~60 baris)
    config.ts                (13 konfigurasi, ~80 baris)
    types.ts
```

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/web`
- Manual: buka dashboard artikel, coba fitur AI rewrite/expand/SEO minimal 1x masing-masing, pastikan hasil & error state sama seperti sebelumnya.

---

## Fase 2 — `category.service.ts` Split
**Branch:** `refactor/category-service-split`
**Risiko:** Sedang (backend, dipakai di banyak tempat — tapi murni pindah method antar file)
**File:** `apps/api/src/modules/category/category.service.ts` (1.392 baris → 4 file @ ~350 baris)

### Masalah
1 class `CategoryService`, 24 method, 4 concern bercampur:
| Concern | Method |
|---|---|
| CRUD dasar | `createCategory`, `updateCategory`, `deleteCategory`, `getSiteCategories`, `getAllCategories`, `getCategoryTree` |
| Sync global↔local | `seedGlobalCategories`, `promoteSiteCategoriesToGlobal`, `ensureGlobalCategory`, `seedGlobalFromTemplate`, `syncGlobalToLocal`, `syncGlobalToAllSites`, `syncFromTemplate`, `diffGlobalCategories`, `upsertGlobalCategory` |
| Migrasi | `migrateGlobalToLocal`, `remapArticleCategories`, `migrateSite`, `migrateAllSites`, `resetToDefault` |
| Utility | `sortTopological` |

### Rencana
1. `category-crud.service.ts` — `CategoryCrudService` class, method CRUD dasar.
2. `category-sync.service.ts` — `CategorySyncService`, semua method sync global↔local. Depends on `CategoryCrudService` (composition, di-inject via constructor).
3. `category-migration.service.ts` — `CategoryMigrationService`, semua method migrasi. Depends on kedua service di atas.
4. `category-tree.util.ts` — `sortTopological` jadi pure function, tidak perlu jadi method class.
5. `category.service.ts` jadi facade tipis:
   ```ts
   class CategoryService {
     private crud = new CategoryCrudService()
     private sync = new CategorySyncService(this.crud)
     private migration = new CategoryMigrationService(this.crud, this.sync)
     // delegate semua method lama ke instance di atas, signature identik
   }
   export const categoryService = new CategoryService()
   ```
   Ini penting: `category.controller.ts` dan file lain yang import `categoryService` **tidak perlu diubah sama sekali**.

### File hasil
```
apps/api/src/modules/category/
  category.service.ts          (facade, ~100 baris)
  category-crud.service.ts     (~350 baris)
  category-sync.service.ts     (~450 baris)
  category-migration.service.ts (~350 baris)
  category-tree.util.ts        (~40 baris)
```

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/api`
- Jalankan test suite kategori kalau ada (`pnpm test category`), kalau belum ada test, tambahkan minimal smoke test untuk `getCategoryTree` dan `syncGlobalToAllSites` sebelum refactor (sebagai regression guard).
- Manual: buat/edit/hapus kategori di 1 site, jalankan sync global→local sekali, cek tidak ada error di log.

---

## Fase 3 — `site.service.ts` Split
**Branch:** `refactor/site-service-split`
**Risiko:** Sedang-tinggi (dipakai di auth/permission flow)
**File:** `apps/api/src/modules/site/site.service.ts` (1.056 baris → 3 file)

### Masalah
1. CRUD site dasar (`getAllSites`, `getSiteById`, `createSite`, `updateSite`, `deleteSite`, `getSiteSettings`, `updateSiteSettings`, `copyGlobalToLocal`)
2. **4 pasang method role-settings yang identik strukturnya**, cuma beda nama role & field:
   - `get/updateWapimredSettings`
   - `get/updateKaperwilSettings`
   - `get/updateKorwilSettings`
   - `get/updateKabiroSettings`
3. Homepage config (`getHomepageConfig`, `updateHomepageConfig`, `HOMEPAGE_DEFAULTS`)
4. `logAudit` (private helper, dipakai semua di atas)

### Rencana
1. `site-crud.service.ts` — CRUD dasar site.
2. `site-role-settings.service.ts` — **satu generic method** menggantikan 8 method:
   ```ts
   type SiteRole = 'wapimred' | 'kaperwil' | 'korwil' | 'kabiro'
   async getRoleSettings(siteId: string, role: SiteRole) { ... }
   async updateRoleSettings(siteId: string, role: SiteRole, data: Record<string, boolean>, actorUserId: string) { ... }
   ```
   Perlu cek dulu apakah field per role benar-benar seragam (kemungkinan besar iya berdasarkan nama fungsi) — kalau ada 1-2 field yang beda, taruh mapping kecil per role di sebuah `ROLE_FIELD_MAP` config, bukan taruh logic beda di fungsi terpisah.
   Controller lama (`site.controller.ts`) yang manggil `getWapimredSettings(siteId)` cukup diganti jadi `getRoleSettings(siteId, 'wapimred')` — ini **satu-satunya tempat** di seluruh rencana ini yang mengharuskan ubah caller, jadi PR ini scope-nya sedikit lebih luas dari fase lain.
3. `homepage-config.service.ts` — homepage config.
4. `audit-log.util.ts` — `logAudit` jadi shared utility (dipakai lintas modul, bukan cuma site).
5. `site.service.ts` jadi facade seperti Fase 2.

### File hasil
```
apps/api/src/modules/site/
  site.service.ts               (facade, ~80 baris)
  site-crud.service.ts          (~400 baris)
  site-role-settings.service.ts (~150 baris, turun drastis dari ~470 baris asli)
  homepage-config.service.ts    (~150 baris)
apps/api/src/lib/
  audit-log.util.ts             (shared, dipindah keluar dari modules/site)
```

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/api`
- Manual: login sebagai tiap role (wapimred/kaperwil/korwil/kabiro kalau ada akun test), buka & ubah settings masing-masing, pastikan tersimpan benar dan tidak tertukar antar role.
- Cek `site.controller.ts` — pastikan semua caller ke 8 method lama sudah diupdate ke `getRoleSettings`/`updateRoleSettings`.

---

## Fase 4 — `ad.controller.ts` Split
**Branch:** `refactor/ad-controller-split`
**Risiko:** Tinggi (ada payment webhook — perlu extra hati-hati, tes di staging dulu kalau ada)
**File:** `apps/api/src/modules/ad/ad.controller.ts` (1.010 baris, 31 route → 4 file)

### Masalah
31 route handler campur 4 domain berbeda dalam 1 file:

| Domain | Routes |
|---|---|
| **Booking & Slot** | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `PATCH /reorder`, `GET /availability`, `GET /packages`, `GET /bundles`, `POST /packages`, `PATCH /packages/:id`, `DELETE /packages/:id`, `POST /bookings`, `GET /bookings/my`, `GET /bookings/:id/stats`, `GET /bookings/all`, `POST /bookings/:id/approve`, `POST /bookings/:id/reject` |
| **Tracking** | `POST /track/:id`, `GET /public`, `GET /fallback` |
| **Payment (Midtrans)** | `GET /payment-config`, `PUT /payment-config`, `POST /bookings/:id/pay`, `POST /bookings/:id/cancel`, `POST /bookings/:id/pay-gateway`, `POST /webhook/midtrans` |
| **Video generation** | Get providers, Save provider key, Delete provider key, Generate video, Publish video to slot |

### Rencana
1. `ad-tracking.controller.ts` — 3 route publik, paling sederhana & paling sering di-hit (traffic tinggi), pisah duluan biar gampang di-cache/optimize terpisah nanti.
2. `ad-booking.controller.ts` — booking, slot, package, bundle, approval flow.
3. `ad-payment.controller.ts` — **isolasi semua yang menyentuh Midtrans** (config, webhook, pay, cancel, pay-gateway) jadi satu file khusus. Ini yang paling penting dari sisi keamanan: reviewer bisa fokus audit 1 file kecil untuk semua yang berhubungan dengan uang, tanpa harus baca 1.000 baris campuran.
4. `ad-video.controller.ts` — provider management + generate/publish video.
5. `ad.router.ts` (baru) — cuma nge-mount ke-4 router di atas ke path yang sama seperti sebelumnya (`/track`, `/`, `/payment-config`, dst), supaya dari sisi Express routing tidak ada yang berubah.
6. `ad.controller.ts` lama dihapus, referensinya di `app.ts`/route index diganti ke `ad.router.ts`.

### File hasil
```
apps/api/src/modules/ad/
  ad.router.ts              (mount 4 sub-router, ~30 baris)
  ad-tracking.controller.ts (~150 baris)
  ad-booking.controller.ts  (~450 baris)
  ad-payment.controller.ts  (~300 baris)  ← isolasi Midtrans
  ad-video.controller.ts    (~200 baris)
```

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/api`
- **Wajib manual test end-to-end payment flow di staging** sebelum merge ke `main`: buat booking → bayar via Midtrans sandbox → cek webhook diterima & status booking terupdate.
- Cek tracking endpoint (`/track/:id`) masih return response yang identik (byte-compare response body kalau perlu).
- Ini fase paling berisiko — pertimbangkan merge di luar jam sibuk traffic iklan.

---

## Fase 5 — `settings/page.tsx` Split
**Branch:** `refactor/settings-page-tabs`
**Risiko:** Rendah (frontend, UI-only)
**File:** `apps/web/app/[site]/dashboard/(admin)/settings/page.tsx` (1.213 baris → 6 file)

### Masalah
5 tab (`basic`, `contact`, `google`, `info`, `trending`) di-render inline semua dalam 1 file lewat conditional rendering (`{activeTab === 'basic' && (...)}` dst, masing-masing blok ratusan baris JSX).

### Rencana
1. Buat `apps/web/app/[site]/dashboard/(admin)/settings/components/`:
   - `SettingsBasicTab.tsx` — identitas & visual
   - `SettingsContactTab.tsx` — kontak & sosial
   - `SettingsGoogleTab.tsx` — Google Search API, GA4/GSC (yang selama ini kita pakai bolak-balik!)
   - `SettingsLegalTab.tsx` — halaman legal (pakai `activeLegalSubTab` state sendiri, sub-state ini ikut pindah ke sini)
   - `SettingsTrendingTab.tsx` — topik hangat
2. Tiap komponen terima props: `data`, `onChange`, `isSuperadmin` (kalau perlu) — state utama (`formData`, dsb) tetap dipegang di `page.tsx` supaya save/submit logic tidak perlu dipecah (menghindari prop-drilling berlebihan atau butuh context, cukup lifted state sederhana).
3. `page.tsx` jadi orchestrator: state, fetch/save handler, render tab switcher + `<SettingsBasicTab {...props} />` dst.

### File hasil
```
apps/web/app/[site]/dashboard/(admin)/settings/
  page.tsx                          (orchestrator, ~250 baris, turun dari 1.213)
  components/
    SettingsBasicTab.tsx            (~260 baris)
    SettingsContactTab.tsx          (~120 baris)
    SettingsGoogleTab.tsx           (~180 baris)
    SettingsLegalTab.tsx            (~140 baris)
    SettingsTrendingTab.tsx         (~80 baris)
```

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/web`
- Manual: buka tiap tab, ubah 1 field per tab, save, refresh, pastikan tersimpan. Khusus tab Google — pastikan field GA4 Property ID/Measurement ID/GSC URL masih berfungsi seperti biasa (mengingat riwayat panjang debugging GA4 kita).

---

## Fase 6 — `templates/layouts/*.tsx` — Ekstrak Blok Duplikat
**Branch:** `refactor/template-layouts-dedupe`
**Risiko:** Rendah (frontend, murni UI, tidak ada state/logic bisnis)
**File:** 6 file di `apps/web/components/templates/layouts/` (628 baris total)

### Masalah (dikonfirmasi via hash MD5 per blok)
Setiap layout (`ClassicEditorialLayout`, `CompactDenseLayout`, `DataDrivenLayout`, `HybridLayout`, `MagazineBoldLayout`, `VisualStorytellingLayout`) punya struktur:
```
Zona 1 — Hero        ← BEDA per template (ini yang bikin template unik)
Zona 2 — Fokus Redaksi ← BEDA per template
Zona 3 — Trending     ← BEDA per template
Zona 4 — <FeedSection ...25 props... />   ← SAMA PERSIS di 6/6 file
Zona 5 — <EditorialExtras ...11 props... /> ← SAMA PERSIS di 6/6 file (5/6 identik + Hybrid nambah 1 prop)
```
Plus blok destructuring ~30 props dari `TemplateProps` di awal komponen juga identik di 4/6 file.

### Rencana
1. Buat `apps/web/components/templates/shared/StandardFeedAndExtras.tsx` — komponen yang membungkus `<FeedSection>` + `<EditorialExtras>` sekaligus, terima `TemplateProps` langsung (spread), plus 2 prop opsional untuk mengakomodasi 2 outlier:
   ```tsx
   interface StandardFeedAndExtrasProps extends TemplateProps {
     isNestedInGrid?: boolean   // dipakai CompactDenseLayout
     includePopularInExtras?: boolean  // dipakai HybridLayout
   }
   export function StandardFeedAndExtras(props: StandardFeedAndExtrasProps) { ... }
   ```
2. Tiap layout file tinggal manggil `<StandardFeedAndExtras {...props} />` menggantikan ~40 baris `<FeedSection>` + `<EditorialExtras>` yang di-copy-paste.
3. Zona 1-3 (bagian yang memang beda-beda, inti "kepribadian" tiap template) **tidak disentuh** — itu memang seharusnya beda per file, bukan duplikasi yang perlu dihapus.

### File hasil
```
apps/web/components/templates/
  shared/
    StandardFeedAndExtras.tsx   (~60 baris, baru)
  layouts/
    ClassicEditorialLayout.tsx      (~55 baris, turun dari 96)
    CompactDenseLayout.tsx          (~75 baris, turun dari 116)
    DataDrivenLayout.tsx            (~65 baris, turun dari 103)
    HybridLayout.tsx                (~75 baris, turun dari 116)
    MagazineBoldLayout.tsx          (~55 baris, turun dari 96)
    VisualStorytellingLayout.tsx    (~60 baris, turun dari 101)
```
Total turun dari 628 → sekitar 385 baris (termasuk file baru), dan yang lebih penting: kalau nanti field baru ditambahkan ke `FeedSection`/`EditorialExtras`, cukup ubah **1 file**, bukan 6.

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/web`
- Manual: buka homepage tiap site yang pakai template berbeda (Classic, Magazine Bold, Compact Dense, Hybrid, minimal 4 dari 6), bandingkan visual sebelum/sesudah — harus identik pixel-per-pixel di Zona 4 & 5.

---

## Fase 7 — Dashboard Chart Components — Ekstrak Shell Bersama
**Branch:** `refactor/dashboard-chart-shell`
**Risiko:** Rendah (frontend, UI widget saja)
**File:** `GA4TrafficChart.tsx`, `GSCPerformanceChart.tsx`, `TrafficChart.tsx` (391 baris total)

### Masalah
Ketiga file punya kerangka identik:
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted || !data || data.length === 0) {
  return <div className="...">{/* pesan "data tidak tersedia" */}</div>
}
return (
  <ResponsiveContainer>
    <AreaChart data={data}>
      <defs><linearGradient>...</linearGradient></defs>
      <CartesianGrid ... />
      ...
    </AreaChart>
  </ResponsiveContainer>
)
```
Cuma beda di: bentuk data (`sessions/pageviews` vs `impressions/clicks` vs `views`), warna gradient, dan pesan teks empty-state.

### Rencana
1. Buat hook kecil `apps/web/hooks/useMountedGuard.ts` — 1 baris logic (`mounted` + `useEffect`), dipakai 3 chart ini (dan berpotensi dipakai widget lain yang punya masalah hydration-mismatch serupa).
2. Buat `apps/web/components/dashboard/shared/EmptyChartState.tsx` — komponen kecil terima `message` prop, styling sudah konsisten dengan yang ada.
3. Buat `apps/web/components/dashboard/shared/ChartAreaShell.tsx` (opsional, kalau mau lebih jauh) — wrapper `ResponsiveContainer` + `CartesianGrid` + `Tooltip` dengan style default, terima `children` untuk `<Area>`/`<Line>` spesifik tiap chart (karena bentuk area/line-nya beda-beda per chart, jangan dipaksa generic sampai situ — cukup shell luar saja).
4. Tiap 3 file chart tinggal pakai `useMountedGuard()` + `<EmptyChartState message="..." />`, sisanya (definisi `<Area>`, warna, format tooltip) tetap spesifik per file karena memang berbeda secara data.

### File hasil
```
apps/web/hooks/
  useMountedGuard.ts              (~8 baris, baru)
apps/web/components/dashboard/shared/
  EmptyChartState.tsx             (~15 baris, baru)
  ChartAreaShell.tsx               (~30 baris, baru, opsional)
apps/web/components/dashboard/
  GA4TrafficChart.tsx             (turun ~15 baris)
  GSCPerformanceChart.tsx         (turun ~15 baris)
  TrafficChart.tsx                (turun ~15 baris)
```
Catatan: dampak pengurangan baris di fase ini kecil (sengaja — cuma bagian yang benar-benar identik yang diekstrak, bagian chart-spesifik dibiarkan apa adanya). Nilai utamanya bukan pengurangan baris, tapi **konsistensi UX** (kalau mau ubah pesan/style empty-state, cukup 1 tempat) dan **hilangkan copy-paste bug risk** (pola `mounted` guard ini gampang salah ketik/beda kalau ditulis manual 3x).

### Testing sebelum PR
- `pnpm typecheck --filter=@beritakarya/web`
- Manual: buka dashboard admin → tab Analytics, pastikan 3 chart tetap render sama & empty-state tetap muncul benar saat data kosong.

---

## Ringkasan Urutan & Estimasi

| Fase | Branch | Risiko | Scope perubahan caller |
|---|---|---|---|
| 1 | `refactor/use-ai-factory` | Rendah | Tidak ada |
| 6 | `refactor/template-layouts-dedupe` | Rendah | Tidak ada |
| 7 | `refactor/dashboard-chart-shell` | Rendah | Tidak ada |
| 2 | `refactor/category-service-split` | Sedang | Tidak ada (facade) |
| 3 | `refactor/site-service-split` | Sedang-tinggi | 1 file (`site.controller.ts`) |
| 4 | `refactor/ad-controller-split` | Tinggi | 1 file (route mounting) |
| 5 | `refactor/settings-page-tabs` | Rendah | Tidak ada |

**Catatan urutan:** Fase 6 & 7 (baru ditemukan dari audit `apps/web/components`) saya taruh lebih awal — sama-sama risiko rendah seperti Fase 1, cepat dikerjakan, dan memberi "kemenangan cepat" sebelum masuk ke fase backend yang lebih berisiko.

**Rekomendasi urutan final:** 1 → 6 → 7 → 2 → 3 → 4 → 5. Tiap fase merge dulu ke `main` sebelum mulai fase berikutnya.

---

## PR Checklist Template (dipakai di tiap fase)

```markdown
## Perubahan
- [ ] Pindah kode, tidak ada perubahan logic/behavior
- [ ] Public export/API lama tetap tersedia (backward compatible)
- [ ] `pnpm typecheck` pass tanpa error baru

## Testing manual
- [ ] (isi sesuai checklist "Testing sebelum PR" di masing-masing fase)

## Rollback plan
- Revert PR ini aman dilakukan kapan saja karena tidak ada migration/schema change yang menyertai.
```
