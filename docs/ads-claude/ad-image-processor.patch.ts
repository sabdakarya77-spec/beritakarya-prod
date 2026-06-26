/**
 * ad-image-processor.patch.ts
 * apps/api/src/lib/ad-image-processor.patch.ts
 *
 * Ini BUKAN file baru — ini adalah bagian yang perlu ditambahkan/diubah
 * di file ad-image-processor.ts yang sudah ada.
 *
 * Cukup ikuti instruksi di setiap komentar "TAMBAHKAN" dan "UBAH".
 */

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 1: Tambahkan import di bagian atas ad-image-processor.ts
// ─────────────────────────────────────────────────────────────────────────────

import { UpscaleService } from './upscale.service';       // TAMBAHKAN
import sharp from 'sharp';                                 // sudah ada

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 2: Tambahkan UpscaleService ke constructor class AdImageProcessor
// ─────────────────────────────────────────────────────────────────────────────

/*
  SEBELUM:
  constructor(private readonly config: ConfigService) {}

  SESUDAH:
*/
constructor(
  private readonly config: ConfigService,
  private readonly upscaleService: UpscaleService,   // TAMBAHKAN
) {}

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 3: Tambahkan method checkNeedsUpscale() ke dalam class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cek apakah gambar perlu di-upscale sebelum diproses.
 * Gambar dianggap perlu upscale jika dimensinya lebih kecil
 * dari dimensi slot target (lebar ATAU tinggi).
 */
private needsUpscale(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number,
): boolean {
  return imageWidth < targetWidth || imageHeight < targetHeight;
}

/**
 * Tentukan faktor scale yang dibutuhkan (2x atau 4x).
 * Pilih nilai terkecil yang cukup untuk memenuhi slot target.
 */
private determineScale(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number,
): 2 | 4 {
  const scaleW = targetWidth  / imageWidth;
  const scaleH = targetHeight / imageHeight;
  const needed = Math.max(scaleW, scaleH);
  return needed <= 2 ? 2 : 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 4: Ubah method processImage() — tambahkan step upscale di awal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * UBAH method processImage() yang sudah ada.
 * Tambahkan blok "AI Upscale Check" di awal, sebelum extract palette.
 */
async processImage(
  inputBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  slotName: string,
): Promise<{ buffer: Buffer; method: string; dominantColor: string }> {

  // ── Baca metadata gambar ─────────────────────────────────────────────────
  const meta = await sharp(inputBuffer).metadata();
  const imageWidth  = meta.width  ?? 0;
  const imageHeight = meta.height ?? 0;

  let workingBuffer = inputBuffer;
  let wasUpscaled   = false;

  // ── [BARU] AI Upscale Check ───────────────────────────────────────────────
  // Jika gambar lebih kecil dari slot target, upscale dulu sebelum diproses.
  if (this.needsUpscale(imageWidth, imageHeight, targetWidth, targetHeight)) {
    const scale = this.determineScale(
      imageWidth, imageHeight, targetWidth, targetHeight,
    );

    this.logger.debug(
      `Gambar (${imageWidth}×${imageHeight}) lebih kecil dari slot ` +
      `(${targetWidth}×${targetHeight}). Upscale ${scale}x...`,
    );

    const upscaleResult = await this.upscaleService.upscaleWithFallback(
      workingBuffer,
      scale,
    );

    workingBuffer = upscaleResult.buffer;
    wasUpscaled   = upscaleResult.wasUpscaled;

    if (wasUpscaled) {
      this.logger.log(
        `Upscale ${scale}x berhasil — ` +
        `${imageWidth}×${imageHeight} → ` +
        `${imageWidth * scale}×${imageHeight * scale}`,
      );
    }
  }
  // ── [END BARU] ─────────────────────────────────────────────────────────────

  // ── Lanjut ke pipeline yang sudah ada (extract palette, cek rasio, dst) ──
  // Kode di bawah ini TIDAK BERUBAH — sama dengan implementasi sebelumnya.

  const dominantColor = await this.extractDominantColor(workingBuffer);
  const aspectRatio   = await this.checkAspectRatio(
    workingBuffer, targetWidth, targetHeight,
  );

  let outputBuffer: Buffer;
  let method: string;

  if (aspectRatio.gapPercent <= 15) {
    // Rasio cocok — Smart Crop
    outputBuffer = await this.smartCrop(workingBuffer, targetWidth, targetHeight);
    method = wasUpscaled ? 'upscale+crop' : 'crop';
  } else {
    // Rasio beda — Palette Gradient Background
    outputBuffer = await this.paletteGradient(
      workingBuffer, targetWidth, targetHeight, dominantColor,
    );
    method = wasUpscaled ? 'upscale+palette_gradient' : 'palette_gradient';
  }

  // Compress ke WebP max 200 KB
  const finalBuffer = await this.compressToWebP(outputBuffer, slotName);

  return { buffer: finalBuffer, method, dominantColor };
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 5: Tambahkan env vars di .env (apps/api)
// ─────────────────────────────────────────────────────────────────────────────

/*
  Tambahkan ke apps/api/.env:

  # Real-ESRGAN Upscale Service
  UPSCALE_SERVICE_URL=http://upscale-service:8001
  UPSCALE_TIMEOUT_MS=60000
*/

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 6: Register UpscaleService di module NestJS
// ─────────────────────────────────────────────────────────────────────────────

/*
  Di apps/api/src/modules/media/media.module.ts (atau modul yang relevan):

  import { UpscaleService } from '../../lib/upscale.service';

  @Module({
    providers: [
      MediaService,
      AdImageProcessor,
      UpscaleService,    // TAMBAHKAN
    ],
    ...
  })
  export class MediaModule {}
*/

// ─────────────────────────────────────────────────────────────────────────────
// LANGKAH 7: Update response ad-preview untuk expose method
// ─────────────────────────────────────────────────────────────────────────────

/*
  Response /api/v1/media/ad-preview sudah punya field "method".
  Sekarang method bisa bernilai:
    - "crop"                  — crop langsung, gambar sudah cukup besar
    - "palette_gradient"      — gambar cukup besar tapi rasio beda
    - "upscale+crop"          — di-upscale dulu, lalu crop
    - "upscale+palette_gradient" — di-upscale dulu, lalu palette gradient

  Field ini sudah dikirim ke frontend (AdSmartPreview.tsx).
  Update label badge di frontend:

  const methodLabel: Record<string, string> = {
    'crop':                     'Smart Crop',
    'palette_gradient':         'Palette Background',
    'upscale+crop':             'AI Upscaled + Crop',
    'upscale+palette_gradient': 'AI Upscaled + Palette BG',
  };
*/
