# Dokumentasi Sistem Iklan (Ads) — BeritaKarya

Dokumen tunggal yang merangkum seluruh sistem periklanan BeritaKarya: arsitektur, slot iklan, ukuran, API, komponen frontend, image processing, alur pengiklan, dan status perbaikan.

---

## 1. Ringkasan Sistem

| Komponen | Keterangan |
|----------|------------|
| **AdSpace** (frontend) | Komponen React yang fetch iklan publik, render banner gambar/video/script HTML, carousel 7 detik, tracking impresi & klik |
| **Ad Studio** (frontend) | Wizard 4 langkah: Pilih Paket → Detail Iklan → **Upload 1 File** (auto-generate semua variant) → Pembayaran |
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

| Slot ID | Nama Lokasi | Penempatan | Rotasi |
|---------|-------------|------------|--------|
| `HOME_TOP` | Hero Banner | Homepage atas (billboard utama) | ✅ Multi-iklan |
| `HOME_FEED_1` | Feed Atas | Homepage, setelah headline (posisi 6-8 berita) | ✅ Multi-iklan |
| `HOME_FEED_2` | Feed Bawah | Homepage, setelah 12-15 berita | ✅ Multi-iklan |
| `ARTICLE_TOP` | Artikel Atas | Halaman artikel, setelah paragraf ke-3 | ✅ Multi-iklan |
| `ARTICLE_MIDDLE` | Artikel Tengah | Halaman artikel, setelah paragraf ke-8 | ✅ Multi-iklan |
| `ARTICLE_BOTTOM` | Artikel Bawah | Halaman artikel, sebelum artikel terkait | ✅ Multi-iklan |

> **Catatan Migrasi:** Slot lama (`leaderboard`, `rectangle`, `rectangle_secondary`, `in_feed`) perlu di-migrate ke nama lokasi baru di database dan API. Slot sidebar (`rectangle`, `rectangle_secondary`) **dihapus** dan digantikan oleh `HOME_FEED_1`, `HOME_FEED_2`, `ARTICLE_TOP`, dan `ARTICLE_BOTTOM`.

### 2.2 Ukuran Per Breakpoint

| Slot | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| **HOME_TOP** | 970 × 250 px | 728 × 100 px | 320 × 100 px |
| **HOME_FEED_1** | 300 × 250 px | 300 × 250 px | 300 × 250 px |
| **HOME_FEED_2** | 300 × 250 px | 300 × 250 px | 300 × 250 px |
| **ARTICLE_TOP** | 300 × 250 px | 300 × 250 px | 300 × 250 px |
| **ARTICLE_MIDDLE** | 300 × 200 px | 300 × 200 px | 300 × 200 px |
| **ARTICLE_BOTTOM** | 300 × 150 px | 300 × 150 px | 300 × 150 px |

> **Catatan Slot Artikel**: Semua slot artikel menggunakan lebar konsisten 300 px dengan tinggi bervariasi (descending: 250 → 200 → 150). Ini memberikan visual rhythm yang profesional — iklan paling besar di awal, makin kecil di bawah. Ukuran seragam di semua device.

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
| HOME_TOP | Tablet | 250 px | 40 px | Sistem akan upscale + gradient jika kecil |
| HOME_TOP | Mobile | 200 px | 30 px | Sistem akan upscale + gradient jika kecil |
| HOME_FEED_1 | Semua | 150 px | 125 px | Sistem akan upscale + gradient jika kecil |
| HOME_FEED_2 | Semua | 150 px | 125 px | Sistem akan upscale + gradient jika kecil |
| ARTICLE_TOP | Semua | 150 px | 125 px | Sistem akan upscale + gradient jika kecil |
| ARTICLE_MIDDLE | Semua | 150 px | 100 px | Sistem akan upscale + gradient jika kecil |
| ARTICLE_BOTTOM | Semua | 150 px | 75 px | Sistem akan upscale + gradient jika kecil |

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

