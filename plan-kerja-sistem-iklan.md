# Plan Kerja: Sistem Manajemen Iklan Otomatis
**Berita Karya — Ad Image Processing System**
*Versi 2.0 · Juni 2026 · Diperbarui: pipeline bertingkat + AI*

---

## Latar Belakang

Platform berita modern membutuhkan sistem iklan yang cerdas. Pengiklan sering kesulitan menyediakan aset iklan dalam berbagai ukuran banner standar IAB. Sistem ini memungkinkan pengiklan cukup **upload satu gambar — ukuran apapun** — lalu backend secara otomatis menghasilkan semua varian ukuran yang diperlukan dengan kualitas maksimal.

> **Prinsip utama:** Jangan tolak gambar kecil. Tangani dengan cerdas.

---

## Tujuan

```
Pengiklan upload 1 gambar (ukuran bebas)
               │
               ▼
   Pipeline AI memproses otomatis
               │
               ▼
Semua slot banner terisi — tidak terpotong,
tidak blur, tampilan profesional
               │
               ▼
      Banner tayang di semua slot
```

**Target:**
- Pengiklan tidak perlu memahami spesifikasi teknis banner
- **Tidak ada batas ukuran minimum** — sistem menangani sisanya
- Gambar kecil di-upscale AI sebelum di-resize
- Gambar dengan rasio ekstrem di-extend AI (bukan diblur)
- Output WebP, proses selesai < 15 detik per upload

---

## Kenapa Tidak Ada Ukuran Minimum?

Ini inti keputusan desain sistem ini.

"Tidak terpotong & tidak diblur" + "gambar kecil bebas diupload" adalah
dua tujuan yang bertentangan secara geometri — tapi bisa diselesaikan dengan AI.

```
Upload: 400×400                Slot: 970×250

Rasio asli  →  1 : 1           (kotak)
Rasio slot  →  3.88 : 1        (sangat lebar)

Gap yang harus diisi = 75% dari total area slot
```

Tanpa AI: gap diisi blur (terlihat workaround).
Dengan AI: gap diisi konten yang masuk akal (terlihat disengaja).

---

## Slot Iklan yang Didukung

| Nama Slot          | Ukuran      | Posisi Umum         |
|--------------------|-------------|---------------------|
| Leaderboard        | 970 × 250   | Header halaman      |
| Billboard          | 970 × 90    | Bawah header        |
| Half Page          | 300 × 600   | Sidebar kanan       |
| Medium Rectangle   | 300 × 250   | Dalam konten        |
| Large Rectangle    | 336 × 280   | Dalam konten        |
| Square             | 300 × 300   | Sidebar             |
| Mobile Banner      | 320 × 100   | Mobile header       |
| Mobile Leaderboard | 320 × 50    | Mobile footer       |
| Thumbnail          | 120 × 90    | Widget iklan kecil  |

**Persyaratan upload:**
- Format: JPG, PNG, WEBP
- Ukuran: **bebas** (tidak ada minimum — sistem yang menyesuaikan)
- Maksimal file size: **10 MB**
- UI tetap *merekomendasikan* 1200×1200 px ke pengiklan, tapi tidak memblok

---

## Pipeline Bertingkat (Inti Sistem)

Tidak ada satu metode yang cocok untuk semua gambar.
Sistem memilih metode secara otomatis berdasarkan kondisi gambar yang diupload.

```
Upload gambar (ukuran apapun)
         │
         ▼
   Cek dimensi vs slot target
         │
    ┌────┴────────────────────────┐
    │                             │
Cukup besar?                Terlalu kecil?
(≥ dimensi slot)            (< dimensi slot)
    │                             │
    ▼                             ▼
[FASE A]                     [FASE B]
Smart Crop               AI Upscale dulu
+ Palette BG             (Real-ESRGAN)
                              │
                              ▼
                    Cek lagi dimensi & rasio
                              │
                   ┌──────────┴───────────────┐
                   │                          │
             Sudah proporsional?      Rasio masih ekstrem?
             (gap < 40%)              (gap ≥ 40%)
                   │                          │
                   ▼                          ▼
              [FASE A]                   [FASE C]
             Smart Crop              AI Outpainting
           + Palette BG              (Kling / Stability AI)
                   │                          │
                   └──────────┬───────────────┘
                              │
                              ▼
                   Generate semua 9 ukuran slot
                              │
                              ▼
                       Simpan ke Storage
```

