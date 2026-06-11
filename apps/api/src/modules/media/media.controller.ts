import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../../middleware/auth.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import * as repo from './media.repository'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import { StorageService } from '../../services/storage.service'
import { createMediaWatermarkSvg } from '../../utils/watermark-svg'

export const mediaRouter: Router = Router()

// ─── Multer (memory storage — no local disk writes) ───────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new AppError('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF', 400, 'INVALID_FILE_TYPE'))
  },
})

// ─── Ad-specific image processing (compress to max size) ───────────────────

const AD_MAX_WIDTH = 1200
const AD_MAX_SIZE_BYTES = 200 * 1024 // 200 KB

async function processAdImage(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch {
    throw new AppError('Library pemrosesan gambar tidak tersedia.', 500, 'SHARP_NOT_AVAILABLE')
  }

  // Resize to max width, keep aspect ratio
  let processed = await sharp(buffer)
    .resize(AD_MAX_WIDTH, undefined, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  // Compress until under max size (reduce quality iteratively)
  let quality = 80
  while (processed.length > AD_MAX_SIZE_BYTES && quality > 30) {
    quality -= 10
    processed = await sharp(buffer)
      .resize(AD_MAX_WIDTH, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
  }

  const meta = await sharp(processed).metadata()
  return { buffer: processed, width: meta.width || 0, height: meta.height || 0 }
}

// ─── Image Processing (Sharp) ─────────────────────────────────────────────────

interface ProcessResult {
  fullBuffer: Buffer
  thumbBuffer: Buffer
  blurHash: string
  dominantColor: string
  width: number
  height: number
  originalFormat: string
}

async function processImage(
  buffer: Buffer,
  options: { skipWatermark?: boolean } = {}
): Promise<ProcessResult> {
  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch (err) {
    logger.error('[Media] Failed to import sharp:', err)
    throw new AppError('Library pemrosesan gambar tidak tersedia. Pastikan sharp terinstall.', 500, 'SHARP_NOT_AVAILABLE')
  }

  let meta: any
  try {
    meta = await sharp(buffer).metadata()
  } catch (err: any) {
    logger.error('[Media] Failed to read image metadata:', err)
    throw new AppError('Tidak dapat membaca metadata gambar. File mungkin corrupted atau format tidak didukung.', 500, 'INVALID_IMAGE_METADATA')
  }

  if (!meta.width || !meta.height) {
    throw new AppError('Gambar tidak memiliki dimensi yang valid', 500, 'INVALID_IMAGE_DIMENSIONS')
  }

  const maxW = 1920
  let processedBuffer = buffer
  if ((meta.width ?? 0) > maxW) {
    try {
      processedBuffer = await sharp(buffer).resize(maxW).toBuffer()
    } catch (err: any) {
      logger.error('[Media] Failed to resize image:', err)
      throw new AppError('Gagal meresize gambar', 500, 'IMAGE_RESIZE_FAILED')
    }
  }

  // ── Full-size image (with optional watermark) ──
  let pipeline = sharp(processedBuffer)

  if (!options.skipWatermark) {
    try {
      const currentMeta = await sharp(processedBuffer).metadata()
      const currentW = currentMeta.width || maxW
      // Font size scales with image width: ~2% of width, min 14px, max 48px
      const fontSize = Math.min(48, Math.max(14, Math.floor(currentW * 0.020)))
      const watermarkText = '\u00A9 BERITAKARYA.co'

      // Professional text-only watermark with drop shadow (no background box)
      // Matches global media agency standard: Reuters, AFP, AP style
      const svgBuf = createMediaWatermarkSvg(watermarkText, { fontSize })

      pipeline = pipeline.composite([{ input: svgBuf, gravity: 'southeast' }])
    } catch (err: any) {
      logger.error('[Media] Failed to add watermark:', err)
      throw new AppError('Gagal menambahkan watermark', 500, 'WATERMARK_FAILED')
    }
  }

  let fullBuffer: Buffer
  try {
    // Embed EXIF copyright metadata — persistent even if watermark is cropped
    // Follows IPTC/XMP standard used by Reuters, AFP, Getty
    fullBuffer = await pipeline
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: `\u00A9 ${new Date().getFullYear()} BERITAKARYA.co. All rights reserved. Unauthorized use prohibited.`,
            Artist: 'BERITAKARYA Editorial'
          }
        }
      })
      .webp({ quality: 82 })
      .toBuffer()
  } catch (err: any) {
    logger.error('[Media] Failed to convert to WebP:', err)
    throw new AppError('Gagal mengkonversi gambar ke format WebP', 500, 'WEBP_CONVERSION_FAILED')
  }

  // ── Thumbnail 400px ──
  let thumbBuffer: Buffer
  try {
    thumbBuffer = await sharp(buffer).resize(400).webp({ quality: 70 }).toBuffer()
  } catch (err: any) {
    logger.error('[Media] Failed to create thumbnail:', err)
    throw new AppError('Gagal membuat thumbnail', 500, 'THUMBNAIL_FAILED')
  }

  // ── BlurHash (tiny 10×10 WebP base64) ──
  let blurHash = ''
  try {
    const blurBuffer: Buffer = await sharp(buffer)
      .resize(10, 10, { fit: 'inside' })
      .webp({ quality: 20 })
      .toBuffer()
    blurHash = `data:image/webp;base64,${blurBuffer.toString('base64')}`
  } catch (err) {
    logger.warn('[Media] Failed to create blurhash, using empty string:', err)
  }

  // ── Dominant color ──
  let dominantColor = ''
  try {
    const stats = await sharp(buffer).stats()
    const d = stats.dominant
    if (d) {
      dominantColor = `#${d.r.toString(16).padStart(2, '0')}${d.g.toString(16).padStart(2, '0')}${d.b.toString(16).padStart(2, '0')}`.toUpperCase()
    }
  } catch { /* non-critical */ }

  // ── Final dimensions from the processed full image ──
  let finalMeta: any
  try {
    finalMeta = await sharp(fullBuffer).metadata()
  } catch (err) {
    logger.warn('[Media] Failed to get final metadata, using original:', err)
    finalMeta = meta
  }

  return {
    fullBuffer,
    thumbBuffer,
    blurHash,
    dominantColor,
    width: finalMeta?.width ?? meta?.width ?? 0,
    height: finalMeta?.height ?? meta?.height ?? 0,
    originalFormat: meta?.format ?? 'unknown',
  }
}

