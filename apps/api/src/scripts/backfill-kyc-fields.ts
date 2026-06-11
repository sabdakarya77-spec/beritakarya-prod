import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting KYC fields backfill...')

  // 1. Update all existing users to have default KYC values if they are null
  const result = await prisma.user.updateMany({
    where: {
      isVerified: { equals: undefined } // This is just to show intent, in Prisma it will use defaults
    },
    data: {
      isVerified: false,
      kycNotes: null,
    }
  })

  console.log(`✅ Updated ${result.count} users with default KYC status.`)

  // 2. Optional: Mark some trusted legacy users as verified automatically
  // const trustedEmails = ['admin@beritakarya.co.id']
  // await prisma.user.updateMany({
  //   where: { email: { in: trustedEmails } },
  //   data: { isVerified: true, role: 'reporter' }
  // })

  console.log('✨ Backfill completed successfully.')
}

main()
  .catch((e) => {
    console.error('❌ Error during backfill:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
