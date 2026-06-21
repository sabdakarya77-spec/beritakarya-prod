## Mapping File Sistem Iklan (Ads)

> Referensi untuk pembahasan periklanan BeritaKarya.

### Komponen Frontend (Tampilan Iklan)

| File | Keterangan |
|---|---|
| `apps/web/components/ui/AdSpace.tsx` | Komponen utama untuk render slot iklan (leaderboard, in-feed, rectangle) |
| `apps/web/components/ui/BillboardShowcase.tsx` | Komponen showcase iklan billboard |

### Dashboard Manajemen Iklan

| File | Keterangan |
|---|---|
| `apps/web/app/[site]/dashboard/ads/page.tsx` | Halaman utama dashboard iklan |
| `apps/web/app/[site]/dashboard/ads/order/page.tsx` | Halaman pemesanan/booking iklan |
| `apps/web/components/dashboard/ads/AdSlotCard.tsx` | Card detail informasi slot iklan |
| `apps/web/components/dashboard/ads/SuperadminAdsView.tsx` | View manajemen iklan untuk superadmin |
| `apps/web/components/dashboard/ads/AdvertiserAdsView.tsx` | View manajemen iklan untuk advertiser |
| `apps/web/components/dashboard/ads/LeaderboardManager.tsx` | Komponen manager leaderboard ads |
| `apps/web/components/dashboard/ads/LeaderboardBannerRow.tsx` | Baris banner pada leaderboard |
| `apps/web/components/dashboard/ads/types.ts` | TypeScript types/interface untuk modul ads |
| `apps/web/components/dashboard/AdvertiserDashboardOverview.tsx` | Overview dashboard role advertiser |

### Backend API

| File | Keterangan |
|---|---|
| `apps/api/src/modules/ad/ad.controller.ts` | Controller endpoint CRUD iklan |
| `apps/api/src/modules/ad/ad.service.ts` | Business logic dan validasi iklan |
| `apps/api/src/modules/ad/ad.repository.ts` | Query database untuk iklan |
| `apps/api/src/cron/ad-expiry.ts` | Cron job auto-expire iklan yang sudah habis masa tayang |

### Penggunaan di Halaman

| File | Keterangan |
|---|---|
| `apps/web/components/pages/SiteHomePage.tsx` | Menggunakan `<AdSpace>` di leaderboard (atas) & in-feed (tengah) |
| `apps/web/app/[site]/artikel/[slug]/page.tsx` | Slot iklan di halaman detail artikel |
| `apps/web/components/marketing/AdsMarketingPage.tsx` | Halaman marketing layanan iklan BeritaKarya |

### Testing

| File | Keterangan |
|---|---|
| `apps/web/tests/e2e/ad-booking.spec.ts` | E2E test alur booking iklan |

### Konfigurasi & Types

| File | Keterangan |
|---|---|
| `apps/web/lib/constants.ts` | Konstanta terkait tipe/slot iklan |
| `apps/web/lib/siteSettings.ts` | Pengaturan site termasuk konfigurasi slot iklan |
| `packages/types/src/user.ts` | User types (role advertiser) |
| `packages/config/src/roles.ts` | Role permissions (akses advertiser) |
| `packages/config/src/site.ts` | Konfigurasi site termasuk pengaturan ads |

---

## Rencana Infrastruktur & Tool Slot Iklan

> Tidak semua pengiklan bisa menyesuaikan dengan ukuran slot iklan yang ada. Banyak yang punya banner dari platform lain (Google Ads, Meta) dengan ukuran IAB standar berbeda, atau agency/UMKM yang kirim banner dengan rasio aspek asal-asalan. Sistem perlu adaptif.

### Masalah

- Slot saat ini mengasumsikan ukuran pasti: `leaderboard` 970×250, `rectangle` 300×250, `in_feed` 300×250
- Fitur crop yang ada di dashboard bisa merusak materi (teks/logo terpotong)
- Tidak ada mekanisme untuk menangani banner dengan rasio aspek yang tidak cocok

### Slot Sizes Saat Ini

| Slot ID | Ukuran Desktop | Ukuran Mobile |
|---------|---------------|---------------|
| `leaderboard` | 970 × 250 px | 320 × 100 px |
| `rectangle` | 300 × 250 px | 300 × 250 px |
| `rectangle_secondary` | 300 × 250 px | 300 × 250 px |
| `in_feed` | 300 × 250 px | 300 × 250 px |

