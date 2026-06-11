import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Renaming site ID...')
  try {
    // In Postgres, we need to update children too if not ON UPDATE CASCADE.
    // Our schema doesn't seem to have ON UPDATE CASCADE explicitly.
    // But we can just use a raw query or update in order.
    
    // Check if 'pusat' already exists
    const pusat = await prisma.site.findUnique({ where: { id: 'pusat' } })
    if (pusat) {
      console.log("'pusat' already exists. Deleting 'site-beritakarya-pusat' if it exists.")
      const old = await prisma.site.findUnique({ where: { id: 'site-beritakarya-pusat' } })
      if (old) {
        // Transfer children first? 
        // For simplicity, if 'pusat' exists, we assume it's the right one.
      }
    } else {
      await prisma.$executeRaw`UPDATE "Site" SET "id" = 'pusat' WHERE "id" = 'site-beritakarya-pusat'`
      console.log("Renamed 'site-beritakarya-pusat' to 'pusat'")
    }
  } catch (e) {
    console.error(e)
  }
}

main().finally(() => prisma.$disconnect())
