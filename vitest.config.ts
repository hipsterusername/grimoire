import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, defineProject } from 'vitest/config'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Unit tests configuration
const unitConfig = defineProject({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/renderer/src')
    }
  },
  test: {
    name: 'unit',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/**/*.stories.*'],
    environment: 'jsdom',
    setupFiles: ['./src/renderer/src/test/setup.ts'],
    globals: true
  }
})

export default defineConfig({
  test: {
    projects: [unitConfig]
  }
})
