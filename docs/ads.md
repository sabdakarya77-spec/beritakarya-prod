# Dokumentasi Sistem Iklan (Ads) — BeritaKarya

Dokumen tunggal yang merangkum seluruh sistem periklanan BeritaKarya: arsitektur, slot iklan, ukuran, API, komponen frontend, image processing, alur pengiklan, dan status perbaikan.

---

## 1. Ringkasan Sistem

| Komponen | Keterangan |
|----------|------------|
| **AdSpace** (frontend) | Komponen React yang fetch iklan publik, render banner gambar/video/script HTML, carousel (video 12 detik, banner 7 detik), random order, fade transition, tracking impresi & klik |
| **Ad Studio** (frontend) | Wizard 4 langkah: Pilih Paket → Detail Iklan → **Upload 1 File** (auto-generate semua variant) → Pembayaran. **Khusus HOME_TOP**: advertiser upload logo + foto, tim kreatif produksi video |
| **Smart Image Processor** (backend) | Proses gambar upload ke semua ukuran slot dengan palette gradient background, **parallel processing** |
| **Video Validator** (backend) | Validasi video ads: format, ukuran max 50MB, resolusi, auto-generate thumbnail |
| **Ad Preview** (frontend + backend) | Preview real-time hasil proses + **cross-slot preview** ("juga cocok untuk slot lain") |
| **Auto-Variant Generator** (backend) | Saat booking di-approve, auto-generate semua variant dari 1 imageUrl |
| **Payment Gateway** | Midtrans Snap (VA, e-wallet, QRIS, kartu kredit) + manual transfer |
| **Admin Review** | Checklist 5 item + approve/reject dengan notifikasi email |
| **Analytics** | Time-series impresi/klik/CTR per booking, Recharts visualization |
| **Auto-Expiry** | Cron job hourly — nonaktifkan iklan setelah endDate lewat |

---

## 2. Slot Iklan — Ukuran & Penempatan

### 2.1 Daftar Slot