---

## Tiga Metode Pemrosesan

### Metode A — Smart Crop + Palette Background *(default, semua ukuran)*

Ambil warna dominan dari gambar pengiklan,
jadikan background gradien yang senada dengan brand mereka.

```
Upload: logo_produk.png (background putih, warna biru)

Hasil slot 970×250:

┌─────────────────────────────────────────────┐
│  ░░░░░  gradien biru → putih  ░░░░░░░░░░░░  │
│                                             │
│              ┌──────────┐                  │
│              │  LOGO    │                  │
│              │  PRODUK  │                  │
│              └──────────┘                  │
│                                             │
└─────────────────────────────────────────────┘
```

**Kenapa ini lebih profesional dari blur?**
Blur terlihat seperti workaround yang terburu-buru.
Gradien warna brand terlihat *disengaja* — seolah desainer memang
membuat banner itu dari awal untuk slot ini.

**Library:** ColorThief (PHP) → extract palette → Imagick → render gradient
**Waktu proses:** < 2 detik. Tidak butuh API eksternal.

---

### Metode B — AI Upscale *(gambar di bawah dimensi slot)*

Sebelum di-crop atau di-extend, gambar kecil di-upscale AI
agar resolusinya memadai dan tetap tajam.

```
Upload: 400×400

     ↓ AI Upscale (Real-ESRGAN via Replicate API)

   1600×1600  (tajam, bukan sekadar diperbesar biasa)

     ↓ Lanjut ke Metode A atau C

   Hasil akhir berkualitas tinggi
```

Perbedaan upscale biasa vs AI:

```
Resize biasa:   blur, piksel terlihat, kehilangan detail tepi
AI Upscale:     edge enhancement, detail dipertahankan, hasil seperti foto resolusi tinggi
```

**Implementasi:** Replicate API (Real-ESRGAN) — bayar per-request, tanpa setup GPU
**Waktu proses:** 3–8 detik per gambar

---

### Metode C — AI Outpainting *(rasio sangat ekstrem, gap ≥ 40%)*

AI benar-benar *melanjutkan* gambar ke area kosong —
bukan blur, bukan warna solid, tapi konten visual yang masuk akal.

```
Upload: foto_produk.jpg (400×400, foto kemasan di meja)

     ↓ AI Outpainting (Kling AI)

┌──────────────────────────────────────────────────────────┐
│  latar meja dapur  │   KEMASAN PRODUK   │  latar dapur  │
└──────────────────────────────────────────────────────────┘
         ↑                    ↑                  ↑
    AI generate           gambar asli        AI generate
```

**Pilihan API (bisa pilih salah satu atau fallback):**

| API              | Kualitas        | Kecepatan   | Catatan                      |
|------------------|-----------------|-------------|------------------------------|
| Kling AI         | Sangat baik     | 5–10 detik  | Sudah dipakai di BerKa-Vid   |
| Stability AI     | Baik            | 3–8 detik   | Fleksibel, murah             |
| Adobe Firefly    | Terbaik (foto)  | 8–15 detik  | Paling bersih untuk produk   |

**Waktu proses:** 5–15 detik

---

## Perbandingan Tiga Metode

