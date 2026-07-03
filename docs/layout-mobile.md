# Layout Mobile — BeritaKarya

Referensi dimensi layout untuk viewport **< 640px (mobile)** kecuali ditandai lain. Semua nilai diambil langsung dari codebase. Tailwind tanpa prefix = mobile (mobile-first).

---

## 1. Container

**File:** `components/layout/Container.tsx`

| Elemen | Dimensi |
|--------|---------|
| Padding horizontal | `px-4` (16px) |
| Max width | `max-w-container` (1160px, tidak relevan di mobile) |
| Content max width | `max-w-content` (680px, tidak relevan di mobile) |
| Centering | `mx-auto` |

**Effective:** Semua konten punya padding 16px kiri-kanan. Konten mengisi penuh lebar viewport dikurangi 32px (16+16).

---

## 2. Public Site Layout

**File:** `components/layout/PublicSiteLayout.tsx`

| Elemen | Dimensi |
|--------|---------|
| Root min-height | `min-h-screen` (full viewport) |
| Bottom padding | `pb-28` (176px, ruang untuk MobileBottomNav) |

---

## 3. Homepage

**File:** `components/pages/SiteHomePage.tsx`

### 3.1 Overall Structure

```
┌──────────────────────────────┐
│  ZONA 1: Hero                │
│  py-5 (20px)                 │
│  grid-cols-1                 │
├──────────────────────────────┤
│  ZONA 1.5: Leaderboard Ad    │
│  h-[100px], py-4 (16px)      │
│  sticky bottom (fixed)       │
├──────────────────────────────┤
│  ZONA 2: Fokus Redaksi       │
│  py-4 (16px)                 │
│  grid-cols-1                 │
├──────────────────────────────┤
│  ZONA 3: Trending            │
│  pb-4 (16px)                 │
│  grid-cols-1 (stacked list)  │
├──────────────────────────────┤
│  ZONA 4: Main Feed           │
│  grid-cols-1 (full width)    │
│  gap-6 (24px)                │
│  Sidebar DI BAWAH konten     │
├──────────────────────────────┤
│  ZONA 5+: Editorial Extras   │
│  py-6 (24px)                 │
│  grid-cols-1 semua section   │
└──────────────────────────────┘
│  MobileBottomNav (fixed)     │
└──────────────────────────────┘
```

### 3.2 ZONA 1 — Hero (MagazineBentoHero)

**File:** `components/berita/MagazineBentoHero.tsx`

| Elemen | Dimensi |
|--------|---------|
| Grid | `grid-cols-1` (1 kolom) |
| Gap | `gap-4` (16px) |
| Image height | `h-[220px]` |
| Image radius | `rounded-2xl` (16px) |
| Text overlay padding | `p-5` (20px) |
| Title font | `text-sm` (14px) |
| Title max-width | `max-w-[22ch]` (22 karakter) |
| Title line-height | `leading-[1.2]` |
| Category margin | `mb-2.5` (10px) |
| Right nav panel | **HIDDEN** (`hidden lg:flex`) |
| Slider dots | `lg:hidden` (terlihat di mobile) |
| Dot active | `w-6` (24px wide) |
| Dot inactive | `w-1.5 h-1.5` (6×6px) |
| Dots margin | `mt-3` (12px), `gap-1.5` (6px) |

### 3.3 ZONA 1.5 — Leaderboard Ad

| Elemen | Dimensi |
|--------|---------|
| Height | `h-[100px]`, `min-h-[100px]` |
| Width | `w-full` (100%) |
| Margin bottom | `mb-6` (24px) |
| **Sticky behavior** | `fixed bottom-0 left-0 right-0 z-30` |
| Sticky background | `bg-white`, `border-t border-gray-200` |
| Sticky shadow | `shadow-[0_-4px_20px_rgba(0,0,0,0.1)]` |
| Close button | `w-6 h-6` (24×24px), muncul setelah 5 detik |
| Label badge | `left-2 top-2` (8px offset) |

### 3.4 ZONA 2 — Fokus Redaksi

| Elemen | Dimensi |
|--------|---------|
| Grid | `grid-cols-1` (1 kolom, stacked) |
| Gap | `gap-4` (16px) |
| Right column gap | `gap-3` (12px) |
| Section header | `mb-5` (20px) |

### 3.5 ZONA 3 — Trending

| Elemen | Dimensi |
|--------|---------|
| Grid | `grid-cols-1` (1 kolom, stacked list) |
| Gap | `gap-0` dengan `divide-y` (divider 1px) |
| Item padding | `py-3` (12px), `first:pt-0`, `last:pb-0` |
| Number font | `text-2xl` (24px) |
| Title font | `text-xs` (12px) |
| Meta font | `text-[10px]` (10px) |

