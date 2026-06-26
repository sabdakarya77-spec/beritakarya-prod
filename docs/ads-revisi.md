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

### 1. Tidak Ada Self-Registration untuk Pengiklan ✅

**Masalah**: Tidak ada cara bagi user biasa untuk mendaftar sebagai pengiklan. Harus menunggu admin membuatkan akun secara manual.

**Solusi** (sudah diterapkan):
- ✅ Endpoint `POST /auth/upgrade-to-advertiser` — reader bisa upgrade ke advertiser sendiri
- ✅ Komponen `BecomeAdvertiser` — halaman "Jadi Pengiklan" dengan manfaat dan CTA
- ✅ Layout guard diupdate — reader melihat form upgrade, bukan redirect diam-diam
- ✅ Auth store — fungsi `upgradeToAdvertiser()` untuk frontend

### 2. Tidak Ada Cek Ketersediaan Slot ✅

**Masalah**: Pengiklan bisa submit booking untuk slot yang sudah ditempati orang lain. Baru ditolak saat approval — buang waktu.

**Solusi** (sudah diterapkan):
- ✅ Endpoint `GET /ads/availability` — cek slot tersedia atau tidak untuk tanggal tertentu
- ✅ Cek overlap di `POST /bookings` — tolak langsung jika slot sudah ditempati (409)
- ✅ Indikator ketersediaan di UI — badge hijau "Slot Tersedia" / merah "Slot Tidak Tersedia"
- ✅ Tombol "Selanjutnya" disabled jika slot tidak tersedia
- ✅ Leaderboard selalu tersedia (mendukung rotasi)

### 3. Bukti Transfer Wajib Saat Order ✅

**Masalah**: Wizard memaksa upload bukti transfer bersamaan dengan submit materi iklan. Pengiklan harus sudah bayar sebelum submit.

**Solusi** (sudah diterapkan):
- ✅ Bukti transfer jadi opsional di wizard — bisa di-skip
- ✅ Submit booking tanpa bukti → booking langsung dibuat (status PENDING)
- ✅ Success screen tampilkan tombol "Bayar Sekarang" → link ke halaman Pembayaran
- ✅ Halaman Pembayaran (`/{site}/ads/bookings`) sudah bisa upload bukti kapan saja

### 4. Tidak Ada Notifikasi Status ✅

**Masalah**: Setelah submit, pengiklan tidak dapat notifikasi saat iklan disetujui atau ditolak. Harus cek manual.

**Solusi** (sudah diterapkan):
- ✅ Method `sendBookingNotification` di email service — email approve/reject dengan template branded
- ✅ In-app notification via `sendNotification` — muncul di bell icon dashboard
- ✅ Trigger di approve endpoint — email + notifikasi saat iklan disetujui
- ✅ Trigger di reject endpoint — email + notifikasi saat iklan ditolak (dengan alasan)
- ✅ Gagal kirim notifikasi tidak gagalkan proses approve/reject

### 5. Tidak Ada Payment Gateway ✅

**Masalah**: Pembayaran masih manual transfer bank + upload bukti. Proses lambat dan rawan error.

**Solusi** (sudah diterapkan):
- ✅ Integrasi Midtrans Snap — popup pembayaran dengan VA, e-wallet, QRIS, kartu kredit
- ✅ Endpoint `POST /bookings/:id/pay-gateway` — buat Snap transaction
- ✅ Endpoint `POST /webhook/midtrans` — auto-konfirmasi dari Midtrans callback
- ✅ Tombol "Bayar Online" di halaman Pembayaran
- ✅ Manual transfer tetap bisa (fallback)
- ⚠️ Perluisi API key Midtrans di `.env`

---

## Masalah Sedang (Prioritas 2)

### 6. Campaign Name Tidak Tersimpan ✅

**Masalah**: AdStudio menginput `campaignName` di step campaign, tapi tidak pernah dikirim ke API. Data hilang.

**Solusi** (sudah diterapkan):
- ✅ Tambah field `campaignName` ke model `AdBooking` di Prisma
- ✅ Kirim `campaignName` saat create booking
- ✅ Tampilkan di halaman history dan admin booking queue

### 7. End Date Di-Override API ✅

**Masalah**: UI memperbolehkan edit end date, tapi API mengabaikan dan menghitung ulang dari `startDate + durationDays`.

**Solusi** (sudah diterapkan):
- ✅ Kunci end date di UI — tampilkan sebagai teks read-only dengan format tanggal Indonesia
- ✅ End date otomatis di-recompute saat start date atau paket diubah
- ✅ Label durasi paket ditampilkan di samping end date

### 8. Tidak Ada Review Konten Iklan ✅

