import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines:     70,
        functions: 70,
        branches:  60,
        statements:70
      },
      exclude: [
        'src/main.ts',
        'src/db/seed.ts',
        'src/db/client.ts',
        '**/*.test.ts',
        '**/node_modules/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@beritakarya/types':  resolve(__dirname, '../../packages/types/src/index.ts'),
      '@beritakarya/utils':  resolve(__dirname, '../../packages/utils/src/index.ts'),
      '@beritakarya/config': resolve(__dirname, '../../packages/config/src/index.ts')
    }
  }
})
