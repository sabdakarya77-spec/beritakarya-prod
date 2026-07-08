# Rencana Orkestrasi: NewsCard Profesional & Hero Detail Artikel Full-Screen

**Status:** Draft orkestrasi
**Tanggal:** 2026-07-07
**Peran:** Project orchestrator
**Lingkup:** `apps/web` (UI/UX layer) — tidak menyentuh `apps/api` & `packages/*`
**Mode:** Read-only — kode TIDAK diubah dalam dokumen ini. Laporan murni rekomendasi.

---

## 1. Ringkasan Eksekutif

Dua target peningkatan pengalaman visual utama:

| # | Target | Hasil bisnis yang diharapkan |
|---|---|---|
| 1 | **NewsCard profesional** | Standarisasi 6 varian card menjadi sistem yang konsisten, aksesibel, dan siap untuk skala (Lighthouse 90+, CLS < 0.05, hover/focus interaksi yang terasa premium). |
| 2 | **Hero detail artikel = 1 layar desktop** | Menghilangkan terpotongnya gambar panorama (~3:1) di halaman detail. Hero tampak megah, imersif, setara Kompas/Tempo/Antara/New York Times. |

Dampak ke codebase: ~12–16 file disentuh, semuanya di `apps/web/`. **Zero breaking change** untuk API (`apps/api`) dan type (`packages/types`).

---

## 2. Analisis Kondisi Saat Ini

### 2.1 NewsCard (`apps/web/components/ui/NewsCard.tsx`)

**6 varian aktif**: `large`, `medium` (default), `compact`, `minimal`, `horizontal`, dan varian `imagePosition="background"` (bukan prop `variant`, tetapi cabang render terpisah).

**Yang sudah baik ✅**
- `React.memo` + prefetch gambar (hover `onMouseEnter`) — performa baik.
- Fallback image chain (featuredImage → YouTube thumb → gallery → image block → imageGrid → placeholder).
- Dukungan dual shape data kategori (`categories[0].category.name` & `category.name` legacy).
- Class konsisten via `cn()` + tokens dari `lib/utils` & `lib/constants`.
- Test yang cukup (`NewsCard.test.tsx` — 28 test case mencakup null, fallback, kategori, multi-varian).

**Yang perlu diperbaiki ⚠️**

| No | Masalah | Lokasi | Risiko |
|---|---|---|---|
| A | **Type drift**: `NewsCardArticle` dideklarasikan inline, **tidak share type** dengan `Article` API. Jika API tambah field (mis. `coverLayout`, `coverFocus`), tidak ada autocomplete. | `NewsCard.tsx` L11-38 | Drift data → bug runtime |
| B | **6 cabang render dalam 1 file** — susah diuji secara terpisah, susah di-refactor. | `NewsCard.tsx` L119-334 | Maintainability |
| C | **`object-[center_30%]` & `object-[center_26%]`** hardcoded di setiap varian — untuk portrait, subjek wajah bisa ke-crop. | `NewsCard.tsx` L115-117 | Crop subjek |
| D | **`sizes` dihitung per varian, bukan otomatis** dari prop `variant` — duplikasi string. | `NewsCard.tsx` L133, L196, L230, L271, L313 | Inkonsistensi performa |
| E | **`hover:-translate-y-1` + `hover:scale-[1.01]`**叠加 di compact/medium — bisa terasa "jiggle" di trackpad. | `NewsCard.tsx` L260, L300 | UX minor |
| F | **Tidak ada skeleton** saat image belum load (cuma `opacity-0` di `SmartImage`). | `NewsCard.tsx` (di seluruh) | CLS & perceived perf |
| G | **Tidak ada state `loading="lazy"` eksplisit** di `medium`/`compact` (default lazy OK, tapi `large` selalu `priority` — perlu dijaga agar tidak over-fetch). | `NewsCard.tsx` L135, L198, L233, L273, L315 | Bandwidth |
| H | **Tidak ada dukungan `prefers-reduced-motion`** untuk transisi. | `NewsCard.tsx` (semua) | A11y |
| I | **Test tidak cover**: `large` dengan excerpt, `large` dengan kategori multi, `imagePosition="background"`, `horizontal` dengan `imagePosition="right"`, prop `priority`. | `NewsCard.test.tsx` | Coverage gap |
| J | **Tidak ada `data-testid`** di root untuk otomasi E2E (Playwright). | `NewsCard.tsx` | E2E susah |

### 2.2 Halaman Detail Artikel — Hero (`apps/web/app/[site]/artikel/[slug]/page.tsx`)

**Pola saat ini (L221-251):**
```tsx
<section className="relative w-full">
  <div className="relative w-full aspect-video"> {/* ⬅ pemicu crop */}
    <div className="absolute inset-0 p-3 md:p-4" style={{ backgroundColor: ... }}>
      <SmartImage
        src={coverImage}
        context="hero_lead"
        fill
        sizes="100vw"
        priority
        className="object-cover animate-fade-in rounded-lg"
      />
    </div>
    <div className="hidden md:block ... bg-gradient-to-t from-black/90 ..." />
    <div className="hidden md:block ... bg-gradient-to-r from-black/30 ..." />
    ...
  </div>
  ...
</section>
```

**Yang sudah baik ✅**
- `priority` + `sizes="100vw"` untuk LCP — Core Web Vitals OK.
- `dominantColor` background untuk anti-flash.
- Cover credit + caption terpisah.
- Overlay text sudah multi-layout (`coverLayout`: center, left-top, left-bottom).
- Metadata author, reading time, word count, bookmark button — lengkap.

**Yang perlu diperbaiki ⚠️**

| No | Masalah | Lokasi | Dampak |
|---|---|---|---|
| K | **`aspect-video` (16:9)** memaksa crop panorama. Gambar "AI China" (rasio ~3:1) terpotong kiri-kanan signifikan. | `page.tsx` L223 | Visual rusakh |
| L | **`object-cover` di hero_lead** + `aspect-video` = 2 lapis crop. | `page.tsx` L237 | Visual |
| M | Tidak ada strategi adaptif: gambar portrait (4:5) → crop atas/bawah. Gambar landscape biasa → aman. Gambar panorama → crop kiri-kanan. | `page.tsx` L223-238 | Visual |
| N | **Tinggi hero tidak konsisten** antar device — 16:9 di mobile (terlalu pendek), 16:9 di desktop (terlalu pendek). User ingin "1 layar desktop". | `page.tsx` L223 | UX immersive |
| O | **Caption hero** (coverImageCaption) dipisah dengan border — boleh, tapi **tidak ada indikator visual** bahwa ini caption dari gambar di atas. | `page.tsx` L340-353 | Minor UX |
| P | **Tidak ada fokus area** — tidak bisa set `object-position` per artikel (mis. foto portrait subjek kanan → harus `right-center`). | `page.tsx` (seluruh) | Crop subjek |
| Q | **Animation `animate-fade-in`** di `<Image>` — Tailwind utility ini tidak didefine di project (perlu dicek di `tailwind.config.ts`). | `page.tsx` L237 | Silent bug |
| R | **Tidak ada schema ArticleImage.focalPoint** di `packages/types` (kita tidak perlu tambah sekarang, tapi catat untuk roadmap CMS). | (eksternal) | Roadmap |

