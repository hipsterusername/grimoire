import { app, BrowserWindow, ipcMain, dialog, screen, protocol, net } from 'electron'
import path from 'path'
import fs from 'fs/promises'

let mainWindow: BrowserWindow | null = null
let presentationWindow: BrowserWindow | null = null

function getEncountersDir(): string {
  return path.join(app.getPath('userData'), 'encounters')
}

function getMapsDir(): string {
  return path.join(app.getPath('userData'), 'maps')
}

function getTokensDir(): string {
  return path.join(app.getPath('userData'), 'tokens')
}

function getLibraryDir(): string {
  return path.join(app.getPath('userData'), 'library')
}

function getLibraryPath(): string {
  return path.join(getLibraryDir(), 'library.json')
}

function getLibraryAssetsDir(): string {
  return path.join(getLibraryDir(), 'assets')
}

// Allowed directories for file access (security: prevent path traversal)
function getAllowedDirs(): string[] {
  return [
    getEncountersDir(),
    getMapsDir(),
    getTokensDir(),
    getLibraryDir(),
    getLibraryAssetsDir()
  ]
}

// Validate that a path is within allowed directories (security: prevent path traversal)
function isPathAllowed(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath)
  const allowedDirs = getAllowedDirs()
  return allowedDirs.some((dir) => normalizedPath.startsWith(path.normalize(dir) + path.sep))
}

// Validate ID to prevent path traversal (only alphanumeric, dash, underscore allowed)
function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id)
}

// Register custom protocol for serving local files securely
function registerLocalFileProtocol(): void {
  protocol.handle('local-file', async (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))

    // Security check: only allow files in our allowed directories
    if (!isPathAllowed(filePath)) {
      return new Response('Forbidden', { status: 403 })
    }

    try {
      return net.fetch(`file://${filePath}`)
    } catch {
      return new Response('Not Found', { status: 404 })
    }
  })
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    backgroundColor: '#1a1a2e',
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// IPC Handlers

// List encounters
ipcMain.handle('encounters:list', async () => {
  const dir = getEncountersDir()
  await fs.mkdir(dir, { recursive: true })

  const files = await fs.readdir(dir)
  const encounters: Array<{ id: string; name: string; updatedAt: string }> = []

  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8')
        const encounter = JSON.parse(content)
        encounters.push({
          id: encounter.id,
          name: encounter.name,
          updatedAt: encounter.updatedAt
        })
      } catch {
        // Skip invalid files
      }
    }
  }

  return encounters.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
})

// Load encounter
ipcMain.handle('encounters:load', async (_event, id: string) => {
  if (!isValidId(id)) {
    throw new Error('Invalid encounter ID')
  }
  const filePath = path.join(getEncountersDir(), `${id}.json`)
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
})

