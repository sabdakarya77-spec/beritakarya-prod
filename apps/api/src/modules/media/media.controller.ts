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

// ─── Ad Slot Dimensions ──────────────────────────────────────────────────────

interface SlotDimensions {
  width: number
  height: number
  minWidth: number
  minHeight: number
}

const AD_SLOT_SIZES: Record<string, SlotDimensions> = {
  leaderboard: { width: 970, height: 250, minWidth: 600, minHeight: 150 },
  rectangle: { width: 300, height: 250, minWidth: 200, minHeight: 180 },
  rectangle_secondary: { width: 300, height: 250, minWidth: 200, minHeight: 180 },
  in_feed: { width: 300, height: 250, minWidth: 200, minHeight: 180 },
}

// Multi-size IAB variants for leaderboard
const AD_SLOT_VARIANTS: Record<string, Record<string, SlotDimensions>> = {
  leaderboard: {
    desktop: { width: 970, height: 250, minWidth: 600, minHeight: 150 },
    tablet:  { width: 728, height: 90,  minWidth: 500, minHeight: 60 },
    mobile:  { width: 320, height: 50,  minWidth: 280, minHeight: 40 },
  },
}

const AD_MAX_SIZE_BYTES = 200 * 1024 // 200 KB
const ASPECT_RATIO_TOLERANCE = 0.15 // 15% tolerance for aspect ratio matching

// ─── Ad-specific image processing with smart resize + letterbox ──────────────

