# Layout Desktop — BeritaKarya

Referensi dimensi layout untuk viewport **xl+ (1280px+)** kecuali ditandai lain. Semua nilai diambil langsung dari codebase.

---

## 1. Breakpoints

| Token | Min Width | Suffix |
|-------|-----------|--------|
| Base (mobile) | 0px | (none) |
| `sm` | 640px | `sm:` |
| `md` | 768px | `md:` |
| `lg` | 1024px | `lg:` |
| `xl` | 1280px | `xl:` |
| `2xl` | 1536px | `2xl:` |

---

## 2. Container

**File:** `components/layout/Container.tsx`

| Tipe | Max Width | CSS Variable |
|------|-----------|--------------|
| Default | **1160px** (72.5rem) | `--container-max-width` |
| Content (`size="content"`) | **680px** (42.5rem) | `--content-max-width` |

**Padding horizontal:**

| Breakpoint | Padding | Class |
|------------|---------|-------|
| Base | 16px | `px-4` |
| md (768px+) | 32px | `md:px-8` |
| lg (1024px+) | 40px | `lg:px-10` |

**Bleed mode** (`bleed={true}`): negative margin + padding, konten sampai ke tepi viewport.

---

## 3. Homepage

**File:** `components/pages/SiteHomePage.tsx`

### 3.1 Overall Structure

```
┌─────────────────────────────────────────────────┐
│  ZONA 1: Hero (MagazineBentoHero)               │
│  py-6 (24px)                                    │
├─────────────────────────────────────────────────┤
│  ZONA 1.5: Leaderboard Ad                       │
│  h-[250px], py-5 (20px)                         │
├─────────────────────────────────────────────────┤
│  ZONA 2: Fokus Redaksi                          │
│  py-6 (24px), 3 kolom                           │
├─────────────────────────────────────────────────┤
│  ZONA 3: Trending                               │
│  pb-6 (24px), 5 kolom                           │
├────────────────────────────┬────────────────────┤
│  ZONA 4: Main Feed         │  Sidebar           │
│  8 kolom (lg:col-span-8)   │  4 kolom           │
│  gap-6 (24px)              │  (lg:col-span-4)   │
├────────────────────────────┴────────────────────┤
│  ZONA 5+: Editorial Extras (full-width)         │
│  py-6 (24px), 3-4 kolom                        │
└─────────────────────────────────────────────────┘
```

### 3.2 ZONA 1 — Hero (MagazineBentoHero)

**File:** `components/berita/MagazineBentoHero.tsx`

| Elemen | Dimensi |
|--------|---------|
| Grid | `lg:grid-cols-12` (12 kolom) |
| Main image | Mengambil porsi besar dari grid |
| Right nav panel | `hidden lg:flex` — terlihat di lg+ |
| Image radius | `rounded-2xl` (16px) |
| Text overlay padding | `p-6` (24px) |
| Title font | `text-xl` (20px), max `max-w-[22ch]` |
| Category font | `text-[10px]` |

### 3.3 ZONA 1.5 — Leaderboard Ad

| Elemen | Dimensi |
|--------|---------|
| Height | `md:h-[250px]`, `md:min-h-[250px]` |
| Width | `w-full` (100%) |
| Bottom margin | `mb-6` (24px) |
| Label badge | `left-3 top-3` (12px offset) |

### 3.4 ZONA 2 — Fokus Redaksi

| Elemen | Dimensi |
|--------|---------|
| Grid | `md:grid-cols-3` (3 kolom) |
| Gap | `gap-4` (16px) |
| Left card | `md:col-span-2` (2/3 lebar) |
| Right column | `flex flex-col gap-3` (12px antar card) |
| Section header | `mb-5` (20px) |

### 3.5 ZONA 3 — Trending

| Elemen | Dimensi |
|--------|---------|
| Grid | `md:grid-cols-5` (5 kolom) |
| Gap | `gap-0` (divider via border) |
| Item padding | `md:px-4 md:py-0 md:pb-3` (16px horizontal, 12px bottom) |
| Number font | `md:text-3xl` (30px) |
| Title font | `md:text-[13px]` (13px) |

