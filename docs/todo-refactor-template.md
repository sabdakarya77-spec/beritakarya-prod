# TODO: Refactor Template System

## Masalah

Template homepage (A-F) saat ini bermasalah:

1. **Nama menyesatkan** — `TemplateF.tsx` isinya sudah beda jauh dari Design F asli di `design-grid.md`
2. **Folder salah** — di `pages/home/templates/`, seharusnya di `components/templates/` supaya jelas ini komponen reusable, bukan bagian homepage
3. **Hanya F yang siap produksi** — logic terbaru (scoring, dedup, trending weekly, popular monthly) baru diterapkan di Template F
4. **Duplikasi kode** — semua template punya struktur mirip (hero → ad → fokus → trending → feed → editorial), yang beda hanya komponen yang dipanggil

## Tujuan

- [x] Pindahkan template dari `pages/home/templates/` ke `components/templates/`
- [x] Rename template berdasarkan fungsi, bukan huruf desain
- [x] Terapkan logic terbaru ke semua template yang aktif
- [x] Bersihkan duplikasi kode antar template
- [x] Bersihkan HomepageConfigDialog — hapus dead config
- [x] Implementasi configurable scoring weights via dashboard

## Struktur Aktual

```
components/templates/
├── index.ts                          ← Barrel export
├── types.ts                          ← Shared types (TemplateProps)
├── layouts/
│   ├── HybridLayout.tsx              ← ⭐ Default (ex-TemplateF)
│   ├── ClassicEditorialLayout.tsx    ← ex-TemplateA
│   ├── MagazineBoldLayout.tsx        ← ex-TemplateB
│   ├── DataDrivenLayout.tsx          ← ex-TemplateC
│   ├── CompactDenseLayout.tsx        ← ex-TemplateD
│   └── VisualStorytellingLayout.tsx  ← ex-TemplateE
└── zones/
    ├── index.ts
    ├── AdZone.tsx                    ← Shared ad wrapper
    ├── SectionSeparator.tsx          ← Shared separator
    └── LoadMoreZone.tsx              ← Shared load more wrapper
```

## Langkah Refactor

### Phase 1: Pindah Folder ✅

- [x] Buat folder `components/templates/layouts/`
- [x] Pindahkan `TemplateF.tsx` → `HybridLayout.tsx`
- [x] Pindahkan `TemplateA.tsx` → `ClassicEditorialLayout.tsx`
- [x] Pindahkan `TemplateB.tsx` → `MagazineBoldLayout.tsx`
- [x] Pindahkan `TemplateC.tsx` → `DataDrivenLayout.tsx`
- [x] Pindahkan `TemplateD.tsx` → `CompactDenseLayout.tsx`
- [x] Pindahkan `TemplateE.tsx` → `VisualStorytellingLayout.tsx`
- [x] Update semua import di `SiteHomePage.tsx`
- [x] Hapus folder `pages/home/templates/`
- [x] Type-check + lint

### Phase 2: Terapkan Logic Terbaru ke Semua Layout ✅

Logic terbaru ada di shared layer (`distribution.ts`, `SiteHomePage.tsx`) — otomatis diterapkan ke semua template:

- [x] Scoring zona 2 (`scoreAndSort` dari `distribution.ts`)
- [x] Dedup Row 1 → Row 2 (`feedLeftover + remainingArticles`) — HybridLayout specific
- [x] Trending weekly (168 jam) — di `SiteHomePage.tsx`
- [x] Popular monthly (720 jam) — di `SiteHomePage.tsx`
- [x] `feed` (bukan `feedFeatured + feedStream`) — di `distribution.ts`
- [x] `photoJournal` + `showPhotoSection` di EditorialExtras — semua layout

### Phase 3: Extract Shared Zones ✅

Komponen shared sudah diextract ke `components/templates/zones/`:

- [x] Extract `AdZone` — wrapper untuk HOME_TOP, HOME_FEED_1, HOME_FEED_2
- [x] Extract `SectionSeparator` — `border-t border-gray-100`
- [x] Extract `LoadMoreZone` — LoadMoreArticles wrapper
- [x] Pindahkan zona wrapper ke `components/templates/zones/`

### Phase 4: Cleanup ✅

- [x] Update `design-grid.md` — tandai template mana yang aktif
- [x] Update `logic.md` — tambah referensi struktur folder baru
- [x] Bersihkan `HomepageConfigDialog.tsx` — hapus dead config
- [x] Implementasi configurable scoring weights via dashboard

## Mapping Nama

| Nama Lama | Nama Baru | Status |
|-----------|-----------|--------|
| `TemplateA.tsx` | `ClassicEditorialLayout.tsx` | ✅ Aktif |
| `TemplateB.tsx` | `MagazineBoldLayout.tsx` | ✅ Aktif |
| `TemplateC.tsx` | `DataDrivenLayout.tsx` | ✅ Aktif |
| `TemplateD.tsx` | `CompactDenseLayout.tsx` | ✅ Aktif |
| `TemplateE.tsx` | `VisualStorytellingLayout.tsx` | ✅ Aktif |
| `TemplateF.tsx` | `HybridLayout.tsx` | ⭐ Default |

## Config Mapping

```typescript
const TEMPLATES = {
  A: ClassicEditorialLayout,
  B: MagazineBoldLayout,
  C: DataDrivenLayout,
  D: CompactDenseLayout,
  E: VisualStorytellingLayout,
  F: HybridLayout,  // default
}
```

Per-site config via `HomepageConfig.template` (A-F). Scoring weights configurable per site via dashboard.

## HomepageConfig — Field Aktif

| Field | Status | Keterangan |
|-------|--------|------------|
| `template` | ✅ Aktif | A-F, pilih layout |
| `heroMode` | ✅ Aktif | MAGAZINE_COVER_550, BENTO_4, dll |
| `feedLayout` | ✅ Aktif | sidebar_70_30, pattern_rotation, dll |
| `trendingStyle` | ✅ Aktif | numbered_podium, horizontal_strip, dll |
| `scoreFreshness` | ✅ Aktif | Bobot scoring freshness (default 0.4) |
| `scoreEngagement` | ✅ Aktif | Bobot scoring engagement (default 0.3) |
| `scoreEditorial` | ✅ Aktif | Bobot scoring editorial (default 0.3) |
| `opinionCategories` | ✅ Aktif | Slug kategori opini |
| `photoCategories` | ✅ Aktif | Slug kategori foto |
| `videoCategories` | ✅ Aktif | Slug kategori video |
| `sectionOrder` | ✅ Aktif | Urutan section |
| `sectionVisibility` | ✅ Aktif | Toggle section on/off |
| ~~`heroAutoRotate`~~ | ❌ Dihapus | Tidak dipakai |
| ~~`heroIntervalMs`~~ | ❌ Dihapus | Tidak dipakai |
| ~~`scoreRelevance`~~ | ❌ Dihapus | Tidak ada di formula |
| ~~`feedColumns`~~ | ❌ Dihapus | Tidak dipakai HybridLayout |
| ~~`showExcerpt`~~ | ❌ Dihapus | Tidak dipakai |
| ~~`interstitials`~~ | ❌ Dihapus | Tidak dipakai HybridLayout |
