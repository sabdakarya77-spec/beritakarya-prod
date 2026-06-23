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
| B1 | `.article-content p` | 221–223 | `leading-[1.8]`/`[1.9]`, `text-brand-text/90` |
| B2 | `.article-content p:first-of-type::first-letter` | 225–229 | Playfair Display, `text-7xl`/`text-8xl`, `font-black`, `initial-letter: 3` |
| B3 | `.article-content h2, h3` | 231–233 | `font-serif font-black`, `mt-16 mb-6`, `tracking-tighter` |
| B4 | `.pull-quote` | 236–243 | `my-12 py-10 px-12`, `border-y-2` |
| B5 | `p[data-drop-cap="true"]::first-letter` | 507–531 | Georgia serif, `4.5em`/`3.5em` mobile, `font-weight: 800` |

#### Kategori C: TipTap Editor

**File:** `apps/web/app/globals.css` (`.tiptap-editor-content`)

| ID | Elemen | Line | Properti |
|---|---|---|---|
| C1 | Root container | 292–293 | `font-sans`, `1.05rem` × scale, `leading-relaxed` |
| C2 | Paragraph | 298 | `mb-4 leading-relaxed` |
| C3 | H1 | 302 | `text-3xl font-bold mb-4 mt-6` |
| C4 | H2 | 306 | `text-2xl font-bold mb-3 mt-5` |
| C5 | H3 | 310 | `text-xl font-semibold mb-2 mt-4` |
| C6 | H4–H6 | 316 | `text-lg font-semibold mb-2 mt-3` |
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
| D6 | **FontSizeControl** | 23, 54 | `el.style.fontSize = ${value*100}%` ❌ **BEDA** |

Preset yang tersedia: `0.85` (A-), `1` (Normal), `1.15` (A+), `1.3` (A++)

#### Kategori E: Print Styles

**File:** `apps/web/app/globals.css` (`@media print`)

| ID | Selector | Line | Properti |
|---|---|---|---|
| E1 | `.article-content` | 467–500 | `font-size: 12pt !important`, `line-height: 1.6 !important` |
| E2 | `p[data-drop-cap]::first-letter` | 534–539 | `color: #000 !important` |

#### Kategori F: Legal Pages

**File:** `apps/web/components/legal/legalStyles.ts`

| ID | Class | Properti |
|---|---|---|
| F1 | `legalProseClassName` | `text-[15px]`/`text-base`/`text-[17px]`, `leading-relaxed`, heading: `font-serif font-black` |
| F2 | `legalCompactClassName` | `text-sm`/`text-base`, `leading-relaxed` |

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
| H5 | `--content-max-width` | 47.5rem (760px) |
| H6 | Plugins | `[]` — **TANPA** `@tailwindcss/typography` |

---

### ⚠️ Inkonsistensi yang Ditemukan

#### 1. Font Heading: `font-sans` vs `font-serif`

| Lokasi | Font |
|---|---|
| `page.tsx` heading (A4, line 691) | `font-sans` → **Plus Jakarta Sans** |
| `globals.css` `.article-content h2, h3` (B3, line 231) | `font-serif` → **Playfair Display** |

**Dampak:** Tailwind inline class di page.tsx menang (specificity lebih tinggi). CSS di globals.css menjadi **dead code**. Heading render pakai Plus Jakarta Sans, bukan Playfair Display.

#### 2. Line-Height Paragraf: Tidak Cocok

| Lokasi | Line-Height |
|---|---|
| `globals.css` `.article-content p` (B1) | `leading-[1.8]` / `md:leading-[1.9]` |
| `page.tsx` bodyTextClass (A2) | `leading-[calc(1.75rem*...)]` / `md:leading-[calc(1.85rem*...)]` |

**Dampak:** page.tsx menang. globals.css dead code. Perubahan di satu tempat tidak sinkron ke tempat lain.

#### 3. Margin Heading: CSS vs Component

| Lokasi | Margin Top | Margin Bottom |
|---|---|---|
| `page.tsx` heading (A4) | `mt-10` / `md:mt-12` (40/48px) | `mb-5` / `md:mb-6` (20/24px) |
| `globals.css` `.article-content h2, h3` (B3) | `mt-16` (64px) | `mb-6` (24px) |

**Dampak:** Nilai berbeda. page.tsx menang.

#### 4. Spacing Pull-Quote: CSS vs Component

| Lokasi | Margin | Padding |
|---|---|---|
| `page.tsx` pull-quote (A6) | `my-10` (40px) | `py-8` (32px) |
| `globals.css` `.pull-quote` (B4) | `my-12` (48px) | `py-10` (40px) |

**Dampak:** Jika class `.pull-quote` dipakai bersamaan dengan inline Tailwind, hasilnya tidak konsisten.

#### 5. FontSizeControl: Mekanisme Berbeda

| Komponen | Mekanisme |
|---|---|
| ArticleFloatingTools (D4) | `setProperty('--article-font-scale', value)` ✅ |
| MobileArticleTools (D5) | `setProperty('--article-font-scale', value)` ✅ |
| **FontSizeControl (D6)** | `el.style.fontSize = ${value*100}%` ❌ |

**Dampak:** FontSizeControl tidak mengubah `--article-font-scale`. Ekspresi `calc()` di page.tsx **tidak terpengaruh**. Hasil scaling tidak konsisten antar kontrol.

#### 6. Max-Width: Dua Nilai Berbeda

