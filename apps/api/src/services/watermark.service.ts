import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../lib/logger'

// Path ke font file Inter Bold yang valid (TTF)
// Digunakan oleh Pango (via sharp text input) — bukan via SVG @font-face
// yang tidak didukung oleh librsvg untuk embedded base64 fonts.
const FONT_PATH = path.join(__dirname, '..', 'assets', 'fonts', 'Inter-Bold.ttf')

export interface WatermarkOptions {
  text?: string
  opacity?: number
  fontSize?: number
}

export interface SaveResult {
  original: string
  thumbnail: string
}

/**
 * Membuat buffer SVG sederhana untuk tiled watermark (teks diagonal).
 * TANPA @font-face embedding — menggunakan font sistem (sans-serif) agar
 * librsvg dapat me-render teks dengan benar. Font path diserahkan ke sharp
 * text input di layer lain yang memakai Pango (bukan librsvg).
 */
function buildTiledTextComposites(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  opacity: number,
  fontfile: string
): sharp.OverlayOptions[] {
  const composites: sharp.OverlayOptions[] = []

  // Ukuran tile: setiap baris teks, diulang secara diagonal
  const tileW = Math.min(width, 600)
  const tileH = fontSize * 4

  for (let y = -tileH; y < height + tileH; y += tileH) {
    for (let x = -tileW / 2; x < width + tileW; x += tileW) {
      // Offset diagonal setiap baris
      const offsetX = Math.floor(((y / tileH) % 2) * (tileW / 2))
      const left = Math.floor(x + offsetX)
      const top = Math.floor(y)

      // Skip jika di luar batas gambar
      if (left + tileW < 0 || top + tileH < 0 || left >= width || top >= height) continue

      // Gunakan sharp text input dengan fontfile — Pango MENDUKUNG ini
      // rgba: true agar bisa dikomposit dengan transparansi
      // Pango menggunakan format warna hex (#RRGGBBAA) bukan rgba()
      const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0')
      const foreground = `#b41c1c${alphaHex}` // merah KYC dengan opacity
      composites.push({
        input: {
          text: {
            text: `<span foreground="${foreground}">${text}</span>`,
            font: 'Inter Bold',
            fontfile,
            dpi: 96,
            rgba: true,
          },
        } as any,
        left: Math.max(0, left),
        top: Math.max(0, top),
        blend: 'over',
      })
    }
  }

  return composites
}

/**
 * Membuat stamp watermark di bagian bawah gambar menggunakan SVG murni
 * (tanpa teks — hanya background box merah) dan teks ditambahkan via sharp text input.
 * Ini menghindari masalah font embedding di librsvg.
 */
