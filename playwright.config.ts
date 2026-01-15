import { defineConfig } from '@playwright/test'
import path from 'node:path'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2
    }
  },
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron tests must run serially
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  outputDir: 'test-results',
  snapshotDir: 'e2e/__snapshots__',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.e2e.ts'
    }
  ]
})
