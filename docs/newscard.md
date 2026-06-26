# Laporan Komponen NewsCard

> **File**: `apps/web/components/ui/NewsCard.tsx`
> **Tanggal**: 26 Juni 2026

---

## Ringkasan

`NewsCard` adalah komponen kartu artikel utama di frontend BeritaKarya. Mendukung **4 variant** visual dan digunakan di **5 halaman/section** berbeda.

---

## 1. Daftar Variant NewsCard

### 1.1 `large` — Hero/Featured Card

| Aspek | Detail |
|-------|--------|
| **Layout** | Full-width, vertikal (gambar di atas, teks di bawah) |
| **Aspect ratio** | Min-height 340px, gambar fill penuh |
| **Gambar** | Full-bleed background dengan overlay gradient (`from-slate-950 via-slate-950/55 to-transparent`) |
| **Badge** | `EditorialBadge` (breaking/exclusive/featured) + category label merah |
| **Judul** | `text-lg` → `md:text-xl` → `lg:text-[1.6rem]`, max-w-[75%], line-clamp-2, font-extrabold |
| **Excerpt** | 2 baris, `text-xs` → `md:text-sm`, max-w-[80%], warna `gray-300`, opacity-90 |
| **Meta** | Avatar penulis + nama, tanggal (Clock icon), waktu baca (BookOpen icon) |
| **Bookmark** | Tombol di kanan atas, style bulat transparan atas gambar |
| **Hover** | `hover:-translate-y-0.5`, gambar `scale-[1.03]` |
| **Warna teks** | Putih (karena di atas gambar gelap) |

### 1.2 `medium` — Standar Card Grid

| Aspek | Detail |
|-------|--------|
| **Layout** | Vertikal (gambar atas, konten bawah) |
| **Aspect ratio** | Gambar `aspect-[16/9]` |
| **Gambar** | Rounded-xl, object-cover, `scale-[1.03]` on hover |
| **Badge** | `EditorialBadge` di atas gambar (kiri atas) |
| **Kategori** | Label warna di bawah gambar |
| **Judul** | `text-sm` → `text-base`, line-clamp-2, font-extrabold |
| **Excerpt** | Tidak ditampilkan |
| **Meta** | Avatar penulis + nama, separator, tanggal, separator, waktu baca |
| **Bookmark** | Di atas gambar kanan atas, bulat transparan |
| **Hover** | `hover:-translate-y-1 hover:scale-[1.01]` |

### 1.3 `minimal` — Sidebar/Compact Card

| Aspek | Detail |
|-------|--------|
| **Layout** | Horizontal ringkas, tanpa gambar |
| **Gambar** | Tidak ada |
| **Badge** | `EditorialBadge` + category label |
| **Judul** | `text-xs` → `text-sm`, line-clamp-3, font-bold |
| **Meta** | Nama penulis + tanggal, separator bullet |
| **Bookmark** | Di kanan atas, bulat dengan border |
| **Hover** | Judul berubah ke `brand-red` |
| **Pembatas** | Border-bottom antar item |

### 1.4 `horizontal` — Card Horizontal

| Aspek | Detail |
|-------|--------|
| **Layout** | Horizontal (gambar kiri, teks kanan) |
| **Aspect ratio** | Gambar `aspect-[4/3]`, lebar 28 → 36 (responsive) |
| **Gambar** | Rounded-lg, `scale-[1.04]` on hover |
| **Badge** | `EditorialBadge` + category label |
| **Judul** | `text-sm` → `text-[15px]`, line-clamp-2, font-bold |
| **Excerpt** | 2 baris, `text-xs` |
| **Meta** | Avatar penulis (img atau User icon) + nama, tanggal |
| **Bookmark** | Di atas gambar kanan atas, bulat dengan backdrop-blur |
| **Hover** | `hover:-translate-y-1`, border `brand-red/20`, shadow-md |
| **Container** | Border, rounded-xl, bg-white, shadow-sm |

---

## 2. Fitur Umum Semua Variant

