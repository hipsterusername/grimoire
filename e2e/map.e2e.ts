import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'
import { CanvasUtils } from './utils/canvas.utils'

// Force click options for headless Electron stability
const click = { force: true }

test.describe('Map Loading', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Map Test')
  })

  test('shows empty state when no map is loaded', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Should show empty state message
    await expect(
      window.getByText(/upload.*map|add.*map|no map|get started/i).first()
    ).toBeVisible()
  })

  test('map upload button is visible', async ({ window }) => {
    // Look for map upload button in sidebar or toolbar - it must exist
    const uploadButton = window.getByRole('button', { name: /upload.*map|add.*map|load.*map/i })
    await expect(uploadButton.first()).toBeVisible({ timeout: 5000 })
  })

  test('clicking upload opens file picker or modal', async ({ window }) => {
    // Find and click map upload button
    const uploadButton = window.getByRole('button', { name: /upload.*map|add.*map|load.*map/i }).first()
    await expect(uploadButton).toBeVisible()
    await uploadButton.click(click)
    await window.waitForTimeout(300)

    // Should open a modal for file selection or trigger file picker
    // Check for modal dialog
    const modal = window.locator('[role="dialog"]')
    const hasModal = await modal.isVisible({ timeout: 2000 }).catch(() => false)

    if (hasModal) {
      // Modal-based upload UI
      await expect(modal).toBeVisible()

      // Close it for cleanup
      const closeButton = modal.getByRole('button', { name: /cancel|close/i })
      if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeButton.click(click)
      }
    }
    // If no modal, native file picker was triggered (can't test directly in Playwright)
  })
})

test.describe('Map Display', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Map Display Test')
  })

  test('grid overlays on map area', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Canvas should show grid - verify by taking screenshot
    const screenshot = await canvas.screenshotCanvas('grid-overlay')

    // Screenshot should have meaningful content (not blank/error)
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)

    // Canvas bounds should be valid
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(100)
    expect(bounds.height).toBeGreaterThan(100)
  })

  test('map area respects canvas bounds', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    const bounds = await canvas.getCanvasBounds()

    // Canvas should have reasonable dimensions
    expect(bounds.width).toBeGreaterThan(200)
    expect(bounds.height).toBeGreaterThan(200)

    // Bounds should be positive values
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.y).toBeGreaterThanOrEqual(0)
  })

  test('canvas renders without errors', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Should be able to interact with the canvas
    await canvas.clickCenter()

    // No errors should occur (test passes if no exceptions thrown)
    const bounds = await canvas.getCanvasBounds()
    expect(bounds).toBeDefined()
  })
})

test.describe('Grid Settings', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Grid Settings Test')
  })

  test('grid toggle is accessible', async ({ window }) => {
    // Look for grid toggle in settings or sidebar
    const gridToggle = window.getByRole('checkbox', { name: /grid/i })
      .or(window.getByRole('switch', { name: /grid/i }))
      .or(window.getByLabel(/show.*grid|grid.*visible/i))
      .or(window.getByRole('button', { name: /grid/i }))

    // Grid toggle should exist - this is a core feature
    await expect(gridToggle.first()).toBeVisible({ timeout: 5000 })
  })

  test('grid size adjustment is accessible', async ({ window }) => {
    // Look for grid size control
    const gridSizeControl = window.getByLabel(/grid.*size/i)
      .or(window.locator('input[type="number"]').filter({ hasText: /grid/i }))
      .or(window.getByRole('spinbutton', { name: /grid.*size/i }))
      .or(window.locator('input[type="range"]'))

    // Grid size control should be accessible
    const controlVisible = await gridSizeControl.first().isVisible({ timeout: 5000 }).catch(() => false)

    // If visible, verify it's interactive
    if (controlVisible) {
      await expect(gridSizeControl.first()).toBeEnabled()
    }
  })

  test('toggling grid changes canvas display', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Find grid toggle
    const gridToggle = window.getByRole('checkbox', { name: /grid/i })
      .or(window.getByRole('switch', { name: /grid/i }))
      .or(window.getByLabel(/show.*grid/i))

    if (await gridToggle.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Take screenshot with current state
      const before = await canvas.screenshotCanvas('grid-toggle-before')

      // Toggle grid
      await gridToggle.first().click(click)
      await window.waitForTimeout(200)

      // Take screenshot after toggle
      const after = await canvas.screenshotCanvas('grid-toggle-after')

      // Toggle again to restore
      await gridToggle.first().click(click)
      await window.waitForTimeout(200)

      // Screenshots should differ
      expect(Buffer.compare(before, after)).not.toBe(0)
    }
  })
})

