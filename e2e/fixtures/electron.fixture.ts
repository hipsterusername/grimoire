import { test as base, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import os from 'node:os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if running in CI or headless mode
const isHeadless = process.env.CI === 'true' || process.env.HEADLESS === 'true'

// Test fixture types
export interface ElectronFixtures {
  electronApp: ElectronApplication
  window: Page
  testDataDir: string
}

// Create a unique test data directory for isolation
async function createTestDataDir(): Promise<string> {
  const testDir = path.join(os.tmpdir(), `grimoire-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

// Extend Playwright test with Electron fixtures
export const test = base.extend<ElectronFixtures>({
  // Create isolated test data directory for each test
  testDataDir: async ({}, use) => {
    const testDir = await createTestDataDir()
    await use(testDir)
    await cleanupTestDataDir(testDir)
  },

  // Launch Electron app with test data directory
  electronApp: async ({ testDataDir }, use) => {
    // Build launch args - include headless flags when needed
    const launchArgs = [path.join(__dirname, '../../out/main/index.js')]

    // Add flags for virtual framebuffer / headless operation
    if (isHeadless) {
      launchArgs.push(
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-sandbox'
      )
    }

    const electronApp = await electron.launch({
      args: launchArgs,
      env: {
        ...process.env,
        // Override userData path for test isolation
        ELECTRON_USER_DATA_PATH: testDataDir,
        NODE_ENV: 'test'
      }
    })

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
    await window.waitForSelector('#root', {
      timeout: 30000
    })

    // Wait for loading to complete - the app shows LoadingScreen while loading
    // We wait for either:
    // - The welcome screen with New Encounter button
    // - The app layout with toolbar
    // These only appear after loading is done
    await window.waitForFunction(() => {
      // Check if loading screen is gone and actual content is ready
      const loadingText = document.body.textContent?.includes('Loading...')
      const hasNewEncounterButton = document.querySelector('button')?.textContent?.includes('New Encounter')
      const hasToolbar = document.querySelector('[role="toolbar"]') !== null

      return !loadingText && (hasNewEncounterButton || hasToolbar)
    }, { timeout: 30000 })

    // Additional wait for stability after React renders
    await window.waitForTimeout(200)

    await use(window)
  }
})

export { expect } from '@playwright/test'
