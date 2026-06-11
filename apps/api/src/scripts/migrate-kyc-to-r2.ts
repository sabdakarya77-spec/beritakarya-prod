import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { StorageService } from '../services/storage.service'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting KYC migration to Cloudflare R2...')

  // 1. Get all users who have local KYC files
  // We assume local paths don't start with 'kyc/' (which is the S3 prefix)
  // or don't have a URL structure.
  const usersWithLocalFiles = await prisma.user.findMany({
    where: {
      OR: [
        { AND: [{ idCardPath: { not: null } }, { NOT: { idCardPath: { startsWith: 'kyc/' } } }] },
        { AND: [{ familyCardPath: { not: null } }, { NOT: { familyCardPath: { startsWith: 'kyc/' } } }] }
      ]
    }
  })

  console.log(`Found ${usersWithLocalFiles.length} users with local files to migrate.`)

  let successCount = 0
  let failCount = 0

  for (const user of usersWithLocalFiles) {
    console.log(`Processing user: ${user.name} (${user.id})...`)
    
    let idCardKey = user.idCardPath
    let familyCardKey = user.familyCardPath

    try {
      // Migrate ID Card
      if (user.idCardPath && !user.idCardPath.startsWith('kyc/')) {
        const localPath = user.idCardPath
        if (await fileExists(localPath)) {
          const fileName = path.basename(localPath)
          const remoteKey = `kyc/${user.id}/${fileName}`
          
          console.log(`  Uploading ID Card: ${fileName} -> ${remoteKey}`)
          await StorageService.uploadFile(localPath, remoteKey, 'image/jpeg')
          idCardKey = remoteKey
        } else {
          console.warn(`  ⚠️ ID Card file not found locally: ${localPath}`)
        }
      }

      // Migrate Family Card
      if (user.familyCardPath && !user.familyCardPath.startsWith('kyc/')) {
        const localPath = user.familyCardPath
        if (await fileExists(localPath)) {
          const fileName = path.basename(localPath)
          const remoteKey = `kyc/${user.id}/${fileName}`
          
          console.log(`  Uploading Family Card: ${fileName} -> ${remoteKey}`)
          await StorageService.uploadFile(localPath, remoteKey, 'image/jpeg')
          familyCardKey = remoteKey
        } else {
          console.warn(`  ⚠️ Family Card file not found locally: ${localPath}`)
        }
      }

      // Update Database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          idCardPath: idCardKey,
          familyCardPath: familyCardKey
        }
      })

      successCount++
      console.log(`  ✅ Successfully migrated user ${user.id}`)
    } catch (error) {
      failCount++
      console.error(`  ❌ Failed to migrate user ${user.id}:`, error)
    }
  }

  console.log('\n--- Migration Summary ---')
  console.log(`Total processed: ${usersWithLocalFiles.length}`)
  console.log(`Success: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log('-------------------------\n')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

main()
  .catch((e) => {
    console.error('❌ Migration script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
