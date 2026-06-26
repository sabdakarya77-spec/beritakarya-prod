# Plan Kerja: Peningkatan Sistem Iklan BeritaKarya
*Versi 1.0 · Juni 2026 · Pendekatan Data-Driven*

---

## Prinsip

> Jangan bangun solusi sebelum tahu masalahnya seberapa besar.

Sistem saat ini (Palette Gradient) sudah **berhasil** — cepat (< 2 detik), gratis, profesional.
Sebelum menambah kompleksitas AI, kita perlu data untuk tahu apakah investasi itu perlu.

---

## Status Saat Ini

### Apa yang Sudah Jalan ✅

| Fitur | Status |
|-------|--------|
| Smart Image Processing (Palette Gradient) | ✅ Production |
| Ad Preview semua slot | ✅ Production |
| Mobile responsive sizes (300×100) | ✅ Production |
| Payment gateway (Midtrans) | ✅ Production |
| Admin review + checklist | ✅ Production |
| Analytics (impresi/klik/CTR) | ✅ Production |
| Auto-expiry cron | ✅ Production |
| Unified documentation (docs/ads.md) | ✅ Production |

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

---

## Rencana Kerja

### Fase 0: Kumpulkan Data (Minggu 1-2)

**Tujuan:** Tahu seberapa besar masalah gambar kecil/blur.

**Tugas:**

```
[ ] Tambah logging dimensi upload di ad-image-processor.ts
    → Catat: originalWidth, originalHeight, targetSlot, method yang dipakai
    → Log ke file/console, bisa dianalisis nanti

[ ] Jalankan 2-4 minggu di production

[ ] Analisis data:
    → Berapa % upload yang gambar kecil (< 300px)?
    → Berapa % yang rasio sangat beda (gap > 40%)?
    → Berapa % yang menggunakan palette_gradient vs smart_crop?
    → Apakah ada keluhan pengiklan tentang hasil?
```

**File yang dimodifikasi:**
- `apps/api/src/lib/ad-image-processor.ts` (tambah logging)

**Output:** Data numerik untuk keputusan Fase 1.

**Keputusan:**
- Jika < 10% upload bermasalah → **stop**, Palette Gradient sudah cukup
- Jika > 10% → lanjut Fase 1

---

### Fase 1: AI Upscale via Replicate API (Minggu 3-4)

**Syarat:** Data Fase 0 menunjukkan > 10% upload gambar kecil.

**Tujuan:** Gambar kecil di-upscale AI sebelum diproses, hasil tajam bukan blur.

**Kenapa Replicate (bukan self-hosted):**

| Aspek | Replicate | Self-hosted |
|-------|-----------|-------------|
| Setup | Tambah API key | Install Python + PyTorch + weights |
| Cocok dengan | LXC production | Butuh Docker atau install manual |
| Performa | 2-5 detik (GPU cloud) | 5-30 detik (CPU) |
| Biaya | ~Rp 30/gambar | Listrik + RAM server |
| Maintenance | Zero | Update model, monitor crash |
| Kompleksitas | Rendah | Tinggi |

**Tugas:**

```
[ ] Daftar Replicate (https://replicate.com)
    → Buat API token
    → Pilih model Real-ESRGAN x4plus

[ ] Tambah fungsi upscale di ad-image-processor.ts
    → Fungsi: upscaleImage(buffer, scale) → Buffer
    → HTTP POST ke Replicate API
    → Polling status hingga selesai
    → Timeout 30 detik → fallback ke gambar asli

[ ] Tambah dimensi checker sebelum pipeline rasio
    → Jika width atau height < target → trigger upscale
    → Scale factor: auto (2x atau 4x, pilih yang cukup)

[ ] Update processAdSmart() — tambah upscale step di awal
    → Upload → Cek dimensi → Upscale (jika perlu) → Extract palette → Resize

[ ] Tambah env var di apps/api/.env
    → REPLICATE_API_TOKEN=xxx

[ ] Update response /api/v1/media/ad-preview
    → Tambah field "wasUpscaled": true/false
    → Method: "upscale+crop" | "upscale+palette_gradient" | "crop" | "palette_gradient"

[ ] Update AdSmartPreview.tsx
    → Badge "AI Upscaled" jika wasUpscaled = true
    → Loading state lebih panjang saat upscale
```

**File yang dimodifikasi:**
- `apps/api/src/lib/ad-image-processor.ts` (tambah fungsi upscale + dimensi checker)
- `apps/web/components/dashboard/ads/studio/AdSmartPreview.tsx` (badge + loading)
- `apps/api/.env` (tambah REPLICATE_API_TOKEN)

**Fallback chain:**
```
Replicate API gagal / timeout
    → Return gambar ASLI (tanpa upscale)
    → Lanjut pipeline Palette Gradient seperti biasa
    → Log warning, tidak block user
    → Iklan tetap bisa submit
```

