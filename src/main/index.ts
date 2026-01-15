import { app, BrowserWindow, ipcMain, dialog, screen, protocol, net, Menu, shell } from 'electron'
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

// Campaign directory helpers
function getCampaignsDir(): string {
  return path.join(app.getPath('userData'), 'campaigns')
}

function getCampaignsIndexPath(): string {
  return path.join(getCampaignsDir(), 'campaigns.json')
}

function getCampaignDir(campaignId: string): string {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }
  return path.join(getCampaignsDir(), campaignId)
}

function getCampaignPath(campaignId: string): string {
  return path.join(getCampaignDir(campaignId), 'campaign.json')
}

function getCampaignEncountersDir(campaignId: string): string {
  return path.join(getCampaignDir(campaignId), 'encounters')
}

function getCampaignLibraryDir(campaignId: string): string {
  return path.join(getCampaignDir(campaignId), 'library')
}

function getCampaignLibraryPath(campaignId: string): string {
  return path.join(getCampaignLibraryDir(campaignId), 'library.json')
}

function getCampaignLibraryAssetsDir(campaignId: string): string {
  return path.join(getCampaignLibraryDir(campaignId), 'assets')
}

function getCampaignImagesDir(campaignId: string, type: 'maps' | 'tokens'): string {
  return path.join(getCampaignDir(campaignId), 'images', type)
}

