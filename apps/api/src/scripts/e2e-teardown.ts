/**
 * E2E Test Teardown Script
 *
 * Deletes test data seeded by e2e-seed.ts.
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   pnpm --filter @beritakarya/api run db:teardown:e2e
 *   OR
 *   npx ts-node --project tsconfig.scripts.json src/scripts/e2e-teardown.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const E2E_PREFIX = 'e2e-'

async function main() {
  console.log('[E2E Teardown] Starting...')

  // 1. Delete article
  const article = await prisma.article.deleteMany({
    where: { slug: 'judul-artikel-test-yang-menarik', siteId: 'pusat' },
  })
  console.log(`[E2E Teardown] Articles deleted: ${article.count}`)

  // 2. Delete ad bookings (if any)
  const bookings = await prisma.adBooking.deleteMany({
    where: { siteId: 'pusat', userId: { in: await getE2EUserIds() } },
  })
  console.log(`[E2E Teardown] AdBookings deleted: ${bookings.count}`)

  // 3. Delete ad packages
  const packages = await prisma.adPackage.deleteMany({
    where: { id: { startsWith: E2E_PREFIX } },
  })
  console.log(`[E2E Teardown] AdPackages deleted: ${packages.count}`)

  // 4. Delete category
  const category = await prisma.category.deleteMany({
    where: { slug: 'politik', siteId: 'pusat' },
  })
  console.log(`[E2E Teardown] Categories deleted: ${category.count}`)

  // 5. Delete users
  const users = await prisma.user.deleteMany({
    where: { email: { startsWith: E2E_PREFIX } },
  })
  console.log(`[E2E Teardown] Users deleted: ${users.count}`)

  // 6. Reset site legal pages (don't delete the site itself)
  await prisma.site.update({
    where: { id: 'pusat' },
    data: {
      aboutUs: null,
      codeOfEthics: null,
      privacyPolicy: null,
      termsOfService: null,
    },
  }).catch(() => {
    // Site might not exist, that's OK
  })
  console.log('[E2E Teardown] Site legal pages reset')

  console.log('[E2E Teardown] ✅ All test data cleaned up')
}

async function getE2EUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: E2E_PREFIX } },
    select: { id: true },
  })
  return users.map((u) => u.id)
}

main()
  .catch((e) => {
    console.error('[E2E Teardown] ❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
