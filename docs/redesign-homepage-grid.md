# Redesign Homepage — Grid Section & Article Selection Logic

**Target:** `apps/web/components/pages/SiteHomePage.tsx`
**Date:** 2026-07-04
**Status:** Proposal

---

## 1. Audit Summary

### 1.1 Current Architecture

Homepage terdiri dari 6 zona utama dalam satu file `SiteHomePage.tsx` (920 baris):

```
┌─────────────────────────────────────────────┐
│  ZONA 1 — Hero (MagazineBentoHero)          │  4 artikel terbaru → slider 5 detik
├─────────────────────────────────────────────┤
│  Ad: HOME_TOP                               │
├─────────────────────────────────────────────┤
│  ZONA 2 — Fokus Redaksi                     │  4 artikel (isFeatured/isExclusive)
│  Grid: 2/3 besar + 1/3 stacked              │
├─────────────────────────────────────────────┤
│  ZONA 3 — Trending                          │  5 artikel by views (API terpisah)
├────────────────────────────┬────────────────┤
│  ZONA 4 — Feed (8 kol)     │  Sidebar (4kol)│
│  • 2 kartu horizontal      │  • Akses Redaksi│
│  • Ad: HOME_FEED_1         │  • Terbaru     │
│  • 6 kartu medium 2-kol    │  • Info Pasar  │
│  • Ad: HOME_FEED_2         │  • Foto/Video  │
│  • Load More               │                │
├────────────────────────────┴────────────────┤
│  ZONA 5+ — Editorial Extras (full-width)    │
│  • Pilihan Editor (portrait 3:4)            │
│  • Opini & Analisis                         │
│  • Video Eksklusif                          │
└─────────────────────────────────────────────┘
```

### 1.2 Data Flow Saat Ini

```
getArticles(siteId, category?, search?)
  → /api/v1/articles/public?site=X&limit=25
  → findArticlesBySite() — Prisma query, order by createdAt DESC
  → return 25 artikel terbaru

getTrendingArticles(siteId)
  → /api/v1/articles/public?site=X&limit=5&sort=views&order=desc
  → return 5 artikel terpopuler (views)

distributeArticles(articles[25], trendingIds)
  → hero[0..3], fokusRedaksi[4..7], feedFeatured[8..9],
    feedStream[10..15], editorChoice[], opinion[],
    photoJournal[], videoStories[], popular[]
```

### 1.3 Masalah yang Ditemukan

#### A. Logika Seleksi Artikel (Critical)

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | **Distribusi berdasarkan posisi array** — `distributeArticles()` menggunakan `.slice()` murni berdasarkan urutan `createdAt DESC`. Artikel ke-5 selalu masuk Fokus Redaksi meskipun tidak layak. | Artikel berkualitas rendah bisa masuk slot premium hanya karena timing publish. |
| 2 | **Tidak ada scoring/weighting** — Tidak ada mekanisme untuk memprioritaskan artikel berdasarkan engagement (views, comments), editorial flag, atau freshness gabungan. | Artikel bagus yang publish 2 jam lalu bisa kalah slot dengan artikel biasa yang publish 1 menit lalu. |
| 3 | **Satu pool untuk semua zona** — 25 artikel yang sama didistribusi ke semua section. Jika artikel sedikit (<15), hero dan fokus berkurang tapi feed tetap mengambil dari pool yang sama. | Duplikasi konten antar section, pengalaman repetitif. |
| 4 | **Trending dari API terpisah** — `getTrendingArticles()` mengambil 5 artikel by views terpisah dari pool utama. Tidak ada jaminan non-overlap dengan hero. | Artikel yang sama bisa muncul di Hero DAN Trending. |
| 5 | **Kategori filter hardcoded** — Slug opini (`opini`, `kolom-esai`, `analisis`, `kolom`) dan foto (`foto-jurnalistik`) di-hardcode. Jika site menggunakan slug berbeda, section tidak terisi. | Section kosong tanpa feedback ke editor. |
| 6 | **Tidak ada editorial override** — Editor tidak bisa menentukan artikel mana yang masuk slot Hero atau Fokus Redaksi dari dashboard. | Kontrol editorial terbatas pada flag `isFeatured`/`isExclusive` yang hanya memfilter, bukan menempatkan. |

#### B. Grid Layout (Medium)

| # | Masalah | Dampak |
|---|---------|--------|
| 7 | **Hero selalu 4 artikel** — Meskipun ada adaptive allocation (2 jika <15), tidak ada cara untuk menampilkan 1 hero besar untuk breaking news. | Breaking news harus bersaing dengan 3 artikel lain di hero slider. |
| 8 | **Fokus Redaksi selalu 3 kartu** — Layout `2/3 + 1/3` fixed. Jika hanya 1 artikel layak, layout terlihat kosong. | Tidak graceful degradation. |
| 9 | **Feed stream selalu 2-kolom** — Tidak ada variasi layout (1-kolom highlight, 3-kolom compact, mosaic). | Monoton, kurang visual rhythm. |
| 10 | **Sidebar statis** — Urutan widget fixed: Akses Redaksi → Terbaru → Info Pasar → Foto → Video. Tidak bisa dikonfigurasi per site. | Site berita teknologi tetap menampilkan Info Pasar walau tidak relevan. |

#### C. Performa & Maintainability (Low)

| # | Masalah | Dampak |
|---|---------|--------|
| 11 | **920 baris dalam 1 file** — Semua logic, data fetching, dan rendering dalam satu komponen. | Sulit di-test, sulit di-maintain, sulit di-reuse. |
| 12 | **Tidak ada error boundary** — Jika satu section gagal render, seluruh homepage bisa blank. | UX buruk jika ada data corruption di satu section. |
| 13 | **Tidak ada A/B testing capability** — Layout statis, tidak bisa di-eksperimen. | Tidak bisa mengukur efektivitas perubahan layout. |

---

## 2. Redesign: Article Selection Logic

### 2.1 Konsep: Article Scoring Engine

Ganti `distributeArticles()` dengan sistem scoring yang mempertimbangkan multiple signals:

```typescript
interface ArticleScore {
  article: HomeArticle
  score: number
  signals: {
    freshness: number      // 0-1, berdasarkan publishedAt vs now
    engagement: number     // 0-1, berdasarkan viewCount (normalized)
    editorial: number      // 0-1, berdasarkan isFeatured, isExclusive, isBreaking
    relevance: number      // 0-1, berdasarkan category match untuk zona tertentu
  }
}
```

#### Scoring Formula

```
score = (freshness × 0.3) + (engagement × 0.3) + (editorial × 0.3) + (relevance × 0.1)
```

**Bobot bisa disesuaikan per site** via site settings:

```typescript
interface ScoringWeights {
  freshness: number   // default 0.3
  engagement: number  // default 0.3
  editorial: number   // default 0.3
  relevance: number   // default 0.1
}
```

#### Signal Definitions

**Freshness** — Decay function berdasarkan umur artikel:
```typescript
function calcFreshness(publishedAt: Date): number {
  const hoursSincePublish = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)
  // Artikel < 6 jam = 1.0, 24 jam = 0.7, 72 jam = 0.3, > 168 jam = 0.1
  return Math.max(0.1, Math.exp(-hoursSincePublish / 48))
}
```

**Engagement** — Normalized viewCount:
```typescript
function calcEngagement(viewCount: number, maxViews: number): number {
  if (maxViews === 0) return 0.5
  return Math.min(1, viewCount / maxViews)
}
```

**Editorial** — Binary flags dengan bobot:
```typescript
function calcEditorial(article: HomeArticle): number {
  let score = 0
  if (article.isBreaking) score += 0.4
  if (article.isFeatured) score += 0.35
  if (article.isExclusive) score += 0.25
  return Math.min(1, score)
}
```

**Relevance** — Category match bonus untuk zona tertentu:
```typescript
function calcRelevance(article: HomeArticle, targetCategorySlugs: string[]): number {
  if (targetCategorySlugs.length === 0) return 0.5
  const articleSlugs = getCategorySlugs(article)
  return articleSlugs.some(s => targetCategorySlugs.includes(s)) ? 1.0 : 0.3
}
```

### 2.2 Zona Allocation Baru