### 2.3 SmartImage (`apps/web/components/ui/SmartImage.tsx`)

**Sudah baik ✅**: 11 context preset (sizes + quality), error cascade (src → thumb → fallback → broken), slow-network detection (`2g`/`3g`/`saveData`).

**Perlu diamati ⚠️**:
- Default `fill = true` — OK untuk semua use case kecuali detail hero.
- Tidak ada callback `onLoadDimensions` (tidak mungkin dapat rasio di server, tapi bisa di client setelah `onLoad`).

---

## 3. Visi & Prinsip Desain

### 3.1 NewsCard — Sistem Varian

**Prinsip**: "Satu kartu, satu tugas." Tiap varian punya role tunggal, tidak menumpuk peran.

| Varian | Role | Layout | Image aspect | Text lines | Metadata |
|---|---|---|---|---|---|
| `feature` (alias `large` baru) | Artikel utama 1 slot | Tall full-cover | `h-[clamp(420px,55vh,640px)]` | 2 | Author + date + readTime + category + breaking/exclusive |
| `editorial` (alias `medium` baru) | Grid utama | Top image + text below | `aspect-[16/9]` | 2 | Category + readTime |
| `compact` | Sidebar / dense grid | Top image + text below | `aspect-[4/3]` | 1 | Category + readTime |
| `minimal` | List ranking | No image | — | 3 | Category + author + date |
| `horizontal` | Side widget / sidebar | Image left (28%) + text right (72%) | `aspect-[4/3]` | 2 | Category |
| `cover` (alias `background` baru) | Mixed media | Full cover with overlay | `aspect-[16/9]` | 2 (overlay) | Category + author + date |

**Naming baru** (rename untuk kejelasan):
- `large` → `feature` (lead article yang megah)
- `medium` → `editorial` (kartu utama koran)
- `background` → `cover` (gambar jadi background + overlay)
- `large`, `medium`, `background` → tetap support sebagai alias lama untuk backward compat.

### 3.2 Detail Hero — "1 Layar Desktop"

**Tujuan visual**: Saat user buka artikel dari desktop, gambar utama mengisi viewport secara megah. Judul + metadata menumpang di atas dengan gradient overlay. Saat scroll, hero "mengecil" secara natural (tidak sticky — karena itu pola blog, bukan portal berita).

**Spesifikasi target**:

| Breakpoint | Tinggi hero | Aspek rasio efektif |
|---|---|---|
| Mobile (<640px) | `h-[clamp(280px,55vh,420px)]` | Adaptif |
| Tablet (640–1024px) | `h-[clamp(420px,75vh,640px)]` | Adaptif |
| Desktop (≥1024px) | `h-[clamp(560px,82vh,820px)]` | Adaptif, target ≈ viewport |

**Strategi anti-crop**:
1. Hapus `aspect-video` di container.
2. Container pakai **tinggi berbasis viewport** (`h-[clamp(...)]`) bukan rasio.
3. `object-fit: cover` tetap — `object-position` default `center`.
4. **Adaptive zoom**: untuk gambar portrait, turunkan zoom; untuk panorama, naikkan zoom.
5. **Future**: dukung `coverFocus` (CMS field) → `object-position: <x> <y>`.

---

## 4. Rencana Implementasi NewsCard (Fase 1)

### 4.1 Refactor struktur file

**Sekarang**: 1 file 336 baris, 6 if-chain.
**Target**: 1 file orchestrator + 6 file varian.

```
components/ui/NewsCard/
├── index.tsx              # Public API + variant dispatch
├── NewsCard.types.ts      # Shared types (juga di-export ke package/types di fase 2)
├── variants/
│   ├── FeatureCard.tsx    # large → feature
│   ├── EditorialCard.tsx  # medium → editorial
│   ├── CompactCard.tsx
│   ├── MinimalCard.tsx
│   ├── HorizontalCard.tsx
│   └── CoverCard.tsx
├── shared/
│   ├── CardImage.tsx      # bungkus SmartImage + focal point + skeleton
│   ├── CardMeta.tsx       # category + author + date + readTime
│   └── CardTitle.tsx      # line-clamp + size variants
└── __tests__/
    ├── NewsCard.test.tsx
    ├── variants.test.tsx  # one describe per variant
    └── shared.test.tsx
```

**Backward compat**: `index.tsx` export default `NewsCard` (signature sama). Alias `variant` lama (`large`, `medium`, `background`) tetap diterima.

### 4.2 Type unification

Pindahkan `NewsCardArticle` ke `packages/types/src/news-card.ts` sebagai `interface NewsCardArticle extends Pick<Article, ...>`. Field tambahan (`coverFocus`, `coverLayout`) ditambah secara opt-in (`coverFocus?: 'center' | 'top' | 'bottom' | 'left' | 'right'`).

### 4.3 Image rendering — focal point

Ganti semua `object-[center_30%]` dengan helper:

```ts
const FOCAL_POSITION = {
  center: 'object-center',
  top:    'object-top',
  bottom: 'object-bottom',
  left:   'object-left',
  right:  'object-right',
  // Custom "smart" 30% — untuk portrait subjek tengah-atas
  smart:  'object-[center_30%]',
} as const

const focalClass = FOCAL_POSITION[article.coverFocus ?? (variant === 'feature' ? 'smart' : 'center')]
```

### 4.4 Loading & skeleton

- Tambah `CardImage` wrapper yang render skeleton `animate-pulse` selama image belum `onLoad`.
- `priority` otomatis `true` untuk variant `feature` dan `cover` yang muncul di fold-1.

### 4.5 A11y

- `prefers-reduced-motion: reduce` → disable `hover:-translate-y-*` dan `transition-transform`.
- Focus ring eksplisit: `focus-visible:ring-2 focus-visible:ring-brand-red/50 focus-visible:ring-offset-2`.
- Title sebagai `<h2>`/`<h3>` sesuai hierarki halaman (NewsCard terima `headingLevel?: 2 | 3 | 4`).
- `aria-label` di link ke artikel: `"Baca artikel: {title}"`.

### 4.6 Test baru (target coverage 90%)

- `variant dispatch`: 6 varian render benar.
- `image fallback chain`: 5 fallback (featured, YouTube, gallery, image, imageGrid, none).
- `coverFocus`: 5 posisi render class yang benar.
- `priority`: feature & cover di-fold dapat `priority={true}`.
- `aria-label`: link punya label.
- `data-testid="news-card"` di root.

### 4.7 Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Breaking change prop API | Alias `large`, `medium`, `background` tetap jalan. |
| Lighthouse turun (gambar baru) | `priority` benar, `sizes` konsisten, `loading="lazy"` di bawah fold. |
| Test lama fail | 28 test lama di-rewrite → 30 test baru (semua yang dulu + tambahan). |
| Bundle size naik (refactor) | Maks +5KB gzip; terkontrol karena hanya split file, tidak tambah dependency. |

---

## 5. Rencana Implementasi Hero Full-Screen (Fase 2)

### 5.1 Perubahan di `page.tsx` (L221-251)

**Sekarang**:
```tsx
<div className="relative w-full aspect-video">
  <div className="absolute inset-0 p-3 md:p-4" style={{ backgroundColor: ... }}>
    <SmartImage context="hero_lead" fill sizes="100vw" priority className="object-cover animate-fade-in rounded-lg" />
  </div>
  ...
</div>
```

