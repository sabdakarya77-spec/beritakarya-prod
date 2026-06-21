# Homepage Improvement Plan

> Analisis dan rencana perbaikan homepage BeritaKarya berdasarkan review per section.
> Target: lebih modern, profesional, dan konsisten dengan standar media digital.

---

## Ringkasan Prioritas

| # | Perbaikan | Impact | Effort | Status |
|---|---|---|---|---|
| 1 | Hapus duplikasi TRENDING ↔ Paling Populer | 🔴 Tinggi | Rendah | ⏳ Pending |
| 2 | Ganti `<img>` → `<SmartImage>` di Pilihan Editor & Video | 🔴 Tinggi | Rendah | ⏳ Pending |
| 3 | Pindahkan ad leaderboard dari atas | 🟡 Sedang | Rendah | ⏳ Pending |
| 4 | Ganti label "Berita Lanjutan" → "Berita Lainnya" | 🟡 Sedang | Rendah | ⏳ Pending |
| 5 | Tambah excerpt di card horizontal feed | 🟡 Sedang | Sedang | ⏳ Pending |
| 6 | Ganti emoji ▶ → Lucide Play icon di Video Eksklusif | 🟢 Rendah | Rendah | ⏳ Pending |

---

## Detail Per Section

### 1. AD LEADERBOARD (atas)

**Sekarang:** Iklan di paling atas, sebelum hero section.

**Masalah:** Pengunjung langsung disambut iklan, bukan konten. Mengurangi kesan profesional. Media besar (Kompas, CNN Indonesia) tidak menempatkan iklan di posisi pertama.

**Solusi:** Pindahkan iklan ke bawah hero section atau hapus dari atas.

**File:** `apps/web/components/pages/SiteHomePage.tsx` (baris 386-391)

```tsx
// SEBELUM — iklan di atas hero
<Container className="py-4 md:py-5">
  <AdSpace type="leaderboard" />
</Container>
{showHomepageHero && (...)}

// SESUDAH — iklan di bawah hero
{showHomepageHero && (...)}
<Container className="py-4 md:py-5">
  <AdSpace type="leaderboard" />
</Container>
```

---

### 2. ZONA 1 — HERO (MagazineBentoHero)

**Sekarang:** 4 artikel terbaru, slider otomatis 5 detik.

**Masalah:**
- Headline terlalu panjang (100+ karakter) — sulit dibaca
- 3 dari 4 hero sama kategori ("Peristiwa") — kurang variasi
- Slider otomatis mengganggu user yang sedang membaca

**Solusi:**
- Batasi tampilan headline max 2 baris (`line-clamp-2`) di komponen MagazineBentoHero
- Tambahkan `pauseOnHover` pada slider
- Pertimbangkan filter kategori agar hero lebih bervariasi

**File:** `apps/web/components/berita/MagazineBentoHero.tsx`

---

### 3. ZONA 2 — FOKUS REDAKSI

**Sekarang:** 1 card besar (`large`) + 3 card horizontal stacked.

**Masalah:**
- Sering cuma 1 artikel terlihat karena data kurang dari 4
- Card horizontal di kanan terlalu kecil dibanding card besar di kiri
- Tidak ada excerpt pada card besar

**Solusi:**
- Kondisi `showFokusRedaksi` sudah ada (`fokusRedaksi.length > 0`) — pastikan minimal 2 artikel baru tampilkan
- Tambahkan excerpt pada card `large` variant

**File:** `apps/web/components/pages/SiteHomePage.tsx` (baris 412-451)

```tsx
// Saran: ubah threshold dari > 0 ke >= 2
const showFokusRedaksi = isHomepage && fokusRedaksi.length >= 2
```

---

### 4. ZONA 3 — TRENDING

**Sekarang:** 5 artikel populer berdasarkan views (sudah diperbaiki).

**Masalah:** Data trending bisa overlap dengan sidebar "Paling Populer" karena sumber data mirip.

**Solusi:**
- TRENDING: `sort=views&order=desc` (sudah diterapkan)
- Sidebar "Paling Populer": ganti sumber data jadi artikel terbaru non-hero (bukan by views)
- Dengan begitu tidak ada duplikasi

**File:** `apps/web/components/pages/SiteHomePage.tsx`
- `getTrendingArticles()` — sudah by views ✅
- `distributeArticles()` → `popular` — ganti dari `.slice(0, 5)` ke artikel terbaru yang tidak ada di hero/fokus/trending

