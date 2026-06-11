import sharp from 'sharp'
import fs from 'fs/promises'
import { logger } from '../lib/logger'

// MIME type mapping from sharp format to actual MIME
const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
 jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  tiff: 'image/tiff',
  avif: 'image/avif'
}

export class FileValidator {
  static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  static async validateFile(
    filePath: string,
    _originalName: string
  ): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      const stats = await fs.stat(filePath)
      if (stats.size > this.MAX_FILE_SIZE) {
        return { valid: false, error: `File terlalu besar. Maksimal ${this.MAX_FILE_SIZE / 1024 / 1024}MB` }
      }

      // Use sharp to get image metadata including format
      const metadata = await sharp(filePath).metadata()
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'File bukan gambar yang valid' }
      }

      // Get MIME from format
      const mime = FORMAT_TO_MIME[metadata.format?.toLowerCase() || ''] || 'application/octet-stream'
      if (!this.ALLOWED_MIME_TYPES.includes(mime)) {
        return { valid: false, error: `Tipe file tidak diizinkan: ${mime}` }
      }

      // Resolusi rendah hanya dicatat sebagai warning — tidak memblokir upload.
      // Keputusan akhir tetap di tangan admin saat review KYC.
      const LOW_RES_WIDTH = 640
      const LOW_RES_HEIGHT = 480
      const lowResolution = metadata.width < LOW_RES_WIDTH || metadata.height < LOW_RES_HEIGHT
      if (lowResolution) {
        logger.warn(
          `File resolusi rendah: ${metadata.width}x${metadata.height} ` +
          `(minimum disarankan ${LOW_RES_WIDTH}x${LOW_RES_HEIGHT}). Diterima sebagai peringatan.`
        )
      }

      if (process.env.CLAMAV_ENABLED === 'true') {
        const isClean = await this.scanWithClamAV(filePath)
        if (!isClean) {
          await fs.unlink(filePath)
          return { valid: false, error: 'File terdeteksi berisi malware' }
        }
      }

      return {
        valid: true,
        metadata: {
          mime,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: stats.size,
          // Flag ini dikirim ke lapisan atas agar admin dapat melihat peringatan di panel review
          lowResolution
        }
      }
    } catch (error: any) {
      logger.error('File validation error:', error)
      return { valid: false, error: 'Validasi file gagal' }
    }
  }

  private static async scanWithClamAV(_filePath: string): Promise<boolean> {
    return true // Placeholder
  }
}