| Fitur | Detail |
|-------|--------|
| **SmartImage** | Optimized image dengan blur placeholder & dominant color |
| **prefetchImage** | Prefetch gambar saat hover (onMouseEnter) |
| **EditorialBadge** | Badge breaking/exclusive/featured dari `resolveArticleBadge()` |
| **ArticleBookmarkButton** | Tombol simpan artikel (localStorage-based) |
| **Category Color** | Warna kategori dari `getCategoryColor()` |
| **Dark Mode** | Full support (dark: prefix di semua elemen) |
| **Image Fallback** | Urutan: featuredImage → YouTube thumbnail → gallery → image block → imageGrid → `/placeholder.jpg` |
| **Excerpt Fallback** | `article.excerpt` → paragraf pertama dari blocks |
| **React.memo** | Di-wrap untuk mencegah re-render tidak perlu |

---

## 3. Penggunaan per Halaman & Section

### 3.1 Homepage (`SiteHomePage.tsx`)

| Section (Zona) | Variant | Jumlah | Grid |
|-----------------|---------|--------|------|
| **Zona 2 — Fokus Redaksi** | `large` | 1 kartu pertama | `md:col-span-2` (2/3 lebar) |
| **Zona 2 — Fokus Redaksi** | `horizontal` | 2 kartu berikutnya | Kolom kanan (stacked) |
| **Zona 4 — Berita Terbaru** (feed featured) | `horizontal` | 2 kartu | Full-width kolom utama, stacked vertikal |
| **Zona 4 — Berita Lainnya** (feed stream) | `medium` | 6 kartu | Grid 2 kolom (`md:grid-cols-2`) |

> **Catatan**: Zona 1 (Hero) menggunakan `MagazineBentoHero`, bukan NewsCard.
> **Catatan**: Zona 5+ (Pilihan Editor, Opini, Foto, Video) menggunakan custom rendering inline, bukan NewsCard.

### 3.2 Load More (`LoadMoreArticles.tsx`)

| Section | Variant | Grid |
|---------|---------|------|
| **Load More articles** (page 2+) | `medium` (default) | Grid 2 kolom (`md:grid-cols-2`) |

Digunakan di bawah feed utama homepage saat user klik "Muat Lebih Banyak".

### 3.3 Saved Articles (`SavedArticlesFeed.tsx`)

| Section | Variant | Grid |
|---------|---------|------|
| **Artikel Tersimpan** | `medium` (default) | Grid 2 kolom (`md:grid-cols-2`) |

Muncul saat user memfilter "Tersimpan" di homepage.

### 3.4 Halaman Artikel (`artikel/[slug]/page.tsx`)

| Section | Variant | Grid |
|---------|---------|------|
| **Rekomendasi Artikel** (bawah konten) | `medium` | Grid 3 kolom (`sm:grid-cols-2 lg:grid-cols-3`) |
| **Sidebar — Kategori Terkait** | `minimal` | Single column (stacked) |

### 3.5 Halaman Penulis (`penulis/[id]/page.tsx`)

| Section | Variant | Grid |
|---------|---------|------|
| **Featured Article** (artikel pertama) | `large` | Full-width single card |
| **Publikasi Lainnya** | `medium` | Grid 2 kolom (`sm:grid-cols-2`) |

---

## 4. Peta Penggunaan Visual

