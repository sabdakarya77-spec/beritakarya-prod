/**
 * Smart Ad Image Processor
 *
 * Menggantikan blur letterbox dengan palette gradient background.
 * Upload 1 gambar → hasil profesional di semua slot iklan.
 *
 * Prinsip: Jangan tolak gambar kecil. Tangani dengan cerdas.
 */

import sharp from 'sharp'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SlotConfig {
  width: number
  height: number
  minWidth: number
  minHeight: number
}

export interface ProcessResult {
  buffer: Buffer
  width: number
  height: number
  method: 'palette_gradient' | 'smart_crop'
  dominantColor: string
}

export interface PreviewResult {
  slot: string
  variant?: string
  result: ProcessResult
}

// ─── Slot Definitions (sama dengan yang ada di media.controller.ts) ──────────

export const AD_SLOTS: Record<string, SlotConfig> = {
  leaderboard: { width: 970, height: 250, minWidth: 300, minHeight: 80 },
  rectangle: { width: 300, height: 250, minWidth: 150, minHeight: 125 },
  rectangle_secondary: { width: 300, height: 250, minWidth: 150, minHeight: 125 },
  in_feed: { width: 300, height: 250, minWidth: 150, minHeight: 125 },
}

export const AD_VARIANTS: Record<string, Record<string, SlotConfig>> = {
  leaderboard: {
    desktop: { width: 970, height: 250, minWidth: 300, minHeight: 80 },
    tablet: { width: 728, height: 90, minWidth: 250, minHeight: 40 },
    mobile: { width: 320, height: 50, minWidth: 200, minHeight: 30 },
  },
  rectangle: {
    desktop: { width: 300, height: 250, minWidth: 150, minHeight: 125 },
    mobile: { width: 300, height: 100, minWidth: 150, minHeight: 50 },
  },
  rectangle_secondary: {
    desktop: { width: 300, height: 250, minWidth: 150, minHeight: 125 },
    mobile: { width: 300, height: 100, minWidth: 150, minHeight: 50 },
  },
  in_feed: {
    desktop: { width: 300, height: 250, minWidth: 150, minHeight: 125 },
    mobile: { width: 300, height: 100, minWidth: 150, minHeight: 50 },
  },
}

// ─── Color Extraction ────────────────────────────────────────────────────────

interface ColorPalette {
  dominant: { r: number; g: number; b: number }
  secondary: { r: number; g: number; b: number }
  hex: string
  hexSecondary: string
}

/**
 * Extract dominant color palette dari gambar.
 * Menggunakan sharp stats + pixel sampling untuk akurasi.
 */
