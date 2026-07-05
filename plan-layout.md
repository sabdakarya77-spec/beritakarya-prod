# Plan Layout — Peningkatan Token Design BeritaKarya

**Tanggal:** 2026-07-05
**Status:** Draft
**Tujuan:** Mendekatkan BeritaKarya ke standar media premium (Kompas.id, Tempo, Bloomberg) tanpa mengubah arsitektur yang ada.

---

## 1. Ringkasan Perubahan

| # | Token | Saat Ini | Target | Fase |
|---|-------|----------|--------|------|
| 1 | Container max-width | 1160px | **1280px** | 1 |
| 2 | Hero tinggi | ~550px | **560px** | 1 |
| 3 | Section gap (homepage) | 24px | **32px** | 1 |
| 4 | Container padding (desktop) | 40px fixed | **clamp(40px, 3vw, 48px)** | 2 |
| 5 | Sidebar width (artikel) | 320–360px | **340px** | 2 |
| 6 | Card radius (feed cards) | 24px uniform | **16px feed, 24px hero** | 2 |
| 7 | NewsCard feed | judul + excerpt + author + date | **judul 1 baris + category badge** | 2B |
| 8 | NewsCard gambar proporsi | 56% tinggi card | **70% tinggi card** | 2B |
| 9 | Container ke 1400px | — | **Tunda** | 3 |
| 10 | Content width ke 760px | — | **Tolak** | — |
| 11 | Large gap 56px | — | **Tolak** | — |

---

## 2. FASE 1 — Terapkan Sekarang

**Estimasi:** 1–2 jam
**Risiko:** Rendah
**Dampak:** Tinggi (terlihat di semua halaman)

### 2.1 Container Max-Width: 1160px → 1280px

**Alasan:**
- Monitor 1440px masih sangat populer di Indonesia
- 1280px memberi kesan lebih lega tanpa terlalu mepet di 1440px viewport
- 1400px (yang ada di `--wide-max-width`) terlalu lebar untuk default — bisa dipakai untuk hero/grids khusus

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `apps/web/app/globals.css` | `--container-max-width: 72.5rem` → `80rem` (1280px) |

**Catatan:**
- `tailwind.config.ts` sudah punya token `max-w-container` yang mengacu ke CSS variable, jadi tidak perlu diubah
- `<Container size="wide">` tetap 1400px, tidak berubah
- Semua halaman yang pakai `<Container>` otomatis mendapat efek ini

**Testing:**
- [ ] Homepage di viewport 1440px — konten tidak terlalu mepet
- [ ] Homepage di viewport 1920px — konten tetap terpusat
- [ ] Article page di viewport 1440px — sidebar tidak terpotong
- [ ] Dashboard di viewport 1440px — layout tidak pecah
- [ ] Mobile (375px) — tidak ada perubahan (max-width tidak relevan)

---

### 2.2 Hero Tinggi: ~550px → 560px

**Alasan:**
- Penyesuaian kecil (10px), dampak visual positif
- 560px adalah sweet spot antara wow factor dan konten di atas fold

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `apps/web/components/berita/MagazineBentoHero.tsx` | Cari properti tinggi hero → ubah ke `560px` |

**Testing:**
- [ ] Desktop (1280px) — hero terlihat proporsional
- [ ] Mobile (375px) — hero tetap responsif
- [ ] Thumbnail bar di bawah hero tetap terlihat

---

### 2.3 Section Gap: 24px → 32px (Selektif)

**Alasan:**
- 32px memberi "napas" lebih antar section homepage
- Tidak mengubah card-level spacing (tetap 24px)

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `apps/web/components/pages/home/SiteHomePage.tsx` | Ubah gap di zona 2 (Fokus Redaksi), zona 3 (Trending), zona 4 (Feed) dari `gap-6` (24px) ke `gap-8` (32px) |

**Yang TIDAK diubah:**
- Card internal spacing → tetap `gap-6` (24px)
- Sidebar widget spacing → tetap `space-y-4` (16px)
- Grid component default → tetap `gap-6` (24px)

