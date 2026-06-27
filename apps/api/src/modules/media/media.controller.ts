import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'crypto'
import { requireAuth } from '../../middleware/auth.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import * as repo from './media.repository'
import { AppError } from '../../utils/AppError'
import { logger } from '../../lib/logger'
import { StorageService } from '../../services/storage.service'
import nodePath from 'path'
import fs from 'fs/promises'
import {
  processAdSmart,
  validateAdImage,
  validateAdVideo,
  generatePreviews,
  AD_SLOTS,
  AD_VARIANTS,
} from '../../lib/ad-image-processor'

// Path ke editorial.png watermark
const MEDIA_WATERMARK_PATH = nodePath.join(__dirname, '..', '..', 'assets', 'watermarks', 'editorial.png')

export const mediaRouter: Router = Router()

// ─── Multer (memory storage — no local disk writes) ───────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB (video butuh lebih besar)
  fileFilter: (_, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
      'video/mp4', 'video/webm', 'video/quicktime',
      'video/x-m4v', 'video/mpeg', 'video/3gpp', 'video/ogg',
    ]
    // Also accept by extension as fallback (some browsers send different mimetypes)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.mp4', '.webm', '.mov', '.m4v', '.mpeg', '.mpg', '.3gp']
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0]
    const extAllowed = ext ? allowedExtensions.includes(ext) : false

    if (allowed.includes(file.mimetype) || (file.mimetype.startsWith('video/') && extAllowed)) {
      cb(null, true)
    } else {
      cb(new AppError('Tipe file tidak didukung. Gunakan JPG, PNG, WebP, GIF, MP4, WebM, atau MOV', 400, 'INVALID_FILE_TYPE'))
    }
  },
})

// ─── Sharp Dynamic Import Helper ──────────────────────────────────────────────

async function loadSharp() {
  try {
    const mod = await import('sharp')
    return mod.default
  } catch {
    throw new AppError('Library pemrosesan gambar tidak tersedia. Pastikan sharp terinstall.', 500, 'SHARP_NOT_AVAILABLE')
  }
}

// ─── Ad Image Processing ─────────────────────────────────────────────────────
// NOTE: Fungsi processAdImage, processAdImageWithDims, dan createLetterbox
// telah dipindahkan ke ../../lib/ad-image-processor.ts (palette gradient approach)
// Import: processAdSmart, validateAdImage, generatePreviews

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

interface ImageMetadata {
  width?: number | null
  height?: number | null
  format?: string | null
}

