import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/e2e-tests/**', // Exclude Playwright e2e tests
      '**/*.e2e.{test,spec}.*' // Exclude any e2e test files
    ],
  },
}) 