```
┌─────────────────────────────────────────────────────────────┐
│  ZONA 1 — HERO                                              │
│  Tipe: SINGLE_HEADLINE | BENTO_4 | BENTO_3 | MAGAZINE_COVER_550 │
│  Sumber: top-1 score (SINGLE) atau top-4 score (BENTO)      │
│  Override: field heroSlot (manual assignment dari dashboard) │
├─────────────────────────────────────────────────────────────┤
│  ZONA 2 — FOKUS REDAKSI                                     │
│  Artikel: score rank 5-8, filter: isFeatured || isExclusive  │
│  Fallback: top-4 by score yang belum dipakai di hero        │
│  Layout: adaptive (3 atau 4 kartu tergantung ketersediaan)  │
├─────────────────────────────────────────────────────────────┤
│  ZONA 3 — TRENDING                                          │
│  Sumber: top-5 by engagement (viewCount) dari SEMUA artikel │
│  Filter: exclude hero IDs                                   │
│  Merge dengan pool utama, bukan API terpisah                │
├─────────────────────────────────────────────────────────────┤
│  ZONA 4 — FEED + SIDEBAR                                    │
│  Feed: sisa artikel setelah hero/fokus, score-sorted        │
│  Layout: configurable per site (compact/comfortable/dense)  │
│  Sidebar: widget order configurable                         │
├─────────────────────────────────────────────────────────────┤
│  ZONA 5+ — EDITORIAL EXTRAS                                 │
│  Tetap: Pilihan Editor, Opini, Video                        │
│  Tapi: filter dari pool terpisah (bukan sisa feed)          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Implementasi: `scoreAndDistribute()`

```typescript
function scoreAndDistribute(
  articles: HomeArticle[],
  trendingArticles: HomeArticle[],
  opts: {
    heroMode?: 'SINGLE_HEADLINE' | 'BENTO_4' | 'BENTO_3' | 'MAGAZINE_COVER_550'
    weights?: ScoringWeights
    categoryConfig?: {
      opinionSlugs?: string[]
      photoSlugs?: string[]
      videoSlugs?: string[]
    }
  }
) {
  const weights = opts.weights ?? { freshness: 0.3, engagement: 0.3, editorial: 0.3, relevance: 0.1 }
  const catConfig = opts.categoryConfig ?? { opinionSlugs: [...], photoSlugs: [...], videoSlugs: [...] }

  // 1. Hitung max views untuk normalisasi
  const maxViews = Math.max(...articles.map(a => a.viewCount ?? 0), 1)

  // 2. Score semua artikel
  const scored: ArticleScore[] = articles.map(article => ({
    article,
    signals: {
      freshness: calcFreshness(new Date(article.publishedAt || article.createdAt)),
      engagement: calcEngagement(article.viewCount ?? 0, maxViews),
      editorial: calcEditorial(article),
      relevance: 0.5, // default, override per zona
    },
    get score() {
      const s = this.signals
      return (s.freshness * weights.freshness)
        + (s.engagement * weights.engagement)
        + (s.editorial * weights.editorial)
        + (s.relevance * weights.relevance)
    }
  }))

  // 3. Sort by score descending
  const sorted = [...scored].sort((a, b) => b.score - a.score)

  // 4. Allocate ke zona
  const heroCount = opts.heroMode === 'SINGLE_HEADLINE' ? 1
    : opts.heroMode === 'BENTO_3' ? 3
    : opts.heroMode === 'MAGAZINE_COVER_550' ? 5 // 1 utama + 4 thumbnail
    : 4
  const hero = sorted.splice(0, heroCount).map(s => s.article)
  const heroIds = new Set(hero.map(a => a.id))

  // 5. Fokus Redaksi: prioritaskan editorial flag
  const fokusPool = sorted
    .filter(s => s.signals.editorial >= 0.35) // isFeatured atau isExclusive
    .slice(0, 4)
    .map(s => s.article)
  const fokusRedaksi = fokusPool.length >= 2
    ? fokusPool
    : sorted.splice(0, 4).map(s => s.article) // fallback: top by score
  const fokusIds = new Set(fokusRedaksi.map(a => a.id))

  // 6. Sisa untuk feed
  const remaining = sorted
    .filter(s => !heroIds.has(s.article.id) && !fokusIds.has(s.article.id))

  // 7. Feed: 2 featured + 6 stream
  const feedFeatured = remaining.splice(0, 2).map(s => s.article)
  const feedStream = remaining.splice(0, 6).map(s => s.article)

  // 8. Editorial extras dari pool terpisah
  const afterFeed = remaining.map(s => s.article)
  const editorChoice = afterFeed.filter(a => a.isFeatured).slice(0, 3)
  const opinion = afterFeed.filter(a => hasCategorySlug(a, catConfig.opinionSlugs)).slice(0, 3)
  const photoJournal = articles.filter(a => hasCategorySlug(a, catConfig.photoSlugs)).slice(0, 3)
  const videoStories = articles.filter(a => hasCategorySlug(a, catConfig.videoSlugs)).slice(0, 3)

  // 9. Trending: merge dari API terpisah, exclude hero
  const trending = trendingArticles.filter(a => !heroIds.has(a.id)).slice(0, 5)

  // 10. Sidebar: non-hero, non-trending
  const trendingIds = new Set(trending.map(a => a.id))
  const popular = articles
    .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id))
    .slice(0, 5)

  return {
    hero, fokusRedaksi, feedFeatured, feedStream,
    editorChoice, opinion, photoJournal, videoStories,
    trending, popular
  }
}
```

### 2.4 Editorial Override System

Tambahkan field baru di Prisma `Article` model:

```prisma
model Article {
  // ... existing fields ...
  heroSlot      Int?      @default(null) // 1-4, null = auto-assign by score
  homepageZone  String?   @default(null) // 'hero' | 'fokus' | 'editor_choice' | null
  homepageOrder Int?      @default(null) // manual ordering within zone
}
```

Atau, lebih fleksibel — gunakan tabel terpisah:

```prisma
model HomepagePlacement {
  id          String   @id @default(uuid())
  siteId      String
  articleId   String
  zone        String   // 'hero' | 'fokus' | 'editor_choice' | 'trending'
  position    Int      // 1-based ordering within zone
  expiresAt   DateTime? // optional: auto-remove after date
  createdAt   DateTime @default(now())

  site    Site    @relation(fields: [siteId], references: [id])
  article Article @relation(fields: [articleId], references: [id])

  @@unique([siteId, zone, position])
  @@index([siteId, zone])
}
```

**Flow:**
1. Editor menempatkan artikel ke zona tertentu via dashboard
2. `scoreAndDistribute()` membaca `HomepagePlacement` terlebih dahulu
3. Slot yang sudah di-override tidak diisi oleh scoring engine
4. Sisa slot diisi otomatis berdasarkan score

---

## 3. Redesign: Grid Layout

### 3.1 Hero Section — Mode Selector

Tiga mode hero yang bisa dipilih per site (atau auto-detect):

#### Mode A: `SINGLE_HEADLINE` (Breaking News)
```
┌─────────────────────────────────────────────┐
│                                             │
│         [GAMBAR FULL-WIDTH]                 │
│                                             │
│         KATEGORI                            │
│         JUDUL BESAR (2-3 baris)             │
│         Excerpt singkat                     │
│         Author · Date · Read Time           │
│                                             │
└─────────────────────────────────────────────┘
```
- Untuk: breaking news, artikel eksklusif besar
- Trigger: `isBreaking` atau manual override
- Responsive: full-width di semua breakpoint

#### Mode B: `BENTO_4` (Default — Current)
```
┌──────────────────────────┬──────────────────┐
│                          │  [1] Headline 1  │
│   [GAMBAR UTAMA]         │  [2] Headline 2  │
│   Auto-rotate 5 detik    │  [3] Headline 3  │
│                          │  [4] Headline 4  │
└──────────────────────────┴──────────────────┘
```
- Untuk: homepage normal, konten cukup
- Tetap pertahankan `MagazineBentoHero`

#### Mode C: `BENTO_3` (Compact)
```
┌────────────┬────────────┬──────────────────┐
│            │            │                  │
│  [ARTIKEL 1]│  [ARTIKEL 2]│  [ARTIKEL 3]    │
│            │            │                  │
└────────────┴────────────┴──────────────────┘
```
- Untuk: site dengan konten sedikit, atau mobile-first
- 3 kartu sejajar, masing-masing dengan overlay text

#### Mode D: `MAGAZINE_COVER_550` (Best of — DEFAULT) ⭐
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│              [GAMBAR FULL-WIDTH — 550px tinggi]                    │
│              overlay gradient bottom                               │
│                                                                    │
│              KATEGORI                                              │
│              JUDUL ARTIKEL UTAMA SANGAT BESAR                      │
│              Excerpt singkat satu baris                            │
│              Author · 5 menit baca · 2 jam lalu                   │
│                                                                    │
├──────┬──────┬──────┬──────┬──────┬────────────────────────────────┤
│ [TH] │ [TH] │ [TH] │ [TH] │ [TH] │           ► Next              │
│ 01   │ 02   │ 03   │ 04   │ 05   │                               │
└──────┴──────┴──────┴──────┴──────┴────────────────────────────────┘
Thumbnail: klik untuk ganti artikel utama (BUKAN auto-rotate)
```
- **Default template** — kombinasi terbaik dari A+B+C
- Tinggi hero dibatasi ~550px (BUKAN full-screen) → konten di atas fold tetap terlihat
- Thumbnail bar interaktif (klik untuk ganti, bukan auto-rotate)
- 5 artikel di hero: 1 utama + 4 thumbnail
- Sumber: top-5 by score (breaking tetap prioritas)
- Mobile: tinggi ~350px, thumbnail bar tetap

