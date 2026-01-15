import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'

let devServer: ChildProcess | null = null

/**
 * Global setup for dev mode E2E tests.
 * Starts the electron-vite dev server and waits for it to be ready.
 */
async function globalSetup() {
  console.log('\n🚀 Starting electron-vite dev server...')

  const projectRoot = path.resolve(__dirname, '../..')

  return new Promise<void>((resolve, reject) => {
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_ENABLE_LOGGING: '1'
      }
    })

    let started = false
    const timeout = setTimeout(() => {
      if (!started) {
        console.error('❌ Dev server startup timed out after 60s')
        devServer?.kill()
        reject(new Error('Dev server startup timeout'))
      }
    }, 60000)

    devServer.stdout?.on('data', (data: Buffer) => {
      const output = data.toString()
      process.stdout.write(output)

      // Look for indicators that the app is ready
      if (
        output.includes('Electron') ||
        output.includes('ready in') ||
        output.includes('dev server running')
      ) {
        if (!started) {
          started = true
          clearTimeout(timeout)
          // Give the app a moment to fully initialize
          setTimeout(() => {
            console.log('✅ Dev server ready')
            resolve()
          }, 3000)
        }
      }
    })

    devServer.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      // Filter out noise
      if (!output.includes('DevTools') && !output.includes('source map')) {
        process.stderr.write(output)
      }
    })

    devServer.on('error', (err) => {
      clearTimeout(timeout)
      console.error('❌ Failed to start dev server:', err)
      reject(err)
    })

    devServer.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout)
        reject(new Error(`Dev server exited with code ${code}`))
      }
    })

    // Store reference for global teardown
    ;(global as any).__DEV_SERVER__ = devServer
  })
}

export default globalSetup
