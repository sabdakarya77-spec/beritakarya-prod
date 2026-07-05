# Design System — BeritaKarya

Referensi lengkap design system BeritaKarya. Semua nilai diambil langsung dari codebase (`tailwind.config.ts`, `globals.css`, komponen).

---

## 1. Typography

### Font Families

| Token | Font | CSS Variable | Weights | Penggunaan |
|-------|------|--------------|---------|------------|
| `font-sans` | Plus Jakarta Sans | `--font-plus-jakarta-sans` | All | Body, UI, labels, navigation |
| `font-serif` | Playfair Display | `--font-playfair` | 800, 900 | Headings, brand name, drop cap |

**Font Feature Settings** (body):
```
font-feature-settings: "cv02", "cv03", "cv04", "cv11"
```
Mengaktifkan stylistic alternates Plus Jakarta Sans.

### Typography Scale

| Penggunaan | Class | Size | Weight | Tracking |
|------------|-------|------|--------|----------|
| **Section title** | `sectionTitleClass` | `text-base md:text-xl` (16/20px) | `font-extrabold` | `tracking-tight` |
| **Section eyebrow** | `sectionEyebrowClass` | `text-[10px]` | `font-black` | `tracking-[0.16em]` |
| **Dashboard label** | `.dash-label` | `text-[10px]` | `font-black` | `tracking-[0.2em]` |
| **Dashboard value** | `.dash-value` | `text-3xl` (30px) | `font-black` | `tabular-nums` |
| **Card title** | — | `text-sm md:text-base` (14/16px) | `font-extrabold` | `tracking-tight` |
| **Card meta** | — | `text-[11px]` | `font-medium` | — |
| **Badge label** | — | `text-[9px]` - `text-[11px]` | `font-black` | `tracking-widest` |
| **Nav link** | — | `text-[10px]` | `font-bold` | `tracking-[0.12em]` |
| **Body text** | — | `text-sm` - `text-base` (14-16px) | — | — |
| **Article h1** | — | `text-2xl md:text-4xl lg:text-5xl` (24/36/48px) | `font-black` | `tracking-tight` |
| **Article h2** | — | `text-[calc(1.35rem*var(--article-font-scale))]` | `font-serif font-black` | `tracking-tighter` |
| **Article body** | — | `text-[calc(1rem*var(--article-font-scale))]` (16px) | — | `leading-[1.75]` |
| **Drop cap** | — | `text-7xl md:text-8xl` | `font-serif font-black` | — |

### Typography Rules

- **Headings**: selalu `font-serif font-black` atau `font-sans font-extrabold`, selalu `tracking-tight` atau `tracking-tighter`
- **Labels**: selalu `font-black uppercase`, tracking minimal `0.14em`
- **Body**: `antialiased` di semua elemen
- **Drop cap**: hanya paragraf pertama, `font-serif`, warna `brand-red`
- **Font scale**: dikontrol CSS variable `--article-font-scale` (default 1.0, opsi: 0.85, 1, 1.15, 1.3)

---

## 2. Colors

### Brand Colors

| Token | Light | Dark | CSS Variable |
|-------|-------|------|--------------|
| `brand-red` | `#B91C1C` | `#EF4444` | `--brand-red` |
| `brand-black` | `#0F172A` | `#F8FAFC` | `--brand-black` |
| `brand-dark` | `#020617` | `#F1F5F9` | `--brand-dark` |
| `brand-grey` | `#F1F5F9` | `#1E293B` | `--brand-grey` |
| `brand-surface` | `#F1F5F9` | `#0F172A` | `--brand-surface` |
| `brand-text` | `#0F172A` | `#F8FAFC` | `--brand-text` |
| `brand-text-muted` | `#64748B` | `#94A3B8` | `--brand-text-muted` |
| `bg-main` | `#F8FAFC` | `#020617` | `--bg-main` |

Semua `brand-*` mendukung alpha value (e.g. `bg-brand-red/10`).

### Primary Red Scale

