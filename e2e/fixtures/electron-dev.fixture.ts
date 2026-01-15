import { test as base, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'

// Test fixture types
export interface ElectronDevFixtures {
  electronApp: ElectronApplication
  window: Page
  testDataDir: string
}

// Create a unique test data directory for isolation
async function createTestDataDir(): Promise<string> {
  const testDir = path.join(os.tmpdir(), `grimoire-dev-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await fs.mkdir(testDir, { recursive: true })
  return testDir
}

// Clean up test data directory
async function cleanupTestDataDir(testDir: string): Promise<void> {
  try {
    await fs.rm(testDir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Dev mode fixture - launches Electron directly without requiring build.
 * Uses electron-vite to run the app in development mode.
 *
 * Note: This is slower than production tests but doesn't require pre-building.
 */
export const test = base.extend<ElectronDevFixtures>({
  // Create isolated test data directory for each test
  testDataDir: async ({}, use) => {
    const testDir = await createTestDataDir()
    await use(testDir)
    await cleanupTestDataDir(testDir)
  },

  // Launch Electron app in dev mode
  electronApp: async ({ testDataDir }, use) => {
    const projectRoot = path.join(__dirname, '../..')

    // electron-vite outputs the main entry point for dev mode
    // We need to launch electron with the dev server setup
    const electronApp = await electron.launch({
      args: ['.'],
      cwd: projectRoot,
      env: {
        ...process.env,
        ELECTRON_USER_DATA_PATH: testDataDir,
        NODE_ENV: 'development',
        // Disable GPU for more consistent testing
        ELECTRON_DISABLE_GPU: '1'
      }
    })

    // Wait for app to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    await use(electronApp)
    await electronApp.close()
  },

  // Get the main window
  window: async ({ electronApp }, use) => {
    // Wait for the first BrowserWindow to open
    const window = await electronApp.firstWindow()

    // Wait for the app to be ready
    await window.waitForLoadState('domcontentloaded')

    // Wait for React to hydrate (look for main app container)
    await window.waitForSelector('[data-testid="app-layout"], .welcome-screen, #root', {
      timeout: 45000 // Longer timeout for dev mode
    })

    await use(window)
  }
})

export { expect } from '@playwright/test'
