# Homepage Logic — Model F

Dokumentasi logic distribusi artikel per zona di homepage.
Referensi implementasi: `apps/web/components/pages/home/utils/distribution.ts`

---

## Alur Data

```
100 artikel dari API
        │
        ▼
scoreAndDistribute()
        │
        ├── hero (5)           → ZONA 1 (terbaru)
        ├── fokusRedaksi (4)   → ZONA 2 (scoring)
        ├── feed (16)          → ZONA 4 Row 1 (tampilkan 5, sisanya ke Row 2)
        ├── editorChoice (3)   ─┐
        ├── opinion (3)        │
        ├── photoJournal (3)   ├→ ZONA 5 (Editorial Extras)
        ├── videoStories (3)   ─┘
        ├── trending (5)       → ZONA 3 (weekly, fetch terpisah)
        ├── popular (5)        → Sidebar PalingDibaca (monthly)
        └── remainingArticles  → ZONA 4 Row 2 (bersama sisa feed) + Load More
```

---

## ZONA 1 — HERO: MAGAZINE_COVER (560px)

**Jumlah:** 5 artikel
**Filter:** Tidak ada
**Urutan:** `publishedAt` descending (terbaru duluan)

```typescript
const sortedByNewest = sortByNewest(articles)
const hero = sortedByNewest.slice(0, 5)
```

Tidak pakai scoring — zona ini memang sengaja menampilkan 5 berita terbaru.

---

## ZONA 2 — FOKUS REDAKSI (4 kartu sejajar)

**Jumlah:** 4 artikel
**Filter:** `isFeatured === true` (hanya artikel featured yang masuk)
**Urutan:** Scoring di antara featured (supaya rotasi, tidak selalu sama)
**Fallback:** Jika featured < 2, pakai scoring semua sisa setelah hero

### Logic

```typescript
const featuredPool = remainingAfterHero.filter(a => a.isFeatured)

if (featuredPool.length >= 2):
  fokusRedaksi = scoreAndSort(featuredPool).slice(0, 4)
else:
  fokusRedaksi = scoreAndSort(remainingAfterHero).slice(0, 4)
```

### Scoring Formula

```
score = (freshness × 0.4) + (engagement × 0.3) + (editorial × 0.3)
```

| Komponen | Bobot | Formula | Range |
|----------|-------|---------|-------|
| **Freshness** | 40% | `max(0, 1 - (daysSincePublish / 7))` | 0–1 (hari ke-7 = 0) |
| **Engagement** | 30% | `viewCount / maxViewCount` (normalised) | 0–1 |
| **Editorial** | 30% | `isFeatured(0.5) + isExclusive(0.3) + isBreaking(0.2)` | 0–1 |

### Detail Komponen

**Freshness (40%)**
- 0 hari = 1.0 (paling baru)
- 3 hari = 0.57
- 7 hari = 0.0 (sudah expired dari pool)
- Lebih dari 7 hari = 0 (tidak masuk pool)

**Engagement (30%)**
- Normalisasi terhadap viewCount tertinggi di pool
- `viewCount / maxViewCountInPool`
- Artikel tanpa view = 0

**Editorial (30%)**
- `isFeatured` = true → +0.5
- `isExclusive` = true → +0.3
- `isBreaking` = true → +0.2
- Bisa dijumlahkan, max 1.0

### Kenapa Filter + Scoring?

- **Filter `isFeatured`** = Zona 2 tetap zona editorial, hanya artikel pilihan redaksi yang masuk
- **Scoring** = urutan featured berputar berdasarkan freshness + engagement, tidak selalu sama
- Tanpa scoring: featured A, B, C, D selalu urut itu-itu saja
- Dengan scoring: featured B yang baru publish + banyak views bisa naik ke posisi 1

---

## ZONA 3 — TRENDING: NUMBERED_PODIUM

**Jumlah:** 5 artikel
**Source:** Fetch terpisah dari API
**Timeframe:** **7 hari (weekly)**
**Filter:** Sort by `viewCount` descending

### API Call