### Rencana Fitur (Prioritas)

| # | Fitur | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| 1 | Smart Resize + Letterbox Server-Side | Sedang | Tinggi | 🔲 Belum |
| 2 | Template Download per Slot (PSD/Figma) | Kecil | Sedang | 🔲 Belum |
| 3 | Preview Sesuai Tampilan Aktual di Dashboard | Sedang | Sedang | 🔲 Belum |
| 4 | Multi-Size IAB per Slot | Besar | Tinggi | 🔲 Belum |

### Detail Fitur

#### 1. Smart Resize + Letterbox Server-Side (Prioritas Utama)

Saat upload banner, server otomatis detect dimensi asli dan proses:

- **Rasio aspek tidak cocok** → letterbox (tambah padding dengan warna dominan atau blur background), bukan crop
- **Terlalu kecil** → reject dengan pesan jelas: "Minimum 600×200 untuk slot leaderboard"
- **Terlalu besar** → auto-compress ke WebP + resize proporsional
- **Sudah cocok** → langsung proses tanpa perubahan

**Mengapa letterbox, bukan crop?** Crop memotong materi kreatif (teks, logo, CTA). Letterbox mempertahankan 100% konten dengan menambahkan padding estetis di sisi yang kosong.

**File terkait:**
- `apps/api/src/modules/ad/` — tambah service resize server-side (sharp / jimp)
- `apps/web/components/ui/AdImageCropper.tsx` — ubah dari crop-only ke smart resize

#### 2. Template Download per Slot

Sediakan file template (PSD/Figma/SVG) untuk setiap slot agar pengiklan punya referensi desain yang benar.

- Include: safe zone, bleed area, font minimum size
- Format: PSD (untuk agency), Figma link (untuk tim internal), SVG (untuk UMKM)
- Letakkan di halaman upload dan halaman marketing iklan

**File terkait:**
- `apps/web/public/templates/` — taruh file template
- `apps/web/components/dashboard/ads/AdSlotCard.tsx` — tambah tombol download template
- `apps/web/components/marketing/AdsMarketingPage.tsx` — tambah section template

#### 3. Preview Sesuai Tampilan Aktual

Dashboard saat ini menampilkan preview mentah banner. Perlu preview yang persis seperti yang dilihat visitor:

- Tampilkan banner di dalam mockup slot (dengan border, shadow, label "Iklan")
- Jika ada letterbox/padding, tampilkan juga di preview
- Tambah toggle "Desktop" vs "Mobile" untuk melihat responsivitas

**File terkait:**
- `apps/web/components/dashboard/ads/AdSlotCard.tsx` — upgrade preview area
- `apps/web/components/dashboard/ads/LeaderboardBannerRow.tsx` — upgrade preview

#### 4. Multi-Size IAB per Slot (Fitur Lanjutan)

Satu slot bisa menerima beberapa ukuran standar IAB, browser paling cocok berdasarkan viewport:

| Slot | Ukuran yang Diterima |
|------|---------------------|
| `leaderboard` | 970×250, 728×90, 320×50 (mobile) |
| `rectangle` | 300×250, 336×280 |
| `in_feed` | 300×250, 336×280 |

Ini standar industri (Google AdSense melakukan ini). Implementasi butuh perubahan di:

- `apps/web/components/ui/AdSpace.tsx` — render responsive berdasarkan viewport
- Database `Advertisement` model — tambah field `width`, `height`, `breakpoint`
- Dashboard — upload multiple sizes per slot

### Yang TIDAK Akan Dibangun

| Alasan | Penjelasan |
|--------|-----------|
| Dynamic slot sizing | Terlalu kompleks, bisa merusak layout halaman |
| Accept semua ukuran tanpa proses | Hasil jelek, pengiklan kecewa |
| Client-side resize | Tidak konsisten, kualitas kalah dari server-side |

---

## Analisis Bisnis: Harga Slot Iklan

> Urutan harga slot berdasarkan nilai bisnis (visibilitas, exposure, engagement).

### Ranking Harga Slot