// ─── POST /api/v1/media/upload ────────────────────────────────────────────────

mediaRouter.post(
  '/upload',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: 'File tidak ditemukan' } })
    }

    const isLogo = req.query.type === 'logo'
    const isGallery = req.query.purpose === 'gallery'
    // Gallery uploads (foto jurnalistik) must ALWAYS have watermark — cannot be skipped
    const skipWatermark =
      !isGallery && (isLogo || req.query.skipWatermark === 'true' || req.query.purpose === 'editorial')

    logger.info(
      `[Media] Uploading: ${req.file.originalname} (${req.file.size} bytes), type=${req.query.type || 'standard'}`
    )

    const id = uuidv4()
    const mediaBucket = StorageService.mediaBucket

    let url = ''
    let thumbUrl = ''
    let blurHash = ''
    let width = 0
    let height = 0
    let originalFormat = ''
    let dominantColor = ''

    const isAd = req.query.purpose === 'ad'

    if (req.file.mimetype === 'application/pdf') {
      // ── PDF: upload buffer directly ──
      const key = `${id}.pdf`
      await StorageService.uploadBuffer(req.file.buffer, key, 'application/pdf', mediaBucket, {
        isPublic: true,
      })
      url = StorageService.getPublicUrl(mediaBucket, key)
      thumbUrl = url
      originalFormat = 'pdf'
    } else if (isAd) {
      // ── Ad image: resize + compress to max 200KB ──
      const adResult = await processAdImage(req.file.buffer)
      const adKey = `ads/${id}.webp`
      await StorageService.uploadBuffer(adResult.buffer, adKey, 'image/webp', mediaBucket, {
        isPublic: true,
      })
      url = StorageService.getPublicUrl(mediaBucket, adKey)
      thumbUrl = url
      width = adResult.width
      height = adResult.height
      originalFormat = 'ad-webp'
    } else {
      // ── Image: process then upload two versions ──
      const processed: ProcessResult = await processImage(req.file.buffer, { skipWatermark })

      const fullKey = `${id}.webp`
      const thumbKey = `thumbs/${id}_thumb.webp`

      await Promise.all([
        StorageService.uploadBuffer(processed.fullBuffer, fullKey, 'image/webp', mediaBucket, {
          isPublic: true,
        }),
        StorageService.uploadBuffer(processed.thumbBuffer, thumbKey, 'image/webp', mediaBucket, {
          isPublic: true,
        }),
      ])

      url = StorageService.getPublicUrl(mediaBucket, fullKey)
      thumbUrl = StorageService.getPublicUrl(mediaBucket, thumbKey)
      blurHash = processed.blurHash
      width = processed.width
      height = processed.height
      originalFormat = processed.originalFormat
      dominantColor = processed.dominantColor
    }

    const media = await repo.createMedia({
      url,
      thumbUrl,
      blurHash,
      width,
      height,
      originalFormat,
      size: req.file.size,
      userId: req.user!.userId,
      siteId: req.site,
      altText: req.body.altText || (isLogo ? 'Logo Situs' : ''),
      caption: req.body.caption,
      credit: req.body.credit,
      dominantColor,
    })

    res.status(201).json({ success: true, data: media })
  })
)