### 3.2 Fokus Redaksi — Adaptive Grid

#### Current (Fixed 3 kolom):
```
┌─────────────────────┬──────────┐
│                     │ [Art 2]  │
│   [Artikel 1]       ├──────────┤
│   (col-span-2)      │ [Art 3]  │
└─────────────────────┴──────────┘
```

#### Redesign (Adaptive):
```
// Jika 4 artikel:
┌──────────┬──────────┬──────────┬──────────┐
│ [Art 1]  │ [Art 2]  │ [Art 3]  │ [Art 4]  │
└──────────┴──────────┴──────────┴──────────┘

// Jika 3 artikel:
┌─────────────────────┬──────────┬──────────┐
│                     │ [Art 2]  │ [Art 3]  │
│   [Artikel 1]       │          │          │
│   (col-span-2)      │          │          │
└─────────────────────┴──────────┴──────────┘

// Jika 2 artikel:
┌─────────────────────┬──────────┐
│                     │          │
│   [Artikel 1]       │ [Art 2]  │
│   (col-span-2)      │          │
└─────────────────────┴──────────┘

// Jika 1 artikel:
┌─────────────────────────────────────────────┐
│                                             │
│   [Artikel 1] — Full width, large card      │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.3 Feed Section — Layout Variants

Tambahkan konfigurasi layout feed per site:

```typescript
type FeedLayout = 'comfortable' | 'compact' | 'dense'

interface SiteFeedConfig {
  layout: FeedLayout
  showExcerpt: boolean
  showAuthor: boolean
  columns: 1 | 2 | 3
}
```

#### `comfortable` (Default):
```
┌─────────────────────────────────────────────┐
│  [Art 1 — Horizontal besar]                 │
├─────────────────────────────────────────────┤
│  [Art 2 — Horizontal besar]                 │
├──────────────────┬──────────────────────────┤
│  [Art 3 — Med]   │  [Art 4 — Med]           │
├──────────────────┼──────────────────────────┤
│  [Art 5 — Med]   │  [Art 6 — Med]           │
├──────────────────┼──────────────────────────┤
│  [Art 7 — Med]   │  [Art 8 — Med]           │
└──────────────────┴──────────────────────────┘
```

#### `compact`:
```
┌──────────────────┬──────────────────────────┐
│  [Art 1 — Large] │  [Art 2 — Vertical]      │
│  (col-span-2)    │  [Art 3 — Vertical]      │
├──────────────────┼──────────────────┬───────┤
│  [Art 4]         │  [Art 5]         │ [Art 6]│
├──────────────────┼──────────────────┼───────┤
│  [Art 7]         │  [Art 8]         │ [Art 9]│
└──────────────────┴──────────────────┴───────┘
```

#### `dense` (3 kolom):
```
┌──────────┬──────────┬──────────────────────┐
│ [Art 1]  │ [Art 2]  │  [Art 3 — Large]     │
│          │          │  (row-span-2)         │
├──────────┼──────────┤                      │
│ [Art 4]  │ [Art 5]  │                      │
├──────────┼──────────┼──────────────────────┤
│ [Art 6]  │ [Art 7]  │  [Art 8]             │
└──────────┴──────────┴──────────────────────┘
```

### 3.4 NewsCard Variations — Pecah Monoton "Gambar Kiri + Teks Kanan"

Masalah utama: `NewsCard` hanya punya 4 variant dan semuanya mengikuti pola yang sama
(gambar di atas ATAU gambar di kiri). Tidak ada variasi posisi gambar.

#### Current Variants:
```
large:       ┌──────────────────────┐    horizontal:  ┌────┬─────────────┐
             │   [GAMBAR BG]        │                 │IMG │ Title       │
             │   Title overlay      │                 │    │ Excerpt     │
             └──────────────────────┘                 └────┴─────────────┘
                                                          SELALU kiri

medium:      ┌──────────────┐        minimal:  ┌─────────────────────────┐
             │   [GAMBAR]   │                   │ Title                   │
             │   Title      │                   │ Author · Date           │
             └──────────────┘                   └─────────────────────────┘
             SELALU atas                         TANPA gambar
```

#### New Variants — `imagePosition` System:

```typescript
interface NewsCardProps {
  article: HomeArticle
  variant?: 'large' | 'medium' | 'minimal' | 'horizontal'
  imagePosition?: 'top' | 'left' | 'right' | 'background' | 'none'  // ← BARU
  site?: string
  priority?: boolean
  size?: 'default' | 'compact'  // ← BARU: compact untuk dense grid
}
```

#### Semua Kombinasi Layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  A. imagePosition="top" (default medium)                                │
│  ┌──────────────────┐                                                    │
│  │    [GAMBAR]       │                                                    │
│  ├──────────────────┤                                                    │
│  │  Kategori        │                                                    │
│  │  Judul Artikel   │                                                    │
│  │  Author · Date   │                                                    │
│  └──────────────────┘                                                    │
│                                                                         │
│  B. imagePosition="left" (default horizontal)                           │
│  ┌────────┬──────────────────────────┐                                   │
│  │ [IMG]  │  Kategori                │                                   │
│  │        │  Judul Artikel           │                                   │
│  │        │  Excerpt singkat         │                                   │
│  └────────┴──────────────────────────┘                                   │
│                                                                         │
│  C. imagePosition="right" ← BARU, tidak pernah ada sebelumnya           │
│  ┌──────────────────────────┬────────┐                                   │
│  │  Kategori                │ [IMG]  │                                   │
│  │  Judul Artikel           │        │                                   │
│  │  Excerpt singkat         │        │                                   │
│  └──────────────────────────┴────────┘                                   │
│                                                                         │
│  D. imagePosition="background" (default large)                          │
│  ┌──────────────────────────────────┐                                   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                                   │
│  │  ░░ [GAMBAR FULL] ░░░░░░░░░░░░░ │                                   │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                                   │
│  │  Kategori                        │                                   │
│  │  Judul Besar                     │                                   │
│  │  Author · Date                   │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                         │
│  E. imagePosition="none" (default minimal)                              │
│  ┌──────────────────────────────────┐                                   │
│  │  Kategori                        │                                   │
│  │  Judul Artikel                   │                                   │
│  │  Author · Date                   │                                   │
│  └──────────────────────────────────┘                                   │
│                                                                         │
│  F. imagePosition="background" + size="compact" ← untuk dense grid      │
│  ┌──────────────┐                                                       │
│  │ ░░░░░░░░░░░░ │                                                       │
│  │ ░░ [IMG] ░░░ │                                                       │
│  │ Judul        │                                                       │
│  └──────────────┘                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Contoh Penggunaan di Grid — "Visual Rhythm":

Tujuan: setiap baris grid menggunakan kombinasi posisi gambar yang berbeda
agar mata tidak bosan dengan pola yang sama.

```
ROW 1 — Hero Pair (2 kolom, kontras):
┌─────────────────────────────┬─────────────────────────────┐
│ imagePosition="background"  │ imagePosition="right"       │
│                             │                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │  Kategori    ┌────────┐    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │  Judul       │ [IMG]  │    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │  Excerpt     │        │    │
│  Judul besar                │  Author      └────────┘    │
│  Author · Date              │                             │
└─────────────────────────────┴─────────────────────────────┘

ROW 2 — Triplet (3 kolom, rotasi):
┌──────────────┬──────────────┬──────────────┐
│ image="top"  │ image="top"  │ image="top"  │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ [GAMBAR] │ │ │ [GAMBAR] │ │ │ [GAMBAR] │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │
│ Judul        │ Judul        │ Judul        │
└──────────────┴──────────────┴──────────────┘

