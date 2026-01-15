import { type ChildProcess } from 'node:child_process'

/**
 * Global teardown for dev mode E2E tests.
 * Cleans up the dev server process.
 */
async function globalTeardown() {
  console.log('\n🛑 Stopping dev server...')

  const devServer = (global as any).__DEV_SERVER__ as ChildProcess | undefined

  if (devServer && !devServer.killed) {
    return new Promise<void>((resolve) => {
      devServer.on('exit', () => {
        console.log('✅ Dev server stopped')
        resolve()
      })

      // Try graceful shutdown first
      devServer.kill('SIGTERM')

      // Force kill after timeout
      setTimeout(() => {
        if (!devServer.killed) {
          devServer.kill('SIGKILL')
        }
        resolve()
      }, 5000)
    })
  }
}

export default globalTeardown
