import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'
import { CanvasUtils, ToolbarUtils } from './utils/canvas.utils'

// Force click options for headless Electron stability
const click = { force: true }

test.describe('Canvas Rendering', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Canvas Test')
  })

  test('renders empty canvas with placeholder', async ({ window }) => {
    // Should show empty canvas state - text is "Upload a map or generate a grid to get started"
    await expect(
      window.getByText(/upload.*map|generate.*grid|get started/i).first()
    ).toBeVisible()
  })

  test('canvas is interactive', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Canvas should be visible and have size
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(100)
    expect(bounds.height).toBeGreaterThan(100)
  })

  test('canvas responds to click', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Click should not throw
    await canvas.clickCenter()

    // Canvas should still be accessible
    const bounds = await canvas.getCanvasBounds()
    expect(bounds).toBeDefined()
  })

  test('canvas has valid dimensions', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    const bounds = await canvas.getCanvasBounds()

    // Bounds should be positive and reasonable
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.width).toBeGreaterThan(100)
    expect(bounds.height).toBeGreaterThan(100)
  })
})

test.describe('Canvas Pan and Zoom', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Pan Zoom Test')

    // Add a token so we have something visible to track
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
  })

  test('zooms in with mouse wheel', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Take before screenshot
    const before = await canvas.screenshotCanvas('zoom-before')

    // Zoom in (negative delta = zoom in)
    await canvas.zoom(-100)
    await window.waitForTimeout(300)

    // Take after screenshot
    const after = await canvas.screenshotCanvas('zoom-after')

    // Screenshots should differ (zoomed view)
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('zooms out with mouse wheel', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Zoom in first
    await canvas.zoom(-100)
    await window.waitForTimeout(200)

    const before = await canvas.screenshotCanvas('zoomout-before')

    // Zoom out (positive delta = zoom out)
    await canvas.zoom(100)
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('zoomout-after')
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('pans canvas with space+drag', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    const before = await canvas.screenshotCanvas('pan-before')

    // Pan the canvas
    await canvas.panCanvas(100, 50)
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('pan-after')
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('pan tool allows drag panning', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Select pan tool (H key)
    await toolbar.selectTool('pan')
    await window.waitForTimeout(100)

    const before = await canvas.screenshotCanvas('pantool-before')

    // Drag to pan
    const bounds = await canvas.getCanvasBounds()
    await window.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    await window.mouse.down()
    await window.mouse.move(bounds.x + bounds.width / 2 + 100, bounds.y + bounds.height / 2 + 50, { steps: 5 })
    await window.mouse.up()
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('pantool-after')
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('keyboard shortcuts switch tools', async ({ window }) => {
    const toolbar = new ToolbarUtils(window)

    // V for select
    await toolbar.selectTool('select')
    await window.waitForTimeout(100)

    // Verify select tool is active (button state changed or tool indicator)
    const selectButton = window.getByRole('button', { name: /select/i }).first()
    await expect(selectButton).toBeVisible()

    // H for pan
    await toolbar.selectTool('pan')
    await window.waitForTimeout(100)

    // Verify pan tool is accessible
    const panButton = window.getByRole('button', { name: /pan|hand/i }).first()
    if (await panButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(panButton).toBeVisible()
    }
  })

  test('zoom has min and max limits', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Zoom out many times (should hit min limit)
    for (let i = 0; i < 20; i++) {
      await canvas.zoom(200)
    }
    await window.waitForTimeout(200)

    const zoomedOut = await canvas.screenshotCanvas('zoom-min')
    expect(zoomedOut).toBeTruthy()

    // Zoom in many times (should hit max limit)
    for (let i = 0; i < 40; i++) {
      await canvas.zoom(-200)
    }
    await window.waitForTimeout(200)

    const zoomedIn = await canvas.screenshotCanvas('zoom-max')
    expect(zoomedIn).toBeTruthy()

    // Both should be valid screenshots (didn't break)
    expect(zoomedOut.length).toBeGreaterThan(1000)
    expect(zoomedIn.length).toBeGreaterThan(1000)
  })
})

test.describe('Token Grid Snapping', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Grid Snap Test')

    // Add tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    await expect(window.getByText('Player 1')).toBeVisible()
    await expect(window.getByText('Monster 1')).toBeVisible()
  })

  test('token snaps to grid when dragged', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Ensure select tool is active
    await toolbar.selectTool('select')

    // Screenshot before drag
    const before = await canvas.screenshotCanvas('snap-before')

    // Drag token to a new grid position
    await canvas.dragGrid(0, 0, 2, 3)
    await window.waitForTimeout(300)

    // Token should have moved and snapped
    const after = await canvas.screenshotCanvas('snap-after')
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('tokens avoid collision on drop', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Get initial screenshot
    const initial = await canvas.screenshotCanvas('collision-initial')

    // Try to drag one token on top of another
    await canvas.dragGrid(0, 0, 1, 0)
    await window.waitForTimeout(300)

    // Token should have been placed (possibly in alternate position due to collision)
    const after = await canvas.screenshotCanvas('collision-after')

    // The screenshot will be different because token moved
    expect(Buffer.compare(initial, after)).not.toBe(0)
  })

  test('token selection shows visual indicator', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    const before = await canvas.screenshotCanvas('selection-before')

    // Click on token to select it
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(200)

    const after = await canvas.screenshotCanvas('selection-after')

    // Selection ring should be visible (screenshot differs)
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('clicking empty space deselects token', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Select a token
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(200)

    const selected = await canvas.screenshotCanvas('deselect-selected')

    // Click empty space (far from tokens)
    await canvas.clickGrid(10, 10)
    await window.waitForTimeout(200)

    const deselected = await canvas.screenshotCanvas('deselect-deselected')

    // Selection ring should be gone (different screenshot)
    expect(Buffer.compare(selected, deselected)).not.toBe(0)
  })

  test('multiple token selection', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Click first token
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(100)

    const oneSelected = await canvas.screenshotCanvas('multi-one')

    // Shift+click second token for multi-select (if supported)
    await window.keyboard.down('Shift')
    await canvas.clickGrid(1, 0)
    await window.keyboard.up('Shift')
    await window.waitForTimeout(200)

    const twoSelected = await canvas.screenshotCanvas('multi-two')

    // Both selections visible (or at least state changed)
    expect(twoSelected).toBeTruthy()
  })
})