async function processImage(
  buffer: Buffer,
  options: { skipWatermark?: boolean } = {}
): Promise<ProcessResult> {
  const sharp = await loadSharp()

  let meta: ImageMetadata
  try {
    meta = await sharp(buffer).metadata()
  } catch (err: unknown) {
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
    } catch (err: unknown) {
      logger.error('[Media] Failed to resize image:', err)
      throw new AppError('Gagal meresize gambar', 500, 'IMAGE_RESIZE_FAILED')
    }
  }

  // ── Full-size image (with optional watermark) ──
  let pipeline = sharp(processedBuffer)

  if (!options.skipWatermark) {
    try {
      // Cek ketersediaan asset watermark editorial
      await fs.access(MEDIA_WATERMARK_PATH)

      const currentMeta = await sharp(processedBuffer).metadata()
      const currentW = currentMeta.width || maxW

      // Hitung lebar watermark ideal: 12% dari lebar gambar, minimal 100px, maksimal 300px
      const targetWatermarkWidth = Math.min(300, Math.max(100, Math.floor(currentW * 0.12)))

      // Resize watermark PNG secara dinamis agar proporsional
      const resizedWatermarkBuffer = await sharp(MEDIA_WATERMARK_PATH)
        .resize(targetWatermarkWidth)
        .toBuffer()

      pipeline = pipeline.composite([
        {
          input: resizedWatermarkBuffer,
          gravity: 'southeast',
          blend: 'over',
        },
      ])
      logger.info(`[Media] Watermark applied (w=${targetWatermarkWidth}px)`)
    } catch (err: unknown) {
      // Watermark is optional - log warning but don't fail the upload
      // EXIF copyright metadata is always embedded regardless
      logger.warn('[Media] Watermark skipped (asset not found or processing failed):', err)
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
            Copyright: `© ${new Date().getFullYear()} BERITAKARYA.co. All rights reserved. Unauthorized use prohibited.`,
            Artist: 'BERITAKARYA Editorial'
          }
        }
      })
      .webp({ quality: 82 })
      .toBuffer()
  } catch (err: unknown) {
    logger.error('[Media] Failed to convert to WebP:', err)
    throw new AppError('Gagal mengkonversi gambar ke format WebP', 500, 'WEBP_CONVERSION_FAILED')
  }

  // ── Thumbnail 400px ──
  let thumbBuffer: Buffer
  try {
    thumbBuffer = await sharp(buffer).resize(400).webp({ quality: 70 }).toBuffer()
  } catch (err: unknown) {
    logger.error('[Media] Failed to create thumbnail:', err)
    throw new AppError('Gagal membuat thumbnail', 500, 'THUMBNAIL_FAILED')
  }

  // ── BlurHash (tiny 10x10 WebP base64) ──
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
  let finalMeta: ImageMetadata
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
    // Gallery uploads (foto jurnalistik) must ALWAYS have watermark -- cannot be skipped
    const skipWatermark =
      !isGallery && (isLogo || req.query.skipWatermark === 'true' || req.query.purpose === 'editorial')

    logger.info(
      `[Media] Uploading: ${req.file.originalname} (${req.file.size} bytes, mime=${req.file.mimetype}), type=${req.query.type || 'standard'}, purpose=${req.query.purpose || 'none'}`
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

    // MASALAH 4: Hitung SHA-256 content hash untuk deduplikasi per-site
    const contentHash = createHash('sha256').update(req.file.buffer).digest('hex')

    // MASALAH 4: Cek duplikat sebelum proses upload
    if (!isAd && contentHash) {
      const existingMedia = await repo.findMediaByContentHash(req.site!, contentHash)
      if (existingMedia) {
        logger.info(`[Media] Deduplikasi: file identik sudah ada (id=${existingMedia.id}), melewati upload`)
        return res.json({
          success: true,
          data: existingMedia,
          meta: { deduplicated: true, message: 'File identik sudah ada di site ini' }
        })
      }
    }

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
      const adSlot = req.query.slot as string | undefined
      const adVariant = req.query.variant as string | undefined // 'desktop' | 'tablet' | 'mobile'
      const isVideo = req.file.mimetype.startsWith('video/')

      if (isVideo) {
        // ── Ad video: upload directly, no image processing ──
        const ext = req.file.mimetype === 'video/webm' ? 'webm' : 'mp4'
        const adKey = `ads/${id}.${ext}`
        await StorageService.uploadBuffer(req.file.buffer, adKey, req.file.mimetype, mediaBucket, {
          isPublic: true,
        })
        url = StorageService.getPublicUrl(mediaBucket, adKey)
        thumbUrl = url
        originalFormat = `ad-${ext}`
      } else {
        // ── Ad image: smart palette gradient + resize + compress ──
        // Validasi (warning only, tidak memblokir)
        const validation = await validateAdImage(req.file.buffer, adSlot)
        if (!validation.valid) {
          throw new AppError(validation.errors.join(' '), 400, 'INVALID_AD_IMAGE')
        }

        let targetSlot = adSlot
        if (adSlot && adVariant && AD_VARIANTS[adSlot]?.[adVariant]) {
          // Use variant-specific dimensions
          const variantDims = AD_VARIANTS[adSlot][adVariant]
          const adResult = await processAdSmart(req.file.buffer, variantDims.width, variantDims.height, `${adSlot}_${adVariant}`)
          const suffix = adVariant !== 'desktop' ? `-${adVariant}` : ''
          const adKey = `ads/${id}${suffix}.webp`
          await StorageService.uploadBuffer(adResult.buffer, adKey, 'image/webp', mediaBucket, {
            isPublic: true,
          })
          url = StorageService.getPublicUrl(mediaBucket, adKey)
          thumbUrl = url
          width = adResult.width
          height = adResult.height
          originalFormat = 'ad-webp'
        } else if (targetSlot && AD_SLOTS[targetSlot]) {
          const slotDims = AD_SLOTS[targetSlot]
          const adResult = await processAdSmart(req.file.buffer, slotDims.width, slotDims.height, targetSlot)
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
          // No slot specified — just convert to webp
          const sharp = await loadSharp()
          const processed = await sharp(req.file.buffer)
            .resize(1200, undefined, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer()
          const adKey = `ads/${id}.webp`
          await StorageService.uploadBuffer(processed, adKey, 'image/webp', mediaBucket, {
            isPublic: true,
          })
          url = StorageService.getPublicUrl(mediaBucket, adKey)
          thumbUrl = url
          originalFormat = 'ad-webp'
        }
      }
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
      siteId: req.site as string,
      altText: req.body.altText || (isLogo ? 'Logo Situs' : ''),
      caption: req.body.caption,
      credit: req.body.credit,
      dominantColor,
      contentHash,
    })

    res.status(201).json({ success: true, data: media })
  })
)

// ─── POST /api/v1/media/upload-ad — single upload, auto-generate semua variant ──
// Advertiser upload 1 file, backend generate desktop/tablet/mobile variants

