const fs = require('fs').promises
const path = require('path')

async function main() {
  const srcDir = path.join(__dirname, '..', 'src', 'assets')
  const destDir = path.join(__dirname, '..', 'dist', 'assets')

  try {
    await fs.mkdir(destDir, { recursive: true })
    await fs.cp(srcDir, destDir, { recursive: true, force: true })
    console.log(`[copy-assets] Successfully copied ${srcDir} to ${destDir}`)
  } catch (err) {
    console.error('[copy-assets] Failed to copy assets:', err)
    process.exit(1)
  }
}

main()
