import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../lib/logger'
import { createTiledWatermarkSvg, createStampWatermarkSvg } from '../utils/watermark-svg'

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
   */
  static async applyWatermark(imagePath: string, options: WatermarkOptions = {}): Promise<void> {
    const {
      text = 'HANYA UNTUK VERIFIKASI BERITAKARYA',
      opacity = 0.42,
      fontSize = 22
    } = options

    try {
      const imageBuffer = await fs.readFile(imagePath)
      const metadata = await sharp(imageBuffer).metadata()

      const width = metadata.width ?? 1200
      const height = metadata.height ?? 900

      // Build a tiled watermark: repeat text diagonally across the image
      const tileW = 500
      const tileH = 160
      const tileBuf = createTiledWatermarkSvg(text, {
        tileWidth: tileW,
        tileHeight: tileH,
        imageWidth: width,
        imageHeight: height,
        fontSize,
        opacity
      })

      // Tile the watermark to fill the image
      const composites: sharp.OverlayOptions[] = []
      for (let y = 0; y < height; y += tileH) {
        for (let x = 0; x < width; x += tileW) {
          composites.push({ input: tileBuf, top: y, left: x, blend: 'over' })
        }
      }

      // Also add a bold bottom-right attribution stamp
      const stampBuf = createStampWatermarkSvg('BERITAKARYA \u00B7 RAHASIA \u00B7 HANYA UNTUK VERIFIKASI', {
        width,
        height,
        boxWidth: 450,
        boxHeight: 36,
        fontSize: 13,
        bgColor: 'rgba(170,25,25,0.90)',
        textColor: 'white'
      })
      composites.push({ input: stampBuf, top: 0, left: 0, blend: 'over' })

      // Write watermarked image to a temp file first, then replace original
      // NOTE: fs.rename() GAGAL lintas device (EXDEV) di Docker karena /tmp (tmpfs)
      // dan bind-mounted volume dianggap filesystem berbeda.
      // fs.copyFile() + fs.unlink() bekerja di semua kondisi.
      const tmpPath = `${imagePath}.wm.tmp`
      await sharp(imageBuffer)
        .composite(composites)
        // Embed EXIF copyright — persistent metadata for legal traceability
        .withMetadata({
          exif: {
            IFD0: {
              Copyright: `\u00A9 ${new Date().getFullYear()} BERITAKARYA.co - DOKUMEN RAHASIA KYC`,
              Artist: 'BERITAKARYA Verification System',
              ImageDescription: 'KYC Document - Confidential'
            }
          }
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
