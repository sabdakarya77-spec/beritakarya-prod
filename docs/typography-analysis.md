# Analisis Tipografi Artikel — BeritaKarya vs Media Besar

Dokumen ini membandingkan komposisi tipografi BeritaKarya dengan standar media digital besar (Kompas.id, NYT, Medium, The Guardian, Reuters).

---

## 1. Font Family

### Media Besar

| Media | Body Font | Heading Font | Kategori |
|---|---|---|---|
| **Kompas.id** | Source Serif Pro | Sans-serif (custom / Mulish) | Serif body, Sans heading |
| **NYT** | Cheltenham / NYT Imperial → Georgia | Franklin Gothic / NYT Cheltenham | Serif body, Sans+Serif heading |
| **Medium** | Charter → Georgia | Sohne (proprietary sans) | Serif body, Sans heading |
| **The Guardian** | Guardian Text Egyptian | Guardian Egyptian | Proprietary serif |
| **Reuters** | Reuters Sans | Reuters Sans | Sans-serif utilitarian |

### BeritaKarya

| Bagian | Font | Stack |
|---|---|---|
| **Body (sans)** | Plus Jakarta Sans | Inter → system-ui → sans-serif |
| **Heading (article-content)** | Playfair Display | Georgia → serif |
| **Drop Cap** | Playfair Display / Georgia | serif |
| **UI / Dashboard** | Inter | system-ui → sans-serif |

### Insight

- **Mayoritas media besar pakai serif untuk body** (NYT, Kompas, Guardian, Medium) — serif memberi kesan *authoritative* dan tradisional untuk jurnalisme.
- **BeritaKarya pakai sans-serif (Plus Jakarta Sans) untuk body** — lebih modern tapi kurang "berat" untuk long-form reading.
- **Heading di BeritaKarya sudah pakai serif (Playfair Display)** — ini bagus, mengikuti pola NYT/Guardian.

---

## 2. Font Size

### Perbandingan

| Media | Body Size | Lead Paragraph | H1 (Judul) | H2 | H3 |
|---|---|---|---|---|---|
| **Kompas.id** | 18–20px | 20–22px | 32–48px | 24–28px | 20–24px |
| **NYT** | ~17px | 20–22px | 36–52px | 28–32px | 22–26px |
| **Medium** | **~21px** | 24px | 32–40px | 24–28px | 20px |
| **The Guardian** | 17–18px | 20px | 36–48px | 24–28px | 20px |
| **Reuters** | 17–18px | 18–20px | 32–40px | 24px | 20px |

### BeritaKarya

| Elemen | Mobile | Desktop |
|---|---|---|
| Body paragraf | ~16px | ~16.8px |
| Lead paragraf | ~18px | ~20px |
| H1 (judul) | 24px | 36–48px |
| H2 | ~21.6px | ~28px |
| H3 | ~18.4px | ~23.2px |
| H4–H6 | ~16px | ~20px |
| Blockquote | ~17.6px | ~21.6px |
| Drop Cap | 3.5em (~56px) | 4.5em (~72px) |

### Insight

- **BeritaKarya body font lebih kecil (16px)** dibanding standar media (17–21px).
- Medium yang paling besar (21px) dianggap gold standard untuk readability.
- **Sweet spot untuk body: 18px** — lebih besar dari BeritaKarya saat ini.
- Heading scale BeritaKarya sudah proporsional.

---

## 3. Line Height (Jarak Antar Baris)

### Perbandingan

| Media | Body Line-Height | Heading Line-Height |
|---|---|---|
| **Kompas.id** | 1.6–1.8 | 1.2–1.3 |
| **NYT** | 1.6–1.8 | 1.1–1.25 |
| **Medium** | **1.58** | 1.2–1.3 |
| **The Guardian** | 1.45–1.5 (rapat) | 1.1–1.2 |
| **Reuters** | 1.5–1.6 | 1.2 |

### BeritaKarya

