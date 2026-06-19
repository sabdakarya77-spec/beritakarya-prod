import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { resolve } from 'path'

const ENV_LOCAL_PATH = resolve(__dirname, '../../.env.local')
const BACKUP_PATH = resolve(__dirname, '../../.env.local.e2e-backup')

/**
 * Playwright globalTeardown — runs ONCE after all tests.
 * 1. Cleans up E2E test data from the database
 * 2. Restores .env.local from backup
 */
export default async function globalTeardown() {
  console.log('\n[globalTeardown] Starting E2E cleanup...')

  // 1. Clean up database
  console.log('[globalTeardown] Cleaning up E2E test data...')
  try {
    execSync(
      'pnpm --filter @beritakarya/api exec ts-node --project tsconfig.scripts.json src/scripts/e2e-teardown.ts',
      {
        cwd: process.cwd().replace(/\\apps\\web$/, ''),
        stdio: 'inherit',
        timeout: 30000,
      }
    )
    console.log('[globalTeardown] ✅ E2E teardown completed')
  } catch (error) {
    console.error('[globalTeardown] ❌ E2E teardown failed:', error)
    // Don't throw — teardown failures shouldn't fail the test run
  }

  // 2. Restore .env.local from backup
  if (existsSync(BACKUP_PATH)) {
    const backup = readFileSync(BACKUP_PATH, 'utf-8')
    writeFileSync(ENV_LOCAL_PATH, backup, 'utf-8')
    unlinkSync(BACKUP_PATH)
    console.log('[globalTeardown] ✅ Restored .env.local from backup')
  }

  console.log('[globalTeardown] ✅ E2E cleanup complete\n')
}