**Masalah**: Approval hanya cek pembayaran, tidak ada review konten kreatif (image/video).

**Solusi** (sudah diterapkan):
- ✅ Checklist review konten di admin booking card — 5 item yang harus dicentang sebelum approve
- ✅ Tombol "Setujui" disabled jika checklist belum lengkap
- ✅ Item: tidak misleading, tidak SARA, ukuran sesuai, URL aktif, tidak melanggar hak cipta

### 9. Slot Non-Leaderboard Eksklusif 1 Pengiklan ✅

**Masalah**: Untuk rectangle, rectangle_secondary, dan in_feed — hanya 1 pengiklan yang bisa menempati slot. Booking baru menggantikan yang lama.

**Solusi** (sudah diterapkan):
- ✅ Semua slot sekarang mendukung rotasi multi-iklan (sama seperti leaderboard)
- ✅ Approve endpoint: `createAd` + `getNextOrder` untuk semua slot
- ✅ Hapus overlap check — tidak relevan lagi dengan rotasi
- ✅ Availability: semua slot selalu tersedia
- ✅ Frontend: carousel otomatis aktif jika ada 2+ ads di slot yang sama

### 10. Tidak Ada Auto-Expiry ✅

**Masalah**: Iklan tetap aktif setelah endDate habis. Tidak ada cron job untuk menonaktifkan.

**Solusi** (sudah ada sebelumnya):
- ✅ Cron job `ad-expiry` sudah terdaftar di `cron.router.ts`
- ✅ Endpoint `POST /api/cron/ad-expiry` — dijalankan setiap jam
- ✅ Fungsi `runAdExpiry()` di `ad-expiry.ts` — cek ACTIVE + endDate lewat → COMPLETED + nonaktifkan Advertisement
  - `apps/api/src/modules/ad/ad.repository.ts`

---

## Masalah Kecil (Prioritas 3)

### 11. Duplicate Admin Views ✅

**Masalah**: Halaman booking approval ada di 2 tempat (standalone page + embedded tab).

**Solusi** (sudah diterapkan):
- ✅ Komponen `BookingReviewList` — reusable, include checklist review konten + campaign name
- ✅ Standalone page dan embedded tab menggunakan komponen yang sama
- ✅ Hapus ~180 baris kode duplikat dari `SuperadminAdsView.tsx`

### 12. `wapimred` Tidak Bisa Approve

**Masalah**: Wapimred bisa lihat booking queue tapi API menolak approve/reject (butuh superadmin).

**Solusi**: Tambah permission approve/reject untuk role `wapimred`, atau sembunyikan tombol jika tidak punya akses.

### 13. Rate Limit di Booking Creation ✅

**Masalah**: Tidak ada rate limit di `POST /ads/bookings`.

**Solusi** (sudah diterapkan):
- ✅ `bookingLimiter` — 10 booking per user per jam
- ✅ Diterapkan di `POST /bookings` sebelum middleware auth

### 14. Error Handling di Order Flow ✅

**Masalah**: Jika booking berhasil tapi upload bukti gagal, booking orphan di status PENDING.

**Solusi** (sudah diterapkan):
- ✅ State `receiptUploadFailed` — track jika upload gagal
- ✅ Warning di success screen — "Gagal mengunggah bukti transfer"
- ✅ Tombol "Bayar Sekarang" tetap muncul jika receipt gagal

---

## Ringkasan Prioritas

| # | Masalah | Prioritas | Estimasi |
|---|---------|-----------|----------|
| 1 | Self-registration pengiklan | ✅ Selesai | — |
| 2 | Cek ketersediaan slot | ✅ Selesai | — |
| 3 | Pisahkan bayar dari order | ✅ Selesai | — |
| 4 | Notifikasi email | ✅ Selesai | — |
| 5 | Payment gateway | ✅ Selesai | — |
| 6 | Campaign name tersimpan | ✅ Selesai | — |
| 7 | End date konsisten | ✅ Selesai | — |
| 8 | Review konten iklan | ✅ Selesai | — |
| 9 | Rotasi slot non-leaderboard | ✅ Selesai | — |
| 10 | Auto-expiry cron | ✅ Sudah Ada | — |
| 11 | Duplicate admin views | ✅ Selesai | — |
| 12 | Permission wapimred | 🟢 Kecil | 0.5 hari |
| 13 | Rate limit booking | ✅ Selesai | — |
| 14 | Error handling order | ✅ Selesai | — |

---

## Catatan

- Dokumentasi API ads: `docs/ads.md`
- Infrastruktur produksi: `docs/architecture.md`, `docs/panduan_produksi_lxc.md`
- Slot definitions: `apps/web/lib/constants.ts`
