# Plan Kerja: Sistem Manajemen Iklan — BeritaKarya
*Versi 3.0 · Juni 2026 · Diselaraskan dengan dokumentasi aktual project*

---

## Status Project Saat Ini

Project ini **sudah berjalan** — bukan greenfield. Mayoritas sistem inti sudah selesai.
Plan kerja ini fokus pada: **apa yang tersisa, apa yang perlu ditingkatkan, dan roadmap ke depan.**

---

## Tech Stack Aktual

```
Monorepo (pnpm workspaces)
├── apps/api/          NestJS + TypeScript + Prisma
└── apps/web/          Next.js + TypeScript + Tailwind

Database     PostgreSQL (via Prisma ORM)
Storage      MinIO (S3-compatible, self-hosted)
Cache        Redis (rate limiting + impression dedup)
CDN          Cloudflare (tunnel + edge caching)
Frontend     Vercel
Payment      Midtrans Snap
```

---

## Slot Iklan Aktual

| Slot ID              | Desktop     | Tablet     | Mobile     |
|----------------------|-------------|------------|------------|
| `leaderboard`        | 970 × 250   | 728 × 90   | 320 × 50   |
| `rectangle`          | 300 × 250   | —          | 300 × 100  |
| `rectangle_secondary`| 300 × 250   | —          | 300 × 100  |
| `in_feed`            | 300 × 250   | —          | 300 × 100  |

Setiap slot menghasilkan **3 variant file** (desktop/tablet/mobile) dalam format WebP, max 200 KB.

---

## Apa yang Sudah Selesai ✅

Berdasarkan `ads.md` Section 10, berikut yang sudah production-ready:

```
✅ Self-registration pengiklan (upgrade ke role advertiser)
✅ Ad Studio wizard 4 langkah (Paket → Kampanye → Upload → Bayar)
✅ Smart Image Processing — Palette Gradient Background
✅ Ad Preview real-time semua slot sebelum submit
✅ Cek ketersediaan slot
✅ Payment gateway Midtrans Snap (VA, e-wallet, QRIS, kartu kredit)
✅ Manual transfer + upload bukti
✅ Admin review 5-item content checklist
✅ Approve → Auto-sync ke Advertisement
✅ Rotasi multi-iklan per slot (carousel 7 detik)
✅ Tracking impresi & klik (rate-limited, dedup Redis)
✅ A/B testing per slot (variantA/B + winnerVariant)
✅ Animasi: Ken Burns, Fade Slide, Parallax, Pulse Scale
✅ Format: Gambar (JPG/PNG/WebP/GIF), Video (MP4/WebM/MOV), HTML/JS sandboxed
✅ Sticky leaderboard di mobile (closeable setelah 5 detik)
✅ Fallback showcase saat slot kosong
✅ Notifikasi email + in-app
✅ Auto-expiry cron hourly
✅ Analytics time-series (7/14/30/90 hari, Recharts)
✅ Rate limiting booking + impression dedup
✅ E2E tests (Playwright)
```

---

## Yang Masih Perlu Diselesaikan

### 🟢 Fix Kecil — Segera (< 1 hari)

```
[ ] Permission wapimred untuk approve iklan
    File: apps/api/src/modules/ad/ad.controller.ts
    → Tambah role 'wapimred' ke guard pada endpoint
      POST /api/v1/ads/bookings/:id/approve
      POST /api/v1/ads/bookings/:id/reject
    Estimasi: 0.5 hari
```

---

## Phase 2 — Peningkatan Smart Image Processing

Ini inti dari diskusi kita: sistem saat ini sudah menggunakan **Metode A (Palette Gradient)**,
tapi belum menangani gambar sangat kecil atau rasio sangat ekstrem dengan AI.

### Pipeline Saat Ini (sudah ada)

```
Upload gambar
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
│                          │
Rasio cocok (±15%)    Rasio beda (>15%)
│                          │
▼                          ▼
Smart Crop             Palette Gradient
(fit: cover)           Background + Contain
│                          │
└────────┬─────────────────┘
         │
         ▼
   Compress ke WebP (max 200KB)
         │
         ▼
   Simpan ke MinIO
```

File: `apps/api/src/lib/ad-image-processor.ts`

### Pipeline Target (ditambahkan)

```
Upload gambar
     │
     ▼
Validasi format
     │
     ▼
Extract dominant color palette
     │
     ▼
[BARU] Cek dimensi absolut vs slot target
     │
┌────┴─────────────────────────┐
│                               │
Dimensi cukup              Dimensi kecil
(≥ slot target)            (< slot target)
│                               │
│                               ▼
│                    [BARU] AI Upscale
│                    (Real-ESRGAN via Replicate)
│                               │
└────────┬──────────────────────┘
         │
         ▼
Cek rasio aspek vs target slot
         │
┌────────┴──────────────────────┐
│                                │
Rasio cocok (±15%)          Rasio beda > 40%
│                                │
▼                                ▼
Smart Crop               [BARU] AI Outpainting
(sudah ada)              (Kling AI)
│                                │
│          Rasio beda 15–40%     │
│               │                │
│               ▼                │
│        Palette Gradient        │
│        (sudah ada)             │
│               │                │
└───────────────┴────────────────┘
                │
                ▼
         Compress ke WebP
                │
                ▼
         Simpan ke MinIO
```

