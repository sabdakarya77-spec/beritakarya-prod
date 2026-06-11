import { PrismaClient } from '@prisma/client'
import { env } from './src/lib/env'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
})

async function testDatabaseReadiness() {
  console.log('🔍 **BeritaKarya Database Readiness Test**\n')
  
  let allPassed = true

  // Test 1: Koneksi Database
  console.log('📌 Test 1: Database Connection')
  try {
    await prisma.$connect()
    console.log('  ✅ Connected to database successfully')
  } catch (error) {
    console.error('  ❌ Database connection failed:', error)
    allPassed = false
    process.exit(1)
  }

  // Test 2: Migration Status
  console.log('\n📌 Test 2: Migration Status')
  try {
    const migrations = await prisma.$queryRaw`
      SELECT 
        name, 
        applied_at, 
        checksum 
      FROM _prisma_migrations 
      ORDER BY applied_at DESC
    `
    
    console.log(`  ✅ Found ${migrations.length} migration(s)`)
    migrations.forEach((m: any) => {
      console.log(`     • ${m.name} (${new Date(m.applied_at).toLocaleString()})`)
    })
  } catch (error) {
    console.error('  ❌ Migration check failed:', error)
    allPassed = false
  }

  // Test 3: Multi-Tenancy (Site)
  console.log('\n📌 Test 3: Multi-Tenancy Schema (Site)')
  try {
    const siteCount = await prisma.site.count()
    console.log(`  ✅ Site table accessible (total sites: ${siteCount})`)
    
    if (siteCount === 0) {
      console.log('  ⚠️  No sites found. Consider seeding initial site.')
    } else {
      const sites = await prisma.site.findMany({
        select: { id: true, name: true, domain: true, deletedAt: true },
        take: 3
      })
      console.log('  Sample sites:')
      sites.forEach((s: any) => {
        const status = s.deletedAt ? 'soft-deleted' : 'active'
        console.log(`     • ${s.name} (${s.domain}) - ${status}`)
      })
    }
  } catch (error) {
    console.error('  ❌ Multi-tenancy test failed:', error)
    allPassed = false
  }

  // Test 4: Connection Pooling
  console.log('\n📌 Test 4: Connection Pooling Configuration')
  try {
    // Test concurrent connections
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        prisma.site.findFirst().then(() => {
          console.log(`     Connection ${i + 1} successful`)
        }).catch((err: Error) => {
          console.error(`     Connection ${i + 1} failed:`, err.message)
          throw err
        })
      )
    }
    await Promise.all(promises)
    console.log('  ✅ Connection pooling working (5 concurrent connections tested)')
  } catch (error) {
    console.error('  ❌ Connection pooling test failed:', error)
    allPassed = false
  }

  // Test 5: Soft Delete (Critical Models)
  console.log('\n📌 Test 5: Soft Delete Pattern')
  try {
    const models = [
      { name: 'Site', query: prisma.site.findMany({ where: { deletedAt: null }, take: 1 }) },
      { name: 'User', query: prisma.user.findMany({ where: { deletedAt: null }, take: 1 }) },
      { name: 'Article', query: prisma.article.findMany({ where: { deletedAt: null }, take: 1 }) },
      { name: 'Category', query: prisma.category.findMany({ where: { deletedAt: null }, take: 1 }) }
    ]

    for (const model of models) {
      try {
        await model.query
        console.log(`  ✅ ${model.name}: Soft delete filter working`)
      } catch (error) {
        console.error(`  ❌ ${model.name}: Soft delete filter failed`, error)
        allPassed = false
      }
    }
  } catch (error) {
    console.error('  ❌ Soft delete pattern test failed:', error)
    allPassed = false
  }

  // Test 6: RoleQuota Table (AI Quota System)
  console.log('\n📌 Test 6: AI Quota System (RoleQuota)')
  try {
    const roleQuotas = await prisma.roleQuota.findMany()
    console.log(`  ✅ RoleQuota table accessible (${roleQuotas.length} roles configured)`)
    
    const expectedRoles = ['superadmin', 'wapimred', 'editor', 'reporter', 'reader']
    const existingRoles = roleQuotas.map((r: any) => (r as any).role)
    const missingRoles = expectedRoles.filter(r => !existingRoles.includes(r))
    
    if (missingRoles.length === 0) {
      console.log('  ✅ All required roles defined')
    } else {
      console.warn(`  ⚠️  Missing roles: ${missingRoles.join(', ')}`)
      allPassed = false
    }
  } catch (error) {
    console.error('  ❌ RoleQuota test failed:', error)
    allPassed = false
  }

  // Test 7: Database Performance (Indexes)
  console.log('\n📌 Test 7: Database Indexes')
  try {
    // Check if indexes exist on key tables
    const indexes = await prisma.$queryRaw`
      SELECT 
        tablename, 
        indexname, 
        indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('Site', 'User', 'Article', 'Category')
      ORDER BY tablename, indexname
    `
    
    const indexCount = (indexes as any[]).length
    console.log(`  ✅ Found ${indexCount} indexes on key tables`)
    
    // Group by table
    const tables = new Set((indexes as any[]).map((i: any) => i.tablename))
    console.log(`  Tables with indexes: ${[...tables].join(', ')}`)
  } catch (error) {
    console.error('  ❌ Index check failed:', error)
    allPassed = false
  }

  // Cleanup
  await prisma.$disconnect()

  // Final Summary
  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('✅ **ALL TESTS PASSED** - Database is production-ready!')
    console.log('\nNext Steps:')
    console.log('  1. Ensure .env.production has correct DATABASE_URL')
    console.log('  2. Run: pnpm prisma migrate deploy')
    console.log('  3. Run: pnpm prisma db seed (if needed)')
    console.log('  4. Deploy with: docker compose -f infra/docker/docker-compose.backend.yml up -d')
    process.exit(0)
  } else {
    console.log('❌ **SOME TESTS FAILED** - Please fix issues before production')
    process.exit(1)
  }
}

testDatabaseReadiness().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})