**Estimasi biaya:**
- Asumsi: 50 upload/bulan, 20% perlu upscale = 10 upscale/bulan
- Biaya: 10 × Rp 30 = **Rp 300/bulan** (hampir nol)

---

### Fase 2: Evaluasi + Keputusan (Minggu 5-6)

**Tujuan:** Putuskan apakah AI upscale layak dilanjutkan.

**Tugas:**

``[ ] Kumpulkan data 1 bulan Replicate
    → Total biaya
    → Berapa % gambar yang di-upscale
    → Error rate
    → Rata-rata waktu proses

[ ] Survey pengiklan (opsional)
    → Apakah puas dengan hasil iklan?
    → Ada keluhan tentang kualitas gambar?

[ ] Buat keputusan berdasarkan data
```

**Keputusan:**

| Kondisi | Aksi |
|---------|------|
| Cost < Rp 500rb/bulan, volume rendah | Lanjut Replicate, selesai |
| Cost > Rp 1jt/bulan, volume tinggi | Evaluasi self-hosted Real-ESRGAN di LXC |
| Hampir tidak ada yang pakai | Matikan fitur, hemat cost |
| Error rate > 10% | Investigasi, pertimbangkan provider lain |

---

### Phase 3: Backlog (Kapan Saja, Jika Diperlukan)

Fitur-fitur ini **bukan prioritas** — hanya dikerjakan jika ada kebutuhan bisnis yang jelas.

| Fitur | Estimasi | Kapan Dibutuhkan |
|-------|----------|------------------|
| Frequency Capping | 3-4 hari | Jika user komplain iklan terlalu sering muncul |
| Export Reports (CSV/PDF) | 2-3 hari | Jika advertiser minta laporan |
| Enhanced Analytics (device/geo) | 4-5 hari | Jika ada kebutuhan targeting |
| Category-Based Targeting | 5-7 hari | Jika advertiser ingin iklan tampil di kategori tertentu |
| Auto A/B Testing | 4-5 hari | Jika ada advertiser aktif yang mau optimize |
| Creative Templates | 1 minggu | Jika UMKM kesulitan buat desain |
| AI Outpainting | 5-7 hari | Jika data menunjukkan banyak rasio ekstrem |

---

## Ringkasan Timeline

```
Sekarang
   │
   ▼
[ Fase 0 ]  Minggu 1-2
   Logging data upload (tanpa fitur baru)
   → 1 file diubah, ~20 baris kode
   │
   ▼
[ Evaluasi ]  Minggu 3
   Analisis data → keputusan lanjut/stop
   │
   ├── Jika < 10% bermasalah → STOP (hemat waktu & uang)
   │
   └── Jika > 10% bermasalah → lanjut ↓
        │
        ▼
[ Fase 1 ]  Minggu 3-4
        Integrasi Replicate API
        → 1 fungsi baru + env var + badge UI
        │
        ▼
[ Fase 2 ]  Minggu 5-6
        Evaluasi cost → keputusan final
```

**Total waktu (jika lanjut):** ~6 minggu
**Total waktu (jika data tidak mendukung):** ~3 minggu (hanya logging + evaluasi)

---

## File yang Akan Dimodifikasi

| Fase | File | Perubahan |
|------|------|-----------|
| 0 | `apps/api/src/lib/ad-image-processor.ts` | Tambah logging dimensi |
| 1 | `apps/api/src/lib/ad-image-processor.ts` | Tambah fungsi upscale + dimensi checker |
| 1 | `apps/api/.env` | Tambah `REPLICATE_API_TOKEN` |
| 1 | `apps/web/.../AdSmartPreview.tsx` | Badge "AI Upscaled" + loading state |
| 2 | `docs/ads.md` | Update dokumentasi hasil evaluasi |

**Total file:** 4 file (tidak ada perubahan arsitektur)

---

## Keputusan Teknis yang Sudah Dibuat

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Cloud vs Self-hosted | **Replicate (cloud)** | Cocok dengan LXC, zero maintenance, cost rendah |
| Sync vs Async | **Sync** | Volume rendah, 5 detik masih acceptable |
| Outpainting sekarang? | **Tidak** | Palette Gradient sudah handle rasio beda dengan baik |
| Docker ditambah? | **Tidak** | Tidak perlu, Replicate via HTTP saja |

---

## Definition of Done

### Fase 0
```
✓ Logging aktif di production
✓ Data 2-4 minggu terkumpul
✓ Keputusan lanjut/stop dibuat berdasarkan data
```

### Fase 1 (jika lanjut)
```
✓ Gambar kecil (< 300px) di-upscale AI sebelum diproses
✓ Fallback berjalan: Replicate gagal → gambar asli → Palette Gradient
✓ Preview menampilkan badge "AI Upscaled" jika applicable
✓ Tidak ada iklan macet karena AI timeout
✓ Cost tercatat (< Rp 500rb/bulan target)
```

---

*Plan ini mengikuti prinsip: ukur dulu, baru bangun. Menghindari over-engineering untuk masalah yang mungkin tidak signifikan.*
