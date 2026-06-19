import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ENV_LOCAL_PATH = resolve(__dirname, '../../.env.local')
const BACKUP_PATH = resolve(__dirname, '../../.env.local.e2e-backup')

/**
 * Playwright globalSetup — runs ONCE before all tests.
 * 1. Seeds the database with test data
 * 2. Patches .env.local to use local API URL (for SSR fetches)
 */
export default async function globalSetup() {
  console.log('\n[globalSetup] Starting E2E setup...')

  // 1. Seed database
  console.log('[globalSetup] Seeding E2E test data...')
  try {
    execSync(
      'pnpm --filter @beritakarya/api exec ts-node --project tsconfig.scripts.json src/scripts/e2e-seed.ts',
      {
        cwd: process.cwd().replace(/\\apps\\web$/, ''),
        stdio: 'inherit',
        timeout: 30000,
      }
    )
    console.log('[globalSetup] ✅ E2E seed completed')
  } catch (error) {
    console.error('[globalSetup] ❌ E2E seed failed:', error)
    throw error
  }

  // 2. Patch .env.local to use local API URL for SSR fetches
  if (existsSync(ENV_LOCAL_PATH)) {
    const content = readFileSync(ENV_LOCAL_PATH, 'utf-8')
    writeFileSync(BACKUP_PATH, content, 'utf-8')

    const patched = content.replace(
      /NEXT_PUBLIC_API_URL=.*/,
      'NEXT_PUBLIC_API_URL=http://localhost:3001'
    )
    writeFileSync(ENV_LOCAL_PATH, patched, 'utf-8')
    console.log('[globalSetup] ✅ Patched .env.local → NEXT_PUBLIC_API_URL=http://localhost:3001')
  } else {
    writeFileSync(ENV_LOCAL_PATH, 'NEXT_PUBLIC_API_URL=http://localhost:3001\n', 'utf-8')
    console.log('[globalSetup] ✅ Created .env.local with local API URL')
  }

  console.log('[globalSetup] ✅ E2E setup complete\n')
}