| Elemen | Mobile | Desktop |
|---|---|---|
| Body paragraf | 1.75rem (~28px) | 1.85rem (~29.6px) |
| Lead paragraf | 1.625 | 1.625 |
| Heading | 1.25 (tight) | 1.25 |
| Judul H1 | 1.1 | 1.1 |
| Blockquote | 1.7rem (~27.2px) | 2.1rem (~33.6px) |

### Insight

- **BeritaKarya line-height (1.75–1.85) sedikit lebih renggang** dari ideal (1.6–1.7).
- Guardian paling rapat (1.45–1.5), Medium paling optimal (1.58).
- **Rekomendasi: 1.6–1.7** untuk body, 1.2–1.3 untuk heading.

---

## 4. Paragraph & Spacing

### Perbandingan

| Media | Paragraph Gap | Content Max-Width | Karakter/Baris |
|---|---|---|---|
| **Kompas.id** | 16–24px | 680–720px | ~65–70 |
| **NYT** | 20–28px | 600–700px | ~60–65 |
| **Medium** | 20–24px | **680px** | ~65 |
| **The Guardian** | 16–20px | 620–700px | ~60–65 |
| **Reuters** | ~16px | ~680px | ~65 |

### BeritaKarya

| Properti | Nilai |
|---|---|
| Antar paragraf | **32px** (`space-y-8`) |
| Heading margin-top (mobile) | 40px (`mt-10`) |
| Heading margin-top (desktop) | 48px (`mt-12`) |
| Heading margin-bottom (mobile) | 20px (`mb-5`) |
| Heading margin-bottom (desktop) | 24px (`mb-6`) |
| Blockquote margin | 40px (`my-10`) |
| Image margin | 40px (`my-10`) |
| List margin | 32px (`my-8`) |
| Callout margin | 40px (`my-10`) |
| Pull Quote margin | 48px (`my-12`) |
| Content max-width | **640px** (`max-w-[40rem]`) |
| CSS variable max-width | 760px (`--content-max-width: 47.5rem`) |

### Insight

- **BeritaKarya paragraph gap (32px) lebih besar** dari standar media (16–28px). Ini bisa terasa terlalu renggang.
- **Content width 640px** — sedikit lebih sempit dari ideal (680px), menghasilkan ~60 karakter per baris.
- **Ideal: 60–75 karakter per baris** (~680px) untuk readability optimal.
- Heading spacing BeritaKarya sudah baik.

---

## 5. Font Weight

### Perbandingan

| Media | Body Weight | Heading Weight | Lead Weight |
|---|---|---|---|
| **Kompas.id** | 400 | 700–800 | 500 |
| **NYT** | 400 | 700–900 | 400–500 |
| **Medium** | 400 | 700 | 400 |
| **The Guardian** | 400 | 700–900 | 400 |

### BeritaKarya

| Elemen | Weight |
|---|---|
| Body paragraf | 400 (default) |
| Lead paragraf | **500** (`font-medium`) |
| Heading (komponen) | **800** (`font-extrabold`) |
| Heading (article-content CSS) | **900** (`font-black`) |
| Drop Cap | **900** (`font-black`) |

### Insight

- BeritaKarya heading weight **800–900** — lebih berat dari rata-rata (700–800), tapi ini memberi kesan bold dan authoritative.
- Lead paragraph 500 — bagus untuk membedakan dari body text.

---

## 6. Fitur Khusus

| Fitur | BeritaKarya | Kompas.id | NYT | Medium |
|---|---|---|---|---|
| Drop Cap | ✅ (Playfair, 3 baris) | ❌ | ✅ (serif, besar) | ❌ |
| Pull Quote | ✅ (border merah) | ❌ | ✅ | ✅ |
| Font Scale Control | ✅ (0.85x–1.3x) | ❌ | ❌ | ❌ |
| Blockquote Styling | ✅ (border-l merah) | ✅ | ✅ | ✅ |
| Dark Mode | ✅ | ❌ | ❌ | ✅ |
| Print Styles | ✅ (12pt, 1.6) | ❌ | ✅ | ❌ |

