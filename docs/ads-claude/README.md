# Real-ESRGAN Upscale Service — BeritaKarya

Microservice Python/FastAPI untuk upscale gambar iklan sebelum diproses oleh
`ad-image-processor.ts`. Berjalan sebagai container Docker terpisah, dipanggil
oleh NestJS API via HTTP internal.

---

## Struktur File

```
upscale-service/
├── main.py                      ← FastAPI app (endpoint /upscale dan /health)
├── download_weights.py          ← Script download model weights
├── requirements.txt             ← Python dependencies
├── Dockerfile                   ← Image Docker
└── docker-compose.upscale.yml  ← Compose snippet untuk integrasi ke stack

nestjs-integration/
├── upscale.service.ts           ← NestJS service (copy ke apps/api/src/lib/)
└── ad-image-processor.patch.ts  ← Panduan integrasi ke file yang sudah ada
```

---

## Cara Setup

### 1. Jalankan Upscale Service (Docker)

```bash
# Dari root project BeritaKarya
docker compose \
  -f docker-compose.yml \
  -f upscale-service/docker-compose.upscale.yml \
  up -d upscale-service
```

Service akan otomatis download model weights (~67 MB) saat build pertama.

Cek status:

```bash
curl http://localhost:8001/health
# { "status": "ok", "model": "Real-ESRGAN x4plus", "device": "cpu", "ready": true }
```

---

### 2. Integrasi ke NestJS API

**Copy file service:**

```bash
cp nestjs-integration/upscale.service.ts apps/api/src/lib/upscale.service.ts
```

**Tambahkan ke .env:**

```env
# apps/api/.env
UPSCALE_SERVICE_URL=http://upscale-service:8001
UPSCALE_TIMEOUT_MS=60000
```

**Ikuti instruksi di `ad-image-processor.patch.ts`** untuk mengintegrasikan
upscale step ke pipeline yang sudah ada. Perubahan minimal — hanya 3 method
baru dan 1 blok tambahan di `processImage()`.

---

### 3. Install dependencies NestJS tambahan

```bash
cd apps/api
pnpm add form-data axios
pnpm add -D @types/form-data
```

---

## Endpoint

### `POST /upscale`

Upload gambar, return gambar WebP hasil upscale.

**Request:**

```
Content-Type: multipart/form-data

file   : [binary] gambar (JPG/PNG/WebP, max 20 MB)
scale  : 2 | 4   (opsional, default: 4)
```

**Response:**

```
Content-Type: image/webp

Headers:
  X-Input-Width:    lebar gambar asli (px)
  X-Input-Height:   tinggi gambar asli (px)
  X-Output-Width:   lebar hasil upscale (px)
  X-Output-Height:  tinggi hasil upscale (px)
  X-Scale:          faktor upscale yang digunakan
  X-Process-Time:   waktu proses (detik)

Body: [binary] gambar WebP hasil upscale
```

**Contoh curl:**

```bash
curl -X POST http://localhost:8001/upscale \
  -F "file=@foto_produk.jpg" \
  -F "scale=4" \
  --output hasil_upscale.webp
```

---

### `GET /health`

Cek status service dan model.

```json
{
  "status": "ok",
  "model": "Real-ESRGAN x4plus",
  "device": "cpu",
  "ready": true
}
```

---

## Estimasi Performa (CPU)

| Ukuran Input | Scale | Estimasi Waktu |
|-------------|-------|----------------|
| 100 × 100   | 4×    | ~3–5 detik     |
| 300 × 300   | 4×    | ~5–10 detik    |
| 600 × 600   | 4×    | ~15–30 detik   |
| 300 × 300   | 2×    | ~2–4 detik     |

Waktu bergantung pada spesifikasi CPU server.
Gambar iklan rata-rata (< 400px) selesai dalam < 15 detik.

> **Catatan:** Jika server punya GPU, set `DEVICE=cuda` di environment
> untuk performa 10–20× lebih cepat.

---

## Fallback Behavior

`UpscaleService.upscaleWithFallback()` didesain agar **iklan tidak pernah macet**:

```
Upscale berhasil   → return gambar upscaled, wasUpscaled: true
Upscale gagal      → return gambar ASLI, wasUpscaled: false
Service down       → return gambar ASLI, wasUpscaled: false
```

Jika `wasUpscaled: false`, pipeline tetap lanjut ke Palette Gradient seperti biasa.
Field `method` di response preview akan menunjukkan `palette_gradient` (tanpa prefix `upscale+`).

---

## Troubleshooting

**Model tidak ditemukan:**

```bash
docker exec beritakarya-upscale python download_weights.py
```

**Service lambat:**

- Pastikan container punya minimal 2 CPU cores dan 2 GB RAM
- Pertimbangkan scale=2 untuk gambar yang tidak terlalu kecil

**Container crash saat startup:**

```bash
docker logs beritakarya-upscale
```

Biasanya karena RAM tidak cukup. Real-ESRGAN butuh ~1.5 GB RAM saat proses.

---

## Environment Variables

| Variable             | Default                            | Keterangan                        |
|---------------------|------------------------------------|-----------------------------------|
| `MODEL_PATH`         | `./weights/RealESRGAN_x4plus.pth`  | Path ke file weights              |
| `DEVICE`             | `cpu`                              | `cpu` atau `cuda`                 |
| `MAX_FILE_MB`        | `20`                               | Batas ukuran file upload          |
| `OUTPUT_QUALITY`     | `90`                               | Kualitas WebP output (1–100)      |
| `UPSCALE_SERVICE_URL`| `http://upscale-service:8001`      | URL dari sisi NestJS              |
| `UPSCALE_TIMEOUT_MS` | `60000`                            | Timeout request dari NestJS (ms)  |
