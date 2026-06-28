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
| **HOME_TOP** | 960 × 240 px | 728 × 182 px | 360 × 90 px | 4:1 | Besar |
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

> **Prinsip**: Tidak ada gambar yang ditolak. Gambar kecil di-upscale, rasio beda di-handle dengan palette gradient background.

### 2.5 Responsive Rendering di Frontend

Komponen `AdSpace` menggunakan `<picture>` element untuk responsive images:

```html
<picture>
  <source media="(max-width: 768px)" srcset="...mobile.webp" />
  <source media="(max-width: 1024px)" srcset="...tablet.webp" />
  <img src="...desktop.webp" />
</picture>
```

`HOME_TOP` juga **sticky di mobile** (fixed bottom viewport, closeable setelah 5 detik).

### 2.6 Strategi Slot Mobile — Penamaan Berbasis Lokasi

> **Prinsip:** Jangan beri nama slot berdasarkan ukuran (misal `970x250`). Beri nama berdasarkan **lokasi penempatan** agar sistem dapat menyesuaikan ukuran secara otomatis per device tanpa mengubah nama slot. **Tidak ada slot sidebar** — semua iklan berada di dalam alur konten.

#### Konvensi Penamaan Slot

| Slot Name | Deskripsi | Desktop | Mobile | Varian |
|-----------|-----------|---------|--------|--------|
| `HOME_TOP` | Hero banner homepage | 960 × 240 | 360 × 90 | Besar |
| `HOME_FEED_1` | Di tengah feed (setelah 6-8 berita) | 300 × 200 | 300 × 200 | Sedang |
| `HOME_FEED_2` | Di bawah feed (setelah 12-15 berita) | 300 × 150 | 300 × 150 | Kecil |
| `ARTICLE_TOP` | Atas artikel (setelah paragraf ke-3) | 300 × 200 | 300 × 200 | Sedang |
| `ARTICLE_MIDDLE` | Tengah artikel (setelah paragraf ke-8) | 300 × 150 | 300 × 150 | Kecil |
| `ARTICLE_BOTTOM` | Bawah artikel (sebelum artikel terkait) | 300 × 150 | 300 × 150 | Kecil |

> **Manfaat:** Paket iklan yang dijual tetap 6 slot. Sistem secara otomatis menampilkan ukuran yang sesuai untuk desktop atau mobile. Pengelolaan, pelaporan, dan penjualan jadi jauh lebih mudah.

#### Layout Homepage Mobile