---

## 7. Rekomendasi Penyesuaian

### Prioritas Tinggi

| Item | Saat Ini | Rekomendasi | Alasan |
|---|---|---|---|
| Body font-size | 16–16.8px | **18px** | Mendekati standar media (17–21px) |
| Body font family | Plus Jakarta Sans (sans) | **Serif** (Source Serif Pro / Lora) | Konsistensi dengan standar jurnalisme |
| Paragraph gap | 32px | **20–24px** | 32px terlalu renggang untuk long-form |
| Content max-width | 640px | **680px** | Optimal untuk ~65 karakter/baris |

### Prioritas Sedang

| Item | Saat Ini | Rekomendasi | Alasan |
|---|---|---|---|
| Body line-height | 1.75–1.85 | **1.6–1.7** | Sedikit lebih rapat, lebih nyaman dibaca |
| Heading weight | 800–900 | **700–800** | Sedikit lebih ringan, kurang "teriak" |

### Sudah Baik (Pertahankan)

- ✅ Heading font pakai serif (Playfair Display)
- ✅ Drop cap dengan Playfair Display
- ✅ Font scale control untuk aksesibilitas
- ✅ Line-height heading (1.25 tight)
- ✅ Dark mode support
- ✅ Print styles

---

## 8. Ringkasan Visual

