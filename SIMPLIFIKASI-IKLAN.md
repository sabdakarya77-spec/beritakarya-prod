# Simplifikasi Iklan Mandiri + Integrasi Google AdSense — BeritaKarya

## Latar Belakang & Tujuan

Dokumen ini dibuat karena Mas Aji sedang mengajukan monetisasi **Google AdSense** untuk `beritakarya.co`. Saat audit awal, ditemukan bahwa situs sudah punya sistem iklan mandiri sendiri (booking, payment Midtrans, Ad Studio, video production) yang **belum pernah dipakai** (0 iklan aktif) — sehingga berpotensi bikin bingung/bentrok kalau AdSense ditambahkan begitu saja tanpa dirapikan dulu.

Dua tujuan dokumen ini:
1. **Simplifikasi sistem iklan mandiri** — buang wizard/pipeline kompleks (booking, payment, video production, smart-crop, A/B testing), sisakan render iklan + 1 form admin minimal (upload manual: gambar, link, slot, tanggal). Semua slot jadi full image (drop video). Ukuran disamakan ke standar Google (300×250 untuk semua slot IMAGE, 970×250/728×90/320×100 untuk HOME_TOP).
2. **Integrasi Google AdSense** — dipasang di posisi fallback slot yang kosong (belum ada pengiklan mandiri), sehingga slot yang nganggur tetap menghasilkan, dan otomatis mundur begitu ada pengiklan mandiri booking slot yang sama.

Status saat ini: 0 iklan mandiri aktif → **aman, tidak ada migrasi data yang perlu dijaga.** Akun AdSense: sudah daftar, masih menunggu review.

### Catatan struktur multi-tenant
`beritakarya.co` bukan single-site — ini subdomain-based multi-tenant (`SITE_MAP` di `packages/config/src/site.ts`): `beritakarya.co` (pusat), `bandung.beritakarya.co`, `surabaya.beritakarya.co`, dst. Semua dilayani 1 deployment Next.js yang sama. Ini relevan untuk bagian AdSense di bawah (lihat poin 1 & 2).

---

## 1. Database (`apps/api/prisma/schema.prisma`)

### Hapus model sepenuhnya
- `AdPackage` (paket harga per durasi)
- `AdBooking` (transaksi pemesanan, status approval, Midtrans)
- `VideoPrompt` (prompt library video ads)
- `VideoProviderConfig` (API key Seedance/Kling/Hailuo/Pika/Luma/Runway)
- `AdPaymentConfig` (config Midtrans + rekening bank + QRIS)

### Sederhanakan model `Advertisement`
Hapus field:
```
code              // script/HTML ad tag mentah — drop, full image only
imageUrlTablet    // tidak perlu variant per device lagi
imageUrlMobile
imageUrlTabletAlt
imageUrlMobileAlt
variantAUrl       // A/B testing — drop
variantBUrl
winnerVariant
animationEffect   // sudah ditandai deprecated di kode
bookingId         // relasi ke AdBooking yang dihapus
```
Sisakan:
```prisma
model Advertisement {
  id          String   @id @default(uuid())
  siteId      String
  slot        String   // HOME_TOP | HOME_FEED_1 | HOME_FEED_2 | ARTICLE_TOP | ARTICLE_MIDDLE | ARTICLE_BOTTOM
  imageUrl    String   // satu gambar, admin upload manual ukuran yang sudah pas
  linkUrl     String?
  isActive    Boolean  @default(true)
  order       Int      @default(0)
  impressions Int      @default(0)
  clicks      Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  site        Site         @relation(fields: [siteId], references: [id])
  adEventLogs AdEventLog[]

  @@index([siteId, slot])
}
```
`AdEventLog` — **tetap dipakai apa adanya**, cuma hapus relasi ke `bookingId`.

Setelah edit schema: `pnpm --filter @beritakarya/api run db:generate` lalu buat migrasi baru (`db:migrate`). Karena tabel masih kosong, migrasi drop-column aman tanpa risiko kehilangan data.

---

## 2. Backend — `apps/api/src/modules/ad/`

### `ad.controller.ts` (1010 baris → sisakan ~8 route)

**Pertahankan:**
| Method | Path | Fungsi |
|---|---|---|
| POST | `/track/:id` | tracking impression/klik |
| GET | `/public` | fetch iklan aktif untuk `AdSpace` (publik) |
| GET | `/fallback` | fallback CMS untuk HOME_TOP kosong (opsional, boleh dibuang juga jika showcase promosi diri juga dihapus) |
| GET | `/` | list iklan (admin) |
| POST | `/` | create iklan (admin) |
| PATCH | `/:id` | update iklan (admin) |
| DELETE | `/:id` | delete iklan (admin) |
| PATCH | `/reorder` | ubah urutan carousel (admin) |

