import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/globalSetup.ts',
  globalTeardown: './tests/e2e/globalTeardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @beritakarya/api dev',
      url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm --filter @beritakarya/web dev',
      url: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      // Must NOT reuse — globalSetup patches .env.local with local API URL.
      // Reusing would keep the old (production) API URL.
      reuseExistingServer: false,
      timeout: 180 * 1000,
    },
  ],
})