| Lokasi | Nilai |
|---|---|
| `page.tsx` article wrapper (A1) | `max-w-[40rem]` = **640px** |
| `globals.css` `--content-max-width` (H5) | `47.5rem` = **760px** |

**Dampak:** Perubahan di satu tempat tidak otomatis sinkron ke tempat lain.

#### 7. `@tailwindcss/typography` Plugin Tidak Terpasang

| File | Class yang Dipakai | Status |
|---|---|---|
| `TiptapEditor.tsx` | `prose prose-lg` | ❌ Tidak berefek |
| `MediaTextExtension.tsx` | `prose prose-sm dark:prose-invert` | ❌ Tidak berefek |
| `LegalDocumentBody.tsx` | `prose prose-sm md:prose-base dark:prose-invert` | ❌ Tidak berefek |

**Dampak:** Class `prose` tidak menghasilkan styling apa pun. Plugin tidak ada di `package.json` maupun `tailwind.config.ts`.

---

### ✅ Checklist File yang Harus Diubah

#### Tier 1 — Wajib (Langsung Berpengaruh ke Tampilan Artikel)

| # | File | Yang Harus Disamakan |
|---|---|---|
| 1 | `apps/web/app/[site]/artikel/[slug]/page.tsx` | Body font-size, line-height, heading font-family/size/spacing, content max-width |
| 2 | `apps/web/app/globals.css` (§ `.article-content`) | Line-height paragraf, heading margin, drop-cap, pull-quote — harus match page.tsx |
| 3 | `apps/web/app/globals.css` (§ `.tiptap-editor-content`) | Editor harus preview yang sama dengan output public |
| 4 | `apps/web/components/ui/FontSizeControl.tsx` | Ganti ke `setProperty('--article-font-scale', ...)` agar konsisten |
| 5 | `apps/web/app/globals.css` (`@media print`) | Sesuaikan font-size & line-height dengan nilai baru |
| 6 | `apps/web/app/globals.css` (`:root` variables) | `--content-max-width` harus match `max-w-*` di page.tsx |

#### Tier 2 — Harus Dicek (Konsistensi Elemen Terkait)

| # | File | Yang Harus Disamakan |
|---|---|---|
| 7 | `apps/web/components/legal/legalStyles.ts` | Body font-size, heading font-family/size, spacing |
| 8 | `apps/web/components/legal/LegalPageHeader.tsx` | Heading font-family, size |
| 9 | `apps/web/components/legal/LegalDocumentBody.tsx` | Hapus atau install `prose` class |
| 10 | `apps/web/components/editor/TiptapEditor.tsx` | Hapus atau install `prose prose-lg` |
| 11 | `apps/web/components/editor/extensions/MediaTextExtension.tsx` | Hapus atau install `prose` class |
| 12 | `apps/web/components/ui/ArticleFloatingTools.tsx` | Scale values harus match FontSizeControl |
| 13 | `apps/web/components/ui/MobileArticleTools.tsx` | Scale values harus match FontSizeControl |

#### Tier 3 — Opsional (Komponen UI/Marketing)

| # | File | Yang Harus Dicek |
|---|---|---|
| 14 | `apps/web/components/ui/NewsCard.tsx` | Font-weight, letter-spacing consistency |
| 15 | `apps/web/components/berita/PremiumHero.tsx` | Heading font-family consistency |
| 16 | `apps/web/components/ui/VideoWidget.tsx` | Heading font-family consistency |
| 17 | `apps/web/components/marketing/AdsMarketingPage.tsx` | Hapus atau install `prose` class |
| 18 | `apps/web/tailwind.config.ts` | Font family definitions, tambah plugin jika perlu |
| 19 | `apps/web/app/layout.tsx` | Google Fonts loading (kalau ganti font) |
| 20 | `apps/web/app/globals.css` (line 1) | Weight yang dimuat dari Google Fonts |

---

### Properti yang Harus "Satu Suara" di Semua Lokasi

| Properti | Lokasi yang Harus Sama |
|---|---|
| **Body font-size** | page.tsx + globals.css + editor + print + legal |
| **Body line-height** | page.tsx + globals.css + editor + print |
| **Body font-family** | tailwind.config + globals.css body + page.tsx bodyTextClass |
| **Heading font-family** | page.tsx + globals.css + legal + editor |
| **Heading font-size per level** | page.tsx + globals.css + editor |
| **Heading margin** | page.tsx + globals.css |
| **Paragraph spacing** | page.tsx container `space-y-*` + editor `mb-*` |
| **Content max-width** | page.tsx + globals.css `--content-max-width` |
| **Font scale mechanism** | FontSizeControl + ArticleFloatingTools + MobileArticleTools |
| **Font scale presets** | Ketiga komponen kontrol harus pakai nilai identik |

---

## Sumber Referensi

- [Kompas.id](https://www.kompas.id) — Media digital Indonesia, serif body
- [The New York Times](https://www.nytimes.com) — Cheltenham/Imperial serif, Franklin Gothic sans
- [Medium](https://medium.com) — Charter serif, 21px body, gold standard readability
- [The Guardian](https://www.theguardian.com) — Guardian Egyptian proprietary serif
- [Reuters](https://www.reuters.com) — Reuters Sans utilitarian
- [Typewolf](https://www.typewolf.com) — Typography reference and analysis
- [Fonts In Use](https://fontsinuse.com) — Typography catalog