async function processAdImage(
  buffer: Buffer,
  slot?: string
): Promise<{ buffer: Buffer; width: number; height: number; letterboxed: boolean }> {
  const sharp = await loadSharp()

  // Get original dimensions
  const origMeta = await sharp(buffer).metadata()
  const origW = origMeta.width || 0
  const origH = origMeta.height || 0

  if (origW === 0 || origH === 0) {
    throw new AppError('Gambar tidak memiliki dimensi yang valid', 400, 'INVALID_IMAGE_DIMENSIONS')
  }

  // If slot specified, validate minimum dimensions
  const slotSize = slot ? AD_SLOT_SIZES[slot] : null
  if (slotSize) {
    if (origW < slotSize.minWidth || origH < slotSize.minHeight) {
      throw new AppError(
        `Gambar terlalu kecil. Minimum ${slotSize.minWidth}×${slotSize.minHeight}px untuk slot ${slot}. Ukuran Anda: ${origW}×${origH}px.`,
        400,
        'IMAGE_TOO_SMALL'
      )
    }
  }

  // Check if aspect ratio matches target (if slot specified)
  let letterboxed = false
  let processed: Buffer

  if (slotSize) {
    const targetRatio = slotSize.width / slotSize.height
    const origRatio = origW / origH
    const ratioDiff = Math.abs(origRatio - targetRatio) / targetRatio

    if (ratioDiff > ASPECT_RATIO_TOLERANCE) {
      // Aspect ratio doesn't match → letterbox (blur background + contain foreground)
      letterboxed = true
      processed = await createLetterbox(buffer, slotSize.width, slotSize.height)
    } else {
      // Aspect ratio matches → resize to target
      processed = await sharp(buffer)
        .resize(slotSize.width, slotSize.height, { fit: 'cover', position: 'attention' })
        .webp({ quality: 80 })
        .toBuffer()
    }
  } else {
    // No slot specified → just resize to max width
    processed = await sharp(buffer)
      .resize(1200, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  }

  // Compress until under max size
  let quality = 80
  while (processed.length > AD_MAX_SIZE_BYTES && quality > 30) {
    quality -= 10
    if (slotSize && letterboxed) {
      processed = await createLetterbox(buffer, slotSize.width, slotSize.height, quality)
    } else if (slotSize) {
      processed = await sharp(buffer)
        .resize(slotSize.width, slotSize.height, { fit: 'cover', position: 'attention' })
        .webp({ quality })
        .toBuffer()
    } else {
      processed = await sharp(buffer)
        .resize(1200, undefined, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer()
    }
  }

  const meta = await sharp(processed).metadata()
  return { buffer: processed, width: meta.width || 0, height: meta.height || 0, letterboxed }
}

// ─── Process ad image with explicit dimensions (for multi-size IAB variants) ──

async function processAdImageWithDims(
  buffer: Buffer,
  dims: SlotDimensions
): Promise<{ buffer: Buffer; width: number; height: number; letterboxed: boolean }> {
  const sharp = await loadSharp()

  const origMeta = await sharp(buffer).metadata()
  const origW = origMeta.width || 0
  const origH = origMeta.height || 0

  if (origW === 0 || origH === 0) {
    throw new AppError('Gambar tidak memiliki dimensi yang valid', 400, 'INVALID_IMAGE_DIMENSIONS')
  }

  if (origW < dims.minWidth || origH < dims.minHeight) {
    throw new AppError(
      `Gambar terlalu kecil. Minimum ${dims.minWidth}×${dims.minHeight}px. Ukuran Anda: ${origW}×${origH}px.`,
      400,
      'IMAGE_TOO_SMALL'
    )
  }

  let letterboxed = false
  let processed: Buffer

  const targetRatio = dims.width / dims.height
  const origRatio = origW / origH
  const ratioDiff = Math.abs(origRatio - targetRatio) / targetRatio

  if (ratioDiff > ASPECT_RATIO_TOLERANCE) {
    letterboxed = true
    processed = await createLetterbox(buffer, dims.width, dims.height)
  } else {
    processed = await sharp(buffer)
      .resize(dims.width, dims.height, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80 })
      .toBuffer()
  }

  let quality = 80
  while (processed.length > AD_MAX_SIZE_BYTES && quality > 30) {
    quality -= 10
    if (letterboxed) {
      processed = await createLetterbox(buffer, dims.width, dims.height, quality)
    } else {
      processed = await sharp(buffer)
        .resize(dims.width, dims.height, { fit: 'cover', position: 'attention' })
        .webp({ quality })
        .toBuffer()
    }
  }

  const meta = await sharp(processed).metadata()
  return { buffer: processed, width: meta.width || 0, height: meta.height || 0, letterboxed }
}

// ─── Letterbox: blur background + contain foreground ─────────────────────────

async function createLetterbox(
  buffer: Buffer,
  targetW: number,
  targetH: number,
  quality: number = 80
): Promise<Buffer> {
  const sharp = await loadSharp()

  // 1. Create blurred background (cover → fills entire area → blur)
  const background = await sharp(buffer)
    .resize(targetW, targetH, { fit: 'cover', position: 'attention' })
    .blur(30)
    .toBuffer()

  // 2. Resize original with contain (fits inside → adds transparent padding)
  const foreground = await sharp(buffer)
    .resize(targetW, targetH, {
      fit: 'contain',
      position: 'attention',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()

  // 3. Composite: foreground on top of blurred background
  const result = await sharp(background)
    .composite([{ input: foreground, gravity: 'center' }])
    .webp({ quality })
    .toBuffer()

  return result
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
        // ── Ad image: smart resize + letterbox + compress to max 200KB ──
        // Resolve target dimensions: variant-specific > slot default
        let targetSlot = adSlot
        if (adSlot && adVariant && AD_SLOT_VARIANTS[adSlot]?.[adVariant]) {
          // Use variant-specific dimensions — pass as custom slot
          const variantDims = AD_SLOT_VARIANTS[adSlot][adVariant]
          const adResult = await processAdImageWithDims(req.file.buffer, variantDims)
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
        } else {
          const adResult = await processAdImage(req.file.buffer, targetSlot)
          const adKey = `ads/${id}.webp`
          await StorageService.uploadBuffer(adResult.buffer, adKey, 'image/webp', mediaBucket, {
            isPublic: true,
          })
          url = StorageService.getPublicUrl(mediaBucket, adKey)
          thumbUrl = url
          width = adResult.width
          height = adResult.height
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
