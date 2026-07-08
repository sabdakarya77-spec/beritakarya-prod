import { categoryService } from '../src/modules/category/category.service'
import { prisma } from '../src/db/client'

async function main() {
  console.log('--- START DEBUG CATEGORY DIFF ---')
  
  // Ambil data global categories
  const globals = await prisma.category.findMany({
    where: { isGlobal: true, deletedAt: null },
    select: { id: true, name: true, slug: true, parentId: true, order: true }
  })
  console.log(`Global categories count: ${globals.length}`)
  console.dir(globals, { depth: null })

  // Ambil data diff
  const diff = await categoryService.diffGlobalCategories()
  console.log('--- DIFF RESULT ---')
  console.dir(diff, { depth: null })

  await prisma.$disconnect()
  console.log('--- END DEBUG CATEGORY DIFF ---')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