// Allowed directories for file access (security: prevent path traversal)
function getAllowedDirs(): string[] {
  return [
    getEncountersDir(),
    getMapsDir(),
    getTokensDir(),
    getLibraryDir(),
    getLibraryAssetsDir(),
    getCampaignsDir()
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

function createAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const githubUrl = 'https://github.com/hipsterusername/grimoire'

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    // File menu
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' as const } : { role: 'quit' as const }]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const }
            ]
          : [{ role: 'delete' as const }, { type: 'separator' as const }, { role: 'selectAll' as const }])
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [{ type: 'separator' as const }, { role: 'front' as const }]
          : [{ role: 'close' as const }])
      ]
    },
    // Help menu - customized for Grimoire
    {
      label: 'Help',
      submenu: [
        {
          label: 'Grimoire on GitHub',
          click: async () => {
            await shell.openExternal(githubUrl)
          }
        },
        {
          label: 'Report an Issue',
          click: async () => {
            await shell.openExternal(`${githubUrl}/issues`)
          }
        },
        {
          label: 'View Releases',
          click: async () => {
            await shell.openExternal(`${githubUrl}/releases`)
          }
        },
        { type: 'separator' as const },
        {
          label: 'Keyboard Shortcuts',
          click: async () => {
            await shell.openExternal(`${githubUrl}#keyboard-shortcuts`)
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
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

// ============================================
// Campaign IPC Handlers
// ============================================

interface CampaignData {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
}

interface CampaignListItem {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  encounterCount: number
  updatedAt: string
}

// Helper to update campaigns index
async function updateCampaignsIndex(): Promise<void> {
  const dir = getCampaignsDir()
  await fs.mkdir(dir, { recursive: true })

  const entries = await fs.readdir(dir, { withFileTypes: true })
  const campaigns: CampaignListItem[] = []

  for (const entry of entries) {
    if (entry.isDirectory() && isValidId(entry.name)) {
      try {
        const campaignPath = path.join(dir, entry.name, 'campaign.json')
        const content = await fs.readFile(campaignPath, 'utf-8')
        const campaign = JSON.parse(content) as CampaignData

        // Count encounters
        const encountersDir = path.join(dir, entry.name, 'encounters')
        let encounterCount = 0
        try {
          const encounterFiles = await fs.readdir(encountersDir)
          encounterCount = encounterFiles.filter((f) => f.endsWith('.json')).length
        } catch {
          // No encounters directory yet
        }

        campaigns.push({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          color: campaign.color,
          icon: campaign.icon,
          encounterCount,
          updatedAt: campaign.updatedAt
        })
      } catch {
        // Skip invalid campaign directories
      }
    }
  }

  // Sort by updatedAt descending
  campaigns.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  await fs.writeFile(getCampaignsIndexPath(), JSON.stringify({ version: 1, campaigns }, null, 2))
}

// Campaigns - List all campaigns
ipcMain.handle('campaigns:list', async () => {
  try {
    const indexPath = getCampaignsIndexPath()
    const content = await fs.readFile(indexPath, 'utf-8')
    const data = JSON.parse(content)
    return data.campaigns as CampaignListItem[]
  } catch {
    // Index doesn't exist yet - rebuild it
    await updateCampaignsIndex()
    try {
      const content = await fs.readFile(getCampaignsIndexPath(), 'utf-8')
      const data = JSON.parse(content)
      return data.campaigns as CampaignListItem[]
    } catch {
      return []
    }
  }
})

// Campaigns - Load single campaign
ipcMain.handle('campaigns:load', async (_event, id: string) => {
  if (!isValidId(id)) {
    throw new Error('Invalid campaign ID')
  }
  const filePath = getCampaignPath(id)
  const content = await fs.readFile(filePath, 'utf-8')
  const campaign = JSON.parse(content) as CampaignData

  // Update lastOpenedAt
  campaign.lastOpenedAt = new Date().toISOString()
  await fs.writeFile(filePath, JSON.stringify(campaign, null, 2))

  return campaign
})

// Campaigns - Create new campaign
ipcMain.handle('campaigns:create', async (_event, name: string, color?: string) => {
  const now = new Date().toISOString()
  const campaign: CampaignData = {
    id: crypto.randomUUID(),
    name,
    description: '',
    color: color ?? '#8b5cf6',
    createdAt: now,
    updatedAt: now
  }

  const campaignDir = getCampaignDir(campaign.id)
  await fs.mkdir(campaignDir, { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'encounters'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'library', 'assets'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'images', 'maps'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'images', 'tokens'), { recursive: true })

  // Write campaign.json
  await fs.writeFile(getCampaignPath(campaign.id), JSON.stringify(campaign, null, 2))

  // Initialize empty library
  await fs.writeFile(
    getCampaignLibraryPath(campaign.id),
    JSON.stringify({ version: 1, assets: [], templates: [] }, null, 2)
  )

  await updateCampaignsIndex()

  return campaign
})

// Campaigns - Update campaign
ipcMain.handle(
  'campaigns:update',
  async (_event, id: string, updates: Partial<CampaignData>) => {
    if (!isValidId(id)) {
      throw new Error('Invalid campaign ID')
    }
    const filePath = getCampaignPath(id)
    const content = await fs.readFile(filePath, 'utf-8')
    const campaign = JSON.parse(content) as CampaignData

    const updated = {
      ...campaign,
      ...updates,
      id, // Prevent ID from being changed
      updatedAt: new Date().toISOString()
    }

    await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    await updateCampaignsIndex()

    return updated
  }
)

// Campaigns - Delete campaign
ipcMain.handle('campaigns:delete', async (_event, id: string) => {
  if (!isValidId(id)) {
    throw new Error('Invalid campaign ID')
  }
  const campaignDir = getCampaignDir(id)
  await fs.rm(campaignDir, { recursive: true, force: true })
  await updateCampaignsIndex()

  return { success: true }
})

// Campaigns - List encounters for a campaign
ipcMain.handle('campaigns:listEncounters', async (_event, campaignId: string) => {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }
  const dir = getCampaignEncountersDir(campaignId)

  try {
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
  } catch {
    return []
  }
})

// Campaigns - Load encounter from campaign
ipcMain.handle(
  'campaigns:loadEncounter',
  async (_event, campaignId: string, encounterId: string) => {
    if (!isValidId(campaignId) || !isValidId(encounterId)) {
      throw new Error('Invalid ID')
    }
    const filePath = path.join(getCampaignEncountersDir(campaignId), `${encounterId}.json`)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  }
)

// Campaigns - Save encounter to campaign
ipcMain.handle('campaigns:saveEncounter', async (_event, campaignId: string, encounter) => {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }
  const dir = getCampaignEncountersDir(campaignId)
  await fs.mkdir(dir, { recursive: true })

  encounter.updatedAt = new Date().toISOString()
  const filePath = path.join(dir, `${encounter.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(encounter, null, 2))

  // Update campaign's updatedAt
  try {
    const campaignPath = getCampaignPath(campaignId)
    const campaignContent = await fs.readFile(campaignPath, 'utf-8')
    const campaign = JSON.parse(campaignContent) as CampaignData
    campaign.updatedAt = new Date().toISOString()
    await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2))
    await updateCampaignsIndex()
  } catch {
    // Non-fatal: campaign timestamp update failed
  }

  return { success: true }
})

// Campaigns - Delete encounter from campaign
ipcMain.handle(
  'campaigns:deleteEncounter',
  async (_event, campaignId: string, encounterId: string) => {
    if (!isValidId(campaignId) || !isValidId(encounterId)) {
      throw new Error('Invalid ID')
    }
    const filePath = path.join(getCampaignEncountersDir(campaignId), `${encounterId}.json`)
    await fs.unlink(filePath)
    await updateCampaignsIndex()

    return { success: true }
  }
)

// Campaigns - Load library
ipcMain.handle('campaigns:loadLibrary', async (_event, campaignId: string) => {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }
  try {
    const filePath = getCampaignLibraryPath(campaignId)
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
})

// Campaigns - Save library
ipcMain.handle('campaigns:saveLibrary', async (_event, campaignId: string, library: unknown) => {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }
  const dir = getCampaignLibraryDir(campaignId)
  await fs.mkdir(dir, { recursive: true })
  const filePath = getCampaignLibraryPath(campaignId)
  await fs.writeFile(filePath, JSON.stringify(library, null, 2))
  return { success: true }
})

// Campaigns - Save asset to campaign library
ipcMain.handle(
  'campaigns:saveAsset',
  async (
    _event,
    campaignId: string,
    { filename, dataUrl }: { filename: string; dataUrl: string }
  ) => {
    if (!isValidId(campaignId)) {
      throw new Error('Invalid campaign ID')
    }
    const dir = getCampaignLibraryAssetsDir(campaignId)
    await fs.mkdir(dir, { recursive: true })

    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(dir, uniqueFilename)

    const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid data URL format')
    }
    const buffer = Buffer.from(base64Match[1], 'base64')
    await fs.writeFile(filePath, buffer)

    return { path: filePath, filename: uniqueFilename }
  }
)

// Campaigns - Upload image to campaign
ipcMain.handle(
  'campaigns:uploadImage',
  async (_event, campaignId: string, type: 'map' | 'token') => {
    if (!isValidId(campaignId)) {
      throw new Error('Invalid campaign ID')
    }

    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
    })

    if (result.canceled || !result.filePaths[0]) {
      return null
    }

    const sourcePath = result.filePaths[0]
    const dir = getCampaignImagesDir(campaignId, type === 'map' ? 'maps' : 'tokens')
    await fs.mkdir(dir, { recursive: true })

    const filename = `${Date.now()}-${path.basename(sourcePath)}`
    const destPath = path.join(dir, filename)

    await fs.copyFile(sourcePath, destPath)

    return { path: destPath, filename }
  }
)

// Campaigns - Upload campaign icon
ipcMain.handle('campaigns:uploadIcon', async (_event, campaignId: string) => {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  })

  if (result.canceled || !result.filePaths[0]) {
    return null
  }

  const sourcePath = result.filePaths[0]
  const campaignDir = getCampaignDir(campaignId)
  await fs.mkdir(campaignDir, { recursive: true })

  // Use a fixed filename for the icon (replacing any existing one)
  const ext = path.extname(sourcePath)
  const iconFilename = `icon${ext}`
  const destPath = path.join(campaignDir, iconFilename)

  await fs.copyFile(sourcePath, destPath)

  // Update the campaign.json with the icon path
  const campaignPath = getCampaignPath(campaignId)
  const content = await fs.readFile(campaignPath, 'utf-8')
  const campaign = JSON.parse(content) as CampaignData
  campaign.icon = destPath
  campaign.updatedAt = new Date().toISOString()
  await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2))

  // Update the index
  await updateCampaignsIndex()

  return { path: destPath, filename: iconFilename }
})

// Campaigns - Remove campaign icon
ipcMain.handle('campaigns:removeIcon', async (_event, campaignId: string) => {
  if (!isValidId(campaignId)) {
    throw new Error('Invalid campaign ID')
  }

  // Update the campaign.json to remove the icon
  const campaignPath = getCampaignPath(campaignId)
  const content = await fs.readFile(campaignPath, 'utf-8')
  const campaign = JSON.parse(content) as CampaignData

  // Delete the icon file if it exists
  if (campaign.icon) {
    try {
      await fs.unlink(campaign.icon)
    } catch {
      // File may not exist, ignore
    }
  }

  delete campaign.icon
  campaign.updatedAt = new Date().toISOString()
  await fs.writeFile(campaignPath, JSON.stringify(campaign, null, 2))

  // Update the index
  await updateCampaignsIndex()

  return { success: true }
})

// Campaigns - Export campaign to .grimoire file
ipcMain.handle('campaigns:export', async (_event, id: string) => {
  if (!isValidId(id)) {
    throw new Error('Invalid campaign ID')
  }

  // Get campaign data
  const campaignPath = getCampaignPath(id)
  const campaignContent = await fs.readFile(campaignPath, 'utf-8')
  const campaign = JSON.parse(campaignContent) as CampaignData

  // Ask user where to save
  const result = await dialog.showSaveDialog({
    defaultPath: `${campaign.name.replace(/[^a-zA-Z0-9 ]/g, '_')}.grimoire`,
    filters: [{ name: 'Grimoire Campaign', extensions: ['grimoire'] }]
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  // Load encounters
  const encountersDir = getCampaignEncountersDir(id)
  const encounterFiles = await fs.readdir(encountersDir).catch(() => [])
  const encounters: Array<{ originalId: string }> = []

  for (const file of encounterFiles) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(encountersDir, file), 'utf-8')
      const encounter = JSON.parse(content)
      encounters.push({
        ...encounter,
        originalId: encounter.id
      })
    }
  }

  // Load library
  let library = { version: 1, assets: [], templates: [] }
  try {
    const libraryPath = getCampaignLibraryPath(id)
    const libraryContent = await fs.readFile(libraryPath, 'utf-8')
    library = JSON.parse(libraryContent)
  } catch {
    // Use empty library
  }

  // Load asset files as base64
  interface BundledAsset {
    id: string
    filename: string
    dataUrl: string
  }
  const bundledAssets: BundledAsset[] = []
  const assetsDir = getCampaignLibraryAssetsDir(id)

  try {
    const assetFiles = await fs.readdir(assetsDir)
    for (const filename of assetFiles) {
      const assetPath = path.join(assetsDir, filename)
      const data = await fs.readFile(assetPath)
      const ext = path.extname(filename).toLowerCase().slice(1)
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      bundledAssets.push({
        id: filename,
        filename,
        dataUrl: `data:${mimeType};base64,${data.toString('base64')}`
      })
    }
  } catch {
    // No assets directory
  }

  // Create bundle
  const bundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    campaign: {
      originalId: campaign.id,
      name: campaign.name,
      description: campaign.description,
      color: campaign.color,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    },
    encounters,
    library,
    assets: bundledAssets
  }

  await fs.writeFile(result.filePath, JSON.stringify(bundle, null, 2))

  return { success: true, path: result.filePath }
})

// Campaigns - Import campaign from .grimoire file
ipcMain.handle('campaigns:import', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Grimoire Campaign', extensions: ['grimoire'] }]
  })

  if (result.canceled || !result.filePaths[0]) {
    return null
  }

  const content = await fs.readFile(result.filePaths[0], 'utf-8')
  const bundle = JSON.parse(content)

  // Validate bundle version
  if (bundle.version !== 1) {
    throw new Error(`Unsupported bundle version: ${bundle.version}`)
  }

  // Create new campaign with new ID
  const now = new Date().toISOString()
  const newCampaign: CampaignData = {
    id: crypto.randomUUID(),
    name: bundle.campaign.name,
    description: bundle.campaign.description,
    color: bundle.campaign.color,
    createdAt: now,
    updatedAt: now
  }

  // Create directory structure
  const campaignDir = getCampaignDir(newCampaign.id)
  await fs.mkdir(campaignDir, { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'encounters'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'library', 'assets'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'images', 'maps'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'images', 'tokens'), { recursive: true })

  // Write campaign.json
  await fs.writeFile(getCampaignPath(newCampaign.id), JSON.stringify(newCampaign, null, 2))

  // Build asset ID mapping (old filename -> new path)
  const assetPathMap = new Map<string, string>()

  // Write bundled assets to disk
  for (const asset of bundle.assets || []) {
    const base64Match = asset.dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
    if (base64Match) {
      const buffer = Buffer.from(base64Match[1], 'base64')
      const newFilename = `${Date.now()}-${asset.filename}`
      const newPath = path.join(getCampaignLibraryAssetsDir(newCampaign.id), newFilename)
      await fs.writeFile(newPath, buffer)
      assetPathMap.set(asset.id, newPath)
    }
  }

  // Update library with new asset paths and write
  const library = bundle.library || { version: 1, assets: [], templates: [] }
  // Note: Asset references in library use paths that need updating
  // For now, we keep the library structure as-is since it uses assetId references
  await fs.writeFile(
    getCampaignLibraryPath(newCampaign.id),
    JSON.stringify(library, null, 2)
  )

  // Write encounters with new IDs
  for (const encounter of bundle.encounters || []) {
    const newEncounter = {
      ...encounter,
      id: crypto.randomUUID(),
      campaignId: newCampaign.id,
      createdAt: now,
      updatedAt: now
    }
    delete (newEncounter as { originalId?: string }).originalId
    const encounterPath = path.join(
      getCampaignEncountersDir(newCampaign.id),
      `${newEncounter.id}.json`
    )
    await fs.writeFile(encounterPath, JSON.stringify(newEncounter, null, 2))
  }

  await updateCampaignsIndex()

  return newCampaign
})

// Migration - Check if legacy data exists
ipcMain.handle('migration:check', async () => {
  const legacyEncountersDir = getEncountersDir()
  const migrationMarker = path.join(legacyEncountersDir, '.migrated')

  try {
    await fs.access(migrationMarker)
    return { needsMigration: false }
  } catch {
    // Check if legacy data exists
    try {
      const files = await fs.readdir(legacyEncountersDir)
      const hasEncounters = files.some((f) => f.endsWith('.json'))
      return { needsMigration: hasEncounters }
    } catch {
      return { needsMigration: false }
    }
  }
})

// Migration - Migrate legacy data to a new campaign
ipcMain.handle('migration:migrate', async (_event, campaignName: string) => {
  const now = new Date().toISOString()
  const campaign: CampaignData = {
    id: crypto.randomUUID(),
    name: campaignName,
    description: 'Migrated from legacy data',
    color: '#8b5cf6',
    createdAt: now,
    updatedAt: now
  }

  // Create campaign directory structure
  const campaignDir = getCampaignDir(campaign.id)
  await fs.mkdir(campaignDir, { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'encounters'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'library', 'assets'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'images', 'maps'), { recursive: true })
  await fs.mkdir(path.join(campaignDir, 'images', 'tokens'), { recursive: true })

  // Write campaign.json
  await fs.writeFile(getCampaignPath(campaign.id), JSON.stringify(campaign, null, 2))

  // Migrate encounters
  const legacyEncountersDir = getEncountersDir()
  try {
    const files = await fs.readdir(legacyEncountersDir)
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(legacyEncountersDir, file), 'utf-8')
        const encounter = JSON.parse(content)
        encounter.campaignId = campaign.id
        const newPath = path.join(getCampaignEncountersDir(campaign.id), file)
        await fs.writeFile(newPath, JSON.stringify(encounter, null, 2))
      }
    }
  } catch {
    // No encounters to migrate
  }

  // Migrate library
  try {
    const libraryContent = await fs.readFile(getLibraryPath(), 'utf-8')
    await fs.writeFile(getCampaignLibraryPath(campaign.id), libraryContent)
  } catch {
    // No library to migrate - create empty one
    await fs.writeFile(
      getCampaignLibraryPath(campaign.id),
      JSON.stringify({ version: 1, assets: [], templates: [] }, null, 2)
    )
  }

  // Migrate library assets
  try {
    const assetsDir = getLibraryAssetsDir()
    const assets = await fs.readdir(assetsDir)
    for (const asset of assets) {
      const sourcePath = path.join(assetsDir, asset)
      const destPath = path.join(getCampaignLibraryAssetsDir(campaign.id), asset)
      await fs.copyFile(sourcePath, destPath)
    }
  } catch {
    // No assets to migrate
  }

  // Migrate maps
  try {
    const mapsDir = getMapsDir()
    const maps = await fs.readdir(mapsDir)
    for (const mapFile of maps) {
      const sourcePath = path.join(mapsDir, mapFile)
      const destPath = path.join(getCampaignImagesDir(campaign.id, 'maps'), mapFile)
      await fs.copyFile(sourcePath, destPath)
    }
  } catch {
    // No maps to migrate
  }

  // Migrate tokens
  try {
    const tokensDir = getTokensDir()
    const tokens = await fs.readdir(tokensDir)
    for (const tokenFile of tokens) {
      const sourcePath = path.join(tokensDir, tokenFile)
      const destPath = path.join(getCampaignImagesDir(campaign.id, 'tokens'), tokenFile)
      await fs.copyFile(sourcePath, destPath)
    }
  } catch {
    // No tokens to migrate
  }

  // Mark migration complete
  await fs.writeFile(path.join(legacyEncountersDir, '.migrated'), now)

  await updateCampaignsIndex()

  return campaign
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
    // Notify main window that presentation closed (only if not destroyed)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('presentation:closed')
    }
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

// ============================================
// Settings IPC Handlers
// ============================================

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

// Settings - Load
ipcMain.handle('settings:load', async () => {
  try {
    const filePath = getSettingsPath()
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null // No settings yet - use defaults
  }
})

// Settings - Save
ipcMain.handle('settings:save', async (_event, settings: unknown) => {
  const filePath = getSettingsPath()
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2))
  return { success: true }
})

// App lifecycle
app.whenReady().then(() => {
  createAppMenu()
  registerLocalFileProtocol()
  createWindow()
})

// Clean up windows before quit to prevent "object destroyed" errors
app.on('before-quit', () => {
  // Close presentation window first if it exists
  if (presentationWindow && !presentationWindow.isDestroyed()) {
    presentationWindow.removeAllListeners('closed')
    presentationWindow.close()
    presentationWindow = null
  }
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