ROW 3 — Asymmetric (2 kolom, kiri besar + kanan stack):
┌─────────────────────────────┬──────────────┐
│ imagePosition="background"  │ image="left" │
│                             │ ┌────┬─────┐ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │ │IMG │Title│ │
│  Judul besar                │ └────┴─────┘ │
│  Author                     │ image="left" │
│                             │ ┌────┬─────┐ │
│                             │ │IMG │Title│ │
│                             │ └────┴─────┘ │
└─────────────────────────────┴──────────────┘

ROW 4 — Text-Only Break (1 kolom, tanpa gambar):
┌─────────────────────────────────────────────┐
│  [INTERSTITIAL: Terpopuler / Most Read]     │ ← sidebar content di sini
│  1. Judul artikel...        3 min baca      │
│  2. Judul artikel...        5 min baca      │
│  3. Judul artikel...        2 min baca      │
└─────────────────────────────────────────────┘

ROW 5 — Mixed Media Row (video + artikel):
┌──────────────────┬──────────────┬──────────────┐
│ image="background│ image="top"  │ image="none" │
│  + play icon     │              │ (text-only)  │
│  [VIDEO THUMB]   │  [GAMBAR]    │  Judul       │
│  Judul video     │  Judul       │  Excerpt     │
│  03:45           │  Author      │  Author      │
└──────────────────┴──────────────┴──────────────┘
```

### 3.5 Sidebar Dihapus → Jadi Interstitial Sections (NYT/Kompas.id Pattern)

**Masalah saat ini:**
Sidebar adalah kolom 4-kolom yang selalu ada di sebelah kanan feed,
membagi halaman menjadi 8+4 secara rigid. Ini masalah karena:

1. Di mobile, sidebar turun ke bawah → konten sidebar tersembunyi jauh dari fold
2. Di desktop, sidebar memotong lebar feed → artikel terasa sempit
3. Urutan widget statis → tidak ada kreativitas dalam penyajian
4. Widget bersaing untuk perhatian → pembaca bingung mau lihat mana

**Solusi: Hapus sidebar sebagai kolom terpisah.**
Widget sidebar menjadi **interstitial sections** yang terintegrasi ke dalam feed flow,
persis seperti NYT "Most Read" dan Kompas.id "Terpopuler".

#### Before (Sidebar Kaku):
```
┌────────────────────────────┬────────────────┐
│                            │                │
│  Feed                      │  Akses Redaksi │
│  ─────────────────         │  ───────────── │
│  [Art 1]                   │  Terbaru       │
│  [Art 2]                   │  1. ...        │
│  [Art 3]                   │  2. ...        │
│  [Art 4]                   │  3. ...        │
│  [Art 5]                   │  4. ...        │
│  [Art 6]                   │  5. ...        │
│                            │  ───────────── │
│  [Load More]               │  Info Pasar    │
│                            │  ───────────── │
│                            │  Foto Journal  │
│                            │                │
└────────────────────────────┴────────────────┘
Masalah: sidebar selalu di samping, memotong feed, widget tersembunyi di bawah.
```

#### After (Interstitial Flow — ala NYT/Kompas.id):
```
┌─────────────────────────────────────────────────┐
│  HERO (MagazineBentoHero)                        │
├─────────────────────────────────────────────────┤
│  Ad: HOME_TOP                                    │
├─────────────────────────────────────────────────┤
│  FOKUS REDAKSI (3-4 kartu)                      │
├─────────────────────────────────────────────────┤
│  TRENDING (5 artikel, horizontal strip)          │
├─────────────────────────────────────────────────┤
│                                                 │
│  BERITA TERBARU                                  │
│  ┌──────────────────┬──────────────────────────┐ │
│  │ image="background│ image="right"            │ │
│  │  [IMG BG]        │  Kategori  ┌────────┐   │ │
│  │  Judul besar     │  Judul     │ [IMG]  │   │ │
│  │  Author          │  Excerpt   └────────┘   │ │
│  └──────────────────┴──────────────────────────┘ │
│                                                 │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ image="top"  │ image="top"  │ image="top"  │ │
│  │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ │
│  │ │ [GAMBAR] │ │ │ [GAMBAR] │ │ │ [GAMBAR] │ │ │
│  │ └──────────┘ │ └──────────┘ │ └──────────┘ │ │
│  │ Judul        │ Judul        │ Judul        │ │
│  └──────────────┴──────────────┴──────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ░░░░░░░ PALING DIBACA ░░░░░░░  ← INTERSTITIAL │
│  (full-width, bg berbeda, horizontal cards)      │
│  ┌────────┬────────┬────────┬────────┬────────┐ │
│  │ 01     │ 02     │ 03     │ 04     │ 05     │ │
│  │ [IMG]  │ [IMG]  │ [IMG]  │ [IMG]  │ [IMG]  │ │
│  │ Judul  │ Judul  │ Judul  │ Judul  │ Judul  │ │
│  │ 5 min  │ 3 min  │ 4 min  │ 2 min  │ 6 min  │ │
│  └────────┴────────┴────────┴────────┴────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  BERITA LAINNYA                                  │
│  ┌──────────────────┬──────────────────────────┐ │
│  │ image="left"     │ image="left"             │ │
│  │ ┌────┬───────┐   │ ┌────┬───────┐           │ │
│  │ │IMG │Title  │   │ │IMG │Title  │           │ │
│  │ │    │Excerpt│   │ │    │Excerpt│           │ │
│  │ └────┴───────┘   │ └────┴───────┘           │ │
│  └──────────────────┴──────────────────────────┘ │
│                                                 │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ image="top"  │ image="top"  │ image="top"  │ │
│  │ [GAMBAR]     │ [GAMBAR]     │ [GAMBAR]     │ │
│  │ Judul        │ Judul        │ Judul        │ │
│  └──────────────┴──────────────┴──────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ░░░░░░░ AKSES REDAKSI ░░░░░░░  ← INTERSTITIAL │
│  (full-width, 3 kartu sejajar: WA / TG / Email) │
│  ┌───────────┬───────────┬───────────┐          │
│  │ WhatsApp  │ Telegram  │ Email     │          │
│  │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │          │
│  │ │ [WA]  │ │ │ [TG]  │ │ │ [Mail]│ │          │
│  │ └───────┘ │ └───────┘ │ └───────┘ │          │
│  │ Klik utk  │ Ikuti     │ Kirim     │          │
│  │ chat      │ kanal     │ email     │          │
│  └───────────┴───────────┴───────────┘          │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ░░░░░░░ INFO PASAR ░░░░░░░     ← INTERSTITIAL │
│  (full-width, horizontal ticker/card)            │
│  ┌─────────────────────────────────────────────┐│
│  │ IHSG ▲ 7,234 (+1.2%)  │ USD/IDR 15,890    ││
│  │ Emas ▲ 2,150 (+0.5%)  │ Minyak ▼ 78.2     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ░░░░░░░ FOTO JURNALISTIK ░░░░░░░ ← INTERSTITIAL│
│  (full-width, 3 kartu landscape)                 │
│  ┌──────────────┬──────────────┬──────────────┐ │
│  │ [FOTO 1]     │ [FOTO 2]     │ [FOTO 3]     │ │
│  │ Caption      │ Caption      │ Caption      │ │
│  │ Photographer │ Photographer │ Photographer │ │
│  └──────────────┴──────────────┴──────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  EDITORIAL EXTRAS                                │
│  • Pilihan Editor (portrait 3:4)                 │
│  • Opini & Analisis                              │
│  • Video Eksklusif                               │
├─────────────────────────────────────────────────┤
│  [Load More]                                     │
└─────────────────────────────────────────────────┘
```

#### Prinsip Interstitial Design:

1. **Setiap interstitial punya visual break** — bg berbeda, border, atau spacing besar
   agar terasa seperti "section baru", bukan lanjutan feed.

2. **Frekuensi: 1 interstitial setiap 4-6 kartu feed** — tidak terlalu sering
   (mengganggu), tidak terlalu jarang (widget tersembunyi).

3. **Urutan interstitial configurable** — sama seperti sidebar config,
   tapi sekarang menentukan kapan muncul di antara feed cards.

4. **Responsive: interstitial selalu full-width** — tidak ada masalah
   sidebar collapse di mobile.

#### Interstitial Placement Config:

```typescript
interface InterstitialPlacement {
  id: string
  afterCardIndex: number  // muncul setelah kartu ke-N di feed
  widget: 'trending' | 'terbaru' | 'redaksi' | 'market' | 'photo' | 'video' | 'opinion'
  enabled: boolean
}