// ─── GET /api/v1/media — list media ──────────────────────────────────────────

mediaRouter.get(
  '/',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 100)

    // Reporter/kontributor hanya bisa lihat media milik sendiri
    const restrictedRoles = ['reporter', 'kontributor']
    const userId = restrictedRoles.includes(req.user!.role) ? req.user!.userId : undefined

    const result = await repo.findMediaBySite(req.site!, page, limit, userId)
    res.json({ success: true, data: result })
  })
)

// ─── PATCH /api/v1/media/:id — update metadata ───────────────────────────────

mediaRouter.patch(
  '/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const media = await repo.findMediaById(req.params.id)
    if (!media)
      return res.status(404).json({ success: false, error: { message: 'Media tidak ditemukan' } })

    const isAdmin = ['superadmin', 'wapimred'].includes(req.user!.role)
    if (media.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak' } })
    }

    const { altText, caption, credit } = req.body
    const updated = await repo.updateMedia(req.params.id, { altText, caption, credit })
    res.json({ success: true, data: updated })
  })
)

// ─── DELETE /api/v1/media/:id ─────────────────────────────────────────────────

mediaRouter.delete(
  '/:id',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const media = await repo.findMediaById(req.params.id)
    if (!media)
      return res.status(404).json({ success: false, error: { message: 'Media tidak ditemukan' } })

    const isAdmin = ['superadmin', 'wapimred'].includes(req.user!.role)
    if (media.userId !== req.user!.userId && !isAdmin) {
      return res.status(403).json({ success: false, error: { message: 'Akses ditolak' } })
    }

    // Hapus dari Supabase Storage juga (best-effort)
    try {
      const urlObj = new URL(media.url)
      // Path biasanya: /storage/v1/object/public/media/<key>
      const parts = urlObj.pathname.split(`/${StorageService.mediaBucket}/`)
      if (parts.length === 2) {
        const key = parts[1]
        const thumbKey = `thumbs/${key.replace('.webp', '_thumb.webp')}`
        await Promise.allSettled([
          StorageService.deleteFile(key, StorageService.mediaBucket),
          StorageService.deleteFile(thumbKey, StorageService.mediaBucket),
        ])
      }
    } catch (storageErr) {
      logger.warn('[Media] Could not delete from storage (non-fatal):', storageErr)
    }

    await repo.deleteMedia(req.params.id)
    res.json({ success: true, message: 'Media berhasil dihapus' })
  })
)