```
┌─────────────────────────────────────────────────────┐
│  IDEAL LAYOUT (berdasarkan analisis media besar)    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Max-width: 680px (~65 karakter per baris)          │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  H1 — Judul                                 │    │
│  │  Font: Serif (display), 36–48px, weight 800 │    │
│  │  Line-height: 1.1                           │    │
│  │  Margin-bottom: 24px                        │    │
│  ├─────────────────────────────────────────────┤    │
│  │                                             │    │
│  │  Lead Paragraph                             │    │
│  │  Font: Serif, 20px, weight 500              │    │
│  │  Line-height: 1.6                           │    │
│  │                                             │    │
│  │  ── gap: 20px ──                            │    │
│  │                                             │    │
│  │  Body Paragraph                             │    │
│  │  Font: Serif, 18px, weight 400              │    │
│  │  Line-height: 1.6–1.7                       │    │
│  │                                             │    │
│  │  ── gap: 20px ──                            │    │
│  │                                             │    │
│  │  H2 — Subheading                            │    │
│  │  Font: Serif, 28px, weight 700–800          │    │
│  │  Line-height: 1.25                          │    │
│  │  Margin-top: 48px, Margin-bottom: 24px      │    │
│  │                                             │    │
│  │  ── gap: 20px ──                            │    │
│  │                                             │    │
│  │  Body Paragraph                             │    │
│  │  Font: Serif, 18px, weight 400              │    │
│  │  Line-height: 1.6–1.7                       │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 9. Audit Konsistensi Tipografi

Dokumen ini mencatat semua lokasi tipografi di codebase dan inkonsistensi yang harus diperbaiki sebelum/saat menyesuaikan tipografi.

### Inventaris Lengkap per Kategori

#### Kategori A: Public Article Page (`page.tsx` PublicBlock)

**File:** `apps/web/app/[site]/artikel/[slug]/page.tsx`

| ID | Elemen | Line | Properti |
|---|---|---|---|
| A1 | Article wrapper | 317 | `max-w-[40rem]` (640px), `space-y-8` |
| A2 | Body text | 665–666 | `font-sans`, `1rem`/`1.05rem`, `leading-[1.75rem]`/`[1.85rem]` |
| A3 | Lead text | 668–669 | `font-sans`, `1.125rem`/`1.25rem`, `leading-relaxed`, `font-medium` |
| A4 | Heading (shared) | 691 | `font-sans font-extrabold`, `mt-10`/`mt-12`, `mb-5`/`mb-6`, `leading-tight` |
| A4a | H2 size | 684 | `1.35rem`/`1.75rem` × scale |
| A4b | H3 size | 686 | `1.15rem`/`1.45rem` × scale |
| A4c | H4–H6 size | 687 | `1rem`/`1.25rem` × scale |
| A5 | Blockquote | 699–707 | `my-10`, `py-8`/`py-10`, text: `1.1rem`/`1.35rem` × scale, `italic` |
| A6 | Pull-quote | 335–346 | `my-10`, `py-8`, text: `font-serif text-xl`/`text-2xl italic` |
| A7 | Callout | 793–807 | `my-10`, text: `1rem`/`1.1rem` × scale |
| A8 | Figure caption | 722–724 | `text-xs italic leading-relaxed` |
| A9 | Hero title (H1) | 250 | `text-2xl`/`text-4xl`/`text-5xl`, `font-sans font-extrabold`, `leading-[1.1]` |
| A10 | Metadata badges | 239–270 | `text-[9px]`–`text-[11px]`, `font-bold`/`font-black`, `uppercase` |

#### Kategori B: Global `.article-content` CSS

**File:** `apps/web/app/globals.css`

| ID | Selector | Line | Properti |
|---|---|---|---|
| B1 | `.article-content p` | 221–223 | `leading-[1.75]`/`[1.85]`, `text-brand-text/90` |
| B2 | `.article-content p:first-of-type::first-letter` | 225–229 | Playfair Display, `text-7xl`/`text-8xl`, `font-black`, `initial-letter: 3` |
| B3 | `.article-content h2, h3` | 231–233 | `font-serif font-black`, `mt-10 mb-5 md:mt-12 md:mb-6`, `tracking-tighter` |
| B4 | `.pull-quote` | 236–243 | `my-10 py-8 px-8 md:px-12`, `border-y-2` |
| B5 | `p[data-drop-cap="true"]::first-letter` | 507–531 | Georgia serif, `4.5em`/`3.5em` mobile, `font-weight: 800` |

#### Kategori C: TipTap Editor

**File:** `apps/web/app/globals.css` (`.tiptap-editor-content`)

| ID | Elemen | Line | Properti |
|---|---|---|---|
| C1 | Root container | 292–293 | `font-sans`, `1rem` × scale, `line-height: 1.75rem × scale` |
| C2 | Paragraph | 298 | `mb-4`, `line-height: 1.75rem × scale` |
| C3 | H1 | 302 | `font-serif font-extrabold`, `1.5rem` × scale, `mb-5 mt-10 md:mt-12 md:mb-6` |
| C4 | H2 | 306 | `font-serif font-extrabold`, `1.35rem` × scale, `mb-5 mt-10 md:mt-12 md:mb-6` |
| C5 | H3 | 310 | `font-serif font-extrabold`, `1.15rem` × scale, `mb-5 mt-10 md:mt-12 md:mb-6` |
| C6 | H4–H6 | 316 | `font-serif font-extrabold`, `1rem` × scale, `mb-5 mt-10 md:mt-12 md:mb-6` |
| C7 | Lists | 320–333 | `mb-4 pl-6`, `list-disc`/`list-decimal`, `li mb-1` |
| C8 | Blockquote | 337 | `border-l-4 border-brand-red pl-4 my-4 italic` |
| C9 | Code | 341 | `font-mono text-sm` |
| C10 | Links | 353 | `text-brand-red underline` |
| C11 | HR | 361 | `my-8` |

#### Kategori D: Font Scale System

| ID | Lokasi | Line | Mekanisme |
|---|---|---|---|
| D1 | `globals.css` `:root` | 26 | `--article-font-scale: 1` |
| D2 | `globals.css` editor | 293 | `calc(1.05rem * var(--article-font-scale, 1))` |
| D3 | `page.tsx` PublicBlock | 666–803 | Semua pakai `calc(... * var(--article-font-scale))` |
| D4 | ArticleFloatingTools | 34, 65 | `setProperty('--article-font-scale', ...)` ✅ |
| D5 | MobileArticleTools | 97, 128 | `setProperty('--article-font-scale', ...)` ✅ |
| D6 | FontSizeControl | 23, 54 | `setProperty('--article-font-scale', ...)` ✅ |

Preset yang tersedia: `0.85` (A-), `1` (Normal), `1.15` (A+), `1.3` (A++)

#### Kategori E: Print Styles

**File:** `apps/web/app/globals.css` (`@media print`)

| ID | Selector | Line | Properti |
|---|---|---|---|
| E1 | `.article-content` | 467–500 | `font-size: 12pt !important`, `line-height: 1.75 !important` |
| E2 | `p[data-drop-cap]::first-letter` | 534–539 | `color: #000 !important` |

