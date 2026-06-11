import { categoryService } from './modules/category/category.service'

async function run() {
  try {
    const tree = await categoryService.getCategoryTree('pusat')
    console.log('TREE_RESULT:', JSON.stringify(tree, null, 2))
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

run()
