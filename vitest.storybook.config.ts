import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Storybook component tests (runs in browser)
export default defineConfig({
  plugins: [storybookTest({ configDir: path.join(__dirname, '.storybook') })],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: 'chromium' }]
    },
    setupFiles: ['.storybook/vitest.setup.ts']
  }
})
