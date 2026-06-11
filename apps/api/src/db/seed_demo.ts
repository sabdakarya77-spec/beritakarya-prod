import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { CATEGORY_TREE_CONFIG } from '@beritakarya/config'


const prisma = new PrismaClient()

async function main() {
  console.log('Starting Investigative Demo seed...')

  // 1. Setup Sites
  const siteConfigs = [
    { id: 'pusat', name: 'BeritaKarya Pusat', domain: 'beritakarya.co' },
    { id: 'bandung', name: 'BeritaKarya Bandung', domain: 'bandung.beritakarya.co' },
    { id: 'surabaya', name: 'BeritaKarya Surabaya', domain: 'surabaya.beritakarya.co' }
  ]

  const siteIdMap: Record<string, string> = { pusat: 'pusat', bandung: 'bandung', surabaya: 'surabaya' }

  for (const conf of siteConfigs) {
    const existing = await prisma.site.findUnique({ where: { domain: conf.domain } })
    if (existing) {
      siteIdMap[conf.id] = existing.id
      await prisma.site.update({ where: { id: existing.id }, data: { name: conf.name } })
    } else {
      const created = await prisma.site.create({ data: conf })
      siteIdMap[conf.id] = created.id
    }
  }

  const PUSAT_ID = siteIdMap['pusat']
  const hash = await bcrypt.hash('Admin123!', 10)
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@beritakarya.co' },
    update: {},
    create: { email: 'superadmin@beritakarya.co', name: 'Redaksi', role: 'superadmin', siteId: null, passwordHash: hash }
  })

  // 2. Categories (Parents & Children) dari CATEGORY_TREE_CONFIG
  const catMap: Record<string, string> = {}
  let order = 1

  for (const cat of CATEGORY_TREE_CONFIG) {
    const parent = await prisma.category.upsert({
      where: { slug_siteId: { slug: cat.slug, siteId: PUSAT_ID } },
      update: { name: cat.name, slug: cat.slug, order, parentId: null },
      create: { name: cat.name, slug: cat.slug, siteId: PUSAT_ID, isGlobal: false, order }
    })
    catMap[cat.slug] = parent.id

    let subOrder = 1
    for (const sub of cat.subCategories ?? []) {
      const child = await prisma.category.upsert({
        where: { slug_siteId: { slug: sub.slug, siteId: PUSAT_ID } },
        update: { name: sub.name, slug: sub.slug, parentId: parent.id, order: subOrder },
        create: { name: sub.name, slug: sub.slug, siteId: PUSAT_ID, isGlobal: false, parentId: parent.id, order: subOrder }
      })
      catMap[sub.slug] = child.id

      let subSubOrder = 1
      for (const subsub of sub.subCategories ?? []) {
        const grandchild = await prisma.category.upsert({
          where: { slug_siteId: { slug: subsub.slug, siteId: PUSAT_ID } },
          update: { name: subsub.name, slug: subsub.slug, parentId: child.id, order: subSubOrder },
          create: { name: subsub.name, slug: subsub.slug, siteId: PUSAT_ID, isGlobal: false, parentId: child.id, order: subSubOrder }
        })
        catMap[subsub.slug] = grandchild.id
        subSubOrder++
      }
      subOrder++
    }
    order++
  }

  // 3. Investigative Articles (from User Screenshot)
  const investigativeArticles = [
    {
      title: 'Tanah Galian C dan Bayang-Bayang Ekologi Nusantara: Investigasi Praktik di Kawasan Industri',
      slug: 'investigasi-galian-c-nusantara',
      cat: 'daerah',
      img: 'https://images.unsplash.com/photo-1541872703-74c5e443d1f5?q=80&w=1200&auto=format&fit=crop',
      summary: 'Dugaan aktivitas tanpa izin di PT Bahagia Steel menyoroti celah pengawasan yang membahayakan kelestarian alam dan kewajiban hukum yang sering kali terabaikan dalam geliat industri.'
    },
    {
      title: 'Kartini Modern dalam Pusaran Hukum: Noveriana dan Tantangan Keadilan Gender',
      slug: 'kartini-modern-pusaran-hukum',
      cat: 'hukum-keadilan',
      img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
      summary: 'Bagaimana perempuan mengawal hukum di tengah struktur patriarki yang masih mengakar kuat di institusi peradilan kita.'
    },
    {
      title: 'Paradoks Energi: Bahlil dan Ultimatum Penimbunan BBM Subsidi',
      slug: 'paradoks-energi-bahlil-bbm',
      cat: 'ekonomi',
      img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
      summary: 'Pemerintah memperketat pengawasan distribusi energi untuk memastikan rakyat kecil mendapatkan haknya.'
    },
    {
      title: 'Lonjakan Perceraian dan Rapuhnya Ketahanan Keluarga di Tulungagung',
      slug: 'lonjakan-perceraian-tulungagung',
      cat: 'nasional',
      img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
      summary: 'Fenomena sosial yang mengkhawatirkan menuntut peran lebih dari sekadar seremonial organisasi kemasyarakatan.'
    },
    {
      title: 'Polsek Menganti: Humanisme di Tengah Ketegangan Massa',
      slug: 'polsek-menganti-humanisme',
      cat: 'politik',
      img: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1200&auto=format&fit=crop',
      summary: 'Pendekatan preventif yang dilakukan kepolisian berhasil meredam potensi konflik antar wilayah.'
    },
    {
      title: 'Masa Depan AI dalam Jurnalisme Lokal Indonesia',
      slug: 'masa-depan-ai-jurnalisme-lokal',
      cat: 'teknologi',
      img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
      summary: 'Bagaimana teknologi terbaru membantu portal berita independen bersaing dengan raksasa media global.'
    }
  ]

  for (const art of investigativeArticles) {
    await prisma.article.upsert({
      where: { siteId_slug: { siteId: PUSAT_ID, slug: art.slug } },
      update: {},
      create: {
        title: art.title,
        slug: art.slug,
        siteId: PUSAT_ID,
        categoryId: catMap[art.cat],
        authorId: user.id,
        status: 'published',
        publishedAt: new Date(),
        blocks: [
          { type: 'image', url: art.img, caption: art.title },
          { type: 'paragraph', content: art.summary },
          { type: 'paragraph', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
        ]
      }
    })
  }

  console.log('Investigative Demo seed completed successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
