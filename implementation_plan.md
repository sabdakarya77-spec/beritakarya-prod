# Implementation Plan — Modularisasi `beritakarya-prod` (Fase 1–7)

Refactor murni: memecah god files menjadi modul-modul kecil yang fokus satu tanggung jawab,
**tanpa mengubah behavior atau API contract yang sudah ada.** Setiap fase = 1 branch = 1 PR.

**Prinsip yang dijaga di semua fase:**
- Tidak ada perubahan logic/behavior. Kode dipindah, bukan ditulis ulang.
- Public API / route / export lama tetap tersedia (re-export atau facade) sehingga tidak ada breaking change di file consumer.
- Setiap fase diakhiri dengan `pnpm type-check` pass sebelum PR dibuka.
- Urutan dari risiko paling rendah → paling tinggi.

---

## Ringkasan Fase & Status

| Fase | File Target | Branch | Risiko | Status |
|---|---|---|---|---|
| 1 | `useAI.ts` (647 baris) | `refactor/use-ai-factory` | Rendah | **SELESAI [x]** |
| 6 | `templates/layouts/*.tsx` (~630 baris) | `refactor/template-layouts-dedupe` | Rendah | **Mulai [ ]** |
| 7 | `GA4TrafficChart.tsx`, dst. (~390 baris) | `refactor/dashboard-chart-shell` | Rendah | **Belum Mulai [ ]** |
| 2 | `category.service.ts` (1.393 baris) | `refactor/category-service-split` | Sedang | **Belum Mulai [ ]** |
| 3 | `site.service.ts` (1.057 baris) | `refactor/site-service-split` | Sedang-Tinggi | **Belum Mulai [ ]** |
| 4 | `ad.controller.ts` (1.011 baris) | `refactor/ad-controller-split` | Tinggi | **Belum Mulai [ ]** |
| 5 | `settings/page.tsx` (1.214 baris) | `refactor/settings-page-tabs` | Rendah | **Belum Mulai [ ]** |

---

## [SELESAI] Fase 1 — `useAI.ts` Factory Pattern
*Fase 1 telah selesai diimplementasikan, diverifikasi dengan typecheck & build, dan berjalan sukses.*

---

## Fase 6 — `templates/layouts/*.tsx` — Ekstrak Blok Duplikat

**Branch:** `refactor/template-layouts-dedupe`
**Risiko:** Rendah (frontend, murni UI)
**File sumber:** 6 file di `apps/web/components/templates/layouts/` (Classic, CompactDense, DataDriven, Hybrid, MagazineBold, VisualStorytelling)

### Masalah

5 dari 6 file layout utama menggunakan kombinasi `<FeedSection>` dan `<EditorialExtras>` secara berurutan dengan menyalurkan ~35+ props (prop-drilling duplikat).