---

### Sprint A — AI Upscale Integration
**Durasi: 3–4 hari**
**File utama: `apps/api/src/lib/ad-image-processor.ts`**

```
[ ] Tambah dimensi checker sebelum pipeline rasio
    → Bandingkan width/height gambar vs dimensi slot target
    → Jika di bawah threshold → flag untuk upscale

[ ] Integrasi Replicate API (Real-ESRGAN)
    → POST ke Replicate dengan base64 gambar
    → Polling status hingga selesai (webhook atau interval)
    → Timeout 30 detik → fallback ke pipeline existing

[ ] Update response /api/v1/media/ad-preview
    → Tambah field "processingMethod": "upscale+gradient" | "crop" | "gradient"
    → Field ini sudah ada untuk "palette_gradient", tinggal extend

[ ] Tambah env vars:
    REPLICATE_API_TOKEN=
    REPLICATE_MODEL_VERSION= (Real-ESRGAN version hash)

[ ] Update AdSmartPreview.tsx
    → Tampilkan badge metode: "AI Upscaled" jika upscale digunakan

[ ] Logging: catat waktu proses upscale per gambar di database
```

**Fallback chain:**
```
Replicate API gagal / timeout
    → Skip upscale
    → Lanjut pipeline existing (Palette Gradient)
    → Log warning, tidak block user
```

---

### Sprint B — AI Outpainting Integration
**Durasi: 4–5 hari**
**File utama: `apps/api/src/lib/ad-image-processor.ts`**

```
[ ] Tambah threshold check: jika gap rasio ≥ 40% → trigger outpainting
    (contoh: gambar 400×400 → slot 970×250: gap = 75% area kosong)

[ ] Integrasi Kling AI API
    → Kirim gambar + dimensi target
    → Kling AI extend background secara generatif
    → Polling hasil (estimasi 5–15 detik)

[ ] Fallback chain:
    Kling gagal → Stability AI → Palette Gradient (existing)

[ ] Admin override di BookingReviewList.tsx
    → Tombol "Re-process" dengan pilihan metode:
      [ ] Auto (default)   [ ] Force Crop   [ ] Force Gradient   [ ] Force AI
    → Berguna jika hasil AI kurang memuaskan untuk iklan tertentu

[ ] Update AdSmartPreview.tsx
    → Badge "AI Generated Background" jika outpainting digunakan
    → Preview loading state lebih panjang (antisipasi 15 detik)

[ ] Update endpoint /api/v1/media/ad-preview
    → Tambah estimasi waktu proses ke response
    → "estimatedSeconds": 3 | 8 | 15

[ ] Tambah env vars:
    KLING_API_KEY=
    STABILITY_API_KEY=
```

**Kapan Outpainting dipicu:**

```
Rasio gap < 15%    → Smart Crop (cepat, < 1 detik)
Rasio gap 15–40%   → Palette Gradient (sudah ada, < 2 detik)
Rasio gap ≥ 40%    → AI Outpainting (baru, 5–15 detik)
Dimensi < threshold → AI Upscale dulu, lalu cek rasio ulang
```

---

### Sprint C — Enhanced Preview & Cost Monitoring
**Durasi: 2–3 hari**

```
[ ] Cost tracking per proses AI
    → Catat: replicate_cost, kling_cost per AdBooking
    → Field baru di AdBooking atau tabel AdProcessingLog baru

[ ] Admin dashboard: ringkasan biaya AI per bulan
    → Total spend Replicate + Kling
    → Rata-rata biaya per booking
    → File: apps/web/components/dashboard/ads/SuperadminAdsView.tsx

[ ] Processing time monitoring
    → Alert jika rata-rata > 20 detik (Redis pub/sub atau email)

[ ] Update AdSmartPreview.tsx
    → Tampilkan preview loading per slot dengan skeleton
    → Tampilkan metode yang digunakan + warna dominan (sudah ada)
    → Tambah: estimasi waktu proses jika AI terlibat
```

---

## Phase 3 — Fitur Lanjutan (Backlog dari Section 14 Dokumentasi)

Ini roadmap jangka menengah, diprioritaskan berdasarkan dampak bisnis:

### Prioritas Tinggi

