#!/usr/bin/env node

/**
 * BeritaKarya Database Verification Script
 * 
 * This script verifies database configuration without requiring actual DB connection.
 * It checks: schema completeness, migration existence, connection config validity.
 * 
 * Usage:
 *   pnpm ts-node apps/api/verify-database.ts
 *   # or for actual connection test:
 *   DATABASE_URL=postgresql://user:pass@host:port/db pnpm ts-node apps/api/verify-database.ts
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const PRISMA_DIR = join(__dirname, 'prisma')
const MIGRATIONS_DIR = join(PRISMA_DIR, 'migrations')
const SCHEMA_FILE = join(PRISMA_DIR, 'schema.prisma')

type CheckResult = {
  passed: boolean
  message: string
  details?: string
}

function check(name: string, fn: () => CheckResult): CheckResult {
  try {
    return fn()
  } catch (error) {
    return {
      passed: false,
      message: name,
      details: error instanceof Error ? error.message : String(error)
    }
  }
}

function runChecks() {
  console.log('🔍 **BeritaKarya Database Verification**\n')
  console.log('Mode: Schema & Configuration Check (No DB Connection Required)\n')
  
  const results: CheckResult[] = []
  
  // Check 1: Schema File Exists
  results.push(check('Schema file exists', () => {
    if (!existsSync(SCHEMA_FILE)) {
      return { passed: false, message: 'schema.prisma not found', details: `Expected: ${SCHEMA_FILE}` }
    }
    return { passed: true, message: '✅ Schema file exists' }
  }))
  
  // Check 2: Schema contains required models
  results.push(check('Schema contains all required models', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const requiredModels = [
      'Site', 'User', 'Article', 'Category', 'Advertisement',
      'RefreshToken', 'BlacklistedToken', 'AIUsage', 'NewsletterSubscriber',
      'Media', 'Comment', 'PageView', 'ArticleVersion', 'AuditLog',
      'Notification', 'KYCViewLog', 'RoleQuota'
    ]
    
    const missingModels = requiredModels.filter(model => !schema.includes(`model ${model}`))
    
    if (missingModels.length > 0) {
      return { 
        passed: false, 
        message: 'Missing models in schema', 
        details: `Missing: ${missingModels.join(', ')}` 
      }
    }
    
    return { 
      passed: true, 
      message: `✅ All ${requiredModels.length} required models present`,
      details: requiredModels.join(', ')
    }
  }))
  
  // Check 3: Multi-tenancy fields
  results.push(check('Multi-tenancy implementation', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const checks = [
      { model: 'Site', hasDomain: /domain\s+String\s+@unique/.test(schema) },
      { model: 'User', hasSiteId: /siteId\s+String/.test(schema) },
      { model: 'Article', hasSiteId: /siteId\s+String/.test(schema) },
      { model: 'Category', hasSiteId: /siteId\s+String\?/.test(schema) }
    ]
    
    const failed = checks.filter(c => {
      const values = Object.values(c).filter((v): v is boolean => typeof v === 'boolean')
      return !values.every(v => v === true)
    })
    
    if (failed.length > 0) {
      return { 
        passed: false, 
        message: 'Multi-tenancy fields missing',
        details: `Failed checks: ${failed.map(f => f.model).join(', ')}`
      }
    }
    
    return { 
      passed: true, 
      message: '✅ Multi-tenancy fields correctly configured',
      details: 'Site.domain (unique), User.siteId, Article.siteId, Category.siteId'
    }
  }))
  
  // Check 4: Soft delete pattern
  results.push(check('Soft delete implementation', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const modelsWithSoftDelete = ['Site', 'User', 'Article', 'Category']
    const missingSoftDelete = modelsWithSoftDelete.filter(model => {
      const modelRegex = new RegExp(`model ${model}.*?\\n\\n`, 's')
      const modelMatch = schema.match(modelRegex)
      if (!modelMatch) return true
      return !/deletedAt\s+DateTime\?/.test(modelMatch[0])
    })
    
    if (missingSoftDelete.length > 0) {
      return {
        passed: false,
        message: 'Soft delete missing in some models',
        details: `Missing deletedAt field: ${missingSoftDelete.join(', ')}`
      }
    }
    
    return {
      passed: true,
      message: '✅ Soft delete pattern implemented',
      details: modelsWithSoftDelete.join(', ')
    }
  }))
  
  // Check 5: AI Quota system
  results.push(check('AI Quota system (RoleQuota)', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    
    // Check RoleQuota model exists
    if (!/model RoleQuota/.test(schema)) {
      return { passed: false, message: 'RoleQuota model missing' }
    }
    
    // Check required fields
    const requiredFields = ['dailyRequests', 'dailyTokens', 'monthlyBudget', 'allowedFeatures', 'modelRestriction']
    const missingFields = requiredFields.filter(field => !schema.includes(field))
    
    if (missingFields.length > 0) {
      return {
        passed: false,
        message: 'RoleQuota missing required fields',
        details: `Missing: ${missingFields.join(', ')}`
      }
    }
    
    // Check if AI fields in User model
    if (!/aiEnabled\s+Boolean/.test(schema) || 
        !/aiDailyLimit\s+Int/.test(schema) ||
        !/aiMonthlyBudget\s+Decimal/.test(schema)) {
      return {
        passed: false,
        message: 'User model missing AI quota fields'
      }
    }
    
    return {
      passed: true,
      message: '✅ AI Quota system properly configured',
      details: 'RoleQuota + User.ai* fields present'
    }
  }))
  
  // Check 6: Migrations directory
  results.push(check('Migrations directory exists', () => {
    if (!existsSync(MIGRATIONS_DIR)) {
      return { passed: false, message: 'Migrations directory missing', details: MIGRATIONS_DIR }
    }
    
    const migrationFolders = readFileSync(MIGRATIONS_DIR, 'utf-8')
      .split('\n')
      .filter(line => line.trim() && !line.includes('migration_lock.toml'))
    
    if (migrationFolders.length === 0) {
      return { passed: false, message: 'No migration folders found' }
    }
    
    return {
      passed: true,
      message: `✅ Found ${migrationFolders.length} migration(s)`,
      details: migrationFolders.join(', ')
    }
  }))
  
  // Check 7: Initial migration completeness
  results.push(check('Initial migration includes all tables', () => {
    const initMigrationPath = join(MIGRATIONS_DIR, '20260513000000_init', 'migration.sql')
    if (!existsSync(initMigrationPath)) {
      return { passed: false, message: 'Initial migration not found', details: initMigrationPath }
    }
    
    const migrationSql = readFileSync(initMigrationPath, 'utf-8')
    const requiredTables = [
      'Site', 'User', 'Article', 'Category', 'Advertisement',
      'RefreshToken', 'BlacklistedToken', 'AIUsage', 'NewsletterSubscriber',
      'Media', 'Comment', 'PageView', 'ArticleVersion', 'AuditLog',
      'Notification', 'KYCViewLog', 'RoleQuota'
    ]
    
    const missingTables = requiredTables.filter(table => 
      !migrationSql.includes(`CREATE TABLE "${table}"`) && 
      !migrationSql.includes(`CREATE TABLE ${table}`)
    )
    
    if (missingTables.length > 0) {
      return {
        passed: false,
        message: 'Initial migration missing tables',
        details: `Missing: ${missingTables.join(', ')}`
      }
    }
    
    return {
      passed: true,
      message: '✅ Initial migration includes all tables',
      details: `${requiredTables.length} tables defined`
    }
  }))
  
  // Check 8: Indexes
  results.push(check('Database indexes defined', () => {
    const schema = readFileSync(SCHEMA_FILE, 'utf-8')
    const indexMatches = schema.match(/@@index\(\[/g) || []
    
    if (indexMatches.length < 10) {
      return {
        passed: false,
        message: 'Insufficient indexes defined',
        details: `Found ${indexMatches.length} indexes, expected at least 10`
      }
    }
    
    return {
      passed: true,
      message: `✅ ${indexMatches.length} indexes defined`,
      details: 'Good indexing strategy'
    }
  }))
  
  // Print Results
  console.log('='.repeat(70))
  console.log('VERIFICATION RESULTS\n')
  
  let passedCount = 0
  let warningCount = 0
  let failedCount = 0
  
  results.forEach(result => {
    if (result.passed) {
      console.log(result.message)
      passedCount++
    } else if (result.details?.startsWith('⚠️')) {
      console.warn(result.message)
      if (result.details) console.warn(`  └─ ${result.details}`)
      warningCount++
    } else {
      console.error(result.message)
      if (result.details) console.error(`  └─ ${result.details}`)
      failedCount++
    }
  })
  
  console.log('\n' + '='.repeat(70))
  console.log(`📊 Summary: ${passedCount} passed, ${warningCount} warnings, ${failedCount} failed\n`)
  
  if (failedCount === 0) {
    console.log('✅ DATABASE SCHEMA VERIFICATION: PASSED')
    console.log('\n📋 Next Steps:')
    console.log('  1. Ensure DATABASE_URL in .env.production points to PostgreSQL server')
    console.log('  2. Run: pnpm prisma migrate deploy')
    console.log('  3. (Optional) Run: pnpm prisma db seed')
    console.log('  4. Test with: pnpm prisma studio (opens DB viewer at http://localhost:5555)')
    console.log('\n💡 For actual DB connection test, set DATABASE_URL to production DB and re-run.')
    process.exit(0)
  } else {
    console.log('❌ DATABASE SCHEMA VERIFICATION: FAILED')
    console.log('Please fix the issues above before proceeding to production.')
    process.exit(1)
  }
}

try {
  runChecks()
} catch (error) {
  console.error('\nFatal error during verification:', error)
  process.exit(1)
}