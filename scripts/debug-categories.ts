import { prisma } from '../apps/api/src/db/client'

async function debug() {
  console.log('=== CATEGORY TREE ===')
  const categories = await prisma.category.findMany({
    where: { siteId: 'pusat' },
    include: { parent: true, subCategories: true }
  })
  
  for (const cat of categories) {
    console.log(`\nCategory: ${cat.name} (slug: ${cat.slug}, id: ${cat.id})`)
    console.log(`  parent: ${cat.parent?.name || 'null'} (${cat.parent?.slug || 'none'})`)
    console.log(`  subCategories: ${cat.subCategories.map(c => c.name).join(', ') || 'none'}`)
  }

  console.log('\n=== ARTICLES WITH CATEGORIES ===')
  const articles = await prisma.article.findMany({
    where: { siteId: 'pusat' },
    include: { category: true }
  })
  
  for (const article of articles) {
    console.log(`\nArticle: ${article.title}`)
    console.log(`  categoryId: ${article.categoryId}`)
    console.log(`  category: ${article.category?.name} (${article.category?.slug})`)
  }

  console.log('\n=== CATEGORY LOOKUP TEST ===')
  const testSlugs = ['nasional', 'politik', 'ekonomi']
  for (const slug of testSlugs) {
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: slug, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } }
        ],
        siteId: 'pusat'
      },
      include: { subCategories: true }
    })
    if (cat) {
      console.log(`Found '${slug}': ${cat.name} (id: ${cat.id})`)
      console.log(`  subCategories: ${cat.subCategories.map(c => c.slug).join(', ')}`)
    } else {
      console.log(`NOT FOUND: '${slug}'`)
    }
  }

  await prisma.$disconnect()
}

debug().catch(console.error)