### 3.6 ZONA 4 — Main Feed + Sidebar

| Elemen | Dimensi |
|--------|---------|
| Outer grid | `lg:grid-cols-12` (12 kolom) |
| Gap | `lg:gap-6` (24px), `2xl:gap-8` (32px) |
| Main column | `lg:col-span-8` (8/12) |
| Sidebar | `lg:col-span-4` (4/12) |

#### Main Column

| Elemen | Dimensi |
|--------|---------|
| Feed spacing | `md:space-y-10` (40px antar section) |
| Featured cards gap | `gap-5` (20px) |
| Medium card grid | `md:grid-cols-2` (2 kolom) |
| Medium card gap | `xl:gap-6` (24px), `2xl:gap-8` (32px) |
| Section header | `mb-6` (24px), `pb-4` (16px) |
| Load more | `mt-8 pt-8` (32px + 32px) |

#### Sidebar

| Elemen | Dimensi |
|--------|---------|
| Widget spacing | `space-y-4` (16px) |
| Card padding | `md:p-4` (16px) |
| Card radius | `rounded-2xl` (16px) |
| Article item gap | `gap-2.5` (10px) |
| Number font | `text-xl` (20px) |

### 3.7 ZONA 5+ — Editorial Extras

| Section | Grid (md+) | Grid (2xl) | Gap | Aspect Ratio |
|---------|-----------|-----------|-----|--------------|
| Pilihan Editor | 3 kolom | 4 kolom | 24px | `aspect-[3/4]` |
| Opini & Analisis | 3 kolom | 4 kolom | 24px | — |
| Foto Jurnalistik | 3 kolom | 3 kolom | 20px | `aspect-[4/5]` |
| Video Eksklusif | 3 kolom | 4 kolom | 24px | `aspect-video` (16:9) |

| Elemen | Dimensi |
|--------|---------|
| Card radius | `rounded-2xl` (16px) |
| Card shadow | `shadow-md` |
| Text overlay padding | `p-5 md:p-6` (20/24px) |
| Section spacing | `md:space-y-10` (40px) |
| Section header | `mb-6` (24px) |

---

## 4. Halaman Artikel

**File:** `app/[site]/artikel/[slug]/page.tsx`

### 4.1 Hero Image

| Breakpoint | Height | Min | Max |
|------------|--------|-----|-----|
| md | `md:h-[55vh]` | `md:min-h-[450px]` | `max-h-[600px]` |
| lg | `lg:h-[60vh]` | `md:min-h-[450px]` | `max-h-[600px]` |

| Elemen | Dimensi |
|--------|---------|
| Text overlay max-width | `max-w-4xl` (896px) |
| Title font | `md:text-4xl` (36px), `lg:text-5xl` (48px) |
| Title bottom margin | `md:mb-6` (24px) |
| Caption max-width | `max-w-5xl` (1024px) |

### 4.2 Content Rail (Main Layout)