```
────────────────────
Header
────────────────────

Hero Banner (HOME_TOP)
360 × 90

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
             │
             ▼
   Cek rasio aspek vs target slot
         │
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

### 3.2 Palette Gradient Background

Saat rasio gambar berbeda dengan slot, sistem:
1. Extract warna dominan dari gambar (sampling 50×50 px)
2. Generate gradient SVG (radial: terang di tengah, gelap di pinggir)
3. Resize gambar proporsional (contain) dengan padding 5%
4. Composite gambar di atas gradient

Hasil: banner profesional yang terlihat disengaja, bukan blur workaround.

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
| **Impresi** | `POST /api/v1/ads/track/<id>?action=impression` (satu kali per ad ID per page load) |
| **Klik** | `POST /api/v1/ads/track/<id>?action=click` (via `navigator.sendBeacon`) |
| **A/B Testing** | Random variant per session (sessionStorage), use `winnerVariant` if set |
| **Animation** | `ken_burns`, `fade_slide`, `parallax`, `pulse_scale` |
| **Video** | Auto-detect `.mp4/.webm/.ogg/.mov`, render `<video autoPlay loop muted>` |
| **Script** | Sandboxed iframe `allow-scripts allow-popups` |
| **Sticky Mobile** | HOME_TOP fixed bottom, closeable after 5 detik |
| **Fallback** | CMS fallback dari `/api/v1/ads/fallback` → showcase components |

### 4.2 Showcase Fallbacks

| Komponen | File | Slot |
|----------|------|------|
| `BillboardShowcase` | `components/ui/BillboardShowcase.tsx` | HOME_TOP |
| `FeedShowcase1` | `components/ui/FeedShowcase1.tsx` | HOME_FEED_1 |
| `FeedShowcase2` | `components/ui/FeedShowcase2.tsx` | HOME_FEED_2 |
| `ArticleTopShowcase` | `components/ui/ArticleTopShowcase.tsx` | ARTICLE_TOP |
| `ArticleMiddleShowcase` | `components/ui/ArticleMiddleShowcase.tsx` | ARTICLE_MIDDLE |
| `ArticleBottomShowcase` | `components/ui/ArticleBottomShowcase.tsx` | ARTICLE_BOTTOM |

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

### 4.4 Admin Components

| Komponen | File | Fungsi |
|----------|------|--------|
| `AdsSlotsContent` | `dashboard/ads/pages/AdsSlotsContent.tsx` | **Card Grid layout** — 6 slot cards dengan preview, stats, single upload |
| `AdSlotCard` | `dashboard/ads/AdSlotCard.tsx` | **Production card** — preview iklan aktif per slot (HOME_TOP, HOME_FEED_1, dst.), stats (impresi/klik/CTR), upload → auto-generate, device badge |
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
  animationEffect   String?  // 'ken_burns' | 'fade_slide' | 'parallax' | 'pulse_scale'
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
  imageUrl        String?
  imageUrlTablet  String?
  imageUrlMobile  String?
  linkUrl         String?
  animationEffect String?
  startDate       DateTime
  endDate         DateTime
  paymentStatus   PaymentStatus @default(PENDING)
  paymentProof    String?
  snapToken       String?
  externalOrderId String?
  status          AdStatus      @default(PENDING_REVIEW)
  rejectionNotes  String?
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
   🎨 Backend auto-generate semua variant:
   → Desktop (970×250 / 300×250 / 300×200 / 300×150)
   → Tablet (728×100 / 300×250 / 300×200 / 300×150)
   → Mobile (320×100 / 300×250 / 300×200 / 300×150)
   → Return semua URL + warnings
      ↓
   📐 Preview muncul otomatis:
   → 3 gambar berdampingan (desktop/tablet/mobile)
   → Cross-slot preview ("Juga cocok untuk slot lain")
   → Warning jika gambar kecil / rasio beda
      ↓
6. Pilih Efek Animasi (Ken Burns / Fade Slide / Parallax / Pulse)
      ↓
7. Submit Booking (dengan semua variant URLs)
      ↓
8. Pembayaran (opsional saat submit):
   - Midtrans Snap (VA, e-wallet, QRIS, kartu kredit)
   - Manual transfer + upload bukti
      ↓
9. Admin Review (5-item checklist):
   - [ ] Tidak misleading
   - [ ] Tidak SARA/prohibited
   - [ ] Ukuran sesuai
   - [ ] URL aktif
   - [ ] Tidak melanggar hak cipta
      ↓
10. Approve → Auto-generate variant (jika belum ada) → Auto-sync ke Advertisement → Notifikasi email + in-app
      ↓
11. Iklan Tayang — HOME_TOP: video 12 detik, banner: rotasi 7 detik (random, fade, tanpa indikator)
      ↓
12. Analytics (impresi, klik, CTR per hari)
      ↓
13. Auto-Expiry (cron hourly, endDate lewat → nonaktif)
```

---

## 7A. HOME_TOP — Video Creative Service

> **Keputusan (28 Juni 2026):** Slot `HOME_TOP` menggunakan model **layanan kreatif**. Advertiser tidak upload video, melainkan **logo + foto**. Tim kreatif BeritaKarya yang memproduksi video iklan.

### 7A.1 Mengapa Model Ini?

| Alasan | Penjelasan |
|--------|------------|
| **Mudah dipasarkan** | Marketing cukup bilang: *"Slot paling premium, kami buatkan video iklan Anda, cukup kirim logo dan foto"* |
| **Kualitas terjamin** | Video dibuat oleh tim internal, bukan tergantung upload advertiser |
| **Rasio konsisten** | Video didesain khusus untuk 960×240 (desktop), 728×182 (tablet), 360×90 (mobile) — semua 4:1 |
| **Harga premium terjustifikasi** | Advertiser mendapat produk jadi, bukan slot kosong |
| **Ringan untuk advertiser** | UMKM tidak perlu punya kemampuan produksi video |

### 7A.2 Alur HOME_TOP (Berbeda dari Slot Banner)

