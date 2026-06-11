import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'tests/e2e/**',
      '**/*.e2e.ts',
      '**/*.e2e.tsx'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines:     65,
        functions: 65,
        branches:  55
      },
      exclude: [
        'app/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
        'tests/e2e/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@beritakarya/types':  resolve(__dirname, '../../packages/types/src/index.ts'),
      '@beritakarya/utils':  resolve(__dirname, '../../packages/utils/src/index.ts'),
      '@beritakarya/config': resolve(__dirname, '../../packages/config/src/index.ts')
    }
  }
})
