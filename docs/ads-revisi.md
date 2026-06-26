# Ads System — Revisi & Perbaikan

Dokumen ini berisi daftar masalah dan rencana perbaikan sistem periklanan BeritaKarya, berdasarkan evaluasi alur dari sudut pandang pengiklan.

---

## Status Saat Ini

Sistem ads sudah memiliki fondasi yang cukup baik:
- Ad Studio wizard 4 langkah (Pilih Paket → Detail → Upload → Bayar)
- Preview mockup posisi iklan
- Analytics impresi/klik/CTR
- 4 slot iklan (leaderboard, rectangle, rectangle_secondary, in_feed)
- Fallback showcase untuk slot kosong

Namun masih ada beberapa masalah kritis yang perlu diperbaiki sebelum sistem siap dipakai pengiklan eksternal.

---

## Masalah Kritis (Prioritas 1)

### 1. Tidak Ada Self-Registration untuk Pengiklan

**Masalah**: Tidak ada cara bagi user biasa untuk mendaftar sebagai pengiklan. Harus menunggu admin membuatkan akun secara manual.

**Solusi**:
- Tambah tombol "Jadi Pengiklan" di halaman `/{site}/ads`
- Buat form pendaftaran dengan field: nama bisnis, kontak, jenis usaha
- Setelah daftar, role user di-upgrade ke `advertiser` (bisa langsung atau perlu approval admin)
- File terkait:
  - `apps/web/app/[site]/ads/page.tsx`
  - `apps/api/src/modules/auth/` (tambah endpoint upgrade role)

### 2. Tidak Ada Cek Ketersediaan Slot

**Masalah**: Pengiklan bisa submit booking untuk slot yang sudah ditempati orang lain. Baru ditolak saat approval — buang waktu.

**Solusi**:
- Tambah kalender ketersediaan slot di step 1 (pilih paket)
- Tampilkan slot mana yang sudah terbooking untuk rentang tanggal tertentu
- Endpoint baru: `GET /ads/slots/availability?slot=...&start=...&end=...`
- File terkait:
  - `apps/api/src/modules/ad/ad.controller.ts`
  - `apps/api/src/modules/ad/ad.repository.ts`
  - `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx`

### 3. Bukti Transfer Wajib Saat Order

**Masalah**: Wizard memaksa upload bukti transfer bersamaan dengan submit materi iklan. Pengiklan harus sudah bayar sebelum submit.

**Solusi**:
- Pisahkan alur: Submit materi → Dapat invoice → Bayar → Upload bukti
- Step payment di wizard cukup tampilkan info rekening + tombol "Bayar Nanti"
- Halaman bookings tetap bisa upload bukti kapan saja
- File terkait:
  - `apps/web/components/dashboard/ads/studio/StudioContext.tsx` (ubah handleSubmit)
  - `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx` (ubah step payment)

### 4. Tidak Ada Notifikasi Status

**Masalah**: Setelah submit, pengiklan tidak dapat notifikasi saat iklan disetujui atau ditolak. Harus cek manual.

**Solusi**:
- Kirim email notifikasi saat status booking berubah (approved/rejected)
- Tambah bell icon notifikasi di dashboard pengiklan
- Bisa pakai Resend/SendGrid untuk email
- File terkait:
  - `apps/api/src/modules/ad/ad.controller.ts` (tambah trigger notifikasi di approve/reject)
  - `apps/api/src/modules/notification/` (buat modul baru atau gunakan yang sudah ada)

### 5. Tidak Ada Payment Gateway

**Masalah**: Pembayaran masih manual transfer bank + upload bukti. Proses lambat dan rawan error.

**Solusi**:
- Integrasi Midtrans atau Xendit
- Auto-konfirmasi pembayaran (tidak perlu upload bukti)
- Tetap opsi manual transfer sebagai fallback
- File terkait:
  - `apps/api/src/modules/payment/` (buat modul baru)
  - `apps/web/components/dashboard/ads/studio/StudioContext.tsx`

---

## Masalah Sedang (Prioritas 2)

### 6. Campaign Name Tidak Tersimpan ✅

**Masalah**: AdStudio menginput `campaignName` di step campaign, tapi tidak pernah dikirim ke API. Data hilang.

**Solusi** (sudah diterapkan):
- ✅ Tambah field `campaignName` ke model `AdBooking` di Prisma
- ✅ Kirim `campaignName` saat create booking
- ✅ Tampilkan di halaman history dan admin booking queue

### 7. End Date Di-Override API

**Masalah**: UI memperbolehkan edit end date, tapi API mengabaikan dan menghitung ulang dari `startDate + durationDays`.