| Peringkat | Slot | Alasan |
|-----------|------|--------|
| 🥇 1 | **Leaderboard** (970×250) | Above the fold, ukuran paling besar, impresi pertama visitor, hanya 1 slot (scarcity), bisa carousel multi-banner. CPM 2-3× lipat dari slot lain. |
| 🥈 2 | **In-Feed** (300×250) | Native placement di tengah konten, attention rate tinggi, tampil di homepage + artikel, tidak bisa di-skip (bukan sidebar), CTR tertinggi. |
| 🥉 3 | **Rectangle** (300×250) | Sidebar placement standar, tampil di homepage + artikel, ad blindness lebih tinggi karena posisi pinggir. |
| 4 | **Rectangle Secondary** (300×250) | Hanya di sidebar artikel, posisi kedua di sidebar, cocok untuk bundling atau UMKM. |

### Strategi Pricing

| Slot | Model | Strategi |
|------|-------|----------|
| Leaderboard | **Premium** | Jual per minggu, carousel 3-5 banner, harga tertinggi |
| In-Feed | **Premium** | Jual per minggu, 1 advertiser eksklusif per slot |
| Rectangle | **Standard** | Jual per bulan, bisa bundling dengan rectangle_secondary |
| Rectangle Secondary | **Economy** | Bundling dengan rectangle, atau jual murah untuk UMKM |

### Insight Kunci

- **Leaderboard** dan **In-Feed** adalah revenue driver utama — fokus penjualan ke brand besar dan agency
- **Rectangle** dan **Rectangle Secondary** lebih ke fill rate — mengisi slot agar tidak kosong, sambil tetap menghasilkan
- In-Feed punya CTR tertinggi karena terasa seperti bagian dari konten (native ads)
- Leaderboard cocok dijual sebagai slot eksklusif atau carousel (beberapa pengiklan bergantian)
- Rectangle Secondary ideal dijual sebagai addon bundling, bukan slot utama

---

## Optimasi Leaderboard Mobile

> Masalah: Leaderboard adalah slot termahal, tapi di mobile ukurannya mengecil drastis (970×250 → 320×100) sementara slot lain tetap 300×250. Satu harga, tampil di semua device — jadi solusinya bukan pisahkan pricing, tapi buat leaderboard tetap impactful di mobile.

### Perbandingan Ukuran

| Slot | Desktop | Mobile | Perubahan |
|------|---------|--------|-----------|
| Leaderboard | 970×250 (242.500 px²) | 320×100 (32.000 px²) | **Turun 87%** ⚠️ |
| In-Feed | 300×250 (75.000 px²) | 300×250 (75.000 px²) | Tetap |
| Rectangle | 300×250 (75.000 px²) | 300×250 (75.000 px²) | Tetap |

### Prinsip

- Satu banner upload, satu harga, tampil di desktop dan mobile
- Tidak minta pengiklan upload versi terpisah
- Tidak pisahkan pricing desktop vs mobile
- Sistem yang adaptif membuat leaderboard tetap besar dan lama di mobile

### Rencana Solusi

| # | Solusi | Effort | Impact | Status |
|---|--------|--------|--------|--------|
| 1 | Sticky Leaderboard Mobile | Kecil | Tinggi | 🔲 Belum |
| 2 | Full-Width Auto-Adapt | Sedang | Sedang | 🔲 Belum |

### Detail Solusi

#### 1. Sticky Leaderboard Mobile (Prioritas)

Leaderboard menempel di atas layar saat visitor scroll di mobile.

- Visitor scroll ke bawah → leaderboard tetap terlihat di posisi atas
- Durasi exposure naik drastis (dari 2-3 detik → 30+ detik)
- Tambah tombol close (×) setelah 5 detik agar tidak mengganggu UX
- Tidak mengubah ukuran, tapi meningkatkan waktu tampil secara signifikan
- **Ini cara paling efektif meningkatkan value tanpa mengubah slot definition**

**File terkait:**
- `apps/web/components/ui/AdSpace.tsx` — tambah sticky behavior untuk leaderboard di mobile
- CSS: tambah class sticky + z-index yang tepat agar tidak menutupi navigasi

#### 2. Full-Width Auto-Adapt

Banner 970×250 otomatis di-scale full-width di mobile dengan layout yang lebih baik.

- Lebar penuh layar (bukan max 320px)
- Tinggi dinaikkan dari 100px → 140-160px
- Gambar di-scale proporsional, tambah letterbox/padding jika rasio aspek tidak cocok
- Background blur/gradient di sisi agar gambar tetap terlihat bagus
- **Area visual naik ~60% tanpa minta pengiklan upload terpisah**