```
┌─────────────────────────────────────────────────────────────┐
│  HOMEPAGE (SiteHomePage.tsx)                                 │
│                                                              │
│  ┌─ Zona 1: MagazineBentoHero (bukan NewsCard) ───────────┐ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Zona 2: Fokus Redaksi ────────────────────────────────┐ │
│  │  [large: 1 kartu]    [horizontal: 2 kartu stacked]     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Zona 4: Berita Terbaru (8kol) + Sidebar (4kol) ──────┐ │
│  │  [horizontal: 2 kartu]                                  │ │
│  │  [medium: 6 kartu, grid 2-kolom]                        │ │
│  │  [LoadMoreArticles: medium, grid 2-kolom]               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Zona 5+: Editorial Extras (custom, bukan NewsCard) ───┐ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HALAMAN ARTIKEL (artikel/[slug]/page.tsx)                   │
│                                                              │
│  ┌─ Konten Utama ─────────────────────────────────────────┐ │
│  │  [medium: 3 kolom — Rekomendasi Artikel]               │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─ Sidebar ──────────────────────────────────────────────┐ │
│  │  [minimal: stacked — Kategori Terkait]                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  HALAMAN PENULIS (penulis/[id]/page.tsx)                     │
│                                                              │
│  ┌─ Featured ─────────────────────────────────────────────┐ │
│  │  [large: 1 kartu hero]                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─ Publikasi Lainnya ────────────────────────────────────┐ │
│  │  [medium: grid 2-kolom]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Depedensi Komponen

```
NewsCard
├── SmartImage + prefetchImage (optimized image + blur/dominant color + hover prefetch)
├── EditorialBadge (breaking/exclusive/featured badge)
├── ArticleBookmarkButton (save/bookmark)
├── resolveArticleBadge() → menentukan badge variant
├── getCategoryColor() → warna label kategori
├── cn() → merge className
└── lucide-react (Clock, BookOpen, User icons)
```

---

## 6. Struktur Lengkap Halaman Homepage (dari atas ke bawah)

Berikut urutan lengkap semua komponen/section yang muncul di halaman homepage (`SiteHomePage.tsx` + `PublicSiteLayout.tsx`), dari topbar sampai footer.

---

### 6.1 Breaking News Ticker

| Aspek | Detail |
|-------|--------|
| **Komponen** | `BreakingNewsTicker` (`components/ui/BreakingNewsTicker.tsx`) |
| **Posisi** | Paling atas, full-width |
| **Container** | `bg-brand-black`, di-wrap `Container` |
| **Layout** | Bar horizontal, height `h-8` (mobile) → `sm:h-9` → `lg:h-10` (desktop) |
| **Konten** | Teks berita berjalan (marquee) dari API `/api/breaking-news`, fallback ke 4 hardcoded news |
| **Visual** | Dot merah pulsing + label "TERKINI", gradient fade kiri-kanan, separator dot merah antar item |
| **Animasi** | `framer-motion` infinite scroll kiri, durasi 40 detik |
| **Interaksi** | Hover → teks berubah `brand-red` |

---

### 6.2 Navbar

| Aspek | Detail |
|-------|--------|
| **Komponen** | `Navbar` (`components/layout/Navbar.tsx`) |
| **Posisi** | Sticky top, z-50 |
| **Behavior** | Collapse saat scroll > 24px (category bar hide, height shrink) |

#### 6.2.1 Top Bar (Logo + Search + Actions)

| Elemen | Detail |
|--------|--------|
| **Logo** | Kiri — `SmartImage` (jika `logoUrl` ada) atau teks "BERITAKARYA" dengan tagline "Nusantara Berbicara • [tanggal]" |
| **Search Bar** | Tengah — input bulat, hidden di mobile, placeholder "Cari berita, topik, penulis..." |
| **Actions (kanan)** | Search icon (mobile only), Bookmark (dengan badge count), Dark/Lang toggle, Profile dropdown / Login button, Hamburger menu (mobile) |
| **Profile Dropdown** | Avatar + nama, link Dashboard (role-based), tombol Keluar |

#### 6.2.2 Category Bar — Desktop

| Aspek | Detail |
|-------|--------|
| **Posisi** | Di bawah top bar, border-top, `bg-gray-50` |
| **Layout** | Horizontal centered, `text-[10px]` uppercase tracking-widest |
| **Konten** | Daftar kategori dari API `/categories/tree` + "Terbaru" (default) + "Tersimpan" (dengan badge count) |
| **Interaksi** | Hover → underline merah animasi, active → bold + underline merah (spring animation) |
| **Dropdown** | Hover kategori dengan sub → dropdown muncul (2-3 level nested), rounded-xl, shadow-xl |

#### 6.2.3 Category Bar — Mobile

| Aspek | Detail |
|-------|--------|
| **Posisi** | Di bawah top bar, horizontal scroll (pill/chip style) |
| **Layout** | `rounded-full` pill buttons, `text-[11px]` |
| **Active** | `border-brand-red bg-brand-red/10 text-brand-red` |
| **Sub-kategori** | Strip terpisah di bawah (level 2), dan strip level 3 di bawahnya lagi |
| **Visual** | Level 2: `rounded-xl` solid, Level 3: `rounded-lg` dengan border |

---

### 6.3 Zona 1 — Hero (MagazineBentoHero)

| Aspek | Detail |
|-------|--------|
| **Komponen** | `MagazineBentoHero` (`components/berita/MagazineBentoHero.tsx`) |
| **Posisi** | Section pertama setelah navbar |
| **Container** | `Container`, `py-5 md:py-6`, background gradient subtle |
| **Layout** | Bento grid asymetris: 1 kartu lead besar (kiri) + 4 kartu navigasi side (kanan stacked) |
| **Artikel** | 4 artikel terbaru dari `distributeArticles()` slot `[0..3]` |
| **Fitur** | Auto-slide setiap 5 detik (pause saat hover), SmartImage dengan posisi adaptif (portrait/landscape), category badge, overlay gradient |
| **NewsCard?** | ❌ Tidak menggunakan NewsCard, custom rendering |

---

### 6.4 Ad Leaderboard

| Aspek | Detail |
|-------|--------|
| **Komponen** | `AdSpace` (`components/ui/AdSpace.tsx`) |
| **Posisi** | Tepat di bawah Hero |
| **Container** | `Container`, `py-4 md:py-5` |
| **Layout** | Card rounded-2xl, border, bg-white, padding, centered |
| **Tipe** | `type="leaderboard"` — banner horizontal atas |
| **Data** | Fetch dari API ads, support A/B testing, animation effects |

---

### 6.5 Zona 2 — Fokus Redaksi

| Aspek | Detail |
|-------|--------|
| **Posisi** | Di bawah Ad Leaderboard |
| **Container** | `Container`, `py-4 md:py-6` |
| **Animasi** | Wrap dengan `ScrollAnimate` (fade-in on scroll) |
| **Header** | ⚡ Zap icon merah + "FOKUS REDAKSI" (eyebrow text) |
| **Layout Grid** | `grid-cols-1 md:grid-cols-3` (3 kolom desktop) |
| **Artikel** | Slot `[4..6]` dari `distributeArticles()` (3 kartu dirender), prioritaskan `isFeatured`/`isExclusive` |

| Posisi Kartu | NewsCard Variant | Grid | Detail |
|-------------|-----------------|------|--------|
| Kartu pertama (kiri) | **`large`** | `md:col-span-2` (2/3 lebar) | Kartu hero besar dengan gambar full-bleed |
| Kartu 2-3 (kanan) | **`horizontal`** | Kolom kanan, stacked vertikal | Kartu compact gambar-kiri teks-kanan |

---

### 6.6 Zona 3 — Trending

| Aspek | Detail |
|-------|--------|
| **Posisi** | Di bawah Fokus Redaksi |
| **Container** | `Container`, `pb-4 md:pb-6` |
| **Header** | 📈 TrendingUp icon + "TRENDING" (eyebrow text) |
| **Layout** | Grid 5 kolom desktop, 1 kolom mobile, dengan divider |
| **Artikel** | 5 artikel terpopuler (sort by views desc) dari API |
| **Visual** | Nomor urut besar (`text-2xl` → `text-3xl`, warna gray-100), judul `line-clamp-2`, meta penulis + waktu baca |
| **Interaksi** | Hover → judul berubah `brand-red`, nomor berubah `brand-red` |
| **NewsCard?** | ❌ Tidak menggunakan NewsCard, custom rendering dengan `Link` langsung |

---

### 6.7 Zona 4 — Berita Terbaru (Main Feed + Sidebar)

| Aspek | Detail |
|-------|--------|
| **Posisi** | Di bawah Trending |
| **Container** | `Container`, `py-4 md:py-6` |
| **Layout** | Grid 12 kolom: **8 kolom** (feed utama) + **4 kolom** (sidebar) |

#### 6.7.1 Feed Utama (8 kolom)

| Sub-section | NewsCard Variant | Jumlah | Grid | Detail |
|------------|-----------------|--------|------|--------|
| **Section Header** | — | — | — | Ikon merah + "BERITA TERBARU" / "Berita [Kategori]" / "Hasil Pencarian: [query]", badge "Update Langsung" |
| **Feed Featured** | **`horizontal`** | 2 kartu | Stacked vertikal | Artikel slot `[8..9]`, `priority` aktif |
| **Inline Ad** | — | — | — | `AdSpace type="in-feed"`, card rounded-2xl, label "Sponsorship" + "Advertisement" |
| **Berita Lainnya** | **`medium`** | 6 kartu | `grid-cols-1 md:grid-cols-2` | Artikel slot `[10..15]`, header "BERITA LAINNYA" + link "Lihat Arsip" |
| **Load More** | **`medium`** (default) | ∞ | `grid-cols-1 md:grid-cols-2` | `LoadMoreArticles` component, page 2+, fetch 10 per halaman |

#### 6.7.2 Sidebar (4 kolom) — Hanya di Zona 4

| Widget | Komponen | Detail |
|--------|----------|--------|
| **Akses Redaksi** | Custom inline | Card rounded-2xl, 3 tombol: WhatsApp (hijau), Telegram (biru), Email (netral), masing-masing dengan icon + label + arrow |
| **Terbaru** | Custom inline | 5 artikel non-hero (berbeda dari Trending), nomor urut, badge "Top Story"/"Terbaru", link "Baca" |
| **Info Pasar** | `MarketWidget` | Data pasar real-time: IHSG, USD/IDR, SGD/IDR, Emas (Rp/gram), auto-refresh 5 menit, indicator up/down |
| **Video/Partner** | `VideoWidget` atau `AdSpace` | Jika `siteSettings.featuredVideo` ada → VideoWidget (thumbnail + play button + durasi). Jika tidak → AdSpace `type="rectangle"` |

#### 6.7.3 Mode Kategori/Pencarian

Saat user memfilter kategori atau mencari, zona 1-3 dan sidebar tetap sama, tapi feed utama berubah:
- **Category filter** → header "Berita [Nama Kategori]", feed dari artikel terfilter
- **Search** → header "Hasil Pencarian: [query]", feed dari hasil pencarian
- **Tersimpan** → `SavedArticlesFeed` (NewsCard `medium` grid 2-kolom) menggantikan feed normal

---

### 6.8 Zona 5+ — Editorial Extras (Full Width)

Sidebar berhenti di sini. Semua section di bawah menggunakan lebar penuh.

| Section | Komponen | Layout | NewsCard? | Detail |
|---------|----------|--------|-----------|--------|
| **Pilihan Editor** | Custom inline | Grid 3 kolom, `aspect-[3/4]` portrait | ❌ | ⭐ Star icon + "Pilihan Editor", gambar full-bleed dengan gradient overlay, judul + meta di bawah |
| **Opini & Analisis** | Custom inline | Grid 3 kolom | ❌ | Dot merah + "Opini & Analisis", teks dominan (judul + excerpt), avatar penulis, label "Kolom Analisis" |
| **Foto Jurnalistik** | Custom inline | Grid 3 kolom, `aspect-[4/5]` portrait | ❌ | Dot merah + "Foto Jurnalistik", gambar full-bleed, slow zoom on hover (5s), label "Jurnal Foto" |
| **Video Eksklusif** | Custom inline | Grid 3 kolom, `aspect-video` | ❌ | ⚡ Zap icon + "Laporan Video Eksklusif", bg gelap, play button bulat center, label "Video Report" |

> **Catatan**: Semua section Zona 5+ di-wrap dengan `ScrollAnimate` untuk animasi fade-in.

---

### 6.9 Footer

| Aspek | Detail |
|-------|--------|
| **Komponen** | `SiteFooter` (`components/layout/SiteFooter.tsx`) |
| **Posisi** | Bawah halaman, `mt-20 sm:mt-24` |
| **Container** | `Container`, `pt-12 pb-10 sm:pt-14 sm:pb-12` |

#### Kolom Footer

| Kolom | Konten |
|-------|--------|
| **Kolom 1-2** (lebih lebar, `md:col-span-2`) | Logo/nama site (serif, besar), deskripsi site, icon social media (WhatsApp, Facebook, TikTok, Telegram, YouTube, X, Instagram), alamat, telepon, email |
| **Kolom 3** (`lg:col-span-2`) | "Kategori Utama" — max 9 kategori (exclude terbaru, tersimpan, advertorial), link ke filter kategori |
| **Kolom 4** | "Kerja Sama" — link Iklan, Advertorial, Kemitraan & Partner |

> **Catatan**: Grid footer responsive — `md:grid-cols-4` → `lg:grid-cols-5` (5 kolom di layar besar, Kategori Utama expand `lg:col-span-2`)

#### Bagian Bawah Footer

| Elemen | Detail |
|--------|--------|
| **Legal Links** | Horizontal centered — semua halaman legal (Kebijakan Privasi, Syarat & Ketentuan, dll.) |
| **Copyright** | Centered — "© [tahun] PT SABDA KARYA NUSANTARA (BERITA KARYA DIGITAL GROUP). ALL RIGHTS RESERVED." |

---

### 6.10 Overlay & Fixed Elements

| Elemen | Komponen | Posisi | Detail |
|--------|----------|--------|--------|
| **AI Summary** | `AISummary` | Fixed/overlay | Hidden by default, ringkasan AI otomatis |
| **Mobile Bottom Nav** | `MobileBottomNav` | Fixed bottom, mobile only | Navigasi bawah (Home, Search, Bookmark, Menu) |
| **Mobile Menu** | `MobileMenu` | Full-screen overlay | Hamburger menu → daftar kategori + site info |
| **Full Screen Search** | `FullScreenSearch` | Full-screen overlay | Search icon → input besar + trending topics + hasil pencarian |

---

### 6.11 Diagram Urutan Lengkap Homepage

```
┌──────────────────────────────────────────────────────────────────┐
│  BREAKING NEWS TICKER                          (BreakingNewsTicker)
│  bg-brand-black, teks berjalan marquee
├──────────────────────────────────────────────────────────────────┤
│  NAVBAR                                          (Navbar)
│  ┌────────────────────────────────────────────────────────────┐
│  │ Logo | Search Bar | [Bookmark] [Theme] [Profile] [Hamburger]│
│  ├────────────────────────────────────────────────────────────┤
│  │ Terbaru • Politik • Ekonomi • ... • Tersimpan  (Category)  │
│  └────────────────────────────────────────────────────────────┘
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONA 1 — HERO                               (MagazineBentoHero)
│  ┌──────────────┬──────┐
│  │              │ side │
│  │  Lead (2/3)  │──────│
│  │              │ side │
│  │              │──────│
│  │              │ side │
│  └──────────────┴──────┘
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  AD LEADERBOARD                                    (AdSpace)
│  ═══════════════════════════════════════════════════════════════
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONA 2 — FOKUS REDAKSI
│  ⚡ FOKUS REDAKSI
│  ┌──────────────────────┬──────────┐
│  │                      │ horiz #1 │
│  │   NewsCard (large)   ├──────────┤
│  │                      │ horiz #2 │
│  └──────────────────────┴──────────┘
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONA 3 — TRENDING
│  📈 TRENDING
│  ┌─────┬─────┬─────┬─────┬─────┐
│  │ 01  │ 02  │ 03  │ 04  │ 05  │
│  └─────┴─────┴─────┴─────┴─────┘
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONA 4 — BERITA TERBARU + SIDEBAR
│  ┌────────────────────────────────┬─────────────────┐
│  │ ■ BERITA TERBARU               │ SIDEBAR          │
│  │                                │                  │
│  │ ┌────────────────────────────┐ │ ┌──────────────┐ │
│  │ │ NewsCard (horizontal) #1   │ │ │ Akses        │ │
│  │ ├────────────────────────────┤ │ │ Redaksi      │ │
│  │ │ NewsCard (horizontal) #2   │ │ │ (WA/TG/Email)│ │
│  │ └────────────────────────────┘ │ ├──────────────┤ │
│  │                                │ │              │ │
│  │ ═══ Sponsorship Ad ══════════ │ │ Terbaru      │ │
│  │                                │ │ (5 artikel)  │ │
│  │ BERITA LAINNYA                 │ ├──────────────┤ │
│  │ ┌───────────┬───────────┐      │ │              │ │
│  │ │ medium #1 │ medium #2 │      │ │ Info Pasar   │ │
│  │ ├───────────┼───────────┤      │ │ (Market)     │ │
│  │ │ medium #3 │ medium #4 │      │ ├──────────────┤ │
│  │ ├───────────┼───────────┤      │ │              │ │
│  │ │ medium #5 │ medium #6 │      │ │ Video /      │ │
│  │ └───────────┴───────────┘      │ │ Partner Ad   │ │
│  │                                │ └──────────────┘ │
│  │ ┌────────────────────────────┐ │                  │
│  │ │ LoadMoreArticles           │ │                  │
│  │ │ (medium, grid 2-kolom)     │ │                  │
│  │ └────────────────────────────┘ │                  │
│  └────────────────────────────────┴─────────────────┘
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZONA 5+ — EDITORIAL EXTRAS (Full Width)
│                                                                  │
│  ⭐ Pilihan Editor
│  ┌──────────┬──────────┬──────────┐
│  │ portrait │ portrait │ portrait │
│  │ [3/4]    │ [3/4]    │ [3/4]    │
│  └──────────┴──────────┴──────────┘
│                                                                  │
│  ● Opini & Analisis
│  ┌──────────┬──────────┬──────────┐
│  │ teks     │ teks     │ teks     │
│  └──────────┴──────────┴──────────┘
│                                                                  │
│  ● Foto Jurnalistik
│  ┌──────────┬──────────┬──────────┐
│  │ portrait │ portrait │ portrait │
│  │ [4/5]    │ [4/5]    │ [4/5]    │
│  └──────────┴──────────┴──────────┘
│                                                                  │
│  ⚡ Laporan Video Eksklusif
│  ┌──────────┬──────────┬──────────┐
│  │ ▶ video  │ ▶ video  │ ▶ video  │
│  │ [16/9]   │ [16/9]   │ [16/9]   │
│  └──────────┴──────────┴──────────┘
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FOOTER                                            (SiteFooter)
│  ┌─────────────────┬──────────┬──────────┐
│  │ Logo + Desc     │ Kategori │ Kerja    │
│  │ Social icons    │ Utama    │ Sama     │
│  │ Address/Phone   │ (9 max)  │ (3 link) │
│  └─────────────────┴──────────┴──────────┘
│  ─────────────────────────────────────────
│  [Privasi] [Syarat] [Pedoman] [Kontak] ...
│  © 2026 PT SABDA KARYA NUSANTARA...
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  MOBILE ONLY (fixed/overlay):                                    │
│  • MobileBottomNav (fixed bottom)                                │
│  • MobileMenu (full-screen overlay)                              │
│  • FullScreenSearch (full-screen overlay)                        │
│  • AISummary (hidden by default)                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Shape (NewsCardArticle)

```typescript
// Sub-interface untuk blocks
interface NewsCardBlock {
  type: string;
  content?: string;
  url?: string;
  embedType?: string;
  images?: Array<{ url?: string }>;
}

// Main article interface
{
  id?: string;
  slug: string;                          // wajib
  title: string;                         // wajib
  featuredImage?: string | null;
  featuredImageBlur?: string | null;     // blur placeholder
  featuredImageColor?: string | null;    // dominant color
  readingTimeMin?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  category?: { name?: string | null } | null;        // legacy single category
  categories?: Array<{ category?: { name?: string | null; slug?: string | null } | null }> | null; // multi-category
  author?: { name?: string | null; avatarUrl?: string | null } | null;
  blocks?: NewsCardBlock[];
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
  excerpt?: string | null;
  status?: string;
}
```