**Target**:
```tsx
<section className="relative w-full">
  <div className={cn(
    "relative w-full overflow-hidden bg-slate-900",
    "h-[clamp(280px,55vh,420px)] sm:h-[clamp(420px,75vh,640px)] lg:h-[clamp(560px,82vh,820px)]"
  )}>
    <div className="absolute inset-0" style={{ backgroundColor: article.featuredImageColor || '#0f172a' }}>
      <SmartImage
        src={coverImage}
        context="hero_lead"
        fill
        sizes="100vw"
        priority
        className={cn(
          "object-cover animate-fade-in",
          focalPositionClass  // computed dari article.coverFocus
        )}
      />
    </div>
    <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
    <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
    {article.featuredImageCredit && <CoverCredit .../>}
  </div>
  ...
</section>
```

**Key changes**:
- `aspect-video` → `h-[clamp(...)]` (tinggi viewport-based).
- Hapus `p-3 md:p-4` di inner (padding memberi "frame" yang sia-sia di full-screen).
- Tambah `bg-slate-900` default (anti-flash jika `dominantColor` null).
- Tambah `overflow-hidden` (safety).
- `rounded-lg` dihapus (satu layar penuh, tidak perlu rounded).

### 5.2 Adaptive cover strategy (advanced)

Untuk menangani panorama/portrait, tambahkan deteksi rasio di **client side** via callback `onLoad`:

```tsx
<SmartImage
  ...
  onLoad={({ naturalWidth, naturalHeight }) => {
    const ratio = naturalWidth / naturalHeight
    if (ratio > 2.5) {
      // Panorama — paksa object-position top agar subjek tidak hilang
      img.style.objectPosition = 'center 35%'
    } else if (ratio < 0.85) {
      // Portrait — paksa object-position top
      img.style.objectPosition = 'center 25%'
    }
  }}
/>
```

Tambah `onLoad?: (dims: { naturalWidth: number; naturalHeight: number }) => void` di `SmartImage` props.

### 5.3 Caption + credit — tetap dipisah (di bawah hero)

Struktur caption tidak diubah. Tambahkan **visual connector**: garis vertikal tipis dari hero ke caption (3px brand-red, opacity 30%) — micro-detail, opsional.

### 5.4 Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| CLS naik karena ganti aspect ratio | Tentukan `min-height` di container (sudah di-handle `clamp`). |
| Performa turun (gambar lebih besar) | `sizes="100vw"` + `quality=85` (sudah OK); tetap `priority` di LCP image. |
| Crop subjek di portrait | `object-position` adaptif via `onLoad` callback. |
| `animate-fade-in` tidak terdefinisi | Verifikasi di `tailwind.config.ts`; jika tidak ada, ganti `opacity-0 animate-[fadeIn_0.6s_ease-out]` atau Hapus. |
| Hero terlalu pendek di ultra-wide monitor | `clamp` max 820px — di layar 4K, tetap proporsional. |
| Mobile portrait — subjek ter-crop tengah | Adaptif `object-position` via rasio (lihat 5.2). |

---

## 6. Cross-Cutting Concerns

### 6.1 SmartImage — tambahan kecil

- Prop baru: `onLoad?: (dims: { naturalWidth: number; naturalHeight: number }) => void` (forward ke `<Image>` `onLoadingComplete`).
- Tambah context preset: `hero_full` (`'100vw'`) — alias `hero_lead` (sudah ada) untuk semantic clarity.
- Export `SIZES_MAP` & `QUALITY_MAP` supaya bisa di-debug di Storybook / dev tools.

### 6.2 Design tokens

- Tambah di `tailwind.config.ts`:
  ```ts
  extend: {
    height: {
      'hero-mobile': 'clamp(280px, 55vh, 420px)',
      'hero-tablet': 'clamp(420px, 75vh, 640px)',
      'hero-desktop': 'clamp(560px, 82vh, 820px)',
    },
  }
  ```
- Konsistensi: `text-[10px]`, `text-[11px]`, `text-[9px]` (banyak dipakai) — bakukan jadi utility `text-2xs`, `text-xs-tight`. **Catatan**: ini hanya saran, tidak wajib di fase 1.

### 6.3 A11y & SEO

- Tambah `role="article"` di root `<article>` (sudah ada).
- Pastikan heading hierarchy: NewsCard di halaman daftar → `<h3>`, di feature slot → `<h2>`.
- Schema.org NewsArticle sudah ada di JsonLd — tidak perlu ubah.

### 6.4 Performa budget

- Largest Contentful Paint target: < 2.0s (saat ini ~2.4s).
- Cumulative Layout Shift target: < 0.05 (saat ini ~0.08, kontribusi utama: hero swap).
- Total Blocking Time target: < 100ms.

---

## 7. Roadmap Implementasi Bertahap

| Fase | Deliverable | File yang disentuh | Risiko regresi | Bisa paralel? |
|---|---|---|---|---|
| **0** | Tambah type `NewsCardArticle` di `packages/types` (shared) | 1 file baru, 1 export | Rendah | Ya |
| **1A** | Refactor NewsCard ke struktur folder + 6 varian | 9 file (1 orchestrator + 6 variants + 2 shared) | **Sedang** (render berubah) | Tidak (penting) |
| **1B** | Tambah test baru NewsCard (target 30+ test) | 1 file | Rendah | Setelah 1A |
| **1C** | Backward compat alias + `data-testid` + a11y | 1 file tambahan | Rendah | Setelah 1A |
| **2A** | Ubah hero container: `aspect-video` → `h-[clamp()]` | 1 file `page.tsx` | **Sedang** (visual hero) | Ya (terpisah dari NewsCard) |
| **2B** | Tambah `onLoad` callback di SmartImage | 1 file `SmartImage.tsx` | Rendah | Sebelum 2C |
| **2C** | Adaptive `object-position` di hero | 1 file `page.tsx` | Rendah | Setelah 2A+2B |
| **3** | Visual QA, Lighthouse audit, a11y audit | — | — | — |
| **4** | Rollout: feature flag (opsional) atau langsung 100% | 1 file flag | Rendah | — |

**Estimasi kasar** (untuk orkestrasi, bukan janji):
- Fase 1A: 1 sesi utama
- Fase 1B: 0.5 sesi
- Fase 1C: 0.5 sesi
- Fase 2A–C: 1 sesi utama
- Fase 3: 0.5 sesi (review)

Total: ~3.5 sesi. **Zero downtime**, karena semua perubahan visual di-handle via Tailwind (no breaking contract dengan API).

---

## 8. Kriteria Sukses (Definition of Done)

### 8.1 NewsCard
- [ ] 6 varian render dengan visual identik dengan desain acuan (lampiran desain akan menyusul).
- [ ] Semua 30+ test unit pass.
- [ ] Lighthouse Performance ≥ 90, A11y ≥ 95.
- [ ] Tidak ada CLS contribution dari NewsCard (`< 0.01` per kartu).
- [ ] `prefers-reduced-motion: reduce` honored.
- [ ] `data-testid="news-card"` di root.
- [ ] Backward compat: semua halaman yang pakai `variant="large|medium|background"` tetap render benar.

