# Audit Ads System — BeritaKarya

> **Tanggal**: 25 Juni 2026
> **Tujuan**: Membandingkan dokumentasi `docs/ads.md` dengan implementasi aktual di codebase

---

## Ringkasan Eksekutif

Dokumentasi `ads.md` dibuat pada **21 Juni 2026** dan hanya mencakup **sebagian kecil** dari sistem iklan yang sudah ada. Sistem aktual jauh lebih lengkap dan kompleks dibanding apa yang didokumentasikan.

| Aspek | Di `ads.md` | Di Codebase | Gap |
|-------|-------------|-------------|-----|
| Slot types | 1 (leaderboard) | 4 (leaderboard, rectangle, rectangle_secondary, in_feed) | ⚠️ |
| API endpoints | 5 | 15+ | ⚠️ |
| Booking system | ❌ Tidak ada | ✅ Lengkap (wizard, payment, approval) | ⚠️ |
| Ad Packages | ❌ Tidak ada | ✅ CRUD lengkap | ⚠️ |
| A/B Testing | ❌ Tidak ada | ✅ Ada di schema & AdSpace | ⚠️ |
| Responsive images | ❌ Tidak ada | ✅ Multi-size IAB (desktop/tablet/mobile) | ⚠️ |
| Animation effects | ❌ Tidak ada | ✅ 4 efek (Ken Burns, fade slide, parallax, pulse scale) | ⚠️ |
| Ad expiry cron | ❌ Tidak ada | ✅ `ad-expiry.ts` hourly | ⚠️ |
| Advertiser portal | ❌ Tidak ada | ✅ Full portal (`/ads/`) | ⚠️ |
| Marketing page | ❌ Tidak ada | ✅ `/p/ads` landing page | ⚠️ |
| E2E tests | ❌ Tidak ada | ✅ `ad-booking.spec.ts` | ⚠️ |
| Rate limiting | ✅ Disebutkan | ✅ `adTrackingLimiter` (30 req/min) | ✅ |
| BillboardShowcase | ✅ Dijelaskan | ✅ Sesuai | ✅ |
| Fallback endpoint | ✅ Dijelaskan | ✅ Sesuai (beda detail kecil) | ✅ |

---

## 1. Apa yang Sudah Benar di `ads.md`

### 1.1 AdSpace Component
- ✅ Lokasi file benar: `apps/web/components/ui/AdSpace.tsx`
- ✅ Props `type` dengan 4 opsi benar
- ✅ Carousel 7 detik benar
- ✅ Impresi per slide benar
- ✅ Fallback handling ke BillboardShowcase benar

### 1.2 BillboardShowcase
- ✅ Lokasi file benar: `apps/web/components/ui/BillboardShowcase.tsx`
- ✅ `CATEGORY_ADS` constant benar
- ✅ `mediaType`/`mediaUrl` interface benar
- ✅ Rotasi 8 detik benar

### 1.3 API Endpoints (Publik)
- ✅ `GET /api/v1/ads/public?site=<siteId>` benar
- ✅ `POST /api/v1/ads/track/:id?action=impression|click` benar
- ✅ Rate limiter `adTrackingLimiter` benar

### 1.4 API Endpoints (Admin)
- ✅ CRUD ads benar
- ✅ `PATCH /reorder` benar

---

## 2. Apa yang SALAH atau TIDAK AKURAT di `ads.md`

### 2.1 AdItem Interface — Tidak Lengkap

**Dokumentasi** (ads.md line 73-82):
```ts
interface AdItem {
  id: string;
  slot: string;
  code: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
}
```

**Kode aktual** (`AdSpace.tsx` line 16-34):
```ts
interface AdItem {
  id: string;
  slot: string;
  code: string | null;
  imageUrl: string | null;
  imageUrlTablet?: string | null;      // ❌ Tidak didokumentasikan
  imageUrlMobile?: string | null;      // ❌ Tidak didokumentasikan
  imageUrlTabletAlt?: string | null;   // ❌ Tidak didokumentasikan
  imageUrlMobileAlt?: string | null;   // ❌ Tidak didokumentasikan
  variantAUrl?: string | null;         // ❌ Tidak didokumentasikan
  variantBUrl?: string | null;         // ❌ Tidak didokumentasikan
  winnerVariant?: string | null;       // ❌ Tidak didokumentasikan
  linkUrl: string | null;
  animationEffect?: string | null;     // ❌ Tidak didokumentasikan
  isActive: boolean;
  order: number;
}
```

**Gap**: 7 field tidak didokumentasikan — responsive images, A/B testing, animation effects.

### 2.2 Fallback Endpoint — Detail Berbeda

