/**
 * Debug script — jalankan di CT102 untuk test watermark secara langsung
 * Usage: node scripts/debug-watermark.js
 */
const path = require('path')
const fs = require('fs').promises

async function main() {
  console.log('=== WATERMARK DEBUG SCRIPT ===\n')

  // 1. Cek path asset
  const watermarkPath = path.join(__dirname, '..', 'dist', 'assets', 'watermarks', 'editorial.png')
  console.log('1. Watermark path:', watermarkPath)

  try {
    await fs.access(watermarkPath)
    const stat = await fs.stat(watermarkPath)
    console.log('   ✅ File exists, size:', stat.size, 'bytes')
  } catch {
    console.log('   ❌ File NOT found!')
    return
  }

  // 2. Cek sharp
  let sharp
  try {
    sharp = (await import('sharp')).default
    console.log('2. ✅ Sharp loaded')
  } catch (err) {
    console.log('2. ❌ Sharp not available:', err.message)
    return
  }

  // 3. Cek watermark metadata
  const wmMeta = await sharp(watermarkPath).metadata()
  console.log('3. Watermark metadata:', JSON.stringify(wmMeta, null, 2))

  // 4. Buat test image 800x600 warna abu-abu
  console.log('\n4. Creating test image (800x600 grey)...')
  const testImage = await sharp({
    create: { width: 800, height: 600, channels: 4, background: { r: 128, g: 128, b: 128, alpha: 1 } }
  }).png().toBuffer()

  // 5. Resize watermark
  const targetW = Math.min(300, Math.max(100, Math.floor(800 * 0.12)))
  console.log('5. Target watermark width:', targetW, 'px')

  const resizedWatermark = await sharp(watermarkPath)
    .resize(targetW)
    .toBuffer()

  const resizedMeta = await sharp(resizedWatermark).metadata()
  console.log('   Resized watermark:', resizedMeta.width, 'x', resizedMeta.height)

  // 6. Composite dengan opsi yang SAMA seperti kode production
  console.log('\n6. Compositing with: gravity=southeast, left=0, top=-40...')
  const result = await sharp(testImage)
    .composite([{
      input: resizedWatermark,
      gravity: 'southeast',
      left: 0,
      top: -40,
      blend: 'over',
    }])
    .png()
    .toFile(path.join(__dirname, '..', 'debug-watermark-result.png'))

  console.log('   ✅ Result saved to: apps/api/debug-watermark-result.png')

  // 7. Composite TANPA left/top (kode lama yang WORKING)
  console.log('\n7. Compositing with: gravity=southeast only (old working code)...')
  await sharp(testImage)
    .composite([{
      input: resizedWatermark,
      gravity: 'southeast',
      blend: 'over',
    }])
    .png()
    .toFile(path.join(__dirname, '..', 'debug-watermark-result-nolefttop.png'))

  console.log('   ✅ Result saved to: apps/api/debug-watermark-result-nolefttop.png')

  console.log('\n=== DONE — Download kedua file PNG dan bandingkan ===')
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
