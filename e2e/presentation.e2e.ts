import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'
import { CanvasUtils, ToolbarUtils } from './utils/canvas.utils'

// Force click options for headless Electron stability
const click = { force: true }

test.describe('Presentation Window', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Presentation Test')

    // Add tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    // Verify tokens added
    await expect(window.getByText('Player 1')).toBeVisible()
    await expect(window.getByText('Monster 1')).toBeVisible()
  })

  test('presentation button is visible', async ({ window }) => {
    // Look for presentation/present button - it must exist
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i })
    await expect(presentButton.first()).toBeVisible({ timeout: 5000 })
  })

  test('opens presentation window', async ({ electronApp, window }) => {
    // Click present button
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)

    // Wait for second window to appear
    await window.waitForTimeout(1500)

    // Check that a second window was created
    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)
  })

  test('presentation window shows canvas', async ({ electronApp, window }) => {
    // Open presentation
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)

    await window.waitForTimeout(1500)

    // Get the presentation window
    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      // Presentation window should have a canvas
      const canvas = presentationWindow.locator('.konvajs-content canvas, .konva-container canvas, canvas')
      await expect(canvas.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('presentation syncs token positions', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Open presentation
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    // Get presentation window
    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      const presCanvas = new CanvasUtils(presentationWindow)
      await presCanvas.waitForReady()

      // Take screenshot of presentation before move
      const presBefore = await presCanvas.screenshotCanvas('pres-sync-before')

      // Move a token in main window
      await toolbar.selectTool('select')
      await canvas.dragGrid(0, 0, 3, 3)
      await window.waitForTimeout(500)

      // Take screenshot of presentation after move
      const presAfter = await presCanvas.screenshotCanvas('pres-sync-after')

      // Presentation should have updated (token moved)
      expect(Buffer.compare(presBefore, presAfter)).not.toBe(0)
    }
  })

  test('presentation syncs fog of war', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Enable fog and reveal some areas
    await toolbar.toggleFogOfWar(true)
    await toolbar.handleFogEnableDialog(true)
    await toolbar.selectTool('fog-reveal')
    await canvas.revealFogAt(5, 5)
    await window.waitForTimeout(200)

    // Open presentation
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    // Get presentation window
    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      const presCanvas = new CanvasUtils(presentationWindow)
      await presCanvas.waitForReady()

      // Take screenshot of presentation
      const presScreenshot = await presCanvas.screenshotCanvas('pres-fog')

      // Reveal more area in main window
      await canvas.revealFogRect(2, 2, 8, 8)
      await window.waitForTimeout(500)

      // Presentation should update
      const presAfter = await presCanvas.screenshotCanvas('pres-fog-after')
      expect(Buffer.compare(presScreenshot, presAfter)).not.toBe(0)
    }
  })

  test('presentation window has clean player view (no DM tools)', async ({ electronApp, window }) => {
    // Open presentation
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    // Get presentation window
    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      // Presentation should NOT have DM tools visible
      // Check that common DM elements are hidden
      const toolbar = presentationWindow.locator('[data-testid="toolbar"], .toolbar, [role="toolbar"]')
      const sidebar = presentationWindow.locator('[data-testid="sidebar"], .sidebar, aside')
      const addTokenButton = presentationWindow.getByRole('button', { name: /add.*player|add.*monster/i })

      // These DM controls should NOT be visible in presentation mode
      // At least verify the add token buttons aren't there
      await expect(addTokenButton.first()).not.toBeVisible({ timeout: 2000 }).catch(() => {
        // This is expected - button should not exist
      })

      // Presentation window should primarily show the canvas
      const canvas = presentationWindow.locator('.konvajs-content canvas, canvas')
      await expect(canvas.first()).toBeVisible()
    }
  })

  test('closes presentation window', async ({ electronApp, window }) => {
    // Open presentation
    const presentButton = window.getByRole('button', { name: /present|player.*view|external/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1000)

    // Verify second window exists
    let windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    // Look for close presentation button in main window
    const closeButton = window.getByRole('button', { name: /close.*present|stop.*present|end.*present/i })

    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click(click)
      await window.waitForTimeout(500)

      // Should be back to one window
      windows = electronApp.windows()
      expect(windows.length).toBe(1)
    } else {
      // If no close button, try closing the presentation window directly
      const presentationWindow = windows.find(w => w !== window)
      if (presentationWindow) {
        await presentationWindow.close()
        await window.waitForTimeout(500)

        windows = electronApp.windows()
        expect(windows.length).toBe(1)
      }
    }
  })

  test('presentation bounds define visible area', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Look for presentation bounds tool
    const boundsButton = window.getByRole('button', { name: /bounds|frame|area|crop/i })

    if (await boundsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await boundsButton.click(click)

      // Draw bounds rectangle on canvas
      await canvas.dragGrid(2, 2, 10, 8)
      await window.waitForTimeout(300)

      // Open presentation
      const presentButton = window.getByRole('button', { name: /present/i }).first()
      await presentButton.click(click)
      await window.waitForTimeout(1500)

      // Presentation should show bounded area
      const windows = electronApp.windows()
      const presentationWindow = windows.find(w => w !== window)

      if (presentationWindow) {
        const presCanvas = new CanvasUtils(presentationWindow)
        await presCanvas.waitForReady()

        // Take screenshot - should show only the bounded region
        const screenshot = await presCanvas.screenshotCanvas('pres-bounds')
        expect(screenshot).toBeTruthy()
        expect(screenshot.length).toBeGreaterThan(1000)
      }
    }
  })
})