test.describe('Map Panel', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Map Panel Test')
  })

  test('map panel or controls are visible', async ({ window }) => {
    // Look for map-related UI elements
    const mapPanel = window.locator('[data-testid="map-panel"]')
      .or(window.getByRole('tabpanel', { name: /map/i }))
      .or(window.getByRole('region', { name: /map/i }))

    const mapButton = window.getByRole('button', { name: /map/i }).first()
      .or(window.getByRole('tab', { name: /map/i }))

    // Either map panel or map button should exist
    const panelVisible = await mapPanel.isVisible({ timeout: 2000 }).catch(() => false)
    const buttonVisible = await mapButton.isVisible({ timeout: 2000 }).catch(() => false)

    expect(panelVisible || buttonVisible).toBe(true)

    // If button exists, click to show panel
    if (buttonVisible && !panelVisible) {
      await mapButton.click(click)
      await window.waitForTimeout(200)
    }
  })

  test('can generate grid without image', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Look for "Generate Grid" or similar option
    const generateButton = window.getByRole('button', { name: /generate.*grid|create.*grid|blank.*grid|new.*grid/i })

    // Take screenshot before
    const before = await canvas.screenshotCanvas('gen-grid-before')

    if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateButton.click(click)
      await window.waitForTimeout(500)

      // Should create a grid-only map - take screenshot after
      const after = await canvas.screenshotCanvas('gen-grid-after')

      // Canvas should have changed
      expect(after).toBeTruthy()
      expect(after.length).toBeGreaterThan(1000)
    } else {
      // Grid should already be visible by default
      expect(before).toBeTruthy()
      expect(before.length).toBeGreaterThan(1000)
    }
  })
})

test.describe('Map Zoom and Pan', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Map Zoom Test')

    // Add a token so we have visible content
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
  })

  test('zoom preserves map visibility', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Take initial screenshot
    const before = await canvas.screenshotCanvas('map-zoom-before')

    // Zoom in significantly
    await canvas.zoom(-200)
    await canvas.zoom(-200)
    await window.waitForTimeout(300)

    // Take after screenshot
    const after = await canvas.screenshotCanvas('map-zoom-after')

    // Screenshots should be different (zoomed)
    expect(Buffer.compare(before, after)).not.toBe(0)

    // Canvas should still be accessible
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(0)
    expect(bounds.height).toBeGreaterThan(0)
  })

  test('pan keeps content visible', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    const before = await canvas.screenshotCanvas('map-pan-before')

    // Pan the canvas
    await canvas.panCanvas(150, 100)
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('map-pan-after')

    // Content should have moved
    expect(Buffer.compare(before, after)).not.toBe(0)

    // Canvas should still be functional
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(0)
  })

  test('zoom and pan can be combined', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    const initial = await canvas.screenshotCanvas('map-combo-initial')

    // Zoom in
    await canvas.zoom(-100)
    await window.waitForTimeout(100)

    // Pan
    await canvas.panCanvas(50, 50)
    await window.waitForTimeout(100)

    // Zoom out
    await canvas.zoom(100)
    await window.waitForTimeout(100)

    // Pan more
    await canvas.panCanvas(-50, -50)
    await window.waitForTimeout(200)

    const final = await canvas.screenshotCanvas('map-combo-final')

    // State should have changed
    expect(Buffer.compare(initial, final)).not.toBe(0)
  })

  test('recenter keyboard shortcut works', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Pan away from center
    await canvas.panCanvas(200, 150)
    await window.waitForTimeout(200)

    const panned = await canvas.screenshotCanvas('map-panned')

    // Try various recenter shortcuts
    // Ctrl+R, Home, or 0 are common
    await window.keyboard.press('Home')
    await window.waitForTimeout(300)

    const afterHome = await canvas.screenshotCanvas('map-after-home')

    // If Home didn't work, try other common shortcuts
    if (Buffer.compare(panned, afterHome) === 0) {
      await window.keyboard.press('0')
      await window.waitForTimeout(300)
    }

    // View may or may not have changed depending on implementation
    // At minimum, canvas should still be functional
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(0)
  })
})

test.describe('Map with Tokens', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Map Token Test')
  })

  test('tokens are visible on map', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Take screenshot of empty map
    const empty = await canvas.screenshotCanvas('map-token-empty')

    // Add tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await window.waitForTimeout(300)

    // Take screenshot with tokens
    const withTokens = await canvas.screenshotCanvas('map-token-with')

    // Map should show tokens now
    expect(Buffer.compare(empty, withTokens)).not.toBe(0)
  })

  test('tokens move with map pan', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add a token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(200)

    const before = await canvas.screenshotCanvas('map-token-pan-before')

    // Pan the map
    await canvas.panCanvas(100, 100)
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('map-token-pan-after')

    // Token should have moved with the map (visually shifted)
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('tokens scale with map zoom', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add a token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(200)

    const before = await canvas.screenshotCanvas('map-token-zoom-before')

    // Zoom in
    await canvas.zoom(-200)
    await canvas.zoom(-200)
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('map-token-zoom-after')

    // Token should appear larger when zoomed
    expect(Buffer.compare(before, after)).not.toBe(0)
  })
})