**Solusi**:
- Pilih salah satu: (a) kunci end date di UI, atau (b) biarkan API pakai end date dari client
- Opsi (a) lebih sederhana — hilangkan edit end date, tampilkan sebagai info saja
- File terkait:
  - `apps/web/components/dashboard/ads/studio/StudioCanvas.tsx`
  - `apps/api/src/modules/ad/ad.controller.ts`

### 8. Tidak Ada Review Konten Iklan

**Masalah**: Approval hanya cek pembayaran, tidak ada review konten kreatif (image/video).

**Solusi**:
- Tambah step review konten di admin: preview kreatif + checklist (tidak misleading, tidak SARA, dll)
- Bisa digabung dengan approval atau jadi step terpisah
- File terkait:
  - `apps/web/app/[site]/dashboard/(admin)/ads/bookings/page.tsx`

### 9. Slot Non-Leaderboard Eksklusif 1 Pengiklan

**Masalah**: Untuk rectangle, rectangle_secondary, dan in_feed — hanya 1 pengiklan yang bisa menempati slot. Booking baru menggantikan yang lama.

**Solusi**:
- Tambah rotasi untuk slot non-leaderboard (sudah ada untuk leaderboard)
- Bisa pakai sistem round-robin atau weighted rotation
- File terkait:
  - `apps/api/src/modules/ad/ad.repository.ts` (createOrUpdateAdForSlot)
  - `apps/web/components/ui/AdSpace.tsx`

### 10. Tidak Ada Auto-Expiry

**Masalah**: Iklan tetap aktif setelah endDate habis. Tidak ada cron job untuk menonaktifkan.

**Solusi**:
- Tambah cron job yang jalan setiap hari
- Cek booking yang `endDate < today` dan status `ACTIVE`
- Set `isActive = false` pada Advertisement terkait
- File terkait:
  - `apps/api/src/cron/` (tambah adExpiry cron)
  - `apps/api/src/modules/ad/ad.repository.ts`

---

## Masalah Kecil (Prioritas 3)

### 11. Duplicate Admin Views

**Masalah**: Halaman booking approval ada di 2 tempat (standalone page + embedded tab).

**Solusi**: Gabungkan jadi satu komponen yang bisa dipakai di kedua tempat.

### 12. `wapimred` Tidak Bisa Approve

**Masalah**: Wapimred bisa lihat booking queue tapi API menolak approve/reject (butuh superadmin).

**Solusi**: Tambah permission approve/reject untuk role `wapimred`, atau sembunyikan tombol jika tidak punya akses.

### 13. Rate Limit di Booking Creation

**Masalah**: Tidak ada rate limit di `POST /ads/bookings`.

**Solusi**: Tambah rate limiter (misalnya 10 booking per jam per user).

### 14. Error Handling di Order Flow

**Masalah**: Jika booking berhasil tapi upload bukti gagal, booking orphan di status PENDING.

**Solusi**: Tambah retry mechanism atau rollback. Jangan tampilkan success screen jika ada step yang gagal.

---

## Ringkasan Prioritas

| # | Masalah | Prioritas | Estimasi |
|---|---------|-----------|----------|
| 1 | Self-registration pengiklan | 🔴 Kritis | 2-3 hari |
| 2 | Cek ketersediaan slot | 🔴 Kritis | 1-2 hari |
| 3 | Pisahkan bayar dari order | 🔴 Kritis | 1 hari |
| 4 | Notifikasi email | 🔴 Kritis | 1-2 hari |
| 5 | Payment gateway | 🔴 Kritis | 2-3 hari |
| 6 | Campaign name tersimpan | ✅ Selesai | — |
| 7 | End date konsisten | 🟡 Sedang | 0.5 hari |
| 8 | Review konten iklan | 🟡 Sedang | 1 hari |
| 9 | Rotasi slot non-leaderboard | 🟡 Sedang | 1-2 hari |
| 10 | Auto-expiry cron | 🟡 Sedang | 0.5 hari |
| 11 | Duplicate admin views | 🟢 Kecil | 0.5 hari |
| 12 | Permission wapimred | 🟢 Kecil | 0.5 hari |
| 13 | Rate limit booking | 🟢 Kecil | 0.5 hari |
| 14 | Error handling order | 🟢 Kecil | 0.5 hari |

---

## Catatan

- Dokumentasi API ads: `docs/ads.md`
- Infrastruktur produksi: `docs/architecture.md`, `docs/panduan_produksi_lxc.md`
- Slot definitions: `apps/web/lib/constants.ts`