| Stop | Hex |
|------|-----|
| `primary-50` | `#fef2f2` |
| `primary-100` | `#fee2e2` |
| `primary-200` | `#fecaca` |
| `primary-300` | `#fca5a5` |
| `primary-400` | `#f87171` |
| `primary-500` | `#EF4444` |
| `primary-600` | `#DC2626` |
| `primary-700` | `#B91C1C` ← brand-red |
| `primary-800` | `#991b1b` |
| `primary-900` | `#7f1d1d` |
| `primary-950` | `#450a0a` |

### Editorial Badge Colors

| Badge | Light | Dark |
|-------|-------|------|
| `breaking` | `#DC2626` | `#EF4444` |
| `exclusive` | `#7C3AED` | `#A78BFA` |
| `analysis` | `#0369A1` | `#38BDF8` |
| `live` | `#16A34A` | `#4ADE80` |

### Workflow Status Colors

| Status | Light | Dark |
|--------|-------|------|
| `draft` | `#F59E0B` (amber) | `#FBBF24` |
| `submitted` | `#3B82F6` (blue) | `#60A5FA` |
| `review` | `#8B5CF6` (violet) | `#A78BFA` |
| `revision` | `#F97316` (orange) | `#FB923C` |
| `approved` | `#10B981` (emerald) | `#34D399` |
| `scheduled` | `#06B6D4` (cyan) | `#22D3EE` |
| `published` | `#059669` (green) | `#2DD4BF` |
| `archived` | `#6B7280` (gray) | `#94A3B8` |

### Dashboard Colors

| Token | Light | Dark | CSS Variable |
|-------|-------|------|--------------|
| Sidebar bg | `#0F172A` | `#020617` | `--dash-sidebar` |
| Sidebar hover | `rgba(255,255,255,0.05)` | same | `--dash-sidebar-hover` |
| Card bg | `#FFFFFF` | `#0F172A` | `--dash-card` |
| Border | `#E2E8F0` | `rgba(255,255,255,0.06)` | `--dash-border` |

### Panel Editor Colors

| Token | Light | Dark |
|-------|-------|------|
| `panel-bg` | `#FFFFFF` | `#0E1118` |
| `panel-surface` | `#F8FAFC` | `#161B27` |
| `panel-elevated` | `#F1F5F9` | `#1C2333` |
| `panel-border` | `rgba(15,23,42,0.08)` | `rgba(255,255,255,0.07)` |
| `panel-accent` | `#EF4444` | `#EF4444` |
| `panel-text-primary` | `#0F172A` | `#F1F5F9` |
| `panel-text-secondary` | `#475569` | `#64748B` |
| `panel-text-muted` | `#94A3B8` | `#334155` |

---

## 3. Spacing & Layout

### Container

| Tipe | Max Width | Token |
|------|-----------|-------|
| Default | **1160px** (72.5rem) | `max-w-container` |
| Content | **680px** (42.5rem) | `max-w-content` |
| Full | 100% | `max-w-full` |

### Container Padding

| Breakpoint | Padding | Class | CSS Variable |
|------------|---------|-------|--------------|
| Mobile | **16px** | `px-4` | `--container-padding-mobile` |
| Tablet (768px+) | **32px** | `md:px-8` | `--container-padding-tablet` |
| Desktop (1024px+) | **40px** | `lg:px-10` | `--container-padding-desktop` |

### Grid Gaps

| Token | Value |
|-------|-------|
| `--gap-regular` | **24px** (1.5rem) |
| `--gap-wide` | **48px** (3rem) |
| `--gap-wider` | **80px** (5rem) |

---

## 4. Border Radius

### Tokens

| Token | Value | Tailwind | Penggunaan |
|-------|-------|----------|------------|
| `--radius-card` | **24px** (1.5rem) | `rounded-3xl` | Premium cards |
| `--radius-button` | **12px** (0.75rem) | `rounded-xl` | Buttons |
| `--radius-input` | **8px** (0.5rem) | `rounded-lg` | Inputs |

### Pola Penggunaan

| Class | Ukuran | Penggunaan |
|-------|--------|------------|
| `rounded-sm` | 2px | Badge kecil |
| `rounded-lg` | 8px | Inputs, code blocks |
| `rounded-xl` | 12px | Buttons, elevated cards |
| `rounded-2xl` | 16px | Cards, widgets, video embeds |
| `rounded-3xl` | 24px | Author avatar, premium cards |
| `rounded-full` | 9999px | Avatars, badges, pills, spinners |