export async function extractPalette(buffer: Buffer): Promise<ColorPalette> {
  const metadata = await sharp(buffer).metadata()
  const { width, height } = metadata

  if (!width || !height) {
    return {
      dominant: { r: 45, g: 55, b: 72 },
      secondary: { r: 30, g: 40, b: 55 },
      hex: '#2d3748',
      hexSecondary: '#1e2c3b',
    }
  }

  // Resize kecil untuk analisis cepat
  const smallBuffer = await sharp(buffer)
    .resize(50, 50, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer()

  const pixels: Array<{ r: number; g: number; b: number; count: number }> = []
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>()

  // Sample setiap pixel, quantize ke kelipatan 16 untuk mengurangi noise
  for (let i = 0; i < smallBuffer.length; i += 3) {
    const r = Math.round(smallBuffer[i] / 16) * 16
    const g = Math.round(smallBuffer[i + 1] / 16) * 16
    const b = Math.round(smallBuffer[i + 2] / 16) * 16
    const key = `${r},${g},${b}`

    const existing = colorMap.get(key)
    if (existing) {
      existing.count++
    } else {
      colorMap.set(key, { r: Math.min(r, 255), g: Math.min(g, 255), b: Math.min(b, 255), count: 1 })
    }
  }

  // Sort by frequency
  const sorted = Array.from(colorMap.values()).sort((a, b) => b.count - a.count)

  // Filter out near-white and near-black (terlalu terang/gelap untuk background)
  const filtered = sorted.filter((c) => {
    const brightness = (c.r + c.g + c.b) / 3
    return brightness > 30 && brightness < 220
  })

  const palette = filtered.length > 0 ? filtered : sorted

  const dominant = palette[0] || { r: 45, g: 55, b: 72, count: 1 }
  const secondary = palette[1] || palette[0] || { r: 30, g: 40, b: 55, count: 1 }

  return {
    dominant: { r: dominant.r, g: dominant.g, b: dominant.b },
    secondary: { r: secondary.r, g: secondary.g, b: secondary.b },
    hex: rgbToHex(dominant.r, dominant.g, dominant.b),
    hexSecondary: rgbToHex(secondary.r, secondary.g, secondary.b),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// ─── Gradient Background Generation ──────────────────────────────────────────

/**
 * Generate gradient background dari palette warna.
 * Menggunakan SVG untuk kualitas sempurna.
 */
export function generateGradientSvg(
  width: number,
  height: number,
  palette: ColorPalette
): string {
  const { dominant, secondary } = palette

  // Lighten dominant untuk center (subtle highlight)
  const lighten = (c: number, amount: number) => Math.min(255, Math.round(c + amount))
  const darken = (c: number, amount: number) => Math.max(0, Math.round(c - amount))

  const centerR = lighten(dominant.r, 20)
  const centerG = lighten(dominant.g, 20)
  const centerB = lighten(dominant.b, 20)

  const edgeR = darken(secondary.r, 15)
  const edgeG = darken(secondary.g, 15)
  const edgeB = darken(secondary.b, 15)

  // Radial gradient: terang di tengah, gelap di pinggir
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" style="stop-color:rgb(${centerR},${centerG},${centerB});stop-opacity:1"/>
        <stop offset="100%" style="stop-color:rgb(${edgeR},${edgeG},${edgeB});stop-opacity:1"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
  </svg>`
}

// ─── Smart Image Processing ──────────────────────────────────────────────────

const MAX_FILE_SIZE = 200 * 1024 // 200 KB
const ASPECT_RATIO_TOLERANCE = 0.15 // 15%

// ─── Fase 0: Upload Tracking (Data Collection) ──────────────────────────────
// Kumpulkan data 2-4 minggu untuk keputusan Fase 1 (AI Upscale)
// Log ke console → PM2 capture di logs/

interface UploadMetrics {
  timestamp: string
  originalWidth: number
  originalHeight: number
  targetSlot: string
  targetWidth: number
  targetHeight: number
  needsUpscale: boolean
  ratioGapPercent: number
  method: string
  outputSizeKB: number
  dominantColor: string
  processingTimeMs: number
}

function logUploadMetrics(metrics: UploadMetrics): void {
  // Structured JSON log — mudah di-parse untuk analisis nanti
  console.log(JSON.stringify({
    _type: 'ad_upload_metrics',
    ...metrics,
  }))
}

/**
 * Proses gambar iklan dengan smart approach:
 * 1. Jika rasio cocok → smart crop (cover)
 * 2. Jika rasio beda → palette gradient background + contain
 *
 * Tidak ada blur. Tidak ada penolakan gambar kecil.
 */
export async function processAdSmart(
  buffer: Buffer,
  targetW: number,
  targetH: number,
  slotName: string = 'unknown'
): Promise<ProcessResult> {
  const startTime = Date.now()

  // Get original dimensions
  const origMeta = await sharp(buffer).metadata()
  const origW = origMeta.width || 0
  const origH = origMeta.height || 0

  if (origW === 0 || origH === 0) {
    throw new Error('Gambar tidak memiliki dimensi yang valid')
  }

  // Extract palette
  const palette = await extractPalette(buffer)

  // Check aspect ratio
  const targetRatio = targetW / targetH
  const origRatio = origW / origH
  const ratioDiff = Math.abs(origRatio - targetRatio) / targetRatio

  // Fase 0: Check apakah gambar perlu upscale (data collection)
  const needsUpscale = origW < targetW || origH < targetH

  let result: Buffer
  let method: 'palette_gradient' | 'smart_crop'

  if (ratioDiff <= ASPECT_RATIO_TOLERANCE) {
    // Rasio cocok → smart crop langsung
    result = await sharp(buffer)
      .resize(targetW, targetH, { fit: 'cover', position: 'attention' })
      .webp({ quality: 80 })
      .toBuffer()
    method = 'smart_crop'
  } else {
    // Rasio beda → palette gradient background + contain
    result = await createPaletteBanner(buffer, targetW, targetH, palette)
    method = 'palette_gradient'
  }

  // Compress sampai di bawah batas
  let quality = 80
  while (result.length > MAX_FILE_SIZE && quality > 30) {
    quality -= 10
    if (method === 'smart_crop') {
      result = await sharp(buffer)
        .resize(targetW, targetH, { fit: 'cover', position: 'attention' })
        .webp({ quality })
        .toBuffer()
    } else {
      result = await createPaletteBanner(buffer, targetW, targetH, palette, quality)
    }
  }

  const meta = await sharp(result).metadata()
  const processingTimeMs = Date.now() - startTime

  // Fase 0: Log metrics untuk data collection
  logUploadMetrics({
    timestamp: new Date().toISOString(),
    originalWidth: origW,
    originalHeight: origH,
    targetSlot: slotName,
    targetWidth: targetW,
    targetHeight: targetH,
    needsUpscale,
    ratioGapPercent: Math.round(ratioDiff * 100),
    method,
    outputSizeKB: Math.round(result.length / 1024),
    dominantColor: palette.hex,
    processingTimeMs,
  })

  return {
    buffer: result,
    width: meta.width || targetW,
    height: meta.height || targetH,
    method,
    dominantColor: palette.hex,
  }
}

/**
 * Create banner dengan palette gradient background.
 * Gambar di-resize proporsional dan di-center di atas gradient.
 */
async function createPaletteBanner(
  buffer: Buffer,
  targetW: number,
  targetH: number,
  palette: ColorPalette,
  quality: number = 80
): Promise<Buffer> {
  // Generate gradient background SVG
  const gradientSvg = generateGradientSvg(targetW, targetH, palette)
  const gradientBuffer = Buffer.from(gradientSvg)

  // Resize gambar dengan contain (proporsional, ada ruang di sisi)
  // Padding 5% dari sisi terkecil untuk memberi "napas"
  const paddingX = Math.round(Math.min(targetW, targetH) * 0.05)
  const paddingY = Math.round(Math.min(targetW, targetH) * 0.05)
  const innerW = targetW - paddingX * 2
  const innerH = targetH - paddingY * 2

  const foreground = await sharp(buffer)
    .resize(innerW, innerH, {
      fit: 'contain',
      position: 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()

  // Composite: gradient background + gambar di tengah
  const result = await sharp(gradientBuffer)
    .resize(targetW, targetH)
    .composite([
      {
        input: foreground,
        gravity: 'center',
      },
    ])
    .webp({ quality })
    .toBuffer()

  return result
}

// ─── Multi-Size Processing ───────────────────────────────────────────────────

/**
 * Proses 1 gambar menjadi semua ukuran slot yang diperlukan.
 * Ini fungsi utama yang dipanggil saat upload.
 */
export async function processForAllSlots(
  buffer: Buffer,
  targetSlot?: string
): Promise<Map<string, ProcessResult>> {
  const results = new Map<string, ProcessResult>()

  if (targetSlot && AD_VARIANTS[targetSlot]) {
    // Slot dengan multi-variant (leaderboard: desktop, tablet, mobile)
    for (const [variant, dims] of Object.entries(AD_VARIANTS[targetSlot])) {
      const result = await processAdSmart(buffer, dims.width, dims.height)
      results.set(`${targetSlot}_${variant}`, result)
    }
  } else if (targetSlot && AD_SLOTS[targetSlot]) {
    // Slot tunggal
    const dims = AD_SLOTS[targetSlot]
    const result = await processAdSmart(buffer, dims.width, dims.height)
    results.set(targetSlot, result)
  } else {
    // Semua slot
    for (const [slot, dims] of Object.entries(AD_SLOTS)) {
      if (AD_VARIANTS[slot]) {
        // Slot dengan multi-variant
        for (const [variant, vDims] of Object.entries(AD_VARIANTS[slot])) {
          const result = await processAdSmart(buffer, vDims.width, vDims.height)
          results.set(`${slot}_${variant}`, result)
        }
      } else {
        const result = await processAdSmart(buffer, dims.width, dims.height)
        results.set(slot, result)
      }
    }
  }

  return results
}

// ─── Preview Generation ──────────────────────────────────────────────────────

/**
 * Generate preview untuk semua slot.
 * Mengembalikan buffer WebP untuk setiap slot.
 */
export async function generatePreviews(
  buffer: Buffer
): Promise<PreviewResult[]> {
  const previews: PreviewResult[] = []

  for (const [slot, dims] of Object.entries(AD_SLOTS)) {
    if (AD_VARIANTS[slot]) {
      for (const [variant, vDims] of Object.entries(AD_VARIANTS[slot])) {
        const result = await processAdSmart(buffer, vDims.width, vDims.height)
        previews.push({ slot, variant, result })
      }
    } else {
      const result = await processAdSmart(buffer, dims.width, dims.height)
      previews.push({ slot, result })
    }
  }

  return previews
}

// ─── Validation (lebih lunak dari sebelumnya) ────────────────────────────────

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

/**
 * Validasi gambar untuk iklan.
 * Tidak ada batas ukuran minimum yang memblokir.
 * Hanya warning jika gambar sangat kecil.
 */
export async function validateAdImage(
  buffer: Buffer,
  slot?: string
): Promise<ValidationResult> {
  const warnings: string[] = []
  const errors: string[] = []

  // Cek format
  let meta: sharp.Metadata
  try {
    meta = await sharp(buffer).metadata()
  } catch {
    errors.push('File bukan gambar yang valid atau format tidak didukung.')
    return { valid: false, warnings, errors }
  }

  if (!meta.width || !meta.height) {
    errors.push('Gambar tidak memiliki dimensi yang valid.')
    return { valid: false, warnings, errors }
  }

  // Cek format yang didukung
  const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'tiff']
  if (meta.format && !supportedFormats.includes(meta.format)) {
    errors.push(`Format ${meta.format} tidak didukung. Gunakan JPG, PNG, atau WebP.`)
    return { valid: false, warnings, errors }
  }

  // Warning (bukan error) jika gambar kecil
  if (slot && AD_SLOTS[slot]) {
    const slotDims = AD_SLOTS[slot]
    if (meta.width < slotDims.minWidth || meta.height < slotDims.minHeight) {
      warnings.push(
        `Gambar Anda (${meta.width}×${meta.height}px) lebih kecil dari rekomendasi ` +
        `(${slotDims.minWidth}×${slotDims.minHeight}px). Sistem akan meng-upscale, ` +
        `namun hasilnya mungkin sedikit blur pada layar besar.`
      )
    }
  }

  // Warning jika rasio sangat berbeda
  if (slot && AD_SLOTS[slot]) {
    const targetRatio = AD_SLOTS[slot].width / AD_SLOTS[slot].height
    const origRatio = meta.width / meta.height
    const ratioDiff = Math.abs(origRatio - targetRatio) / targetRatio

    if (ratioDiff > 0.5) {
      warnings.push(
        `Rasio gambar Anda sangat berbeda dengan slot ${slot}. ` +
        `Sistem akan menambahkan background gradient dari warna dominan gambar Anda.`
      )
    }
  }

  return { valid: true, warnings, errors }
}