---

### 5. ZONA 4 — BERITA TERBARU + SIDEBAR

#### 5a. Feed Utama

**Masalah:**
- Label "Berita Lanjutan" kurang profesional — terkesan "sisa"
- Ad placement di tengah feed mengganggu alur baca
- Card horizontal tidak ada excerpt

**Solusi:**

```tsx
// Ganti label
// SEBELUM:
<span className="...">Berita Lanjutan</span>

// SESUDAH:
<span className="...">Berita Lainnya</span>
```

- Pindahkan `<AdSpace>` ke bawah grid, bukan di antara featured dan stream
- Tambahkan 1 baris excerpt pada card horizontal (di komponen NewsCard, variant horizontal)

**File:**
- `apps/web/components/pages/SiteHomePage.tsx` (baris 565-591)
- `apps/web/components/ui/NewsCard.tsx` (variant horizontal, baris 203-252)

#### 5b. Sidebar — Paling Populer

**Masalah:** Duplikasi dengan TRENDING section.

**Solusi:** Ganti nama dan sumber data:

```tsx
// SEBELUM — by views (sama dengan trending)
const popular = articles.filter(a => !heroIds.has(a.id)).slice(0, 5)

// SESUDAH — terbaru non-hero (berbeda dari trending)
const latestNonHero = articles.filter(a => !heroIds.has(a.id)).slice(0, 5)
```

Ganti label sidebar:
```tsx
// SEBELUM:
<Star size={15} className="fill-brand-red text-brand-red" />
<h4>Paling Populer</h4>

// SESUDAH:
<Clock size={15} className="text-brand-red" />
<h4>Terbaru</h4>
```

---

### 6. ZONA 5+ — EDITORIAL EXTRAS

#### 6a. Pilihan Editor

**Masalah:** Pakai `<img>` biasa, bukan `<SmartImage>`. Tidak ada blur placeholder, tidak ada optimasi gambar.

**Solusi:** Ganti ke `<SmartImage>`:

```tsx
// SEBELUM:
<img
  src={article.featuredImage}
  alt={article.title}
  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
/>

// SESUDAH:
<SmartImage
  src={article.featuredImage}
  context="editor_choice"
  alt={article.title}
  fill
  className="object-cover transition-transform duration-700 group-hover:scale-105"
/>
```

**File:** `apps/web/components/pages/SiteHomePage.tsx` (baris 798-831)

#### 6b. Foto Jurnalistik

**Masalah:** Pakai `<img>` biasa.

**Solusi:** Ganti ke `<SmartImage>` (sama seperti Pilihan Editor).

**File:** `apps/web/components/pages/SiteHomePage.tsx` (baris 885-916)

#### 6c. Video Eksklusif

**Masalah:**
- Pakai `<img>` biasa
- Play button pakai emoji `▶` — kurang profesional

**Solusi:**
- Ganti `<img>` ke `<SmartImage>`
- Ganti emoji ke Lucide `Play` icon

```tsx
// SEBELUM:
<span className="ml-0.5 text-md text-white">▶</span>

// SESUDAH:
import { Play } from 'lucide-react'
<Play size={20} className="ml-0.5 text-white fill-white" />
```

**File:** `apps/web/components/pages/SiteHomePage.tsx` (baris 920-964)

---

## File yang Perlu Diubah

| File | Perubahan |
|---|---|
| `apps/web/components/pages/SiteHomePage.tsx` | Pindahkan ad, ganti label, hapus duplikasi, ganti img → SmartImage, ganti emoji |
| `apps/web/components/berita/MagazineBentoHero.tsx` | Tambah line-clamp pada headline, pauseOnHover |
| `apps/web/components/ui/NewsCard.tsx` | Tambah excerpt pada variant horizontal |

---

## Catatan Tambahan

- **Konsistensi badge:** Saat ini ada 3 badge berbeda (BREAKING, EKSKLUSIF, PILIHAN). Pertimbangkan standarisasi.
- **Geografi konten:** Mayoritas konten Jawa Timur. Tidak masalah untuk sekarang, tapi perlu diingat untuk branding "Nusantara".
- **Footer:** Alamat "Jl. Merdeka No. 123" kemungkinan placeholder — perlu diganti.
- **Social media:** Footer belum ada link Instagram, Twitter/X, YouTube.