### 3.6 ZONA 4 — Main Feed

| Elemen | Dimensi |
|--------|---------|
| Grid | `grid-cols-1` (1 kolom, sidebar di bawah) |
| Gap | `gap-6` (24px) |
| Feed spacing | `space-y-8` (32px antar section) |
| Featured cards gap | `gap-5` (20px) |
| Stream grid | `grid-cols-1` (1 kolom) |
| Stream gap | `gap-5` (20px) |
| Section header | `mb-6` (24px), `pb-4` (16px) |
| "Update Langsung" | **HIDDEN** (`hidden md:flex`) |
| "Lihat Arsip" | **HIDDEN** (`hidden md:inline-flex`) |
| Load more | `mt-8 pt-8` (32px + 32px) |

#### Sidebar (di bawah feed)

| Elemen | Dimensi |
|--------|---------|
| Widget spacing | `space-y-4` (16px) |
| Card padding | `p-3.5` (14px) |
| Card radius | `rounded-2xl` (16px) |
| Article item gap | `gap-2.5` (10px) |
| Article item padding | `py-2` (8px) |
| Number font | `text-xl` (20px) |
| Title font | `text-xs` (12px) |
| Category badge | `px-2 py-0.5` (8px / 2px) |

### 3.7 ZONA 5+ — Editorial Extras

| Section | Grid | Gap | Aspect Ratio |
|---------|------|-----|--------------|
| Pilihan Editor | `grid-cols-1` | `gap-5` (20px) | `aspect-[3/4]` |
| Opini & Analisis | `grid-cols-1` | `gap-5` (20px) | — |
| Foto Jurnalistik | `grid-cols-1` | `gap-5` (20px) | `aspect-[4/5]` |
| Video Eksklusif | `grid-cols-1` | `gap-5` (20px) | `aspect-video` (16:9) |

| Elemen | Dimensi |
|--------|---------|
| Card radius | `rounded-2xl` (16px) |
| Text overlay padding | `p-5` (20px) |
| Title font (Editor) | `text-base` (16px) |
| Title font (Foto) | `text-sm` (14px) |
| Title font (Video) | `text-sm` (14px) |
| Section spacing | `space-y-8` (32px) |
| Section header | `mb-6` (24px) |
| Play button | `h-12 w-12` (48×48px) |

---

## 4. Halaman Artikel

**File:** `app/[site]/artikel/[slug]/page.tsx`

### 4.1 Hero Image

| Elemen | Dimensi |
|--------|---------|
| Aspect | `aspect-video` (16:9) |
| Min height | `min-h-[200px]` |
| Max height | `max-h-[600px]` |
| Background | `bg-[#020617]` (dark navy) |
| Text padding | `pt-6 pb-8` (24px top, 32px bottom) |
| Title font | `text-2xl` (24px) |
| Title line-height | `leading-[1.1]` |
| Title max-width | `max-w-4xl` (896px) |
| Title margin | `mb-5` (20px) |
| Author avatar | `h-9 w-9` (36×36px) |
| Author name font | `text-[11px]` (11px) |
| Author role font | `text-[9px]` (9px) |
| Category font | `text-[10px]` (10px) |
| Date font | `text-[10px]` (10px) |
| Bookmark button | `h-8 w-8` (32×32px) |
| Gradient overlays | **HIDDEN** (`hidden md:block`) |

### 4.2 Content Layout

| Elemen | Dimensi |
|--------|---------|
| Layout | **Single column** (tidak ada grid, sidebar hidden) |
| Content area margin | `mb-12` (48px) |
| Article body font | `text-[calc(1rem*var(--article-font-scale))]` (16px) |
| Body line-height | `leading-[calc(1.75rem*...)]` (28px) |
| Lead paragraph | `text-[calc(1.125rem*...)]` (18px) |
| Max width | `max-w-content` (680px) |

### 4.3 Content Blocks

| Block | Dimensi |
|-------|---------|
| h2 font | `text-[calc(1.35rem*...)]` (~21.6px) |
| h2 margin | `mt-10 mb-5` (40px / 20px) |
| h3 font | `text-[calc(1.15rem*...)]` (~18.4px) |
| Quote padding | `px-5 py-8` (20px / 32px) |
| Quote font | `text-xl` (20px) |
| Image aspect | `aspect-video` (16:9) |
| Image radius | `rounded-xl` (12px) |
| Image margin | `my-10` (40px) |
| Gallery grid | `grid-cols-2` (2 kolom) |
| Gallery gap | `gap-2` (8px) |
| List padding | `pl-6` (24px) |
| List margin | `my-8` (32px) |
| Callout padding | `p-5` (20px) |
| Media-text | `w-full` (stacked, bukan side-by-side) |
| Inline related card | `p-4` (16px), thumbnail `w-28 h-20` (112×80px) |