```
┌─────────────────────────────────────────────────────────┐
│  Frequency Capping                   Estimasi: 3–4 hari │
│  Max N impresi per user per hari per slot                │
│  File: ad.service.ts + Redis (increment + TTL)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Export Reports                      Estimasi: 2–3 hari │
│  CSV/PDF export untuk advertiser                         │
│  File: AdvertiserAdsView.tsx + new export endpoint      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Enhanced Analytics                  Estimasi: 4–5 hari │
│  Device breakdown, geographic, unique visitor            │
│  Perlu: tambah kolom di AdEventLog + enrich tracking    │
└─────────────────────────────────────────────────────────┘
```

### Prioritas Menengah

```
┌─────────────────────────────────────────────────────────┐
│  Category-Based Targeting            Estimasi: 5–7 hari │
│  Iklan tampil di artikel kategori tertentu               │
│  Perlu: targeting field di AdPackage + AdBooking        │
│  + filter di GET /api/v1/ads/public                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Auto A/B Testing                    Estimasi: 4–5 hari │
│  Statistical significance + auto-select winner          │
│  Infrastructure sudah ada (variantA/B + winnerVariant)  │
│  Tinggal: logic significance testing di ad.service.ts   │
└─────────────────────────────────────────────────────────┘
```

### Prioritas Rendah (Nice to Have)

```
┌─────────────────────────────────────────────────────────┐
│  Creative Templates                  Estimasi: 1 minggu │
│  Template banner siap pakai, pengiklan isi teks          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  AI Content Moderation               Estimasi: 3–4 hari │
│  Automated review sebelum masuk antrian admin           │
└─────────────────────────────────────────────────────────┘
```

---

## Ringkasan Timeline

```
Sekarang
   │
   ▼
[ Fix Kecil ]  0.5 hari
   Permission wapimred approve
   │
   ▼
[ Sprint A ]  3–4 hari
   AI Upscale (Replicate + Real-ESRGAN)
   │
   ▼
[ Sprint B ]  4–5 hari
   AI Outpainting (Kling AI + fallback)
   │
   ▼
[ Sprint C ]  2–3 hari
   Cost monitoring + enhanced preview
   │
   ▼
[ Phase 3 ]  Backlog berkelanjutan
   Frequency Capping → Export Reports → Analytics
   → Targeting → A/B Auto → Templates
```

**Total Phase 2:** ~10–12 hari kerja hingga pipeline AI penuh aktif.

---

## Keputusan Teknis yang Perlu Dikonfirmasi

Sebelum Sprint A dimulai, ada 3 keputusan yang perlu ditentukan:

```
1. REPLICATE vs SELF-HOST Real-ESRGAN?
   Replicate   → bayar per-request, cepat setup, tidak ada GPU
   Self-host   → gratis per-run, butuh GPU/server, lebih lambat
   Rekomendasi: Replicate dulu, evaluasi cost setelah 1 bulan

2. KLING AI vs STABILITY AI sebagai primer Outpainting?
   Kling AI    → sudah dipakai di BerKa-Vid, familiar
   Stability   → lebih murah, API lebih sederhana
   Rekomendasi: Kling sebagai primer (konsistensi stack), Stability sebagai fallback

3. SYNC vs ASYNC untuk AI Processing?
   Sync (blocking)  → user tunggu di upload step, tapi preview langsung
   Async (queue)    → user dapat notifikasi setelah selesai, UX lebih smooth
   Rekomendasi: Hybrid — Preview pakai sync (cepat), Final processing pakai async queue
```

---

## File yang Akan Dimodifikasi

| File | Perubahan |
|------|-----------|
| `apps/api/src/lib/ad-image-processor.ts` | Tambah dimensi checker, AI upscale, AI outpainting |
| `apps/api/src/modules/media/media.controller.ts` | Update response preview + estimasi waktu |
| `apps/api/src/modules/ad/ad.controller.ts` | Fix permission wapimred |
| `apps/web/components/dashboard/ads/studio/AdSmartPreview.tsx` | Badge metode + loading state AI |
| `apps/web/components/dashboard/ads/BookingReviewList.tsx` | Tombol override metode proses |
| `.env` (api) | REPLICATE_API_TOKEN, KLING_API_KEY, STABILITY_API_KEY |

---

## Definition of Done — Phase 2

```
✓ Gambar sangat kecil (misal 100×100 px) → di-upscale AI → hasil tajam
✓ Rasio ekstrem (misal foto potret untuk leaderboard) → AI extend background
✓ Fallback berjalan: Kling gagal → Stability → Palette Gradient
✓ Admin bisa override metode proses dari panel
✓ Preview menampilkan badge metode yang digunakan
✓ Cost AI tercatat dan bisa dilihat di admin dashboard
✓ Tidak ada iklan macet karena AI timeout (fallback selalu tersedia)
✓ Permission wapimred untuk approve sudah berfungsi
```

---

*Versi 3.0 — Diselaraskan dengan dokumentasi aktual BeritaKarya ads.md*
*Stack: NestJS + Next.js + TypeScript + Prisma + MinIO + Redis*
*Sebagian besar fitur sudah production-ready. Phase 2 fokus pada AI enhancement pipeline.*
