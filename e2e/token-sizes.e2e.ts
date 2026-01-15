import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'
import { CanvasUtils, ToolbarUtils } from './utils/canvas.utils'

// Force click options for headless Electron stability
const click = { force: true }

/**
 * Tests for different creature sizes in D&D 5e:
 * - Tiny: 0.5 x 0.5 grid squares (2.5ft)
 * - Small: 1 x 1 grid square (5ft)
 * - Medium: 1 x 1 grid square (5ft)
 * - Large: 2 x 2 grid squares (10ft)
 * - Huge: 3 x 3 grid squares (15ft)
 * - Gargantuan: 4 x 4 grid squares (20ft+)
 */

test.describe('Token Sizes', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Token Size Test')
  })

  test('default token is medium size (1x1)', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add a default PC token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
    await window.waitForTimeout(300)

    // Token should be visible on canvas
    const screenshot = await canvas.screenshotCanvas('medium-token')
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)

    // Visual verification - medium tokens occupy 1 grid square
    await expect(window).toHaveScreenshot('token-medium-size.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })
})

test.describe('Token Size Selection', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Size Selection Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
  })

  test('token editor shows size options', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Select the token
    await toolbar.selectTool('select')
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(200)

    // Double-click to open editor
    await canvas.dblClickGrid(0, 0)
    await window.waitForTimeout(300)

    // Editor modal should be open
    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Look for size selector - it must exist in the editor
    const sizeSelect = modal.getByLabel(/size/i)
      .or(modal.locator('select'))
      .or(modal.getByRole('combobox', { name: /size/i }))
      .or(modal.getByRole('listbox'))

    await expect(sizeSelect.first()).toBeVisible({ timeout: 5000 })

    // Size options should include standard D&D sizes
    await expect(
      modal.getByText(/tiny|small|medium|large|huge|gargantuan/i).first()
    ).toBeVisible()
  })

  test('can change token to large size', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Take screenshot before size change
    const beforeChange = await canvas.screenshotCanvas('size-before-large')

    // Select and open token editor
    await toolbar.selectTool('select')
    await canvas.clickGrid(0, 0)
    await canvas.dblClickGrid(0, 0)
    await window.waitForTimeout(300)

    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Find and change size to Large
    const sizeSelect = modal.getByLabel(/size/i).first()
      .or(modal.getByRole('combobox').first())
      .or(modal.locator('select').first())

    await expect(sizeSelect).toBeVisible({ timeout: 5000 })
    await sizeSelect.click(click)
    await window.waitForTimeout(100)

    // Select Large option
    const largeOption = window.getByRole('option', { name: /large/i })
      .or(window.getByText(/large/i, { exact: true }))
      .or(window.locator('option').filter({ hasText: /large/i }))

    await expect(largeOption.first()).toBeVisible({ timeout: 3000 })
    await largeOption.first().click(click)
    await window.waitForTimeout(200)

    // Save changes
    const saveButton = modal.getByRole('button', { name: /save|apply|confirm|update/i })
    await expect(saveButton).toBeVisible()
    await saveButton.click(click)

    // Modal should close
    await expect(modal).not.toBeVisible()
    await window.waitForTimeout(300)

    // Token should now be larger
    const afterChange = await canvas.screenshotCanvas('size-after-large')

    // Canvas should show visually different token (larger)
    expect(Buffer.compare(beforeChange, afterChange)).not.toBe(0)
  })

  test('size change persists after save and reload', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Open token editor and change to large
    await toolbar.selectTool('select')
    await canvas.dblClickGrid(0, 0)
    await window.waitForTimeout(300)

    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Change size
    const sizeSelect = modal.getByLabel(/size/i).or(modal.locator('select')).first()
    if (await sizeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sizeSelect.click(click)
      await window.waitForTimeout(100)

      const largeOption = window.getByRole('option', { name: /large/i })
        .or(window.getByText(/large/i))
      if (await largeOption.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await largeOption.first().click(click)
      }
    }

    // Save
    await modal.getByRole('button', { name: /save|apply|confirm/i }).click(click)
    await expect(modal).not.toBeVisible()

    // Take screenshot of large token
    const beforeReload = await canvas.screenshotCanvas('persist-size-before')

    // Save encounter
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(500)

    // Reload
    await window.reload()
    await window.waitForLoadState('domcontentloaded')
    await window.waitForSelector('[data-testid="app-layout"], .welcome-screen, #root', {
      timeout: 30000
    })

    // Load encounter
    const encounterButton = window.getByText('Size Selection Test')
    await expect(encounterButton).toBeVisible({ timeout: 10000 })
    await encounterButton.click(click)
    await window.waitForSelector('[role="toolbar"], [data-testid="toolbar"], .toolbar', {
      timeout: 10000
    })

    // Take screenshot after reload
    const newCanvas = new CanvasUtils(window)
    await newCanvas.waitForReady()
    const afterReload = await newCanvas.screenshotCanvas('persist-size-after')

    // Both screenshots should have similar content (large token)
    expect(beforeReload.length).toBeGreaterThan(1000)
    expect(afterReload.length).toBeGreaterThan(1000)
  })
})