```typescript
const params = {
  site: siteId,
  status: 'published',
  limit: '5',
  sort: 'views',
  order: 'desc',
  sinceHours: '168',  // 7 hari = 168 jam
}
```

### Fallback

Jika trending weekly kosong (site baru, sedikit artikel):
```
effectiveTrending = popularArticles (monthly)
```

### Kenapa Weekly?

- 72 jam (3 hari) terlalu sempit — site baru kadang hanya 1-2 artikel dalam 3 hari
- 7 hari lebih representatif untuk "apa yang sedang viral minggu ini"
- Beda timeframe dari popular (monthly) sehingga tidak redundan

---

## Sidebar: PALING DIBACA (Popular)

**Jumlah:** 5 artikel
**Source:** Fetch terpisah dari API (bisa sama dengan trending, tidak masalah)
**Timeframe:** **30 hari (monthly)**
**Filter:** Sort by `viewCount` descending

### API Call

```typescript
const params = {
  site: siteId,
  status: 'published',
  limit: '5',
  sort: 'views',
  order: 'desc',
  sinceHours: '720',  // 30 hari = 720 jam
}
```

### Kenapa Monthly?

- 7 hari terlalu pendek untuk "paling dibaca"
- 30 hari lebih meaningful sebagai indikator konten berkualitas
- User expect "Paling Dibaca" = akumulasi, bukan tren sesaat

### Catatan

Trending (weekly) dan Popular (monthly) **boleh overlap**. Ini wajar karena:
- Beda timeframe (7 hari vs 30 hari)
- Beda scoring (trending = momentum, popular = akumulasi)
- User tidak akan merasa aneh kalau artikel viral juga ada di "Paling Dibaca"

---

## ZONA 4 Row 1 — BERITA TERBARU (8:4 sidebar)

**Jumlah tampil:** 5 artikel
**Pool:** `feed` — 16 artikel sisa dari Zona 1 + Zona 2
**Urutan:** `publishedAt` descending

### Logic

```typescript
const feedPool = sortedRemaining.filter(a => !fokusIds.has(a.id))
const feed = feedPool.slice(0, 16)
```

### Dedup

Artikel di Row 1 **TIDAK ADA** yang sama dengan Zona 1 (hero) dan Zona 2 (fokusRedaksi). Sudah di-filter sebelum masuk pool.

---

## ZONA 4 Row 2 — CONTINUED FEED (4 sejajar, full info)

**Jumlah tampil:** max 8 artikel (4 kolom × 2 baris)
**Pool:** sisa `feed` (setelah Row 1) + `remainingArticles`
**Urutan:** `publishedAt` descending

### Logic

```typescript
// feed = 16 artikel, Row 1 tampilkan 5 pertama
// Sisa feed (11 artikel) + remainingArticles → Row 2
const feedLeftover = feedArticles.slice(5)  // 11 artikel setelah Row 1
const row2Articles = [...feedLeftover, ...remainingArticles].slice(0, 8)
```

### Dedup

Artikel di Row 2 **TIDAK ADA** yang sama dengan:
- Zona 1 (hero) — sudah di-filter saat distribusi
- Zona 2 (fokusRedaksi) — sudah di-filter saat distribusi
- Row 1 (feed 5 pertama) — `feed.slice(5)` mengambil setelah 5 pertama

Artikel yang sama dengan trending/popular **TIDAK masalah** karena zona itu fetch terpisah dan pakai scoring berbeda.

---

## ZONA 5 — EDITORIAL EXTRAS

**Jumlah per section:** 3 artikel
**Filter:** Pool terpisah, di-dedup dari zona sebelumnya

### Logic

```typescript
const takeUnused = (pool, limit) => {
  return dedupById(pool)
    .filter(a => !usedIds.has(a.id))
    .slice(0, limit)
}

const editorChoice = takeUnused(pools.editorChoicePool, 3)
const opinion = takeUnused(pools.opinionPool, 3)
const photoJournal = takeUnused(pools.photoPool, 3)
const videoStories = takeUnused(pools.videoPool, 3)
```