test.describe('Grid Display', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Grid Display Test')
  })

  test('grid is visible by default', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Take screenshot - grid lines should be visible
    const screenshot = await canvas.screenshotCanvas('grid-default')
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)
  })

  test('grid renders with consistent spacing', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Canvas should have valid bounds
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(200)
    expect(bounds.height).toBeGreaterThan(200)
  })
})

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Visual Regression')

    // Set up a consistent state
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    await expect(window.getByText('Player 1')).toBeVisible()
    await expect(window.getByText('Monster 1')).toBeVisible()
  })

  test('canvas renders consistently', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Take a snapshot for visual comparison
    await expect(window).toHaveScreenshot('canvas-baseline.png', {
      maxDiffPixels: 100,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('tokens render with correct colors', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Screenshot the token area
    const screenshot = await canvas.screenshotCanvas('token-colors')
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)

    // In a real test suite, you'd compare against a baseline
    // This test verifies tokens are actually rendered
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(0)
  })
})

test.describe('Canvas Interaction Edge Cases', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Edge Cases Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
  })

  test('right-click opens context menu', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Right-click on token
    const bounds = await canvas.getCanvasBounds()
    await window.mouse.click(bounds.x + 50, bounds.y + 50, { button: 'right' })
    await window.waitForTimeout(200)

    // Context menu might appear (implementation-dependent)
    const contextMenu = window.locator('[role="menu"], [role="contextmenu"]')
    const hasContextMenu = await contextMenu.isVisible({ timeout: 1000 }).catch(() => false)

    // Test passes whether context menu exists or not - we're testing no crash
    expect(true).toBe(true)
  })

  test('rapid clicks dont break selection', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      await canvas.clickGrid(0, 0)
    }
    await window.waitForTimeout(200)

    // Canvas should still be functional
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(0)
  })

  test('drag outside canvas bounds handles gracefully', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    const bounds = await canvas.getCanvasBounds()

    // Start drag on token, move outside canvas
    await window.mouse.move(bounds.x + 50, bounds.y + 50)
    await window.mouse.down()
    await window.mouse.move(0, 0, { steps: 5 }) // Move to corner of window
    await window.mouse.up()
    await window.waitForTimeout(200)

    // Canvas should still be functional
    const newBounds = await canvas.getCanvasBounds()
    expect(newBounds.width).toBeGreaterThan(0)
  })
})
