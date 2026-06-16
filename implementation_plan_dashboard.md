# Rencana Perbaikan Dashboard & Sistem Iklan — BeritaKarya v0.1

> Berdasarkan audit komprehensif per 16 Juni 2026.
> Mencakup: integrasi dashboard ↔ frontend, role-based access, dan sistem iklan.

---

## Ringkasan Eksekutif

Audit ini memeriksa keseluruhan sistem dashboard (22 halaman, 21 komponen, 4 Zustand stores) dan sistem iklan (3 model Prisma, 19+ API endpoints, komponen `AdSpace`). Hasilnya, **tidak ada broken link atau orphaned component**, namun ditemukan **17 masalah** yang perlu diperbaiki.

| Kategori | Jumlah Temuan | Severity |
|----------|--------------|----------|
| Bug (harus fix) | 6 | 🔴 Kritis |
| Security gap | 3 | 🟡 Penting |
| Performance/Refactor | 5 | 🟠 Sedang |
| Info/Improvement | 3 | 🟢 Rendah |

**Total estimasi:** 2–3 minggu (1 developer full-time)

---

## Bagian A: Temuan Dashboard

### Status Integrasi

| Aspek | Status | Detail |
|-------|--------|--------|
| Sidebar links → Pages | ✅ | Semua 19 menu link mengarah ke `page.tsx` yang ada |
| Components terpakai | ✅ | Semua 21 komponen dashboard digunakan, tidak ada orphan |
| Import statements | ✅ | Tidak ada dead import atau missing modules |
| API endpoint calls | ✅ | Semua halaman memanggil endpoint yang terdefinisi |
| Zustand stores | ✅ | `authStore`, `siteStore`, `toastStore`, `editorStore` terpakai benar |
| Role-based menu filtering | ✅ | Layout memfilter menu berdasarkan role dengan benar |

### A.1 Page-Level Role Guard Tidak Konsisten

| Item | Detail |
|------|--------|
| **Severity** | 🟡 Security |
| **Masalah** | Hanya 3 dari 22 halaman punya pengecekan role di page-level. Sisanya hanya mengandalkan layout `useEffect` — ada flash konten sebelum redirect |
| **Halaman yang sudah benar** | `review/page.tsx` (explicit check), `audit/page.tsx` (redirect), `ads/page.tsx` (partial check) |
| **Halaman yang perlu ditambah guard** | `users`, `categories`, `settings`, `admin`, `admin/ai-usage`, `review/kyc`, `review/kyc/[userId]`, `invitations`, `team`, `comments` |
| **Solusi** | Buat hook `useRequireRole(allowedRoles)` yang redirect jika role tidak sesuai, pasang di setiap halaman sensitif |
| **Acceptance criteria** | Semua halaman dengan role restriction punya page-level guard |
| **Effort** | 1–2 hari |

**Contoh implementasi hook:**
```ts
// apps/web/hooks/useRequireRole.ts
'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function useRequireRole(allowedRoles: string[]) {
  const router = useRouter();
  const { site } = useParams();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || !allowedRoles.includes(user.role)) {
      router.replace(`/${site}/dashboard`);
    }
  }, [user, allowedRoles, router, site]);

  return { user, isAllowed: user ? allowedRoles.includes(user.role) : false };
}
```

### A.2 Tidak Ada Next.js Middleware

| Item | Detail |
|------|--------|
| **Severity** | 🟡 Security |
| **Masalah** | Semua auth/role check client-side. Tidak ada server-side route protection |
| **Dampak** | Pengguna yang belum login bisa melihat flash konten dashboard sebelum client-side redirect |
| **Solusi** | Buat `apps/web/middleware.ts` untuk proteksi route `/dashboard/*` |
| **Acceptance criteria** | Request ke `/dashboard/*` tanpa token langsung redirect ke login |
| **Effort** | 1 hari |