```
                    Metode A          Metode B          Metode C
                  Palette BG         AI Upscale       AI Outpaint
                  ──────────         ──────────        ──────────
Gambar kecil        ⚠ oke            ✓ solusi          ✓ solusi
Rasio ekstrem       ✓ oke            ⚠ parsial         ✓ solusi
Waktu proses        ✓ < 2 dtk        ~ 3-8 dtk         ~ 5-15 dtk
Biaya               ✓ gratis         ~ murah           ~ berbayar
Butuh API ext.      ✓ tidak          ✓ Replicate       ✓ Kling/StAI
Level kualitas      ★★★☆☆           ★★★★☆            ★★★★★
```

Sistem menggunakan **A sebagai default**, naik ke **B** jika gambar kecil,
naik ke **C** jika rasio sangat ekstrem — secara otomatis.

---

## Arsitektur Sistem

```
Advertiser
     │
     ▼
[Upload UI]  ←── Drag & Drop, preview slot langsung
     │
     ▼
[Validation]
  ├── Cek format file (JPG/PNG/WEBP)
  ├── Cek file size (maks 10 MB)
  └── Tampilkan warning (bukan error) jika < 1200px
     │
     ▼
[Storage: original]
  ads/originals/{uuid}/original.webp
     │
     ▼
[Queue: ProcessAdImage Job]
     │
     ▼
[Pipeline Decision Engine]
  ├── Dimensi cukup?  → Metode A (Palette BG + Smart Crop)
  ├── Dimensi kecil?  → Metode B (AI Upscale) → lanjut A atau C
  └── Rasio ekstrem?  → Metode C (AI Outpainting)
     │
     ▼
[Generate Semua 9 Ukuran Slot]
     │
     ▼
[Storage: generated]
  ads/generated/{uuid}/
  ├── leaderboard.webp
  ├── billboard.webp
  ├── half-page.webp
  ├── medium-rect.webp
  ├── large-rect.webp
  ├── square.webp
  ├── mobile-banner.webp
  ├── mobile-leader.webp
  └── thumbnail.webp
     │
     ▼
[Update status: "pending_review"]
     │
     ▼
[Notifikasi Admin + Advertiser]
```

---

## Struktur Folder Storage

```
storage/
└── ads/
    ├── originals/
    │   └── {uuid}/
    │       └── original.webp
    └── generated/
        └── {uuid}/
            ├── leaderboard.webp    (970×250)
            ├── billboard.webp      (970×90)
            ├── half-page.webp      (300×600)
            ├── medium-rect.webp    (300×250)
            ├── large-rect.webp     (336×280)
            ├── square.webp         (300×300)
            ├── mobile-banner.webp  (320×100)
            ├── mobile-leader.webp  (320×50)
            └── thumbnail.webp      (120×90)
```

---

## Tahapan Pengerjaan

### Sprint 1 — Fondasi & Upload Flow
**Durasi: 1 minggu**

```
[ ] Setup project Laravel + struktur folder
[ ] Model & migration: Ad, AdSlot, AdVariant, AdProcessingLog
[ ] Upload endpoint (validasi format & file size, NO ukuran minimum)
[ ] Simpan original ke storage (S3 / local)
[ ] UI: warning soft jika < 1200px (bukan error/block)
[ ] Response: UUID iklan + status "queued"
```

**Output:** Pengiklan bisa upload gambar apapun, tersimpan sebagai original.

---

### Sprint 2 — Pipeline Core: Metode A (Palette BG)
**Durasi: 1 minggu**

```
[ ] Setup Laravel Queue + Redis
[ ] Job: ProcessAdImage (dengan retry & logging)
[ ] Pipeline Decision Engine (dimensi checker)
[ ] Implementasi ColorThief — extract warna dominan dari gambar
[ ] Implementasi Metode A: Palette Gradient Background + Smart Crop
[ ] Generate semua 9 ukuran slot
[ ] Simpan ke generated/ dengan nama slot
[ ] Update status → "pending_review"
```

**Library yang digunakan:**