---

## 5. Shadows

| Level | Class | Penggunaan |
|-------|-------|------------|
| Subtle | `shadow-sm` | Base card, inputs |
| Medium | `shadow-md` | Card hover, brand glow |
| Large | `shadow-lg` | Elevated panels |
| XL | `shadow-xl` | Glassmorphism cards |
| 2XL | `shadow-2xl` | Highest elevation |
| Inner | `shadow-inner` | Quote blocks |

### Brand Glow Shadows

```
shadow-brand-red/10   — subtle glow
shadow-brand-red/20   — medium glow
shadow-brand-red/25   — avatar glow
shadow-brand-red/30   — strong glow
```

### Premium Shadow

```
shadow-[0_16px_48px_rgba(15,23,42,0.12)]  — dropdown, floating panels
shadow-[0_20px_60px_rgba(0,0,0,0.28)]      — floating tools
```

---

## 6. Animations & Transitions

### Custom Keyframes

| Nama | Class | Durasi | Deskripsi |
|------|-------|--------|-----------|
| `fadeIn` | `.animate-fade-in` | 0.6s ease-out | Fade in + translateY(10→0) |
| `slideInRight` | `.animate-slide-in` | 0.4s ease-out | Slide dari kanan 20px |
| `countUp` | `.animate-count-up` | 0.5s ease-out | Angka naik halus |
| `shimmer` | `.animate-shimmer` | 2s infinite | Loading shimmer |
| `marquee` | `animate-marquee` | 25s linear infinite | Horizontal scroll |

### Ad Animation Keyframes

> **Catatan:** Animasi iklan dihapus dari UI (lihat `docs/ads.md`). Keyframe berikut mungkin masih ada di CSS tapi tidak aktif digunakan.

### Transition Patterns

| Pattern | Durasi | Penggunaan |
|---------|--------|------------|
| `transition-colors duration-500` | 500ms | Dark mode switch |
| `transition-all duration-300` | 300ms | Card hover, interactive |
| `transition-transform duration-300` | 300ms | Avatar hover scale |
| `transition-colors` | default | Link hovers |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Dark Mode

- **Strategy**: `darkMode: 'class'` (toggle `dark` class di `<html>`)
- **Storage**: `localStorage.getItem('theme')`
- **Transition**: `transition-colors duration-500` di body
- **Semua CSS variable** punya `.dark` override

---

## 8. Components

### 8.1 Container

**File:** `components/layout/Container.tsx`

```tsx
<Container>           {/* max-w: 1160px */}
<Container size="content"> {/* max-w: 680px */}
<Container size="full">    {/* max-w: 100% */}
<Container bleed>          {/* edge-to-edge */}
```

### 8.2 NewsCard

**File:** `components/ui/NewsCard.tsx`

| Variant | Layout | Image | Radius | Min Height |
|---------|--------|-------|--------|------------|
| `large` | Full overlay | Full bleed | `rounded-2xl` (16px) | **340px** |
| `medium` | Below image | `aspect-[16/9]` | `rounded-xl` (12px) | — |
| `horizontal` | Side-by-side | `w-28 md:w-36`, `aspect-[4/3]` | `rounded-xl` (12px) | — |
| `minimal` | Text only | None | — | — |

**Common classes:**
- Title: `text-sm font-extrabold leading-[1.2] tracking-tight`
- Meta: `text-[11px] text-brand-text-muted`
- Category badge: `rounded-sm px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em]`
- Bookmark: `h-11 w-11` (44×44px touch target)
- Hover: `hover:-translate-y-1 hover:scale-[1.01]`

### 8.3 StatusBadge

**File:** `components/ui/StatusBadge.tsx`

8 states: `draft`, `submitted`, `review`, `revision`, `approved`, `scheduled`, `published`, `archived`

```
inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
```

### 8.4 EditorialBadge

**File:** `components/ui/EditorialBadge.tsx`

8 variants: `breaking`, `exclusive`, `analysis`, `live`, `photo`, `video`, `featured`, `opinion`

