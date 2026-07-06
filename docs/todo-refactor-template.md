# TODO: Refactor Template System

## Masalah

Template homepage (A-F) saat ini bermasalah:

1. **Nama menyesatkan** — `TemplateF.tsx` isinya sudah beda jauh dari Design F asli di `design-grid.md`
2. **Folder salah** — di `pages/home/templates/`, seharusnya di `components/templates/` supaya jelas ini komponen reusable, bukan bagian homepage
3. **Hanya F yang siap produksi** — logic terbaru (scoring, dedup, trending weekly, popular monthly) baru diterapkan di Template F
4. **Duplikasi kode** — semua template punya struktur mirip (hero → ad → fokus → trending → feed → editorial), yang beda hanya komponen yang dipanggil

## Tujuan

- [ ] Pindahkan template dari `pages/home/templates/` ke `components/templates/`
- [ ] Rename template berdasarkan fungsi, bukan huruf desain
- [ ] Terapkan logic terbaru ke semua template yang aktif
- [ ] Hapus atau arsipkan template yang tidak dipakai
- [ ] Bersihkan duplikasi kode antar template

## Struktur Target

```
components/templates/
├── Homepage.tsx                  ← Orchestrator utama (ganti SiteHomePage logic)
├── layouts/
│   ├── HybridLayout.tsx          ← Default (ex-TemplateF)
│   ├── ClassicEditorialLayout.tsx ← ex-TemplateA
│   ├── MagazineBoldLayout.tsx    ← ex-TemplateB
│   ├── DataDrivenLayout.tsx      ← ex-TemplateC
│   ├── CompactDenseLayout.tsx    ← ex-TemplateD
│   └── VisualStorytellingLayout.tsx ← ex-TemplateE
├── zones/
│   ├── HeroZone.tsx              ← Shared hero wrapper
│   ├── FokusRedaksiZone.tsx      ← Shared fokus wrapper
│   ├── TrendingZone.tsx          ← Shared trending wrapper
│   ├── FeedZone.tsx              ← Shared feed wrapper
│   └── EditorialZone.tsx         ← Shared editorial wrapper
└── types.ts                      ← Shared types
```

## Langkah Refactor

### Phase 1: Pindah Folder (low risk)

- [ ] Buat folder `components/templates/layouts/`
- [ ] Pindahkan `TemplateF.tsx` → `HybridLayout.tsx`
- [ ] Pindahkan `TemplateA.tsx` → `ClassicEditorialLayout.tsx`
- [ ] Pindahkan `TemplateB.tsx` → `MagazineBoldLayout.tsx`
- [ ] Pindahkan `TemplateC.tsx` → `DataDrivenLayout.tsx`
- [ ] Pindahkan `TemplateD.tsx` → `CompactDenseLayout.tsx`
- [ ] Pindahkan `TemplateE.tsx` → `VisualStorytellingLayout.tsx`
- [ ] Update semua import di `SiteHomePage.tsx`
- [ ] Hapus folder `pages/home/templates/`
- [ ] Type-check + lint

### Phase 2: Terapkan Logic Terbaru ke Semua Layout (medium risk)

Logic yang sudah ada di HybridLayout tapi belum di layout lain:

- [ ] Scoring zona 2 (`scoreAndSort` dari `distribution.ts`)
- [ ] Dedup Row 1 → Row 2 (`feedLeftover + remainingArticles`)
- [ ] Trending weekly (168 jam)
- [ ] Popular monthly (720 jam)
- [ ] `feed` (bukan `feedFeatured + feedStream`)
- [ ] `photoJournal` + `showPhotoSection` di EditorialExtras

### Phase 3: Extract Shared Zones (medium risk)

Komponen yang dipakai semua layout tapi dikopi manual:

- [ ] Extract `AdSection` — wrapper untuk HOME_TOP, HOME_FEED_1, HOME_FEED_2
- [ ] Extract `SectionSeparator` — `border-t border-gray-100`
- [ ] Extract `LoadMoreSection` — LoadMoreArticles wrapper
- [ ] Pindahkan zona wrapper ke `components/templates/zones/`

### Phase 4: Cleanup (low risk)

- [ ] Hapus template yang tidak dipakai (jika ada site yang hanya pakai F)
- [ ] Atau arsipkan ke `components/templates/_archived/`
- [ ] Update `design-grid.md` — tandai template mana yang aktif
- [ ] Update `logic.md` — tambah referensi struktur folder baru

## Mapping Nama

| Nama Lama | Nama Baru | Status |
|-----------|-----------|--------|
| `TemplateA.tsx` | `ClassicEditorialLayout.tsx` | Perlu update logic |
| `TemplateB.tsx` | `MagazineBoldLayout.tsx` | Perlu update logic |
| `TemplateC.tsx` | `DataDrivenLayout.tsx` | Perlu update logic |
| `TemplateD.tsx` | `CompactDenseLayout.tsx` | Perlu update logic |
| `TemplateE.tsx` | `VisualStorytellingLayout.tsx` | Perlu update logic |
| `TemplateF.tsx` | `HybridLayout.tsx` | ✅ Sudah siap produksi |

## Config Mapping (tetap sama)

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

Per-site config tetap via `HomepageConfig.template` (A-F). Tidak ada perubahan di API.

## Catatan

- Phase 1 bisa dilakukan tanpa mengubah behavior (pure move)
- Phase 2 perlu testing karena mengubah logic render
- Phase 3 bisa dilakukan sekaligus dengan Phase 1
- Phase 4 tergantung keputusan: hapus atau arsipkan template lain

## Estimasi

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1 | 1-2 jam | Low |
| Phase 2 | 3-4 jam | Medium |
| Phase 3 | 2-3 jam | Medium |
| Phase 4 | 1 jam | Low |
| **Total** | **7-10 jam** | |
