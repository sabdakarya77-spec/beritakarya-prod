import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting S-Tier BlurHash backfill script...')

  const medias = await prisma.media.findMany({
    where: {
      blurHash: null
    }
  })

  console.log(`Found ${medias.length} images without blurHash.`)

  let success = 0
  let failed = 0
  let propagated = 0

  for (const media of medias) {
    try {
      // media.url usually starts with /uploads/
      // Example: /uploads/cover.webp -> C:\...\apps\api\uploads\cover.webp
      let localPath = ''
      if (media.url.includes('/uploads/')) {
        const parts = media.url.split('/uploads/')
        const filename = parts[parts.length - 1]
        localPath = path.join(process.cwd(), 'uploads', filename)
      } else {
        console.log(`⚠️ Skipping external or invalid URL: ${media.url}`)
        failed++
        continue
      }

      if (!fs.existsSync(localPath)) {
        console.log(`❌ File not found locally: ${localPath}`)
        failed++
        continue
      }

      // Read physical file and generate 10x10 WebP Blur Hash
      const buffer = fs.readFileSync(localPath)
      const blurBuffer = await sharp(buffer)
        .resize(10, 10, { fit: 'inside' })
        .webp({ quality: 20 })
        .toBuffer()
      
      const blurHash = `data:image/webp;base64,${blurBuffer.toString('base64')}`

      // Save back to Media table
      await prisma.media.update({
        where: { id: media.id },
        data: { blurHash }
      })

      // [S-Tier] Propagate newly generated blurHash to Articles!
      const updateRes = await prisma.article.updateMany({
        where: { featuredImage: media.url },
        data: { featuredImageBlur: blurHash }
      })

      propagated += updateRes.count
      success++
      console.log(`✅ [${success}/${medias.length}] Processed ${media.url} (Propagated to ${updateRes.count} articles)`)
    } catch (err: any) {
      console.error(`❌ Error processing ${media.url}:`, err.message)
      failed++
    }
  }

  console.log('\n=============================================')
  console.log('🎉 Backfill Operation Completed!')
  console.log(`✅ Success    : ${success}`)
  console.log(`🔗 Propagated : ${propagated} articles updated`)
  console.log(`❌ Failed     : ${failed}`)
  console.log('=============================================')
}

main()
  .catch(e => {
    console.error('Fatal Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