// Default placement:
const defaultInterstitials: InterstitialPlacement[] = [
  { id: 'trending',  afterCardIndex: 0,  widget: 'trending',  enabled: true },  // setelah hero pair
  { id: 'terbaru',   afterCardIndex: 6,  widget: 'terbaru',   enabled: true },  // setelah 6 kartu feed
  { id: 'redaksi',   afterCardIndex: 10, widget: 'redaksi',   enabled: true },  // setelah 4 kartu lagi
  { id: 'market',    afterCardIndex: 14, widget: 'market',    enabled: true },  // setelah 4 kartu lagi
  { id: 'photo',     afterCardIndex: 18, widget: 'photo',     enabled: true },  // di bagian bawah
]
```

#### Interstitial Component Variants:

```typescript
// Setiap widget punya 2-3 variant tampilan yang bisa dipilih:

// "terbaru" — Most Read style (NYT)
// Variant A: Numbered list (default)
// Variant B: Compact cards (3 kolom)
// Variant C: Horizontal strip

// "redaksi" — Contact style
// Variant A: 3 cards inline (default)
// Variant B: Banner strip

// "market" — Data style
// Variant A: Ticker strip (default)
// Variant B: Card grid

// "photo" — Visual style
// Variant A: 3 landscape cards (default)
// Variant B: 1 hero + 2 small
```

---

## 4. Final Grid Layout — Full Page Blueprint (Design F: Best of ⭐)

Berikut layout final yang menggabungkan semua elemen di atas.
Ini adalah **Design F (Best of)** — default layout yang bisa dikonfigurasi per site.

### 4.1 Desktop (lg: 1280px+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  NAVBAR (full-width, fixed top)                                              │
│  [Logo] [Kategori horizontal scroll...] [Search] [Login]                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════╗ │
│  ║  ZONA 1 — HERO: MAGAZINE_COVER_550 (Best of, DEFAULT) ⭐               ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │                                                                    │  ║ │
│  ║  │              [GAMBAR FULL-WIDTH — 550px tinggi]                    │  ║ │
│  ║  │              overlay gradient bottom                               │  ║ │
│  ║  │                                                                    │  ║ │
│  ║  │              POLITIK                                               │  ║ │
│  ║  │              JUDUL ARTIKEL UTAMA SANGAT BESAR                      │  ║ │
│  ║  │              Excerpt singkat satu baris                            │  ║ │
│  ║  │              Author · 5 menit baca · 2 jam lalu                   │  ║ │
│  ║  │                                                                    │  ║ │
│  ║  ├──────┬──────┬──────┬──────┬──────┬────────────────────────────────┤  ║ │
│  ║  │ [TH] │ [TH] │ [TH] │ [TH] │ [TH] │           ► Next              │  ║ │
│  ║  │ 01   │ 02   │ 03   │ 04   │ 05   │                               │  ║ │
│  ║  └──────┴──────┴──────┴──────┴──────┴────────────────────────────────┘  ║ │
│  ║  Thumbnail: klik untuk ganti artikel utama (BUKAN auto-rotate)          ║ │
│  ╚══════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  AD: HOME_TOP (880×220 desktop, 4:1, video)                          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════╗ │
│  ║  ZONA 2 — FOKUS REDAKSI (4 kartu sejajar)                              ║ │
│  ║  ┌──────────────┬──────────────┬──────────────┬──────────────┐          ║ │
│  ║  │ image="bg"   │ image="top"  │ image="top"  │ image="top"  │          ║ │
│  ║  │ ░░░░░░░░░░░░ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │          ║ │
│  ║  │ ░░░░░░░░░░░░ │ │ [GAMBAR] │ │ │ [GAMBAR] │ │ │ [GAMBAR] │ │          ║ │
│  ║  │ Judul besar  │ └──────────┘ │ └──────────┘ │ └──────────┘ │          ║ │
│  ║  │ Author       │ Title        │ Title        │ Title        │          ║ │
│  ║  └──────────────┴──────────────┴──────────────┴──────────────┘          ║ │
│  ╚══════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════╗ │
│  ║  ZONA 3 — TRENDING: NUMBERED_PODIUM (top 3 gambar besar)               ║ │
│  ║  ┌──────────────────────┬──────────────────────┬──────────────────────┐  ║ │
│  ║  │      🥇 [GAMBAR]     │      🥈 [GAMBAR]     │      🥉 [GAMBAR]     │  ║ │
│  ║  │      Judul besar     │      Judul besar     │      Judul besar     │  ║ │
│  ║  │      12.5k views     │      8.2k views      │      6.1k views      │  ║ │
│  ║  └──────────────────────┴──────────────────────┴──────────────────────┘  ║ │
│  ║  ┌────────────────────────────────────────────────────────────────────┐  ║ │
│  ║  │ 4. Judul keempat...                                    3.2k views │  ║ │
│  ║  │ 5. Judul kelima...                                     2.8k views │  ║ │
│  ║  └────────────────────────────────────────────────────────────────────┘  ║ │
│  ╚══════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════╗ │
│  ║  ZONA 4 — BERITA TERBARU (feed utama, 12 kolom penuh)                  ║ │
│  ║                                                                          ║ │
│  ║  ── Row 1: Hero Pair (2 kolom, kontras) ──────────────────────────────  ║ │
│  ║  ┌─────────────────────────────┬─────────────────────────────┐          ║ │
│  ║  │ image="background"          │ image="right"               │          ║ │
│  ║  │ ░░░░░░░░░░░░░░░░░░░░░░░░░  │ Kategori       ┌────────┐  │          ║ │
│  ║  │ ░░░░░░░░░░░░░░░░░░░░░░░░░  │ Judul          │ [IMG]  │  │          ║ │
│  ║  │ Judul besar                 │ Excerpt        │        │  │          ║ │
│  ║  │ Author                      │ Author         └────────┘  │          ║ │
│  ║  └─────────────────────────────┴─────────────────────────────┘          ║ │
│  ║                                                                          ║ │
│  ║  ── Row 2: Triplet (3 kolom, image=top) ─────────────────────────────   ║ │
│  ║  ┌──────────────┬──────────────┬──────────────┐                          ║ │
│  ║  │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │                          ║ │
│  ║  │ │ [GAMBAR] │ │ │ [GAMBAR] │ │ │ [GAMBAR] │ │                          ║ │
│  ║  │ └──────────┘ │ └──────────┘ │ └──────────┘ │                          ║ │
│  ║  │ Kategori     │ Kategori     │ Kategori     │                          ║ │
│  ║  │ Judul        │ Judul        │ Judul        │                          ║ │
│  ║  │ Author·Date  │ Author·Date  │ Author·Date  │                          ║ │
│  ║  └──────────────┴──────────────┴──────────────┘                          ║ │
│  ║                                                                          ║ │
│  ║  ── Ad: HOME_FEED_1 ──────────────────────────────────────────────────  ║ │
│  ║                                                                          ║ │
│  ║  ── Row 3: Asymmetric (kiri besar + kanan stack) ─────────────────────  ║ │
│  ║  ┌─────────────────────────────┬──────────────┐                          ║ │
│  ║  │ image="background"          │ image="left" │                          ║ │
│  ║  │ ░░░░░░░░░░░░░░░░░░░░░░░░░  │ ┌────┬─────┐ │                          ║ │
│  ║  │ ░░░░░░░░░░░░░░░░░░░░░░░░░  │ │IMG │Title│ │                          ║ │
│  ║  │ Judul besar                 │ └────┴─────┘ │                          ║ │
│  ║  │ Author                      │ image="left" │                          ║ │
│  ║  │                             │ ┌────┬─────┐ │                          ║ │
│  ║  │                             │ │IMG │Title│ │                          ║ │
│  ║  │                             │ └────┴─────┘ │                          ║ │
│  ║  └─────────────────────────────┴──────────────┘                          ║ │
│  ║                                                                          ║ │
│  ╚══════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│  │  INTERSTITIAL: PALING DIBACA (horizontal cards, scrollable)            │ │
│  │  bg: brand-grey/30, full-width, rounded-2xl                            │ │
│  │  ┌────────┬────────┬────────┬────────┬────────┐                        │ │
│  │  │ 01     │ 02     │ 03     │ 04     │ 05     │                        │ │
│  │  │ [IMG]  │ [IMG]  │ [IMG]  │ [IMG]  │ [IMG]  │                        │ │
│  │  │ Judul  │ Judul  │ Judul  │ Judul  │ Judul  │                        │ │
│  │  │ 5 min  │ 3 min  │ 4 min  │ 2 min  │ 6 min  │                        │ │
│  │  └────────┴────────┴────────┴────────┴────────┘                        │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════╗ │
│  ║  BERITA LAINNYA (continued feed)                                        ║ │
│  ║                                                                          ║ │
│  ║  ── Row 4: Text-Heavy (2 kolom, image=left, excerpts visible) ────────  ║ │
│  ║  ┌─────────────────────────────────┬─────────────────────────────────┐  ║ │
│  ║  │ image="left"                    │ image="right"                   │  ║ │
│  ║  │ ┌─────────┬───────────────────┐ │ ┌───────────────────┬─────────┐ │  ║ │
│  ║  │ │ [IMG]   │ Kategori          │ │ │ Kategori          │ [IMG]   │ │  ║ │
│  ║  │ │         │ Judul             │ │ │ Judul             │         │ │  ║ │
│  ║  │ │         │ Excerpt 2 baris   │ │ │ Excerpt 2 baris   │         │ │  ║ │
│  ║  │ │         │ Author · Date     │ │ │ Author · Date     │         │ │  ║ │
│  ║  │ └─────────┴───────────────────┘ │ └───────────────────┴─────────┘ │  ║ │
│  ║  └─────────────────────────────────┴─────────────────────────────────┘  ║ │
│  ║                                                                          ║ │
│  ║  ── Row 5: Compact Triplet (3 kolom, image=top, no excerpt) ──────────  ║ │
│  ║  ┌──────────────┬──────────────┬──────────────┐                          ║ │
│  ║  │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │                          ║ │
│  ║  │ │ [GAMBAR] │ │ │ [GAMBAR] │ │ │ [GAMBAR] │ │                          ║ │
│  ║  │ └──────────┘ │ └──────────┘ │ └──────────┘ │                          ║ │
│  ║  │ Judul        │ Judul        │ Judul        │                          ║ │
│  ║  │ Author·Date  │ Author·Date  │ Author·Date  │                          ║ │
│  ║  └──────────────┴──────────────┴──────────────┘                          ║ │
│  ║                                                                          ║ │
│  ╚══════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│  │  INTERSTITIAL: AKSES REDAKSI                                           │ │
│  │  bg: white, border-top, full-width                                     │ │
│  │  ┌─────────────┬─────────────┬─────────────┐                            │ │
│  │  │  WhatsApp   │  Telegram   │  Email      │                            │ │
│  │  │  [icon]     │  [icon]     │  [icon]     │                            │ │
│  │  │  Klik chat  │  Ikuti      │  Kirim      │                            │ │
│  │  └─────────────┴─────────────┴─────────────┘                            │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│  │  INTERSTITIAL: INFO PASAR                                              │ │
│  │  bg: brand-grey/10, full-width                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │ IHSG ▲ 7,234.56 (+1.2%)  │  USD/IDR ▼ 15,890 (-0.3%)          │  │ │
│  │  │ Emas ▲ 2,150.30 (+0.5%)  │  Minyak ▼ 78.20 (-1.1%)            │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════╗ │
│  ║  ZONA 5+ — EDITORIAL EXTRAS (full-width)                               ║ │
│  ║                                                                          ║ │
│  ║  ── Pilihan Editor (portrait 3:4, image=background) ──────────────────  ║ │
│  ║  ┌────────────────┬────────────────┬────────────────┐                    ║ │
│  ║  │ ░░░░░░░░░░░░░░ │ ░░░░░░░░░░░░░░ │ ░░░░░░░░░░░░░░ │                    ║ │
│  ║  │ ░░ [PORTRAIT]░ │ ░░ [PORTRAIT]░ │ ░░ [PORTRAIT]░ │                    ║ │
│  ║  │ Judul          │ Judul          │ Judul          │                    ║ │
│  ║  │ Author         │ Author         │ Author         │                    ║ │
│  ║  └────────────────┴────────────────┴────────────────┘                    ║ │
│  ║                                                                          ║ │
│  ║  ── Opini & Analisis (text-heavy, minimal image) ─────────────────────  ║ │
│  ║  ┌──────────────┬──────────────┬──────────────┐                          ║ │
│  ║  │ "Judul..."   │ "Judul..."   │ "Judul..."   │                          ║ │
│  ║  │ Excerpt      │ Excerpt      │ Excerpt      │                          ║ │
│  ║  │ Author       │ Author       │ Author       │                          ║ │
│  ║  └──────────────┴──────────────┴──────────────┘                          ║ │
│  ║                                                                          ║ │
│  ║  ── Video Eksklusif (play button overlay) ───────────────────────────── ║ │
│  ║  ┌──────────────────┬──────────────────┬──────────────────┐              ║ │
│  ║  │ [▶ VIDEO THUMB]  │ [▶ VIDEO THUMB]  │ [▶ VIDEO THUMB]  │              ║ │
│  ║  │ Judul · 03:45    │ Judul · 12:30    │ Judul · 08:15    │              ║ │
│  ║  └──────────────────┴──────────────────┴──────────────────┘              ║ │
│  ╚══════════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│  │  INTERSTITIAL: FOTO JURNALISTIK                                        │ │
│  │  bg: dark, full-width                                                  │ │
│  │  ┌──────────────────┬──────────────────┬──────────────────┐              │ │
│  │  │ [FOTO 1]         │ [FOTO 2]         │ [FOTO 3]         │              │ │
│  │  │ Caption          │ Caption          │ Caption          │              │ │
│  │  │ Photographer     │ Photographer     │ Photographer     │              │ │
│  │  └──────────────────┴──────────────────┴──────────────────┘              │ │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  [Load More Articles]                                                │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  FOOTER                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Mobile (base: 375px) — Design F

```
┌──────────────────────────┐
│  NAVBAR (hamburger menu)  │
├──────────────────────────┤
│                          │
│  HERO: MAGAZINE_COVER    │
│  (tinggi ~350px)         │
│  ┌────────────────────┐  │
│  │ [GAMBAR FULL]      │  │
│  │ overlay gradient   │  │
│  │ POLITIK            │  │
│  │ JUDUL BESAR        │  │
│  │ Author · 5 min     │  │
│  │                    │  │
│  │ [TH][TH][TH][TH]   │  │ ← thumbnail bar
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│  AD: HOME_TOP            │
│  (320×80, 4:1)           │
├──────────────────────────┤
│                          │
│  FOKUS REDAKSI           │
│  ┌────────────────────┐  │
│  │ [GAMBAR]           │  │
│  │ Judul              │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ [GAMBAR]           │  │
│  │ Judul              │  │
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│  TRENDING: PODIUM        │
│  ┌────────────────────┐  │
│  │ 🥇 [GAMBAR]        │  │
│  │ Judul · 12.5k views│  │
│  └────────────────────┘  │
│  02  Judul...  8.2k     │
│  03  Judul...  6.1k     │
│  04  Judul...  3.2k     │
│  05  Judul...  2.8k     │
├──────────────────────────┤
│                          │
│  BERITA TERBARU          │
│  ┌────────────────────┐  │
│  │ [GAMBAR]           │  │  ← hero_pair → single
│  │ Judul besar        │  │
│  │ Author             │  │
│  └────────────────────┘  │
│  ┌────────┬─────────────┐│
│  │ [IMG]  │ Title       ││  ← text_heavy → stacked
│  │        │ Author      ││
│  └────────┴─────────────┘│
│  ┌────────┬─────────────┐│
│  │ [IMG]  │ Title       ││
│  └────────┴─────────────┘│
│                          │
├──────────────────────────┤
│  AD: HOME_FEED_1         │
│  (300×200, 3:2)          │
├──────────────────────────┤
│  ░░░ PALING DIBACA ░░░   │  ← INTERSTITIAL
│  ┌──────┬──────┬──────┐  │
│  │01    │02    │03    │  │ ← horizontal scroll
│  │[IMG] │[IMG] │[IMG] │  │
│  │Judul │Judul │Judul │  │
│  └──────┴──────┴──────┘  │
├──────────────────────────┤
│                          │
│  BERITA LAINNYA          │
│  ┌────────────────────┐  │
│  │ [GAMBAR]           │  │
│  │ Judul              │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ [GAMBAR]           │  │
│  │ Judul              │  │
│  └────────────────────┘  │
│                          │
├──────────────────────────┤
│  ░░░ AKSES REDAKSI ░░░   │  ← INTERSTITIAL
│  [WhatsApp] [Telegram]   │
│  [Email]                 │
│                          │
├──────────────────────────┤
│  ░░░ INFO PASAR ░░░      │  ← INTERSTITIAL
│  IHSG ▲ 7,234            │
│  USD/IDR ▼ 15,890        │
│                          │
├──────────────────────────┤
│  EDITORIAL EXTRAS        │
│  • Pilihan Editor        │
│  • Opini                 │
│  • Video                 │
├──────────────────────────┤
│  [Load More]             │
│                          │
│  FOOTER                  │
└──────────────────────────┘
```

---

## 5. Refactoring: Komponen Terpisah

### 5.1 File Structure Baru

```
apps/web/components/pages/home/
├── SiteHomePage.tsx              # Main orchestrator (server component)
├── HeroSection.tsx               # ZONA 1 — hero mode selector
├── FokusRedaksiSection.tsx       # ZONA 2 — adaptive grid
├── TrendingSection.tsx           # ZONA 3 — trending strip
├── FeedSection.tsx               # ZONA 4 — feed + interstitials (TANPA sidebar kolom)
├── FeedRow.tsx                   # Single row dalam feed (pattern rotation)
├── EditorialExtras.tsx           # ZONA 5+ — editor choice, opinion, video
├── interstitials/
│   ├── InterstitialTrending.tsx  # "Paling Dibaca" — numbered list (ala NYT Most Read)
│   ├── InterstitialRedaksi.tsx   # "Akses Redaksi" — 3 cards inline
│   ├── InterstitialMarket.tsx    # "Info Pasar" — ticker strip
│   ├── InterstitialPhoto.tsx     # "Foto Jurnalistik" — landscape cards
│   └── InterstitialVideo.tsx     # "Video" — play button cards
├── hooks/
│   ├── useArticleScoring.ts      # Scoring logic (client-side untuk re-order)
│   └── useHomepageConfig.ts      # Site-specific config loader
└── utils/
    ├── scoring.ts                # Scoring functions
    ├── distribution.ts           # scoreAndDistribute()
    ├── feedPatterns.ts           # Row pattern rotation logic
    ├── interstitials.ts          # Interstitial placement logic
    └── categoryConfig.ts         # Category slug config