async function buildStampComposite(
  text: string,
  width: number,
  height: number,
  fontfile: string
): Promise<sharp.OverlayOptions[]> {
  const boxH = 40
  const boxW = width
  const boxTop = height - boxH

  // SVG background merah untuk stamp — tidak perlu teks/font, hanya shape
  const stampBgSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(200,35,35,0.95)"/>
          <stop offset="100%" stop-color="rgba(140,18,18,0.95)"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${boxW}" height="${boxH}" fill="url(#g)"/>
      <rect x="4" y="2" width="${boxW - 8}" height="1.5" rx="1" fill="rgba(255,255,255,0.35)"/>
    </svg>`
  )

  const composites: sharp.OverlayOptions[] = [
    // Background merah stamp
    {
      input: stampBgSvg,
      left: 0,
      top: boxTop,
      blend: 'over',
    },
    // Teks stamp via Pango (bukan SVG @font-face)
    {
      input: {
        text: {
          text: `<span foreground="white" letter_spacing="1024">${text}</span>`,
          font: 'Inter Bold',
          fontfile,
          dpi: 96,
          rgba: true,
        },
      } as any,
      gravity: 'south',
      blend: 'over',
    },
  ]

  return composites
}

export class WatermarkService {
  /**
   * Apply a tiled watermark to an image file (overwrites in-place).
   * Menggunakan sharp text input + Pango (bukan SVG @font-face) agar
   * font TTF dapat di-render dengan benar tanpa perlu di-install ke sistem.
   */
  static async applyWatermark(imagePath: string, options: WatermarkOptions = {}): Promise<void> {
    const {
      text = 'HANYA UNTUK VERIFIKASI BERITAKARYA',
      opacity = 0.42,
      fontSize = 22,
    } = options

    try {
      const imageBuffer = await fs.readFile(imagePath)
      const metadata = await sharp(imageBuffer).metadata()

      const width = metadata.width ?? 1200
      const height = metadata.height ?? 900

      // Cek apakah font file tersedia
      let fontfile = FONT_PATH
      try {
        await fs.access(fontfile)
      } catch {
        // Fallback: gunakan font sistem jika Inter-Bold.ttf tidak ada
        fontfile = ''
        logger.warn('[WatermarkService] Inter-Bold.ttf not found, using system font')
      }

      // Build tiled diagonal text composites via Pango
      const composites = buildTiledTextComposites(text, width, height, fontSize, opacity, fontfile)

      // Build stamp composites (background + text)
      const stampComposites = await buildStampComposite(
        'BERITAKARYA · RAHASIA · HANYA UNTUK VERIFIKASI',
        width,
        height,
        fontfile
      )

      const allComposites = [...composites, ...stampComposites]

      // Write watermarked image to a temp file first, then replace original
      // NOTE: fs.rename() GAGAL lintas device (EXDEV) di Docker karena /tmp (tmpfs)
      // dan bind-mounted volume dianggap filesystem berbeda.
      // fs.copyFile() + fs.unlink() bekerja di semua kondisi.
      const tmpPath = `${imagePath}.wm.tmp`
      await sharp(imageBuffer)
        .composite(allComposites)
        // Embed EXIF copyright — persistent metadata for legal traceability
        .withMetadata({
          exif: {
            IFD0: {
              Copyright: `\u00A9 ${new Date().getFullYear()} BERITAKARYA.co - DOKUMEN RAHASIA KYC`,
              Artist: 'BERITAKARYA Verification System',
              ImageDescription: 'KYC Document - Confidential',
            },
          },
        })
        .toFile(tmpPath)
      await fs.copyFile(tmpPath, imagePath)
      await fs.unlink(tmpPath).catch(() => {})

      logger.info(`[WatermarkService] Watermark applied: ${path.basename(imagePath)}`)
    } catch (error: any) {
      logger.error(`[WatermarkService] Failed to watermark ${imagePath}:`, error)
      throw error
    }
  }

  /**
   * Generate a small thumbnail (300×200 JPEG) for admin preview.
   */
  static async generateThumbnail(sourcePath: string, thumbPath: string): Promise<void> {
    try {
      await sharp(sourcePath)
        .resize(300, 200, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(thumbPath)

      logger.info(`[WatermarkService] Thumbnail generated: ${path.basename(thumbPath)}`)
    } catch (error: any) {
      logger.error(`[WatermarkService] Failed to generate thumbnail ${thumbPath}:`, error)
      throw error
    }
  }

  /**
   * Move a temp upload to permanent storage, apply watermark, and generate thumbnail.
   * Returns absolute paths to both the watermarked original and the thumbnail.
   */
  static async savePermanent(
    tempPath: string,
    userId: string,
    type: 'ktp' | 'kk',
    storageDir?: string
  ): Promise<SaveResult> {
    const { randomBytes } = await import('crypto')
    const hash = randomBytes(16).toString('hex')
    const ext = path.extname(tempPath) || '.jpg'
    const finalDir = storageDir ?? process.env.KYC_STORAGE_PATH ?? '/var/uploads/kyc'
    const filename = `${type}_${userId}_${hash}${ext}`
    const thumbFilename = `${type}_${userId}_${hash}_thumb.jpg`
    const finalPath = path.join(finalDir, filename)
    const thumbPath = path.join(finalDir, thumbFilename)

    await fs.mkdir(finalDir, { recursive: true })

    // Copy temp → final location, lalu hapus temp.
    // fs.rename() GAGAL lintas device (EXDEV) di Docker karena /tmp (tmpfs)
    // dan bind-mounted volume dianggap filesystem berbeda.
    // fs.copyFile() + fs.unlink() bekerja di semua kondisi.
    await fs.copyFile(tempPath, finalPath)
    await fs.unlink(tempPath).catch(() => {}) // cleanup temp, abaikan error

    // Apply watermark in-place on the permanent file
    await WatermarkService.applyWatermark(finalPath)

    // Generate thumbnail from the watermarked image
    await WatermarkService.generateThumbnail(finalPath, thumbPath)

    return { original: finalPath, thumbnail: thumbPath }
  }
}