| Library            | Fungsi                              |
|--------------------|-------------------------------------|
| ColorThief (PHP)   | Extract palet warna dominan gambar  |
| Intervention Image | Resize & composite dasar            |
| Imagick            | Gradient, overlay, format WebP      |
| libvips            | Fallback proses volume tinggi       |

**Output:** Gambar berukuran apapun menghasilkan banner dengan background warna brand — tanpa blur.

---

### Sprint 3 — Pipeline AI: Metode B (AI Upscale)
**Durasi: 1 minggu**

```
[ ] Integrasi Replicate API (Real-ESRGAN)
[ ] Tambah logika di Decision Engine: jika dimensi < target → trigger upscale
[ ] Job: UpscaleImage → setelah selesai → lanjut ke ProcessAdImage
[ ] Handling timeout & fallback ke Metode A jika API gagal
[ ] Logging: catat metode yang digunakan per gambar
[ ] Testing berbagai ukuran input (100px, 300px, 600px, 800px)
```

**Flow di dalam Queue:**

```
ProcessAdImage Job
      │
      ▼
  Dimensi < slot?
      │
   ┌──┴──┐
  Ya     Tidak
   │       │
   ▼       ▼
UpscaleJob  Lanjut
(Replicate)  Metode A
   │
   ▼
Callback → ProcessAdImage (lanjut)
```

**Output:** Gambar kecil di-upscale AI sebelum diproses — hasil tajam, bukan pecah.

---

### Sprint 4 — Pipeline AI: Metode C (AI Outpainting)
**Durasi: 1 minggu**

```
[ ] Integrasi Kling AI API untuk outpainting
[ ] Tambah logika Decision Engine: jika gap rasio ≥ 40% → trigger outpainting
[ ] Fallback chain: Kling gagal → Stability AI → Metode A
[ ] Handling waktu proses panjang (polling status Kling)
[ ] Preview hasil outpainting di dashboard advertiser sebelum approve
[ ] Admin bisa override: pilih metode manual jika hasil AI kurang memuaskan
```

**Fallback chain:**

```
Outpainting diminta
      │
      ▼
  Kling AI API
      │
  Berhasil? ──Tidak──→ Stability AI
      │                      │
     Ya                  Berhasil? ──Tidak──→ Metode A (Palette BG)
      │                      │
      └──────────────────────┘
                │
                ▼
          Hasil disimpan
```

**Output:** Gambar dengan rasio ekstrem di-extend AI — hasil paling profesional.

---

### Sprint 5 — Admin, Advertiser Panel & Integrasi Frontend
**Durasi: 1 minggu**

```
[ ] Dashboard advertiser:
    - Upload dengan live preview per slot
    - Tampilkan metode yang digunakan (A / B / C)
    - Status tracking: queued → processing → pending_review → live
[ ] Admin panel:
    - Preview semua 9 ukuran sebelum approve
    - Override metode pemrosesan (re-process dengan metode berbeda)
    - Approve / reject dengan catatan
[ ] Notifikasi email: iklan disetujui / ditolak
[ ] API endpoint: GET /api/ads/{slot_name}
[ ] Integrasi ke template halaman berita
[ ] Lazy load banner
[ ] Tracking: impresi & klik per banner
```

**Status flow iklan:**

```
UPLOADED → QUEUED → PROCESSING → PENDING_REVIEW → APPROVED → LIVE
                                              └──→ REJECTED
                                                       │
                                              Pengiklan revisi
                                                       │
                                                   UPLOADED (ulang)
```

**Output:** Sistem end-to-end berjalan — upload, proses, approve, tayang.

---

### Sprint 6 — Optimasi & Monitoring
**Durasi: 1 minggu**

```
[ ] CDN caching untuk generated images (Cloudflare R2)
[ ] Queue priority: iklan berbayar diproses lebih cepat
[ ] Auto-retry jika API eksternal timeout
[ ] Dashboard monitoring: queue health, error rate, avg processing time
[ ] Laporan per iklan: metode digunakan, waktu proses, impresi, CTR
[ ] Cost tracking: berapa spend Replicate & Kling per bulan
[ ] Alert: notifikasi jika error rate > 5%
```