### Pool Source

| Section | Pool | Filter |
|---------|------|--------|
| Pilihan Editor | `editorChoicePool` | `isFeatured === true` |
| Opini & Analisis | `opinionPool` | slug: opini, kolom-esai, analisis, kolom |
| Foto Jurnalistik | `photoPool` | `contentType: photo_journalism` atau slug foto |
| Video Eksklusif | `videoPool` | `contentType: video_exclusive` atau slug video |

### Dedup

Artikel di Editorial Extras **TIDAK ADA** yang sama dengan Zona 1-4. Sudah di-filter via `usedIds`.

---

## LOAD MORE ARTICLES

**Data:** `remainingArticles` + `excludeIds`

```typescript
const excludeIds = [
  ...heroArticles,
  ...fokusRedaksi,
  ...feedFeatured,
  ...feedStream,
  ...editorChoice,
  ...opinionArticles,
  ...photoJournal,
  ...videoStories,
  ...effectiveTrending,
  ...row2Articles,
].map(a => a.id)
```

Load More fetch dari API dengan `excludeIds` → hindari duplikat.

---

## Ringkasan Dedup

| Zona | Boleh overlap dengan | Tidak boleh overlap dengan |
|------|---------------------|---------------------------|
| Zona 1 (Hero) | Trending, Popular | Zona 2, Row 1, Row 2, Editorial |
| Zona 2 (Fokus) | Trending, Popular | Zona 1, Row 1, Row 2, Editorial |
| Row 1 | Trending, Popular | Zona 1, Zona 2, Row 2, Editorial |
| Row 2 | Trending, Popular | Zona 1, Zona 2, Row 1, Editorial |
| Editorial | Trending, Popular | Zona 1, Zona 2, Row 1, Row 2 |
| Trending | **Semua** (boleh overlap) | — |
| Popular | **Semua** (boleh overlap) | — |

**Prinsip:** Zona konten (1-5) saling eksklusif. Trending & Popular bebas overlap karena beda timeframe dan scoring.

---

## File yang Relevan

### Core Engine

| File | Fungsi |
|------|--------|
| `pages/home/utils/distribution.ts` | Zone allocation engine — scoring + distribusi |
| `pages/home/SiteHomePage.tsx` | Orchestrator — fetch data + render template |

### Template System (`components/templates/`)

| File | Fungsi |
|------|--------|
| `templates/index.ts` | Barrel export semua layout |
| `templates/types.ts` | Shared types (TemplateProps) |
| `templates/layouts/HybridLayout.tsx` | ⭐ Default layout (8:4 sidebar + continued feed) |
| `templates/layouts/ClassicEditorialLayout.tsx` | Layout A — pattern rotation |
| `templates/layouts/MagazineBoldLayout.tsx` | Layout B — magazine cover |
| `templates/layouts/DataDrivenLayout.tsx` | Layout C — split hero + ticker |
| `templates/layouts/CompactDenseLayout.tsx` | Layout D — dense 3 kolom |
| `templates/layouts/VisualStorytellingLayout.tsx` | Layout E — dual hero |
| `templates/zones/AdZone.tsx` | Shared ad wrapper |
| `templates/zones/SectionSeparator.tsx` | Shared separator |
| `templates/zones/LoadMoreZone.tsx` | Shared load more wrapper |

### Homepage Components (`pages/home/`)

| File | Fungsi |
|------|--------|
| `MagazineCoverHero.tsx` | Zona 1 — Hero |
| `FokusRedaksiSection.tsx` | Zona 2 — 4 kartu sejajar |
| `TrendingSection.tsx` | Zona 3 — Numbered podium |
| `FeedWithSidebar.tsx` | Zona 4 Row 1 — 8:4 sidebar |
| `ContinuedFeed.tsx` | Zona 4 Row 2 — 4 kolom grid |
| `EditorialExtras.tsx` | Zona 5 — Editor · Opini · Foto · Video |
| `PalingDibacaSidebar.tsx` | Sidebar popular |
