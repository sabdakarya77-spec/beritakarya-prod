# UI/UX Audit — Advertiser Dashboard

> Tanggal: 2026-06-30
> Scope: Portal Pengiklan (`/[site]/ads/`) + Admin Ads (`/[site]/dashboard/ads/`)

---

## Arsitektur

| Layer | Path | Fungsi |
|---|---|---|
| Advertiser Portal | `app/[site]/ads/` | Sidebar layout, onboarding, order wizard, payments, history, settings |
| Admin Ads | `app/[site]/dashboard/ads/` | Slot management, booking review, packages, production |
| Komponen Shared | `components/dashboard/ads/` | AdSlotCard, HeroBannerRow, StudioCanvas, AdPerformanceChart, dll. |
| Backend | `api/src/modules/ad/` | Controller, service, repository, validator |
| Data Model | `prisma/schema.prisma` | AdPackage, AdBooking, Advertisement, AdEventLog, VideoPrompt |

---

## Alur Booking (End-to-End)

```
Reader → /ads/ (BecomeAdvertiser)
  ↓ klik "Jadi Pengiklan"
Advertiser → /ads/ (Dashboard + Stats)
  ↓ klik "Pesan Iklan"
Step 1: Pilih Paket (GET /ads/packages)
  ↓
Step 2: Detail Kampanye (nama, URL, tanggal) + cek ketersediaan slot
  ↓
Step 3: Upload Kreatif (auto-generate desktop/tablet/mobile variants)
  ↓
Step 4: Pembayaran (bank transfer / Midtrans) + submit
  ↓
Booking Created (status: PENDING_REVIEW)
  ↓
Admin Review → Approve / Reject
  ↓
Approved → Ad auto-created → Live di site
  ↓
Performance tracking (impressions, clicks, CTR)
```

---

## Halaman Advertiser

| Halaman | Path | Komponen | Fungsi |
|---|---|---|---|
| Onboarding | `/ads/` | `BecomeAdvertiser` | Upgrade reader → advertiser (1 klik) |
| Dashboard | `/ads/` | `AdvertiserAdsView` | Stats, chart performa, CTA order |
| Order | `/ads/order` | `StudioCanvas` | 4-step wizard (paket → kampanye → kreatif → bayar) |
| Pembayaran | `/ads/bookings` | inline | Riwayat booking + upload bukti / Midtrans |
| History | `/ads/history` | inline | Tabel semua booking |
| Settings | `/ads/settings` | inline | Edit profil, ganti password |

---

## Temuan Masalah

### 🔴 HIGH PRIORITY

#### 1. Midtrans Sandbox Hardcoded di Production
- **File**: `app/[site]/ads/bookings/page.tsx`
- **Masalah**: URL `https://app.sandbox.midtrans.com/snap/snap.js` dipakai di semua environment
- **Dampak**: Payment gateway tidak berfungsi di production (hanya sandbox)
- **Solusi**: Gunakan environment variable `NEXT_PUBLIC_MIDTRANS_URL` yang beda per environment

#### 2. HOME_TOP Logo Upload Broken
- **File**: `components/dashboard/ads/studio/StudioContext.tsx` (line ~250)
- **Masalah**: Ada `TODO: upload logo terpisah`. Upload logo dan foto keduanya menulis ke `adFile`, saling menimpa. Saat submit, `bookingPayload.logoUrl = null`
- **Dampak**: Logo advertiser tidak tersimpan untuk booking HOME_TOP
- **Solusi**: Pisahkan state `logoFile` dan `fotoFile`, upload terpisah, kirim `logoUrl` dan `fotoUrl` ke API

---

### 🟡 MEDIUM PRIORITY

#### 3. QRIS Placeholder
- **File**: `app/[site]/ads/bookings/page.tsx`
- **Masalah**: Section QRIS hanya menampilkan ikon "Scan untuk membayar" tanpa QR code
- **Dampak**: Advertiser tidak bisa bayar via QRIS
- **Solusi**: Generate QR code dari MIDTRANS_QRIS_URL atau upload static QRIS image

#### 4. History Page Raw Status
- **File**: `app/[site]/ads/history/page.tsx`
- **Masalah**: Kolom Status menampilkan string mentah (`PENDING_REVIEW`, `ACTIVE`, dll.) tanpa label bahasa Indonesia atau warna
- **Dampak**: Advertiser sulit memahami status booking
- **Solusi**: Map status ke label berwarna:
  - `PENDING_REVIEW` → "Menunggu Review" (amber)
  - `ACTIVE` → "Aktif" (green)
  - `COMPLETED` → "Selesai" (blue)
  - `REJECTED` → "Ditolak" (red)