```

### 5.2 NewsCard Enhancement — `imagePosition` Prop

```typescript
// apps/web/components/ui/NewsCard.tsx
// Tambahkan prop imagePosition untuk memecah monoton "gambar kiri + teks kanan"

interface NewsCardProps {
  article: NewsCardArticle
  variant?: 'large' | 'medium' | 'minimal' | 'horizontal'
  imagePosition?: 'top' | 'left' | 'right' | 'background' | 'none'  // ← BARU
  site?: string
  priority?: boolean
  size?: 'default' | 'compact'  // ← BARU: compact untuk dense grid
}
```

**Implementasi `imagePosition="right"` (contoh):**
```typescript
// Di dalam NewsCard, tambah branch untuk horizontal + right:
if (variant === 'horizontal' && imagePosition === 'right') {
  return (
    <article className="group relative h-full flex flex-col rounded-xl border ...">
      <Link href={articleHref} className="flex-1 flex gap-4 flex-row-reverse">
        {/* Gambar di KANAN */}
        <div className="relative aspect-[4/3] w-28 flex-shrink-0 overflow-hidden rounded-lg md:w-36">
          <SmartImage src={imageUrl} ... />
        </div>
        {/* Teks di KIRI */}
        <div className="flex flex-1 flex-col justify-center gap-2 py-1 min-w-0">
          <span className={categoryLabelClass}>{primaryCategoryName}</span>
          <h3 className="line-clamp-2 ...">{article.title}</h3>
          <p className="line-clamp-2 text-xs ...">{excerptText}</p>
          <div className="mt-auto ...">{authorName} · {date}</div>
        </div>
      </Link>
    </article>
  )
}
```

### 5.3 Feed Pattern Rotation — `FeedRow.tsx`

Tujuan: setiap baris dalam feed menggunakan pola visual yang berbeda
agar tidak monoton. Sistem rotasi otomatis berdasarkan index baris.

```typescript
// apps/web/components/pages/home/FeedRow.tsx