mediaRouter.post(
  '/upload-ad',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('File tidak ditemukan', 400, 'FILE_NOT_FOUND')
    }

    const adSlot = req.query.slot as string | undefined
    if (!adSlot || !AD_VARIANTS[adSlot]) {
      throw new AppError('Slot iklan tidak valid. Gunakan: leaderboard, rectangle, rectangle_secondary, in_feed', 400, 'INVALID_SLOT')
    }

    const isVideo = req.file.mimetype.startsWith('video/')
    const mediaBucket = StorageService.mediaBucket
    const id = uuidv4()
    const warnings: string[] = []

    if (isVideo) {
      // ── Video: validasi + upload + generate thumbnail ──
      const videoValidation = await validateAdVideo(req.file.buffer, req.file.mimetype)
      if (!videoValidation.valid) {
        throw new AppError(videoValidation.errors.join(' '), 400, 'INVALID_AD_VIDEO')
      }
      warnings.push(...videoValidation.warnings)

      const ext = req.file.mimetype === 'video/webm' ? 'webm' : 'mp4'
      const videoKey = `ads/${id}.${ext}`
      await StorageService.uploadBuffer(req.file.buffer, videoKey, req.file.mimetype, mediaBucket, {
        isPublic: true,
      })
      const videoUrl = StorageService.getPublicUrl(mediaBucket, videoKey)

      // Generate thumbnail dari frame pertama
      let thumbnailUrl: string | null = null
      try {
        const sharp = await loadSharp()
        const thumbBuffer = await sharp(req.file.buffer, { page: 0 })
          .resize(600, undefined, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75 })
          .toBuffer()
        const thumbKey = `ads/${id}-thumb.webp`
        await StorageService.uploadBuffer(thumbBuffer, thumbKey, 'image/webp', mediaBucket, {
          isPublic: true,
        })
        thumbnailUrl = StorageService.getPublicUrl(mediaBucket, thumbKey)
      } catch (err) {
        logger.warn('[Media] Video thumbnail generation failed (non-fatal):', err)
        warnings.push('Thumbnail video gagal dibuat')
      }

      return res.json({
        success: true,
        data: {
          desktop: { url: videoUrl, width: 0, height: 0, method: 'video', dominantColor: null },
          tablet: null,
          mobile: null,
          thumbnail: thumbnailUrl,
          warnings,
          originalFormat: ext,
        },
      })
    }

    // ── Image: validasi + generate semua variant ──
    const validation = await validateAdImage(req.file.buffer, adSlot)
    if (!validation.valid) {
      throw new AppError(validation.errors.join(' '), 400, 'INVALID_AD_IMAGE')
    }
    warnings.push(...validation.warnings)

    // Get original dimensions
    const sharp = await loadSharp()
    const origMeta = await sharp(req.file.buffer).metadata()
    const originalDimensions = { width: origMeta.width || 0, height: origMeta.height || 0 }

    // Generate semua variant untuk slot yang dipilih
    const variants = AD_VARIANTS[adSlot]
    const variantEntries = Object.entries(variants)

    const results = await Promise.all(
      variantEntries.map(async ([variantName, dims]) => {
        const result = await processAdSmart(req.file!.buffer, dims.width, dims.height, `${adSlot}_${variantName}`)
        const suffix = variantName !== 'desktop' ? `-${variantName}` : ''
        const key = `ads/${id}${suffix}.webp`
        await StorageService.uploadBuffer(result.buffer, key, 'image/webp', mediaBucket, {
          isPublic: true,
        })
        return [
          variantName,
          {
            url: StorageService.getPublicUrl(mediaBucket, key),
            width: result.width,
            height: result.height,
            method: result.method,
            dominantColor: result.dominantColor,
          },
        ] as const
      })
    )

    // Build response object
    const responseData: Record<string, unknown> = {}
    for (const [name, data] of results) {
      responseData[name] = data
    }

    res.json({
      success: true,
      data: {
        ...responseData,
        thumbnail: null,
        warnings,
        originalDimensions,
      },
    })
  })
)

// ─── POST /api/v1/media/ad-preview -- preview iklan di semua slot ─────────────

mediaRouter.post(
  '/ad-preview',
  requireAuth,
  siteMiddleware,
  requireSiteAccess,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('File tidak ditemukan', 400, 'FILE_NOT_FOUND')
    }

    const validation = await validateAdImage(req.file.buffer)
    if (!validation.valid) {
      throw new AppError(validation.errors.join(' '), 400, 'INVALID_AD_IMAGE')
    }

    const previews = await generatePreviews(req.file.buffer)
    const storage = StorageService.mediaBucket

    // Upload semua preview ke temporary storage
    const previewData = await Promise.all(
      previews.map(async (preview) => {
        const key = `ads/preview/${uuidv4()}.webp`
        await StorageService.uploadBuffer(preview.result.buffer, key, 'image/webp', storage, {
          isPublic: true,
        })
        return {
          slot: preview.slot,
          variant: preview.variant,
          url: StorageService.getPublicUrl(storage, key),
          width: preview.result.width,
          height: preview.result.height,
          method: preview.result.method,
          dominantColor: preview.result.dominantColor,
        }
      })
    )

    res.json({
      success: true,
      data: {
        previews: previewData,
        warnings: validation.warnings,
      },
    })
  })
)

// ─── GET /api/v1/media -- list media ──────────────────────────────────────────

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

// ─── PATCH /api/v1/media/:id -- update metadata ───────────────────────────────

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
