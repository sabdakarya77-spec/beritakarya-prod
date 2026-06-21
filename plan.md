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
