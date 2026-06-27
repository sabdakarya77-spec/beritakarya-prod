/**
 * E2E Test Seed Script
 *
 * Inserts test data into the database for Playwright E2E tests.
 * Idempotent — safe to re-run (uses upsert).
 *
 * Usage:
 *   pnpm --filter @beritakarya/api run db:seed:e2e
 *   OR
 *   npx ts-node --project tsconfig.scripts.json src/scripts/e2e-seed.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const E2E_PREFIX = 'e2e-'
const TEST_PASSWORD = 'Test1234!'

async function main() {
  console.log('[E2E Seed] Starting...')

  // 1. Ensure site 'pusat' exists
  await prisma.site.upsert({
    where: { id: 'pusat' },
    update: {},
    create: {
      id: 'pusat',
      name: 'BeritaKarya Pusat',
      domain: 'beritakarya.co',
      description: 'Portal berita independen untuk E2E testing.',
    },
  })
  console.log('[E2E Seed] Site pusat OK')

  // 2. Upsert test users
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)

  const reporter = await prisma.user.upsert({
    where: { email: `${E2E_PREFIX}reporter@test.com` },
    update: { passwordHash, name: 'Test Reporter', role: 'reporter', siteId: 'pusat', isVerified: true },
    create: {
      email: `${E2E_PREFIX}reporter@test.com`,
      passwordHash,
      name: 'Test Reporter',
      role: 'reporter',
      siteId: 'pusat',
      isVerified: true,
    },
  })
  console.log('[E2E Seed] Reporter user OK:', reporter.id)

  const advertiser = await prisma.user.upsert({
    where: { email: `${E2E_PREFIX}advertiser@test.com` },
    update: { passwordHash, name: 'Test Advertiser', role: 'advertiser', siteId: 'pusat', isVerified: true },
    create: {
      email: `${E2E_PREFIX}advertiser@test.com`,
      passwordHash,
      name: 'Test Advertiser',
      role: 'advertiser',
      siteId: 'pusat',
      isVerified: true,
    },
  })
  console.log('[E2E Seed] Advertiser user OK:', advertiser.id)

  // 3. Upsert category 'Politik' for site 'pusat'
  const category = await prisma.category.upsert({
    where: { slug_siteId: { slug: 'politik', siteId: 'pusat' } },
    update: { name: 'Politik', color: '#ef4444', isGlobal: false },
    create: {
      name: 'Politik',
      slug: 'politik',
      siteId: 'pusat',
      isGlobal: false,
      color: '#ef4444',
    },
  })
  console.log('[E2E Seed] Category Politik OK:', category.id)

  // 4. Upsert test article (matches MOCK_ARTICLE in homepage-mock.ts)
  const article = await prisma.article.upsert({
    where: { siteId_slug: { siteId: 'pusat', slug: 'judul-artikel-test-yang-menarik' } },
    update: {
      title: 'Judul Artikel Test yang Menarik',
      excerpt: 'Ini adalah excerpt dari artikel test yang digunakan untuk E2E testing.',
      blocks: [
        { type: 'paragraph', id: 'block-1', content: '<p>Ini adalah konten paragraf pertama dari artikel test.</p>' },
        { type: 'heading', id: 'block-2', content: 'Sub Judul Artikel', level: 2 },
        { type: 'paragraph', id: 'block-3', content: '<p>Konten paragraf kedua dengan <strong>teks tebal</strong> dan <em>teks miring</em>.</p>' },
      ],
      tags: ['politik', 'indonesia', 'test'],
      status: 'published',
      publishedAt: new Date('2026-06-16T10:00:00.000Z'),
      authorId: reporter.id,
      categories: { create: [{ categoryId: category.id }] },
      featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168d5c',
      contentType: 'article',
      isBreaking: false,
      isExclusive: false,
      isFeatured: false,
      viewCount: 150,
      wordCount: 850,
      readingTimeMin: 4,
    },
    create: {
      title: 'Judul Artikel Test yang Menarik',
      slug: 'judul-artikel-test-yang-menarik',
      excerpt: 'Ini adalah excerpt dari artikel test yang digunakan untuk E2E testing.',
      siteId: 'pusat',
      authorId: reporter.id,
      categories: { create: [{ categoryId: category.id }] },
      blocks: [
        { type: 'paragraph', id: 'block-1', content: '<p>Ini adalah konten paragraf pertama dari artikel test.</p>' },
        { type: 'heading', id: 'block-2', content: 'Sub Judul Artikel', level: 2 },
        { type: 'paragraph', id: 'block-3', content: '<p>Konten paragraf kedua dengan <strong>teks tebal</strong> dan <em>teks miring</em>.</p>' },
      ],
      tags: ['politik', 'indonesia', 'test'],
      status: 'published',
      publishedAt: new Date('2026-06-16T10:00:00.000Z'),
      featuredImage: 'https://images.unsplash.com/photo-1504711434969-e33886168d5c',
      contentType: 'article',
      isBreaking: false,
      isExclusive: false,
      isFeatured: false,
      viewCount: 150,
      wordCount: 850,
      readingTimeMin: 4,
    },
  })
  console.log('[E2E Seed] Article OK:', article.id)

  // 5. Upsert ad packages
  const pkg1 = await prisma.adPackage.upsert({
    where: { id: `${E2E_PREFIX}pkg-home-top-30` },
    update: {
      name: 'Hero Banner Pusat',
      slot: 'HOME_TOP',
      durationDays: 30,
      price: 1500000,
      description: 'Impresi tertinggi di first-fold bagian atas homepage.',
      allowedFormat: 'ALL',
      isActive: true,
    },
    create: {
      id: `${E2E_PREFIX}pkg-home-top-30`,
      name: 'Hero Banner Pusat',
      slot: 'HOME_TOP',
      durationDays: 30,
      price: 1500000,
      description: 'Impresi tertinggi di first-fold bagian atas homepage.',
      allowedFormat: 'ALL',
      isActive: true,
    },
  })
  console.log('[E2E Seed] AdPackage HOME_TOP OK:', pkg1.id)

  const pkg2 = await prisma.adPackage.upsert({
    where: { id: `${E2E_PREFIX}pkg-home-feed1-14` },
    update: {
      name: 'Feed Atas',
      slot: 'HOME_FEED_1',
      durationDays: 14,
      price: 500000,
      description: 'Slot iklan di tengah feed homepage.',
      allowedFormat: 'IMAGE',
      isActive: true,
    },
    create: {
      id: `${E2E_PREFIX}pkg-home-feed1-14`,
      name: 'Feed Atas',
      slot: 'HOME_FEED_1',
      durationDays: 14,
      price: 500000,
      description: 'Slot iklan di tengah feed homepage.',
      allowedFormat: 'IMAGE',
      isActive: true,
    },
  })
  console.log('[E2E Seed] AdPackage HOME_FEED_1 OK:', pkg2.id)

  // 6. Ensure site 'pusat' has legal page content (for /pusat/p/about etc.)
  await prisma.site.update({
    where: { id: 'pusat' },
    data: {
      aboutUs: '<h2>Tentang BeritaKarya</h2><p>Portal berita independen untuk E2E testing.</p>',
      codeOfEthics: '<h2>Kode Etik</h2><p>Kode etik jurnalistik BeritaKarya.</p>',
      privacyPolicy: '<h2>Kebijakan Privasi</h2><p>Kebijakan privasi BeritaKarya.</p>',
      termsOfService: '<h2>Syarat Layanan</h2><p>Syarat layanan BeritaKarya.</p>',
    },
  })
  console.log('[E2E Seed] Site legal pages OK')

  console.log('[E2E Seed] ✅ All test data seeded successfully')
}

main()
  .catch((e) => {
    console.error('[E2E Seed] ❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
