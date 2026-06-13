import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { logger } from '../lib/logger'

const KYC_TILE_PATH = path.join(__dirname, '..', 'assets', 'watermarks', 'kyc-tile.png')
const KYC_STAMP_PATH = path.join(__dirname, '..', 'assets', 'watermarks', 'kyc-stamp.png')


export interface WatermarkOptions {
  text?: string
  opacity?: number
  fontSize?: number
}

export interface SaveResult {
  original: string
  thumbnail: string
}

export class WatermarkService {
  /**
   * Apply a tiled watermark to an image file (overwrites in-place).
   * Menggunakan asset PNG transparan statis agar 100% aman dari masalah
   * font rendering (kotak-kotak/tofu) di server produksi.
   */
  static async applyWatermark(imagePath: string, _options: WatermarkOptions = {}): Promise<void> {
    try {
      const imageBuffer = await fs.readFile(imagePath)

      // Cek ketersediaan aset gambar watermark
      try {
        await fs.access(KYC_TILE_PATH)
        await fs.access(KYC_STAMP_PATH)
      } catch (err) {
        logger.error(`[WatermarkService] Missing watermark assets: ${KYC_TILE_PATH} or ${KYC_STAMP_PATH}`)
        throw new Error('Aset watermark tidak ditemukan di server')
      }

      // Tumpuk pola tile ke seluruh foto (tile: true) dan pita merah di bagian bawah (gravity: south)
      const allComposites: sharp.OverlayOptions[] = [
        {
          input: KYC_TILE_PATH,
          tile: true,
          blend: 'over',
        },
        {
          input: KYC_STAMP_PATH,
          gravity: 'south',
          blend: 'over',
        },
      ]

      // Write watermarked image to a temp file first, then replace original
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
    const defaultDir = process.env.NODE_ENV === 'production'
      ? path.join(os.tmpdir(), 'beritakarya-kyc')
      : path.join(process.cwd(), 'uploads', 'kyc')
    const finalDir = storageDir ?? process.env.KYC_STORAGE_PATH ?? defaultDir
    const filename = `${type}_${userId}_${hash}${ext}`
    const thumbFilename = `${type}_${userId}_${hash}_thumb.jpg`
    const finalPath = path.join(finalDir, filename)
    const thumbPath = path.join(finalDir, thumbFilename)

    await fs.mkdir(finalDir, { recursive: true })

    await fs.copyFile(tempPath, finalPath)
    await fs.unlink(tempPath).catch(() => {}) // cleanup temp, abaikan error

    // Apply watermark in-place on the permanent file
    await WatermarkService.applyWatermark(finalPath)

    // Generate thumbnail from the watermarked image
    await WatermarkService.generateThumbnail(finalPath, thumbPath)

    return { original: finalPath, thumbnail: thumbPath }
  }
}
