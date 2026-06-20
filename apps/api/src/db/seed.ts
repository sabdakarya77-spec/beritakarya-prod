import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { CATEGORY_TREE_CONFIG } from '@beritakarya/config'

const prisma = new PrismaClient()

async function main() {
  // 1. Seed Site 'pusat'
  await prisma.site.upsert({
    where: { id: 'pusat' },
    update: {
      trendingTopics: ['Nasional', 'Politik', 'Ekonomi', 'Teknologi', 'Daerah', 'Hukum']
    },
    create: {
      id: 'pusat',
      name: 'BeritaKarya Pusat',
      domain: 'beritakarya.co',
      description: 'Portal berita independen menyajikan analisis tajam, investigasi mendalam, dan informasi tepercaya dari seluruh pelosok Indonesia.',
      footerText: '© 2026 BERITA KARYA. ALL RIGHTS RESERVED.',
      trendingTopics: ['Nasional', 'Politik', 'Ekonomi', 'Teknologi', 'Daerah', 'Hukum']
    }
  })

  console.log('Site pusat upserted.')

  // 2. Seed Superadmin User (credentials from env vars — never hardcode)
  const seedEmail = process.env.SEED_ADMIN_EMAIL
  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  if (!seedEmail || !seedPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in environment')
  }
  const hash = await bcrypt.hash(seedPassword, 12)
  const superadmin = await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      passwordHash: hash
    },
    create: {
      email: seedEmail,
      name: 'Superadmin',
      role: 'superadmin',
      siteId: null,
      passwordHash: hash,
      isVerified: true
    }
  })

  console.log('Superadmin user upserted:', superadmin.name)

  // 3. Seed Global Categories dari CATEGORY_TREE_CONFIG (Single Source of Truth)
  //    Kategori global: siteId = null, isGlobal = true.
  //    Helper upsertGlobalCategory menghindari Prisma type issue dengan null di compound unique.
  const categoriesMap: Record<string, string> = {}

  async function upsertGlobalCategory(data: {
    slug: string; name: string; parentId: string | null; order: number
  }) {
    const existing = await prisma.category.findFirst({
      where: { slug: data.slug, isGlobal: true, deletedAt: null }
    })
    if (existing) {
      const needsUpdate = existing.name !== data.name || existing.order !== data.order || existing.parentId !== data.parentId
      if (needsUpdate) {
        return prisma.category.update({
          where: { id: existing.id },
          data: { name: data.name, order: data.order, parentId: data.parentId }
        })
      }
      return existing
    }
    return prisma.category.create({
      data: { name: data.name, slug: data.slug, isGlobal: true, siteId: null, parentId: data.parentId, order: data.order }
    })
  }

  let order = 1
  for (const cat of CATEGORY_TREE_CONFIG) {
    const parent = await upsertGlobalCategory({ slug: cat.slug, name: cat.name, parentId: null, order: order++ })
    categoriesMap[cat.slug] = parent.id

    let subOrder = 1
    for (const sub of cat.subCategories ?? []) {
      const child = await upsertGlobalCategory({ slug: sub.slug, name: sub.name, parentId: parent.id, order: subOrder++ })
      categoriesMap[sub.slug] = child.id

      let subSubOrder = 1
      for (const subsub of sub.subCategories ?? []) {
        const grandchild = await upsertGlobalCategory({ slug: subsub.slug, name: subsub.name, parentId: child.id, order: subSubOrder++ })
        categoriesMap[subsub.slug] = grandchild.id
      }
    }
  }

  console.log('Global categories seeded from @beritakarya/config:', Object.keys(categoriesMap).length, 'categories')

  // 4. Skip seeding mock articles
  console.log('Seed selesai. Gunakan akun superadmin untuk membuat user lainnya.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