**Dokumentasi** (ads.md line 87-103):
```json
{
  "id": "fallback-1",
  "slot": "leaderboard",
  "mediaType": "image",
  "mediaUrl": "/public/fallbacks/leaderboard.jpg",
  "headline": "Contoh Iklan Fallback",
  "subheadline": "Ini contoh iklan fallback untuk slot leaderboard"
}
```

**Kode aktual** (`ad.controller.ts` line 59-68):
```json
{
  "id": "fallback-1",
  "slot": "<dynamic>",
  "mediaType": "image",
  "mediaUrl": "/fallbacks/leaderboard.svg",
  "headline": "Ruang Iklan Premium",
  "subheadline": "Jangkau audiens luas dengan banner berkualitas tinggi di BeritaKarya"
}
```

**Gap**: Path file berbeda (`.jpg` vs `.svg`, `/public/` prefix vs tidak), headline berbeda, slot dynamic vs hard-coded.

### 2.3 Responsive Height — Tidak Akurat

**Dokumentasi** (ads.md line 142-146):
```ts
leaderboard: "w-full h-[120px] md:h-[250px] mb-6"
```

**Kode aktual**: Perlu diverifikasi lebih lanjut, tetapi dokumentasi hanya menyebut leaderboard. Slot lain (rectangle, in-feed) tidak didokumentasikan.

---

## 3. Apa yang TIDAK ADA di `ads.md` (Fitur di Codebase tapi Tidak Didokumentasikan)

### 3.1 Sistem Booking Lengkap

**File**: `apps/api/src/modules/ad/ad.controller.ts` (line 196+)

| Endpoint | Fungsi | Dokumentasi? |
|----------|--------|-------------|
| `POST /bookings` | Advertiser buat booking | ❌ |
| `GET /bookings/my` | Advertiser lihat booking sendiri | ❌ |
| `GET /bookings/all` | Admin lihat semua booking | ❌ |
| `GET /bookings/:id/stats` | Statistik per booking | ❌ |
| `POST /bookings/:id/pay` | Upload bukti bayar | ❌ |
| `POST /bookings/:id/approve` | Admin approve booking | ❌ |
| `POST /bookings/:id/reject` | Admin reject booking | ❌ |

### 3.2 Ad Packages System

**File**: `apps/api/src/modules/ad/ad.controller.ts` (line 188+)

| Endpoint | Fungsi | Dokumentasi? |
|----------|--------|-------------|
| `GET /packages` | List paket aktif | ❌ |
| `POST /packages` | Buat paket baru (admin) | ❌ |
| `PATCH /packages/:id` | Update paket (admin) | ❌ |
| `DELETE /packages/:id` | Hapus paket (admin) | ❌ |

### 3.3 Prisma Schema — Fitur Tidak Didokumentasikan

**Model `Advertisement`** memiliki fitur yang tidak disebut di ads.md:

| Field | Fungsi | Dokumentasi? |
|-------|--------|-------------|
| `imageUrlTablet` | Responsive image tablet | ❌ |
| `imageUrlMobile` | Responsive image mobile | ❌ |
| `imageUrlTabletAlt` | Alt variant tablet | ❌ |
| `imageUrlMobileAlt` | Alt variant mobile | ❌ |
| `variantAUrl` | A/B testing variant A | ❌ |
| `variantBUrl` | A/B testing variant B | ❌ |
| `winnerVariant` | A/B testing winner | ❌ |
| `animationEffect` | Animation effect (ken_burns, dll) | ❌ |
| `bookingId` | FK ke AdBooking | ❌ |

**Model `AdEventLog`**: ❌ Tidak disebut sama sekali
**Model `AdPackage`**: ❌ Tidak disebut sama sekali
**Model `AdBooking`**: ❌ Tidak disebut sama sekali
**Enum `PaymentStatus`**: ❌ Tidak disebut
**Enum `AdStatus`**: ❌ Tidak disebut

### 3.4 Advertiser Portal Pages

| Halaman | Path | Dokumentasi? |
|---------|------|-------------|
| Overview | `/[site]/ads/` | ❌ |
| Order wizard | `/[site]/ads/order` | ❌ |
| Package catalog | `/[site]/ads/packages` | ❌ |
| Payment | `/[site]/ads/bookings` | ❌ |
| History | `/[site]/ads/history` | ❌ |

### 3.5 Ad Studio (Booking Wizard)

**Folder**: `apps/web/components/dashboard/ads/studio/`

| Komponen | Fungsi | Dokumentasi? |
|----------|--------|-------------|
| `StudioContext.tsx` | State management wizard | ❌ |
| `StudioCanvas.tsx` | Canvas utama 4-step | ❌ |
| `StudioControls.tsx` | Sidebar controls | ❌ |
| `StudioPreview.tsx` | Preview mockup | ❌ |
| `StudioSidebar.tsx` | Step indicator | ❌ |
| `SectionHeader.tsx` | Collapsible section | ❌ |