#### Kategori F: Legal Pages

**File:** `apps/web/components/legal/legalStyles.ts`

| ID | Class | Properti |
|---|---|---|
| F1 | `legalProseClassName` | `text-base`/`text-[17px]`, `leading-[1.75]`, heading: `font-serif font-extrabold`, `mt-10 mb-5 md:mt-12 md:mb-6` |
| F2 | `legalCompactClassName` | `text-sm`/`text-base`, `leading-[1.75]` |

**File:** `apps/web/components/legal/LegalPageHeader.tsx`

| ID | Elemen | Line | Properti |
|---|---|---|---|
| F3 | H1 | 22 | `text-3xl`/`text-4xl`/`text-5xl`, `font-serif font-black`, `leading-none` |

#### Kategori G: Komponen Lain

| ID | File | Elemen | Properti |
|---|---|---|---|
| G1 | `Container.tsx` | Layout | `max-w-container` (1160px) / `max-w-content` (760px) |
| G2 | `NewsCard.tsx` | Title | `text-sm`–`text-lg`, `font-bold`/`font-extrabold`, `leading-[1.15]`–`[1.3]` |
| G3 | `PremiumHero.tsx` | H1 | `text-4xl`–`text-7xl`, `font-serif font-black`, `leading-[0.95]` |
| G4 | `VideoWidget.tsx` | Title | `font-serif text-lg font-black leading-snug` |

#### Kategori H: Tailwind Config

**File:** `apps/web/tailwind.config.ts`

| ID | Token | Nilai |
|---|---|---|
| H1 | `font-sans` | Plus Jakarta Sans → Inter → system-ui → sans-serif |
| H2 | `font-serif` | Playfair Display → Georgia → serif |
| H3 | `font-jakarta` | Plus Jakarta Sans → system-ui → sans-serif |
| H4 | `--container-max-width` | 72.5rem (1160px) |
| H5 | `--content-max-width` | 42.5rem (680px) |
| H6 | Plugins | `[]` — **TANPA** `@tailwindcss/typography` |

---

### ✅ Inkonsistensi yang Ditemukan — SEMUA SUDAH DIPERBAIKI

> Commit: `669610e` (Tier 1) + `910398e` (Tier 2)
> Tanggal: 2026-06-24

#### 1. ~~Font Heading: `font-sans` vs `font-serif`~~ ✅ FIXED

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `page.tsx` heading (A4) | `font-sans` | `font-serif` |
| `globals.css` `.article-content h2, h3` (B3) | `font-serif` | `font-serif` (tidak berubah) |

#### 2. ~~Line-Height Paragraf: Tidak Cocok~~ ✅ FIXED

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `globals.css` `.article-content p` (B1) | `leading-[1.8]` / `md:leading-[1.9]` | `leading-[1.75]` / `md:leading-[1.85]` |
| `page.tsx` bodyTextClass (A2) | `leading-[1.75rem]` / `md:leading-[1.85rem]` | Tidak berubah (source of truth) |