type RowPattern =
  | 'hero_pair'        // 2 kolom: background + right
  | 'triplet'          // 3 kolom: semua image=top
  | 'asymmetric'       // 2 kolom: background besar + 2 stacked left
  | 'text_heavy'       // 2 kolom: left + right, excerpt visible
  | 'compact_triplet'  // 3 kolom: image=top, no excerpt
  | 'single_feature'   // 1 kolom: full-width background

// Pola rotasi default (berulang setiap 6 baris):
const DEFAULT_PATTERN_ROTATION: RowPattern[] = [
  'hero_pair',        // Row 0: kontras besar
  'triplet',          // Row 1: 3 kartu sejajar
  'asymmetric',       // Row 2: kiri besar + kanan stack
  'text_heavy',       // Row 3: teks dominan
  'compact_triplet',  // Row 4: padat
  'single_feature',   // Row 5: 1 kartu full-width
]

interface FeedRowProps {
  articles: HomeArticle[]
  pattern: RowPattern
  site: string
  rowIndex: number
}

export function FeedRow({ articles, pattern, site, rowIndex }: FeedRowProps) {
  switch (pattern) {
    case 'hero_pair':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="large" imagePosition="background" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" imagePosition="right" site={site} />
        </div>
      )

    case 'triplet':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" imagePosition="top" site={site} />
          ))}
        </div>
      )

    case 'asymmetric':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-7">
            <NewsCard article={articles[0]} variant="large" imagePosition="background" site={site} />
          </div>
          <div className="flex flex-col gap-4 md:col-span-5">
            <NewsCard article={articles[1]} variant="horizontal" imagePosition="left" site={site} />
            <NewsCard article={articles[2]} variant="horizontal" imagePosition="left" site={site} />
          </div>
        </div>
      )

    case 'text_heavy':
      return (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <NewsCard article={articles[0]} variant="horizontal" imagePosition="left" site={site} />
          <NewsCard article={articles[1]} variant="horizontal" imagePosition="right" site={site} />
        </div>
      )

    case 'compact_triplet':
      return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {articles.slice(0, 3).map(a => (
            <NewsCard key={a.id} article={a} variant="medium" imagePosition="top" size="compact" site={site} />
          ))}
        </div>
      )

    case 'single_feature':
      return (
        <div className="grid grid-cols-1">
          <NewsCard article={articles[0]} variant="large" imagePosition="background" site={site} />
        </div>
      )
  }
}
```

### 5.4 Interstitial Components

```typescript
// apps/web/components/pages/home/interstitials/InterstitialTrending.tsx
// "Paling Dibaca" — ala NYT "Most Read"

interface InterstitialTrendingProps {
  articles: HomeArticle[]
  site: string
  variant?: 'numbered_list' | 'compact_cards' | 'horizontal_strip'
}