**Contoh implementasi:**
```ts
// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.includes('/dashboard') && !token) {
    const site = pathname.split('/')[1];
    return NextResponse.redirect(new URL(`/${site}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:site/dashboard/:path*'],
};
```

### A.3 Comments Page Hardcode Stats

| Item | Detail |
|------|--------|
| **Severity** | 🟠 Bug |
| **Masalah** | `comments/page.tsx` baris 136–143 hardcode "Disetujui Hari Ini: 0" dan "Total Diskusi: 0" — tidak fetch data real |
| **Solusi** | Panggil endpoint stats dari backend (misalnya `/comments/stats`) atau hitung dari data yang sudah di-fetch |
| **Effort** | 2–4 jam |

### A.4 KYC Detail Page Raw URL Pattern

| Item | Detail |
|------|--------|
| **Severity** | 🟠 Bug |
| **Masalah** | `review/kyc/[userId]/page.tsx` baris 113 menggunakan `/api/v1/kyc/view/${userId}/${type}` langsung di `<img src>`. Tidak lewat axios interceptor — gambar dokumen kemungkinan gagal load jika endpoint butuh auth cookie |
| **Solusi** | Fetch gambar via axios dengan `responseType: 'blob'`, buat object URL untuk `<img src>`. Atau pastikan endpoint `/kyc/view/*` tidak memerlukan auth |
| **Effort** | 2–4 jam |

### A.5 Calendar Page Tanpa Date Range Filter

| Item | Detail |
|------|--------|
| **Severity** | 🟠 Performance |
| **Masalah** | `calendar/page.tsx` baris 40 fetch `/articles?limit=100` lalu filter client-side. Tidak efisien untuk site dengan banyak artikel |
| **Solusi** | Tambah parameter `startDate` dan `endDate` di API `/articles`, atau buat endpoint khusus `/articles/calendar` |
| **Effort** | 1 hari (termasuk backend) |

### A.6 Ads Page Terlalu Besar (1224 baris)

| Item | Detail |
|------|--------|
| **Severity** | 🟢 Refactor |
| **Masalah** | `ads/page.tsx` melayani superadmin/wapimred DAN advertiser dalam satu file. Sulit dimaintain |
| **Solusi** | Split menjadi: `SuperadminAdsView.tsx`, `AdvertiserAdsView.tsx`, halaman utama hanya routing berdasarkan role |
| **Effort** | 1 hari |

---

## Bagian B: Temuan Sistem Iklan

### Status Integrasi

| Aspek | Status | Detail |
|-------|--------|--------|
| Backend API ↔ Frontend | ✅ | `AdSpace` fetch dari `GET /api/v1/ads/public` dengan benar |
| Slot rendering | ✅ | Homepage pakai leaderboard, in-feed, rectangle. Artikel pakai rectangle + rectangle_secondary |
| Tracking | ✅ | Impression via IntersectionObserver, click via sendBeacon |
| Dashboard ↔ Booking flow | ✅ | Booking → approve → auto-sync ke Advertisement table |
| Cron expiry | ✅ | Jam-jaman expire booking dan deaktivasi slot |
| Carousel rotation | ✅ | Leaderboard support multi-banner dengan interval 7 detik |

### B.1 Order Page Abaikan Input Tanggal

| Item | Detail |
|------|--------|
| **Severity** | 🔴 Bug |
| **Masalah** | `ads/order/page.tsx` baris 183–185 hardcode `new Date()` saat submit, mengabaikan tanggal yang dipilih user di step 2 |
| **Solusi** | Gunakan state `startDate` dan `endDate` yang sudah ada di form |
| **Effort** | 1 jam |

**Fix:**
```ts
// ads/order/page.tsx — handleSubmit
// Sebelum:
const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + selectedPackage.durationDays);

// Sesudah:
const startDate = startDateState;  // dari state form
const endDate = endDateState;      // dari state form
```

### B.2 Tidak Ada Deteksi Konflik Slot

| Item | Detail |
|------|--------|
| **Severity** | 🔴 Bug |
| **Masalah** | Saat superadmin approve booking non-leaderboard, Advertisement yang ada di-slot tersebut langsung di-replace. Jika dua advertiser booking slot yang sama untuk tanggal overlapping, approval kedua menimpa yang pertama tanpa peringatan |
| **Solusi** | Tambah pengecekan overlap sebelum approve: cek apakah ada `AdBooking` aktif lain di `siteId + slot` yang tanggalnya overlap |
| **Effort** | 1 hari |

**Contoh pengecekan:**
```ts
// ad.service.ts — approveBooking
const overlapping = await prisma.adBooking.findFirst({
  where: {
    siteId: booking.siteId,
    packageId: { in: (await prisma.adPackage.findMany({ where: { slot: booking.package.slot } })).map(p => p.id) },
    status: 'ACTIVE',
    startDate: { lte: booking.endDate },
    endDate: { gte: booking.startDate },
    id: { not: booking.id },
  },
});
if (overlapping) {
  throw new Error('Slot sudah ditempati booking lain pada rentang tanggal tersebut');
}
```

### B.3 Tracking Counter Ganda

| Item | Detail |
|------|--------|
| **Severity** | 🔴 Bug |
| **Masalah** | `syncTrackingToBooking` menggunakan `updateMany` berdasarkan `siteId + package.slot + status: ACTIVE`. Jika ada beberapa booking aktif di slot yang sama (leaderboard carousel), SEMUA booking ke-increment untuk setiap impresi — stats advertiser jadi inflated |
| **Solusi** | Perbaiki `syncTrackingToBooking` agar hanya increment booking yang benar. Tambah field `adId` di `AdBooking` untuk link eksplisit ke `Advertisement` |
| **Effort** | 1–2 hari (termasuk migration) |

### B.4 Cron Expiry Fragile (imageUrl Match)

| Item | Detail |
|------|--------|
| **Severity** | 🟡 Risk |
| **Masalah** | `ad-expiry.ts` baris 37–44 deaktivasi Advertisement dengan match `siteId + slot + imageUrl + isActive`. Jika admin edit imageUrl setelah approve, cron gagal deaktivasi — iklan expired tetap tayang |
| **Solusi** | Tambah field `bookingId` di model `Advertisement`, gunakan untuk match di cron |
| **Effort** | 1 hari (termasuk migration) |

### B.5 Tidak Ada FK AdBooking → Advertisement

| Item | Detail |
|------|--------|
| **Severity** | 🟡 Design |
| **Masalah** | Tidak ada foreign key yang menghubungkan `AdBooking` dengan `Advertisement` yang dibuatnya. Sistem bergantung pada match `siteId + slot + imageUrl` — fragile |
| **Solusi** | Tambah field `bookingId` (nullable) di model `Advertisement`. Set saat approve booking |
| **Effort** | 1 hari (termasuk migration) |

**Schema change:**
```prisma
model Advertisement {
  // ... field yang ada ...
  bookingId String?
  booking   AdBooking? @relation(fields: [bookingId], references: [id])
}
```

### B.6 Fallback Packages Invalid

| Item | Detail |
|------|--------|
| **Severity** | 🟡 Bug |
| **Masalah** | `ads/order/page.tsx` punya `FALLBACK_PACKAGES` dengan ID sintetik (`fallback-lead-30`). Jika API tidak mengembalikan paket, user bisa pilih fallback tapi submit gagal karena backend validasi `packageId` |
| **Solusi** | Hapus fallback packages, tampilkan pesan "Belum ada paket tersedia" jika API kosong. Atau seed default packages di database |
| **Effort** | 2 jam |

### B.7 Upload Endpoint Tidak Konsisten

| Item | Detail |
|------|--------|
| **Severity** | 🟠 Minor |
| **Masalah** | Dashboard ads page upload via `/media/upload?purpose=ad`, order page via `/media/upload` tanpa `?purpose=ad`. Response parsing juga berbeda |
| **Solusi** | Samakan endpoint dan response parsing di kedua tempat |
| **Effort** | 1 jam |

### B.8 Type Prop `rectangle_secondary` Tidak Ada di AdSpace

| Item | Detail |
|------|--------|
| **Severity** | 🟠 Minor |
| **Masalah** | `AdSpace` component punya `type` prop bertipe `'leaderboard' | 'rectangle' | 'in-feed'`, tapi `rectangle_secondary` hanya bisa diakses via `slot` prop. Jika seseorang pass `type="rectangle_secondary"`, styling tidak match |
| **Solusi** | Tambah `rectangle_secondary` ke type prop, atau dokumentasikan bahwa secondary slot harus pakai `type="rectangle" slot="rectangle_secondary"` |
| **Effort** | 30 menit |

### B.9 Slot `in_feed` Tidak Dipakai di Halaman Artikel

| Item | Detail |
|------|--------|
| **Severity** | 🟢 Info |
| **Masalah** | Homepage pakai semua 4 slot (leaderboard, in_feed, rectangle), tapi halaman artikel hanya pakai rectangle dan rectangle_secondary. Tidak ada in_feed di artikel |
| **Solusi** | Pertimbangkan tambah `<AdSpace type="in-feed" />` di antara paragraf artikel untuk monetisasi lebih |
| **Effort** | 1 jam |

### B.10 Site-Scoped vs Global Packages

| Item | Detail |
|------|--------|
| **Severity** | 🟢 Info |
| **Masalah** | `AdPackage` tidak punya `siteId` — semua paket global. `AdBooking` di-scope ke site. Tidak ada mekanisme pricing per site |
| **Solusi** | Saat ini cukup untuk marketplace model. Jika perlu site-specific pricing, tambah `siteId` nullable di `AdPackage` |
| **Effort** | N/A (design decision) |

---

## Bagian C: Rencana Eksekusi

### Fase 1: Critical Bug Fixes (Hari 1–3)

| # | Task | File | Effort |
|---|------|------|--------|
| 1.1 | Fix order page tanggal hardcode | `ads/order/page.tsx` | 1 jam |
| 1.2 | Fix comments page hardcoded stats | `comments/page.tsx` | 2–4 jam |
| 1.3 | Fix KYC document raw URL | `review/kyc/[userId]/page.tsx` | 2–4 jam |
| 1.4 | Fix syncTrackingToBooking counter | `ad.service.ts` | 1 hari |
| 1.5 | Hapus fallback packages invalid | `ads/order/page.tsx` | 2 jam |
| 1.6 | Samakan upload endpoint | `ads/order/page.tsx` | 1 jam |

**Milestone:** Semua bug kritis terfix, tracking iklan akurat.

### Fase 2: Security Hardening (Hari 4–6)

| # | Task | File | Effort |
|---|------|------|--------|
| 2.1 | Buat `useRequireRole` hook | `hooks/useRequireRole.ts` (baru) | 2 jam |
| 2.2 | Tambah page-level guard di 10 halaman sensitif | `users`, `categories`, `settings`, `admin`, `admin/ai-usage`, `review/kyc`, `review/kyc/[userId]`, `invitations`, `team`, `comments` | 1 hari |
| 2.3 | Buat Next.js middleware | `middleware.ts` (baru) | 1 hari |
| 2.4 | Tambah slot conflict detection | `ad.service.ts` | 1 hari |

**Milestone:** Defense-in-depth untuk semua halaman sensitif, tidak ada flash konten.

### Fase 3: Architecture Improvement (Hari 7–10)

| # | Task | File | Effort |
|---|------|------|--------|
| 3.1 | Tambah `bookingId` di Advertisement | Prisma schema + migration | 1 hari |
| 3.2 | Refactor cron expiry pakai bookingId | `cron/ad-expiry.ts` | 2 jam |
| 3.3 | Refactor syncTrackingToBooking pakai adId | `ad.service.ts` | 2 jam |
| 3.4 | Split ads/page.tsx per role view | `ads/SuperadminAdsView.tsx`, `ads/AdvertiserAdsView.tsx` | 1 hari |
| 3.5 | Tambah date range filter di calendar API | `article.controller.ts` + `calendar/page.tsx` | 1 hari |
| 3.6 | Tambah AdSpace type `rectangle_secondary` | `AdSpace.tsx` | 30 menit |

**Milestone:** Arsitektur iklan robust, code maintainable.

### Fase 4: Enhancement (Hari 11–14)

| # | Task | File | Effort |
|---|------|------|--------|
| 4.1 | Tambah in_feed slot di halaman artikel | `artikel/[slug]/page.tsx` | 1 jam |
| 4.2 | Tambah `?purpose=ad` di order page upload | `ads/order/page.tsx` | 30 menit |
| 4.3 | Pertimbangkan site-specific packages | Prisma schema (opsional) | N/A |

**Milestone:** Monetisasi iklan teroptimasi.

---

## Tracking Progress

### Fase 1: Critical Bug Fixes ✅
- [x] 1.1 Fix order page tanggal hardcode — tambah date input fields, gunakan state di submit
- [x] 1.2 Fix comments page hardcoded stats — tambah endpoint `/comments/stats`, fetch data real
- [x] 1.3 Fix KYC document raw URL — verified: endpoint works with cookies + site query param
- [x] 1.4 Fix syncTrackingToBooking counter — ubah dari `updateMany` ke `findFirst` + `update` satu booking
- [x] 1.5 Hapus fallback packages invalid — ganti dengan empty state message
- [x] 1.6 Samakan upload endpoint — tambah `?purpose=ad` dan response parsing konsisten

### Fase 2: Security Hardening ✅
- [x] 2.1 Buat `useRequireRole` hook — `hooks/useRequireRole.ts`
- [x] 2.2 Tambah page-level guard (10 halaman) — users, categories, settings, admin, admin/ai-usage, review/kyc, review/kyc/[userId], invitations, team, comments
- [x] 2.3 Buat Next.js middleware — `middleware.ts` redirect ke login jika tidak ada token
- [x] 2.4 Tambah slot conflict detection — tolak approve jika ada booking overlap di slot non-leaderboard

### Fase 3: Architecture Improvement ✅
- [x] 3.1 Tambah `bookingId` di Advertisement — Prisma schema + migration + generate client
- [x] 3.2 Refactor cron expiry pakai bookingId — fallback ke imageUrl match untuk data lama
- [x] 3.3 Refactor syncTrackingToBooking pakai bookingId — langsung update booking terkait, fallback ke date range
- [x] 3.4 Split ads/page.tsx — dari 1224 baris → 278 baris (AdvertiserAdsView + SuperadminAdsView)
- [x] 3.5 Tambah date range filter — `startDate`/`endDate` di validator, service, repository + calendar page
- [x] 3.6 Tambah AdSpace type `rectangle_secondary` — type prop + styles object

### Fase 4: Enhancement ✅
- [x] 4.1 Tambah in_feed slot di halaman artikel — AdSpace in-feed setelah paragraf ke-7
- [x] 4.2 Tambah `?purpose=ad` di order page upload — sudah selesai di Fase 1
- [x] 4.3 Evaluasi site-specific packages — design decision, cukup global model saat ini

---

## Risiko & Mitigasi

| Risiko | Probabilitas | Impact | Mitigasi |
|--------|-------------|--------|----------|
| Migration `bookingId` mempengaruhi data existing | Medium | High | Buat migration yang nullable, backfill data existing secara manual |
| Next.js middleware conflict dengan layout-level check | Low | Medium | Test thoroughly: middleware hanya cek token, role check tetap di layout |
| Split ads/page.tsx memperkenalkan regression | Medium | Medium | Buat E2E test untuk ad booking flow sebelum refactor |
| SyncTrackingToBooking refactor mengubah stats | Medium | Low | Reset counter dan dokumentasikan perubahan untuk advertiser |

---

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Page-level role guard coverage | 3/22 (14%) | 13/22 (59%) — semua halaman sensitif |
| Server-side route protection | 0% | 100% dashboard routes |
| Hardcoded placeholder data | 2 instances | 0 |
| AdBooking ↔ Advertisement link | Tidak ada | FK `bookingId` |
| Slot conflict detection | Tidak ada | Otomatis reject overlap |
| Tracking counter accuracy | Inflated (multi-booking) | Akurat per booking |