#### 3. ~~Margin Heading: CSS vs Component~~ ✅ FIXED

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `globals.css` `.article-content h2, h3` (B3) | `mt-16 mb-6` | `mt-10 mb-5 md:mt-12 md:mb-6` |

#### 4. ~~Spacing Pull-Quote: CSS vs Component~~ ✅ FIXED

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `globals.css` `.pull-quote` (B4) | `my-12 py-10 px-12` | `my-10 py-8 px-8 md:px-12` |

#### 5. ~~FontSizeControl: Mekanisme Berbeda~~ ✅ FIXED

| Komponen | Sebelum | Sesudah |
|---|---|---|
| FontSizeControl (D6) | `el.style.fontSize = ${value*100}%` | `setProperty('--article-font-scale', value)` |

#### 6. ~~Max-Width: Dua Nilai Berbeda~~ ✅ FIXED

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `page.tsx` article wrapper (A1) | `max-w-[40rem]` (640px) | `max-w-content` (CSS variable) |
| `globals.css` `--content-max-width` (H5) | `47.5rem` (760px) | `42.5rem` (680px) |

#### 7. ~~`@tailwindcss/typography` Plugin Tidak Terpasang~~ ✅ FIXED

| File | Sebelum | Sesudah |
|---|---|---|
| `TiptapEditor.tsx` | `prose prose-lg` (dead code) | Dihapus |
| `MediaTextExtension.tsx` | `not-prose` + `prose prose-sm` (dead code) | Dihapus, diganti classes aktual |
| `ImageGridExtension.tsx` | `not-prose` (dead code) | Dihapus |
| `GalleryExtension.tsx` | `not-prose` (dead code) | Dihapus |
| `LegalDocumentBody.tsx` compact | `prose prose-sm md:prose-base` (dead code) | `legalCompactClassName` |

---

### ✅ Checklist File — SEMUA TIER SELESAI

> Total: 9 file diubah, 0 file perlu diubah lagi.

#### ~~Tier 1 — Wajib~~ ✅ SELESAI (Commit `669610e`)

| # | File | Status | Perubahan |
|---|---|---|---|
| 1 | `apps/web/app/[site]/artikel/[slug]/page.tsx` | ✅ Fixed | `font-sans` → `font-serif` heading, `max-w-[40rem]` → `max-w-content` |
| 2 | `apps/web/app/globals.css` (§ `.article-content`) | ✅ Fixed | `leading-[1.8]` → `[1.75]`, heading margin, pull-quote spacing |
| 3 | `apps/web/app/globals.css` (§ `.tiptap-editor-content`) | ✅ Fixed | Editor font-size/line-height/headings match public page |
| 4 | `apps/web/components/ui/FontSizeControl.tsx` | ✅ Fixed | `el.style.fontSize` → `setProperty('--article-font-scale')` |
| 5 | `apps/web/app/globals.css` (`@media print`) | ✅ Fixed | `line-height: 1.6` → `1.75` |
| 6 | `apps/web/app/globals.css` (`:root` variables) | ✅ Fixed | `--content-max-width: 47.5rem` → `42.5rem` |

#### ~~Tier 2 — Harus Dicek~~ ✅ SELESAI (Commit `910398e`)

| # | File | Status | Perubahan |
|---|---|---|---|
| 7 | `apps/web/components/legal/legalStyles.ts` | ✅ Fixed | `text-[15px]` → `text-base`, `font-black` → `font-extrabold`, heading margin aligned |
| 8 | `apps/web/components/legal/LegalPageHeader.tsx` | ✅ Sudah konsisten | Sudah `font-serif font-black` |
| 9 | `apps/web/components/legal/LegalDocumentBody.tsx` | ✅ Fixed | Import `legalCompactClassName`, ganti dead `prose` classes |
| 10 | `apps/web/components/editor/TiptapEditor.tsx` | ✅ Fixed | Hapus `prose prose-lg` (dead code) |
| 11 | `apps/web/components/editor/extensions/MediaTextExtension.tsx` | ✅ Fixed | Hapus `not-prose` + `prose prose-sm`, ganti classes aktual |
| 12 | `apps/web/components/ui/ArticleFloatingTools.tsx` | ✅ Sudah konsisten | Sudah pakai `setProperty` |
| 13 | `apps/web/components/ui/MobileArticleTools.tsx` | ✅ Sudah konsisten | Sudah pakai `setProperty` |