**Output:** Sistem siap production, terpantau, dan cost-aware.

---

## Tech Stack

```
Backend
├── Laravel 11 (PHP 8.3)
├── Laravel Queue + Redis
├── ColorThief PHP          ← extract palet warna
├── Intervention Image      ← resize & composite
├── Imagick (ImageMagick)   ← gradient, overlay, WebP
└── libvips                 ← volume tinggi, hemat memori

AI Services
├── Replicate API           ← Real-ESRGAN upscale (Metode B)
├── Kling AI                ← Outpainting primer (Metode C)
└── Stability AI            ← Outpainting fallback (Metode C)

Storage
├── Local disk              ← development
└── Cloudflare R2 / AWS S3  ← production + CDN

Frontend
├── Blade + Alpine.js       ← dashboard advertiser & admin
└── JSON API                ← integrasi halaman berita

Infrastructure
├── Queue Worker (Supervisor)
├── Redis (queue + cache)
└── Cloudflare (CDN + cache)
```

---

## Contoh Response API

```json
GET /api/ads/leaderboard

{
  "slot": "leaderboard",
  "ad_id": "uuid-xxx",
  "image_url": "https://cdn.beritakarya.id/ads/generated/uuid-xxx/leaderboard.webp",
  "processing_method": "palette_bg",
  "width": 970,
  "height": 250,
  "target_url": "https://pengiklan.com",
  "expires_at": "2026-07-30"
}
```

Field `processing_method` berisi: `palette_bg` / `ai_upscale` / `ai_outpaint`
— berguna untuk monitoring & audit kualitas.

---

## Timeline Ringkas

```
Minggu 1  │████████│ Sprint 1 — Upload & Storage (tanpa minimum ukuran)
Minggu 2  │████████│ Sprint 2 — Pipeline Core: Metode A (Palette BG)
Minggu 3  │████████│ Sprint 3 — Pipeline AI: Metode B (AI Upscale)
Minggu 4  │████████│ Sprint 4 — Pipeline AI: Metode C (AI Outpainting)
Minggu 5  │████████│ Sprint 5 — Admin Panel + Integrasi Frontend
Minggu 6  │████████│ Sprint 6 — Optimasi, Monitoring, Production-Ready
```

**Total estimasi:** 6 minggu hingga production-ready penuh.
MVP bisa rilis setelah **Sprint 2** (minggu ke-2) dengan Metode A saja.

---

## Prioritas Rilis

```
Sprint 2 selesai  →  MVP LIVE
(Palette BG sudah cukup profesional untuk kebanyakan kasus)

Sprint 3 selesai  →  Kualitas naik signifikan
(Gambar kecil tidak lagi pecah)

Sprint 4 selesai  →  Level enterprise
(Semua kasus ekstrem ditangani AI)
```

---

## Definisi Selesai (Definition of Done)

```
✓ Pengiklan upload gambar ukuran apapun — tidak ada yang ditolak
✓ Sistem memilih metode terbaik secara otomatis (A → B → C)
✓ Tidak ada banner yang tampil dengan background blur
✓ Semua 9 ukuran slot ter-generate per iklan
✓ Proses selesai < 15 detik (termasuk AI)
✓ Preview semua slot di dashboard advertiser sebelum tayang
✓ Admin dapat approve + override metode jika perlu
✓ Fallback berjalan jika API AI gagal (tidak ada iklan macet)
✓ Banner tayang di halaman dengan lazy load
✓ Tracking impresi & klik berjalan
✓ Cost API eksternal terpantau di dashboard
```

---

*Versi 2.0 — Diperbarui berdasarkan keputusan: tidak ada ukuran minimum,
pipeline bertingkat A→B→C, AI sebagai solusi utama bukan workaround.*