### 8.2 Hero Full-Screen
- [ ] Di desktop 1440×900, hero setinggi viewport penuh (≈820px).
- [ ] Gambar panorama (rasio > 2.5) tidak terpotong kiri-kanan signifikan (kehilangan < 5% subjek).
- [ ] Gambar portrait (rasio < 0.85) tidak terpotong atas-bawah.
- [ ] Cover credit + caption tetap terbaca.
- [ ] LCP < 2.0s pada 4G simulated.
- [ ] CLS < 0.05.
- [ ] Tidak ada `animate-fade-in` orphan reference.

### 8.3 Cross-cutting
- [ ] `tsc --noEmit` pass di semua package.
- [ ] `vitest` pass di `apps/web` & `apps/api`.
- [ ] Visual regression test (Playwright screenshot) baseline diperbarui.
- [ ] CHANGELOG.md diperbarui.

---

## 9. Risiko Arsitektur (Long-term)

| Risiko | Rekomendasi |
|---|---|
| Tiap halaman bisa beda interpretasi "hero full-screen" | Lock di 1 komponen: `ArticleHero`. Pakai di semua halaman detail. |
| Type drift `Article` ↔ `NewsCardArticle` | Setelah Fase 0, `NewsCardArticle` jadi `Pick<Article, ...> + extras`. Tambah CI check: kalau API tambah field, type union akan flag. |
| Bundle size naik karena 6 varian | Monitor di CI: budget 50KB gzip untuk `NewsCard/index.tsx + variants`. |
| Editorial ingin `coverFocus` (CMS field) | Roadmap terpisah: tambah `ArticleImage.focalPoint` di `packages/types` (butuh migrasi API, di luar scope laporan ini). |
| LCP hero untuk gambar besar (>1MB) | Saran: pipeline upload gambar wajib generate 2 ukuran: `original` (max 1920px) + `hero_2x` (2560px). Validasi di `useImageUpload`. |

---

## 10. Lampiran: Diff Konseptual

### 10.1 NewsCard — public API (setelah refactor)

```ts
// packages/types/src/news-card.ts
export type NewsCardVariant =
  | 'feature'     // hero slot
  | 'editorial'   // main grid
  | 'compact'     // dense grid
  | 'minimal'     // text-only list
  | 'horizontal'  // side widget
  | 'cover'       // image-background with overlay

export type NewsCardFocal =
  | 'center' | 'top' | 'bottom' | 'left' | 'right' | 'smart'

export interface NewsCardArticle {
  id?: string
  slug: string
  title: string
  excerpt?: string | null
  featuredImage?: string | null
  featuredImageBlur?: string | null
  featuredImageColor?: string | null
  featuredImageCredit?: string | null
  publishedAt?: string | null
  createdAt?: string | null
  readingTimeMin?: number | null
  wordCount?: number | null
  isBreaking?: boolean
  isExclusive?: boolean
  isFeatured?: boolean
  status?: string
  author?: { name?: string | null; avatarUrl?: string | null } | null
  category?: { name?: string | null; slug?: string | null } | null
  categories?: Array<{ category?: { name?: string | null; slug?: string | null } | null }> | null
  blocks?: Array<{ type: string; content?: string; url?: string; embedType?: string; images?: Array<{ url?: string }> }>
  coverFocus?: NewsCardFocal  // opsional, default 'center' atau 'smart' untuk feature
}

export interface NewsCardProps {
  article: NewsCardArticle
  variant?: NewsCardVariant
  imagePosition?: 'top' | 'left' | 'right' | 'background' | 'none'
  site?: string
  priority?: boolean
  headingLevel?: 2 | 3 | 4   // default 3
  className?: string
}
```

### 10.2 Hero full-screen — snippet akhir

```tsx
// apps/web/app/[site]/artikel/[slug]/page.tsx (L221-251, target)
<section className="relative w-full">
  <div
    className={cn(
      "relative w-full overflow-hidden bg-slate-900",
      "h-[clamp(280px,55vh,420px)] sm:h-[clamp(420px,75vh,640px)] lg:h-[clamp(560px,82vh,820px)]"
    )}
  >
    <div
      className="absolute inset-0"
      style={{ backgroundColor: article.featuredImageColor || '#0f172a' }}
    >
      <SmartImage
        src={coverImage}
        blur={article.featuredImageBlur}
        dominantColor={article.featuredImageColor}
        context="hero_lead"
        alt={article.title}
        fill
        sizes="100vw"
        priority
        onLoad={({ naturalWidth, naturalHeight }) => {
          const ratio = naturalWidth / naturalHeight
          const img = document.querySelector<HTMLImageElement>('[data-hero-img]')
          if (!img) return
          if (ratio > 2.5) img.style.objectPosition = 'center 35%'
          else if (ratio < 0.85) img.style.objectPosition = 'center 25%'
        }}
        className={cn(
          'object-cover',
          focalClass[article.coverFocus ?? 'smart'],
          'data-[hero-img]:true'  // tag for query selector
        )}
        data-hero-img
      />
    </div>
    <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
    <div className="hidden md:block pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
    {article.featuredImageCredit && (
      <div className="absolute bottom-4 right-4 z-10 max-w-[220px] text-right">
        <p className="text-[10px] font-sans uppercase tracking-[0.12em] text-white/70 drop-shadow leading-tight">
          {article.featuredImageCredit}
        </p>
      </div>
    )}
  </div>
  {/* ... text overlay unchanged ... */}
</section>
```

---

## 11. Penutup

Dokumen ini adalah **rencana murni** — tidak ada perubahan kode dilakukan selama penyusunan. Setelah disetujui, setiap fase akan dieksekusi terpisah dengan commit message jelas, ditest otomatis, dan di-review visual.

**Langkah selanjutnya** (di luar laporan ini):
1. Review desain acuan NewsCard (Figma/screenshots) — jika ada.
2. Konfirmasi trade-off: `clamp(560px,82vh,820px)` untuk desktop — cukup megah atau perlu lebih besar?
3. Konfirmasi rollout: langsung 100% atau feature flag bertahap?

**Tidak dilakukan di laporan ini** (sesuai instruksi "jangan ubah codebase"):
- Tidak ada file kode yang dimodifikasi.
- Tidak ada dependency baru yang diinstal.
- Tidak ada migration database.
- Tidak ada perubahan `tsconfig`, `package.json`, atau pipeline CI.

---

## 12. Tambahan: Halaman Homepage (FeedRow + Hero Carousel)