```
inline-flex items-center gap-1 font-black uppercase rounded-sm
sm: px-2.5 py-0.5 text-[11px] tracking-[0.14em]
md: px-3 py-1 text-[12px]
```

### 8.5 SmartImage

**File:** `components/ui/SmartImage.tsx`

12 contexts: `hero_lead`, `hero_side`, `card`, `card_horizontal`, `article_cover`, `article_block`, `gallery_thumb`, `gallery_full`, `media_text`, `logo`, `avatar`, `thumbnail`

Multi-stage fallback: `src` → `thumbUrl` → dominant color placeholder → broken image icon

### 8.6 Toast (Toaster)

**File:** `components/ui/Toaster.tsx`

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `success` | `bg-emerald-50` | `text-emerald-600` | `border-emerald-100` |
| `error` | `bg-red-50` | `text-red-600` | `border-red-100` |
| `warning` | `bg-amber-50` | `text-amber-600` | `border-amber-100` |
| `info` | `bg-blue-50` | `text-blue-600` | `border-blue-100` |

```
rounded-2xl border shadow-xl backdrop-blur-xl min-w-[280px] max-w-md
text-[11px] font-black uppercase tracking-widest
```

Auto-dismiss: 5 detik. Position: `fixed bottom-6 right-6 z-[100]`

### 8.7 AdSpace

**File:** `components/ui/AdSpace.tsx`

> Lihat `docs/ads.md` untuk dokumentasi lengkap sistem iklan (slot, ukuran, API, pricing).

| Slot ID | Nama Lokasi | Desktop | Tablet | Mobile | Rasio |
|---------|-------------|---------|--------|--------|-------|
| `HOME_TOP` | Hero Banner | 960×240 | 728×182 | 360×90 | 4:1 |
| `HOME_FEED_1` | Feed Atas | 300×200 | 300×200 | 300×200 | 3:2 |
| `HOME_FEED_2` | Feed Bawah | 300×150 | 300×150 | 300×150 | 2:1 |
| `ARTICLE_TOP` | Artikel Atas | 300×200 | 300×200 | 300×200 | 3:2 |
| `ARTICLE_MIDDLE` | Artikel Tengah | 300×150 | 300×150 | 300×150 | 2:1 |
| `ARTICLE_BOTTOM` | Artikel Bawah | 300×150 | 300×150 | 300×150 | 2:1 |

Label badge: `rounded-sm bg-brand-red px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-lg`

### 8.8 Typography Primitives

**File:** `components/ui/Typography.tsx`

Reusable typography components sesuai design-system.md tokens.

| Component | Default Style | Penggunaan |
|-----------|---------------|------------|
| `<SectionTitle>` | `text-base md:text-xl font-extrabold tracking-tight` | Judul section homepage |
| `<SectionEyebrow>` | `text-[10px] font-black uppercase tracking-[0.16em]` | Label di atas section title |
| `<BadgeLabel>` | `text-[10px] font-black uppercase tracking-widest` | Label badge / tag |
| `<DashLabel>` | `text-[10px] font-black uppercase tracking-[0.2em]` | Label dashboard cards |
| `<DashValue>` | `text-3xl font-black tabular-nums` | Angka dashboard cards |
| `<CardTitle>` | `text-sm md:text-base font-extrabold tracking-tight` | Judul card |
| `<CardMeta>` | `text-[11px] font-medium text-brand-text-muted` | Meta info card |
| `<NavLink>` | `text-[10px] font-bold tracking-[0.12em]` | Label navigasi |

Semua mendukung `className` override dan `as` prop untuk custom element.

```tsx
import { SectionTitle, SectionEyebrow } from '@/components/ui/Typography';

<SectionEyebrow>TRENDING</SectionEyebrow>
<SectionTitle>Berita Utama</SectionTitle>
```

### 8.9 Button

**File:** `components/ui/Button.tsx`

Centralized button component dengan 5 variants.

| Variant | Style | Penggunaan |
|---------|-------|------------|
| `primary` | `bg-brand-red` → `hover:bg-brand-red` | CTA utama (public) |
| `secondary` | Bordered ghost | Tombol alternatif (public) |
| `dark` | `bg-brand-black` → `hover:bg-brand-red` | Dark CTA |
| `dashboard` | Flat red | Tombol utama (admin) |
| `dashboard-secondary` | Flat bordered | Tombol sekunder (admin) |