**File terkait:**
- `apps/web/components/ui/AdSpace.tsx` — ubah layout mobile leaderboard
- `apps/web/lib/constants.ts` — update size description untuk mobile

#### 3. Image-to-Video Animation (Fitur Tambahan)

Konversi gambar statis yang di-upload pengiklan menjadi video dengan efek animasi otomatis.

**Masalah:**
- Pengiklan UMKM/kecil biasanya hanya punya gambar (PNG/JPG), tidak punya video
- Tapi slot leaderboard butuh visual impact yang lebih dari gambar statis
- Tanpa fitur ini, gambar statis di slot premium terlihat kurang profesional

**Cara kerja:**
1. Pengiklan upload gambar statis (PNG/JPG) seperti biasa
2. Pengiklan pilih efek animasi yang diinginkan
3. Server convert gambar ke video (MP4/WebP animasi) dengan efek terpilih
4. Hasilnya tampil sebagai video di slot leaderboard

**Pilihan efek animasi:**

| Efek | Deskripsi |
|------|-----------|
| Ken Burns | Gambar perlahan zoom-in/zoom-out |
| Fade Slide | Gambar geser perlahan ke kiri/kanan |
| Parallax | Layer bergerak dengan kecepatan berbeda |
| Pulse/Scale | Gambar perlahan membesar-mengecil |

**Teknologi:** CSS/Web Animations API di frontend (bukan FFmpeg di server). Keuntungan:
- 0 beban server, tidak perlu render video
- Instan, tidak perlu tunggu processing
- File tetap WebP kecil, bukan MP4 berat
- Scalable — 100 pengiklan upload bersamaan tetap aman

**Cara implementasi:**
- Pengiklan pilih efek saat upload → simpan pilihan di database (field `animationEffect`)
- Di `AdSpace.tsx`, tambah class CSS sesuai efek pada tag `<img>`
- Contoh Ken Burns: `transform: scale(1.0) → scale(1.1)` dalam 7 detik dengan CSS `@keyframes`

**File terkait:**
- `apps/web/components/ui/AdSpace.tsx` — tambah CSS animation classes
- `apps/web/lib/constants.ts` — tambah definisi efek animasi
- `apps/web/components/dashboard/ads/AdSlotCard.tsx` — tambah pilihan efek animasi saat upload gambar
- `apps/web/components/dashboard/ads/LeaderboardBannerRow.tsx` — tambah preview efek animasi
- `apps/api/prisma/schema.prisma` — tambah field `animationEffect` di model Advertisement

---

## Catatan dari Review Dokumen

> Hasil review mendalam terhadap plan.md, mencakup sisi teknis dan bisnis.

### Insight Teknis yang Perlu Diperhatikan

#### 1. CLS (Cumulative Layout Shift) Protection

Iklan yang dimuat secara dinamis sering menyebabkan layout "melompat" yang merusak Core Web Vitals → SEO terdampak.

**Solusi:**
- Selalu set `min-height` pada container `<AdSpace>` sebelum gambar selesai dimuat
- Mobile leaderboard: `min-h-[100px]`
- Desktop leaderboard: `min-h-[250px]`
- Rectangle/in-feed: `min-h-[250px]`

**File terkait:**
- `apps/web/components/ui/AdSpace.tsx` — tambah min-height pada semua slot

#### 2. Sticky Position & UX

- Gunakan `position: fixed; bottom: 0;` (di bawah layar) atau `position: sticky; top: 0;` (di atas layar)
- Pastikan z-index tidak menutupi navigasi mobile (burger menu/header)
- Tombol close (×) harus simpan flag di `sessionStorage` agar iklan tidak muncul lagi di halaman berikutnya selama sesi yang sama

#### 3. Smart Resize: `sharp` Library

Gunakan `sharp` (berbasis C++ libvips), bukan `jimp` (pure JavaScript):
- 4-5× lebih cepat
- Penggunaan memory jauh lebih kecil
- Krusial untuk handle banyak upload bersamaan

**Teknik letterbox premium:**
1. Resize gambar asli dengan `fit: 'cover'` → blur tinggi (Gaussian blur) → jadi background
2. Resize gambar asli dengan `fit: 'contain'` → timpa di atas background
3. Output: WebP quality 80