**Testing:**
- [ ] Homepage desktop — section terasa lebih lega
- [ ] Homepage mobile — section tidak terlalu renggang
- [ ] Card spacing di dalam section tetap rapat

---

## 3. FASE 2 — Setelah Fase 1 Stabil

**Estimasi:** 2–3 jam
**Risiko:** Rendah–Sedang
**Dampak:** Sedang (perbaikan detail)

### 3.1 Container Padding Responsif

**Alasan:**
- 40px fixed terasa mepet di monitor besar (1920px+)
- `clamp()` otomatis menyesuaikan tanpa media query tambahan

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `apps/web/app/globals.css` | `--container-padding-desktop: 2.5rem` → `clamp(2.5rem, 3vw, 3rem)` |
| `apps/web/components/layout/Container.tsx` | Ganti `lg:px-10` dengan style yang menggunakan CSS variable |

**Catatan:**
- `clamp(40px, 3vw, 48px)` → di 1440px = 43px, di 1920px = 48px, di 2560px = 48px (capped)
- Perlu testing di beberapa viewport untuk memastikan transisi halus

**Testing:**
- [ ] Viewport 1440px — padding ~43px, konten tidak mepet
- [ ] Viewport 1920px — padding 48px, konten lega
- [ ] Viewport 2560px — padding capped di 48px
- [ ] Bleed mode tetap berfungsi normal

---

### 3.2 Sidebar Width: 340px

**Alasan:**
- Simplifikasi dari 2 breakpoint (320px xl / 360px 2xl) jadi 1 nilai tetap
- 340px adalah middle ground yang ideal

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `apps/web/app/[site]/artikel/[slug]/page.tsx` | Ubah grid template dari `xl:grid-cols-[minmax(0,1.75fr)_20rem] 2xl:grid-cols-[minmax(0,1.75fr)_22.5rem]` ke `xl:grid-cols-[minmax(0,1.75fr)_21.25rem]` |

**Testing:**
- [ ] Article page di viewport 1280px — sidebar 340px muat
- [ ] Article page di viewport 1920px — sidebar tidak berubah
- [ ] Sidebar sticky behavior tetap berfungsi

---

### 3.3 Card Radius Kontekstual

**Alasan:**
- Radius 24px terlalu besar untuk feed cards yang kecil
- 16px lebih proporsional untuk cards, 24px tetap untuk hero/premium

**File yang diubah:**

| File | Perubahan |
|------|-----------|
| `apps/web/components/ui/NewsCard.tsx` | Variant `medium` dan `horizontal`: radius tetap `rounded-xl` (12px) atau `rounded-2xl` (16px). Variant `large`: tetap `rounded-2xl` (16px). |

**Catatan:**
- NewsCard sudah menggunakan `rounded-2xl` (16px) untuk sebagian besar variant
- Yang perlu dicek: apakah ada card lain yang masih pakai `rounded-3xl` (24px) secara tidak perlu

**Testing:**
- [ ] Homepage feed cards — radius 16px terlihat proporsional
- [ ] Hero cards — radius tetap premium
- [ ] Sidebar widgets — radius konsisten

---

## 4. FASE 2B — NewsCard Visual-Forward (Bersih & Minimalis)

**Estimasi:** 3–4 jam
**Risiko:** Sedang (perubahan visual signifikan)
**Dampak:** Tinggi (tampilan card lebih bersih, gambar lebih dominan)

### 4.1 Prinsip Desain

Feed cards harus **visual-forward** — gambar mendominasi, teks diminimalkan tapi tidak dihapus total. Kecuali di Hero dan Pilihan Editor yang tetap pakai overlay teks.

**Yang DIHAPUS dari feed cards:**
- Excerpt / ringkasan
- Author name
- Date / waktu publikasi
- Read time

**Yang DIPERTAHANAN di feed cards:**
- Judul (1 baris, truncate)
- Category badge
- Gambar (proporsi lebih besar)