// Save encounter
ipcMain.handle('encounters:save', async (_event, encounter) => {
  const dir = getEncountersDir()
  await fs.mkdir(dir, { recursive: true })

  encounter.updatedAt = new Date().toISOString()
  const filePath = path.join(dir, `${encounter.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(encounter, null, 2))

  return { success: true }
})

// Delete encounter
ipcMain.handle('encounters:delete', async (_event, id: string) => {
  if (!isValidId(id)) {
    throw new Error('Invalid encounter ID')
  }
  const filePath = path.join(getEncountersDir(), `${id}.json`)
  await fs.unlink(filePath)
  return { success: true }
})

// Upload map image
ipcMain.handle('images:upload', async (_event, type: 'map' | 'token') => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  })

  if (result.canceled || !result.filePaths[0]) {
    return null
  }

  const sourcePath = result.filePaths[0]
  const dir = type === 'map' ? getMapsDir() : path.join(app.getPath('userData'), 'tokens')
  await fs.mkdir(dir, { recursive: true })

  const filename = `${Date.now()}-${path.basename(sourcePath)}`
  const destPath = path.join(dir, filename)

  await fs.copyFile(sourcePath, destPath)

  return {
    path: destPath,
    filename
  }
})

// Get image as data URL
ipcMain.handle('images:getDataUrl', async (_event, imagePath: string) => {
  // Security: validate path is within allowed directories
  if (!isPathAllowed(imagePath)) {
    throw new Error('Access denied: path outside allowed directories')
  }
  try {
    const data = await fs.readFile(imagePath)
    const ext = path.extname(imagePath).toLowerCase().slice(1)
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
    return `data:${mimeType};base64,${data.toString('base64')}`
  } catch {
    return null
  }
})

// Library - Load
ipcMain.handle('library:load', async () => {
  try {
    const filePath = getLibraryPath()
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null // No library yet
  }
})

// Library - Save
ipcMain.handle('library:save', async (_event, library: unknown) => {
  const dir = getLibraryDir()
  await fs.mkdir(dir, { recursive: true })
  const filePath = getLibraryPath()
  await fs.writeFile(filePath, JSON.stringify(library, null, 2))
  return { success: true }
})

// Library - Save processed asset image
ipcMain.handle(
  'library:saveAsset',
  async (_event, { filename, dataUrl }: { filename: string; dataUrl: string }) => {
    const dir = getLibraryAssetsDir()
    await fs.mkdir(dir, { recursive: true })

    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(dir, uniqueFilename)

    // Convert data URL to buffer and save
    const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid data URL format')
    }
    const buffer = Buffer.from(base64Match[1], 'base64')
    await fs.writeFile(filePath, buffer)

    return { path: filePath, filename: uniqueFilename }
  }
)

// Library - Delete asset file
ipcMain.handle('library:deleteAsset', async (_event, assetPath: string) => {
  // Security: validate path is within allowed directories
  if (!isPathAllowed(assetPath)) {
    throw new Error('Access denied: path outside allowed directories')
  }
  try {
    await fs.unlink(assetPath)
    return { success: true }
  } catch {
    return { success: false }
  }
})

// Presentation Mode - Open window
ipcMain.handle('presentation:open', async () => {
  if (presentationWindow) {
    presentationWindow.focus()
    return { success: true, alreadyOpen: true }
  }

  // Get displays and try to open on a secondary monitor
  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()
  const externalDisplay = displays.find((d) => d.id !== primaryDisplay.id)

  const targetDisplay = externalDisplay || primaryDisplay
  const { x, y, width, height } = targetDisplay.bounds

  presentationWindow = new BrowserWindow({
    x: x + 50,
    y: y + 50,
    width: Math.min(width - 100, 1400),
    height: Math.min(height - 100, 900),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    backgroundColor: '#1a1a2e',
    show: false,
    title: 'Dungeon Map - Presentation'
  })

  presentationWindow.on('ready-to-show', () => {
    presentationWindow?.show()
  })

  presentationWindow.on('closed', () => {
    presentationWindow = null
    // Notify main window that presentation closed
    mainWindow?.webContents.send('presentation:closed')
  })

  // Load the app with presentation mode query param
  if (process.env.ELECTRON_RENDERER_URL) {
    presentationWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}?mode=presentation`)
  } else {
    presentationWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      query: { mode: 'presentation' }
    })
  }

  return { success: true, alreadyOpen: false }
})

// Presentation Mode - Close window
ipcMain.handle('presentation:close', async () => {
  if (presentationWindow) {
    presentationWindow.close()
    presentationWindow = null
  }
  return { success: true }
})

// Presentation Mode - Check if open
ipcMain.handle('presentation:isOpen', async () => {
  return { isOpen: presentationWindow !== null }
})

// Presentation Mode - Send state update to presentation window
ipcMain.handle('presentation:updateState', async (_event, state: unknown) => {
  if (presentationWindow && !presentationWindow.isDestroyed()) {
    presentationWindow.webContents.send('presentation:stateUpdate', state)
    return { success: true }
  }
  return { success: false }
})

// Presentation Mode - Update bounds (from main window's bounding box)
ipcMain.handle('presentation:updateBounds', async (_event, bounds: unknown) => {
  if (presentationWindow && !presentationWindow.isDestroyed()) {
    presentationWindow.webContents.send('presentation:boundsUpdate', bounds)
    return { success: true }
  }
  return { success: false }
})

// Presentation Mode - Request state (from presentation window)
ipcMain.handle('presentation:requestState', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('presentation:requestState')
    return { success: true }
  }
  return { success: false }
})

// App lifecycle
app.whenReady().then(() => {
  registerLocalFileProtocol()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