| Slot Name | Deskripsi | Desktop | Mobile |
|-----------|-----------|---------|--------|
| `HOME_TOP` | Hero banner homepage | 970 × 250 | 320 × 100 |
| `HOME_FEED_1` | Di tengah feed (setelah 6-8 berita) | 300 × 250 | 300 × 250 |
| `HOME_FEED_2` | Di bawah feed (setelah 12-15 berita) | 300 × 250 | 300 × 250 |
| `ARTICLE_TOP` | Atas artikel (setelah paragraf ke-3) | 300 × 250 | 300 × 250 |
| `ARTICLE_MIDDLE` | Tengah artikel (setelah paragraf ke-8) | 300 × 200 | 300 × 200 |
| `ARTICLE_BOTTOM` | Bawah artikel (sebelum artikel terkait) | 300 × 150 | 300 × 150 |

> **Manfaat:** Paket iklan yang dijual tetap 6 slot. Sistem secara otomatis menampilkan ukuran yang sesuai untuk desktop atau mobile. Pengelolaan, pelaporan, dan penjualan jadi jauh lebih mudah.

#### Layout Homepage Mobile

```
────────────────────
Header
────────────────────

Hero Banner (HOME_TOP)
320 × 100

Headline

Berita 1
Berita 2

Banner (HOME_FEED_1)
300 × 250

Berita 3
Berita 4

Banner (HOME_FEED_2)
300 × 250

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
300 × 250

Paragraf 4
Paragraf 5
Paragraf 6
Paragraf 7
Paragraf 8

Banner (ARTICLE_MIDDLE)
300 × 200

Paragraf 9
Paragraf 10

Banner (ARTICLE_BOTTOM)
300 × 150

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
Upload gambar (ukuran apapun)
         │
         ▼
   Validasi format (JPG/PNG/WebP/GIF)
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
| **Carousel** | Auto-rotate 7 detik, pause on hover |
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
11. Iklan Tayang (carousel rotasi setiap 7 detik)
      ↓
12. Analytics (impresi, klik, CTR per hari)
      ↓
13. Auto-Expiry (cron hourly, endDate lewat → nonaktif)
```

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
| `apps/web/lib/constants.ts` | Slot definitions (lines 112-181) |
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

### Pipeline Saat Ini

```
Upload gambar → Extract warna → Cek rasio
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

**Kelebihan:** Cepat, gratis, konsisten, profesional.
**Kekurangan:** Gambar sangat kecil (< 200px) bisa sedikit blur setelah upscale biasa.

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

### Fase 1: AI Upscale via Replicate API (Minggu 3-4)

**Syarat:** Data Fase 0 menunjukkan > 10% upload gambar kecil.

**Kenapa Replicate (bukan self-hosted):**

| Aspek | Replicate | Self-hosted |
|-------|-----------|-------------|
| Setup | Tambah API key | Install Python + PyTorch + weights |
| Cocok dengan | LXC production | Butuh Docker atau install manual |
| Performa | 2-5 detik (GPU cloud) | 5-30 detik (CPU) |
| Biaya | ~Rp 30/gambar | Listrik + RAM server |
| Maintenance | Zero | Update model, monitor crash |

**Tugas:**

```
[ ] Daftar Replicate → buat API token → pilih model Real-ESRGAN x4plus
[ ] Tambah fungsi upscale di ad-image-processor.ts
[ ] Tambah dimensi checker sebelum pipeline rasio
[ ] Tambah env var: REPLICATE_API_TOKEN
[ ] Update AdSmartPreview.tsx → badge "AI Upscaled"
```

**Fallback chain:**
```
Replicate API gagal / timeout
    → Return gambar ASLI (tanpa upscale)
    → Lanjut pipeline Palette Gradient seperti biasa
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
Sekarang
   │
   ▼
[ Fase 0 ]  Minggu 1-2 — Logging data upload
   │
   ▼
[ Evaluasi ]  Minggu 3 — Analisis data → keputusan lanjut/stop
   │
   ├── < 10% bermasalah → STOP
   └── > 10% bermasalah → lanjut ↓
        │
        ▼
[ Fase 1 ]  Minggu 3-4 — Integrasi Replicate API
        │
        ▼
[ Fase 2 ]  Minggu 5-6 — Evaluasi cost → keputusan final
```

### Keputusan Teknis

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Cloud vs Self-hosted | **Replicate (cloud)** | Cocok dengan LXC, zero maintenance, cost rendah |
| Sync vs Async | **Sync** | Volume rendah, 5 detik masih acceptable |
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