**Yang KHUSUS (tetap teks lengkap):**
- Hero section → judul besar + excerpt + author + date (overlay)
- Pilihan Editor → judul + author (overlay di gambar portrait)
- Trending → nomor + judul + views count

### 4.2 Perubahan per Variant

| Variant | Saat Ini | Setelah |
|---------|----------|---------|
| `large` | Gambar + judul + excerpt + author + date | **Gambar + judul 1 baris + category badge** (excerpt, author, date DIHAPUS) |
| `medium` | Gambar + judul + excerpt + author + date | **Gambar besar + judul 1 baris + category badge** (excerpt, author, date DIHAPUS) |
| `horizontal` | Thumbnail + judul + excerpt + author + date | **Thumbnail + judul 1 baris + category badge** (excerpt, author, date DIHAPUS) |
| `minimal` | Judul + author + date | **Judul saja** (tetap, sudah minimal) |

### 4.3 Proporsi Gambar Baru

| Variant | Gambar Saat Ini | Gambar Setelah |
|---------|-----------------|----------------|
| `large` | Full background | **Tetap full background** (proporsi tidak berubah) |
| `medium` | `aspect-[16/9]` | **`aspect-[16/9]` atau `aspect-[4/3]`** (lebih tinggi, lebih dominan) |
| `horizontal` | `w-28 md:w-36` (112–144px) | **`w-32 md:w-44`** (128–176px) — gambar lebih besar |

### 4.4 Section yang TIDAK Diubah

| Section | Alasan | Tetap Pakai |
|---------|--------|-------------|
| **Hero (MagazineBentoHero)** | Overlay teks adalah inti desain | Judul besar + excerpt + author + date |
| **Pilihan Editor** | Portrait card butuh konteks | Judul + author (overlay) |
| **Trending** | Informasi ranking penting | Nomor + judul + views |
| **Opini & Analisis** | Judul + excerpt penting untuk konteks opini | Judul + excerpt (tanpa author/date) |
| **Video Eksklusif** | Durasi video penting | Thumbnail + play button + judul + durasi |
| **Foto Jurnalistik** | Caption dan photographer adalah konteks | Gambar + caption + photographer |

### 4.5 Section yang DIUBAH

| Section | Perubahan |
|---------|-----------|
| **ZONA 4 — Berita Terbaru (feed)** | Hapus excerpt, author, date. Pertahankan judul + category badge |
| **Paling Dibaca (interstitial)** | Hapus read time. Pertahankan nomor + judul + thumbnail |
| **Sidebar widgets** | Hapus author + date. Pertahankan nomor + judul |
| **Recommended articles** | Hapus excerpt + author + date. Pertahankan judul + gambar |

### 4.6 File yang Diubah

| File | Perubahan |
|------|-----------|
| `apps/web/components/ui/NewsCard.tsx` | Hapus excerpt, author, date dari variant `large`, `medium`, `horizontal`. Perbesar proporsi gambar `medium` dan `horizontal` |
| `apps/web/components/pages/home/FeedSection.tsx` | Sesuaikan grid gap dan proporsi card |
| `apps/web/components/pages/home/trending/StickySidebar.tsx` | Hapus author + date dari sidebar article items |
| `apps/web/components/ui/SavedArticlesFeed.tsx` | Sesuaikan layout card (jika ada) |
| `apps/web/app/[site]/artikel/[slug]/page.tsx` | Hapus excerpt + author dari recommended articles |

### 4.7 Contoh Visual — Sebelum vs Sesudah

**Feed Card Medium — SEBELUM:**
```
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │      [GAMBAR 16:9]       │ │
│ └──────────────────────────┘ │
│ POLITIK                      │
│ Judul Artikel yang Panjang   │
│ Excerpt satu atau dua baris  │
│ Author Name · 2 jam lalu     │
└──────────────────────────────┘
```

**Feed Card Medium — SESUDAH:**
```
┌──────────────────────────────┐
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │      [GAMBAR 16:9]       │ │
│ │                          │ │
│ └──────────────────────────┘ │
│ POLITIK                      │
│ Judul Artikel yang Panjang   │
└──────────────────────────────┘
```