**Hapus seluruhnya:**
- `GET/PUT /payment-config` — Midtrans + rekening bank
- `GET /packages`, `POST /packages`, `PATCH /packages/:id`, `DELETE /packages/:id`
- `GET /bundles` (→ hapus juga `bundle-pricing.ts`)
- `GET /availability` (cek ketersediaan slot untuk booking)
- `POST /bookings`, `GET /bookings/my`, `GET /bookings/:id/stats`, `POST /bookings/:id/pay`, `POST /bookings/:id/cancel`, `POST /bookings/:id/pay-gateway`
- `POST /webhook/midtrans`
- `GET /bookings/all`, `POST /bookings/:id/approve`, `POST /bookings/:id/reject`
- `GET /production/providers`, `POST /production/providers`, `DELETE /production/providers/:provider`, `POST /production/:bookingId/generate`

### File lain di `apps/api/src/modules/ad/`
- `ad.repository.ts` (432 baris) — pangkas semua query terkait booking/package/video provider, sisakan CRUD `Advertisement` + `AdEventLog`
- `ad.service.ts` (106 baris) — sesuaikan, kemungkinan besar tetap
- `bundle-pricing.ts` — **hapus file**

### `apps/api/src/lib/video-providers/` — **hapus seluruh folder**
(`base.ts`, `index.ts`, `runway.ts`, `kling.ts`, `luma.ts`, `hailuo.ts`, `seedance.ts`, `pika.ts`)

### Cek juga
- Webhook Midtrans mungkin terdaftar di route/middleware global — pastikan tidak ada referensi orphan setelah dihapus
- Env vars terkait Midtrans (`MIDTRANS_*`) di `.env.example` boleh dibersihkan setelahnya

### File tambahan yang WAJIB disesuaikan (referensi orphan — ditemukan lewat review kedua)
File-file ini **tidak disebut di draft pertama** tapi memanggil `adBooking`/`adPackage` langsung — akan **crash** kalau model dihapus tanpa menyentuh ini:

- **`apps/api/src/cron/ad-expiry.ts`** — cron job auto-nonaktifkan iklan expired, query `prisma.adBooking.findMany()`/`.update()`. Perlu ditulis ulang untuk query `Advertisement` langsung (pakai field `startDate`/`endDate` kalau nanti ditambahkan, atau cukup toggle `isActive` manual oleh admin — sesuaikan dengan keputusan di bagian 4).
- **`apps/api/src/modules/site/site.service.ts`** (baris ~523, ~536, ~549) — ada `prisma.adBooking.count({ where: { siteId } })` sebagai "delete blocker" saat cek boleh/tidaknya hapus site. Ganti jadi hitung `Advertisement` aktif, atau hapus blocker ini sepenuhnya.
- **`apps/api/src/scripts/e2e-seed.ts`** (baris 135, 159) — seed `prisma.adPackage.upsert()` untuk data testing. Hapus/ganti dengan seed `Advertisement` langsung.
- **`apps/api/src/scripts/e2e-teardown.ts`** (baris 29, 35) — cleanup `adBooking.deleteMany()` & `adPackage.deleteMany()`. Sesuaikan ke model baru.
- **`apps/api/src/modules/ad/ad.service.ts`** — fungsi `syncTrackingToBooking()` (baris 30-69) query & update `adBooking` langsung untuk sinkronisasi impression/klik ke booking. **Fungsi ini harus dihapus total**, bukan "kemungkinan besar tetap" seperti draft awal — tracking impression/klik cukup update `Advertisement.impressions`/`.clicks` langsung tanpa sinkron ke booking manapun.

---

## 3. Frontend — halaman & komponen

### Hapus total (advertiser-facing, `apps/web/app/[site]/ads/`)
```
ads/page.tsx
ads/layout.tsx
ads/order/page.tsx
ads/bookings/page.tsx
ads/history/page.tsx
ads/packages/page.tsx
ads/settings/page.tsx
ads/slots/page.tsx
```