#### 5. Tidak Ada Cancel Booking
- **File**: frontend + backend
- **Masalah**: Setelah submit, advertiser tidak bisa membatalkan pesanan
- **Dampak**: Jika salah input, harus hubungi admin
- **Solusi**: Tambah endpoint `POST /ads/bookings/:id/cancel` (hanya jika status `PENDING_REVIEW` atau `PENDING`)

#### 6. Tidak Ada Edit Kreatif Setelah Submit
- **File**: frontend + backend
- **Masalah**: Material iklan tidak bisa diubah setelah submit
- **Dampak**: Jika ada revisi, harus reject + order ulang
- **Solusi**: Tambah endpoint `PATCH /ads/bookings/:id/creative` (hanya jika status `PENDING_REVIEW`)

#### 7. Tidak Ada Invoice / Receipt
- **File**: -
- **Masalah**: Setelah pembayaran terverifikasi, tidak ada dokumen invoice yang bisa diunduh
- **Dampak**: Advertiser tidak punya bukti pembayaran resmi
- **Solusi**: Generate PDF invoice sederhana (booking ID, paket, harga, tanggal, status)

#### 8. Tidak Ada Approval untuk Upgrade Role
- **File**: `api/src/modules/auth/auth.controller.ts` (line ~158)
- **Masalah**: `POST /auth/upgrade-to-advertiser` langsung mengubah role tanpa approval
- **Dampak**: Siapa saja bisa langsung jadi advertiser (potensi abuse)
- **Solusi**: Tambah status `PENDING_APPROVAL`, admin approve dulu

#### 9. Link Bantuan Placeholder
- **File**: `app/[site]/ads/layout.tsx` (sidebar)
- **Masalah**: Link "Bantuan" mengarah ke `wa.me/628123456789` (nomor palsu)
- **Dampak**: Advertiser tidak bisa menghubungi support
- **Solusi**: Ganti dengan nomor WhatsApp / email support yang valid

---

### 🟢 LOW PRIORITY

#### 10. Sidebar Collapse Inconsistency
- **File**: `app/[site]/ads/layout.tsx`
- **Masalah**: Sidebar default collapsed, tapi sub-menu "Iklan Saya" butuh sidebar expanded
- **Solusi**: Default expanded, atau buat sub-menu accessible saat collapsed (tooltip/icon)

#### 11. Stats Hanya untuk ACTIVE Booking
- **File**: `components/dashboard/ads/AdvertiserAdsView.tsx`
- **Masalah**: Chart dan stats hanya fetch data booking `status === 'ACTIVE'`
- **Solusi**: Include booking `COMPLETED` juga agar historical data tetap terlihat

#### 12. Duplicate Admin/Advertiser Pages
- **File**: `app/[site]/dashboard/(admin)/ads/` vs `app/[site]/ads/`
- **Masalah**: Kode hampir identik di dua lokasi berbeda
- **Solusi**: Refactor ke shared components, bedakan hanya data fetching berdasarkan role

---

## File Index

### Frontend — Advertiser Pages
```
app/[site]/ads/layout.tsx          — Portal layout (sidebar)
app/[site]/ads/page.tsx            — Dashboard / Onboarding
app/[site]/ads/order/page.tsx      — Order wizard
app/[site]/ads/bookings/page.tsx   — Payments
app/[site]/ads/history/page.tsx    — Booking history
app/[site]/ads/settings/page.tsx   — Profile & password
```

### Frontend — Komponen
```
components/dashboard/ads/AdvertiserAdsView.tsx   — Dashboard stats + chart
components/dashboard/ads/AdPerformanceChart.tsx   — Recharts area chart
components/dashboard/ads/BecomeAdvertiser.tsx     — Onboarding page
components/dashboard/ads/studio/StudioCanvas.tsx  — 4-step order wizard
components/dashboard/ads/studio/StudioContext.tsx  — Wizard state management
components/dashboard/ads/studio/StudioControls.tsx — Sidebar wizard (compact)
components/dashboard/ads/studio/StudioPreview.tsx  — Ad preview mockup
components/dashboard/ads/studio/AdSmartPreview.tsx — Cross-slot preview
components/dashboard/ads/BookingReviewList.tsx     — Admin review queue
components/dashboard/ads/AdSlotCard.tsx            — Admin slot card
components/dashboard/ads/HeroBannerRow.tsx         — Admin HOME_TOP row
```

### Backend
```
api/src/modules/ad/ad.controller.ts    — Semua route iklan
api/src/modules/ad/ad.service.ts       — Business logic
api/src/modules/ad/ad.repository.ts    — Database queries
api/src/modules/ad/ad.validator.ts     — Zod schemas
api/prisma/schema.prisma               — AdPackage, AdBooking, Advertisement, AdEventLog
```

### Constants
```
web/lib/constants.ts    — AD_SLOT_DEFINITIONS, AD_BANK_ACCOUNTS
api/src/config/ad-slots.ts  — Slot dimensions, format, tier
```