### 4.4 In-Feed Ad (Mobile Only)

| Elemen | Dimensi |
|--------|---------|
| Margin | `my-10` (40px) |
| Height | `h-[100px]` |
| Visibility | `xl:hidden` (terlihat di mobile/tablet) |

### 4.5 Share & Tags

| Elemen | Dimensi |
|--------|---------|
| Share gap | `gap-3` (12px) |
| Share padding | `py-4` (16px) |
| Bookmark button | `h-9 w-9` (36×36px) |
| Tags margin | `mt-5` (20px) |
| Tags gap | `gap-2` (8px) |
| Tag padding | `px-2.5 py-1` (10px / 4px) |
| Tag font | `text-[9px]` (9px) |

### 4.6 Recommended Articles

| Elemen | Dimensi |
|--------|---------|
| Grid | `grid-cols-1` (1 kolom) |
| Gap | `gap-5` (20px) |
| Margin | `mt-10 pt-8` (40px / 32px) |
| Title font | `text-lg` (18px) |

### 4.7 Hidden on Mobile

| Komponen | Class |
|----------|-------|
| Sidebar | `hidden xl:block` |
| Floating tools | `hidden xl:block` |
| Hero gradient | `hidden md:block` |
| "Update Langsung" | `hidden md:flex` |
| "Lihat Arsip" | `hidden md:inline-flex` |

---

## 5. NewsCard

**File:** `components/ui/NewsCard.tsx`

### Variant: `large`

| Properti | Dimensi |
|----------|---------|
| Min height | `min-h-[340px]` |
| Radius | `rounded-2xl` (16px) |
| Title font | `text-lg` (18px) |
| Title max-width | `max-w-[75%]` |
| Excerpt font | `text-xs` (12px) |
| Excerpt max-width | `max-w-[80%]` |
| Padding | `p-5` (20px), `pb-12` (48px bottom) |
| Category font | `text-[11px]` (11px) |
| Avatar | `h-7 w-7` (28×28px) |
| Meta font | `text-[11px]` (11px) |
| Bookmark | `h-11 w-11` (44×44px) |

### Variant: `medium` (default)

| Properti | Dimensi |
|----------|---------|
| Image aspect | `aspect-[16/9]` |
| Image radius | `rounded-xl` (12px) |
| Title font | `text-sm` (14px) |
| Gap | `gap-2` (8px) |
| Avatar | `h-[18px] w-[18px]` (18×18px) |
| Meta font | `text-[11px]` (11px) |
| Bookmark | `h-11 w-11` (44×44px) |
| Badge position | `left-3.5 top-3.5` (14px) |

### Variant: `horizontal`

| Properti | Dimensi |
|----------|---------|
| Radius | `rounded-xl` (12px) |
| Padding | `p-3` (12px) |
| Thumbnail width | `w-28` (112px) |
| Thumbnail aspect | `aspect-[4/3]` |
| Thumbnail radius | `rounded-lg` (8px) |
| Title font | `text-sm` (14px) |
| Excerpt font | `text-xs` (12px) |
| Gap | `gap-4` (16px) |
| Avatar | `h-4 w-4` (16×16px) |
| Bookmark | `h-9 w-9` (36×36px) |

### Variant: `minimal`

| Properti | Dimensi |
|----------|---------|
| Title font | `text-xs` (12px) |
| Category font | `text-[11px]` (11px) |
| Padding | `py-2 pr-12` (8px / 48px right) |
| Gap | `gap-4` (16px) |
| Bookmark | `h-11 w-11` (44×44px) |

---

## 6. Slot Iklan (Ad Space)

**File:** `components/ui/AdSpace.tsx`

> Lihat `docs/ads.md` untuk dokumentasi lengkap sistem iklan.

| Slot ID | Nama Lokasi | Mobile Size | Desktop Size | Rasio |
|---------|-------------|-------------|--------------|-------|
| `HOME_TOP` | Hero Banner | 320×80 px | 800×200 px | 4:1 |
| `HOME_FEED_1` | Feed Atas | 210×70 px | 300×100 px | 3:1 |
| `HOME_FEED_2` | Feed Bawah | 180×60 px | 210×70 px | 3:1 |
| `ARTICLE_TOP` | Artikel Atas | 210×70 px | 300×100 px | 3:1 |
| `ARTICLE_MIDDLE` | Artikel Tengah | 180×60 px | 210×70 px | 3:1 |
| `ARTICLE_BOTTOM` | Artikel Bawah | 180×60 px | 210×70 px | 3:1 |

