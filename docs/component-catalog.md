# Component Catalog — BeritaKarya

Katalog lengkap semua komponen React di BeritaKarya. Terorganisir berdasarkan folder.

---

## Daftar Isi

1. [UI Components](#1-ui-components) — `components/ui/`
2. [Layout Components](#2-layout-components) — `components/layout/`
3. [Dashboard Components](#3-dashboard-components) — `components/dashboard/`
4. [Editor Components](#4-editor-components) — `components/editor/`
5. [Page Components](#5-page-components) — `components/pages/`
6. [Marketing Components](#6-marketing-components) — `components/marketing/`

---

## 1. UI Components

Folder: `apps/web/components/ui/`

### 1.1 AdImageCropper

**File:** `ui/AdImageCropper.tsx`

Modal crop gambar iklan dengan aspect ratio enforcement.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `file` | `File` | required | File gambar yang akan di-crop |
| `aspectRatio` | `number` | required | Rasio aspek target (e.g. 970/250) |
| `minWidth` | `number?` | — | Minimum lebar output |
| `minHeight` | `number?` | — | Minimum tinggi output |
| `onComplete` | `(blob: Blob) => void` | required | Callback saat crop selesai |
| `onCancel` | `() => void` | required | Callback saat dibatalkan |

**Visual:** Full-screen modal (`z-[200] bg-black/80 backdrop-blur-sm`) dengan `rounded-2xl` card putih. Zoom slider dengan `accent-brand-red`.

---

### 1.2 AdSpace

**File:** `ui/AdSpace.tsx`

Komponen utama untuk menampilkan iklan publik. Mendukung carousel, A/B testing, responsive images, video, script HTML.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `type` | `'leaderboard' \| 'rectangle' \| 'rectangle_secondary' \| 'in-feed'` | required | Tipe slot iklan |
| `slot` | `string?` | — | Override backend slot name |
| `label` | `string?` | `'Advertisement'` | Label badge |
| `className` | `string?` | — | Additional classes |

**Fitur:**
- Fetch dari `GET /api/v1/ads/public?site=<siteId>`
- Carousel auto-rotate 7 detik, pause on hover
- Impression tracking (deduplicated per ad ID)
- Click tracking via `navigator.sendBeacon`
- A/B testing dengan sessionStorage persistence
- Animasi: `ken_burns`, `fade_slide`, `parallax`, `pulse_scale`
- Responsive `<picture>` (mobile/tablet/desktop sources)
- Video auto-detect (`.mp4/.webm/.ogg/.mov`)
- Script ads: sandboxed iframe
- Sticky mobile leaderboard (fixed bottom, closeable after 5s)
- Fallback ke showcase components saat slot kosong

**Ukuran:**

| Slot | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| leaderboard | 320×100 | 728×100 | 970×250 |
| rectangle | 300×100 | — | 300×250 |
| in_feed | 300×100 | — | 300×250 |

---

### 1.3 ArticleActions

**File:** `ui/ArticleActions.tsx`

Tombol aksi artikel (Print + Comments).

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `iconOnly` | `boolean?` | `false` | Hanya icon tanpa label |

**Visual:** Pill buttons `rounded-full border border-gray-200/80 bg-white/90 text-[10px] font-black uppercase tracking-[0.16em]`

---

### 1.4 ArticleBookmarkButton

**File:** `ui/ArticleBookmarkButton.tsx`

Tombol bookmark artikel dengan localStorage persistence.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `article` | `object` | Data artikel |
| `site` | `string` | Site ID |
| `className` | `string?` | Additional classes |
| `activeClassName` | `string?` | Class saat aktif |
| `idleClassName` | `string?` | Class saat idle |
| `iconSize` | `number?` | Ukuran icon |
| `onToggle` | `(saved: boolean) => void?` | Callback toggle |

---

### 1.5 ArticleFloatingTools

**File:** `ui/ArticleFloatingTools.tsx`

Floating sidebar tools untuk artikel (desktop only).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `title` | `string` | Judul artikel (untuk share) |
| `url` | `string` | URL artikel (untuk share) |

**Visual:** Desktop-only (`hidden md:block`): `w-[4rem] rounded-[1.75rem] bg-[rgba(7,15,33,0.78)] backdrop-blur-xl`. Buttons: font size, comments, share, print.

---

### 1.6 ArticleShareActions

**File:** `ui/ArticleShareActions.tsx`

Tombol share artikel ke berbagai platform.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `title` | `string` | required | Judul artikel |
| `url` | `string` | required | URL artikel |
| `variant` | `'inline' \| 'panel'` | `'inline'` | Tampilan |
| `tone` | `'default' \| 'floating'` | `'default'` | Warna |

**Platform:** Facebook, X (Twitter), Telegram, WhatsApp, Instagram, TikTok, YouTube (copy-to-clipboard), Native Share API.

---

### 1.7 AuthorCard

**File:** `ui/AuthorCard.tsx`

Kartu profil penulis.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `author` | `{ id, name, role?, email?, articleCount?, avatarUrl? }` | required | Data penulis |
| `site` | `string` | required | Site ID |
| `variant` | `'inline' \| 'card'` | `'inline'` | Tampilan |

**Variants:**
- `inline`: Horizontal row kecil (32px avatar + name + role)
- `card`: Menggunakan `dash-card`, 56px avatar dengan glow shadow

---

### 1.8 BackButton

**File:** `ui/BackButton.tsx`

Tombol kembali dengan ArrowLeft icon.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `fallbackHref` | `string` | required | URL tujuan |
| `label` | `string?` | `'Kembali'` | Teks tombol |

**Visual:** `text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted hover:text-brand-red`

---

### 1.9 BillboardShowcase

**File:** `ui/BillboardShowcase.tsx`

Fallback carousel untuk slot leaderboard saat tidak ada iklan aktif.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Auto-rotating carousel (8s) dengan gradient backgrounds, decorative SVG icons, dot indicators. CTA: "Pasang Iklan Anda →"

---

### 1.10 BreakingNewsTicker

**File:** `ui/BreakingNewsTicker.tsx`

Horizontal scrolling ticker berita terkini.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `news` | `string[]?` | Array berita |

**Visual:** Dark bar (`h-8`), pulsing red dot + "TERKINI" label, gradient fade edges. Respects `prefers-reduced-motion`.

---

### 1.11 CommentSection

**File:** `ui/CommentSection.tsx`

Seksi komentar artikel dengan form input.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `articleId` | `string` | ID artikel |

**Visual:** Textarea `rounded-[1.75rem]`, submit button `rounded-full bg-brand-red`. Comment items dengan avatar + name (uppercase, 11px, font-black).

---

### 1.12 DateTimeWeather

**File:** `ui/DateTimeWeather.tsx`

Display tanggal, waktu, dan cuaca inline.

**Visual:** Clock icon di brand-red, mono font untuk time, thermometer icon untuk weather.

---

### 1.13 EditorialBadge

**File:** `ui/EditorialBadge.tsx`

Badge editorial dengan 8 variant.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `variant` | `BadgeVariant` | required | Variant badge |
| `size` | `'sm' \| 'md'` | `'sm'` | Ukuran |

**Variants:**

| Variant | Background | Icon |
|---------|-----------|------|
| `breaking` | `bg-red-600` | ⚡ (pulse) |
| `exclusive` | `bg-violet-700` | ⭐ |
| `analysis` | `bg-sky-700` | 💎 |
| `live` | `bg-emerald-600` | ⭕ (pulse) |
| `photo` | `bg-amber-500` | 🎯 |
| `video` | `bg-brand-black` | ▶️ |
| `featured` | `bg-orange-500` | 💎 |
| `opinion` | `bg-slate-600` | ✒️ |

---

### 1.14 FadeInOnScroll

**File:** `ui/FadeInOnScroll.tsx`

Wrapper fade-in saat scroll (tanpa Framer Motion).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `children` | `ReactNode` | Konten |
| `delay` | `number?` | Delay dalam detik |

**Visual:** `transition-all duration-500 ease-out` dari `opacity-0 translate-y-4` ke `opacity-100 translate-0`.

---

### 1.15 FontSizeControl

**File:** `ui/FontSizeControl.tsx`

Kontrol ukuran font artikel (4 opsi: A-, Normal, A+, A++).

**Visual:** Pill-shaped `rounded-full border border-gray-200/80 bg-white/90 px-2 py-1.5 shadow-sm`. Active: `bg-white text-brand-red shadow-sm`.

**Sizes:** 0.85, 1.0, 1.15, 1.3 (via CSS variable `--article-font-scale`)

---

### 1.16 FullScreenSearch

**File:** `ui/FullScreenSearch.tsx`

Overlay pencarian full-screen.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `isOpen` | `boolean` | Status terbuka |
| `onClose` | `() => void` | Callback tutup |
| `trendingTopics` | `string[]?` | Topik trending |

**Visual:** `z-[100] bg-[#F8FAFC]/95 dark:bg-[#020617]/95 backdrop-blur-2xl`. Large search input `text-xl md:text-3xl`. Two-column: results + trending.

---

### 1.17 ImageLightboxWrapper

**File:** `ui/ImageLightboxWrapper.tsx`

Lightbox full-screen untuk gambar.

**Visual:** `z-[200] bg-black/90 backdrop-blur-xl`. Zoom in/out, rotate controls. Close button `bg-brand-red rounded-full`.

---

### 1.18 InFeedShowcase

**File:** `ui/InFeedShowcase.tsx`

Fallback carousel untuk slot in-feed.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Compact carousel dengan gradient backgrounds + decorative icons. CTA: "Pelajari →" / "Mulai →" / "Eksplor →"

---

### 1.19 JsonLd

**File:** `ui/JsonLd.tsx`

Structured data untuk SEO.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `data` | `JsonLdObject \| JsonLdObject[]` | Data JSON-LD |

**Visual:** None — render `<script type="application/ld+json">`

---

### 1.20 LoadMoreArticles

**File:** `ui/LoadMoreArticles.tsx`

Tombol "Load More" untuk infinite scroll.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteId` | `string` | Site ID |
| `category` | `string?` | Filter kategori |
| `search` | `string?` | Filter pencarian |

**Visual:** `px-10 py-4 bg-brand-black text-white text-[10px] font-black uppercase tracking-[0.3em] group-hover:bg-brand-red`

---

### 1.21 MarketWidget

**File:** `ui/MarketWidget.tsx`

Widget info pasar (IHSG, USD/IDR, Gold) untuk sidebar.

**Visual:** `rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm`. Live pulse dot (emerald), trend indicators. Auto-refresh 5 menit.

---

### 1.22 MobileArticleTools

**File:** `ui/MobileArticleTools.tsx`

Floating sidebar tools untuk artikel (mobile only).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `title` | `string` | Judul artikel |
| `url` | `string` | URL artikel |
| `article` | `object` | Data artikel |
| `site` | `string` | Site ID |

**Visual:** `md:hidden`, `fixed left-4 top-1/2 z-40 rounded-[1.75rem] bg-[rgba(7,15,33,0.8)] backdrop-blur-xl`. Smart collapse on scroll.

---

### 1.23 NewsletterForm

**File:** `ui/NewsletterForm.tsx`

Form newsletter dengan dark theme.

**Visual:** `bg-slate-900` card dengan red glow accent. Input `bg-white/5 border border-white/10`. Button `bg-brand-red`.

---

### 1.24 NewsCard

**File:** `ui/NewsCard.tsx`

Kartu artikel dengan 4 variant.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `article` | `NewsCardArticle` | required | Data artikel |
| `variant` | `'large' \| 'medium' \| 'minimal' \| 'horizontal'` | `'medium'` | Tampilan |
| `site` | `string?` | — | Site ID |
| `priority` | `boolean?` | `false` | Priority loading |

**Variants:**

| Variant | Layout | Image | Radius | Min Height |
|---------|--------|-------|--------|------------|
| `large` | Full overlay | Full bleed | `rounded-2xl` | **340px** |
| `medium` | Below image | `aspect-[16/9]` | `rounded-xl` | — |
| `horizontal` | Side-by-side | `w-28 md:w-36`, `aspect-[4/3]` | `rounded-xl` | — |
| `minimal` | Text only | None | — | — |

**Hover:** `hover:-translate-y-1 hover:scale-[1.01]`

---

### 1.25 ReadingProgress

**File:** `ui/ReadingProgress.tsx`

Progress bar bacaan di atas viewport.

**Visual:** `fixed top-0 left-0 right-0 h-1 bg-brand-red z-[60]`. Uses Framer Motion `useScroll` + `useSpring`.

---

### 1.26 RectangleShowcase

**File:** `ui/RectangleShowcase.tsx`

Fallback carousel untuk slot rectangle.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Vertical card layout, gradient backgrounds, decorative icons. CTA: "Pasang Iklan →" / "Mulai Beriklan →"

---

### 1.27 SavedArticlesFeed

**File:** `ui/SavedArticlesFeed.tsx`

Feed artikel yang disimpan (bookmarks).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Grid NewsCards dengan tombol hapus. Empty state: dashed border + CTA.

---

### 1.28 ScrollAnimate

**File:** `ui/ScrollAnimate.tsx`

Wrapper animasi scroll dengan Framer Motion.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `children` | `ReactNode` | Konten |
| `delay` | `number?` | Delay animasi |

**Visual:** Fade in + slide up (y:30→0) saat masuk viewport. Respects `prefers-reduced-motion`.

---

### 1.29 SecondaryRectangleShowcase

**File:** `ui/SecondaryRectangleShowcase.tsx`

Fallback card untuk slot rectangle secondary (non-carousel).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Static card, light theme, dot pattern background, newsletter-style. CTA: "Pelajari Lebih Lanjut"

---

### 1.30 Skeleton

**File:** `ui/Skeleton.tsx`

Loading placeholder dengan shimmer animation.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `variant` | `'hero' \| 'card' \| 'minimal' \| 'trending' \| 'text' \| 'stat' \| 'list'` | `'card'` | Tipe skeleton |

**Visual:** `bg-gray-100 dark:bg-slate-800` dengan shimmer gradient overlay.

---

### 1.31 SmartImage

**File:** `ui/SmartImage.tsx`

Responsive image wrapper dengan multi-stage fallback.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `src` | `string?` | URL gambar utama |
| `thumbUrl` | `string?` | URL thumbnail (fallback) |
| `blur` | `string?` | Blur hash placeholder |
| `dominantColor` | `string?` | Dominant color placeholder |
| `context` | `SmartImageContext` | Konteks penggunaan |
| `fallbackSrc` | `string?` | Fallback terakhir |

**12 Contexts:**
`hero_lead`, `hero_side`, `card`, `card_horizontal`, `article_cover`, `article_block`, `gallery_thumb`, `gallery_full`, `media_text`, `logo`, `avatar`, `thumbnail`

Setiap context punya `sizes` dan `quality` yang berbeda.

---

### 1.32 SocialIcons

**File:** `ui/SocialIcons.tsx`

Icon social media (inline SVG).

**Components:** `SiFacebook`, `SiInstagram`, `SiTelegram`, `SiWhatsapp`, `SiX`, `SiYoutube`, `SiTiktok`

---

### 1.33 StatusBadge

**File:** `ui/StatusBadge.tsx`

Badge status workflow artikel (8 states).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `status` | `string` | Status name |

**States:** `draft`, `submitted`, `review`, `revision`, `approved`, `scheduled`, `published`, `archived`

**Visual:** `inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest` dengan colored dot indicator.

---

### 1.34 Toaster

**File:** `ui/Toaster.tsx`

Sistem notifikasi toast.

**Store:** `store/toastStore.ts`

**Variants:**

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `success` | `bg-emerald-50` | `text-emerald-600` | `border-emerald-100` |
| `error` | `bg-red-50` | `text-red-600` | `border-red-100` |
| `warning` | `bg-amber-50` | `text-amber-600` | `border-amber-100` |
| `info` | `bg-blue-50` | `text-blue-600` | `border-blue-100` |

**Visual:** `fixed bottom-6 right-6 z-[100]`, `rounded-2xl border shadow-xl backdrop-blur-xl`. Auto-dismiss 5 detik.

**Usage:** `useToastStore().addToast(message, type)`

---

### 1.35 VideoWidget

**File:** `ui/VideoWidget.tsx`

Widget video untuk sidebar.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `title` | `string` | Judul video |
| `thumbnail` | `string` | URL thumbnail |
| `duration` | `string?` | Durasi |
| `isLive` | `boolean?` | Status live |

**Visual:** `rounded-2xl border border-gray-100 bg-white p-5 shadow-sm`. Play button `w-12 h-12 bg-brand-red rounded-full`. Live badge dengan pulsing dot.

---

### 1.36 YouTubeEmbed

**File:** `ui/YouTubeEmbed.tsx`

Embed YouTube dengan click-to-play.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `url` | `string` | URL YouTube |
| `title` | `string?` | Judul video |

**Visual:** `rounded-2xl overflow-hidden shadow-lg bg-black`. Premium play button `w-20 h-20 bg-white rounded-full`. "EKSKLUSIF" badge `bg-red-600`. Lazy loading via Intersection Observer.

---

## 2. Layout Components

Folder: `apps/web/components/layout/`

### 2.1 Container

**File:** `layout/Container.tsx`

Wrapper responsive padding.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `size` | `'default' \| 'content' \| 'full'` | `'default'` | Max width |
| `bleed` | `boolean?` | `false` | Edge-to-edge mode |

| Size | Max Width |
|------|-----------|
| `default` | 1160px |
| `content` | 680px |
| `full` | 100% |

---

### 2.2 MobileBottomNav

**File:** `layout/MobileBottomNav.tsx`

Bottom navigation bar mobile (fixed).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string?` | Site ID |
| `onSearchClick` | `() => void?` | Callback search |
| `onMenuClick` | `() => void?` | Callback menu |

**Visual:** `md:hidden`, `fixed bottom-4 z-50 w-[91%] max-w-md rounded-2xl bg-white/80 backdrop-blur-xl`. 5 items: Home, Search, Kategori, Tersimpan, Account.

---

### 2.3 MobileMenu

**File:** `layout/MobileMenu.tsx`

Drawer menu mobile dari kiri.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `isOpen` | `boolean` | Status terbuka |
| `onClose` | `() => void` | Callback tutup |
| `categories` | `array` | Daftar kategori |

**Visual:** `w-[82%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl`. Backdrop `bg-black/60 backdrop-blur-sm z-[100]`.

---

### 2.4 Navbar

**File:** `layout/Navbar.tsx`

Header navigasi utama (sticky).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteConfig` | `object` | Konfigurasi site |
| `categories` | `array` | Daftar kategori |
| `onSearchClick` | `() => void?` | Callback search |
| `onMenuClick` | `() => void?` | Callback menu |

**Visual:** `sticky top-0 z-50 border-b border-gray-200 bg-white/98 backdrop-blur-sm`. 3 rows: logo+search+actions, desktop category bar, mobile category pills.

---

### 2.5 PublicErrorView

**File:** `layout/PublicErrorView.tsx`

Halaman error publik.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `error` | `Error` | Error object |
| `reset` | `() => void` | Reset callback |

**Visual:** Decorative blurred circles, icon `rounded-2xl bg-rose-50 text-rose-600`, serif title, 2 action buttons.

---

### 2.6 PublicInfoShell

**File:** `layout/PublicInfoShell.tsx`

Wrapper untuk halaman legal/info.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `width` | `'content' \| 'wide'` | `'content'` | Lebar konten |

| Width | Max Width |
|-------|-----------|
| `content` | `max-w-4xl` (896px) |
| `wide` | `max-w-6xl` (1152px) |

---

### 2.7 PublicSiteLayout

**File:** `layout/PublicSiteLayout.tsx`

Master layout untuk halaman publik.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteConfig` | `object` | Konfigurasi site |
| `children` | `ReactNode` | Konten halaman |

**Compose:** BreakingNewsTicker + Navbar + children + SiteFooter + MobileBottomNav + MobileMenu + FullScreenSearch + AISummary

---

### 2.8 ScrollReset

**File:** `layout/ScrollReset.tsx`

Utility: scroll ke atas saat route berubah.

---

### 2.9 SiteFooter

**File:** `layout/SiteFooter.tsx`

Footer situs dengan multi-kolom.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteConfig` | `object` | Konfigurasi site |
| `categories` | `array` | Daftar kategori |

**Visual:** `mt-20 border-t border-gray-200 bg-white pb-10 pt-12`. Social icons `h-11 w-11 rounded-xl bg-gray-100 hover:bg-brand-red`.

---

## 3. Dashboard Components

Folder: `apps/web/components/dashboard/`

### 3.1 AdPerformanceChart

**File:** `dashboard/ads/AdPerformanceChart.tsx`

Chart area untuk performa iklan (Recharts).

**Visual:** Area chart dengan gradient fill, impresi (biru) dan klik (hijau).

---

### 3.2 AdSlotCard

**File:** `dashboard/ads/AdSlotCard.tsx`

Card produksi untuk mengelola slot iklan (admin).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `slot` | `AdSlotDefinition` | Definisi slot |
| `ads` | `Ad[]` | Array iklan aktif |
| `onRefresh` | `() => void` | Callback refresh |

**Fitur:**
- Preview iklan yang sedang aktif
- Stats: impresi, klik, CTR
- Single upload → auto-generate semua variant
- Device coverage badge (Desktop+Mobile / Desktop Only)
- Toggle aktif/nonaktif, hapus, script mode

---

### 3.3 AdSlotCard (old)

**File:** `dashboard/ads/AdSlotCard.tsx` (sebelum rewrite)

*Note: Komponen ini sudah di-rewrite menjadi production card.*

---

### 3.4 AdsSubNav

**File:** `dashboard/ads/AdsSubNav.tsx`

Sub-navigasi untuk section iklan.

**Items:** Overview, Slot Iklan, Paket, Booking, Riwayat

---

### 3.5 AdvertiserAdsView

**File:** `dashboard/ads/AdvertiserAdsView.tsx`

Dashboard advertiser dengan stats dan chart.

---

### 3.6 AdvertiserDashboardOverview

**File:** `dashboard/ads/AdvertiserDashboardOverview.tsx`

Overview dashboard advertiser dengan 2 CTA cards.

---

### 3.7 BookingReviewList

**File:** `dashboard/ads/BookingReviewList.tsx`

Antrean review booking (admin).

**Checklist:**
- [ ] Tidak misleading
- [ ] Tidak SARA/prohibited
- [ ] Ukuran sesuai
- [ ] URL aktif
- [ ] Tidak melanggar hak cipta

---

### 3.8 BecomeAdvertiser

**File:** `dashboard/ads/BecomeAdvertiser.tsx`

Self-registration upgrade ke role advertiser.

---

### 3.9 LeaderboardBannerRow

**File:** `dashboard/ads/LeaderboardBannerRow.tsx`

Bar individual dalam carousel leaderboard.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `ad` | `Ad` | Data iklan |
| `index` | `number` | Posisi dalam carousel |
| `total` | `number` | Total banner |
| `onUpdate` | `(id, payload) => void` | Callback update |
| `onDelete` | `(id) => void` | Callback hapus |
| `onReorder` | `(slotId, direction, index) => void` | Callback reorder |

**Fitur:** Reorder up/down, toggle active, edit (image/script mode), upload, delete.

---

### 3.10 LeaderboardManager

**File:** `dashboard/ads/LeaderboardManager.tsx`

Manager carousel leaderboard (multi-banner).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `ads` | `Ad[]` | Array banner |
| `slotDef` | `AdSlotDefinition` | Definisi slot |
| `onAdd` | `() => void` | Callback tambah banner |
| `onUpdate` | `(id, payload) => void` | Callback update |
| `onDelete` | `(id) => void` | Callback hapus |
| `onReorder` | `(slotId, direction, index) => void` | Callback reorder |

---

### 3.11 NotificationBell

**File:** `dashboard/NotificationBell.tsx`

Bell notifikasi di dashboard.

---

### 3.12 SuperadminAdsView

**File:** `dashboard/ads/SuperadminAdsView.tsx`

*Note: File ini sudah dihapus (dead code).*

---

## 4. Editor Components

Folder: `apps/web/components/Editor Components)

4. [Editor Components](#4-editor-components) — `apps/web/components/`
5. [Page Components](#5-page-components) — `components/pages/`
6. [Marketing Components](#6-marketing-components) — `components/marketing/`

---

## 1. UI Components

Folder: `apps/web/components/ui/`

### 1.1 AdImageCropper

**File:** `ui/AdImageCropper.tsx`

Modal crop gambar iklan dengan aspect ratio enforcement.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `file` | `File` | required | File gambar yang akan di-crop |
| `aspectRatio` | `number` | required | Rasio aspek target (e.g. 970/250) |
| `minWidth` | `number?` | — | Minimum lebar output |
| `minHeight` | `number?` | — | Minimum tinggi output |
| `onComplete` | `(blob: Blob) => void` | required | Callback saat crop selesai |
| `onCancel` | `() => void` | required | Callback saat dibatalkan |

**Visual:** Full-screen modal (`z-[200] bg-black/80 backdrop-blur-sm`) dengan `rounded-2xl` card putih. Zoom slider dengan `accent-brand-red`.

---

### 1.2 AdSpace

**File:** `ui/AdSpace.tsx`

Komponen utama untuk menampilkan iklan publik. Mendukung carousel, A/B testing, responsive images, video, script HTML.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `type` | `'leaderboard' \| 'rectangle' \| 'rectangle_secondary' \| 'in-feed'` | required | Tipe slot iklan |
| `slot` | `string?` | — | Override backend slot name |
| `label` | `string?` | `'Advertisement'` | Label badge |
| `className` | `string?` | — | Additional classes |

**Fitur:**
- Fetch dari `GET /api/v1/ads/public?site=<siteId>`
- Carousel auto-rotate 7 detik, pause on hover
- Impression tracking (deduplicated per ad ID)
- Click tracking via `navigator.sendBeacon`
- A/B testing dengan sessionStorage persistence
- Animasi: `ken_burns`, `fade_slide`, `parallax`, `pulse_scale`
- Responsive `<picture>` (mobile/tablet/desktop sources)
- Video auto-detect (`.mp4/.webm/.ogg/.mov`)
- Script ads: sandboxed iframe
- Sticky mobile leaderboard (fixed bottom, closeable after 5s)
- Fallback ke showcase components saat slot kosong

**Ukuran:**

| Slot | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| leaderboard | 320×100 | 728×100 | 970×250 |
| rectangle | 300×100 | — | 300×250 |
| in_feed | 300×100 | — | 300×250 |

---

### 1.3 ArticleActions

**File:** `ui/ArticleActions.tsx`

Tombol aksi artikel (Print + Comments).

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `iconOnly` | `boolean?` | `false` | Hanya icon tanpa label |

**Visual:** Pill buttons `rounded-full border border-gray-200/80 bg-white/90 text-[10px] font-black uppercase tracking-[0.16em]`

---

### 1.4 ArticleBookmarkButton

**File:** `ui/ArticleBookmarkButton.tsx`

Tombol bookmark artikel dengan localStorage persistence.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `article` | `object` | Data artikel |
| `site` | `string` | Site ID |
| `className` | `string?` | Additional classes |
| `activeClassName` | `string?` | Class saat aktif |
| `idleClassName` | `string?` | Class saat idle |
| `iconSize` | `number?` | Ukuran icon |
| `onToggle` | `(saved: boolean) => void?` | Callback toggle |

---

### 1.5 ArticleFloatingTools

**File:** `ui/ArticleFloatingTools.tsx`

Floating sidebar tools untuk artikel (desktop only).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `title` | `string` | Judul artikel (untuk share) |
| `url` | `string` | URL artikel (untuk share) |

**Visual:** Desktop-only (`hidden md:block`): `w-[4rem] rounded-[1.75rem] bg-[rgba(7,15,33,0.78)] backdrop-blur-xl`. Buttons: font size, comments, share, print.

---

### 1.6 ArticleShareActions

**File:** `ui/ArticleShareActions.tsx`

Tombol share artikel ke berbagai platform.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `title` | `string` | required | Judul artikel |
| `url` | `string` | required | URL artikel |
| `variant` | `'inline' \| 'panel'` | `'inline'` | Tampilan |
| `tone` | `'default' \| 'floating'` | `'default'` | Warna |

**Platform:** Facebook, X (Twitter), Telegram, WhatsApp, Instagram, TikTok, YouTube (copy-to-clipboard), Native Share API.

---

### 1.7 AuthorCard

**File:** `ui/AuthorCard.tsx`

Kartu profil penulis.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `author` | `{ id, name, role?, email?, articleCount?, avatarUrl? }` | required | Data penulis |
| `site` | `string` | required | Site ID |
| `variant` | `'inline' \| 'card'` | `'inline'` | Tampilan |

**Variants:**
- `inline`: Horizontal row kecil (32px avatar + name + role)
- `card`: Menggunakan `dash-card`, 56px avatar dengan glow shadow

---

### 1.8 BackButton

**File:** `ui/BackButton.tsx`

Tombol kembali dengan ArrowLeft icon.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `fallbackHref` | `string` | required | URL tujuan |
| `label` | `string?` | `'Kembali'` | Teks tombol |

**Visual:** `text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted hover:text-brand-red`

---

### 1.9 BillboardShowcase

**File:** `ui/BillboardShowcase.tsx`

Fallback carousel untuk slot leaderboard saat tidak ada iklan aktif.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Auto-rotating carousel (8s) dengan gradient backgrounds, decorative SVG icons, dot indicators. CTA: "Pasang Iklan Anda →"

---

### 1.10 BreakingNewsTicker

**File:** `ui/BreakingNewsTicker.tsx`

Horizontal scrolling ticker berita terkini.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `news` | `string[]?` | Array berita |

**Visual:** Dark bar (`h-8`), pulsing red dot + "TERKINI" label, gradient fade edges. Respects `prefers-reduced-motion`.

---

### 1.11 CommentSection

**File:** `ui/CommentSection.tsx`

Seksi komentar artikel dengan form input.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `articleId` | `string` | ID artikel |

**Visual:** Textarea `rounded-[1.75rem]`, submit button `rounded-full bg-brand-red`. Comment items dengan avatar + name (uppercase, 11px, font-black).

---

### 1.12 DateTimeWeather

**File:** `ui/DateTimeWeather.tsx`

Display tanggal, waktu, dan cuaca inline.

**Visual:** Clock icon di brand-red, mono font untuk time, thermometer icon untuk weather.

---

### 1.13 EditorialBadge

**File:** `ui/EditorialBadge.tsx`

Badge editorial dengan 8 variant.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `variant` | `BadgeVariant` | required | Variant badge |
| `size` | `'sm' \| 'md'` | `'sm'` | Ukuran |

**Variants:**

| Variant | Background | Icon |
|---------|-----------|------|
| `breaking` | `bg-red-600` | ⚡ (pulse) |
| `exclusive` | `bg-violet-700` | ⭐ |
| `analysis` | `bg-sky-700` | 💎 |
| `live` | `bg-emerald-600` | ⭕ (pulse) |
| `photo` | `bg-amber-500` | 🎯 |
| `video` | `bg-brand-black` | ▶️ |
| `featured` | `bg-orange-500` | 💎 |
| `opinion` | `bg-slate-600` | ✒️ |

---

### 1.14 FadeInOnScroll

**File:** `ui/FadeInOnScroll.tsx`

Wrapper fade-in saat scroll (tanpa Framer Motion).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `children` | `ReactNode` | Konten |
| `delay` | `number?` | Delay dalam detik |

**Visual:** `transition-all duration-500 ease-out` dari `opacity-0 translate-y-4` ke `opacity-100 translate-0`.

---

### 1.15 FontSizeControl

**File:** `ui/FontSizeControl.tsx`

Kontrol ukuran font artikel (4 opsi: A-, Normal, A+, A++).

**Visual:** Pill-shaped `rounded-full border border-gray-200/80 bg-white/90 px-2 py-1.5 shadow-sm`. Active: `bg-white text-brand-red shadow-sm`.

**Sizes:** 0.85, 1.0, 1.15, 1.3 (via CSS variable `--article-font-scale`)

---

### 1.16 FullScreenSearch

**File:** `ui/FullScreenSearch.tsx`

Overlay pencarian full-screen.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `isOpen` | `boolean` | Status terbuka |
| `onClose` | `() => void` | Callback tutup |
| `trendingTopics` | `string[]?` | Topik trending |

**Visual:** `z-[100] bg-[#F8FAFC]/95 dark:bg-[#020617]/95 backdrop-blur-2xl`. Large search input `text-xl md:text-3xl`. Two-column: results + trending.

---

### 1.17 ImageLightboxWrapper

**File:** `ui/ImageLightboxWrapper.tsx`

Lightbox full-screen untuk gambar.

**Visual:** `z-[200] bg-black/90 backdrop-blur-xl`. Zoom in/out, rotate controls. Close button `bg-brand-red rounded-full`.

---

### 1.18 InFeedShowcase

**File:** `ui/InFeedShowcase.tsx`

Fallback carousel untuk slot in-feed.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Compact carousel dengan gradient backgrounds + decorative icons. CTA: "Pelajari →" / "Mulai →" / "Eksplor →"

---

### 1.19 JsonLd

**File:** `ui/JsonLd.tsx`

Structured data untuk SEO.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `data` | `JsonLdObject \| JsonLdObject[]` | Data JSON-LD |

**Visual:** None — render `<script type="application/ld+json">`

---

### 1.20 LoadMoreArticles

**File:** `ui/LoadMoreArticles.tsx`

Tombol "Load More" untuk infinite scroll.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteId` | `string` | Site ID |
| `category` | `string?` | Filter kategori |
| `search` | `string?` | Filter pencarian |

**Visual:** `px-10 py-4 bg-brand-black text-white text-[10px] font-black uppercase tracking-[0.3em] group-hover:bg-brand-red`

---

### 1.21 MarketWidget

**File:** `ui/MarketWidget.tsx`

Widget info pasar (IHSG, USD/IDR, Gold) untuk sidebar.

**Visual:** `rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm`. Live pulse dot (emerald), trend indicators. Auto-refresh 5 menit.

---

### 1.22 MobileArticleTools

**File:** `ui/MobileArticleTools.tsx`

Floating sidebar tools untuk artikel (mobile only).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `title` | `string` | Judul artikel |
| `url` | `string` | URL artikel |
| `article` | `object` | Data artikel |
| `site` | `string` | Site ID |

**Visual:** `md:hidden`, `fixed left-4 top-1/2 z-40 rounded-[1.75rem] bg-[rgba(7,15,33,0.8)] backdrop-blur-xl`. Smart collapse on scroll.

---

### 1.23 NewsletterForm

**File:** `ui/NewsletterForm.tsx`

Form newsletter dengan dark theme.

**Visual:** `bg-slate-900` card dengan red glow accent. Input `bg-white/5 border border-white/10`. Button `bg-brand-red`.

---

### 1.24 NewsCard

**File:** `ui/NewsCard.tsx`

Kartu artikel dengan 4 variant.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `article` | `NewsCardArticle` | required | Data artikel |
| `variant` | `'large' \| 'medium' \| 'minimal' \| 'horizontal'` | `'medium'` | Tampilan |
| `site` | `string?` | — | Site ID |
| `priority` | `boolean?` | `false` | Priority loading |

**Variants:**

| Variant | Layout | Image | Radius | Min Height |
|---------|--------|-------|--------|------------|
| `large` | Full overlay | Full bleed | `rounded-2xl` | **340px** |
| `medium` | Below image | `aspect-[16/9]` | `rounded-xl` | — |
| `horizontal` | Side-by-side | `w-28 md:w-36`, `aspect-[4/3]` | `rounded-xl` | — |
| `minimal` | Text only | None | — | — |

**Hover:** `hover:-translate-y-1 hover:scale-[1.01]`

---

### 1.25 ReadingProgress

**File:** `ui/ReadingProgress.tsx`

Progress bar bacaan di atas viewport.

**Visual:** `fixed top-0 left-0 right-0 h-1 bg-brand-red z-[60]`. Uses Framer Motion `useScroll` + `useSpring`.

---

### 1.26 RectangleShowcase

**File:** `ui/RectangleShowcase.tsx`

Fallback carousel untuk slot rectangle.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Vertical card layout, gradient backgrounds, decorative icons. CTA: "Pasang Iklan →" / "Mulai Beriklan →"

---

### 1.27 SavedArticlesFeed

**File:** `ui/SavedArticlesFeed.tsx`

Feed artikel yang disimpan (bookmarks).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Grid NewsCards dengan tombol hapus. Empty state: dashed border + CTA.

---

### 1.28 ScrollAnimate

**File:** `ui/ScrollAnimate.tsx`

Wrapper animasi scroll dengan Framer Motion.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `children` | `ReactNode` | Konten |
| `delay` | `number?` | Delay animasi |

**Visual:** Fade in + slide up (y:30→0) saat masuk viewport. Respects `prefers-reduced-motion`.

---

### 1.29 SecondaryRectangleShowcase

**File:** `ui/SecondaryRectangleShowcase.tsx`

Fallback card untuk slot rectangle secondary (non-carousel).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string` | Site ID |

**Visual:** Static card, light theme, dot pattern background, newsletter-style. CTA: "Pelajari Lebih Lanjut"

---

### 1.30 Skeleton

**File:** `ui/Skeleton.tsx`

Loading placeholder dengan shimmer animation.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `variant` | `'hero' \| 'card' \| 'minimal' \| 'trending' \| 'text' \| 'stat' \| 'list'` | `'card'` | Tipe skeleton |

**Visual:** `bg-gray-100 dark:bg-slate-800` dengan shimmer gradient overlay.

---

### 1.31 SmartImage

**File:** `ui/SmartImage.tsx`

Responsive image wrapper dengan multi-stage fallback.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `src` | `string?` | URL gambar utama |
| `thumbUrl` | `string?` | URL thumbnail (fallback) |
| `blur` | `string?` | Blur hash placeholder |
| `dominantColor` | `string?` | Dominant color placeholder |
| `context` | `SmartImageContext` | Konteks penggunaan |
| `fallbackSrc` | `string?` | Fallback terakhir |

**12 Contexts:**
`hero_lead`, `hero_side`, `card`, `card_horizontal`, `article_cover`, `article_block`, `gallery_thumb`, `gallery_full`, `media_text`, `logo`, `avatar`, `thumbnail`

Setiap context punya `sizes` dan `quality` yang berbeda.

---

### 1.32 SocialIcons

**File:** `ui/SocialIcons.tsx`

Icon social media (inline SVG).

**Components:** `SiFacebook`, `SiInstagram`, `SiTelegram`, `SiWhatsapp`, `SiX`, `SiYoutube`, `SiTiktok`

---

### 1.33 StatusBadge

**File:** `ui/StatusBadge.tsx`

Badge status workflow artikel (8 states).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `status` | `string` | Status name |

**States:** `draft`, `submitted`, `review`, `revision`, `approved`, `scheduled`, `published`, `archived`

**Visual:** `inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest` dengan colored dot indicator.

---

### 1.34 Toaster

**File:** `ui/Toaster.tsx`

Sistem notifikasi toast.

**Store:** `store/toastStore.ts`

**Variants:**

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `success` | `bg-emerald-50` | `text-emerald-600` | `border-emerald-100` |
| `error` | `bg-red-50` | `text-red-600` | `border-red-100` |
| `warning` | `bg-amber-50` | `text-amber-600` | `border-amber-100` |
| `info` | `bg-blue-50` | `text-blue-600` | `border-blue-100` |

**Visual:** `fixed bottom-6 right-6 z-[100]`, `rounded-2xl border shadow-xl backdrop-blur-xl`. Auto-dismiss 5 detik.

**Usage:** `useToastStore().addToast(message, type)`

---

### 1.35 VideoWidget

**File:** `ui/VideoWidget.tsx`

Widget video untuk sidebar.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `title` | `string` | Judul video |
| `thumbnail` | `string` | URL thumbnail |
| `duration` | `string?` | Durasi |
| `isLive` | `boolean?` | Status live |

**Visual:** `rounded-2xl border border-gray-100 bg-white p-5 shadow-sm`. Play button `w-12 h-12 bg-brand-red rounded-full`. Live badge dengan pulsing dot.

---

### 1.36 YouTubeEmbed

**File:** `ui/YouTubeEmbed.tsx`

Embed YouTube dengan click-to-play.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `url` | `string` | URL YouTube |
| `title` | `string?` | Judul video |

**Visual:** `rounded-2xl overflow-hidden shadow-lg bg-black`. Premium play button `w-20 h-20 bg-white rounded-full`. "EKSKLUSIF" badge `bg-red-600`. Lazy loading via Intersection Observer.

---

## 2. Layout Components

Folder: `apps/web/components/layout/`

### 2.1 Container

**File:** `layout/Container.tsx`

Wrapper responsive padding.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `size` | `'default' \| 'content' \| 'full'` | `'default'` | Max width |
| `bleed` | `boolean?` | `false` | Edge-to-edge mode |

| Size | Max Width |
|------|-----------|
| `default` | 1160px |
| `content` | 680px |
| `full` | 100% |

---

### 2.2 MobileBottomNav

**File:** `layout/MobileBottomNav.tsx`

Bottom navigation bar mobile (fixed).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `site` | `string?` | Site ID |
| `onSearchClick` | `() => void?` | Callback search |
| `onMenuClick` | `() => void?` | Callback menu |

**Visual:** `md:hidden`, `fixed bottom-4 z-50 w-[91%] max-w-md rounded-2xl bg-white/80 backdrop-blur-xl`. 5 items: Home, Search, Kategori, Tersimpan, Account.

---

### 2.3 MobileMenu

**File:** `layout/MobileMenu.tsx`

Drawer menu mobile dari kiri.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `isOpen` | `boolean` | Status terbuka |
| `onClose` | `() => void` | Callback tutup |
| `categories` | `array` | Daftar kategori |

**Visual:** `w-[82%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl`. Backdrop `bg-black/60 backdrop-blur-sm z-[100]`.

---

### 2.4 Navbar

**File:** `layout/Navbar.tsx`

Header navigasi utama (sticky).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteConfig` | `object` | Konfigurasi site |
| `categories` | `array` | Daftar kategori |
| `onSearchClick` | `() => void?` | Callback search |
| `onMenuClick` | `() => void?` | Callback menu |

**Visual:** `sticky top-0 z-50 border-b border-gray-200 bg-white/98 backdrop-blur-sm`. 3 rows: logo+search+actions, desktop category bar, mobile category pills.

---

### 2.5 PublicErrorView

**File:** `layout/PublicErrorView.tsx`

Halaman error publik.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `error` | `Error` | Error object |
| `reset` | `() => void` | Reset callback |

**Visual:** Decorative blurred circles, icon `rounded-2xl bg-rose-50 text-rose-600`, serif title, 2 action buttons.

---

### 2.6 PublicInfoShell

**File:** `layout/PublicInfoShell.tsx`

Wrapper untuk halaman legal/info.

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `width` | `'content' \| 'wide'` | `'content'` | Lebar konten |

| Width | Max Width |
|-------|-----------|
| `content` | `max-w-4xl` (896px) |
| `wide` | `max-w-6xl` (1152px) |

---

### 2.7 PublicSiteLayout

**File:** `layout/PublicSiteLayout.tsx`

Master layout untuk halaman publik.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteConfig` | `object` | Konfigurasi site |
| `children` | `ReactNode` | Konten halaman |

**Compose:** BreakingNewsTicker + Navbar + children + SiteFooter + MobileBottomNav + MobileMenu + FullScreenSearch + AISummary

---

### 2.8 ScrollReset

**File:** `layout/ScrollReset.tsx`

Utility: scroll ke atas saat route berubah.

---

### 2.9 SiteFooter

**File:** `layout/SiteFooter.tsx`

Footer situs dengan multi-kolom.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `siteConfig` | `object` | Konfigurasi site |
| `categories` | `array` | Daftar kategori |

**Visual:** `mt-20 border-t border-gray-200 bg-white pb-10 pt-12`. Social icons `h-11 w-11 rounded-xl bg-gray-100 hover:bg-brand-red`.

---

## 3. Dashboard Components

Folder: `apps/web/components/dashboard/`

### 3.1 AdPerformanceChart

**File:** `dashboard/ads/AdPerformanceChart.tsx`

Chart area untuk performa iklan (Recharts).

**Visual:** Area chart dengan gradient fill, impresi (biru) dan klik (hijau).

---

### 3.2 AdSlotCard

**File:** `dashboard/ads/AdSlotCard.tsx`

Card produksi untuk mengelola slot iklan (admin).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `slot` | `AdSlotDefinition` | Definisi slot |
| `ads` | `Ad[]` | Array iklan aktif |
| `onRefresh` | `() => void` | Callback refresh |

**Fitur:**
- Preview iklan yang sedang aktif
- Stats: impresi, klik, CTR
- Single upload → auto-generate semua variant
- Device coverage badge (Desktop+Mobile / Desktop Only)
- Toggle aktif/nonaktif, hapus, script mode

---

### 3.3 AdSlotCard (old)

**File:** `dashboard/ads/AdSlotCard.tsx` (sebelum rewrite)

*Note: Komponen ini sudah di-rewrite menjadi production card.*

---

### 3.4 AdsSubNav

**File:** `dashboard/ads/AdsSubNav.tsx`

Sub-navigasi untuk section iklan.

**Items:** Overview, Slot Iklan, Paket, Booking, Riwayat

---

### 3.5 AdvertiserAdsView

**File:** `dashboard/ads/AdvertiserAdsView.tsx`

Dashboard advertiser dengan stats dan chart.

---

### 3.6 AdvertiserDashboardOverview

**File:** `dashboard/ads/AdvertiserDashboardOverview.tsx`

Overview dashboard advertiser dengan 2 CTA cards.

---

### 3.7 BookingReviewList

**File:** `dashboard/ads/BookingReviewList.tsx`

Antrean review booking (admin).

**Checklist:**
- [ ] Tidak misleading
- [ ] Tidak SARA/prohibited
- [ ] Ukuran sesuai
- [ ] URL aktif
- [ ] Tidak melanggar hak cipta

---

### 3.8 BecomeAdvertiser

**File:** `dashboard/ads/BecomeAdvertiser.tsx`

Self-registration upgrade ke role advertiser.

---

### 3.9 LeaderboardBannerRow

**File:** `dashboard/ads/LeaderboardBannerRow.tsx`

Bar individual dalam carousel leaderboard.

| Prop | Type | Deskripsi |
|------|------|-----------|
| `ad` | `Ad` | Data iklan |
| `index` | `number` | Posisi dalam carousel |
| `total` | `number` | Total banner |
| `onUpdate` | `(id, payload) => void` | Callback update |
| `onDelete` | `(id) => void` | Callback hapus |
| `onReorder` | `(slotId, direction, index) => void` | Callback reorder |

**Fitur:** Reorder up/down, toggle active, edit (image/script mode), upload, delete.

---

### 3.10 LeaderboardManager

**File:** `dashboard/ads/LeaderboardManager.tsx`

Manager carousel leaderboard (multi-banner).

| Prop | Type | Deskripsi |
|------|------|-----------|
| `ads` | `Ad[]` | Array banner |
| `slotDef` | `AdSlotDefinition` | Definisi slot |
| `onAdd` | `() => void` | Callback tambah banner |
| `onUpdate` | `(id, payload) => void` | Callback update |
| `onDelete` | `(id) => void` | Callback hapus |
| `onReorder` | `(slotId, direction, index) => void` | Callback reorder |

---

### 3.11 NotificationBell

**File:** `dashboard/NotificationBell.tsx`

Bell notifikasi di dashboard.

---

### 3.12 SuperadminAdsView

**File:** `dashboard/ads/SuperadminAdsView.tsx`

*Note: File ini sudah dihapus (dead code).*

---

## 4. Editor Components

Folder: `apps/web/components/editor/`

### 4.1 AIConsentModal

**File:** `editor/AIConsentModal.tsx`

Modal consent untuk fitur AI.

**Visual:** `fixed inset-0 bg-black/50 z-50`, card `bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md`.

---

### 4.2 MediaLibraryModal

**File:** `editor/MediaLibraryModal.tsx`

Modal library media untuk editor.

---

## 5. Page Components

Folder: `apps/web/components/pages/`

### 5.1 SiteHomePage

**File:** `pages/SiteHomePage.tsx`

Komponen utama homepage.

**Sections:**
1. MagazineBentoHero (ZONA 1)
2. Leaderboard Ad (ZONA 1.5)
3. Fokus Redaksi (ZONA 2) — 3 kolom
4. Trending (ZONA 3) — 5 kolom
5. Main Feed + Sidebar (ZONA 4) — 8+4 kolom
6. Editorial Extras (ZONA 5+) — Pilihan Editor, Opini, Foto, Video

---

## 6. Marketing Components

Folder: `apps/web/components/marketing/`

### 6.1 AdsMarketingPage

**File:** `marketing/AdsMarketingPage.tsx`

Halaman marketing untuk paket iklan publik.

---

## Ringkasan

| Folder | Jumlah Komponen |
|--------|----------------|
| `ui/` | 36 |
| `layout/` | 11 |
| `dashboard/` | 12 |
| `editor/` | 2 |
| `pages/` | 1 |
| `marketing/` | 1 |
| **Total** | **63** |

---

*Dokumentasi dibuat dari codebase aktual — 27 Juni 2026*