### Hapus total (admin dashboard, `apps/web/app/[site]/dashboard/(admin)/ads/`)
```
ads/packages/page.tsx
ads/payment-config/page.tsx
ads/production/page.tsx
ads/bookings/page.tsx
```
**Pertahankan & sederhanakan:** `ads/page.tsx` dan `ads/slots/page.tsx` — jadikan basis untuk form admin minimal baru (lihat bagian 4).

### Hapus total (`apps/web/components/dashboard/ads/`)
```
studio/                     (seluruh folder — AdStudio wizard 4 langkah)
production/                 (seluruh folder — video production UI)
AdPerformanceChart.tsx      (opsional: sisakan versi sederhana jika masih mau lihat impresi/klik)
BookingReviewList.tsx
AdvertiserAdsView.tsx
BecomeAdvertiser.tsx
pages/AdsPackagesContent.tsx
HeroBannerManager.tsx / HeroBannerRow.tsx   (khusus untuk booking HOME_TOP — ganti dengan form upload biasa)
```
**Pertahankan/sederhanakan:** `AdSlotCard.tsx`, `AdsSubNav.tsx`, `pages/AdsOverviewContent.tsx`, `pages/AdsSlotsContent.tsx`, `types.ts`

### `components/marketing/AdsMarketingPage.tsx`
Halaman publik `/p/ads` yang jadi landing pitch ke calon advertiser. Kontennya sekarang mengarahkan ke Ad Studio/booking flow yang sudah dihapus. **Ubah CTA-nya** dari "Pesan Sekarang" (self-service) jadi "Hubungi Kami" (WhatsApp/email redaksi) — sesuai alur baru: advertiser kirim materi ke admin, admin yang input manual.

### `components/ui/AdSpace.tsx` — sederhanakan
Hapus:
- Semua logic video (`isVideoFile`, `FallbackVideo`, video player, mute toggle, `preload="none"` observer)
- A/B testing (`selectedVariant`, `resolveUrl`, `variantAUrl`/`variantBUrl`/`winnerVariant`, `sessionStorage` A/B pick)
- Script ad iframe (`ad.code` sandboxed iframe) — full image only, hilangkan juga `ANIM_CLASS_MAP`/`animationEffect`
- `imageUrlTablet`/`imageUrlMobile` responsive `<picture>` branching — cukup 1 `imageUrl` + `SmartImage` yang sudah otomatis responsive dari Next.js Image

Sisakan: fetch `/api/v1/ads/public`, render `<a><img/></a>` sederhana + label "Iklan", carousel rotate kalau >1 iklan per slot, tracking impression/klik.

### Layout templates yang mereferensikan ukuran lama
Update `styles` (aspect-ratio class) di:
- `apps/web/components/ui/AdSpace.tsx`
- `apps/web/components/templates/layouts/DataDrivenLayout.tsx`
- `apps/web/components/templates/layouts/VisualStorytellingLayout.tsx`
- `apps/web/components/templates/layouts/CompactDenseLayout.tsx`
- `apps/web/components/templates/layouts/MagazineBoldLayout.tsx`
- `apps/web/components/templates/layouts/ClassicEditorialLayout.tsx`

Ukuran baru (semua device sama, kecuali HOME_TOP):
| Slot | Ukuran baru |
|---|---|
| HOME_TOP desktop | 970×250 |
| HOME_TOP tablet | 728×90 |
| HOME_TOP mobile | 320×100 |
| HOME_FEED_1 / HOME_FEED_2 / ARTICLE_TOP / ARTICLE_MIDDLE / ARTICLE_BOTTOM | 300×250 (semua device) |

### `apps/web/lib/constants.ts` & `apps/api/src/config/ad-slots.ts`
Update `AD_SLOT_DEFINITIONS` / `AD_SLOT_CONFIG`:
- Semua slot `format: 'IMAGE'` (HOME_TOP tidak lagi `'VIDEO'`)
- Update `size`/`dimensions`/`publicSize`/`publicHighlights`/`publicMockup` sesuai tabel di atas
- Hapus juga `AD_BANK_ACCOUNTS` (baris 268) — cuma dipakai `ads/bookings/page.tsx` yang sudah dihapus

