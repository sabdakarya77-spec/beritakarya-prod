#!/usr/bin/env node

/**
 * BeritaKarya Migration Generator
 * 
 * This script helps generate the missing migration for:
 * 1. Soft delete fields (deletedAt) on Site, User, Article, Category
 * 2. RoleQuota table
 * 
 * Usage:
 *   node apps/api/generate-migration.js
 * 
 * This will create a new migration file in prisma/migrations/
 */

const { writeFileSync, mkdirSync, existsSync } = require('fs')
const { join } = require('path')
const { v4: uuidv4 } = require('uuid')

const PRISMA_DIR = join(__dirname, 'prisma')
const MIGRATIONS_DIR = join(PRISMA_DIR, 'migrations')

// Generate timestamp for migration name
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const migrationName = `${timestamp}_add_soft_delete_and_rolequota`
const migrationDir = join(MIGRATIONS_DIR, migrationName)
const migrationSqlPath = join(migrationDir, 'migration.sql')

// Migration SQL content
const migrationSql = `-- Migration: Add Soft Delete & RoleQuota
-- Created: ${new Date().toISOString()}
-- Purpose: Add soft delete support and AI quota system

-- Add deletedAt columns to existing tables
ALTER TABLE "Site" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Article" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Create indexes for soft delete queries
CREATE INDEX "Site_deletedAt_idx" ON "Site"("deletedAt");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX "Article_deletedAt_idx" ON "Article"("deletedAt");
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- Create RoleQuota table
CREATE TABLE "RoleQuota" (
    "role" VARCHAR(20) NOT NULL,
    "dailyRequests" INTEGER NOT NULL,
    "dailyTokens" INTEGER NOT NULL,
    "monthlyBudget" DECIMAL(10,2) NOT NULL,
    "allowedFeatures" JSONB NOT NULL,
    "modelRestriction" VARCHAR(50),
    CONSTRAINT "RoleQuota_pkey" PRIMARY KEY ("role")
);

-- Insert default role quotas
INSERT INTO "RoleQuota" ("role", "dailyRequests", "dailyTokens", "monthlyBudget", "allowedFeatures", "modelRestriction") VALUES
('superadmin', 999999, 999999, 99999.00, '["rewrite","expand","headline","seo","grammar","readability","layout","caption"]', NULL),
('wapimred', 500, 100000, 500.00, '["rewrite","expand","headline","seo","grammar","readability","layout","caption"]', NULL),
('editor', 200, 50000, 50.00, '["rewrite","expand","headline","seo","grammar","readability","layout","caption"]', NULL),
('reporter', 100, 25000, 25.00, '["rewrite","expand","grammar","readability","caption"]', 'gpt-3.5-turbo'),
('reader', 0, 0, 0.00, '[]', NULL);

-- Add index on RoleQuota.role (already primary key, but for clarity)
-- No additional index needed as role is PK

-- Migration complete
`

// Migration description (in Indonesian)
const migrationReadme = `# Migration: ${migrationName}

## Tujuan
Menambahkan:
1. Soft delete support untuk Site, User, Article, Category
2. RoleQuota table untuk AI quota management
3. Indexes untuk optimize soft delete queries

## Perubahan

### Soft Delete Fields
- Site.deletedAt
- User.deletedAt
- Article.deletedAt
- Category.deletedAt

### RoleQuota Table
- role (PK)
- dailyRequests
- dailyTokens
- monthlyBudget
- allowedFeatures (JSON)
- modelRestriction (nullable)

## Default Data
RoleQuota diisi dengan 5 role default:
- superadmin: unlimited
- wapimred: 500 req/hari, $500/bulan
- editor: 200 req/hari, $50/bulan
- reporter: 100 req/hari, $25/bulan, GPT-3.5 only
- reader: 0 (trial only)

## cara Apply
\`\`\`bash
pnpm prisma migrate deploy
\`\`\`

## Rollback (jika diperlukan)
\`\`\`bash
pnpm prisma migrate resolve --rolled-back "migration_name"
\`\`\`

## Notes
- Migration ini compatibility dengan schema.prisma yang sudah memiliki deletedAt fields
- Memerlukan Prisma Client version >= 5.0
`

function generateMigration() {
  try {
    console.log('🔧 **Generating Migration: Add Soft Delete & RoleQuota**\n')
    
    // Check migrations directory exists
    if (!existsSync(MIGRATIONS_DIR)) {
      console.error('❌ Migrations directory not found:', MIGRATIONS_DIR)
      process.exit(1)
    }
    
    // Create migration directory
    mkdirSync(migrationDir, { recursive: true })
    console.log(`✅ Created migration directory: ${migrationDir}`)
    
    // Write migration.sql
    writeFileSync(migrationSqlPath, migrationSql, 'utf-8')
    console.log(`✅ Created migration SQL: ${migrationSqlPath}`)
    
    // Write README.md
    const readmePath = join(migrationDir, 'README.md')
    writeFileSync(readmePath, migrationReadme, 'utf-8')
    console.log(`✅ Created migration README: ${readmePath}`)
    
    console.log('\n' + '='.repeat(70))
    console.log('✅ MIGRATION GENERATED SUCCESSFULLY')
    console.log('='.repeat(70))
    console.log(`\nMigration name: ${migrationName}`)
    console.log(`Location: ${migrationDir}`)
    console.log('\n📋 Next steps:')
    console.log('  1. Review the generated SQL in migration.sql')
    console.log('  2. Test locally: pnpm prisma migrate dev')
    console.log('  3. If satisfied, deploy: pnpm prisma migrate deploy')
    console.log('  4. Generate Prisma Client: pnpm prisma generate')
    console.log('\n💡 To apply this migration:')
    console.log('   pnpm prisma migrate deploy')
    console.log('\n')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error generating migration:', error)
    process.exit(1)
  }
}

generateMigration()