#### 4. Multi-Size IAB: Skema Database

Jika mendukung multi-size, gunakan skema JSON di database:
```typescript
creatives: {
  desktop: { url: string, width: number, height: number },
  tablet?: { url: string, width: number, height: number },
  mobile: { url: string, width: number, height: number }
}
```
Gunakan `<picture>` HTML5 atau `srcSet` di Next.js Image untuk load asset sesuai viewport.

### Insight Bisnis yang Perlu Diperhatikan

#### 1. Carousel Pricing Strategy

Jangan jual slot leaderboard ke 1 brand eksklusif dengan harga tinggi (susah laku). Lebih baik:
- Jual ke 5 brand dengan sistem carousel, masing-masing harga lebih rendah
- Contoh: Rp 1.000.000 × 1 brand → Rp 300.000 × 5 brand = Rp 1.500.000 (naik 50%)
- Barrier to entry lebih rendah, total revenue lebih tinggi

#### 2. In-Feed = Native Ads

Slot in-Feed sangat cocok untuk model Native / Soft Selling:
- Jual eksklusif (tidak carousel) agar pembaca tidak terganggu
- Posisi di tengah konten = engagement tertinggi

#### 3. Bundle UMKM untuk Rectangle

Rectangle + Rectangle Secondary cocok untuk paket "UMKM Go Digital":
- Harga terjangkau
- Include slot rectangle + artikel advertorial
- Volume tinggi, margin kecil

#### 4. Coalition for Better Ads Compliance

Iklan sticky di mobile tidak boleh menutupi > 30% area layar:
- Ukuran 320×100 atau 320×50 (dengan tombol close) sudah memenuhi standar aman
- Jika dilanggar, Google Chrome bisa menurunkan peringkat situs

---

## Rencana Fitur Tambahan (Dari Review)

### Analytics Dashboard untuk Pengiklan (Prioritas Tinggi)

Pengiklan perlu melihat performa iklannya untuk memutuskan apakah akan memperpanjang. Tanpa ini, retensi rendah.

**Fitur yang dibutuhkan:**
- Real-time impression dan click tracking di dashboard advertiser
- Grafik performa per hari/minggu/bulan
- Hitung CTR (click-through rate) otomatis
- Export laporan (PDF/CSV) untuk pengiklan
- Perbandingan performa antar slot

**File terkait:**
- `apps/web/components/dashboard/ads/AdvertiserAdsView.tsx` — tambah tab analytics
- `apps/api/src/modules/ad/ad.controller.ts` — tambah endpoint analytics
- `apps/api/src/modules/ad/ad.service.ts` — tambah logic aggregasi data

### Rate Limiting Upload (Prioritas Sedang)

Proteksi server dari abuse upload banner.

**Batasan:**
- Max 10 upload per user per hari
- Max 5MB per file (sudah ada di rencana Smart Resize)
- Queue system jika processing berat (untuk mencegah server overload)

**File terkait:**
- `apps/api/src/modules/ad/ad.controller.ts` — tambah rate limit middleware
- `apps/api/src/middleware/` — tambah upload rate limiter

### A/B Testing Banner (Fitur Lanjutan)

Pengiklan upload 2 versi banner, sistem split test otomatis.

**Cara kerja:**
1. Pengiklan upload 2 versi banner (A dan B)
2. Sistem split test 50:50 ke visitor
3. Setelah periode tertentu (misal 1 minggu), pemenang (CTR lebih tinggi) otomatis dipilih
- Ini selling point premium yang membedakan dari platform iklan sederhana

**File terkait:**
- `apps/api/prisma/schema.prisma` — tambah field `variantA`, `variantB`, `winnerVariant`
- `apps/web/components/ui/AdSpace.tsx` — tambah logic split test
- `apps/web/components/dashboard/ads/AdSlotCard.tsx` — tambah UI upload 2 versi

---

## Revisi Roadmap (Update dari Review)

| Fase | Isi | Effort | Impact |
|------|-----|--------|--------|
| **Fase 1** | Sticky mobile leaderboard + CSS animation + CLS fix + tombol close | Rendah | Sangat Tinggi |
| **Fase 2** | `sharp` resize + letterbox + template download + basic analytics dashboard | Sedang | Tinggi |
| **Fase 3** | Multi-size IAB + A/B testing (opsional) | Tinggi | Sedang-Tinggi |