**Bonus:** Juga membersihkan `not-prose` dari `ImageGridExtension.tsx` dan `GalleryExtension.tsx`.

#### ~~Tier 3 — Opsional~~ ✅ SELESAI (Tidak perlu ubah)

| # | File | Status | Alasan |
|---|---|---|---|
| 14 | `apps/web/components/ui/NewsCard.tsx` | ✅ Sudah konsisten | Card title `font-sans` — benar untuk UI element |
| 15 | `apps/web/components/berita/PremiumHero.tsx` | ✅ Sudah konsisten | H1 sudah `font-serif font-black` |
| 16 | `apps/web/components/ui/VideoWidget.tsx` | ✅ Sudah konsisten | Title sudah `font-serif font-black` |
| 17 | `apps/web/components/marketing/AdsMarketingPage.tsx` | ✅ Sudah konsisten | Sudah pakai `legalCompactClassName` (fix Tier 2) |
| 18 | `apps/web/tailwind.config.ts` | ✅ Sudah konsisten | Font family `sans`/`serif` terdefinisi benar |
| 19 | `apps/web/app/layout.tsx` | ✅ Sudah konsisten | 3 Google Fonts dimuat, CSS variable terpasang |
| 20 | `apps/web/app/globals.css` (line 1) | ✅ Sudah konsisten | Weight lengkap (300–900 sans, 400–900 serif) |

---

### ✅ Properti yang Sudah "Satu Suara" di Semua Lokasi

| Properti | Nilai Final | Lokasi yang Sudah Sinkron |
|---|---|---|
| **Body font-size** | `1rem` (mobile) / `1.05rem` (desktop) × scale | page.tsx + globals.css + editor + print + legal |
| **Body line-height** | `1.75` (mobile) / `1.85` (desktop) | page.tsx + globals.css + editor + print + legal |
| **Body font-family** | Plus Jakarta Sans → Inter → system-ui | tailwind.config + globals.css body + page.tsx |
| **Heading font-family** | Playfair Display → Georgia → serif | page.tsx + globals.css + legal + editor |
| **Heading font-weight** | `font-extrabold` (800) | page.tsx + globals.css + legal + editor |
| **Heading margin** | `mt-10 mb-5` / `md:mt-12 md:mb-6` | page.tsx + globals.css + editor |
| **Paragraph spacing** | `space-y-8` (32px) / editor `mb-4` | page.tsx container + editor |
| **Content max-width** | `42.5rem` (680px) via `--content-max-width` | page.tsx (`max-w-content`) + globals.css |
| **Font scale mechanism** | `setProperty('--article-font-scale', value)` | FontSizeControl + ArticleFloatingTools + MobileArticleTools |
| **Font scale presets** | `0.85, 1, 1.15, 1.3` | Ketiga komponen kontrol |

---

## Sumber Referensi

- [Kompas.id](https://www.kompas.id) — Media digital Indonesia, serif body
- [The New York Times](https://www.nytimes.com) — Cheltenham/Imperial serif, Franklin Gothic sans
- [Medium](https://medium.com) — Charter serif, 21px body, gold standard readability
- [The Guardian](https://www.theguardian.com) — Guardian Egyptian proprietary serif
- [Reuters](https://www.reuters.com) — Reuters Sans utilitarian
- [Typewolf](https://www.typewolf.com) — Typography reference and analysis
- [Fonts In Use](https://fontsinuse.com) — Typography catalog