> [!WARNING]
> **Analisis Arsitektur Kritis (Layout Bug Warning):**
> Pada berkas [CompactDenseLayout.tsx](file:///d:/beritakarya-v.0.1/apps/web/components/templates/layouts/CompactDenseLayout.tsx#L56-L113), komponen `<FeedSection>` diletakkan di **dalam** grid 8-kolom (`md:col-span-8`), sementara `<EditorialExtras>` diletakkan di **luar** grid (full-width) setelah penutupan grid div.
> 
> Jika kita memaksakan pembungkus tunggal `<StandardFeedAndExtras>` untuk menampung kedua komponen tersebut di semua berkas:
> 1. Pada `CompactDenseLayout`, `<EditorialExtras>` akan ikut masuk ke dalam grid `md:col-span-8`, sehingga merusak tampilan desktop (lebar kolom menyempit).
> 2. `HybridLayout` tidak menggunakan `<FeedSection>` melainkan `<FeedWithSidebar>` + `<ContinuedFeed>` secara bertahap.
> 
> **Rekomendasi Solusi:**
> Kita akan membuat `<StandardFeedAndExtras>` tetapi **hanya menerapkannya pada 4 layout yang polanya identik & berdampingan di root** (`ClassicEditorialLayout`, `DataDrivenLayout`, `MagazineBoldLayout`, `VisualStorytellingLayout`).
> Untuk `CompactDenseLayout`, kita tetap mengimpor `<FeedSection>` dan `<EditorialExtras>` secara terpisah untuk menjaga keutuhan struktur grid desktop-nya.

### Rencana Implementasi

1. **Buat `apps/web/components/templates/shared/StandardFeedAndExtras.tsx`**:
   Komponen pembungkus untuk layouts yang seragam.
   ```tsx
   import { FeedSection } from '../../pages/home/FeedSection'
   import { EditorialExtras } from '../../pages/home/EditorialExtras'
   import type { TemplateProps } from '../types'

   export function StandardFeedAndExtras(props: TemplateProps) {
     return (
       <>
         <FeedSection
           feedArticles={props.feedArticles}
           trending={props.trending}
           popular={props.popular}
           site={props.site}
           searchQuery={props.searchQuery}
           isCategoryFilter={props.isCategoryFilter}
           categoryFilter={props.categoryFilter}
           categoriesTree={props.categoriesTree}
           showSavedFeed={props.showSavedFeed}
           whatsappUrl={props.whatsappUrl}
           telegramUrl={props.telegramUrl}
           reportUrl={props.reportUrl}
           siteName={props.siteName}
           marketData={props.marketData}
           photoJournal={props.photoJournal}
           showPhotoSection={props.showPhotoSection}
           videoStories={props.videoStories}
           showVideoSection={props.showVideoSection}
           siteSettings={props.siteSettings as any}
           siteConfigId={props.siteConfigId}
           resolveCategoryName={props.resolveCategoryName}
           remainingArticles={props.remainingArticles}
           excludeIds={props.excludeIds}
         />
         <EditorialExtras
           technologyArticles={props.technologyArticles}
           opinionArticles={props.opinionArticles}
           photoJournal={props.photoJournal}
           videoStories={props.videoStories}
           site={props.site}
           showTechnologySection={props.showTechnologySection}
           showOpinionSection={props.showOpinionSection}
           showPhotoSection={props.showPhotoSection}
           showVideoSection={props.showVideoSection}
           getVideoThumbnail={props.getVideoThumbnail}
         />
       </>
     )
   }
   ```

2. **Update Layout Files**:
   Ubah `ClassicEditorialLayout`, `DataDrivenLayout`, `MagazineBoldLayout`, dan `VisualStorytellingLayout` untuk mengimpor dan me-render `<StandardFeedAndExtras {...props} />` guna memotong duplikasi ~40 baris per file.

### File Hasil
```
apps/web/components/templates/
  shared/
    StandardFeedAndExtras.tsx         (~50 baris, baru) ← NEW
  layouts/
    ClassicEditorialLayout.tsx        (~55 baris, turun dari 97) ← MODIFY
    DataDrivenLayout.tsx              (~65 baris, turun dari 104) ← MODIFY
    MagazineBoldLayout.tsx            (~55 baris, turun dari 97) ← MODIFY
    VisualStorytellingLayout.tsx      (~60 baris, turun dari 102) ← MODIFY
```

---

## Fase 7 — Dashboard Chart Components — Ekstrak Shell Bersama

**Branch:** `refactor/dashboard-chart-shell`
**Risiko:** Rendah (frontend, UI widget)
**File sumber:** `GA4TrafficChart.tsx`, `GSCPerformanceChart.tsx`, `TrafficChart.tsx` di `apps/web/components/dashboard/`

### Masalah

Ketiga berkas grafik memiliki boilerplate check hydration (`mounted` state) dan UI empty state yang sangat mirip.

### Rencana Implementasi

1. **Buat `apps/web/hooks/useMounted.ts`**:
   Hook utilitas sederhana untuk mendeteksi apakah komponen sudah ter-mount di client demi menghindari Next.js hydration mismatch.
   ```ts
   import { useState, useEffect } from 'react'

   export function useMounted() {
     const [mounted, setMounted] = useState(false)
     useEffect(() => {
       setMounted(true)
     }, [])
     return mounted
   }
   ```

2. **Buat `apps/web/components/dashboard/shared/EmptyChartState.tsx`**:
   Komponen UI reusable untuk menampilkan pesan data kosong/tidak tersedia dengan desain seragam.
   ```tsx
   interface EmptyChartStateProps {
     message?: string
     heightClass?: string
   }

   export function EmptyChartState({ message = 'Data tidak tersedia', heightClass = 'h-[300px]' }: EmptyChartStateProps) {
     return (
       <div className={`flex ${heightClass} items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10`}>
         <p className="text-sm text-brand-text-muted">{message}</p>
       </div>
     )
   }
   ```

3. **Update Chart Components**:
   Terapkan `useMounted` dan `<EmptyChartState message="..." />` pada `GA4TrafficChart.tsx`, `GSCPerformanceChart.tsx`, dan `TrafficChart.tsx` untuk menyederhanakan logika awal file-file tersebut.

### File Hasil
```
apps/web/hooks/
  useMounted.ts                       (~10 baris) ← NEW
apps/web/components/dashboard/
  shared/
    EmptyChartState.tsx               (~15 baris) ← NEW
  GA4TrafficChart.tsx                 (turun ~15 baris) ← MODIFY
  TrafficChart.tsx                    (turun ~15 baris) ← MODIFY
  // GSCPerformanceChart.tsx          (turun ~15 baris) ← MODIFY
```

---

## Fase 2 — `category.service.ts` Split
*(Tidak ada perubahan dari rencana sebelumnya. Tetap menggunakan facade pattern untuk `CategoryService` demi stabilitas modul backend API).*

---

## Fase 3 — `site.service.ts` Split
*(Sesuai rekomendasi keselamatan: facade `SiteService` akan mempertahankan wrapper method lama seperti `getWapimredSettings` dan meneruskannya ke generic handler di `SiteRoleSettingsService` sehingga berkas caller `site.controller.ts` tetap 100% utuh tanpa perubahan).*

---

## Fase 4 — `ad.controller.ts` Split
*(Tidak ada perubahan. Mengisolasi 31 rute iklan menjadi 4 berkas controller berbasis concern, dan disatukan kembali dalam `ad.router.ts` baru).*

---

## Fase 5 — `settings/page.tsx` Split
*(Tidak ada perubahan. Memecah halaman pengaturan visual/kontak/legal/trending dari 1.200 baris menjadi page orchestrator tipis + 5 komponen tab di subfolder `components/`).*

---

## PR Checklist Template (dipakai di tiap fase)

```markdown
## Perubahan
- [ ] Pindah kode, tidak ada perubahan logic/behavior
- [ ] Public export/API lama tetap tersedia (backward compatible)
- [ ] `pnpm type-check` pass tanpa error baru

## Testing manual
- [ ] (isi sesuai checklist "Testing sebelum PR" di masing-masing fase)

## Rollback plan
- Revert PR ini aman dilakukan kapan saja karena tidak ada migration/schema change yang menyertai.
```
