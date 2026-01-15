import { defineConfig } from '@playwright/test'

/**
 * Dev mode Playwright config - runs tests against the development server.
 * This avoids the need to build before each test run, enabling faster iteration.
 *
 * Usage: npm run test:e2e:dev
 *
 * Note: This config starts electron-vite dev server before tests and expects
 * the app to be available. Some tests may behave differently in dev vs prod.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90000, // Longer timeout for dev server startup
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixels: 150, // More lenient for dev mode
      threshold: 0.3
    }
  },
  retries: 0, // No retries in dev mode for faster feedback
  workers: 1, // Electron tests must run serially
  reporter: [
    ['html', { outputFolder: 'playwright-report-dev' }],
    ['list']
  ],
  outputDir: 'test-results-dev',
  snapshotDir: 'e2e/__snapshots__',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off' // Disable video in dev for speed
  },
  projects: [
    {
      name: 'electron-dev',
      testMatch: '**/*.e2e.ts'
    }
  ],
  // Global setup/teardown to manage dev server
  globalSetup: './e2e/setup/dev-global-setup.ts',
  globalTeardown: './e2e/setup/dev-global-teardown.ts'
})