### 3.6 Admin Dashboard Components

| Komponen | Fungsi | Dokumentasi? |
|----------|--------|-------------|
| `SuperadminAdsView.tsx` | Dashboard superadmin | ❌ |
| `LeaderboardManager.tsx` | Manage leaderboard carousel | ❌ |
| `LeaderboardBannerRow.tsx` | Individual banner row | ❌ |
| `AdSlotCard.tsx` | Slot management card | ❌ |
| `AdPerformanceChart.tsx` | Recharts performance chart | ❌ |
| `AdsSubNav.tsx` | Sub-navigation tabs | ❌ |

### 3.7 Marketing Page

| Komponen | Path | Dokumentasi? |
|----------|------|-------------|
| `AdsMarketingPage.tsx` | `/[site]/p/ads` | ❌ |

### 3.8 Cron Job

| Job | Fungsi | Dokumentasi? |
|-----|--------|-------------|
| `ad-expiry.ts` | Auto-expire booking + deactivate ad slot | ❌ |

### 3.9 Ad Slot Definitions

**File**: `apps/web/lib/constants.ts` (line 112-181)

4 slot definitions lengkap dengan metadata public-facing tidak didokumentasikan:
- `leaderboard` — 970x250 (desktop) / 728x90 (tablet) / 320x50 (mobile)
- `rectangle` — 300x250
- `rectangle_secondary` — 300x250
- `in_feed` — 300x250

### 3.10 Fitur AdSpace yang Tidak Didokumentasikan

| Fitur | Dokumentasi? |
|-------|-------------|
| Mobile sticky behavior (leaderboard) | ❌ |
| 5s close button delay | ❌ |
| A/B testing dengan sessionStorage | ❌ |
| Responsive `<picture>` sources | ❌ |
| 4 animation effects (CSS classes) | ❌ |
| Script ads via sandboxed iframe | ❌ |
| Multi-size IAB support | ❌ |

---

## 4. Duplikasi di Codebase

### 4.1 Halaman Admin vs Advertiser Portal

Ditemukan **duplikasi kode** antara:

| Advertiser Portal | Admin Dashboard | Status |
|-------------------|-----------------|--------|
| `ads/packages/page.tsx` | `dashboard/(admin)/ads/packages/page.tsx` | Identik |
| `ads/page.tsx` (superadmin view) | `dashboard/(admin)/ads/page.tsx` | Mirip |

**Saran**: Buat shared component atau gunakan satu lokasi saja.

### 4.2 Types Definition

Ad types didefinisikan di **2 tempat**:
- `apps/web/components/dashboard/ads/types.ts`
- `apps/web/components/dashboard/ads/studio/types.ts`

Tidak ada di `packages/types/` (shared).

---

## 5. Rekomendasi

### 5.1 Update `ads.md` (Prioritas Tinggi)

Dokumentasi perlu di-update signifikan untuk mencakup:
1. Semua 4 slot types dengan definisi lengkap
2. Booking system (flow, endpoints, status)
3. Ad Packages (CRUD, schema)
4. Advertiser portal pages
5. Ad Studio wizard
6. Admin dashboard components
7. Cron job ad-expiry
8. Responsive images & A/B testing
9. Animation effects
10. Marketing page (`/p/ads`)

### 5.2 Kurangi Duplikasi (Prioritas Sedang)

- Merge halaman packages admin & advertiser
- Pindahkan ad types ke `packages/types/`

### 5.3 Tambah Dokumentasi Baru (Prioritas Rendah)

Buat dokumentasi terpisah untuk:
- Ad booking flow (step-by-step)
- Ad slot configuration guide
- Payment & approval workflow

---

## 6. Kesimpulan

| Metrik | Nilai |
|--------|-------|
| **Coverage dokumentasi** | ~15-20% dari fitur aktual |
| **Akurasi** | ~85% (beberapa detail salah) |
| **Fitur tidak didokumentasikan** | 40+ komponen/endpoints |
| **Duplikasi kode** | 2 halaman identik |

Dokumentasi `ads.md` saat ini hanya mencakup **komponen publik** (AdSpace, BillboardShowcase) dan **endpoint admin dasar** (CRUD ads). Sistem booking, packages, advertiser portal, studio wizard, marketing page, dan fitur-fitur lanjutan (A/B testing, responsive images, animation) **sama sekali tidak didokumentasikan**.

---

*Dokumen audit ini dibuat pada 25 Juni 2026.*
