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

  // 3. Seed Categories dari CATEGORY_TREE_CONFIG (Single Source of Truth)
  const categoriesMap: Record<string, string> = {}
  let order = 1

  for (const cat of CATEGORY_TREE_CONFIG) {
    const parent = await prisma.category.upsert({
      where: { id: cat.slug },
      update: { name: cat.name, slug: cat.slug, order, parentId: null },
      create: { id: cat.slug, name: cat.name, slug: cat.slug, isGlobal: true, order }
    })
    categoriesMap[cat.slug] = parent.id

    let subOrder = 1
    for (const sub of cat.subCategories ?? []) {
      const child = await prisma.category.upsert({
        where: { id: sub.slug },
        update: { name: sub.name, slug: sub.slug, parentId: parent.id, order: subOrder },
        create: { id: sub.slug, name: sub.name, slug: sub.slug, isGlobal: true, parentId: parent.id, order: subOrder }
      })
      categoriesMap[sub.slug] = child.id

      let subSubOrder = 1
      for (const subsub of sub.subCategories ?? []) {
        const grandchild = await prisma.category.upsert({
          where: { id: subsub.slug },
          update: { name: subsub.name, slug: subsub.slug, parentId: child.id, order: subSubOrder },
          create: { id: subsub.slug, name: subsub.name, slug: subsub.slug, isGlobal: true, parentId: child.id, order: subSubOrder }
        })
        categoriesMap[subsub.slug] = grandchild.id
        subSubOrder++
      }
      subOrder++
    }
    order++
  }

  console.log('Categories seeded from @beritakarya/config:', Object.keys(categoriesMap))

  // 4. Clean existing mock articles (to avoid duplication on repeated seed runs)
  await prisma.article.deleteMany({
    where: {
      siteId: 'pusat'
    }
  })

  // 5. Seed Mock Articles
  const mockArticles = [
    {
      title: 'Sri Mulyani Umumkan Arah Kebijakan Fiskal 2027: Fokus Pertumbuhan Berkelanjutan',
      slug: 'sri-mulyani-kebijakan-fiskal-2027',
      categoryId: categoriesMap['ekonomi'],
      featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#0a101f',
      excerpt: 'Menteri Keuangan memaparkan strategi fiskal jangka panjang guna menekan defisit anggaran di bawah 2% serta mendorong efisiensi belanja daerah.',
      isBreaking: true,
      isFeatured: true,
      tags: ['Sri Mulyani', 'Fiskal 2027', 'Ekonomi', 'Kemenkeu']
    },
    {
      title: 'DPR Sahkan RUU Perlindungan Data Pribadi Hasil Amandemen Terbaru Era Digital',
      slug: 'dpr-sahkan-ruu-perlindungan-data-pribadi',
      categoryId: categoriesMap['politik'],
      featuredImage: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#170c2a',
      excerpt: 'Sidang Paripurna DPR resmi mengetok palu pengesahan regulasi ketat terkait kewajiban korporasi menjaga kedaulatan data pengguna digital.',
      isBreaking: false,
      isExclusive: true,
      tags: ['DPR RI', 'Data Pribadi', 'Digital', 'Undang-Undang']
    },
    {
      title: 'Teknologi AI Generatif Mulai Diterapkan Secara Luas di Sektor Pendidikan Publik',
      slug: 'teknologi-ai-generatif-pendidikan-publik',
      categoryId: categoriesMap['teknologi'],
      featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#051b2c',
      excerpt: 'Kementerian Pendidikan bekerja sama dengan konsorsium teknologi nasional meluncurkan asisten guru pintar berbasis AI di 1.000 sekolah percontohan.',
      isBreaking: false,
      isFeatured: true,
      tags: ['Kecerdasan Buatan', 'Sekolah Pintar', 'Pendidikan', 'EdTech']
    },
    {
      title: 'Festival Budaya Nusantara 2026 Menarik Ratusan Ribu Wisatawan Asing di Bali',
      slug: 'festival-budaya-nusantara-2026-bali',
      categoryId: categoriesMap['daerah'],
      featuredImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#2b1a03',
      excerpt: 'Pagelaran tari kolosal dan pameran ekonomi kreatif dari 38 provinsi sukses menghidupkan kembali denyut pariwisata premium lokal.',
      isBreaking: false,
      isFeatured: false,
      tags: ['Karnaval Budaya', 'Pariwisata', 'Pesona Indonesia', 'Bali']
    },
    {
      title: 'KPK Usut Dugaan Korupsi Pengadaan Infrastruktur Jalan Lintas Sumatera Timur',
      slug: 'kpk-usut-dugaan-korupsi-jalan-sumatera',
      categoryId: categoriesMap['hukum-keadilan'],
      featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#1a1d20',
      excerpt: 'Penyidik mulai menggeledah sejumlah kantor dinas pekerjaan umum menyusul laporan kerugian negara yang ditaksir mencapai ratusan miliar rupiah.',
      isBreaking: true,
      isExclusive: true,
      tags: ['Korupsi', 'KPK RI', 'Infrastruktur', 'Sumatera']
    },
    {
      title: 'Pemerintah Targetkan Swasembada Pangan Melalui Food Estate Modern Kalimantan',
      slug: 'pemerintah-targetkan-swasembada-pangan-kalimantan',
      categoryId: categoriesMap['nasional'],
      featuredImage: 'https://images.unsplash.com/photo-1501973900372-7c8948227383?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#0a2212',
      excerpt: 'Langkah taktis penanaman komoditas padi hibrida berskala besar di lahan gambut terkelola mendapat respons positif dari kalangan petani daerah.',
      isBreaking: false,
      isFeatured: false,
      tags: ['Pangan', 'Food Estate', 'Swasembada', 'Kalimantan']
    },
    {
      title: 'Laju Inflasi Triwulan Pertama Terkendali Berkat Stabilisasi Pasokan Pangan Pokok',
      slug: 'laju-inflasi-triwulan-pertama-terkendali',
      categoryId: categoriesMap['ekonomi'],
      featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#0b161e',
      excerpt: 'Bank Indonesia mencatat inflasi bulanan stabil pada level 2.1%, jauh di bawah batas kekhawatiran pasar global saat ini.',
      isBreaking: false,
      isFeatured: false,
      tags: ['Inflasi', 'Bank Indonesia', 'Pangan Pokok', 'Fiskal']
    },
    {
      title: 'Start-Up Otomotif Lokal Perkenalkan Purwarupa Mobil Listrik Keluarga Murah',
      slug: 'startup-mobil-listrik-lokal-keluarga',
      categoryId: categoriesMap['teknologi'],
      featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60',
      featuredImageColor: '#081a24',
      excerpt: 'Kendaraan berdaya tampung 7 penumpang ini mampu menempuh jarak hingga 400 kilometer dalam satu pengisian penuh baterai litium terintegrasi.',
      isBreaking: false,
      isExclusive: false,
      tags: ['Mobil Listrik', 'Startup', 'Otomotif', 'Teknologi Hijau']
    }
  ]

  for (const article of mockArticles) {
    const blocksJson = [
      { type: 'paragraph', content: article.excerpt },
      { type: 'paragraph', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam nec ex at ex tempor tincidunt. Sed elementum nulla purus, quis commodo velit interdum sed. Proin sollicitudin tellus a arcu semper, nec rutrum dui porta. Proin ac convallis leo, ac pulvinar ligula. Quisque vel egestas libero. Duis volutpat, magna at sodales efficitur, justo magna consequat felis, ac facilisis dolor velit at velit. Pellentesque a sem vel mi consequat fermentum eu et nibh.' },
      { type: 'image', url: article.featuredImage }
    ]

    await prisma.article.create({
      data: {
        title: article.title,
        slug: article.slug,
        siteId: 'pusat',
        categoryId: article.categoryId,
        authorId: superadmin.id,
        blocks: blocksJson,
        tags: article.tags,
        status: 'published',
        featuredImage: article.featuredImage,
        featuredImageColor: article.featuredImageColor,
        isBreaking: article.isBreaking,
        isExclusive: article.isExclusive,
        isFeatured: article.isFeatured,
        publishedAt: new Date(),
        wordCount: 250,
        readingTimeMin: 3
      }
    })
  }

  console.log('Successfully seeded 8 highly realistic mock articles!')
  console.log('Seed selesai. Gunakan akun superadmin untuk membuat user lainnya.')
}

main().catch(console.error).finally(() => prisma.$disconnect())