### File frontend tambahan yang WAJIB disesuaikan (referensi orphan — ditemukan lewat review kedua)
- **`apps/web/components/dashboard/AdvertiserDashboardOverview.tsx`** — fetch ke `/ads/bookings/my` (endpoint yang sudah dihapus). Hapus komponen ini, atau tulis ulang jadi ringkasan sederhana kalau masih mau ada dashboard khusus advertiser.
- **`apps/web/app/[site]/dashboard/(admin)/layout.tsx`** (baris ~170) — menu sidebar "Setelan Iklan" mengarah ke `/dashboard/ads/payment-config` yang sudah dihapus. Ganti link-nya ke halaman admin ads yang baru (form minimal di bagian 4), atau hapus item menu-nya.
- **`apps/web/components/dashboard/ads/AdsSubNav.tsx`** — daftar `NAV_ITEMS` isinya Overview, Slot Iklan, **Paket**, **Booking**, **Produksi Video**, **Riwayat** (role `advertiser`). Pangkas jadi cuma "Overview" & "Slot Iklan" saja.
- **`apps/web/app/[site]/p/[slug]/page.tsx`** (baris 19) — fetch `/api/v1/ads/packages?site=${site}` untuk render halaman `/p/ads` (marketing). Draft awal cuma bilang "ubah CTA" di `AdsMarketingPage`, padahal data source-nya (fetch packages) juga perlu diganti — ganti jadi static copy/kontak manual, jangan fetch API yang sudah tidak ada.

### Keputusan yang perlu diambil: role `advertiser`
Role `advertiser` dipakai luas: `auth.controller.ts` (registrasi + endpoint self-service `POST /upgrade-to-advertiser`), halaman `register`/`login`, user management admin, `invitation.controller.ts`, `admin.router.ts`, `seed-quotas.ts`. Karena alur baru "advertiser kirim materi ke admin, admin yang input manual", self-service upgrade-to-advertiser ini jadi tidak relevan.

**Rekomendasi:** biarkan role `advertiser` tetap ada di enum (dipakai luas, risiko rendah kalau dibiarkan), tapi **hapus endpoint `POST /auth/upgrade-to-advertiser`** di `auth.controller.ts` (baris 159-198) beserta opsi role `advertiser` saat registrasi publik (baris 65, 150) — supaya tidak ada jalur self-service yang mengarah ke fitur yang sudah tidak ada. Kalau admin masih mau assign role `advertiser` manual ke user tertentu (misal buat keperluan pencatatan), itu tetap bisa lewat user management admin biasa.

### Testing — E2E
- **`apps/web/tests/e2e/ad-booking.spec.ts`** — hapus test file ini (seluruh alur booking sudah tidak ada)
- **`apps/web/tests/e2e/helpers/api-mock.ts`** — hapus mock terkait booking/packages di dalamnya

---

## 4. Yang perlu DIBUAT baru (minimal)

Form admin sederhana (bisa reuse `AdSlotCard.tsx` + `ads/page.tsx` yang sudah ada, dipangkas):
- Pilih slot (dropdown 6 slot)
- Upload 1 gambar (langsung ke storage/media existing, tanpa smart-crop pipeline)
- Input link tujuan
- Tanggal mulai/selesai (opsional, atau cukup toggle aktif/nonaktif manual)
- Toggle aktif/nonaktif
- List iklan berjalan per slot + tombol hapus/reorder

Ini cukup 1 halaman React + endpoint CRUD yang sudah dipertahankan di bagian 2.

---

## 5. Urutan eksekusi yang aman

1. Ubah `schema.prisma` → `db:generate` → buat migrasi baru → `db:migrate` (dev dulu, baru deploy)
2. Update `ad-slots.ts` (backend) & `constants.ts` (frontend) — ukuran & format baru, hapus `AD_BANK_ACCOUNTS`
3. Pangkas `ad.controller.ts` + `ad.repository.ts` + `ad.service.ts` (termasuk hapus `syncTrackingToBooking()`), hapus `bundle-pricing.ts`
4. Hapus folder `apps/api/src/lib/video-providers/`
5. **Sesuaikan `cron/ad-expiry.ts`** — ganti query dari `adBooking` ke `Advertisement`
6. **Sesuaikan `site.service.ts`** — ganti/hapus delete-blocker `adBooking.count()`
7. **Sesuaikan `scripts/e2e-seed.ts` & `scripts/e2e-teardown.ts`** — ganti seed/cleanup dari `adPackage`/`adBooking` ke `Advertisement`
8. **Ambil keputusan role `advertiser`** — hapus endpoint `POST /auth/upgrade-to-advertiser` + opsi role saat registrasi publik (lihat bagian 4)
9. Sederhanakan `AdSpace.tsx` (drop video/AB/script)
10. Update 5 file layout template (aspect ratio class)
11. Hapus halaman advertiser-facing (`ads/order`, `ads/bookings`, dst) + admin sub-pages yang tidak relevan
12. Hapus komponen `studio/`, `production/`, booking-related di `components/dashboard/ads/`
13. **Sesuaikan `AdsSubNav.tsx`** — pangkas jadi cuma "Overview" & "Slot Iklan"
14. **Sesuaikan `dashboard/(admin)/layout.tsx`** — ganti/hapus link menu "Setelan Iklan"
15. **Hapus/tulis ulang `AdvertiserDashboardOverview.tsx`**
16. Bangun form admin minimal baru (poin 4)
17. Update `AdsMarketingPage.tsx` (CTA jadi kontak manual) **dan** `app/[site]/p/[slug]/page.tsx` (hapus fetch `/api/v1/ads/packages`, ganti static copy)
18. **Hapus `tests/e2e/ad-booking.spec.ts`** + bersihkan mock booking/packages di `tests/e2e/helpers/api-mock.ts`
19. Bersihkan `.env.example` dari `MIDTRANS_*` bila tidak dipakai modul lain
20. `pnpm build` + `pnpm type-check` full monorepo untuk pastikan tidak ada import orphan

