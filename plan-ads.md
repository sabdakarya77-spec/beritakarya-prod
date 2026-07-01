# Plan: Perbaikan Dashboard Ads

> **Tanggal:** 28 Juni 2026
> **Status:** ✅ SEMUA BATCH SELESAI (sisa #23 ditunda — tidak kritis)
> **Tujuan:** Menyeluruhkan dashboard ads dengan keputusan desain terbaru (ukuran, format, tier, config-based)

---

## Ringkasan Masalah

Audit dashboard ads menghasilkan **14 masalah** dari 8 file. Diprioritaskan berdasarkan severity.

---

## Prioritas 1: Critical (Bug Terlihat)

### 1. AdSlotCard — Aspect Ratio Hardcoded

**File:** `apps/web/components/dashboard/ads/AdSlotCard.tsx:172`

**Masalah:**
```tsx
// SAAT INI — salah untuk slot selain HOME_TOP
<div className="relative aspect-[960/240] ...">
```

**Solusi:**
```tsx
// HARUS — ambil rasio dari slot definition
const aspectMap: Record<string, string> = {
  HOME_TOP: 'aspect-[960/240]',      // 4:1
  HOME_FEED_1: 'aspect-[300/200]',   // 3:2
  ARTICLE_TOP: 'aspect-[300/200]',   // 3:2
  HOME_FEED_2: 'aspect-[300/150]',   // 2:1
  ARTICLE_MIDDLE: 'aspect-[300/150]', // 2:1
  ARTICLE_BOTTOM: 'aspect-[300/150]', // 2:1
};
<div className={cn("relative ...", aspectMap[slot.id] || 'aspect-[300/200]')}>
```

**Estimasi:** 15 menit

---

## Prioritas 2: Significant (Data Tidak Konsisten)

### 2. Studio Types — AdPackage Missing allowedFormat

**File:** `apps/web/components/dashboard/ads/studio/types.ts:1-9`

**Masalah:**
```tsx
export interface AdPackage {
  id: string;
  name: string;
  slot: string;
  durationDays: number;
  price: number | string;
  description: string | null;
  isActive: boolean;
  // ❌ allowedFormat tidak ada
}
```

**Solusi:** Tambah field `allowedFormat: string` ke interface.

**Estimasi:** 5 menit

### 3. StudioCanvas — Hardcoded sizeLabels

**File:** `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx:652-659`

**Masalah:** `sizeLabels` duplikat dari constants, bisa drift jika ukuran berubah.

**Solusi:** Hapus `sizeLabels`, gunakan `getAdSlotDefinition(slot)?.publicMockup`.

**Estimasi:** 10 menit

### 4. StudioPreview — Hardcoded dimensions

**File:** `apps/web/components/dashboard/ads/studio/StudioPreview.tsx:180-187`

**Masalah:** `dimensions` map duplikat dari constants.

**Solusi:** Ambil label dari `getAdSlotDefinition(slot)?.publicMockup`. Height classes tetap hardcoded (UI concern).

**Estimasi:** 10 menit

---

## Prioritas 3: Moderate (Display Kurang)

### 5-6. AdSlotCard — Tambah Badge Format & Tier

**File:** `apps/web/components/dashboard/ads/AdSlotCard.tsx`

**Solusi:** Tambah badge di card header:
```tsx
<span className="...">{slot.tier === 'PREMIUM' ? '⭐ Premium' : slot.tier}</span>
<span className="...">{slot.format === 'VIDEO' ? '🎥 Video' : '🖼️ Banner'}</span>
```

**Estimasi:** 15 menit

### 7-8. Studio Package List — Tambah Format Display

**File:** `StudioCanvas.tsx`, `StudioControls.tsx`

**Solusi:** Tambah badge format (🎥/🖼️) di samping nama paket dalam radio button.

**Estimasi:** 10 menit

### 9. StudioPreview — Tambah Format/Tier

**File:** `apps/web/components/dashboard/ads/studio/StudioPreview.tsx`

**Solusi:** Tambah format & tier badge di info bar preview.

**Estimasi:** 10 menit

### 10. AdsPackagesContent — Tambah Tier

**File:** `apps/web/components/dashboard/ads/pages/AdsPackagesContent.tsx`

**Solusi:** Tambah tier badge di package card.

**Estimasi:** 10 menit

### 11. AdsOverviewContent — Tambah Kolom Format/Tier

**File:** `apps/web/components/dashboard/ads/pages/AdsOverviewContent.tsx`

**Solusi:** Tambah kolom Format dan Tier di bookings table.

**Estimasi:** 15 menit

---

## Prioritas 4: Cleanup (Dead Code)

### 12-13. Hapus animationEffect Dead Code

**File:**
- `apps/web/components/dashboard/ads/studio/types.ts:54`
- `apps/web/components/dashboard/ads/studio/StudioContext.tsx:23`

**Solusi:**
```diff
// types.ts
- animationEffect: string;
// StudioContext.tsx
- animationEffect: '',
```

**Estimasi:** 5 menit

---

## Prioritas 5: Investigasi

### 14. AdsMarketingPage — File Tidak Ditemukan

**Masalah:** File `AdsMarketingPage.tsx` tidak ada di path yang diharapkan.

**Aksi:** Cari file dengan nama serupa, atau buat baru jika memang belum ada.

**Estimasi:** 15 menit (investigasi)

---

## Ringkasan Estimasi

| Prioritas | Jumlah | Estimasi |
|-----------|--------|----------|
| P1: Critical | 1 | 15 menit |
| P2: Significant | 3 | 25 menit |
| P3: Moderate | 5 | 60 menit |
| P4: Cleanup | 2 | 5 menit |
| P5: Investigasi | 1 | 15 menit |
| **Total** | **12** | **~2 jam** |

---

## Urutan Eksekusi

```
① Fix AdSlotCard aspect ratio (P1 — critical)
② Fix studio types + hardcoded labels (P2)
③ Cleanup animationEffect dead code (P4)
④ Tambah badge format/tier di semua komponen (P3)
⑤ Investigasi AdsMarketingPage (P5)
```

---

## Checklist

```
[x] 1. AdSlotCard: dynamic aspect ratio ✅ commit a94eb14
[x] 2. studio/types.ts: tambah allowedFormat ✅ commit b6c40a5
[x] 3. StudioCanvas: hapus hardcoded sizeLabels ✅ commit b6c40a5
[x] 4. StudioPreview: hapus hardcoded dimensions ✅ commit b6c40a5
[x] 5. AdSlotCard: badge format + tier ✅ commit 3ce1fd2
[x] 6. StudioCanvas: format di package list ✅ commit 3ce1fd2
[x] 7. StudioControls: format di package list ✅ commit 3ce1fd2
[x] 8. StudioPreview: format + tier di info bar ✅ commit 3ce1fd2
[x] 9. AdsPackagesContent: tier di package card ✅ commit 3ce1fd2
[x] 10. AdsOverviewContent: kolom format + tier ✅ commit 3ce1fd2
[x] 11. types.ts: hapus animationEffect ✅ commit b6c40a5
[x] 12. StudioContext.tsx: hapus animationEffect init ✅ commit b6c40a5
[x] 13. AdsMarketingPage: ditemukan di components/marketing/ ✅
```

---

# Batch 2: Fitur Inti (PENDING)

> **Status:** Belum dikerjakan — butuh diskusi harga final sebelum eksekusi.
> **Alasan:** AdPackage seed data langsung mempengaruhi harga yang advertiser lihat. Harus final dulu.

---

## ~~P6: Critical — AdPackage Seed Data~~ ❌ DIHAPUS

### ~~15. Seed AdPackage ke Database~~ → TIDAK PERLU

**Keputusan:** Harga diisi manual lewat dashboard oleh superadmin (lebih fleksibel).
**Aksi:** Admin buat 18 paket (6 slot × 3 durasi) lewat `/{site}/dashboard/ads/packages`.
**Referensi harga:** `docs/harga.md` Section 3.1

---

## P7: Important — HOME_TOP Upload Logo+Foto

### 16. StudioCanvas — Branch Upload Khusus HOME_TOP

**File:** `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx`

**Masalah:** HOME_TOP seharusnya minta logo + foto (bukan video upload). Saat ini semua slot pakai upload yang sama.

**Solusi:**
- Jika slot = `HOME_TOP` → tampilkan form upload **logo + foto** (2 file input)
- Jika slot lain → tampilkan upload biasa (1 file input)
- Tambah catatan: *"Tim kreatif kami akan membuat video dalam 1-2 hari kerja"*

**Estimasi:** 1 jam
**Blocking:** Keputusan apakah HOME_TOP tetap pakai creative service atau tidak

---

## P8: Important — Slot Availability Check

### 17. Ad Controller — Real Availability Check

**File:** `apps/api/src/modules/ad/ad.controller.ts`

**Masalah:** Endpoint `/availability` selalu return `true`. Tidak ada pengecekan kapasitas.

**Solusi:**
```typescript
// Hitung booking aktif untuk slot + tanggal yang diminta
const activeBookings = await prisma.adBooking.count({
  where: {
    package: { slot },
    status: 'ACTIVE',
    startDate: { lte: endDate },
    endDate: { gte: startDate },
  }
});

const maxCapacity = { HOME_TOP: 3, HOME_FEED_1: 3, HOME_FEED_2: 2, ARTICLE_TOP: 3, ARTICLE_MIDDLE: 2, ARTICLE_BOTTOM: 2 };
const available = activeBookings < (maxCapacity[slot] || 3);
```

**Estimasi:** 1 jam
**Blocking:** Tidak ada (bisa dikerjakan kapan saja)

---

## P9: Nice-to-Have — Bundle Pricing

### 18. Ad Service — Logika Bundle Pricing

**File:** `apps/api/src/modules/ad/ad.service.ts`

**Masalah:** Tidak ada logika bundle. Harga murni dari AdPackage.price.

**Solusi (saat diperlukan):**
- Homepage Only bundle: HOME_TOP + HOME_FEED_1 + HOME_FEED_2
- Article Only bundle: ARTICLE_TOP + ARTICLE_MIDDLE + ARTICLE_BOTTOM
- All-In bundle: semua 6 slot
- Diskon otomatis: 14 hari ~12.5%, 30 hari ~25%

**Estimasi:** 2-3 jam
**Blocking:** Tidak menghambat launch — bisa pakai harga satuan dulu

---

## Ringkasan Batch 2

| # | Item | Prioritas | Status |
|---|------|-----------|--------|
| ~~15~~ | ~~AdPackage seed data~~ | ❌ Dihapus | — |
| 16 | HOME_TOP upload logo+foto | 🟡 Important | ✅ commit 4ed264b |
| 17 | Slot availability check | 🟡 Important | ✅ commit 0d1254b |
| 18 | Bundle pricing | 🟢 Nice-to-have | ✅ commit 0d1254b |

---

## Urutan Eksekusi Batch 2

```
[x] ① HOME_TOP upload logo+foto (P7) ✅ commit 4ed264b (Batch 5)
[x] ② Slot availability check (P8) ✅ commit 0d1254b
[x] ③ Bundle pricing (P9) ✅ commit 0d1254b
```

**Catatan:** Harga diisi manual lewat dashboard/ads oleh superadmin. Referensi: `docs/harga.md` Section 3.1

---

# Batch 3: Sinkronisasi Admin-Advertiser (PENDING)

> **Tanggal:** 28 Juni 2026
> **Status:** Belum dikerjakan
> **Sumber:** Deep audit advertiser dashboard vs admin dashboard

---

## P10: CRITICAL — Video Pipeline

### 19. Video Format Broken End-to-End

**Masalah:** UI izinkan pilih "Video", tapi seluruh pipeline hanya handle image (sharp). Upload video → gagal/salah proses.

**File terkait:**
- `studio/types.ts` — tidak ada `videoFile` field
- `StudioContext.tsx` — upload handler hanya proses image
- `ad.controller.ts` — tidak ada `videoUrl` di POST body
- `schema.prisma` — tidak ada `videoUrl` di AdBooking
- `StudioCanvas.tsx` — format selector tampil untuk semua paket

**Solusi:**
- Untuk HOME_TOP (VIDEO): arahkan ke flow logo+foto (item #16)
- Untuk slot IMAGE: sembunyikan opsi video, atau disable jika `allowedFormat === 'IMAGE'`
- Jika tetap ingin support video upload untuk slot lain: tambah video pipeline

**Estimasi:** 2-3 jam (tergantung scope)
**Blocking:** Keputusan — apakah slot selain HOME_TOP perlu video?

---

## P11: CRITICAL — allowedFormat Validation

### 20. Format Selector Tidak Filter berdasarkan allowedFormat

**File:** `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx`

**Masalah:** Format selector (Gambar/Video) tampil untuk SEMUA paket, padahal:
- Paket `allowedFormat: 'IMAGE'` seharusnya hanya tampilkan Gambar
- Paket `allowedFormat: 'VIDEO'` seharusnya hanya tampilkan Video
- Paket `allowedFormat: 'ALL'` tampilkan keduanya

**Solusi:**
```tsx
// Filter format berdasarkan allowedFormat
const availableFormats = selectedPackage.allowedFormat === 'ALL'
  ? ['image', 'video']
  : selectedPackage.allowedFormat === 'VIDEO'
  ? ['video']
  : ['image'];
```

**Estimasi:** 30 menit
**Blocking:** Tidak ada

---

## P12: CRITICAL — HOME_TOP Logo+Foto (Sudah Ada di Batch 2)

→ Sudah tercantum di P7 item #16. Tidak perlu duplikat.

---

## P13: SIGNIFICANT — Sinkronisasi Data

### 21. AdPackage.price Type Mismatch

**File:**
- `ads/types.ts`: `price: string`
- `studio/types.ts`: `price: number | string`

**Solusi:** Samakan ke `price: string` (sesuai Prisma Decimal serialization).

**Estimasi:** 10 menit

### 22. Marketing Page Pre-Selection Diabaikan

**File:** `studio/StudioContext.tsx`

**Masalah:** Marketing page link ke `/{site}/ads/order?package=${pkg.id}`, tapi Studio tidak baca query param `package`. Auto-select paket pertama.

**Solusi:** Baca `package` query param, cari di `packages` list, set sebagai selected.

**Estimasi:** 20 menit

### 23. mediaType Tidak Disimpan di Booking

**File:** `StudioContext.tsx`, `ad.controller.ts`, `schema.prisma`

**Masalah:** Advertiser pilih mediaType (image/video), tapi tidak dikirim ke API dan tidak disimpan. Admin tidak tahu advertiser pilih apa.

**Solusi:**
- Tambah `mediaType` field di AdBooking (migration)
- Kirim `mediaType` saat create booking
- Tampilkan di admin review

**Estimasi:** 1 jam (termasuk migration)

### 24. endDate Client Diabaikan API

**File:** `ad.controller.ts`

**Masalah:** Client kirim `endDate`, tapi API abaikan dan hitung dari `startDate + durationDays`.

**Solusi:** Ini sudah benar (server should own computation). Hapus `endDate` dari client POST body agar tidak confusion.

**Estimasi:** 10 menit

---

## P14: MINOR — Cleanup & Fixes

### 25. animationEffect Masih Di-propagate

**File:** `ad.controller.ts` (approve handler)

**Masalah:** Saat approve booking, `animationEffect` di-copy ke Advertisement. Padahal sudah deprecated.

**Solusi:** Hapus `animationEffect` dari approve handler.

**Estimasi:** 10 menit

### 26. wapimred 403 di /ads/bookings/all

**File:** `ad.controller.ts`

**Masalah:** Endpoint hanya izinkan `superadmin`, tapi `wapimred` juga mencoba akses.

**Solusi:** Tambah `wapimred` ke role check.

**Estimasi:** 5 menit

### 27. Rekening Bank Duplikat

**File:** `StudioCanvas.tsx`, `ads/bookings/page.tsx`

**Masalah:** Rekening bank hardcode di 2 file berbeda.

**Solusi:** Pindah ke shared constant atau site config.

**Estimasi:** 15 menit

### 28. Advertiser History Tidak Tampilkan paymentStatus

**File:** `ads/history/page.tsx`

**Masalah:** Advertiser hanya lihat `status`, tidak lihat `paymentStatus`. Payment rejected tidak terlihat.

**Solusi:** Tambah kolom `paymentStatus` di history table.

**Estimasi:** 15 menit

---

## Ringkasan Batch 3

| # | Item | Prioritas | Status |
|---|------|-----------|--------|
| 19 | Video pipeline (Seedance/Kling) | 🔴 Critical | ✅ commit 8233294 |
| 20 | allowedFormat validation | 🔴 Critical | ✅ commit db7979d |
| 21 | price type mismatch | 🟡 Significant | ✅ commit 4093bd0 |
| 22 | Marketing pre-selection | 🟡 Significant | ✅ commit 4093bd0 |
| 23 | mediaType not persisted | 🟡 Significant | ⚠️ Ditunda (format dari allowedFormat) |
| 24 | endDate client cleanup | 🟡 Significant | ✅ commit 4093bd0 |
| 25 | animationEffect propagation | ⚪ Minor | ✅ commit 4093bd0 |
| 26 | wapimred 403 fix | ⚪ Minor | ✅ commit 4093bd0 |
| 27 | Bank account dedup | ⚪ Minor | ✅ commit 4093bd0 |
| 28 | Advertiser paymentStatus | ⚪ Minor | ✅ commit 4093bd0 |

---

## Urutan Eksekusi Batch 3

```
[x] ① allowedFormat validation (P11) ✅ commit db7979d (Batch 4)
[x] ② HOME_TOP logo+foto (P7) ✅ commit 4ed264b (Batch 5)
[x] ③ Video pipeline (P10) ✅ commit 8233294 (6 AI providers)
[x] ④ Sinkronisasi data (P13) ✅ commit 4093bd0
[x] ⑤ Cleanup (P14) ✅ commit 4093bd0
```

---

# Batch 4: Halaman Slots & Konsistensi (PENDING)

> **Tanggal:** 28 Juni 2026
> **Status:** Belum dikerjakan
> **Sumber:** Audit halaman `/dashboard/ads/slots`

---

## P15: CRITICAL — Slot Name Inconsistency

### 29. Nama Slot Tidak Konsisten dengan Dokumen

**File:** `apps/web/lib/constants.ts:120`

**Masalah:**
```tsx
id: 'HOME_TOP',
name: 'Hero Banner',  // ❌ Tidak konsisten dengan dokumen
```

Dokumen (`ads.md`, `harga.md`) menyebut:
- HOME_TOP → "Hero Banner" atau "Hero Banner Video"
- Tapi slot ID adalah `HOME_TOP`, bukan `HERO_BANNER`

**Solusi:** Samakan nama dengan dokumen. Opsi:
- `name: 'HOME TOP'` (sesuai slot ID)
- `name: 'Hero Top'` (lebih human-readable)

**Estimasi:** 5 menit

---

## P16: CRITICAL — AdSlotCard Tidak Support Multi-Iklan

### 30. 5 Slot Selain HOME_TOP Hanya Tampilkan 1 Iklan

**File:** `apps/web/components/dashboard/ads/AdSlotCard.tsx`

**Masalah:**
```tsx
const primaryAd = ads[0]; // Hanya ambil 1 iklan pertama
```

Padahal semua slot mendukung multi-iklan rotasi:
- HOME_FEED_1: max 3
- HOME_FEED_2: max 2
- ARTICLE_TOP: max 3
- ARTICLE_MIDDLE: max 2
- ARTICLE_BOTTOM: max 2

**Dampak:** Admin tidak bisa menambah iklan ke-2 atau ke-3 di slot selain HOME_TOP.

**Solusi:** Refactor AdSlotCard menjadi carousel manager seperti HeroBannerManager:
- Tampilkan semua iklan dalam slot
- Tambah iklan baru
- Hapus iklan
- Urutkan (reorder)
- Toggle aktif/nonaktif per iklan
- Upload per iklan

**Estimasi:** 2-3 jam

---

## P17: CRITICAL — HOME_TOP Harusnya Video Only

### 31. HOME_TOP Masih Bisa Upload Manual

**File:** `apps/web/components/dashboard/ads/pages/AdsSlotsContent.tsx`

**Masalah:** HOME_TOP menggunakan `HeroBannerManager` yang memungkinkan admin upload gambar/video manual. Padahal sudah diputuskan HOME_TOP = creative service (advertiser kirim logo+foto, tim produksi video).

**Solusi:**
- HOME_TOP di halaman slots: tampilkan daftar video yang sudah diproduksi
- Upload hanya dari tim kreatif (bukan dari advertiser)
- Tambah label: "Video diproduksi oleh tim kreatif"

**Estimasi:** 1 jam

---

## P18: SIGNIFICANT — HeroBannerManager Perlu Konsistensi

### 32. HeroBannerManager Tidak Tampilkan Format/Tier

**File:** `apps/web/components/dashboard/ads/HeroBannerManager.tsx`

**Masalah:** Tidak ada badge format (🎥 Video) atau tier (PREMIUM) di HeroBannerManager.

**Solusi:** Tambah badge konsisten dengan AdSlotCard.

**Estimasi:** 15 menit

---

## Ringkasan Batch 4

| # | Item | Prioritas | Estimasi |
|---|------|-----------|----------|
| 29 | Nama slot konsisten | 🔴 Critical | 5 mnt |
| 30 | AdSlotCard multi-iklan | 🔴 Critical | 2-3 jam |
| 31 | HOME_TOP video only | 🔴 Critical | 1 jam |
| 32 | HeroBannerManager badge | 🟡 Significant | 15 mnt |
| **Total** | | | **~4 jam** |

---

## Urutan Eksekusi Batch 4

```
[x] ① Nama slot konsisten (P15) ✅ commit db7979d
[x] ② HOME_TOP video only (P17) ✅ commit db7979d
[x] ③ AdSlotCard multi-iklan (P16) ✅ commit db7979d
[x] ④ HeroBannerManager badge (P18) ✅ commit db7979d
```

**Bonus:** allowedFormat validation (P11, #20) juga selesai di commit ini.

---

# Batch 5: Produksi Video HOME_TOP (PENDING)

> **Tanggal:** 28 Juni 2026
> **Status:** Belum dikerjakan
> **Tujuan:** Halaman khusus untuk produksi video HOME_TOP dengan integrasi AI

---

## P19: CRITICAL — Halaman Produksi Video

### 33. Buat Halaman `/dashboard/ads/production`

**File baru:**
- `apps/web/app/[site]/dashboard/(admin)/ads/production/page.tsx`
- `apps/web/components/dashboard/ads/production/VideoProductionPage.tsx`
- `apps/web/components/dashboard/ads/production/ProductionCard.tsx`

**Fungsi:**
- Menampilkan daftar booking HOME_TOP yang sudah di-approve, menunggu produksi video
- Admin bisa lihat preview logo + foto dari advertiser
- Admin klik "Produksi Video" → panggil Seedance/Kling API
- Preview hasil video sebelum tayang
- Regenerate dengan prompt berbeda
- "Tayangkan" → upload video ke HOME_TOP slot
- Prompt tracking otomatis (simpan prompt yang dipakai)

**Alur:**
```
Advertiser upload logo+foto → booking → admin approve
        ↓
Production page → admin klik "Produksi Video"
        ↓
Seedance/Kling API → generate video
        ↓
Admin preview → klik "Tayangkan"
        ↓
Video masuk ke HOME_TOP slot → tayang di homepage
```

**Estimasi:** 4-5 jam

---

### 34. Schema: Tambah logoUrl + fotoUrl di AdBooking

**File:** `apps/api/prisma/schema.prisma`

**Perubahan:**
```prisma
model AdBooking {
  // ... field yang ada ...
  logoUrl    String?  // Logo dari advertiser (khusus HOME_TOP)
  fotoUrl    String?  // Foto dari advertiser (khusus HOME_TOP)
}
```

**Estimasi:** 15 menit (termasuk migration)

---

### 35. Ad Studio: Branch Upload Logo+Foto untuk HOME_TOP

**File:** `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx`

**Masalah:** Saat ini semua slot pakai upload yang sama. HOME_TOP seharusnya minta logo + foto.

**Solusi:**
- Jika slot = HOME_TOP → tampilkan 2 file input: "Upload Logo" + "Upload Foto"
- Tambah catatan: "Tim kreatif kami akan membuat video dalam 1-2 hari kerja"
- Kirim `logoUrl` + `fotoUrl` ke API (bukan `imageUrl`)

**Estimasi:** 1 jam

---

### 36. API: Endpoint Produksi Video

**File:** `apps/api/src/modules/ad/ad.controller.ts` (tambah endpoint baru)

**Endpoint:**
```
POST /api/v1/ads/production/:bookingId/generate
Body: { prompt: string }
Response: { videoUrl: string, prompt: string }

POST /api/v1/ads/production/:bookingId/publish
Body: { videoUrl: string }
Response: { success: boolean, adId: string }
```

**Estimasi:** 2 jam

---

### 37. Prompt Library: Simpan Prompt Otomatis

**File baru:** `apps/api/src/modules/ad/prompt-library.ts`

**Fungsi:**
- Simpan prompt yang dipakai per produksi video
- Kategori: restoran, properti, otomotif, dll
- Rating hasil (admin bisa kasih bintang)
- Reuse prompt untuk booking berikutnya

**Schema:**
```prisma
model VideoPrompt {
  id        String   @id @default(uuid())
  bookingId String
  prompt    String
  category  String?
  rating    Int?     // 1-5
  videoUrl  String?
  createdAt DateTime @default(now())
}
```

**Estimasi:** 1-2 jam

---

### 38. Navigation: Tambah Menu "Produksi Video"

**File:** `apps/web/components/layout/Sidebar.tsx` (atau navigation config)

**Tambah menu:**
```
Dashboard
├── Overview
├── Slots
├── Packages
├── Bookings
├── Produksi Video  ← NEW
```

**Estimasi:** 10 menit

---

## Ringkasan Batch 5

| # | Item | Prioritas | Estimasi |
|---|------|-----------|----------|
| 33 | Halaman produksi video | 🔴 Critical | 4-5 jam |
| 34 | Schema: logoUrl + fotoUrl | 🔴 Critical | 15 mnt |
| 35 | Ad Studio: upload logo+foto | 🔴 Critical | 1 jam |
| 36 | API: endpoint produksi | 🔴 Critical | 2 jam |
| 37 | Prompt Library | 🟡 Important | 1-2 jam |
| 38 | Navigation menu | 🟢 Minor | 10 mnt |
| **Total** | | | **~9-10 jam** |

---

## Urutan Eksekusi Batch 5

```
[x] ① Schema: logoUrl + fotoUrl (P19, #34) ✅ commit 4ed264b
[x] ② Ad Studio: branch upload logo+foto (P19, #35) ✅ commit 4ed264b
[x] ③ API: endpoint produksi (P19, #36) ✅ commit 4ed264b
[x] ④ Halaman produksi video (P19, #33) ✅ commit 4ed264b
[x] ⑤ Prompt Library (P19, #37) ✅ commit 4ed264b
[x] ⑥ Navigation menu (P19, #38) ✅ commit 4ed264b
```

---

# TOTAL ESTIMASI SEMUA BATCH

| Batch | Status | Estimasi |
|-------|--------|----------|
| Batch 1 (P1-P5) | ✅ Selesai | ~2 jam |
| Batch 2 (P7-P9) | ✅ Selesai | ~4 jam |
| Batch 3 (P10-P14) | ✅ Selesai (sisa #23 ditunda) | ~5-6 jam |
| Batch 4 (P15-P18) | ✅ Selesai | ~4 jam |
| Batch 5 (P19) | ✅ Selesai | ~9-10 jam |
| **Total** | | **~24-26 jam** |
