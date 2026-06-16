# Audit UI/UX Komprehensif — BeritaKarya v0.1

> Audit ini mencakup 11 komponen public-facing, design system foundations, dan 8 dimensi evaluasi.
> Tanggal: 16 Juni 2026

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Skor Per Dimensi](#2-skor-per-dimensi)
3. [Temuan Kritis — Accessibility](#3-temuan-kritis--accessibility)
4. [Temuan Kritis — Color System](#4-temuan-kritis--color-system)
5. [Temuan Kritis — Mobile Experience](#5-temuan-kritis--mobile-experience)
6. [Temuan — Performance](#6-temuan--performance)
7. [Temuan — Dark Mode](#7-temuan--dark-mode)
8. [Temuan — Typography](#8-temuan--typography)
9. [Temuan — Error Handling & Empty States](#9-temuan--error-handling--empty-states)
10. [Temuan — NewsCard Sizing & Grid](#10-temuan--newscard-sizing--grid)
11. [Rencana Perbaikan (Prioritas)](#11-rencana-perbaikan-prioritas)
12. [File yang Akan Diubah](#12-file-yang-akan-diubah)
13. [Lampiran](#lampiran)

---

## 1. Ringkasan Eksekutif

Audit ini memeriksa **11 komponen** dan **3 file konfigurasi** di atas **8 dimensi** evaluasi. Dokumen audit sebelumnya (`implementation_plan_UI_UX.md`) hanya mencakup konsistensi visual (NewsCard sizing, grid gap, missing pages). Audit ini menambahkan dimensi yang belum ter-cover: **accessibility, color system integrity, mobile touch targets, performance, dan dark mode completeness**.

### Temuan Utama

| Prioritas | Jumlah | Contoh |
|---|---|---|
| 🔴 Kritis | 5 | Touch target < 44px, focus trap hilang, keyboard navigation terputus |
| 🟠 Tinggi | 7 | Navbar hardcoded colors, missing aria-labels, raw `<img>` tags |
| 🟡 Sedang | 6 | Font 8-10px, skeleton tanpa ARIA, framer-motion bundle cost |
| 🟢 Rendah | 5 | Non-standard rem values, placeholder contrast, missing `--border` var |

**Total: 23 temuan** (vs 11 di dokumen sebelumnya)

---

## 2. Skor Per Dimensi

| Dimensi | Skor | Catatan |
|---|---|---|
| **Accessibility** | 🔴 3/10 | Tidak ada focus ring, no skip link, no keyboard nav pada dropdown, no reduced motion |
| **Color System** | 🟠 5/10 | Token system bagus, tapi Navbar ~40 baris hardcoded slate/red |
| **Mobile Experience** | 🔴 4/10 | 10+ elemen di bawah 44px touch target, font 8-10px sulit dibaca |
| **Performance** | 🟡 7/10 | SmartImage excellent, tapi raw `<img>` di editorial, framer-motion per card |
| **Dark Mode** | 🟡 6/10 | Core tokens lengkap, tapi editorial badge & status warna tidak punya dark override |
| **Typography** | 🟡 6/10 | Font stack bagus, tapi scale tidak konsisten (8px-10px terlalu kecil) |
| **Error Handling** | 🟡 6/10 | Empty states baik, tapi NewsCard tanpa error boundary, search error hanya console.log |
| **NewsCard & Grid** | 🟡 7/10 | Struktur baik, sizing perlu dikurangi, grid gap tidak konsisten di 3 file |

---

## 3. Temuan Kritis — Accessibility

### 3.1 Touch Target di Bawah 44px Minimum (WCAG 2.5.8)

| Elemen | Ukuran Saat Ini | Minimum | File : Baris |
|---|---|---|---|
| Bookmark button (large) | 36px (`h-9 w-9`) | 44px | `NewsCard.tsx:82` |
| Bookmark button (medium/horizontal/minimal) | 32px (`h-8 w-8`) | 44px | `NewsCard.tsx:141,176,227` |
| Search button | ~33px (`p-2` + 17px icon) | 44px | `Navbar.tsx:144` |
| Theme toggle | ~31px (`p-2` + 15px icon) | 44px | `Navbar.tsx:164` |
| Mobile category chips | ~32px (`px-2.5 py-1.5`) | 44px | `Navbar.tsx:381-404` |
| Subcategory pills (level 2) | ~28px (`px-2.5 py-1`) | 44px | `Navbar.tsx:429-443` |
| Subcategory pills (level 3) | ~22px (`px-2 py-0.5`) | 44px | `Navbar.tsx:473-494` |
| Footer social icons | 30px (`h-[1.875rem]`) | 44px | `SiteFooter.tsx:101-113` |

**Dampak:** Semua elemen ini gagal memenuhi WCAG 2.5.8 Target Size (Minimum). Pengguna mobile dengan jari besar akan kesulitan menekan tombol yang benar.

### 3.2 Focus States Hilang atau Lemah

| Elemen | Masalah | File : Baris |
|---|---|---|
| FullScreenSearch close button | `focus:outline-none` tanpa pengganti | `FullScreenSearch.tsx:82-87` |
| MobileBottomNav buttons | `focus:outline-none` tanpa focus ring | `MobileBottomNav.tsx:139` |
| NewsCard `<Link>` wrappers | Tidak ada `focus-visible` style | `NewsCard.tsx:88` |
| Navbar category buttons | Tidak ada explicit focus style | `Navbar.tsx:263-298` |
| Navbar search input | `focus:ring-1` hanya 1px, 30% opacity — terlalu lemah | `Navbar.tsx:137` |

**Rekomendasi:** Tambahkan global `focus-visible` style di `globals.css`:
```css
:focus-visible {
  outline: 2px solid var(--brand-red);
  outline-offset: 2px;
}
```

### 3.3 Keyboard Navigation Terputus

| Masalah | Dampak | File : Baris |
|---|---|---|
| FullScreenSearch tidak punya `onKeyDown` untuk Escape | User tidak bisa menutup overlay dengan keyboard | `FullScreenSearch.tsx` |
| FullScreenSearch tidak punya focus trap | User bisa tab ke elemen di belakang overlay | `FullScreenSearch.tsx` |
| Subcategory dropdown hanya buka di `onMouseEnter` | Keyboard user tidak bisa mengakses submenu | `Navbar.tsx:301` |
| Tidak ada skip-to-content link | User harus tab melewati seluruh navbar untuk mencapai konten | `PublicSiteLayout.tsx` |

### 3.4 ARIA Attributes Hilang

| Elemen | Yang Dibutuhkan | File |
|---|---|---|
| FullScreenSearch overlay | `role="dialog"`, `aria-modal="true"`, `aria-label` | `FullScreenSearch.tsx` |
| FullScreenSearch close button | `aria-label="Tutup pencarian"` | `FullScreenSearch.tsx:82` |
| Theme toggle button | `aria-label="Ganti tema"` | `Navbar.tsx:164` |
| Bookmark link | `aria-label="Artikel tersimpan"` | `Navbar.tsx:150` |
| MobileBottomNav buttons | `aria-label` dari data `label` | `MobileBottomNav.tsx:136-143` |
| Profile dropdown trigger | `aria-expanded`, `aria-haspopup="menu"` | `Navbar.tsx:185` |
| Profile dropdown menu | `role="menu"`, `role="menuitem"` | `Navbar.tsx:192-213` |
| Skeleton loaders | `role="status"`, `aria-label="Memuat..."` | `Skeleton.tsx` |
| Search results area | `aria-live="polite"` | `FullScreenSearch.tsx` |
| BreakingNewsTicker | `aria-live="polite"` | `BreakingNewsTicker.tsx` |

### 3.5 `prefers-reduced-motion` Tidak Diimplementasikan

Semua animasi di `globals.css` (fadeIn, slideInRight, countUp, shimmer) berjalan tanpa memeriksa preferensi user. Framer-motion di NewsCard, Navbar, MobileBottomNav, dan BreakingNewsTicker juga tidak memeriksa reduced motion.

**Rekomendasi:** Tambahkan di `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Dan gunakan hook framer-motion:
```typescript
const prefersReducedMotion = useReducedMotion()
```

---

## 4. Temuan Kritis — Color System

### 4.1 Arsitektur Token (Baik)

Sistem warna menggunakan CSS custom properties di `globals.css:8-86` (`:root`) dan `:88-122` (`.dark`), dipetakan ke Tailwind via `tailwind.config.ts:32-39` dengan pattern `rgb(var(--xxx-rgb) / <alpha>)`. Ini memungkinkan opacity modifier dan konsistensi tema.

**Token yang sudah ada:**
- `brand-red` (#B91C1C / #EF4444 dark)
- `brand-black` (#0F172A / #F8FAFC dark)
- `brand-dark` (#020617)
- `brand-grey` (#F1F5F9)
- `brand-surface` (#F1F5F9)
- `brand-text` (#0F172A / #F8FAFC dark)
- `brand-text-muted` (#64748B)
- `bg-main` (#F8FAFC / #020617 dark)

### 4.2 Navbar: ~40 Baris Hardcoded Colors (Kritis)

`Navbar.tsx` adalah pelanggar terburuk. Menggunakan warna Tailwind mentah (`slate-*`, `red-*`) alih-alih token `brand-*`:

| Pattern | Jumlah Kemunculan | Seharusnya |
|---|---|---|
| `bg-slate-950` / `bg-slate-900` | ~15x | `bg-brand-dark` / `bg-brand-black` |
| `text-slate-400` / `text-slate-500` | ~12x | `text-brand-text-muted` |
| `border-slate-800` / `border-slate-900` | ~8x | `border-brand-black` |
| `text-red-500` / `bg-red-500` | ~10x | `text-brand-red` / `bg-brand-red` |

**Dampak:** Jika `brand-red` diubah dari `#B91C1C` ke warna lain, Navbar tidak akan ikut berubah. Ini menciptakan maintenance debt dan risiko inkonsistensi.

### 4.3 Hardcoded Colors di File Lain

| File | Baris | Warna | Seharusnya |
|---|---|---|---|
| `BreakingNewsTicker.tsx` | 48 | `dark:from-[#020617]` | `dark:from-brand-dark` |
| `FullScreenSearch.tsx` | 75 | `bg-slate-950/95` | `bg-brand-dark/95` |
| `SiteHomePage.tsx` | 852 | `bg-slate-950` | `bg-brand-dark` |

### 4.4 Non-Standard Opacity Values

`app/[site]/artikel/[slug]/page.tsx:510` menggunakan `bg-brand-red/8` dan `dark:bg-brand-red/12`. Tailwind default opacity scale menggunakan `/5, /10, /15, /20, ...` — nilai `/8` dan `/12` mungkin tidak ter-compile.

### 4.5 Missing CSS Variable

`tailwind.config.ts:40` mereferensikan `hsl(var(--border))` tapi `--border` tidak didefinisikan di `globals.css`. Ini kemungkinan leftover dari shadcn/ui.

---

## 5. Temuan Kritis — Mobile Experience

### 5.1 Mobile Typography Terlalu Kecil

Ukuran font yang digunakan di mobile:

| Ukuran | Jumlah Penggunaan | Keterbacaan |
|---|---|---|
| `text-[8px]` | ~10x (article sidebar) | ❌ Tidak terbaca di mobile |
| `text-[9px]` | ~15x (footer, sidebar) | ❌ Hampir tidak terbaca |
| `text-[10px]` | ~50x (metadata, labels) | ⚠️ Sulit dibaca di mobile |
| `text-[11px]` | ~20x (navbar items) | ⚠️ Cukup, tapi di batas |

**Konteks:** `text-[8px]` muncul di article page sidebar (page.tsx:276, 501, 520, 529, 538, 551) untuk label statistik. Ini setara dengan ~6pt — jauh di bawah rekomendasi WCAG.

### 5.2 Responsive Breakpoints (Baik)

Penggunaan breakpoint sudah konsisten:
- `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px), `2xl:` (1536px)
- Mobile bottom nav correctly hidden on `md:`
- Navbar collapse pada breakpoint yang tepat
- Article sidebar muncul pada `xl:`

### 5.3 Container System (Baik)

Token container sudah terdefinisi dengan baik:
- Mobile: 1rem padding
- Tablet: 2rem padding
- Desktop: 2.5rem padding
- Max-width: 1160px (container), 760px (content/reading)

---

## 6. Temuan — Performance

### 6.1 SmartImage.tsx — Implementasi Excellent

Komponen ini adalah salah satu yang terbaik di codebase:

| Fitur | Status |
|---|---|
| Context-aware `sizes` (12 konteks) | ✅ |
| Quality per context (70-95) | ✅ |
| Slow connection detection (`navigator.connection`) | ✅ |
| Progressive fallback (source → thumb → fallback → broken) | ✅ |
| Lazy loading default | ✅ |
| Image prefetch on hover | ✅ |
| Blur placeholder + dominant color | ✅ |

### 6.2 Raw `<img>` Tags di Editorial Sections

`SiteHomePage.tsx` menggunakan raw `<img>` di 3 lokasi editorial, melewati seluruh optimasi SmartImage:

| Lokasi | Baris | Dampak |
|---|---|---|
| Editorial section 1 | 737-743 | Tidak lazy, tidak responsive, tidak ada fallback |
| Editorial section 2 | 828-831 | Sama |
| Editorial section 3 | 875-880 | Sama |

### 6.3 Bundle Concern: framer-motion per Card

`NewsCard.tsx` mengimpor `framer-motion` hanya untuk `whileHover` animation. Di homepage dengan 15+ kartu, ini menambah:
- ~30KB gzipped ke bundle (framer-motion tree-shakeable tapi tetap signifikan)
- Runtime cost untuk setiap instance `<motion.article>`

**Rekomendasi:** Gunakan CSS `transition` + `hover:` Tailwind untuk hover effects yang sederhana. Simpan framer-motion untuk animasi yang benar-benar membutuhkannya.

### 6.4 react-icons Import

`SiteHomePage.tsx:6` mengimpor `react-icons/si` hanya untuk WhatsApp dan Telegram icons. Lucide-react sudah tersedia dan lebih ringan.

---

## 7. Temuan — Dark Mode

### 7.1 Core Token Coverage (Baik)

Semua token brand punya override dark mode:
- `brand-red`: #B91C1C → #EF4444
- `brand-black`: #0F172A → #F8FAFC
- `bg-main`: #F8FAFC → #020617
- Panel tokens: full dark blue-gray palette

### 7.2 Missing Dark Mode Overrides

| Token Group | Light Mode | Dark Mode | Status |
|---|---|---|---|
| Editorial badges (`--color-breaking`, `--color-exclusive`, `--color-analysis`, `--color-live`) | Defined | **Tidak ada override** | ❌ |
| Workflow status (`--status-draft` through `--status-archived`) | Defined | **Tidak ada override** | ❌ |
| Dashboard tokens (`--dash-sidebar`, `--dash-card`, `--dash-border`) | Defined | **Tidak ada override** | ❌ |

### 7.3 Komponen yang Sudah Dark-Mode Aware

| Komponen | Status |
|---|---|
| NewsCard.tsx | ✅ Konsisten `dark:` prefix |
| Skeleton.tsx | ✅ `dark:bg-slate-800`, `dark:via-white/10` |
| SiteFooter.tsx | ✅ `dark:border-white/5 dark:bg-[#020617]` |
| MobileBottomNav.tsx | ✅ `dark:border-white/10 dark:bg-slate-900/85` |
| SiteHomePage.tsx | ✅ Extensive `dark:` prefixes |
| Article page | ✅ `dark:` pada semua section utama |

### 7.4 Navbar: Always Dark (Design Decision)

Navbar menggunakan `bg-slate-950/98` secara konstan, tidak mengikuti tema. Ini adalah keputusan desain, bukan bug, tapi perlu didokumentasikan secara eksplisit karena category labels di light mode tetap white-on-dark.

---

## 8. Temuan — Typography

### 8.1 Font Stack (Baik)

| Role | Font | Weight | Penggunaan |
|---|---|---|---|
| Body | Plus Jakarta Sans | 300-900 | Default text, UI elements |
| Secondary | Inter | 300-900 | Dashboard values, data |
| Display | Playfair Display | 400-900 | Drop cap, article headings |

OpenType features enabled: `cv02, cv03, cv04, cv11`
Subpixel rendering: antialiased

### 8.2 Font Size Scale Tidak Konsisten

NewsCard heading sizes menggunakan nilai non-standard:
- `text-[0.92rem]` (minimal)
- `text-[0.98rem]` (horizontal)
- `text-[1.08rem]` (medium)
- `text-[1.18rem]` (medium md)

Nilai-nilai ini sulit di-maintain dan tidak mengikuti scale yang terdefinisi.

### 8.3 Article Font Scale (Baik)

`--article-font-scale` CSS variable di `page.tsx:657,675-678,692,794` memungkinkan user menyesuaikan ukuran font. Ini excellent untuk accessibility, tapi hanya diterapkan di area konten artikel.

### 8.4 Line Heights

| Konteks | Line Height | Status |
|---|---|---|
| Article body (mobile) | `leading-[1.8]` | ✅ Baik |
| Article body (desktop) | `leading-[1.9]` | ✅ Baik |
| NewsCard headings | `leading-[1.15]` to `leading-[1.2]` | ✅ Tight, cocok untuk headlines |
| Footer text | `leading-6` | ✅ |

---

## 9. Temuan — Error Handling & Empty States

### 9.1 Empty States (Baik)

| Komponen | Pesan | CTA | Status |
|---|---|---|---|
| SiteHomePage (kategori kosong) | Deskriptif | "Kembali Ke Berita Terbaru" | ✅ |
| FullScreenSearch (hasil kosong) | "Tidak ada artikel yang cocok" | — | ✅ |
| FullScreenSearch (no query) | Instruksi | — | ✅ |
| Article related (kosong) | Dashed border | — | ✅ |
| Article sidebar (kosong) | Ikon + CTA | Link ke kategori | ✅ |
| SavedArticlesFeed (kosong) | "Belum ada artikel tersimpan" | "Jelajahi Berita" | ✅ |
| Author page (kosong) | "Belum ada artikel terbit" | — | ✅ |

### 9.2 Error Handling yang Hilang

| Komponen | Masalah | File |
|---|---|---|
| NewsCard | Tidak ada error boundary — null article crash | `NewsCard.tsx` |
| FullScreenSearch | Error hanya `console.error`, tidak ada UI feedback | `FullScreenSearch.tsx:57-58` |
| LoadMoreArticles | Error hanya `console.error` | `LoadMoreArticles.tsx:53` |
| SiteHomePage editorial `<img>` | Tidak ada `onError` fallback | `SiteHomePage.tsx:737,828,875` |

### 9.3 Loading States

| Komponen | Mekanisme | Status |
|---|---|---|
| Skeleton.tsx | 6 variant (hero, card, minimal, trending, text, stat, list) | ✅ |
| SmartImage.tsx | Animated pulse shimmer | ✅ |
| FullScreenSearch | Bouncing dots | ✅ |
| LoadMoreArticles | Spinner icon + "Menyelaraskan Data..." | ✅ |
| SiteHomePage (initial) | Server-side ISR, no explicit loading | ✅ OK |

---

## 10. Temuan — NewsCard Sizing & Grid

### 10.1 Dimensi per Varian

| Varian | Image | Judul Font | Line Clamp | Catatan |
|---|---|---|---|---|
| **large** | `h-[420px]` md `h-[480px]` | `text-xl` → `text-[2rem]` | 3 | Fixed height, cocok untuk hero |
| **medium** | `aspect-[16/10]` | `text-[1.08rem]` → `text-[1.18rem]` | 3 | Responsive, baik |
| **horizontal** | `w-28` md `w-36` | `text-[0.98rem]` → `text-[1.1rem]` | 3 | Cukup baik |
| **minimal** | — | `text-[0.92rem]` → `text-[1rem]` | 3 | Di sisi kecil |

### 10.2 Grid Gap Inkonsisten

| File | Gap Saat Ini | Seharusnya |
|---|---|---|
| `SiteHomePage.tsx` (feed) | `gap-5 xl:gap-6` | ✅ Konsisten |
| `artikel/[slug]/page.tsx` (related) | `gap-5` | ✅ |
| `penulis/[id]/page.tsx` | `gap-x-12 gap-y-16` | ❌ Terlalu besar |
| `SavedArticlesFeed.tsx` | `gap-x-12 gap-y-16` | ❌ Terlalu besar |
| `LoadMoreArticles.tsx` | `gap-x-12 gap-y-16` | ❌ Terlalu besar |

### 10.3 Metadata Font

Semua varian menggunakan `text-[10px]` untuk metadata (kategori, tanggal, author). Ini terlalu kecil untuk mobile. Rekomendasi: minimum `text-[11px]` atau `text-xs` (12px).

---

## 11. Rencana Perbaikan (Prioritas)

### Fase 0: Accessibility Foundation (Estimasi: 3-4 jam) — PRIORITAS TERTINGGI

| # | Task | File | Detail | Status |
|---|---|---|---|---|
| 0.1 | Global focus-visible style | `globals.css` | `outline: 2px solid var(--brand-red); outline-offset: 2px` | ✅ |
| 0.2 | prefers-reduced-motion | `globals.css` | Disable all animations when user prefers reduced motion | ✅ |
| 0.3 | Skip-to-content link | `PublicSiteLayout.tsx` | Tambah link "Langsung ke konten" sebelum navbar | ✅ |
| 0.4 | FullScreenSearch a11y | `FullScreenSearch.tsx` | `role="dialog"`, `aria-modal`, focus trap, Escape key, `aria-live` results | ✅ |
| 0.5 | Navbar keyboard nav | `Navbar.tsx` | Subcategory dropdown via `onKeyDown` (Enter/Space), `aria-expanded` | ✅ |
| 0.6 | Missing aria-labels | Multiple | Theme toggle, bookmark link, MobileBottomNav buttons, search close | ✅ |
| 0.7 | Skeleton ARIA | `Skeleton.tsx` | `role="status"`, `aria-label="Memuat konten"` | ✅ |
| 0.8 | NewsCard error boundary | `NewsCard.tsx` | Null guard + fallback UI | ✅ |

### Fase 1: Touch Targets & Color Tokens (Estimasi: 2-3 jam) — PRIORITAS TINGGI

| # | Task | File | Detail | Status |
|---|---|---|---|---|
| 1.1 | Bookmark buttons → 44px | `NewsCard.tsx` | `h-11 w-11` (44px) dengan `aria-label` | ✅ |
| 1.2 | Navbar icon buttons → 44px | `Navbar.tsx` | `p-3` minimum, icon 16-18px | ✅ |
| 1.3 | Category chips → 44px | `Navbar.tsx` | `py-2` minimum | ✅ |
| 1.4 | Subcategory pills → 44px | `Navbar.tsx` | `py-2` minimum | ✅ |
| 1.5 | Footer social icons → 44px | `SiteFooter.tsx` | Container `h-11 w-11` dengan icon di dalam | ✅ |
| 1.6 | Navbar → brand tokens | `Navbar.tsx` | Ganti `slate-*` / `red-*` → `brand-*` tokens (~40 baris) | ✅ |
| 1.7 | BreakingNewsTicker hex | `BreakingNewsTicker.tsx` | `dark:from-[#020617]` → `dark:from-brand-dark` | ✅ |
| 1.8 | FullScreenSearch colors | `FullScreenSearch.tsx` | `bg-slate-950/95` → `bg-brand-dark/95` | ✅ (Fase 0) |

### Fase 2: NewsCard & Grid Consistency (Estimasi: 1-2 jam) — PRIORITAS SEDANG

| # | Task | File | Detail | Status |
|---|---|---|---|---|
| 2.1 | Kecilkan medium variant | `NewsCard.tsx` | Aspect `16/10` → `16/9`, line-clamp 3→2 | ✅ |
| 2.2 | Kecilkan horizontal variant | `NewsCard.tsx` | Image `w-24` md `w-28`, line-clamp 3→2 | ✅ |
| 2.3 | Kurangi minimal padding | `NewsCard.tsx` | `py-3.5` → `py-3` | ✅ |
| 2.4 | Standardize grid gaps | 4 files | `gap-x-12 gap-y-16` → `gap-5 md:gap-6` | ✅ |
| 2.5 | Metadata font → 11px | `NewsCard.tsx` | `text-[10px]` → `text-[11px]` | ✅ |
| 2.6 | Standardize heading sizes | `NewsCard.tsx` | `text-sm`/`text-base`/`text-lg` | ✅ |

### Fase 3: Performance & Missing Pages (Estimasi: 1-2 jam) — PRIORITAS SEDANG

| # | Task | File | Detail | Status |
|---|---|---|---|---|
| 3.1 | Raw `<img>` → lazy loading | `SiteHomePage.tsx` | Tambah `loading="lazy" decoding="async"` | ✅ (Fase 2) |
| 3.2 | CSS hover alih-alih framer-motion | `NewsCard.tsx` | Hapus framer-motion, gunakan CSS `transition-transform hover:` | ✅ |
| 3.3 | Halaman 404 global | `app/not-found.tsx` | 404 page dengan icon, link beranda | ✅ |
| 3.4 | Halaman 404 per site | `app/[site]/not-found.tsx` | 404 dengan search bar, link beranda | ✅ |
| 3.5 | Search error UI | `FullScreenSearch.tsx` | Error message ditampilkan ke user | ✅ (Fase 0) |
| 3.6 | LoadMore error UI | `LoadMoreArticles.tsx` | Error message + retry button | ✅ |

### Fase 4: Dark Mode & Cleanup (Estimasi: 1 jam) — PRIORITAS RENDAH

| # | Task | File | Detail |
|---|---|---|---|
| 4.1 | Editorial badge dark overrides | `globals.css` | Tambahkan `.dark` overrides untuk `--color-*` |
| 4.2 | Workflow status dark overrides | `globals.css` | Tambahkan `.dark` overrides untuk `--status-*` |
| 4.3 | Hapus `--border` reference | `tailwind.config.ts` | Hapus atau definisikan `--border` di globals.css |
| 4.4 | Footer font minimum | `SiteFooter.tsx` | Copyright 10px → 12px minimum |

---

## 12. File yang Akan Diubah

### File Inti (Modifikasi)

| # | File | Fase | Perubahan Utama |
|---|---|---|---|
| 1 | `globals.css` | 0, 4 | Focus-visible, reduced-motion, dark mode overrides |
| 2 | `Navbar.tsx` | 0, 1 | ARIA labels, keyboard nav, touch targets, brand tokens |
| 3 | `NewsCard.tsx` | 0, 2, 3 | Error boundary, sizing, grid gaps, CSS hover |
| 4 | `FullScreenSearch.tsx` | 0, 1, 3 | Dialog a11y, focus trap, Escape, error UI, colors |
| 5 | `MobileBottomNav.tsx` | 0 | ARIA labels, focus rings |
| 6 | `SiteFooter.tsx` | 1, 4 | Touch targets, font minimum |
| 7 | `PublicSiteLayout.tsx` | 0 | Skip-to-content link |
| 8 | `Skeleton.tsx` | 0 | ARIA attributes |
| 9 | `SiteHomePage.tsx` | 1, 2, 3 | Grid gaps, raw `<img>` → SmartImage |
| 10 | `app/[site]/artikel/[slug]/page.tsx` | 2 | Grid gaps |
| 11 | `app/[site]/penulis/[id]/page.tsx` | 2 | Grid gaps |
| 12 | `SavedArticlesFeed.tsx` | 2 | Grid gaps |
| 13 | `LoadMoreArticles.tsx` | 2, 3 | Grid gaps, error UI |
| 14 | `app/[site]/loading.tsx` | 2 | Skeleton grid gaps |
| 15 | `tailwind.config.ts` | 4 | Hapus `--border` reference |

### File Baru

| # | File | Fase | Deskripsi |
|---|---|---|---|
| 1 | `app/not-found.tsx` | 3 | Halaman 404 global |
| 2 | `app/[site]/not-found.tsx` | 3 | Halaman 404 per site |

**Total: 15 file modifikasi + 2 file baru = 17 file**

---

## Lampiran

### A. Semua File yang Diaudit

| No | File | Baris | Fungsi |
|---|---|---|---|
| 1 | `components/ui/SmartImage.tsx` | 224 | Komponen gambar responsif |
| 2 | `components/ui/NewsCard.tsx` | 280 | Kartu berita (4 varian) |
| 3 | `components/ui/Skeleton.tsx` | 94 | Skeleton loading |
| 4 | `components/ui/BreakingNewsTicker.tsx` | 80 | Ticker berita terkini |
| 5 | `components/ui/FullScreenSearch.tsx` | 186 | Pencarian fullscreen |
| 6 | `components/layout/Navbar.tsx` | 499 | Navigasi utama |
| 7 | `components/layout/SiteFooter.tsx` | 176 | Footer |
| 8 | `components/layout/PublicSiteLayout.tsx` | 122 | Layout publik |
| 9 | `components/layout/MobileBottomNav.tsx` | 148 | Navigasi bawah mobile |
| 10 | `components/pages/SiteHomePage.tsx` | 902 | Halaman utama |
| 11 | `app/[site]/artikel/[slug]/page.tsx` | 855 | Halaman artikel |
| 12 | `app/[site]/penulis/[id]/page.tsx` | 495 | Halaman penulis |
| 13 | `components/ui/SavedArticlesFeed.tsx` | ~88 | Artikel tersimpan |
| 14 | `components/ui/LoadMoreArticles.tsx` | ~97 | Load more pagination |
| 15 | `app/[site]/loading.tsx` | 46 | Skeleton loading page |
| 16 | `app/globals.css` | ~453 | Design system foundations |
| 17 | `tailwind.config.ts` | ~82 | Tailwind configuration |

### B. Perbandingan dengan Dokumen Sebelumnya

| Aspek | `implementation_plan_UI_UX.md` | Dokumen Ini |
|---|---|---|
| Dimensi evaluasi | 3 (visual consistency) | 8 (+ a11y, color, mobile, perf, dark mode) |
| Jumlah temuan | 11 | 23 |
| Accessibility | Tidak ada | 10 temuan |
| Color system | Tidak ada | 5 temuan |
| Mobile touch targets | Tidak ada | 8 elemen < 44px |
| Performance | Tidak ada | 4 temuan |
| Dark mode | Tidak ada | 3 temuan |
| NewsCard sizing | ✅ Ada | ✅ Dilengkapi dengan readability analysis |
| Grid gap | ✅ Ada | ✅ Sama |
| Missing pages (404) | ✅ Ada | ✅ Sama |

---

*Dokumen ini dibuat berdasarkan audit kode langsung terhadap 17 file di BeritaKarya v0.1. Semua temuan mencantumkan file dan nomor baris untuk verifikasi.*