**Catatan:** environment sandbox saya tidak bisa generate Prisma Client yang valid (network-blocked) dan tidak ada akses DB — jadi langkah `db:migrate` dan validasi build harus dijalankan di environment lokal Mas Aji, bukan di sini.

---

## 6. Integrasi Google AdSense — 3 hal yang masih perlu dikerjakan

Status akun: sudah daftar, menunggu review. Publisher ID (`pub-XXXXXXXXXXXXXXXX`) belum diberikan — begitu ada, langsung bisa dipasang di 2 titik di bawah.

**Keputusan penyimpanan Publisher ID: Opsi A — 1 env var global**, bukan field per-situs di database. Karena semua "situs" (`pusat`, `bandung`, `surabaya`, dst.) adalah subdomain dari root domain yang sama dan dilayani 1 deployment yang sama, 1 env var sudah otomatis berlaku ke semua subdomain tanpa perlu input tambahan di admin dashboard tiap kali ada cabang baru. `ads.txt` di root domain juga otomatis meng-cover semua subdomain-nya (selama Publisher ID sama), jadi tidak perlu `ads.txt` terpisah per subdomain. Kalau nanti tiap cabang butuh Publisher ID berbeda-beda, baru migrasi ke field `Site.adsensePublisherId` di database (pola ini sudah ada presedennya di kode — lihat `Site.gaMeasurementId` untuk Google Analytics per-situs).

```
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=pub-XXXXXXXXXXXXXXXX
```

### 1. `ads.txt` di root domain
- Buat route yang serve `beritakarya.co/ads.txt` — isinya 1 baris: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
- Wajib untuk proses review AdSense
- Cukup di root domain saja (`beritakarya.co`), otomatis berlaku untuk `bandung.beritakarya.co`, `surabaya.beritakarya.co`, dst.

### 2. Script snippet AdSense (`adsbygoogle.js`) di `<head>`
- Google butuh script ini terpasang di semua halaman supaya bisa crawl situs selama proses review
- Pasang di root layout (`apps/web/app/layout.tsx` atau layout per-site jika ada), pakai env var di atas — otomatis berlaku ke semua subdomain karena 1 deployment yang sama

### 3. Penempatan unit iklan di fallback slot
- Pasang di posisi fallback semua 6 slot: `HOME_TOP`, `HOME_FEED_1`, `HOME_FEED_2`, `ARTICLE_TOP`, `ARTICLE_MIDDLE`, `ARTICLE_BOTTOM` — menggantikan `InFeedShowcase`/`BillboardShowcase` (showcase promosi diri sendiri yang sekarang tidak menghasilkan apa-apa)
- Pakai **responsive/fluid ad unit** (bukan fixed-size) supaya otomatis menyesuaikan ke ukuran container 300×250 (atau 970×250 untuk HOME_TOP) yang baru
- Logic auto-override tetap jalan seperti sekarang: ada pengiklan mandiri booking → tampil iklan mandiri; slot kosong → tampil AdSense
- **Catatan penting:** Perilaku sticky bottom mobile pada `HOME_TOP` dihapus (kode lama: `fixed bottom-[72px]` + close button setelah 5 detik). Ini adalah "pemanis" yang tidak perlu dan berpotensi melanggar Better Ads Standards (2 elemen sticky sekaligus). Sekarang `HOME_TOP` tampil normal inline di semua device — aman untuk dipasangi AdSense.