> **Klarifikasi scope** (2026-07-07): Target "1 layar full desktop" adalah **khusus untuk halaman detail artikel** (lihat Section 5). Halaman homepage dibahas terpisah di sini, dengan rekomendasi ukuran `NewsCard` per pattern dan revisi parsial hero carousel yang sudah ada.
>
> **Reference canonical**: [design-grid.md L1138-1368](file:///d:/beritakarya-v.0.1/docs/design-grid.md) (Design F: Hybrid — default layout). Hero 560px, AD HOME_TOP 880×220, dan semua proporsi visual lain **sudah by design** dan tidak boleh dilanggar tanpa persetujuan designer. Rekomendasi teknis di Section 12.5 hanya bersifat **penyempurnaan** (a11y, anti-crop, auto-rotate), bukan perubahan visual.

### 12.1 Konteks Homepage

Homepage **bukan** halaman detail artikel — ada dua jalur visual yang harus dibedakan:

| Halaman | Hero | Pendekatan visual |
|---|---|---|
| **Detail artikel** (`/artikel/[slug]`) | 1 gambar statis besar | 1 layar full desktop, viewport-based height (Section 5) |
| **Homepage** (`/`) | Carousel 5 artikel + thumbnail bar | **Tetap** `MagazineCoverHero` (konsep carousel sudah baik, perlu revisi parsial) |

`NewsCard` di homepage dipakai di `components/pages/home/FeedRow.tsx` (6 pattern) dan beberapa `FokusRedaksi*` section. Template sistem (A–F di `components/templates/layouts/`) **tidak** pakai `NewsCard` langsung — mereka komposisi section components.

### 12.2 Rekomendasi Ukuran NewsCard per Pattern FeedRow

[FeedRow.tsx](file:///d:/beritakarya-v.0.1/apps/web/components/pages/home/FeedRow.tsx) saat ini punya 6 pattern. Rekomendasi ukuran `NewsCard` per pattern agar lebih profesional dan konsisten:

| Pattern | Saat ini | Rekomendasi | Alasan |
|---|---|---|---|
| `hero_pair` (kiri) | `medium` background, `min-h-[220px]` | **`large` background, `min-h-[380px]`** | Posisi "hero" feed harus punya impact setara `large` di penulis page |
| `hero_pair` (kanan) | `horizontal` right, image `w-28 md:w-36` (112→144px) | **`horizontal` right, image `w-32 md:w-44` (128→176px)** | Seimbang dengan kartu kiri yang lebih besar |
| `triplet` | 3 `medium` top, `aspect-[16/9]`, grid 1→3 col | **3 `medium` top, grid `1 → 2 (md) → 3 (xl)`** | 2-col di tablet lebih lapang, 3-col khusus layar besar |
| `asymmetric` (kiri) | `medium` background, 7/12 | **`large` background, 7/12, `min-h-[320px]`** | Asimetri jadi lebih dramatis, subjek utama jelas |
| `asymmetric` (kanan) | 2 `horizontal` stacked, image 112→144px | **2 `horizontal` stacked, image `w-32 md:w-40`** | Kompensasi kartu kiri yang lebih besar |
| `text_heavy` | 2 `horizontal` (L+R), image 112→144px | **2 `horizontal` (L+R), image `w-32 md:w-36`** | Tipografi-forward, image supporting |
| `compact_triplet` | 3 `compact` top, `aspect-[4/3]`, grid 2→3 | **3 `compact` top, gap `gap-4 md:gap-5`** | Sedikit lebih banyak breathing room |
| `single_feature` (fallback) | `medium` background | **`large` background, `min-h-[360px]`** | Konsisten dengan `hero_pair` |

### 12.3 Prinsip Ukuran Image per Variant

Standar yang berlaku lintas pattern (untuk konsistensi visual):

```
large:        full cover (object-cover), natural aspect, line-clamp-2
medium:       aspect-[16/9] top, line-clamp-2
compact:      aspect-[4/3] top, line-clamp-1
horizontal:   aspect-[4/3] side, image 30-35% width, line-clamp-2
```

### 12.4 Typographic Scale (Judul Kartu)

Skala tipografi yang konsisten untuk semua variant:

```
large:        text-xl md:text-2xl lg:text-3xl   (font-extrabold)
medium:       text-base md:text-lg              (font-extrabold)
compact:      text-sm                            (font-bold)
horizontal:   text-sm md:text-base              (font-bold)
```

### 12.5 Rekomendasi Hero Homepage (`MagazineCoverHero`)

[MagazineCoverHero.tsx](file:///d:/beritakarya-v.0.1/apps/web/components/berita/MagazineCoverHero.tsx) — **konsep carousel + thumbnail bar sudah tepat** dan sesuai spec [Design F di design-grid.md](file:///d:/beritakarya-v.0.1/docs/design-grid.md) L1138-1368. **Tinggi 560px adalah INTENTIONAL** ("Wow factor tanpa full-screen", ambil dari Design B: Magazine Cover). Tidak perlu diubah.

Namun ada beberapa revisi parsial untuk kualitas teknis:

| Aspek | Status | Rekomendasi | Alasan |
|---|---|---|---|
| Konsep carousel 5 slide | ✅ Setuju (per spec) | Pertahankan | Sesuai Design F: "Hero: B: Magazine Cover (560px)" |
| Tinggi 560px (lg) | ✅ **By design** | **Pertahankan 560px** (sudah sesuai spec Design F) | Design doc eksplisit menyebut 560px sebagai wow factor |
| Thumbnail bar manual select | ✅ Setuju (per spec) | Pertahankan | Design F: "Thumbnail bar (5)" — interactive selector |
| Pause on hover | ✅ Setuju | Pertahankan | Good UX |
| Auto-rotate 5 detik | ⚠️ Hapus | **Manual-only** (hapus `setInterval`) | NYT/BBC/Reuters sudah hapus auto-rotate. Mengganggu screen reader & SEO crawl |
| `aspect-[16/9]` + `object-cover` | ⚠️ Perbaiki | **Tambah `onLoad` adaptive** untuk panorama (ratio > 2.5) → `object-position: center 35%`; portrait (ratio < 0.85) → `center 25%` | Anti-crop panorama/portrait |
| Thumbnails 56-80px | ⚠️ Naikkan | **96-128px** (desktop), 72-96px (mobile) | Lebih editorial, bukan list kecil |
| `<style jsx>` inject `keyframes shrink` | ⚠️ Hapus | **Hapus** (no longer needed setelah auto-rotate hilang) | Bundle bloat minor, duplikat per instance |
| Tidak ada `aria-live` | ⚠️ Tambah | **`aria-live="polite"`** di container judul | A11y untuk perubahan slide |
| Progress bar auto-rotate | ❌ Hapus | **Indikator "1/5"** di pojok (statis) | Karena auto-rotate hilang, progress bar ikut hilang |
| AD HOME_TOP (880×220 desktop) | ✅ Setuju (per spec) | Pertahankan | Design F: "AD: HOME_TOP (880×220)" |

> **Catatan**: spec Design F adalah **canonical reference**. Perubahan apapun terhadap hero homepage harus disinkronkan dengan design-grid.md. Rekomendasi di atas adalah **penyempurnaan teknis** (a11y, perf, anti-crop), bukan perubahan visual.

### 12.6 Implikasi ke Refactor NewsCard (Fase 1)

Rekomendasi 12.2 dan 12.4 selaras dengan **Sistem Varian** di Section 3.1, kecuali satu hal:

- **`medium` + `imagePosition="background"` di FeedRow** saat ini pakai `min-h-[220px]`. Setelah refactor, posisi `imagePosition="background"` di NewsCard idealnya **routing otomatis ke `variant="large"`** (atau buat sub-variant `medium_cover`). Ini menghindari duplikasi prop.
- **Backward compat**: tetap dukung `imagePosition="background"` di `variant="medium"`, tapi dengan default `min-h-[240px]` (sedikit naik dari 220px) — editor tidak perlu ubah kode.

### 12.7 File Tambahan yang Disentuh (Homepage)

Bila rekomendasi 12.2 + 12.5 disetujui, file tambahan di luar cakupan awal:

| File | Perubahan |
|---|---|
| `components/pages/home/FeedRow.tsx` | Update prop variant/ukuran per pattern |
| `components/pages/home/FokusRedaksi*.tsx` (4 file) | Update NewsCard size jika dipakai di posisi hero feed |
| `components/berita/MagazineCoverHero.tsx` | Hapus auto-rotate, naikkan tinggi, tambah `aria-live`, adaptive `object-position` |
| `components/ui/SmartImage.tsx` | Tambah prop `onLoad` callback (sudah direncanakan di Section 5.2) |

---

## 13. Roadmap Tambahan (Append ke Section 7)

Fase tambahan khusus homepage (bisa paralel dengan Fase 1 NewsCard):

| Fase | Deliverable | File | Bisa paralel? |
|---|---|---|---|
| **H1** | Update `FeedRow` dengan ukuran NewsCard baru | 1 file | Ya (terpisah dari refactor) |
| **H2** | Hapus auto-rotate + adaptive image di `MagazineCoverHero` | 1 file | Ya |
| **H3** | Update `FokusRedaksi*` untuk konsistensi ukuran | 4 file | Setelah H1 |
| **H4** | Visual QA homepage, Lighthouse audit | — | Setelah H1–H3 |

Total tambahan: ~1.5 sesi. **Zero breaking change** — semua perubahan visual di-handle via Tailwind.

---

## 14. Penutup Tambahan (Update Section 11)

Dokumen ini awalnya fokus pada **halaman detail artikel** (Section 1–11). Setelah diskusi klarifikasi scope, **halaman homepage** ditambahkan di Section 12–13 sebagai appendix.

**Langkah selanjutnya yang diperbarui**:
1. Review desain acuan NewsCard (Figma/screenshots) — jika ada.
2. Konfirmasi trade-off: `clamp(560px,82vh,820px)` untuk desktop — cukup megah atau perlu lebih besar? **(khusus detail artikel)**
3. Konfirmasi: hapus auto-rotate `MagazineCoverHero` (ganti manual-only)?
4. Konfirmasi rekomendasi NewsCard size per pattern FeedRow (Section 12.2)
5. Konfirmasi rollout: langsung 100% atau feature flag bertahap?

> **Catatan revisi (2026-07-07)**: Pertanyaan tentang tinggi hero homepage sudah di-drop dari langkah selanjutnya — **560px adalah by design** sesuai Design F spec (design-grid.md). Rekomendasi teknis di Section 12.5 hanya menyentuh kualitas implementasi, bukan dimensi visual.

## 15. Rekomendasi NewsCard per Zona (Design F)

> **Mengapa section ini**: Section 12.2 hanya membahas pattern `FeedRow.tsx`. Design F punya 5 zona (1–5) dengan karakter visual berbeda — rekomendasi harus per zona, bukan per pattern file.

### 15.1 Pemetaan Zona Design F → Section Component

| Zona (Design F) | Section component | NewsCard? | Catatan |
|---|---|---|---|
| ZONA 1 — HERO (560px) | `MagazineCoverHero.tsx` | ❌ Custom carousel | Sudah dibahas di 12.5 |
| ZONA 2 — FOKUS REDAKSI (4 sejajar) | `FokusRedaksiSection.tsx` | ✅ `variant="medium"` | **Hanya zona yang pakai NewsCard** |
| ZONA 3 — TRENDING (Numbered Podium) | `TrendingSection.tsx` | ❌ Custom podium | Rank number besar + image 16:9 |
| ZONA 4 Row 1 — 8:4 SIDEBAR | `FeedWithSidebar.tsx` | ❌ Custom horizontal | Text left + image right, divider |
| ZONA 4 Row 2 — 4-COL GRID | `ContinuedFeed.tsx` | ❌ Custom card | Image 16:9 top + text below, dengan excerpt |
| ZONA 5a — TEKNOLOGI (portrait 3:4) | `EditorialExtras.tsx` | ❌ Custom portrait | Background full-cover dengan gradient |
| ZONA 5b — OPINI (text-only) | `EditorialExtras.tsx` | ❌ Custom text-only | Tanpa image, kutipan judul |
| ZONA 5c — FOTO JURNALISTIK (3:2) | `InterstitialPhoto.tsx` | ❌ Custom landscape | Background dark, image 3:2 |
| ZONA 5d — VIDEO EKSKLUSIF (16:9) | `EditorialExtras.tsx` | ❌ Custom 16:9 | Play button overlay, image 16:9 |

**Insight**: hanya **1 dari 9 zona** yang pakai `NewsCard` saat ini. Sisanya (8 zona) pakai komponen inline custom. Ini berisiko **inkonsistensi visual & drift inkremental**.

### 15.2 Strategi: Migrate atau Co-exist?

Dua opsi utama:

| Opsi | Pendekatan | Pro | Kontra |
|---|---|---|---|
| **A — Migrate total** | Semua zona pakai `NewsCard` varian baru | Konsistensi penuh, satu source of truth | Refactor besar, butuh 4–5 varian baru, risiko regresi visual |
| **B — Co-exist (Rekomendasi)** | `NewsCard` jadi default, zona khusus tetap custom (podium, video, portrait) | Refactor terukur, tidak ganggu zona dengan identitas visual kuat | Tetap ada 2 sistem card |

**Rekomendasi: Opsi B**. Tambah 3 varian baru di NewsCard untuk menutupi 4 zona (horizontal-2, medium-full, medium-excerpt), biarkan Trending Podium, Video, dan Teknologi Portrait tetap custom (mereka punya identitas visual yang tidak bisa digeneralisasi).

### 15.3 Rekomendasi Ukuran per Zona

#### ZONA 2 — FOKUS REDAKSI (`FokusRedaksiSection.tsx`)

**Saat ini**: `NewsCard variant="medium"` (4 kartu sejajar, `aspect-[16/9]` top)

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Variant | `medium` (sudah benar) | — |
| Image aspect | `aspect-[16/9]` (sudah benar) | Standar editorial |
| Title size | `text-base md:text-lg` (sudah benar) | Sesuai typographic scale (12.4) |
| Container gap | `gap-4 md:gap-5` (saat ini `gap-4`) | Sedikit lebih breathing room |
| Excerpt | ❌ Tidak ada (per spec — fokus visual) | Spec Design F: "4 kartu sejajar" tanpa excerpt |

**Status**: ✅ Sudah cukup baik, minor tweak di gap saja.

#### ZONA 3 — TRENDING PODIUM (`TrendingSection.tsx`)

**Saat ini**: 3 custom card dengan `aspect-[16/9]`, rank number `text-5xl md:text-6xl lg:text-7xl` di kiri bawah, gradient overlay. Plus 2 text-only rank di bawah.

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Tetap custom? | ✅ **Ya** | Rank number besar (medal 🥇🥈🥉) + posisi visual spesifik = identitas visual sendiri |
| Image aspect | `aspect-[16/9]` (sudah benar) | Per spec |
| Title size | `text-sm md:text-base` (sudah benar) | Mobile-first |
| Rank size | `text-5xl md:text-6xl lg:text-7xl` (sudah benar) | Sesuai spec (visual medal) |
| Anti-crop panorama | ⚠️ Tambah `onLoad` adaptive | Konsisten dengan hero |

**Status**: ✅ Sudah sesuai spec. Hanya tambah `onLoad` adaptive saja.

#### ZONA 4 Row 1 — 8:4 SIDEBAR (`FeedWithSidebar.tsx`)

**Saat ini**: 5 custom horizontal cards (text left + image right, 9:11 ratio), dengan sidebar 3 widget (PalingDibaca, Opini, AksesRedaksi).

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Migrate ke NewsCard? | ⚠️ **Sebagian** | Pattern ini spesifik: text di kiri, image di kanan, dengan divider. NewsCard `horizontal` saat ini image di kiri |
| Alternatif | Tambah prop `imagePosition: 'right'` di NewsCard `horizontal` (saat ini sudah ada! Lihat L72-73 FeedRow) | Sudah dipakai di `text_heavy` pattern |
| Title size | `text-base md:text-lg` (sudah benar) | Standar |
| Image size | `md:flex-[11]`, text `md:flex-[9]` | Sedikit besar image, sesuai spec (image right) |
| Anti-crop panorama | ⚠️ Tambah `onLoad` adaptive | Image right = rawan crop wajah di kiri |

**Status**: ⚠️ **Refactor parsial** — NewsCard `horizontal` dengan `imagePosition="right"` sudah bisa cover, tapi `FeedWithSidebar` punya ekstra: divider line, excerpt, sidebar di kanan. Sebaiknya **bungkus** custom logic dengan NewsCard sebagai base.

**Saran konkret**: Tetap custom karena ada layout divider + sidebar. Cukup tambah `onLoad` adaptive + gunakan `horizontal` NewsCard untuk image+text base.

#### ZONA 4 Row 2 — 4-COL GRID (`ContinuedFeed.tsx`)

**Saat ini**: 8 custom cards (grid 4-col, `aspect-[16/9]` top, dengan excerpt, author, date, readTime).

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Migrate ke NewsCard? | ✅ **Ya** — pakai `variant="medium"` | Pattern ini = `medium` NewsCard + excerpt (yang saat ini tidak ada) |
| Tambah prop `showExcerpt` | ⚠️ **Perlu** | Excerpt adalah pembeda utama dari Zona 2 (Fokus Redaksi) |
| Tambah prop `showMetadata` | ⚠️ **Perlu** | Author + date + readTime adalah metadata yang berbeda dari `medium` default |
| Image aspect | `aspect-[16/9]` (sudah benar) | Standar |
| Title size | `text-sm md:text-base` (sudah benar) | Lebih kecil dari medium biasa (karena grid 4-col) |
| Padding | `p-4` (sudah benar) | Cukup |
| Anti-crop panorama | ⚠️ Tambah `onLoad` adaptive | Image full cover, rawan crop |

**Status**: ⚠️ **Refactor perlu** — NewsCard `medium` saat ini tidak support excerpt + full metadata. Tambah 2 boolean props (atau buat sub-variant `medium_full`).

#### ZONA 5a — TEKNOLOGI (Portrait 3:4, `EditorialExtras.tsx`)

**Saat ini**: 3-4 custom cards dengan `aspect-[3/4]`, full-cover dengan gradient overlay, kategori blue-400.

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Tetap custom? | ✅ **Ya** | Portrait 3:4 + full-cover dengan kategori warna = identitas visual kuat |
| Image aspect | `aspect-[3/4]` (sudah benar) | Per spec Design F: "Teknologi (portrait 3:4)" |
| Title size | `text-base md:text-lg` (sudah benar) | Standar |
| Category color | `text-blue-400` (sudah benar) | Distinct dari kategori lain (brand-red) |
| Anti-crop portrait | ✅ Sudah OK (object-cover + portrait container) | Portrait tidak ter-crop di container portrait |

**Status**: ✅ Sudah sesuai spec.

#### ZONA 5b — OPINI (Text-only, `EditorialExtras.tsx`)

**Saat ini**: 3-4 custom text-only cards (tanpa image), kutipan judul dengan tanda kutip, kategori "Kolom Analisis".

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Tetap custom? | ✅ **Ya** | Text-only dengan format kutipan = identitas unik |
| Title format | `"{title}"` dengan kutipan (sudah benar) | Sesuai spec |
| Title size | `text-md md:text-lg` (sudah benar) | Standar |
| Excerpt | `line-clamp-3` (sudah benar) | Penting karena tidak ada image |
| Category | "Kolom Analisis" (sudah benar) | Distinct label |

**Status**: ✅ Sudah sesuai spec.

#### ZONA 5c — FOTO JURNALISTIK (3:2, `InterstitialPhoto.tsx`)

**Saat ini**: 3 custom landscape cards, `aspect-[3/2]`, background dark (`bg-slate-900`), image 3:2, caption "Foto Jurnalistik".

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Tetap custom? | ⚠️ **Bisa dimigrate** ke NewsCard | Pattern = image 3:2 + caption overlay. Mirip `medium` tapi dengan rasio beda |
| Image aspect | `aspect-[3/2]` (sudah benar) | Per spec Design F: landscape |
| Background | `bg-slate-900` (sudah benar) | Kontras dengan section lain (light) |
| Anti-crop panorama | ⚠️ Tambah `onLoad` adaptive | Rawan crop untuk foto jurnalistik wide |

**Status**: ⚠️ **Refactor opsional** — bisa pakai NewsCard `medium` dengan `aspect-[3/2]`, tapi tidak wajib.

#### ZONA 5d — VIDEO EKSKLUSIF (16:9, `EditorialExtras.tsx`)

**Saat ini**: 3-4 custom cards dengan `aspect-video`, play button overlay (rounded-full, backdrop-blur), image full-cover, label "Video Report" di red.

| Aspek | Rekomendasi | Alasan |
|---|---|---|
| Tetap custom? | ✅ **Ya** | Play button overlay + label Video Report = identitas visual kuat |
| Image aspect | `aspect-video` (sudah benar) | Standar video |
| Play button | ✅ Sudah ada | Distinctive element |
| Hover effect | `group-hover:scale-105` (sudah benar) | Good UX |
| Anti-crop panorama | ⚠️ Tambah `onLoad` adaptive | Image 16:9 + object-cover = panorama crop |

**Status**: ✅ Konsep sudah sesuai, hanya tambah `onLoad` adaptive.

### 15.4 Ringkasan Rekomendasi per Zona

| Zona | Tindakan | Prioritas |
|---|---|---|
| ZONA 1 (Hero) | Auto-rotate hapus, `onLoad` adaptive, `aria-live` | **Tinggi** |
| ZONA 2 (Fokus Redaksi) | Minor gap tweak (`gap-4` → `gap-5`) | **Rendah** |
| ZONA 3 (Trending) | `onLoad` adaptive saja | **Sedang** |
| ZONA 4 Row 1 (Sidebar) | `onLoad` adaptive + bungkus dengan NewsCard `horizontal` | **Sedang** |
| ZONA 4 Row 2 (4-col Grid) | **Refactor ke NewsCard `medium_full` baru** (perlu tambah prop `showExcerpt` + `showMetadata`) | **Tinggi** |
| ZONA 5a (Teknologi) | Sudah OK | — |
| ZONA 5b (Opini) | Sudah OK | — |
| ZONA 5c (Foto) | `onLoad` adaptive, refactor opsional | **Rendah** |
| ZONA 5d (Video) | `onLoad` adaptive | **Sedang** |

### 15.5 Varian NewsCard Baru yang Diperlukan

Bila Opsi B (co-exist) dipilih, NewsCard perlu tambahan:

| Varian baru | Untuk Zona | Tambahan prop |
|---|---|---|
| `medium_full` | ZONA 4 Row 2 (Berita Lainnya) | `showExcerpt?: boolean`, `showFullMetadata?: boolean` |

Varian lain (Trending podium, Teknologi portrait, Video) tetap custom karena identitas visualnya tidak bisa digeneralisasi tanpa kehilangan kekhasan.

### 15.6 File Tambahan yang Disentuh (Per Zona)

Bila rekomendasi 15.4 disetujui:

| File | Perubahan |
|---|---|
| `components/ui/NewsCard.tsx` | Tambah variant `medium_full` + props `showExcerpt`/`showFullMetadata` |
| `components/ui/SmartImage.tsx` | Tambah prop `onLoad` callback (sudah direncanakan di 5.2) |
| `components/pages/home/FokusRedaksiSection.tsx` | Tweak gap `gap-4` → `gap-5` |
| `components/pages/home/TrendingSection.tsx` | Tambah `onLoad` adaptive |
| `components/pages/home/FeedWithSidebar.tsx` | Tambah `onLoad` adaptive (image right) |
| `components/pages/home/ContinuedFeed.tsx` | Refactor ke NewsCard `medium_full` |
| `components/pages/home/EditorialExtras.tsx` | Tambah `onLoad` adaptive (5a–5d) |
| `components/pages/home/interstitials/InterstitialPhoto.tsx` | Tambah `onLoad` adaptive |

**Total file disentuh** (Fase 1 + 12 + 15): ~12 file, semua di `apps/web/components/`. **Zero breaking change** untuk API.

---

**Tetap tidak dilakukan**:
- Tidak ada file kode yang dimodifikasi selama penyusunan laporan.
- Tidak ada dependency baru yang diinstal.
- Tidak ada migration database.
- Tidak ada perubahan `tsconfig`, `package.json`, atau pipeline CI.

## 4 Strategi (Pilih Satu)
### Strategi A — Cinematic Frame (REKOMENDASI ✅)
- Container: h-screen (100vh) — benar-benar 1 layar penuh
- Image: object-contain — tidak pernah terpotong
- Latar belakang container: hitam/ dominantColor — mengisi ruang kosong seperti letterbox bioskop
- Text overlay: di bagian bawah (di atas area gelap atau image)
Visual :

Untuk rasio 16:9 (mayoritas artikel) : dark area hampir tidak terlihat → terlihat full edge-to-edge . Untuk rasio 1:1 / 3:4 / 3:1 : dark area muncul sebagai "frame" → tetap elegan, terasa premium .

Pro : ✅ No crop, ✅ Container 100vh, ✅ Visual konsisten untuk semua rasio. Kontra : Untuk rasio ekstrem, ada letterbox yang terlihat.

### Strategi B — Adaptive Container Height
- Container height adaptif sesuai rasio image:
  - Square (1:1) → h-[90vh]
  - Portrait (3:4) → h-[100vh]
  - Landscape (16:9) → h-[60vh]
  - Panorama (3:1) → h-[40vh]
- Image: object-cover (sedikit crop mungkin)
Pro : ✅ No edge kosong, ✅ Crop minimal. Kontra : ❌ Tidak benar-benar 1 layar penuh (untuk landscape & panorama, container lebih pendek dari viewport).

### Strategi C — Smart Zoom (seperti di log.txt)
- Container: fixed h-[clamp(560px,82vh,820px)]
- Image: object-cover + onLoad adaptive object-position :
  - Panorama (ratio > 2.5) → object-position: center 35%
  - Portrait (ratio < 0.85) → object-position: center 25%
  - Lainnya → center
Pro : ✅ Edge-to-edge, ✅ Adaptive. Kontra : ❌ Tetap ada crop untuk rasio yang sangat berbeda (1:1, 3:1 akan kehilangan ~30% konten).

### Strategi D — Editorial Split
- Image: 60-70% lebar viewport
- Text/teks artikel: 30-40% di sisi (desktop) atau di bawah (mobile)
- Image: object-cover di framenya
Pro : ✅ Edge-to-edge image, ✅ Viewport termanfaatkan optimal. Kontra : ❌ Image tidak benar-benar full screen, ❌ Layout jadi 2 kolom.

## Rekomendasi Saya: Strategi A (Cinematic Frame)
Alasan :

1. Sesuai dengan pola major news sites (NYT, BBC, Bloomberg, Reuters) saat image tidak 16:9 — mereka pilih contain dengan frame , bukan crop.
2. BeritaKarya mayoritas gambar 16:9 (6 dari 9 zona homepage). Untuk rasio ini, dark frame hampir invisible — user tidak akan sadar.
3. Untuk rasio 1:1 (dari PalingDibaca sidebar) — kalau artikel tersebut diklik, akan muncul sebagai "framed portrait" yang elegan, bukan dipaksa jadi landscape dengan wajah terpotong.
4. Tidak ada trade-off visual yang memalukan :
   
   - Tidak ada crop memalukan (wajah/wajah orang hilang)
   - Tidak ada container "pendek" yang membuat layout kurang megah
   - Tidak ada layout 2-kolom yang memecah fokus
5. Dark frame bukan "kekosongan" — bisa diisi:
   
   - Brand logo watermark kecil di pojok
   - Quote/kutipan utama artikel (kalau ada) sebagai typography art
   - Atau biarkan kosong untuk efek minimalist (Apple style)
## Implementasi (deskriptif, bukan kode)
Desktop :

Mobile (beda strategi karena rasio portrait):

```
<section class="relative w-full min-h-[100svh] 
bg-black">
  <div class="relative aspect-[3/4] w-full">  {/* 
  portrait-friendly */}
    <SmartImage ... objectFit="contain" />
  </div>
  <div class="p-4">
    <h1>{title}</h1>
  </div>
</section>
```
Dark frame color :

- Default: bg-slate-950 (hampir hitam, lebih soft dari pure black)
- Dynamic: style={{ backgroundColor: article.featuredImageColor }} — pakai dominantColor dari image (sudah ada di schema) untuk frame yang harmonis
## Kenapa Bukan C (Smart Zoom)?
Strategi C yang saya rekomendasikan sebelumnya (di Section 5) menggunakan object-cover . Untuk 16:9 image, itu OK. Tapi untuk 1:1 dari sidebar atau 3:4 dari Teknologi yang masuk ke detail artikel, crop akan signifikan — kehilangan ~40% konten image.

Strategi A mengorbankan "edge-to-edge image" untuk "no crop" , dan untuk 16:9 image trade-off ini hampir tidak terlihat (frame tipis, bisa diisi branding).

## TL;DR Pakai Strategi A (Cinematic Frame) : h-screen + object-contain + dark frame dari dominantColor . Untuk 16:9 (mayoritas artikel) → terlihat full edge-to-edge. Untuk rasio lain → tetap elegan tanpa crop memalukan.