| Size | Padding | Font |
|------|---------|------|
| `sm` | `px-3.5 py-1.5` | `text-[9px]` |
| `md` | `px-5 py-2.5` | `text-[10px]` |
| `lg` | `px-8 py-3.5` | `text-[11px]` |

Props: `loading` (spinner), `fullWidth`, `disabled`

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary">Simpan</Button>
<Button variant="dashboard-secondary" loading>Menyimpan...</Button>
<Button variant="dark" fullWidth>Baca Selengkapnya</Button>
```

### 8.10 Grid & Stack

**File:** `components/ui/Grid.tsx`

Layout primitives dengan gap tokens dari design-system.

**Gap Tokens:**

| Token | Value | Class |
|-------|-------|-------|
| `tight` | 12px | `gap-3` |
| `regular` | 24px | `gap-6` |
| `wide` | 48px | `gap-12` |
| `wider` | 80px | `gap-20` |

**Grid** — responsive grid layout:

```tsx
import { Grid } from '@/components/ui/Grid';

// 3 kolom responsif
<Grid cols={3} gap="regular">
  <Card /><Card /><Card />
</Grid>

// Custom breakpoints
<Grid cols={{ sm: 1, md: 2, lg: 4 }} gap="wide">
  {items.map(item => <Card key={item.id} />)}
</Grid>
```

**Stack** — vertical/horizontal layout:

```tsx
import { Stack, Spacer } from '@/components/ui/Grid';

// Vertical
<Stack gap="regular">
  <Heading /><Content /><Footer />
</Stack>

// Horizontal dengan spacer
<Stack direction="horizontal" align="center" justify="between">
  <Logo /><Spacer /><Nav />
</Stack>
```

### 8.11 AnimateGrid

**File:** `components/ui/AnimateGrid.tsx`

Staggered entrance animation untuk card grids.

| Prop | Default | Keterangan |
|------|---------|------------|
| `baseDelay` | `0` | Delay awal sebelum item pertama (ms) |
| `stagger` | `80` | Increment delay per item (ms) |
| `maxAnimated` | `12` | Maksimal item yang dianimasikan |

```tsx
import AnimateGrid, { AnimateItem } from '@/components/ui/AnimateGrid';

// Grid dengan staggered entrance
<AnimateGrid stagger={100}>
  <Grid cols={3}>
    {articles.map(a => <NewsCard key={a.id} article={a} />)}
  </Grid>
</AnimateGrid>

// Single item
<AnimateItem delay={200}>
  <HeroSection />