**Feed Card Horizontal — SEBELUM:**
```
┌────────────────────────────────────────┐
│ ┌─────────┐  POLITIK                   │
│ │ [THUMB] │  Judul Artikel             │
│ │  144px  │  Excerpt satu baris...     │
│ └─────────┘  Author · 2 jam lalu       │
└────────────────────────────────────────┘
```

**Feed Card Horizontal — SESUDAH:**
```
┌────────────────────────────────────────┐
│ ┌────────────┐  POLITIK                │
│ │            │  Judul Artikel          │
│ │  [THUMB]   │  yang Lebih Panjang     │
│ │   176px    │                         │
│ └────────────┘                         │
└────────────────────────────────────────┘
```

### 4.8 Dampak ke Layout Homepage

```
SEBELUM (per card):
  ┌─────────────────────────┐
  │ [IMAGE 16:9]            │  ← 56% tinggi card
  │ Category                │
  │ Title (2 baris)         │  ← 44% tinggi card
  │ Excerpt (2 baris)       │
  │ Author · Date           │
  └─────────────────────────┘
  Total tinggi: ~280px

SESUDAH (per card):
  ┌─────────────────────────┐
  │ [IMAGE 16:9]            │  ← 70% tinggi card
  │ Category                │
  │ Title (1 baris)         │  ← 30% tinggi card
  └─────────────────────────┘
  Total tinggi: ~240px
```

**Efek:** Card lebih pendek → lebih banyak card terlihat di atas fold → lebih banyak konten per viewport.

### 4.9 Testing Checklist

- [ ] Feed cards — judul 1 baris terbaca jelas
- [ ] Feed cards — category badge terlihat
- [ ] Feed cards — gambar proporsional dan tidak ter-crop aneh
- [ ] Hero section — tetap tampil lengkap (judul + excerpt + author)
- [ ] Pilihan Editor — tetap tampil lengkap (judul + author overlay)
- [ ] Trending — tetap tampil nomor + judul + views
- [ ] Sidebar — nomor + judul tanpa author/date
- [ ] Mobile (375px) — card tidak terlalu kecil
- [ ] Dark mode — semua elemen terlihat jelas
- [ ] Accessibility — alt text gambar tetap lengkap
- [ ] SEO — structured data tetap valid (judul tetap ada)

---

## 5. FASE 3 — Evaluasi & Tunda

### 4.1 Container 1400px — TUNDA

**Alasan ditunda:**
- Monitor 1440px masih sangat dominan di Indonesia
- 1400px di viewport 1440px = hanya 20px padding di setiap sisi → terlalu mepet
- Bisa dievaluasi lagi setelah data analytics menunjukkan mayoritas user pakai monitor 1920px+

**Kapan bisa diterapkan:**
- Jika analytics menunjukkan >60% traffic dari monitor 1920px+
- Atau jika `<Container size="wide">` sudah cukup untuk hero/grids dan default tetap 1280px

### 4.2 Content Width 760px — TOLAK

**Alasan ditolak:**
- 680px menghasilkan ~65 karakter/baris = sweet spot untuk readability
- Medium (gold standard) pakai 680px, NYT ~640px, Reuters ~680px
- 760px = ~70-75 karakter/baris → mata lebih capek untuk long-form reading
- Dokumen `design-system.md` sendiri merekomendasikan 680px

### 4.3 Large Gap 56px — TOLAK

**Alasan ditolak:**
- Codebase sudah punya sistem 3-tier: 24px (regular) / 48px (wide) / 80px (wider)
- Menambah 56px menciptakan tier ke-4 yang membingungkan
- Jika butuh sesuatu antara 48–80px, lebih baik pakai **64px** (4rem) — tapi sebenarnya tidak perlu