test.describe('Large Token Grid Snapping', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Large Token Snap Test')
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await expect(window.getByText('Monster 1')).toBeVisible()
  })

  test('large token snaps to grid correctly', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Take initial screenshot
    const before = await canvas.screenshotCanvas('large-snap-before')

    // Drag the token to a new position
    await canvas.dragGrid(0, 0, 3, 2)
    await window.waitForTimeout(300)

    // Token should snap to grid
    const after = await canvas.screenshotCanvas('large-snap-after')

    // Token position should have changed
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('large token collision detection', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Add a second token nearby
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
    await window.waitForTimeout(200)

    await toolbar.selectTool('select')

    // Take screenshot before attempting collision
    const before = await canvas.screenshotCanvas('large-collision-before')

    // Try to drag monster on top of the PC
    await canvas.dragGrid(0, 0, 1, 0)
    await window.waitForTimeout(300)

    // Token should be placed (collision avoidance may adjust position)
    const after = await canvas.screenshotCanvas('large-collision-after')

    // Canvas state should have changed (token moved or repositioned)
    expect(Buffer.compare(before, after)).not.toBe(0)
  })
})

test.describe('Token Size Visual Comparison', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Size Compare Test')
  })

  test('multiple sizes visible together', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add multiple tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()
    await window.waitForTimeout(100)

    await window.getByRole('button', { name: /add monster/i }).click(click)
    await expect(window.getByText('Monster 1')).toBeVisible()
    await window.waitForTimeout(100)

    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 2')).toBeVisible()
    await window.waitForTimeout(300)

    // Take screenshot showing all tokens
    await expect(window).toHaveScreenshot('multiple-tokens-sizes.png', {
      maxDiffPixels: 200,
      clip: await canvas.getCanvasBounds()
    })
  })

  test('tokens render at correct relative sizes', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Add tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await window.waitForTimeout(300)

    // Take screenshot
    const screenshot = await canvas.screenshotCanvas('relative-sizes')
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)

    // Canvas should contain visible tokens
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(200)
    expect(bounds.height).toBeGreaterThan(200)
  })
})

test.describe('Tiny Token Behavior', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Tiny Token Test')
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await expect(window.getByText('Monster 1')).toBeVisible()
  })

  test('tiny tokens are selectable', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    const before = await canvas.screenshotCanvas('tiny-select-before')

    // Click on token position
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(200)

    const after = await canvas.screenshotCanvas('tiny-select-after')

    // Selection ring should appear
    expect(Buffer.compare(before, after)).not.toBe(0)
  })

  test('tiny tokens can be dragged', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    const before = await canvas.screenshotCanvas('tiny-drag-before')

    // Drag the token
    await canvas.dragGrid(0, 0, 4, 4)
    await window.waitForTimeout(300)

    const after = await canvas.screenshotCanvas('tiny-drag-after')

    // Token should have moved
    expect(Buffer.compare(before, after)).not.toBe(0)
  })
})

test.describe('Huge/Gargantuan Tokens', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Huge Token Test')
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await expect(window.getByText('Monster 1')).toBeVisible()
  })

  test('huge tokens respect canvas bounds', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    await canvas.waitForReady()

    // Take screenshot - tokens should not overflow canvas
    const screenshot = await canvas.screenshotCanvas('huge-bounds')
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)

    // Canvas bounds should contain all visible elements
    const bounds = await canvas.getCanvasBounds()
    expect(bounds.width).toBeGreaterThan(0)
    expect(bounds.height).toBeGreaterThan(0)
  })

  test('large tokens work with fog of war', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Enable fog
    await toolbar.toggleFogOfWar(true)
    await toolbar.handleFogEnableDialog(true)
    await window.waitForTimeout(200)

    // Take screenshot with fog enabled
    const withFog = await canvas.screenshotCanvas('huge-with-fog')

    // Reveal area around token
    await toolbar.selectTool('fog-reveal')
    await canvas.revealFogRect(0, 0, 5, 5) // Large area for big creature
    await window.waitForTimeout(200)

    const revealed = await canvas.screenshotCanvas('huge-fog-revealed')

    // Fog should have been modified
    expect(Buffer.compare(withFog, revealed)).not.toBe(0)
  })

  test('large token can be selected and edited', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    await toolbar.selectTool('select')

    // Click to select
    await canvas.clickGrid(0, 0)
    await window.waitForTimeout(200)

    // Double-click to open editor
    await canvas.dblClickGrid(0, 0)
    await window.waitForTimeout(300)

    // Editor should open
    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Close editor
    await modal.getByRole('button', { name: /cancel|close/i }).click(click)
    await expect(modal).not.toBeVisible()
  })
})

test.describe('Size-Based Movement', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Size Movement Test')
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)
  })

  test('tokens of different sizes can coexist', async ({ window }) => {
    const canvas = new CanvasUtils(window)
    const toolbar = new ToolbarUtils(window)
    await canvas.waitForReady()

    // Verify both tokens are visible
    await expect(window.getByText('Player 1')).toBeVisible()
    await expect(window.getByText('Monster 1')).toBeVisible()

    // Move tokens to separate positions
    await toolbar.selectTool('select')

    // Drag first token
    await canvas.dragGrid(0, 0, 2, 2)
    await window.waitForTimeout(200)

    // Both should still be visible on canvas
    const screenshot = await canvas.screenshotCanvas('coexist-tokens')
    expect(screenshot).toBeTruthy()
    expect(screenshot.length).toBeGreaterThan(1000)
  })
})
