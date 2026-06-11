import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Migrating existing users to new kycStatus enum...')

  // 1. Mark as APPROVED if isVerified is true
  const approved = await prisma.user.updateMany({
    where: { isVerified: true },
    data: { kycStatus: 'APPROVED' }
  })
  console.log(`✅ ${approved.count} users set to APPROVED`)

  // 2. Mark as REJECTED if kycNotes contains 'REJECTED'
  const rejected = await prisma.user.updateMany({
    where: { 
      isVerified: false,
      kycNotes: { contains: 'REJECTED' }
    },
    data: { kycStatus: 'REJECTED' }
  })
  console.log(`✅ ${rejected.count} users set to REJECTED`)

  // 3. Mark as PENDING if kycSubmittedAt is not null but not verified or rejected
  const pending = await prisma.user.updateMany({
    where: {
      isVerified: false,
      kycSubmittedAt: { not: null },
      kycStatus: 'UNSUBMITTED' // Only if not already set by rejected logic
    },
    data: { kycStatus: 'PENDING' }
  })
  console.log(`✅ ${pending.count} users set to PENDING`)

  console.log('✨ KYC status migration completed.')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