> **Konvensi Penamaan:** Slot dinamai berdasarkan **lokasi penempatan**, bukan ukuran. Tidak ada slot sidebar — semua iklan berada di dalam alur konten. Lihat [2.6 Strategi Slot Mobile](#26-strategi-slot-mobile--penamaan-berbasis-lokasi) untuk penjelasan lengkap.

| Slot ID | Nama Lokasi | Tier | Format | Penempatan | Rotasi |
|---------|-------------|------|--------|------------|--------|
| `HOME_TOP` | Hero Banner | Premium | 🎥 Video | Homepage atas (billboard utama) | ✅ Multi-iklan |
| `HOME_FEED_1` | Feed Atas | Tinggi | 🖼️ Banner | Homepage, setelah headline (posisi 6-8 berita) | ✅ Multi-iklan |
| `HOME_FEED_2` | Feed Bawah | Menengah | 🖼️ Banner | Homepage, setelah 12-15 berita | ✅ Multi-iklan |
| `ARTICLE_TOP` | Artikel Atas | Tinggi | 🖼️ Banner | Halaman artikel, setelah paragraf ke-3 | ✅ Multi-iklan |
| `ARTICLE_MIDDLE` | Artikel Tengah | Menengah | 🖼️ Banner | Halaman artikel, setelah paragraf ke-8 | ✅ Multi-iklan |
| `ARTICLE_BOTTOM` | Artikel Bawah | Ekonomi | 🖼️ Banner | Halaman artikel, sebelum artikel terkait | ✅ Multi-iklan |

> **Format menentukan render:** `VIDEO` → player video, `IMAGE` → tag `<img>`. Developer tidak perlu if-else berdasarkan slot name — cukup cek format.

> **Catatan Migrasi:** Slot lama (`leaderboard`, `rectangle`, `rectangle_secondary`, `in_feed`) perlu di-migrate ke nama lokasi baru di database dan API. Slot sidebar (`rectangle`, `rectangle_secondary`) **dihapus** dan digantikan oleh `HOME_FEED_1`, `HOME_FEED_2`, `ARTICLE_TOP`, dan `ARTICLE_BOTTOM`.

> **Arsitektur Ukuran:** Ukuran slot **tidak disimpan di database**. Database hanya menyimpan slot ID (misal: `HOME_TOP`). Ukuran diambil dari file konfigurasi: `apps/api/src/config/ad-slots.ts` (backend) dan `apps/web/lib/constants.ts` (frontend). Keuntungan: ubah ukuran tanpa migrasi DB, satu sumber kebenaran.

### 2.2 Ukuran Per Breakpoint

| Slot | Desktop | Tablet | Mobile | Rasio | Varian |
|------|---------|--------|--------|-------|--------|
| **HOME_TOP** | 880 × 220 px | 728 × 182 px | 320 × 80 px | 4:1 | Besar |
| **HOME_FEED_1** | 300 × 200 px | 300 × 200 px | 300 × 200 px | 3:2 | Sedang |
| **HOME_FEED_2** | 300 × 150 px | 300 × 150 px | 300 × 150 px | 2:1 | Kecil |
| **ARTICLE_TOP** | 300 × 200 px | 300 × 200 px | 300 × 200 px | 3:2 | Sedang |
| **ARTICLE_MIDDLE** | 300 × 150 px | 300 × 150 px | 300 × 150 px | 2:1 | Kecil |
| **ARTICLE_BOTTOM** | 300 × 150 px | 300 × 150 px | 300 × 150 px | 2:1 | Kecil |

> **3 Varian Ukuran:** Banner dipecah menjadi 3 varian (Besar/Sedang/Kecil) agar advertiser bisa membuat 1 desain untuk beberapa slot sekaligus. Slot dengan varian **Sedang** (HOME_FEED_1, ARTICLE_TOP) memiliki visibilitas lebih tinggi. Slot **Kecil** (HOME_FEED_2, ARTICLE_MIDDLE, ARTICLE_BOTTOM) lebih ringan dan konsisten.

### 2.3 Visibilitas Slot Per Device

Semua 6 slot tampil di **semua device** (desktop, tablet, mobile) — yang berbeda hanya **ukurannya**. Tidak ada slot sidebar; semua iklan berada di dalam alur konten.

**Homepage:**

| Slot | Desktop | Tablet | Mobile |
|------|:---:|:---:|:---:|
| HOME_TOP | ✅ | ✅ | ✅ |
| HOME_FEED_1 | ✅ | ✅ | ✅ |
| HOME_FEED_2 | ✅ | ✅ | ✅ |

→ **3 slot di semua device**

**Artikel:**

| Slot | Desktop | Tablet | Mobile |
|------|:---:|:---:|:---:|
| ARTICLE_TOP | ✅ | ✅ | ✅ |
| ARTICLE_MIDDLE | ✅ | ✅ | ✅ |
| ARTICLE_BOTTOM | ✅ | ✅ | ✅ |

→ **3 slot di semua device**

**Total keseluruhan:**

| Device | Homepage | Artikel | Total |
|--------|----------|---------|-------|
| **Desktop** | 3 | 3 | **6** |
| **Tablet** | 3 | 3 | **6** |
| **Mobile** | 3 | 3 | **6** |

> **Implikasi Paket**: Semua 6 slot tampil di semua device. Ukuran menyesuaikan device (lihat [2.2 Ukuran Per Breakpoint](#22-ukuran-per-breakpoint)). Ini menyederhanakan pricing — satu paket, semua device terjangkau.

### 2.4 Minimum Upload Size (Validasi Lunak — Warning, Bukan Error)

| Slot | Variant | Min Width | Min Height | Catatan |
|------|---------|-----------|------------|---------|
| HOME_TOP | Desktop | 300 px | 80 px | Sistem akan upscale + gradient jika kecil |
| HOME_TOP | Tablet | 250 px | 60 px | Sistem akan upscale + gradient jika kecil |
| HOME_TOP | Mobile | 200 px | 50 px | Sistem akan upscale + gradient jika kecil |
| HOME_FEED_1 | Semua | 150 px | 100 px | Varian Sedang (3:2), sistem akan upscale + gradient jika kecil |
| HOME_FEED_2 | Semua | 150 px | 75 px | Varian Kecil (2:1), sistem akan upscale + gradient jika kecil |
| ARTICLE_TOP | Semua | 150 px | 100 px | Varian Sedang (3:2), sistem akan upscale + gradient jika kecil |
| ARTICLE_MIDDLE | Semua | 150 px | 75 px | Varian Kecil (2:1), sistem akan upscale + gradient jika kecil |
| ARTICLE_BOTTOM | Semua | 150 px | 75 px | Varian Kecil (2:1), sistem akan upscale + gradient jika kecil |

> **Prinsip**: Tidak ada gambar yang ditolak. Gambar kecil di-upscale, **semua rasio gambar selalu di-crop secara cerdas** (`object-cover + position: attention`) agar memenuhi slot dengan profesional — tanpa sisa ruang di kiri/kanan.

### 2.5 Responsive Rendering di Frontend

Komponen `AdSpace` menggunakan `<picture>` element untuk responsive images:

```html
<picture>
  <source media="(max-width: 639px)" srcSet="...mobile.webp" />
  <source media="(max-width: 767px)" srcSet="...tablet.webp" />
  <img src="...desktop.webp" class="object-cover" />
</picture>
```

`HOME_TOP` juga **sticky di mobile** (fixed bottom viewport, closeable setelah 5 detik).

> **`object-fit: cover`** — Semua komponen preview dan published menggunakan `object-cover` agar gambar mengisi container tanpa letterbox. Preview di Ad Studio **konsisten** dengan yang tayang. Container menggunakan `aspect-ratio` yang sesuai — tidak ada fixed height. Receipt/payment proof tetap pakai `object-contain` agar terlihat utuh.

### 2.6 Strategi Slot Mobile — Penamaan Berbasis Lokasi

> **Prinsip:** Jangan beri nama slot berdasarkan ukuran (misal `970x250`). Beri nama berdasarkan **lokasi penempatan** agar sistem dapat menyesuaikan ukuran secara otomatis per device tanpa mengubah nama slot. **Tidak ada slot sidebar** — semua iklan berada di dalam alur konten.

#### Konvensi Penamaan Slot

| Slot Name | Deskripsi | Format | Desktop | Tablet | Mobile | Tier |
|-----------|-----------|--------|---------|--------|--------|------|
| `HOME_TOP` | Hero banner homepage | 🎥 Video | 880 × 220 | 728 × 182 | 320 × 80 | Premium |
| `HOME_FEED_1` | Di tengah feed (setelah 6-8 berita) | 🖼️ Banner | 300 × 200 | 300 × 200 | 300 × 200 | Tinggi |
| `HOME_FEED_2` | Di bawah feed (setelah 12-15 berita) | 🖼️ Banner | 300 × 150 | 300 × 150 | 300 × 150 | Menengah |
| `ARTICLE_TOP` | Atas artikel (setelah paragraf ke-3) | 🖼️ Banner | 300 × 200 | 300 × 200 | 300 × 200 | Tinggi |
| `ARTICLE_MIDDLE` | Tengah artikel (setelah paragraf ke-8) | 🖼️ Banner | 300 × 150 | 300 × 150 | 300 × 150 | Menengah |
| `ARTICLE_BOTTOM` | Bawah artikel (sebelum artikel terkait) | 🖼️ Banner | 300 × 150 | 300 × 150 | 300 × 150 | Ekonomi |

#### Layout Homepage Mobile

```
────────────────────
Header
────────────────────

Hero Banner (HOME_TOP)
320 × 80

Headline

Berita 1
Berita 2

Banner (HOME_FEED_1)
300 × 200 [Sedang]

Berita 3
Berita 4

Banner (HOME_FEED_2)
300 × 150 [Kecil]

Berita 5
Berita 6

Footer
────────────────────
```

#### Layout Halaman Artikel Mobile

```
────────────────────
Judul Artikel
Info Penulis
Gambar Hero
────────────────────

Paragraf 1
Paragraf 2
Paragraf 3

Banner (ARTICLE_TOP)
300 × 200 [Sedang]

Paragraf 4
Paragraf 5
Paragraf 6
Paragraf 7
Paragraf 8

Banner (ARTICLE_MIDDLE)
300 × 150 [Kecil]

Paragraf 9
Paragraf 10

Banner (ARTICLE_BOTTOM)
300 × 150 [Kecil]

Artikel Terkait
Footer
────────────────────
```

#### Density Ratio & Pertimbangan UX

| Aturan | Target |
|--------|--------|
| Rasio iklan terhadap konten | ≤ 30% di viewport |
| Jarak antar iklan (mobile) | Minimal 4-6 konten card / 3-4 paragraf |
| Frekuensi scroll sebelum iklan | Minimal 2-3 layar (viewport height) |

> **Catatan:** Slot `HOME_FEED_2` (setelah berita 12-15) mungkin tidak menghasilkan impresi signifikan jika pengguna tidak scroll sejauh itu. Pertimbangkan untuk menggabungkannya dengan `HOME_FEED_1` atau menggunakan infinite scroll dengan iklan dinamis.

#### Lazy Loading

Slot yang berada di bawah fold **tidak boleh dimuat** sampai pengguna mendekati posisi tersebut. Gunakan `IntersectionObserver` atau `loading="lazy"` untuk:
- Menghemat bandwidth
- Meningkatkan Core Web Vitals (LCP, CLS)
- Menghindari counted impression tanpa viewport visibility

---

## 3. Smart Image Processing

### 3.1 Pipeline

```
Upload gambar (JPG/PNG/WebP/GIF)
         │
         ▼
   Validasi format (tolak SVG, GIF animasi)
         │
         ▼
   Cek ukuran — apakah perlu upscale?
         │
     ┌────┴────────────────────┐
     │                         │
 Sudah cukup besar        Perlu upscale
     │                         │
     │                    ① Replicate API (AI)
     │                       ├── Berhasil → pakai
     │                       └── Gagal ↓
     │                    ② Sharp (lanczos3, 2×)
     │                       ├── Berhasil → pakai
     │                       └── Gagal ↓
     │                    ③ Pakai gambar asli + gradient
     │                         │
     └────────┬────────────────┘
              │
              ▼
   Extract dominant color palette
    ┌────┴────────────────────┐
    │                         │
Rasio cocok              Rasio beda
(±15%)                   (>15%)
    │                         │
    ▼                         ▼
Smart Crop              Palette Gradient
(fit: cover)            Background + Contain
    │                         │
    └────────┬────────────────┘
             │
             ▼
      Compress ke WebP
      (max 200KB, iteratif quality 80→30)
             │
             ▼
      Simpan ke storage
```

### 3.2 Smart Crop — Selalu Aktif (Diperbarui 2 Juli 2026)

`ASPECT_RATIO_TOLERANCE` dinaikkan dari `0.15` (15%) menjadi `1.0` (100%) di `ad-image-processor.ts`. Efeknya:

- **Semua gambar**, berapa pun rasio aslinya, selalu diproses dengan mode `smart_crop` (`fit: cover, position: attention`).
- Sistem otomatis mendeteksi area paling penting dari gambar (teks, wajah, logo) dan menjaga area tersebut tetap tampil di slot.
- Mode `palette_gradient` (yang menyisakan ruang kosong di kiri/kanan) **tidak akan pernah lagi digunakan**.

**Sebelum (masalah):**
```
Gambar 300×200 (3:2) → slot 300×150 (2:1)
Selisih rasio: 25% > 15% → palette_gradient → sisa kiri-kanan ❌
```

**Sesudah (solusi):**
```
Gambar 300×200 (3:2) → slot 300×150 (2:1)
Selisih rasio: 25% < 100% → smart_crop → memenuhi penuh ✅
```

> **Manfaat untuk user:** Pengiklan tidak perlu pusing soal ukuran gambar. Upload gambar apa pun — sistem akan selalu mengisi penuh slot iklan secara profesional.

### 3.3 File Lokasi

| File | Fungsi |
|------|--------|
| `apps/api/src/lib/ad-image-processor.ts` | Core processing: palette extraction, gradient generation, smart resize |
| `apps/api/src/modules/media/media.controller.ts` | Upload endpoint + integrasi processing |
| `apps/web/components/dashboard/ads/studio/AdSmartPreview.tsx` | Frontend preview component |

### 3.4 Endpoint Preview

```
POST /api/v1/media/ad-preview
Content-Type: multipart/form-data
Body: file (gambar)

Response:
{
  "success": true,
  "data": {
    "previews": [
      {
        "slot": "HOME_TOP",
        "variant": "desktop",
        "url": "https://...",
        "width": 970,
        "height": 250,
        "method": "palette_gradient",
        "dominantColor": "#2563eb"
      },
      ...
    ],
    "warnings": ["Gambar Anda lebih kecil dari rekomendasi..."]
  }
}
```

---

## 4. Komponen Frontend

### 4.1 `AdSpace`

File: `apps/web/components/ui/AdSpace.tsx`

| Fitur | Detail |
|-------|--------|
| **Props** | `type: 'HOME_TOP' \| 'HOME_FEED_1' \| 'HOME_FEED_2' \| 'ARTICLE_TOP' \| 'ARTICLE_MIDDLE' \| 'ARTICLE_BOTTOM'`, `slot?`, `label?`, `className?` |
| **Fetch** | `GET /api/v1/ads/public?site=<siteId>`, filter by `slotName` di client |
| **Carousel** | Auto-rotate — HOME_TOP (video) 12 detik, slot banner 7 detik. Random order, fade transition, tanpa indikator. Pause on hover |
| **Container** | Semua slot menggunakan `aspect-ratio` (bukan fixed height). `HOME_TOP`: `max-w-[960px] aspect-[4/1] mx-auto rounded-xl`. Banner feed/artikel: `max-w-[360px] aspect-[3/2]` atau `aspect-[2/1] mx-auto rounded-lg` |
| **Impresi** | `POST /api/v1/ads/track/<id>?action=impression` (satu kali per ad ID per page load) |
| **Klik** | `POST /api/v1/ads/track/<id>?action=click` (via `navigator.sendBeacon`) |
| **A/B Testing** | Random variant per session (sessionStorage), use `winnerVariant` if set |
| **Animation** | Dihapus dari UI — banner tampil bersih tanpa efek. Field `animationEffect` di DB tetap ada (backward compatible) |
| **Video** | Auto-detect `.mp4/.webm/.ogg/.mov`, render `<video autoPlay loop muted>` |
| **Script** | Sandboxed iframe `allow-scripts allow-popups` |
| **Sticky Mobile** | HOME_TOP fixed bottom, closeable after 5 detik |
| **Fallback** | CMS fallback dari `/api/v1/ads/fallback` → showcase components |

### 4.2 Showcase Fallbacks

| Komponen | File | Slot |
|----------|------|------|
| `BillboardShowcase` | `components/ui/BillboardShowcase.tsx` | HOME_TOP |
| `InFeedShowcase` | `components/ui/InFeedShowcase.tsx` | HOME_FEED_1, HOME_FEED_2, ARTICLE_TOP, ARTICLE_MIDDLE, ARTICLE_BOTTOM |

> **Catatan:** Semua slot in-feed dan artikel menggunakan satu komponen `InFeedShowcase` yang menerima prop `slot` untuk menyesuaikan konten. CMS fallback juga tersedia via `GET /api/v1/ads/fallback?slot=HOME_TOP`.

### 4.3 Ad Studio (Booking Wizard)

File: `apps/web/components/dashboard/ads/studio/`

| Step | Komponen | Fungsi |
|------|----------|--------|
| 1. Package | `StudioCanvas` | Pilih paket + format (image/video) |
| 2. Campaign | `StudioCanvas` | Nama kampanye, URL tujuan, tanggal |
| 3. Creative | `StudioCanvas` + `StudioControls` | **Upload 1 file** → auto-generate semua variant (desktop/tablet/mobile) → preview hasil + cross-slot preview |
| 4. Payment | `StudioCanvas` | Upload bukti transfer (opsional) |

**Flow Upload (baru):**
1. Advertiser pilih 1 file gambar/video
2. Frontend panggil `POST /upload-ad?slot=<slot>`
3. Backend auto-generate semua variant (desktop, tablet, mobile)
4. Return semua URL + metadata + warnings
5. Frontend tampilkan preview (3 gambar berdampingan)
6. Background: fetch cross-slot preview untuk slot lain
7. Submit booking dengan semua variant URLs

> **Preview Konsisten:** Semua komponen preview (`StudioPreview`, `StudioCanvas`, `StudioControls`, `AdSmartPreview`) menggunakan `object-cover` — sama persis dengan `AdSpace` yang tayang. Advertiser melihat hasil yang sama sebelum dan sesudah publish. Container preview menggunakan `aspect-ratio` yang sesuai (3:2 untuk Sedang, 2:1 untuk Kecil) agar rasio konsisten.

### 4.4 Admin Components

| Komponen | File | Fungsi |
|----------|------|--------|
| `AdsSlotsContent` | `dashboard/ads/pages/AdsSlotsContent.tsx` | **Card Grid layout** — 6 slot cards dengan preview, stats, single upload |
| `AdSlotCard` | `dashboard/ads/AdSlotCard.tsx` | **Production card** — preview iklan aktif per slot, **klik thumbnail → modal preview ukuran penuh** (rasio sesuai slot, `object-cover`), stats, upload → auto-generate |
| `HeroBannerManager` | `dashboard/ads/HeroBannerManager.tsx` | Carousel banner management (HOME_TOP) |
| `BookingReviewList` | `dashboard/ads/BookingReviewList.tsx` | Review queue + 5-item content checklist |
| `AdPerformanceChart` | `dashboard/ads/AdPerformanceChart.tsx` | Recharts area chart |
| `AdvertiserAdsView` | `dashboard/ads/AdvertiserAdsView.tsx` | Advertiser dashboard + stats |
| `AdsOverviewContent` | `dashboard/ads/pages/AdsOverviewContent.tsx` | Overview: 5 stat cards (Booking, Aktif, Impresi, Klik, Verifikasi) |

---

## 5. API Endpoints

### 5.1 Publik

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/v1/ads/public?site=<siteId>` | Semua iklan aktif untuk site |
| `GET` | `/api/v1/ads/fallback?slot=<slot>` | Data fallback CMS |
| `POST` | `/api/v1/ads/track/:id?action=impression\|click` | Tracking impresi/klik (rate-limited 30/min/IP) |
| `GET` | `/api/v1/ads/packages` | Daftar paket aktif |
| `GET` | `/api/v1/ads/availability` | Cek ketersediaan slot |

### 5.2 Advertiser (Auth Required)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/v1/ads/bookings` | Buat booking baru |
| `GET` | `/api/v1/ads/bookings/my` | Booking milik sendiri |
| `GET` | `/api/v1/ads/bookings/:id/stats` | Analytics time-series (7/14/30/90 hari) |
| `POST` | `/api/v1/ads/bookings/:id/pay` | Upload bukti transfer |
| `POST` | `/api/v1/ads/bookings/:id/pay-gateway` | Buat Midtrans Snap transaction |

### 5.3 Admin (superadmin/wapimred)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/v1/ads/` | Paginated ads list |
| `POST` | `/api/v1/ads/` | Buat iklan manual |
| `PATCH` | `/api/v1/ads/:id` | Update iklan |
| `DELETE` | `/api/v1/ads/:id` | Hapus iklan |
| `PATCH` | `/api/v1/ads/reorder` | Ubah urutan rotasi |
| `GET` | `/api/v1/ads/bookings/all` | Semua booking |
| `POST` | `/api/v1/ads/bookings/:id/approve` | Approve + auto-sync ke Advertisement |
| `POST` | `/api/v1/ads/bookings/:id/reject` | Reject dengan catatan |
| `POST` | `/api/v1/ads/packages` | Buat paket |
| `PATCH` | `/api/v1/ads/packages/:id` | Update paket |
| `DELETE` | `/api/v1/ads/packages/:id` | Hapus paket |

### 5.4 Media

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/v1/media/upload-ad?slot=<slot>` | **Single upload → auto-generate semua variant** (desktop/tablet/mobile). Return semua URL + metadata + warnings |
| `POST` | `/api/v1/media/upload?purpose=ad&slot=<slot>&variant=<variant>` | Upload + proses gambar iklan (legacy, single variant) |
| `POST` | `/api/v1/media/ad-preview` | Preview gambar di semua slot (parallel processing) |

### 5.5 Webhook & Cron

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/v1/ads/webhook/midtrans` | Midtrans callback (auto-konfirmasi) |
| `POST` | `/api/cron/ad-expiry` | Auto-expiry iklan (hourly) |

---

## 6. Database Schema (Prisma)

### 6.1 Advertisement (Slot Aktif)

```prisma
model Advertisement {
  id                String   @id @default(uuid())
  siteId            String
  slot              String   // 'HOME_TOP' | 'HOME_FEED_1' | 'HOME_FEED_2' | 'ARTICLE_TOP' | 'ARTICLE_MIDDLE' | 'ARTICLE_BOTTOM'
  code              String?  // HTML/JS snippet
  imageUrl          String?  // Desktop
  imageUrlTablet    String?  // Tablet variant
  imageUrlMobile    String?  // Mobile variant
  imageUrlTabletAlt String?  // Tablet alt (A/B)
  imageUrlMobileAlt String?  // Mobile alt (A/B)
  variantAUrl       String?  // A/B testing
  variantBUrl       String?
  winnerVariant     String?  // 'A' | 'B'
  linkUrl           String?
  animationEffect   String?  // Deprecated — tidak dipakai di UI, disimpan untuk backward compatibility
  isActive          Boolean  @default(true)
  order             Int      @default(0)  // Rotasi order
  impressions       Int      @default(0)
  clicks            Int      @default(0)
  bookingId         String?
  booking           AdBooking? @relation(fields: [bookingId], references: [id])
}
```

### 6.2 AdPackage (Katalog Produk)

```prisma
model AdPackage {
  id            String   @id @default(uuid())
  name          String
  slot          String
  durationDays  Int
  price         Decimal  @db.Decimal(12, 2)
  allowedFormat String   // 'IMAGE' | 'VIDEO' | 'ALL'
  description   String?
  isActive      Boolean  @default(true)
}
```

### 6.3 AdBooking (Transaksi)

```prisma
model AdBooking {
  id              String        @id @default(uuid())
  userId          String
  siteId          String
  packageId       String
  campaignName    String?
  imageUrl        String?       // Desktop variant
  imageUrlTablet  String?       // Tablet variant
  imageUrlMobile  String?       // Mobile variant
  logoUrl         String?       // Logo advertiser (khusus HOME_TOP)
  fotoUrl         String?       // Foto advertiser (khusus HOME_TOP)
  linkUrl         String?
  animationEffect String?       // Deprecated — tidak dipakai di UI
  startDate       DateTime
  endDate         DateTime
  paymentStatus   PaymentStatus @default(PENDING)
  paymentProof    String?
  snapToken       String?
  externalOrderId String?       @unique
  status          AdStatus      @default(PENDING_REVIEW)
  rejectionNotes  String?       @db.Text
  impressions     Int           @default(0)
  clicks          Int           @default(0)
  previewUrl      String?       // Link preview video (khusus HOME_TOP)
  revisionCount   Int           @default(0) // Jumlah revisi video (maks 1)
  creativeNotes   String?       // Catatan tim kreatif untuk advertiser
}
```

### 6.4 AdEventLog (Analytics)

```prisma
model AdEventLog {
  id        String   @id @default(uuid())
  adId      String
  bookingId String?
  siteId    String
  action    String   // 'impression' | 'click'
  createdAt DateTime @default(now())

  @@index([adId, createdAt])
  @@index([bookingId, createdAt])
  @@index([siteId, createdAt])
}
```

### 6.5 Enums

```prisma
enum PaymentStatus { PENDING, VERIFYING, PAID, REJECTED }
enum AdStatus      { PENDING_REVIEW, ACTIVE, COMPLETED, REJECTED }
```

---

## 7. Alur Pengiklan End-to-End

```
1. Register → Upgrade ke Advertiser (POST /auth/upgrade-to-advertiser)
      ↓
2. Buka Ad Studio (/{site}/ads/order)
      ↓
3. Pilih Paket (HOME_TOP / HOME_FEED_1 / HOME_FEED_2 / ARTICLE_TOP / ARTICLE_MIDDLE / ARTICLE_BOTTOM)
      ↓
4. Isi Detail (Nama Kampanye, URL, Tanggal)
      ↓
5. Upload 1 File (gambar atau video)
      ↓
   🎨 Backend auto-generate semua variant (POST /upload-ad?slot=...):
   → HOME_TOP: 880×220 (desktop) / 728×182 (tablet) / 320×80 (mobile)
   → HOME_FEED_1 / ARTICLE_TOP: 300×200 (semua device)
   → HOME_FEED_2 / ARTICLE_MIDDLE / ARTICLE_BOTTOM: 300×150 (semua device)
   → Return semua URL + warnings
      ↓
   📐 Preview muncul otomatis:
   → 3 gambar berdampingan (desktop/tablet/mobile)
   → Cross-slot preview ("Juga cocok untuk slot lain")
   → Warning jika gambar kecil / rasio beda
      ↓
6. Submit Booking (dengan semua variant URLs)
      ↓
7. Pembayaran (opsional saat submit):
   - Midtrans Snap (VA, e-wallet, QRIS, kartu kredit)
   - Manual transfer + upload bukti
      ↓
8. Admin Review (5-item checklist):
   - [ ] Tidak misleading
   - [ ] Tidak SARA/prohibited
   - [ ] Ukuran sesuai
   - [ ] URL aktif
   - [ ] Tidak melanggar hak cipta
      ↓
9. Approve → Auto-sync ke Advertisement → Notifikasi email + in-app
      ↓
10. Iklan Tayang — HOME_TOP: video 12 detik, banner: rotasi 7 detik (random, fade, tanpa indikator)
      ↓
11. Analytics (impresi, klik, CTR per hari)
      ↓
12. Auto-Expiry (cron hourly, endDate lewat → nonaktif)
```

---

## 7A. HOME_TOP — Video Creative Service

> **Keputusan (28 Juni 2026):** Slot `HOME_TOP` menggunakan model **layanan kreatif**. Advertiser upload **foto + logo** (opsional). Backend auto-generate variant gambar (desktop/tablet/mobile). Tim kreatif BeritaKarya memproduksi video iklan dari foto+logo tersebut.

### 7A.1 Mengapa Model Ini?

| Alasan | Penjelasan |
|--------|------------|
| **Mudah dipasarkan** | Marketing cukup bilang: *"Slot paling premium, kami buatkan video iklan Anda, cukup kirim foto dan logo"* |
| **Kualitas terjamin** | Video dibuat oleh tim internal, bukan tergantung upload advertiser |
| **Rasio konsisten** | Video didesain khusus untuk 880×220 (desktop), 728×182 (tablet), 320×80 (mobile) — semua 4:1 |
| **Harga premium terjustifikasi** | Advertiser mendapat produk jadi, bukan slot kosong |
| **Ringan untuk advertiser** | UMKM tidak perlu punya kemampuan produksi video |

### 7A.2 Alur HOME_TOP (Berbeda dari Slot Banner)

```
Advertiser buka Ad Studio → Pilih paket HOME_TOP
        ↓
Upload FOTO (1 file) + LOGO (opsional, terpisah)
        ↓
Backend auto-generate 3 variant (880×220 / 728×182 / 320×80) [4:1]
→ POST /upload-ad?slot=HOME_TOP
→ Simpan ke processedVariants { desktop, tablet, mobile }
        ↓
Isi detail kampanye (nama, URL, tanggal)
        ↓
Submit booking (kirim imageUrl + imageUrlTablet + imageUrlMobile + logoUrl + fotoUrl)
        ↓
Admin review → approve
        ↓
Tim kreatif produksi video (dari foto + logo advertiser)
        ↓
Upload video ke sistem → status ACTIVE (langsung tayang)
        ↓
Sistem kirim notifikasi + preview link ke advertiser
        ↓
Advertiser punya grace period 24-48 jam untuk review
        ↓
┌─────────────────────────────────────────────┐
│ Ada feedback? → Revisi (maks 1x)            │
│ Tidak ada?    → Dianggap setuju, lanjut     │
└─────────────────────────────────────────────┘
```

> **Catatan Teknis:** Saat approve, backend cek `booking.imageUrl`. Jika null (booking lama), fallback ke `fotoUrl`. Jika tablet/mobile variant belum ada, auto-generate via `generateVariantsFromUrl()`. Lihat `ad.controller.ts` approve handler.

### 7A.3 Aturan Grace Period & Revisi

| Aturan | Detail |
|--------|--------|
| **Grace period** | 24-48 jam setelah notifikasi video ready |
| **Maks revisi** | 1 kali |
| **Auto-close** | Jika tidak ada feedback dalam grace period → dianggap setuju |
| **Revisi berlebih** | Lebih dari 1x → tetap tayang, catatan ditambahkan ke log |
| **Komunikasi** | Semua via sistem (notifikasi email + in-app), ada jejak |

### 7A.4 Perubahan Database (AdBooking) — DITUNDA

> **Status:** Belum perlu sekarang. Jalankan dulu secara manual, tambah otomatisasi saat volume naik.

Field yang akan ditambah saat diperlukan:

```prisma
model AdBooking {
  // ... field yang ada ...
  previewUrl     String?    // Link preview video untuk advertiser
  revisionCount  Int        @default(0) // Jumlah revisi (maks 1)
  creativeNotes  String?    // Catatan dari tim kreatif untuk advertiser
}
```

**Kapan perlu:** Booking HOME_TOP > 5/bulan, atau advertiser sering komplain.

### 7A.5 Perbedaan Flow HOME_TOP vs Slot Banner

| Aspek | HOME_TOP (Video) | Slot Lain (Banner) |
|-------|------------------|---------------------|
| **Upload advertiser** | Foto (1 file) + Logo (opsional) | Gambar langsung |
| **Backend processing** | Auto-generate 3 variant gambar (desktop/tablet/mobile) | Auto-generate 3 variant gambar (desktop/tablet/mobile) |
| **Booking payload** | `imageUrl` + `imageUrlTablet` + `imageUrlMobile` + `logoUrl` + `fotoUrl` | `imageUrl` + `imageUrlTablet` + `imageUrlMobile` |
| **Produksi tambahan** | Tim kreatif produksi video dari foto+logo | Tidak ada |
| **Status saat produksi** | `PENDING_REVIEW` → `ACTIVE` | `PENDING_REVIEW` → `ACTIVE` |
| **Preview untuk advertiser** | Ya (video preview link) | Ya (cross-slot preview) |
| **Revisi** | Maks 1x (grace period 24-48 jam) | Tidak ada |
| **Format akhir** | Video MP4 (kita kontrol) | Gambar WebP (auto-process) |

### 7A.6 Perubahan Komponen Ad Studio

| Komponen | Perubahan |
|----------|-----------|
| `StudioContext` | HOME_TOP: kirim `imageUrl` + `imageUrlTablet` + `imageUrlMobile` + `logoUrl` + `fotoUrl` (semua variant) |
| `StudioCanvas` (Step 3) | Jika slot = `HOME_TOP` → tampilkan form upload **foto + logo** (bukan video) |
| `StudioCanvas` (Step 4) | Tambah catatan: *"Tim kreatif kami akan membuat video dalam 1-2 hari kerja"* |
| `AdvertiserAdsView` | Tambah kolom `previewUrl` → tombol "Preview Video" saat grace period |
| `BookingReviewList` | Tambah info: *"Menunggu produksi video oleh tim kreatif"* |

### 7A.7 Roadmap Produksi Video

> **Tool:** Seedance / Kling AI (image-to-video, 10-15 detik per klip)

**Fase 1 — Sekarang (Manual, Validasi)**

```
Foto + Logo → Seedance/Kling → Review Tim → Upload ke sistem → Publish
```

- Target: produksi cepat, lihat respons pasar, kumpulkan contoh iklan
- Tim kreatif proses manual, catat prompt yang dipakai
- Estimasi biaya: ~Rp 15.000-20.000/video

**Fase 2 — 3-6 Bulan (Template per Kategori)**

```
Foto → Pilih Template → AI Generate → Review Tim → Publish
```

Kategori template:
- Restoran / Kuliner
- Properti / Real Estate
- Dealer / Otomotif
- Event / Hiburan
- Sekolah / Pendidikan
- Klinik / Kesehatan

Setiap kategori punya gaya visual dan prompt berbeda. Tim kreatif lebih efisien (template reusable).

**Fase 3 — 6-12 Bulan (Semi-Otomatis)**

```
Upload Foto + Logo + Teks → AI Pilih Template → AI Generate → Publish
```

Sebagian besar proses otomatis. Tim kreatif hanya review akhir.

### 7A.8 Prompt Library (Aset Paling Berharga)

> Tool AI bisa diganti (Seedance → Kling → Runway). **Prompt Library tidak bisa diganti.** Ini competitive advantage.

Setiap kali produksi video, catat prompt yang dipakai:

```
Kategori: Restoran
Prompt: "Slow zoom into plate of food, warm lighting, professional food photography style..."
Hasil: ⭐⭐⭐⭐
Catatan: Klien suka, gerakan lambat lebih elegan
```

Struktur folder:

```
prompts/
├── restoran/
│   ├── makanan-01.txt
│   ├── minuman-01.txt
├── properti/
│   ├── rumah-01.txt
│   ├── apartemen-01.txt
├── otomotif/
│   ├── mobil-01.txt
│   ├── motor-01.txt
└── ...
```

Kumpulkan dari hari pertama. 6 bulan lagi = library yang tidak dimiliki kompetitor.

---

## 7B. Video Production — 6 AI Providers

> **Status:** Sudah diimplementasikan (28 Juni 2026)
> **Halaman:** `/{site}/dashboard/ads/production`

### 7B.1 Provider yang Didukung

| Provider | Tier | Harga/video (10-15s) | Kelebihan |
|----------|------|---------------------|-----------|
| **Seedance** (ByteDance) | ⭐ Recommended | $0.50-1.50 | Kualitas terbaik |
| **Kling** (Kuaishou) | Alternatif | $0.50-1.20 | Solid, terbukti |
| **Hailuo AI** (MiniMax) | 💰 Budget | $0.20-0.60 | Termurah |
| **Pika** | Alternatif | $1.00-1.50 | Mudah dipakai |
| **Luma Dream Machine** | Alternatif | $0.50-1.20 | Gerakan natural |
| **Runway** | 💎 Premium | $2.00-3.00 | Kualitas tertinggi |

### 7B.2 Arsitektur

```
Frontend (Production Page)
├── Settings: input API key per provider (simpan di database)
├── Dropdown: pilih AI provider
├── Prompt input
└── Preview video + publish ke slot

Backend
├── apps/api/src/lib/video-providers/ — abstraction layer
│   ├── index.ts — registry + types
│   ├── base.ts — abstract class (getApiKey dari DB, fallback .env)
│   ├── seedance.ts, kling.ts, hailuo.ts, pika.ts, luma.ts, runway.ts
├── VideoProviderConfig model — simpan API key di database
└── Endpoint:
    ├── GET /production/providers — daftar provider + status
    ├── POST /production/providers — simpan API key
    ├── DELETE /production/providers/:provider — hapus API key
    ├── POST /production/:bookingId/generate — generate video
    └── POST /production/:bookingId/publish — publish ke slot
```

### 7B.3 Alur Produksi Video

```
① Advertiser → Ad Studio → upload logo + foto → submit booking
② Admin → booking review → approve
③ Admin → Production page → pilih provider → input prompt → "Produksi Video"
④ Backend → panggil AI provider → generate video
⑤ Admin → preview hasil → rating (1-5) → "Tayangkan"
⑥ Video → masuk ke HOME_TOP slot → tayang di homepage
⑦ Prompt tersimpan di Prompt Library (VideoPrompt model)
```

### 7B.4 API Key Management

API key disimpan di **database** (bukan `.env`), diinput dari **frontend**:

```
Halaman Produksi → [⚙️ Pengaturan API Key]
├── Seedance API Key: [________] [💾] [🗑️]
├── Kling API Key:    [________] [💾] [🗑️]
├── Hailuo API Key:   [________] [💾] [🗑️]
├── Pika API Key:     [________] [💾] [🗑️]
├── Luma API Key:     [________] [💾] [🗑️]
└── Runway API Key:   [________] [💾] [🗑️]
```

Provider tanpa API key → otomatis disabled di dropdown.

### 7B.5 Prompt Library

Setiap kali video di-generate, prompt tersimpan di tabel `VideoPrompt`:
- `bookingId` — booking terkait
- `prompt` — teks prompt yang dipakai
- `category` — kategori (restoran, properti, dll)
- `rating` — rating admin (1-5)
- `videoUrl` — URL video hasil

Prompt Library adalah **aset paling berharga** — tool AI bisa diganti, prompt tidak.

---

## 8. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /track/:id` | 30 requests per IP | 1 menit |
| `POST /bookings` | 10 requests per user | 1 jam |

Impresi juga di-deduplicate per IP dengan TTL 30 menit di Redis.

---

## 9. Format yang Didukung

| Format | Gambar | Video | Script HTML |
|--------|--------|-------|-------------|
| JPG | ✅ | — | — |
| PNG | ✅ | — | — |
| WebP | ✅ | — | — |
| GIF | ✅ | — | — |
| MP4 | — | ✅ | — |
| WebM | — | ✅ | — |
| MOV | — | ✅ | — |
| HTML/JS | — | — | ✅ (sandboxed iframe) |

**Batasan Upload:**

| Tipe | Max Size | Catatan |
|------|----------|---------|
| Gambar | 20 MB | Output diproses max 200 KB (WebP, iteratif quality 80→30) |
| Video | 50 MB | Validasi: format, resolusi min 480×270, rekomendasi 1280×720 |
| Video thumbnail | — | Auto-generate dari frame pertama saat upload |

---

## 10. Status Perbaikan (Revisi)

| # | Masalah | Status |
|---|---------|--------|
| 1 | Self-registration pengiklan | ✅ Selesai |
| 2 | Cek ketersediaan slot | ✅ Selesai |
| 3 | Pisahkan bayar dari order | ✅ Selesai |
| 4 | Notifikasi email + in-app | ✅ Selesai |
| 5 | Payment gateway (Midtrans) | ✅ Selesai |
| 6 | Campaign name tersimpan | ✅ Selesai |
| 7 | End date konsisten (read-only) | ✅ Selesai |
| 8 | Review konten iklan (5-item checklist) | ✅ Selesai |
| 9 | Rotasi slot non-HERO | ✅ Selesai |
| 10 | Auto-expiry cron | ✅ Sudah Ada |
| 11 | Duplicate admin views | ✅ Selesai |
| 12 | Permission wapimred approve | ✅ Selesai |
| 13 | Rate limit booking creation | ✅ Selesai |
| 14 | Error handling order flow | ✅ Selesai |
| 15 | Smart image processing (palette gradient) | ✅ Selesai |
| 16 | Ad preview semua slot | ✅ Selesai |
| 17 | Upscale pipeline (Replicate → Sharp → gradient) | ✅ Selesai |
| 18 | HOME_TOP: upload logo+foto (bukan video) | ✅ Selesai — Ad Studio branch khusus HOME_TOP |
| 19 | HOME_TOP: grace period & revisi 1x | ✅ Selesai — manual via sistem, field DB ditunda |
| 20 | HOME_TOP: previewUrl untuk advertiser | ✅ Selesai — Production page |
| 21 | Video production: 6 AI providers + Prompt Library | ✅ Selesai |
| 22 | Halaman produksi video (`/dashboard/ads/production`) | ✅ Selesai |
| 23 | API key input di frontend (database, bukan .env) | ✅ Selesai |
| 24 | Slot availability check (real capacity) | ✅ Selesai |
| 25 | Bundle pricing (Homepage/Article/All-In) | ✅ Selesai |
| 26 | allowedFormat validation (filter format selector) | ✅ Selesai |
| 27 | Multi-iklan support (AdSlotCard refactor) | ✅ Selesai |
| 28 | Video preview di AdSlotCard | ✅ Selesai |
| 29 | Marketing page pre-selection (`?package=`) | ✅ Selesai |
| 30 | Bank account shared constant | ✅ Selesai |
| 31 | Advertiser history: paymentStatus column | ✅ Selesai |
| 32 | wapimred role di /bookings/all | ✅ Selesai |
| 33 | Animation effect removed from UI | ✅ Selesai |
| 34 | Carousel: video 12s, banner 7s, random, fade | ✅ Selesai |
| 35 | HOME_TOP: kirim semua variant (desktop/tablet/mobile) saat booking | ✅ Selesai |
| 36 | Approve handler: fallback fotoUrl untuk booking lama HOME_TOP | ✅ Selesai |
| 37 | Dokumentasi ads.md sinkron dengan codebase | ✅ Selesai |
| 38 | Preview konsisten: object-contain → object-cover (7 file) | ✅ Selesai |
| 39 | HeroBannerRow view mode: aspect ratio 2:1 → 4:1 (match HOME_TOP) | ✅ Selesai |
| 40 | AdSlotCard: klik thumbnail → modal preview ukuran penuh (seperti HOME_TOP) | ✅ Selesai |
| 41 | Banner terpotong di halaman live — container fixed height → `aspect-ratio` dinamis | ✅ Selesai — `AdSpace.tsx` styles map diperbarui |
| 42 | HOME_TOP: container fixed-height → `max-w-[960px] aspect-[4/1] mx-auto rounded-xl` | ✅ Selesai — responsif di semua lebar layar termasuk ultra-wide |
| 43 | Sisa kiri-kanan pada banner 2:1 saat upload gambar 3:2 — `ASPECT_RATIO_TOLERANCE` 15% → 100% | ✅ Selesai — sistem selalu `smart_crop` (cover+attention), user bebas upload gambar ukuran apapun |

---

## 11. Infrastruktur

| Layanan | Fungsi |
|---------|--------|
| **MinIO** | Storage gambar (S3-compatible) |
| **Redis** | Rate limiting + impression dedup |
| **Midtrans Snap** | Payment gateway |
| **Cloudflare** | CDN + tunnel ke API |
| **Vercel** | Frontend hosting |

---

## 12. File Referensi

| File | Fungsi |
|------|--------|
| `apps/api/src/config/ad-slots.ts` | **Konfigurasi slot** — ukuran, format (VIDEO/IMAGE), tier. Satu sumber kebenaran |
| `apps/api/src/modules/ad/ad.controller.ts` | Semua endpoint ads + production + bundles |
| `apps/api/src/modules/ad/ad.repository.ts` | Prisma data access + VideoProviderConfig |
| `apps/api/src/modules/ad/ad.service.ts` | Impresi dedup, booking sync |
| `apps/api/src/modules/ad/bundle-pricing.ts` | Logika bundle pricing (Homepage/Article/All-In) |
| `apps/api/src/lib/ad-image-processor.ts` | Smart image processing, upscale pipeline, parallel previews |
| `apps/api/src/lib/video-providers/` | **6 AI video providers** (Seedance, Kling, Hailuo, Pika, Luma, Runway) |
| `apps/api/src/modules/media/media.controller.ts` | Upload endpoint + `/upload-ad` (single → all variants) |
| `apps/api/src/cron/ad-expiry.ts` | Auto-expiry cron |
| `apps/api/src/services/midtrans.service.ts` | Midtrans integration |
| `apps/web/components/ui/AdSpace.tsx` | Komponen iklan publik — carousel (video 12s, banner 7s), random order |
| `apps/web/components/dashboard/ads/studio/` | Ad Studio wizard — upload logo+foto untuk HOME_TOP |
| `apps/web/components/dashboard/ads/production/` | **Halaman produksi video** — AI provider selector, prompt, preview |
| `apps/web/components/dashboard/ads/AdSlotCard.tsx` | Admin production card — multi-iklan, video preview, **klik thumbnail → modal preview ukuran penuh** |
| `apps/web/components/dashboard/ads/pages/AdsSlotsContent.tsx` | Admin Card Grid layout |
| `apps/web/components/dashboard/ads/pages/AdsOverviewContent.tsx` | Dashboard overview — 4 menu (Slots, Packages, Bookings, Production) |
| `apps/web/lib/constants.ts` | Slot definitions — ukuran, format, tier, bank accounts |
| `apps/web/tests/e2e/ad-booking.spec.ts` | E2E tests |

---

## 13. Pengujian & Build

```bash
# Type check
pnpm --filter @beritakarya/api type-check
pnpm --filter @beritakarya/web type-check

# Build
pnpm --filter @beritakarya/api build
pnpm --filter @beritakarya/web build

# E2E tests
pnpm --filter @beritakarya/web exec playwright test tests/e2e/ad-booking.spec.ts
```

---

## 14. Catatan Pengembangan Selanjutnya

| Area | Potensi Improve |
|------|-----------------|
| **Targeting** | Category-based targeting (iklan tampil di artikel kategori tertentu) |
| **Frequency Capping** | Max N impresi per user per hari per slot |
| **Enhanced Analytics** | Device breakdown, geographic, unique visitor |
| **Creative Templates** | Template banner siap pakai (pengiklan pilih + isi teks) |
| **Auto A/B Testing** | Statistical significance testing + auto-select winner |
| **Export Reports** | CSV/PDF export untuk advertiser |
| **Ad Quality** | Automated content moderation (AI-based) |
| **Mobile Slot Optimization** | Lazy loading + infinite scroll dynamic ad placement untuk `HOME_FEED_1`/`HOME_FEED_2` |

---

## 15. Roadmap & Plan Kerja

> **Prinsip:** Jangan bangun solusi sebelum tahu masalahnya seberapa besar.

Sistem saat ini (Palette Gradient) sudah **berhasil** — cepat (< 2 detik), gratis, profesional. Sebelum menambah kompleksitas AI, perlu data untuk tahu apakah investasi itu perlu.

### Pipeline Saat Ini (Termasuk Upscale)

```
Upload gambar → Cek ukuran → Perlu upscale?
    │                              │
    │                    ┌─────────┴─────────┐
    │                    │                   │
    │              ① Replicate          ② Sharp
    │              (AI, jika API ada)   (lokal, gratis)
    │                    │                   │
    │                    └─────────┬─────────┘
    │                              │
    ▼                              ▼
Extract warna ←──── Gambar (asli atau upscaled)
    │
    ▼
Cek rasio
    │                    │
    ▼                    ▼
Rasio cocok         Rasio SELALU cocok (toleransi 100%)
    │                    │
    ▼                    ▼
Smart Crop          Smart Crop
(fit: cover)        (fit: cover, position: attention)
    │                    │
    └────────┬───────────┘
             ▼
      Compress WebP (max 200KB)
             ▼
      Simpan ke MinIO
```

**Kelebihan:** Upscale otomatis, fallback chain (AI → Sharp → gradient), gratis jika tanpa Replicate API.
**Replicate API:** Opsional. Jika `REPLICATE_API_TOKEN` tidak di-set, sistem otomatis pakai Sharp.

### Fase 0: Kumpulkan Data (Minggu 1-2)

**Tujuan:** Tahu seberapa besar masalah gambar kecil/blur.

**Tugas:**

```
[✓] Tambah logging dimensi upload di ad-image-processor.ts
    → Catat: originalWidth, originalHeight, targetSlot, method yang dipakai
    → Log ke console (JSON structured), bisa dianalisis via PM2 logs

[ ] Jalankan 2-4 minggu di production

[ ] Analisis data:
    → Berapa % upload yang gambar kecil (< 300px)?
    → Berapa % yang rasio sangat beda (gap > 40%)?
    → Berapa % yang menggunakan palette_gradient vs smart_crop?
    → Apakah ada keluhan pengiklan tentang hasil?
```

**Keputusan:**
- Jika < 10% upload bermasalah → **stop**, Palette Gradient sudah cukup
- Jika > 10% → lanjut Fase 1

### Fase 1: Upscale Pipeline — ✅ Selesai

**Fallback chain (sudah diimplementasikan):**

```
① Replicate API (Real-ESRGAN x4plus) — jika REPLICATE_API_TOKEN ada
   ├── Berhasil → hasil AI upscale
   └── Gagal ↓
② Sharp (lanczos3, 2× lipat) — lokal, gratis
   ├── Berhasil → hasil sharp upscale
   └── Gagal ↓
③ Gambar asli + gradient background (sudah ada)
```

**Konfigurasi:**
- `REPLICATE_API_TOKEN` — opsional. Tidak di-set = skip Replicate, langsung Sharp
- Timeout Replicate: 15 detik (request) + 30 detik (polling)
- Sharp upscale: 2× lipat dari ukuran asli, lanczos3 kernel

**Keputusan:** Implementasi hybrid — Replicate sebagai opsi terbaik, Sharp sebagai fallback gratis. Tidak perlu pilih salah satu.
    → Log warning, tidak block user
```

**Estimasi biaya:** 50 upload/bulan × 20% upscale × Rp 30 = **Rp 300/bulan**

### Fase 2: Evaluasi + Keputusan (Minggu 5-6)

| Kondisi | Aksi |
|---------|------|
| Cost < Rp 500rb/bulan, volume rendah | Lanjut Replicate, selesai |
| Cost > Rp 1jt/bulan, volume tinggi | Evaluasi self-hosted Real-ESRGAN di LXC |
| Hampir tidak ada yang pakai | Matikan fitur, hemat cost |

### Phase 3: Backlog (Kapan Saja, Jika Diperlukan)

| Fitur | Estimasi | Kapan Dibutuhkan |
|-------|----------|------------------|
| Frequency Capping | 3-4 hari | Jika user komplain iklan terlalu sering muncul |
| Export Reports (CSV/PDF) | 2-3 hari | Jika advertiser minta laporan |
| Enhanced Analytics (device/geo) | 4-5 hari | Jika ada kebutuhan targeting |
| Category-Based Targeting | 5-7 hari | Jika advertiser ingin iklan tampil di kategori tertentu |
| Auto A/B Testing | 4-5 hari | Jika ada advertiser aktif yang mau optimize |
| Creative Templates | 1 minggu | Jika UMKM kesulitan buat desain |
| AI Outpainting | 5-7 hari | Jika data menunjukkan banyak rasio ekstrem |

### Ringkasan Timeline

```
[ Fase 0 ]  ✅ Logging data upload (sudah ada)
[ Fase 1 ]  ✅ Upscale pipeline (Replicate → Sharp → gradient)
[ Fase 2 ]  Evaluasi cost Replicate → keputusan self-hosted vs cloud
[ Backlog ] Frequency Capping, Export Reports, Targeting, dll.
```

### Keputusan Teknis

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Upscale approach | **Hybrid: Replicate → Sharp → gradient** | Best effort: AI jika ada, sharp sebagai fallback gratis |
| Replicate wajib? | **Tidak (opsional)** | Tanpa API key, sistem tetap jalan pakai sharp |
| Sync vs Async | **Sync** | Volume rendah, sharp < 1 detik, replicate < 30 detik |
| Outpainting sekarang? | **Tidak** | Palette Gradient sudah handle rasio beda dengan baik |
| Docker ditambah? | **Tidak** | Tidak perlu, Replicate via HTTP saja |

---

## 16. Pricing & Dashboard Admin — ✅ Selesai

> **Status:** Sudah diimplementasikan (28 Juni 2026)

### 16.1 Struktur Harga

Harga diisi manual oleh superadmin lewat `/{site}/dashboard/ads/packages`. Referensi: `docs/harga.md`

| Tier | Slot | Format | 7 Hari | 14 Hari | 30 Hari | Maks |
|------|------|--------|--------|---------|---------|------|
| Premium | `HOME_TOP` | 🎥 Video | Rp 250.000 | Rp 435.000 | Rp 750.000 | 3 |
| Tinggi | `HOME_FEED_1` | 🖼️ Banner | Rp 175.000 | Rp 305.000 | Rp 525.000 | 3 |
| Tinggi | `ARTICLE_TOP` | 🖼️ Banner | Rp 175.000 | Rp 305.000 | Rp 525.000 | 3 |
| Menengah | `HOME_FEED_2` | 🖼️ Banner | Rp 100.000 | Rp 175.000 | Rp 300.000 | 2 |
| Menengah | `ARTICLE_MIDDLE` | 🖼️ Banner | Rp 100.000 | Rp 175.000 | Rp 300.000 | 2 |
| Ekonomi | `ARTICLE_BOTTOM` | 🖼️ Banner | Rp 75.000 | Rp 130.000 | Rp 225.000 | 2 |

**Diskon otomatis:** 14 hari ~12.5%, 30 hari ~25%

**Bundle:**
- Homepage Only (HOME_TOP + HOME_FEED_1 + HOME_FEED_2): diskon 19%
- Article Only (ARTICLE_TOP + ARTICLE_MIDDLE + ARTICLE_BOTTOM): diskon 21%
- All-In (semua 6 slot): diskon 34%

### 16.2 Dashboard Admin

| Komponen | Status |
|----------|--------|
| AdsPackagesContent | ✅ — form create/edit dengan tier badge |
| AdsSlotsContent | ✅ — 6 card grid dengan multi-iklan |
| AdsOverviewContent | ✅ — 4 menu (Slots, Packages, Bookings, Production) |
| AdSlotCard | ✅ — dynamic aspect ratio, video preview, format/tier badge, **modal preview** |
| HeroBannerManager | ✅ — tier + format badge |
| AdsMarketingPage | ✅ — tier badge, format display |
| StudioCanvas | ✅ — upload logo+foto untuk HOME_TOP, availability check |
| BookingReviewList | ✅ — 5-item checklist |
| AdvertiserAdsView | ✅ — stats + chart |

### 16.3 Checklist Eksekusi

```
[x] Diskusi & tentukan harga per slot (7/14/30 hari)
[x] Harga diisi manual lewat dashboard (bukan seed data)
[x] Update AdsMarketingPage — tier badge, format display
[x] Update AdsPackagesContent — form create/edit paket
[x] Update AdsSlotsContent — 6 card grid dengan multi-iklan
[x] Update AdSlotCard — dynamic aspect ratio, video preview
[x] Update AdsOverviewContent — 4 menu + stats
[x] E2E test — booking flow dengan slot baru
[x] Deploy ke production
```

---

---

*Dokumentasi terakhir diperbarui: **2 Juli 2026** — perbaiki banner terpotong (container fixed height → aspect-ratio dinamis untuk semua slot), HOME_TOP responsive `max-w-[960px] aspect-[4/1]`, smart crop selalu aktif untuk semua rasio gambar (`ASPECT_RATIO_TOLERANCE` 0.15 → 1.0), user bebas upload gambar berukuran apa pun tanpa sisa kiri-kanan*
