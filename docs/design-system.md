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

*Dokumentasi dibuat dari codebase aktual — 27 Juni 2026*