**Detail arsitektur render (klarifikasi penting):**
- Buat komponen terpisah, misal `<AdSenseUnit slot="..." />`, **bukan** ditumpuk ke dalam logic `AdSlide`/iframe sandboxed yang ada di `AdSpace.tsx`. Alasan: unit `<ins class="adsbygoogle">` butuh akses same-origin (cookie, dsb.) untuk berfungsi — tidak bisa jalan di dalam `<iframe sandbox="allow-scripts allow-popups">` yang dipakai untuk render `ad.code` iklan mandiri. Karena field `code` sudah dihapus dari `Advertisement` (bagian 1), path iframe ini otomatis tidak lagi dipakai — tapi tetap perlu ditegaskan supaya AdSense dipasang lewat komponen baru yang render langsung ke DOM, bukan lewat jalur lama.
- Titik pemasangan: di dalam `AdSpace.tsx`, pada percabangan `ads.length === 0` (sekarang menampilkan `InFeedShowcase`/`BillboardShowcase`) — ganti render-nya jadi `<AdSenseUnit />` untuk kelima slot IMAGE tadi.

**Bergantung pada:** Publisher ID dari Mas Aji, dan pembersihan slot ukuran (bagian 3 dokumen ini) sudah dieksekusi lebih dulu supaya container AdSense punya ukuran yang benar.

---

## 7. Status Pengerjaan

> Checklist ini diperbarui setiap bagian selesai dikerjakan.

| Langkah | Deskripsi | Status |
|---------|-----------|--------|
| 1 | Update `schema.prisma` + migration manual `20260808000000_simplify_ads` | ✅ Selesai |
| 2 | Update `ad-slots.ts` & `constants.ts` (ukuran & format) | ✅ Selesai |
| 3 | Pangkas `ad.controller.ts` + `ad.repository.ts` + `ad.service.ts`, hapus `bundle-pricing.ts` | ✅ Selesai |
| 4 | Hapus folder `video-providers/` | ✅ Selesai |
| 5 | Sesuaikan `cron/ad-expiry.ts` | ✅ Selesai |
| 6 | Sesuaikan `site.service.ts` | ✅ Selesai |
| 7 | Sesuaikan `scripts/e2e-seed.ts` & `e2e-teardown.ts` | ✅ Selesai |
| 8 | Keputusan role `advertiser` — hapus endpoint upgrade + opsi registrasi | ✅ Selesai |
| 8a | Sesuaikan `authStore.ts` (hapus `upgradeToAdvertiser`) | ✅ Selesai |
| 9 | Sederhanakan `AdSpace.tsx` | ✅ Selesai |
| 10 | Update 5 file layout template | ✅ Selesai (tidak ada perubahan — layout mendelegasikan ukuran ke AdSpace.tsx) |
| 11 | Hapus halaman advertiser-facing + admin sub-pages | ✅ Selesai |
| 12 | Hapus komponen `studio/`, `production/`, booking-related | ✅ Selesai |
| 13 | Sesuaikan `AdsSubNav.tsx` | ✅ Selesai |
| 14 | Sesuaikan `dashboard/(admin)/layout.tsx` | ✅ Selesai |
| 15 | Hapus/tulis ulang `AdvertiserDashboardOverview.tsx` | ✅ Selesai |
| 16 | Bangun form admin minimal baru | ✅ Selesai (AdsSlotsContent pakai AdSlotCard utk semua slot) |
| 17 | Update `AdsMarketingPage.tsx` + `p/[slug]/page.tsx` | ✅ Selesai |
| 18 | Hapus E2E tests + bersihkan mock | ✅ Selesai |
| 19 | Bersihkan `.env.example` | ✅ Selesai |
| 20 | Verifikasi build & type-check (perlu env lokal) | ⬜ (perlu dijalankan di env lokal Mas Aji) |
| 21 | Tambah `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` ke `.env.local` & `.env.example` | ✅ Selesai |
| 22 | Buat route `ads.txt` | ✅ Selesai |
| 23 | Pasang script `adsbygoogle.js` di root layout | ✅ Selesai |
| 24 | Buat komponen `AdSenseUnit` | ✅ Selesai |
| 25 | Pasang `AdSenseUnit` di fallback slot `AdSpace.tsx` (semua 6 slot) | ✅ Selesai |
| 26 | Hapus sticky bottom mobile `HOME_TOP` + pasang AdSense di HOME_TOP | ✅ Selesai |