**Visibilitas di mobile:** Semua 6 slot tampil di mobile. Tidak ada slot sidebar.

→ **Total slot iklan di mobile: 3** (homepage), **3** (artikel)

---

## 7. Mobile Navigation

### 7.1 Mobile Bottom Nav

**File:** `components/layout/MobileBottomNav.tsx`

| Elemen | Dimensi |
|--------|---------|
| Visibility | `md:hidden` (mobile only) |
| Position | `fixed bottom-4 left-1/2` (16px dari bawah) |
| Width | `w-[91%]` (91% viewport) |
| Max width | `max-w-md` (448px) |
| Bar padding | `px-2 py-1.5` (8px / 6px) |
| Bar radius | `rounded-2xl` (16px) |
| Icon size | `size={18}` (18px) |
| Icon font | `text-[10px]` (10px) |
| Nav item padding | `px-2.5 py-1` (10px / 4px) |
| Nav item radius | `rounded-xl` (12px) |
| Badge min-width | `min-w-4` (16px) |
| Badge font | `text-[8px]` (8px) |
| z-index | `z-50` |

### 7.2 Mobile Article Tools

**File:** `components/ui/MobileArticleTools.tsx`

| Elemen | Dimensi |
|--------|---------|
| Visibility | `md:hidden` (mobile only) |
| Position | `fixed left-4 top-1/2` (16px dari kiri) |
| Toolbar padding | `p-2` (8px) |
| Toolbar radius | `rounded-[1.75rem]` (28px) |
| Action buttons | `h-11 w-11` (44×44px) |
| Button radius | `rounded-2xl` (16px) |
| Gap | `gap-2.5` (10px) |

**Collapsed state:**

| Elemen | Dimensi |
|--------|---------|
| Position | `fixed left-0 top-1/2` (flush ke kiri) |
| Tab size | `h-14 w-6` (56×24px) |
| Tab radius | `rounded-r-2xl` (16px kanan) |

**Share panel:**
- Width: `w-[15rem]` (240px)
- Radius: `rounded-[1.6rem]` (25.6px)
- Padding: `p-4` (16px)

**Font panel:**
- Width: `w-[11.5rem]` (184px)
- Radius: `rounded-[1.6rem]` (25.6px)
- Padding: `p-3.5` (14px)

---

## 8. Grid Columns Summary

| Section | Mobile | Desktop |
|---------|--------|---------|
| MagazineBentoHero | 1 | lg: 12 |
| Fokus Redaksi | 1 | md: 3 |
| Trending | 1 | md: 5 |
| Main feed + sidebar | 1 | lg: 12 (8+4) |
| Stream articles | 1 | md: 2 |
| Pilihan Editor | 1 | md: 3 (2xl: 4) |
| Opini & Analisis | 1 | md: 3 (2xl: 4) |
| Foto Jurnalistik | 1 | md: 3 |
| Video Eksklusif | 1 | md: 3 (2xl: 4) |
| Article recommended | 1 | sm: 2, lg: 3 |
| Article gallery | 2 | md: 3 |

---

## 9. Yang HIDDEN di Mobile

| Komponen | Class | Breakpoint |
|----------|-------|------------|
| Hero right nav | `hidden lg:flex` | < 1024px |
| "Update Langsung" | `hidden md:flex` | < 768px |
| "Lihat Arsip" | `hidden md:inline-flex` | < 768px |
| Article hero gradient | `hidden md:block` | < 768px |
| Article sidebar | `hidden xl:block` | < 1280px |
| Article floating tools | `hidden xl:block` | < 1280px |
| Rectangle ad slots | sidebar `hidden xl:block` | < 1280px |

---

## 10. Ringkasan Dimensi Kunci

| Elemen | Nilai |
|--------|-------|
| Container padding | **16px** |
| Content max-width | **680px** (tidak relevan, full-width) |
| Grid columns | **1** (semua section) |
| Hero image height | **220px** |
| Leaderboard ad height | **100px** (sticky bottom) |
| Article title font | **24px** |
| Article body font | **16px** |
| NewsCard large min-h | **340px** |
| NewsCard medium image | **16:9** |
| NewsCard horizontal thumb | **112px** wide, **4:3** |
| Card radius | **16px** (`rounded-2xl`) |
| Section spacing | **32px** (`space-y-8`) |
| Widget spacing | **16px** (`space-y-4`) |
| Bottom nav height | ~**56px** (fixed bottom) |
| Bottom nav width | **91%** viewport, max **448px** |
| Article tools button | **44×44px** |
| Touch target minimum | **44×44px** (bookmark, nav items) |

---

*Dokumentasi dibuat dari codebase aktual — 27 Juni 2026*
