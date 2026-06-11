import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('📊 Querying database Media table state...')
  
  const total = await prisma.media.count()
  const withBlur = await prisma.media.count({
    where: {
      NOT: {
        blurHash: null
      }
    }
  })
  const withoutBlur = await prisma.media.count({
    where: {
      blurHash: null
    }
  })

  console.log('---------------------------------------------')
  console.log(`📈 Total Media di Database : ${total}`)
  console.log(`✨ Memiliki BlurHash        : ${withBlur}`)
  console.log(`❌ Tanpa BlurHash           : ${withoutBlur}`)
  console.log('---------------------------------------------')

  if (total > 0) {
    const samples = await prisma.media.findMany({
      take: 3,
      select: {
        id: true,
        url: true,
        blurHash: true
      }
    })
    console.log('🔍 Contoh Data Media (Maks 3):')
    console.log(JSON.stringify(samples, null, 2))
  } else {
    console.log('⚠️ Database Media kosong! Apakah database ter-reset?')
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
