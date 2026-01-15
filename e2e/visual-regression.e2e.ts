import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'
import { CanvasUtils, ToolbarUtils } from './utils/canvas.utils'

// Force click options for headless Electron stability
const click = { force: true }

/**
 * Visual Regression Tests
 *
 * These tests use Playwright's built-in visual comparison with baseline images.
 * Run `npm run test:e2e:update-snapshots` to generate/update baseline images.
 *
 * Baseline images are stored in e2e/__snapshots__/
 */

test.describe('Visual Regression - Empty State', () => {
  test('welcome screen renders correctly', async ({ window }) => {
    // Wait for app to load
    await window.waitForSelector('.welcome-screen, [data-testid="welcome-screen"]', {
      timeout: 10000
    })

    await expect(window).toHaveScreenshot('welcome-screen.png', {
      maxDiffPixels: 200,
      threshold: 0.2
    })
  })
})

test.describe('Visual Regression - Canvas with Tokens', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Visual Regression Test')
  })

  test('empty canvas state', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Capture empty canvas with grid
    await expect(window).toHaveScreenshot('canvas-empty.png', {
      maxDiffPixels: 150,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('canvas with single token', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add a PC token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('canvas-single-token.png', {
      maxDiffPixels: 150,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('canvas with multiple tokens', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add multiple tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(100)
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('canvas-multiple-tokens.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('token selection ring', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Add and select a token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(200)

    await toolbar.selectTool('select')
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(200)

    await expect(window).toHaveScreenshot('token-selected.png', {
      maxDiffPixels: 150,
      clip: await canvas.getCanvasBounds()
    })
  })
})

test.describe('Visual Regression - Fog of War', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Fog Visual Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
  })

  test('fog fully covering canvas', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Enable fog
    await toolbar.toggleFogOfWar(true)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('fog-full-coverage.png', {
      maxDiffPixels: 100,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('fog with circular reveal', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Enable fog and reveal an area
    await toolbar.toggleFogOfWar(true)
    await toolbar.selectTool('fog-reveal')
    await canvas.revealFogAt(3, 3)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('fog-circle-reveal.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('fog with rectangle reveal', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Enable fog and reveal a rectangle
    await toolbar.toggleFogOfWar(true)
    await toolbar.selectTool('fog-reveal')

    // Select rectangle brush - this should be available when fog tools are active
    const rectButton = window.getByRole('button', { name: /rectangle|square/i })
    await expect(rectButton).toBeVisible({ timeout: 5000 })
    await rectButton.click(click)
    await window.waitForTimeout(100)

    await canvas.revealFogRect(2, 2, 6, 5)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('fog-rect-reveal.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('fog with multiple reveals', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Enable fog and reveal multiple areas
    await toolbar.toggleFogOfWar(true)
    await toolbar.selectTool('fog-reveal')

    await canvas.revealFogAt(2, 2)
    await canvas.revealFogAt(5, 3)
    await canvas.revealFogAt(3, 5)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('fog-multiple-reveals.png', {
      maxDiffPixels: 250,
      clip: await canvas.getCanvasBounds()
    })
  })
})

test.describe('Visual Regression - Token Sizes', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Token Sizes Test')
  })

  test('medium size token (1x1)', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Default PC is medium
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('token-medium.png', {
      maxDiffPixels: 150,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('large size token (2x2)', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Add a monster token (can be resized)
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await window.waitForTimeout(200)

    // Select and edit the token to change size
    await toolbar.selectTool('select')
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(100)

    // Open token editor via double-click or context menu
    const tokenElement = window.locator('.konvajs-content canvas')
    await expect(tokenElement).toBeVisible({ timeout: 5000 })
    await tokenElement.dblclick()
    await window.waitForTimeout(200)

    // Find and change size dropdown - must be visible for this test
    const sizeSelect = window.getByRole('combobox', { name: /size/i })
      .or(window.locator('select').filter({ hasText: /medium|large|huge/i }))
      .or(window.getByLabel(/size/i))

    await expect(sizeSelect).toBeVisible({ timeout: 5000 })
    await sizeSelect.selectOption('large')
    await window.waitForTimeout(100)

    // Save changes
    const saveButton = window.getByRole('button', { name: /save|apply|confirm/i })
    await expect(saveButton).toBeVisible({ timeout: 5000 })
    await saveButton.click(click)
    await window.waitForTimeout(200)

    // Verify token was resized
    await expect(window).toHaveScreenshot('token-large.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('multiple tokens of different sizes', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add multiple tokens - they will be at their default sizes
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(100)
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await window.waitForTimeout(100)
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('tokens-multiple-sizes.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })
})

test.describe('Visual Regression - Health States', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Health Visual Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
  })

  test('token at full health', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Default token should be at full health
    await expect(window).toHaveScreenshot('token-full-health.png', {
      maxDiffPixels: 150,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('token at reduced health', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Select the token to edit it
    await toolbar.selectTool('select')
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(100)

    // Open token editor
    const tokenElement = window.locator('.konvajs-content canvas')
    await expect(tokenElement).toBeVisible({ timeout: 5000 })
    await tokenElement.dblclick()
    await window.waitForTimeout(200)

    // Find HP input and reduce health
    const currentHpInput = window.getByLabel(/current hp|current health/i)
      .or(window.locator('input[name*="currentHp"]'))
      .or(window.locator('input[type="number"]').first())

    await expect(currentHpInput).toBeVisible({ timeout: 5000 })
    await currentHpInput.fill('5') // Low HP value
    await window.waitForTimeout(100)

    // Save changes
    const saveButton = window.getByRole('button', { name: /save|apply|confirm/i })
    await expect(saveButton).toBeVisible({ timeout: 5000 })
    await saveButton.click(click)
    await window.waitForTimeout(200)

    // Verify health bar visual change
    await expect(window).toHaveScreenshot('token-reduced-health.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('token at critical health (bloodied)', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Select and edit the token
    await toolbar.selectTool('select')
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(100)

    const tokenElement = window.locator('.konvajs-content canvas')
    await expect(tokenElement).toBeVisible({ timeout: 5000 })
    await tokenElement.dblclick()
    await window.waitForTimeout(200)

    // Set HP to 1 (critical)
    const currentHpInput = window.getByLabel(/current hp|current health/i)
      .or(window.locator('input[name*="currentHp"]'))
      .or(window.locator('input[type="number"]').first())

    await expect(currentHpInput).toBeVisible({ timeout: 5000 })
    await currentHpInput.fill('1')
    await window.waitForTimeout(100)

    const saveButton = window.getByRole('button', { name: /save|apply|confirm/i })
    await expect(saveButton).toBeVisible({ timeout: 5000 })
    await saveButton.click(click)
    await window.waitForTimeout(200)

    // Verify critical health visual
    await expect(window).toHaveScreenshot('token-critical-health.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })
})

test.describe('Visual Regression - Zoom Levels', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Zoom Visual Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
  })

  test('canvas at default zoom (100%)', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    await expect(window).toHaveScreenshot('zoom-default.png', {
      maxDiffPixels: 150,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('canvas zoomed in', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Zoom in
    await canvas.zoom(-200) // Multiple scroll events for noticeable zoom
    await canvas.zoom(-200)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('zoom-in.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('canvas zoomed out', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Zoom out
    await canvas.zoom(200)
    await canvas.zoom(200)
    await window.waitForTimeout(300)

    await expect(window).toHaveScreenshot('zoom-out.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })
})

test.describe('Visual Regression - UI Components', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('UI Visual Test')
  })

  test('toolbar renders correctly', async ({ window }) => {
    // Wait for toolbar to be visible
    const toolbar = window.locator('[data-testid="toolbar"], .toolbar').first()
    await expect(toolbar).toBeVisible({ timeout: 5000 })

    const toolbarBounds = await toolbar.boundingBox()
    // Fail explicitly if toolbar has no measurable bounds
    expect(toolbarBounds).not.toBeNull()
    expect(toolbarBounds!.width).toBeGreaterThan(0)
    expect(toolbarBounds!.height).toBeGreaterThan(0)

    await expect(window).toHaveScreenshot('toolbar.png', {
      maxDiffPixels: 100,
      clip: toolbarBounds!
    })
  })

  test('sidebar renders correctly', async ({ window }) => {
    // Sidebar must be visible for this test to pass
    const sidebar = window.locator('[data-testid="sidebar"], .sidebar').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })

    const sidebarBounds = await sidebar.boundingBox()
    // Fail explicitly if sidebar has no measurable bounds
    expect(sidebarBounds).not.toBeNull()
    expect(sidebarBounds!.width).toBeGreaterThan(0)
    expect(sidebarBounds!.height).toBeGreaterThan(0)

    await expect(window).toHaveScreenshot('sidebar.png', {
      maxDiffPixels: 100,
      clip: sidebarBounds!
    })
  })

  test('sidebar shows correct panels', async ({ window }) => {
    // Verify sidebar contains expected panel sections
    const sidebar = window.locator('[data-testid="sidebar"], .sidebar').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })

    // Check for common sidebar elements
    const mapPanel = sidebar.locator('[data-testid="map-panel"], .map-panel, text=Map').first()
    const libraryPanel = sidebar.locator('[data-testid="library-panel"], .library-panel, text=Library').first()

    // At least one of these panels should be visible in the sidebar
    const mapVisible = await mapPanel.isVisible()
    const libraryVisible = await libraryPanel.isVisible()
    expect(mapVisible || libraryVisible).toBe(true)
  })
})