export function InterstitialTrending({ articles, site, variant = 'numbered_list' }: InterstitialTrendingProps) {
  return (
    <section className="my-8 rounded-2xl bg-brand-grey/30 px-6 py-8 dark:bg-white/[0.02]">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp size={14} className="text-brand-red" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-black dark:text-white">
          Paling Dibaca
        </h3>
      </div>
      <div className="grid gap-0 divide-y divide-black/5 dark:divide-white/5">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            href={`/${site}/artikel/${article.slug}`}
            className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0"
          >
            <span className="tabular-nums font-sans text-3xl font-bold leading-none tracking-tight text-gray-100 group-hover:text-brand-red dark:text-white/5">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 font-sans text-sm font-bold leading-snug tracking-tight text-brand-black group-hover:text-brand-red dark:text-white">
                {article.title}
              </h4>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-brand-text-muted">
                <span>{article.author?.name || 'Redaksi'}</span>
                <span className="opacity-30">·</span>
                <span>{article.readingTimeMin || 3} min baca</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

```typescript
// apps/web/components/pages/home/interstitials/InterstitialRedaksi.tsx
// "Akses Redaksi" — 3 kartu inline (bukan sidebar)

export function InterstitialRedaksi({ whatsappUrl, telegramUrl, emailUrl, siteName }: Props) {
  return (
    <section className="my-8 border-t border-b border-black/5 py-8 dark:border-white/5">
      <div className="mb-5 text-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-red">
          Akses Redaksi
        </h3>
        <p className="mt-2 text-lg font-sans font-bold text-brand-black dark:text-white">
          Pilih jalur tercepat ke redaksi {siteName}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* WhatsApp Card */}
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
             className="group flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-colors hover:bg-emerald-500/10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <SiWhatsapp size={20} />
            </span>
            <div>
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">WhatsApp</span>
              <span className="mt-0.5 block text-sm font-bold text-brand-black dark:text-white">Chat Redaksi</span>
            </div>
            <ArrowRight size={16} className="ml-auto text-emerald-600 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
        {/* Telegram Card */}
        {/* Email Card — serupa */}
      </div>
    </section>
  )
}
```

### 5.5 FeedSection — Interstitial Integration

```typescript
// apps/web/components/pages/home/FeedSection.tsx
// Feed utama yang menyisipkan interstitial di antara baris kartu

interface FeedSectionProps {
  articles: HomeArticle[]          // semua artikel feed (bukan hanya 8)
  trending: HomeArticle[]          // untuk interstitial "Paling Dibaca"
  site: string
  interstitials: InterstitialPlacement[]
  whatsappUrl?: string | null
  telegramUrl?: string | null
  emailUrl?: string
  siteName?: string
  marketData?: MarketData | null
  photoJournal?: HomeArticle[]
}

export function FeedSection({
  articles, trending, site, interstitials,
  whatsappUrl, telegramUrl, emailUrl, siteName,
  marketData, photoJournal
}: FeedSectionProps) {

  // Pisahkan artikel ke baris-baris sesuai pattern
  const rows = chunkIntoRows(articles, DEFAULT_PATTERN_ROTATION)

  // Bangun elemen yang akan di-render: rows + interstitials yang disisipkan
  const elements: React.ReactNode[] = []
  let cardIndex = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const pattern = DEFAULT_PATTERN_ROTATION[i % DEFAULT_PATTERN_ROTATION.length]

    elements.push(
      <FeedRow key={`row-${i}`} articles={row} pattern={pattern} site={site} rowIndex={i} />
    )
    cardIndex += row.length

    // Cek apakah ada interstitial yang harus muncul setelah cardIndex ini
    const matchingInterstitials = interstitials.filter(
      it => it.enabled && it.afterCardIndex <= cardIndex && it.afterCardIndex > cardIndex - row.length
    )

    for (const it of matchingInterstitials) {
      switch (it.widget) {
        case 'trending':
          elements.push(<InterstitialTrending key="it-trending" articles={trending} site={site} />)
          break
        case 'redaksi':
          elements.push(<InterstitialRedaksi key="it-redaksi" whatsappUrl={whatsappUrl} telegramUrl={telegramUrl} emailUrl={emailUrl} siteName={siteName} />)
          break
        case 'market':
          elements.push(<InterstitialMarket key="it-market" data={marketData} />)
          break
        case 'photo':
          elements.push(<InterstitialPhoto key="it-photo" articles={photoJournal} site={site} />)
          break
      }
    }
  }

  return (
    <Container className="py-4 md:py-6">
      {/* Section Header */}
      <div className="mb-6 flex items-center gap-3 border-b border-black/10 pb-4 dark:border-white/5">
        <span className="h-4 w-4 bg-brand-red shadow-lg shadow-brand-red/20" />
        <h3 className="text-base font-sans font-extrabold uppercase tracking-tight text-brand-black dark:text-white md:text-xl">
          Berita Terbaru
        </h3>
      </div>

      {/* Feed rows dengan interstitials */}
      <div className="space-y-6 md:space-y-8">
        {elements}
      </div>

      {/* Load More */}
      <div className="mt-8 border-t border-black/5 pt-8 dark:border-white/5">
        <LoadMoreArticles siteId={siteId} category={category} search={search} initialPage={1} />
      </div>
    </Container>
  )
}
```

---

## 6. Site Configuration Schema

### 5.1 Prisma Model Baru

```prisma
model HomepageConfig {
  id                String   @id @default(uuid())
  siteId            String   @unique

  // Hero
  heroMode          String   @default("MAGAZINE_COVER_550") // SINGLE_HEADLINE | BENTO_4 | BENTO_3 | MAGAZINE_COVER_550
  heroAutoRotate    Boolean  @default(true)
  heroIntervalMs    Int      @default(5000)

  // Scoring weights
  scoreFreshness    Float    @default(0.3)
  scoreEngagement   Float    @default(0.3)
  scoreEditorial    Float    @default(0.3)
  scoreRelevance    Float    @default(0.1)

  // Feed
  feedLayout        String   @default("comfortable") // comfortable | compact | dense
  feedColumns       Int      @default(2)
  showExcerpt       Boolean  @default(true)

  // Category config (JSON)
  opinionCategories Json     @default("[]") // ["opini", "kolom-esai", "analisis"]
  photoCategories   Json     @default("[]") // ["foto-jurnalistik"]
  videoCategories   Json     @default("[]") // ["video", "dokumenter-reportase"]

  // Sidebar widget order (JSON)
  sidebarWidgets    Json     @default('[{"id":"redaksi","enabled":true,"position":1},{"id":"terbaru","enabled":true,"position":2},{"id":"market","enabled":true,"position":3},{"id":"photo","enabled":true,"position":4},{"id":"video","enabled":true,"position":5}]')

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  site              Site     @relation(fields: [siteId], references: [id])
}
```

### 5.2 API Endpoint

```
GET /api/v1/sites/:siteId/homepage-config
PUT /api/v1/sites/:siteId/homepage-config (admin only)
```

### 5.3 Dashboard UI

Tambahkan tab "Homepage Settings" di site settings dashboard:
- Hero mode selector (radio)
- Scoring weights (slider 0-1 untuk masing-masing)
- Feed layout selector (radio)
- Category config (multi-select dari category tree)
- Sidebar widget order (drag-and-drop)

---

## 7. Migration Plan

### Phase 1: Scoring Engine (Non-Breaking)
1. Buat `utils/scoring.ts` dan `utils/distribution.ts`
2. Buat `scoreAndDistribute()` sebagai drop-in replacement untuk `distributeArticles()`
3. Test dengan data yang sama, pastikan output serupa
4. Deploy tanpa mengubah UI

### Phase 2: Komponen Split (Non-Breaking)
1. Pecah `SiteHomePage.tsx` ke komponen terpisah
2. Masing-masing section jadi file sendiri
3. Import dan render di `SiteHomePage.tsx` sebagai orchestrator
4. Pastikan tidak ada perubahan visual

### Phase 3: Layout Variants (Feature Flag)
1. Tambahkan `heroMode` dan `feedLayout` ke site config
2. Implementasi `SingleHeadlineHero` dan `Bento3Hero`
3. Implementasi `compact` dan `dense` feed layout
4. Feature flag: jika tidak ada config, gunakan default

### Phase 4: Editorial Override (Dashboard)
1. Tambahkan `HomepagePlacement` model
2. Tambahkan UI di dashboard untuk menempatkan artikel
3. Update `scoreAndDistribute()` untuk membaca placement
4. Editor bisa override otomatis

### Phase 5: Dashboard Config UI
1. Tambahkan Homepage Config page di dashboard
2. Scoring weight sliders
3. Category config
4. Sidebar widget order

---

## 8. Ringkasan Perubahan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Seleksi artikel | `.slice()` by position | Scoring engine (freshness + engagement + editorial + relevance) |
| Hero | Selalu BENTO_4 | Configurable: MAGAZINE_COVER_550 (default) / SINGLE_HEADLINE / BENTO_4 / BENTO_3 |
| Fokus Redaksi | Fixed 3 kartu | Adaptive 1-4 kartu |
| Feed layout | Fixed 2-kolom, monoton | Pattern rotation (6 pola berganti setiap baris) |
| NewsCard | 4 variant, image selalu atas/kiri | `imagePosition` prop: top/left/right/background/none |
| **Sidebar** | **Kolom 4-kol rigid, membelah halaman** | **Dihapus → jadi interstitial sections (ala NYT/Kompas.id)** |
| Sidebar widgets | Tersembunyi di kolom kanan | Full-width interstitials di antara baris feed |
| Feed + Sidebar | 8+4 grid terpisah | 12-kol penuh, konten terintegrasi |
| Category slugs | Hardcode | Configurable per site |
| Editorial control | `isFeatured` flag only | Full placement override system |
| Code organization | 1 file, 920 baris | 15+ komponen terpisah (sections + interstitials + utils) |
| Trending | API terpisah, overlap possible | Merged pool, hero-excluded |
| Error handling | All-or-nothing | Per-section error boundary |
| Visual rhythm | Pola sama berulang | Setiap baris berbeda: hero_pair → triplet → asymmetric → text_heavy |

---

## 9. Open Questions

1. **Scoring weights default** — Apakah bobot 0.3/0.3/0.3/0.1 sudah tepat, atau perlu disesuaikan untuk konteks media Indonesia?
2. **Hero mode trigger** — Apakah `SINGLE_HEADLINE` harus otomatis terpicu saat `isBreaking`, atau selalu manual?
3. **HomepagePlacement** — Apakah perlu tabel terpisah, atau cukup field di Article model?
4. **A/B testing** — Apakah perlu capability untuk test layout berbeda secara bersamaan?
5. **Cache strategy** — Dengan scoring engine, cache key harus mempertimbangkan weights dan placement. Bagaimana invalidation-nya?