---

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Layout pecah di viewport tertentu | Sedang | Testing di 1280, 1440, 1920, 2560px |
| Card spacing tidak konsisten | Rendah | Hanya ubah section-level, card-level tetap |
| Dashboard layout terpengaruh | Sedang | Dashboard pakai komponen terpisah, perlu dicek |
| Bleed mode tidak berfungsi | Rendah | `clamp()` kompatibel dengan negative margin |
| Dark mode tidak konsisten | Rendah | Token warna tidak berubah, hanya spacing |
| NewsCard tanpa excerpt → user bingung | Sedang | Judul harus deskriptif, category badge membantu konteks |
| Card terlalu kecil di mobile | Rendah | Gambar tetap `aspect-[16/9]`, judul tetap terbaca |
| SEO turun tanpa excerpt di card | Rendah | Structured data tetap lengkap, excerpt ada di halaman artikel |
| Aksesibilitas berkurang | Rendah | Alt text gambar tetap lengkap, judul tetap ada |

---

## 7. Rollback Plan

**Sebelum memulai Fase 1:**
```bash
git add -A && git commit -m "chore: snapshot before design token updates"
```

**Jika ada masalah:**
```bash
git revert HEAD
```

**Perubahan di Fase 1 hanya 5 file** → mudah di-reverse secara manual jika perlu.

---

## 8. Checklist Eksekusi

### Fase 1 ✅ SELESAI (commit `a7c098a`)
- [x] Commit snapshot (`0d43404`)
- [x] `globals.css` → `--container-max-width: 80rem` (1280px)
- [x] `MagazineCoverHero.tsx` → hero 560px
- [x] `FeedSection.tsx` → `py-4 md:py-8` (section padding 32px desktop)
- [x] `TrendingSection.tsx` → `pb-4 md:pb-8` (section padding 32px desktop)
- [x] `EditorialExtras.tsx` → `py-8` (section padding 32px desktop)
- [ ] Testing: homepage di viewport 375px — mobile tidak berubah
- [ ] Testing: homepage di viewport 1280px — konten lega, section spacing terasa
- [ ] Testing: homepage di viewport 1440px — konten tidak mepet
- [ ] Testing: homepage di viewport 1920px — konten terpusat
- [ ] Testing: article page di viewport 1440px — sidebar tidak terpotong
- [ ] Testing: dashboard di viewport 1440px — layout tidak pecah

### Fase 2
- [ ] `globals.css` → `clamp()` padding
- [ ] `Container.tsx` → update padding classes
- [ ] `page.tsx` (artikel) → sidebar 340px
- [ ] `NewsCard.tsx` → radius review
- [ ] Testing di 4 viewport
- [ ] Commit Fase 2

### Fase 2B — NewsCard Visual-Forward
- [ ] `NewsCard.tsx` → hapus excerpt, author, date dari variant `large`, `medium`, `horizontal`
- [ ] `NewsCard.tsx` → perbesar proporsi gambar `medium` dan `horizontal`
- [ ] `FeedSection.tsx` → sesuaikan grid gap dan proporsi card
- [ ] `StickySidebar.tsx` → hapus author + date dari sidebar items
- [ ] `page.tsx` (artikel) → hapus excerpt + author dari recommended articles
- [ ] Testing: feed cards, hero, pilihan editor, trending, sidebar, mobile, dark mode
- [ ] Commit Fase 2B

### Fase 3
- [ ] Review analytics untuk monitor distribution
- [ ] Evaluasi apakah 1400px perlu diterapkan
- [ ] Decision: terapkan atau batalkan

---

## 9. Referensi

- `docs/design-system.md` — token lengkap dan analisis tipografi
- `docs/design-grid.md` — 6 design blueprint dan config mapping
- `apps/web/app/globals.css` — CSS variables
- `apps/web/components/layout/Container.tsx` — container component
- `apps/web/components/ui/NewsCard.tsx` — card variants
- `apps/web/components/pages/home/SiteHomePage.tsx` — homepage layout
- `apps/web/components/pages/home/FeedSection.tsx` — feed layout dan grid
- `apps/web/components/pages/home/trending/StickySidebar.tsx` — sidebar widgets
- `apps/web/components/berita/MagazineBentoHero.tsx` — hero component

---

*Dokumen ini bisa diupdate seiring progress implementasi.*