```
Advertiser buka Ad Studio → Pilih paket HOME_TOP
        ↓
Upload LOGO + FOTO (bukan video)
        ↓
Isi detail kampanye (nama, URL, tanggal)
        ↓
Submit booking + pembayaran
        ↓
Admin review → approve
        ↓
Tim kreatif produksi video
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

### 7A.3 Aturan Grace Period & Revisi

| Aturan | Detail |
|--------|--------|
| **Grace period** | 24-48 jam setelah notifikasi video ready |
| **Maks revisi** | 1 kali |
| **Auto-close** | Jika tidak ada feedback dalam grace period → dianggap setuju |
| **Revisi berlebih** | Lebih dari 1x → tetap tayang, catatan ditambahkan ke log |
| **Komunikasi** | Semua via sistem (notifikasi email + in-app), ada jejak |

### 7A.4 Perubahan Database (AdBooking)

Tambah field berikut ke model `AdBooking`:

```prisma
model AdBooking {
  // ... field yang ada ...
  previewUrl     String?    // Link preview video untuk advertiser
  revisionCount  Int        @default(0) // Jumlah revisi (maks 1)
  creativeNotes  String?    // Catatan dari tim kreatif untuk advertiser
}
```

### 7A.5 Perbedaan Flow HOME_TOP vs Slot Banner

| Aspek | HOME_TOP (Video) | Slot Lain (Banner) |
|-------|------------------|---------------------|
| **Upload advertiser** | Logo + foto | Gambar langsung |
| **Produksi** | Tim kreatif BeritaKarya | Sistem auto-generate variant |
| **Status saat produksi** | `PENDING_REVIEW` → `ACTIVE` | `PENDING_REVIEW` → `ACTIVE` |
| **Preview untuk advertiser** | Ya (video preview link) | Ya (cross-slot preview) |
| **Revisi** | Maks 1x (grace period 24-48 jam) | Tidak ada |
| **Format akhir** | Video MP4 (kita kontrol) | Gambar WebP (auto-process) |

### 7A.6 Perubahan Komponen Ad Studio

| Komponen | Perubahan |
|----------|-----------|
| `StudioCanvas` (Step 3) | Jika slot = `HOME_TOP` → tampilkan form upload **logo + foto** (bukan video) |
| `StudioCanvas` (Step 4) | Tambah catatan: *"Tim kreatif kami akan membuat video dalam 1-2 hari kerja"* |
| `AdvertiserAdsView` | Tambah kolom `previewUrl` → tombol "Preview Video" saat grace period |
| `BookingReviewList` | Tambah info: *"Menunggu produksi video oleh tim kreatif"* |

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
| 12 | Permission wapimred approve | 🟢 Kecil (0.5 hari) |
| 13 | Rate limit booking creation | ✅ Selesai |
| 14 | Error handling order flow | ✅ Selesai |
| 15 | Smart image processing (palette gradient) | ✅ Selesai |
| 16 | Ad preview semua slot | ✅ Selesai |
| 17 | Upscale pipeline (Replicate → Sharp → gradient) | ✅ Selesai |
| 18 | HOME_TOP: upload logo+foto (bukan video) | 🔴 Belum (butuh perubahan Ad Studio) |
| 19 | HOME_TOP: grace period & revisi 1x | 🔴 Belum (butuh field baru + cron) |
| 20 | HOME_TOP: previewUrl untuk advertiser | 🔴 Belum (butuh field + UI) |

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
| `apps/api/src/modules/ad/ad.controller.ts` | Semua endpoint ads + `generateVariantsFromUrl` helper |
| `apps/api/src/modules/ad/ad.repository.ts` | Prisma data access |
| `apps/api/src/modules/ad/ad.service.ts` | Impresi dedup, booking sync |
| `apps/api/src/lib/ad-image-processor.ts` | Smart image processing, video validation, parallel previews |
| `apps/api/src/modules/media/media.controller.ts` | Upload endpoint + `/upload-ad` (single → all variants) |
| `apps/api/src/cron/ad-expiry.ts` | Auto-expiry cron |
| `apps/api/src/services/midtrans.service.ts` | Midtrans integration |
| `apps/web/components/ui/AdSpace.tsx` | Komponen iklan publik |
| `apps/web/components/dashboard/ads/studio/` | Ad Studio wizard (single upload + preview) |
| `apps/web/components/dashboard/ads/AdSlotCard.tsx` | Admin production card (preview, stats, upload) |
| `apps/web/components/dashboard/ads/pages/AdsSlotsContent.tsx` | Admin Card Grid layout |
| `apps/web/lib/constants.ts` | Slot definitions — ukuran, format, tier (frontend mirror of config) |
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
Rasio cocok         Rasio beda
    │                    │
    ▼                    ▼
Smart Crop          Palette Gradient
(fit: cover)        (warna brand → gradient)
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

## 16. Plan Selanjutnya: Pricing & Dashboard Admin

> **Status:** Belum diimplementasikan. Dibutuhkan diskusi harga sebelum eksekusi.

### 16.1 Struktur Harga Baru

Saat ini harga iklan di database masih mengikuti slot lama. Perlu ditentukan harga untuk 6 slot baru:

| Slot | Posisi | Estimasi Visibilitas | Harga? |
|------|--------|---------------------|--------|
| `HOME_TOP` | Hero banner homepage | Paling tinggi (first fold) | **Perlu diskusi** |
| `HOME_FEED_1` | Feed homepage atas | Tinggi | **Perlu diskusi** |
| `HOME_FEED_2` | Feed homepage bawah | Sedang | **Perlu diskusi** |
| `ARTICLE_TOP` | Atas artikel (paragraf 3) | Tinggi (pembaca sudah engaged) | **Perlu diskusi** |
| `ARTICLE_MIDDLE` | Tengah artikel (paragraf 8) | Sedang-tinggi | **Perlu diskusi** |
| `ARTICLE_BOTTOM` | Bawah artikel (sebelum related) | Sedang | **Perlu diskusi** |

**Pertimbangan:**
- Harga berdasarkan durasi (7/14/30 hari) atau berdasarkan impresi (CPM)?
- Paket bundle (homepage only, article only, all-in)?
- Diskon untuk paket bulanan?
- Harga berbeda per slot atau tier (premium/standard/economy)?

### 16.2 Dashboard Admin yang Perlu Diupdate

| Komponen | File | Perubahan |
|----------|------|-----------|
| **AdsPackagesContent** | `pages/AdsPackagesContent.tsx` | Slot dropdown sudah update, tapi form & deskripsi paket perlu disesuaikan dengan harga baru |
| **AdsSlotsContent** | `pages/AdsSlotsContent.tsx` | Layout card grid — pastikan 6 slot cards tampil dengan benar |
| **AdsOverviewContent** | `pages/AdsOverviewContent.tsx` | Stats cards — mungkin perlu breakdown per slot |
| **AdSlotCard** | `AdSlotCard.tsx` | Preview & stats per slot — pastikan ukuran preview sesuai slot baru |
| **HeroBannerManager** | `HeroBannerManager.tsx` | Sudah di-rename, pastikan carousel berfungsi untuk HOME_TOP |
| **AdsMarketingPage** | `AdsMarketingPage.tsx` | Halaman publik pricing — update deskripsi, harga, dan CTA untuk 6 slot |
| **StudioCanvas** | `studio/StudioCanvas.tsx` | Preview mockup — sudah update, verifikasi visual |
| **BookingReviewList** | `BookingReviewList.tsx` | Admin review — pastikan menampilkan slot name baru |
| **AdvertiserAdsView** | `AdvertiserAdsView.tsx` | Dashboard advertiser — stats per booking |

### 16.3 Checklist Eksekusi

```
[ ] Diskusi & tentukan harga per slot (7/14/30 hari)
[ ] Update AdPackage seed data dengan harga baru
[ ] Update AdsMarketingPage — deskripsi, harga, highlight per slot
[ ] Update AdsPackagesContent — form create/edit paket
[ ] Update AdsSlotsContent — verifikasi 6 card grid
[ ] Update AdSlotCard — preview size sesuai slot
[ ] Update AdsOverviewContent — stats breakdown
[ ] E2E test — booking flow dengan slot baru
[ ] Deploy ke production
```

---

*Dokumentasi terakhir diperbarui: 27 Juni 2026 — update ukuran slot artikel descending (300×250, 300×200, 300×150)*
