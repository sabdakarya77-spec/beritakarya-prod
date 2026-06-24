const sharp = require('../apps/api/node_modules/sharp')
const path = require('path')
const fs = require('fs').promises

const FONT_PATH = path.join(__dirname, '..', 'apps', 'api', 'src', 'assets', 'fonts', 'Inter-Bold.ttf')
const OUT_DIR = path.join(__dirname, '..', 'apps', 'api', 'src', 'assets', 'watermarks')

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  console.log('Generating watermarks in:', OUT_DIR)

  // 1. Generate editorial.png
  // "© BERITAKARYA.co" - Semi-transparent white
  // We render a transparent image containing the text
  // Then add transparent padding at bottom so text doesn't get cut off at image edge
  const editorialText = `<span foreground="#ffffffaa">© BERITAKARYA.co</span>`
  const editorialTextBuffer = await sharp({
    text: {
      text: editorialText,
      font: 'Inter Bold',
      fontfile: FONT_PATH,
      rgba: true,
      dpi: 96,
    }
  })
  .png()
  .toBuffer()

  const editorialMeta = await sharp(editorialTextBuffer).metadata()
  const editorialPadding = 40 // transparent padding below text (pushes text up from bottom edge)
  await sharp({
    create: {
      width: editorialMeta.width || 155,
      height: (editorialMeta.height || 12) + editorialPadding,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: editorialTextBuffer,
    gravity: 'north',
  }])
  .png()
  .toFile(path.join(OUT_DIR, 'editorial.png'))
  console.log('- Generated editorial.png (with bottom padding)')

  // 2. Generate kyc-tile.png
  // A tile containing "HANYA UNTUK VERIFIKASI BERITAKARYA" rotated -30 degrees
  // We first render the text, then rotate it, then save it
  const kycText = `<span foreground="#b41c1c66">HANYA UNTUK VERIFIKASI BERITAKARYA</span>`
  const textBuffer = await sharp({
    text: {
      text: kycText,
      font: 'Inter Bold',
      fontfile: FONT_PATH,
      rgba: true,
      dpi: 96,
    }
  })
  .png()
  .toBuffer()

  // Rotate and pad the text to create a tile (e.g., 450x220px)
  await sharp({
    create: {
      width: 450,
      height: 220,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: textBuffer,
    gravity: 'center',
  }])
  .rotate(-30, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(path.join(OUT_DIR, 'kyc-tile.png'))
  console.log('- Generated kyc-tile.png')

  // 3. Generate kyc-stamp.png
  // A red banner (2400px wide, 45px high) with centered text:
  // "BERITAKARYA · RAHASIA · HANYA UNTUK VERIFIKASI"
  // First, generate the text buffer
  const stampText = `<span foreground="#ffffff" letter_spacing="1024">BERITAKARYA  ·  RAHASIA  ·  HANYA UNTUK VERIFIKASI</span>`
  const stampTextBuffer = await sharp({
    text: {
      text: stampText,
      font: 'Inter Bold',
      fontfile: FONT_PATH,
      rgba: true,
      dpi: 96,
    }
  })
  .png()
  .toBuffer()

  // Generate a solid red background banner, then composite the text over it
  const bannerW = 2400
  const bannerH = 45
  await sharp({
    create: {
      width: bannerW,
      height: bannerH,
      channels: 4,
      background: { r: 180, g: 28, b: 28, alpha: 0.95 }
    }
  })
  .composite([
    {
      input: stampTextBuffer,
      gravity: 'center',
      blend: 'over'
    }
  ])
  .png()
  .toFile(path.join(OUT_DIR, 'kyc-stamp.png'))
  console.log('- Generated kyc-stamp.png')

  console.log('All watermark assets generated successfully!')
}

main().catch(err => {
  console.error('Failed to generate watermarks:', err)
  process.exit(1)
})