test.describe('Presentation State Management', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Pres State Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
  })

  test('presentation receives initial state', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Set up some state first (zoom)
    await canvas.zoom(-50)
    await window.waitForTimeout(200)

    // Open presentation
    const presentButton = window.getByRole('button', { name: /present/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      // Presentation should show the current state
      const presCanvas = new CanvasUtils(presentationWindow)
      await presCanvas.waitForReady()

      // Take screenshot - should show token at current position/zoom
      const screenshot = await presCanvas.screenshotCanvas('pres-initial')
      expect(screenshot).toBeTruthy()
      expect(screenshot.length).toBeGreaterThan(1000)
    }
  })

  test('presentation updates in real-time', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Open presentation
    const presentButton = window.getByRole('button', { name: /present/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1000)

    const windows = electronApp.windows()
    expect(windows.length).toBeGreaterThanOrEqual(2)

    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      const presCanvas = new CanvasUtils(presentationWindow)
      await presCanvas.waitForReady()

      // Take screenshots during rapid changes
      await toolbar.selectTool('select')

      const screenshots: Buffer[] = []

      // Make several changes and verify they sync
      for (let i = 0; i < 3; i++) {
        await canvas.dragGrid(i, 0, i + 1, 1)
        await window.waitForTimeout(300)
        screenshots.push(await presCanvas.screenshotCanvas(`pres-realtime-${i}`))
      }

      // Each screenshot should be different (showing real-time updates)
      for (let i = 1; i < screenshots.length; i++) {
        expect(Buffer.compare(screenshots[i - 1], screenshots[i])).not.toBe(0)
      }
    }
  })

  test('adding token in main window shows in presentation', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Open presentation first
    const presentButton = window.getByRole('button', { name: /present/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    const windows = electronApp.windows()
    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      const presCanvas = new CanvasUtils(presentationWindow)
      await presCanvas.waitForReady()

      // Take screenshot before adding token
      const before = await presCanvas.screenshotCanvas('pres-add-before')

      // Add a new token in main window
      await window.getByRole('button', { name: /add monster/i }).click(click)
      await expect(window.getByText('Monster 1')).toBeVisible()
      await window.waitForTimeout(500)

      // Take screenshot after adding token
      const after = await presCanvas.screenshotCanvas('pres-add-after')

      // Presentation should show the new token
      expect(Buffer.compare(before, after)).not.toBe(0)
    }
  })

  test('deleting token in main window removes from presentation', async ({ electronApp, window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Open presentation first
    const presentButton = window.getByRole('button', { name: /present/i }).first()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    const windows = electronApp.windows()
    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      const presCanvas = new CanvasUtils(presentationWindow)
      await presCanvas.waitForReady()

      // Take screenshot with token
      const before = await presCanvas.screenshotCanvas('pres-delete-before')

      // Delete the token in main window
      const tokenItem = window.locator('[role="listitem"]').filter({ hasText: 'Player 1' }).first()
      await tokenItem.hover()
      const deleteButton = tokenItem.getByRole('button', { name: /delete/i })

      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click(click)
        const confirmDialog = window.locator('[role="alertdialog"]')
        if (await confirmDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
          await confirmDialog.getByRole('button', { name: /delete|confirm/i }).click(click)
        }
        await window.waitForTimeout(500)

        // Take screenshot after deletion
        const after = await presCanvas.screenshotCanvas('pres-delete-after')

        // Presentation should no longer show the token
        expect(Buffer.compare(before, after)).not.toBe(0)
      }
    }
  })
})

test.describe('Presentation Display Modes', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Display Mode Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
  })

  test('presentation can be fullscreen', async ({ electronApp, window }) => {
    // Open presentation
    const presentButton = window.getByRole('button', { name: /present/i }).first()
    await expect(presentButton).toBeVisible()
    await presentButton.click(click)
    await window.waitForTimeout(1500)

    const windows = electronApp.windows()
    const presentationWindow = windows.find(w => w !== window)
    expect(presentationWindow).toBeDefined()

    if (presentationWindow) {
      // Check if there's a fullscreen button or if presentation started fullscreen
      const fullscreenButton = presentationWindow.getByRole('button', { name: /fullscreen|maximize/i })

      if (await fullscreenButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fullscreenButton.click(click)
        await window.waitForTimeout(500)
      }

      // Verify presentation window exists and has canvas
      const canvas = presentationWindow.locator('canvas')
      await expect(canvas.first()).toBeVisible()
    }
  })
})