```
┌──────────────────────────────────────────────────────────┐
│ xl:grid-cols-[minmax(0,1.75fr)_20rem]                    │
│ 2xl:grid-cols-[minmax(0,1.75fr)_22.5rem]                 │
│                                                          │
│ ┌──────────────────────────┐  ┌────────────────────┐     │
│ │  Main Content            │  │  Sidebar           │     │
│ │  (1.75fr ≈ 760px)        │  │  20rem (320px)     │     │
│ │                          │  │  2xl: 22.5rem      │     │
│ │  ┌──────┐ ┌───────────┐  │  │       (360px)      │     │
│ │  │Share │ │ Article   │  │  │                    │     │
│ │  │Rail  │ │ Body      │  │  │  [Author Card]     │     │
│ │  │68px  │ │ max 640px │  │  │  [Rectangle Ad]    │     │
│ │  │      │ │           │  │  │  [Popular]         │     │
│ │  │      │ │           │  │  │  [Tags]            │     │
│ │  └──────┘ └───────────┘  │  │                    │     │
│ └──────────────────────────┘  └────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

| Elemen | xl | 2xl |
|--------|-----|-----|
| Gap | `xl:gap-12` (48px) | `2xl:gap-16` (64px) |
| Sidebar width | `20rem` (320px) | `22.5rem` (360px) |
| Share rail width | `4.25rem` (68px) | `4.5rem` (72px) |
| Article body max | `40rem` (640px) | `42rem` (672px) |
| Share rail position | `sticky top-32` (128px dari atas) |
| Sidebar position | `sticky top-32` (128px dari atas) |

### 4.3 Article Body Content

| Elemen | Dimensi |
|--------|---------|
| Block spacing | `space-y-8` (32px) |
| Body font | `text-[calc(1.05rem*var(--article-font-scale))]` (~16.8px) |
| Line height | `leading-[calc(1.85rem*var(--article-font-scale))]` (~29.6px) |
| Lead paragraph font | `text-[calc(1.25rem*...)]` (~20px) |
| h2 font | `md:text-[calc(1.75rem*...)]` (~28px) |
| h2 margin | `md:mt-12 md:mb-6` (48px / 24px) |
| h3 font | `md:text-[calc(1.45rem*...)]` (~23.2px) |
| Quote padding | `md:px-8 md:py-10 lg:px-12` (32/48px horizontal, 40px vertical) |
| Quote font | `text-[calc(1.1rem*...)]` (~17.6px) |
| Image aspect | `aspect-video` (16:9) |
| Image radius | `rounded-xl` (12px) |
| Image margin | `my-10` (40px) |
| Gallery grid | `md:grid-cols-3` (3 kolom) |
| Gallery gap | `gap-2` (8px) |
| Callout padding | `md:p-8` (32px) |
| Media-text column | `md:w-1/2` (50% each) |
| Inline related card | `p-5` (20px), thumbnail `md:w-36 md:h-24` (144×96px) |

### 4.4 Sidebar Widgets

| Elemen | Dimensi |
|--------|---------|
| Widget spacing | `space-y-4` (16px) |
| Card padding | `p-4` (16px) |
| Card radius | `rounded-2xl` (16px) |
| Author card inner | `rounded-xl p-3` (12px radius, 12px padding) |
| Author avatar | `h-9 w-9` (36×36px) |
| Info grid | `grid-cols-2 gap-2.5` (10px gap) |
| Info cell | `rounded-xl px-3 py-2.5` (12px radius) |
| Popular spacing | `space-y-3` (12px) |
| Popular number | `h-7 w-7` (28×28px) |
| Tags | `flex-wrap gap-2` (8px) |

### 4.5 Recommended Articles

| Elemen | Dimensi |
|--------|---------|
| Grid | `lg:grid-cols-3` (3 kolom) |
| Gap | `gap-5` (20px) |
| Section margin | `mt-10 pt-8` (40px + 32px) |
| Title font | `text-lg` (18px) |

---

## 5. NewsCard

**File:** `components/ui/NewsCard.tsx`

### Variant: `large`

| Properti | Dimensi |
|----------|---------|
| Min height | `min-h-[340px]` |
| Radius | `rounded-2xl` (16px) |
| Title font | `lg:text-[1.6rem]` (25.6px) |
| Title max-width | `max-w-[75%]` |
| Excerpt font | `text-sm` (14px) |
| Padding | `p-6` (24px), `pb-8` (32px bottom) |
| Avatar | `h-7 w-7` (28×28px) |
| Bookmark | `h-11 w-11` (44×44px) |

### Variant: `medium` (default)

| Properti | Dimensi |
|----------|---------|
| Image aspect | `aspect-[16/9]` |
| Image radius | `rounded-xl` (12px) |
| Title font | `text-base` (16px) |
| Gap | `gap-3` (12px) |
| Avatar | `h-[18px] w-[18px]` (18×18px) |
| Bookmark | `h-11 w-11` (44×44px) |
| Badge position | `left-3.5 top-3.5` (14px) |

### Variant: `horizontal`

| Properti | Dimensi |
|----------|---------|
| Radius | `rounded-xl` (12px) |
| Padding | `p-3` (12px) |
| Thumbnail width | `md:w-36` (144px) |
| Thumbnail aspect | `aspect-[4/3]` |
| Thumbnail radius | `rounded-lg` (8px) |
| Title font | `md:text-[15px]` (15px) |
| Gap | `gap-4` (16px) |
| Avatar | `h-4 w-4` (16×16px) |
| Bookmark | `h-9 w-9` (36×36px) |

### Variant: `minimal`

| Properti | Dimensi |
|----------|---------|
| Title font | `text-sm` (14px) |
| Padding | `py-2 pr-12` (8px top/bottom, 48px right) |
| Gap | `gap-4` (16px) |
| Bookmark | `h-11 w-11` (44×44px) |

---

## 6. Slot Iklan (Ad Space)

**File:** `components/ui/AdSpace.tsx`

> Lihat `docs/ads.md` untuk dokumentasi lengkap sistem iklan.

| Slot ID | Nama Lokasi | Desktop | Tablet | Mobile | Rasio |
|---------|-------------|---------|--------|--------|-------|
| `HOME_TOP` | Hero Banner | 960×240 px | 728×182 px | 360×90 px | 4:1 |
| `HOME_FEED_1` | Feed Atas | 300×200 px | 300×200 px | 300×200 px | 3:2 |
| `HOME_FEED_2` | Feed Bawah | 300×150 px | 300×150 px | 300×150 px | 2:1 |
| `ARTICLE_TOP` | Artikel Atas | 300×200 px | 300×200 px | 300×200 px | 3:2 |
| `ARTICLE_MIDDLE` | Artikel Tengah | 300×150 px | 300×150 px | 300×150 px | 2:1 |
| `ARTICLE_BOTTOM` | Artikel Bawah | 300×150 px | 300×150 px | 300×150 px | 2:1 |

**Visibilitas:** Semua 6 slot tampil di **semua device** (desktop, tablet, mobile). Tidak ada slot sidebar — semua iklan berada di dalam alur konten.

---

## 7. Dashboard Admin

**File:** `components/dashboard/ads/pages/AdsSlotsContent.tsx`

### Ads Slots Page (Card Grid)

| Elemen | Dimensi |
|--------|---------|
| Grid | `md:grid-cols-2 xl:grid-cols-3` (2-3 kolom) |
| Gap | `gap-5` (20px) |
| Card preview aspect | `aspect-[970/250]` |
| Stats font | `text-xs` (12px) |
| Upload button | `py-2.5` (10px), `text-[10px]` |

---

## 8. Ringkasan Dimensi Kunci

| Elemen | Nilai |
|--------|-------|
| Container max-width | **1160px** |
| Content max-width | **680px** |
| Container padding (lg+) | **40px** |
| Homepage grid | **8 + 4** kolom (dari 12) |
| Homepage editorial grid | **3** kolom (2xl: 4) |
| Article rail | **1.75fr + 20rem** (xl), gap 48px |
| Article body max | **640px** (xl), 672px (2xl) |
| Article sidebar | **320px** (xl), 360px (2xl) |
| Share rail | **68px** (xl), 72px (2xl) |
| Ad height (semua slot) | **250px** |
| NewsCard large min-h | **340px** |
| NewsCard medium image | **16:9** |
| Card border-radius | **16px** (`rounded-2xl`) |
| Card shadow | `shadow-md` |
| Section spacing | **40px** (`md:space-y-10`) |
| Widget spacing | **16px** (`space-y-4`) |

---

*Dokumentasi dibuat dari codebase aktual — 27 Juni 2026*