</AnimateItem>
```

Mendukung `prefers-reduced-motion` via `FadeInOnScroll`.

### 8.12 Container — Wide Variant

**File:** `components/layout/Container.tsx`

```tsx
<Container size="wide">  {/* max-w: 1400px — untuk full-width hero/grids */}
```

| Size | Max Width | CSS Variable |
|------|-----------|--------------|
| `default` | 1160px | `--container-max-width` |
| `content` | 680px | `--content-max-width` |
| `full` | 100% | — |
| `wide` | 1400px | `--wide-max-width` |

---

## 9. Patterns

### 9.1 Button Patterns

**Tidak ada komponen Button terpusat.** Pola konsisten:

**Primary (brand-red):**
```
bg-brand-red text-white rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-brand-black transition-all
```

**Secondary/Ghost:**
```
rounded-full border border-gray-200/80 bg-white/90 text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted shadow-sm hover:border-brand-red/30 hover:text-brand-red
```

**Dark CTA:**
```
bg-brand-black text-white text-[10px] font-black uppercase tracking-[0.3em] group-hover:bg-brand-red rounded-sm px-10 py-4
```

**Dashboard Primary:**
```
px-5 py-2.5 bg-brand-red hover:bg-red-600 text-white rounded-lg text-sm font-medium
```

**Dashboard Secondary:**
```
px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700
```

### 9.2 Card Patterns

**`.dash-card`:**
```css
bg-white dark:bg-slate-900/60 border border-gray-100 dark:border-white/5 rounded-lg shadow-sm
hover:shadow-md transition-all duration-300
```

**`.dash-card-header`:**
```css
flex justify-between items-center px-6 py-4 border-b border-gray-50 dark:border-white/5
```

**`.dash-card-body`:** `p-6`

**Widget Card:**
```
rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] p-5 shadow-sm
```

### 9.3 Form Input Patterns

**Dashboard Input:**
```
w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all
```

**Search Input:**
```
rounded-full border border-gray-200 bg-gray-100 py-2 pl-9 pr-4 text-[11px] outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/30
```

**Comment Textarea:**
```
rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-brand-red/30 min-h-[44px] resize-none
```

### 9.4 Modal/Dialog Pattern

```
Backdrop:  fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]
Card:      bg-white dark:bg-gray-900 rounded-xl border shadow-xl
Header:    p-6 border-b border-gray-200 dark:border-gray-800
Footer:    p-6 border-t border-gray-200 dark:border-gray-800
Close:     absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-lg
```

Portal via `createPortal` ke `document.body`. Escape key dan click-outside menutup.

### 9.5 Glassmorphism Pattern

```
bg-[rgba(7,15,33,0.78)] backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)]
```

Digunakan di: `ArticleFloatingTools`, `MobileArticleTools`

### 9.6 Loading Pattern

**Skeleton shimmer:**
```
bg-gray-100 dark:bg-slate-800 animate-pulse
```

**Spinner:**
```
animate-spin text-brand-red
```

---

## 10. Accessibility

### Focus Styles

```css
:focus-visible {
  outline: 2px solid var(--brand-red);
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

### Touch Targets

Semua elemen interaktif minimal **44×44px**:
- Bookmark button: `h-11 w-11` (44px)
- Nav items: `min-h-[44px] min-w-[44px]`
- Share buttons: `min-h-[44px] min-w-[44px]`

### Skip to Content

```css
.skip-to-content: absolute, off-screen, z-9999, bg-brand-red, visible on focus
```

---

## 11. Print Styles

```css
@media print {
  .no-print, header, footer, aside, nav, .ad-space,
  .share-sidebar, .comment-section, button, .reading-progress {
    display: none !important;
  }
  body { background: white; color: black; font-size: 12pt; }
  .container { max-width: 100%; padding: 0; }
}
```

---

## 12. Ringkasan Token

| Kategori | Jumlah Token |
|----------|-------------|
| Font families | 2 (sans, serif) |
| Brand colors | 7 (+ alpha support) |
| Primary red scale | 10 stops |
| Editorial badges | 4 colors |
| Workflow statuses | 8 colors |
| Dashboard tokens | 4 colors |
| Panel tokens | 12 colors |
| Container spacing | 3 breakpoints |
| Max widths | 2 (container, content) |
| Border radius | 3 tokens + 6 patterns |
| Animations | 8 keyframes |
| Utility classes | 25+ |
| UI components | 40+ |
| Layout components | 11 |
| Typography primitives | 8 (SectionTitle, SectionEyebrow, BadgeLabel, DashLabel, DashValue, CardTitle, CardMeta, NavLink) |
| Button variants | 5 (primary, secondary, dark, dashboard, dashboard-secondary) |
| Grid gap tokens | 4 (tight, regular, wide, wider) |

---

## 13. Layout Desktop

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

## 14. Layout Mobile

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

| Slot ID | Nama Lokasi | Mobile Size | Rasio |
|---------|-------------|-------------|-------|
| `HOME_TOP` | Hero Banner | 320×80 px | 4:1 |
| `HOME_FEED_1` | Feed Atas | 300×200 px | 3:2 |
| `HOME_FEED_2` | Feed Bawah | 300×150 px | 2:1 |
| `ARTICLE_TOP` | Artikel Atas | 300×200 px | 3:2 |
| `ARTICLE_MIDDLE` | Artikel Tengah | 300×150 px | 2:1 |
| `ARTICLE_BOTTOM` | Artikel Bawah | 300×150 px | 2:1 |

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

## 15. Typography Analysis — vs Media Besar

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

---

*Dokumentasi dibuat dari codebase aktual — 27 Juni 2026*
