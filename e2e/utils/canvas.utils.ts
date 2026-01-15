import type { Page, Locator } from '@playwright/test'

/**
 * Canvas viewport state as read from the application
 */
export interface CanvasViewportState {
  zoom: number
  panX: number
  panY: number
  gridSize: number
}

/**
 * Canvas interaction utilities for testing Konva-based canvas
 */
export class CanvasUtils {
  readonly page: Page
  readonly canvas: Locator

  // Cached viewport state
  private _cachedViewport: CanvasViewportState | null = null

  constructor(page: Page) {
    this.page = page
    // The Konva stage renders to a canvas inside a container div
    // Note: react-konva creates a div with class "konvajs-content", not "konva-container"
    this.canvas = page.locator('.konvajs-content canvas, [class*="konva"] canvas, canvas').first()
  }

  /**
   * Read the current viewport state from the application's Zustand store.
   * This provides accurate zoom, pan, and grid information.
   */
  async getViewportState(): Promise<CanvasViewportState> {
    const state = await this.page.evaluate(() => {
      // Access Zustand stores via window (they persist state)
      // @ts-ignore - accessing internal store state
      const canvasStore = window.__ZUSTAND_CANVAS_STORE__
      // @ts-ignore
      const encounterStore = window.__ZUSTAND_ENCOUNTER_STORE__

      // Try to get state from stores if exposed, otherwise use defaults
      let zoom = 1
      let panX = 0
      let panY = 0
      let gridSize = 50

      // Try multiple methods to get the state
      try {
        // Method 1: Direct store access if exposed
        if (canvasStore) {
          const state = canvasStore.getState()
          zoom = state.view?.zoom ?? 1
          panX = state.view?.panX ?? 0
          panY = state.view?.panY ?? 0
        }

        // Method 2: Read from Konva stage transform
        const stage = document.querySelector('.konva-container canvas')?.parentElement
        if (stage) {
          // Konva stores transform in the stage's data
          const konvaStage = (stage as any)?.__konvaStage
          if (konvaStage) {
            zoom = konvaStage.scaleX() ?? zoom
            panX = konvaStage.x() ?? panX
            panY = konvaStage.y() ?? panY
          }
        }

        // Method 3: Parse from style/transform if available
        const stageElement = document.querySelector('[data-testid="konva-stage"]')
        if (stageElement) {
          const transform = window.getComputedStyle(stageElement).transform
          // Parse transform matrix if needed
        }

        // Get grid size from encounter if available
        if (encounterStore) {
          const encounter = encounterStore.getState().encounter
          gridSize = encounter?.map?.gridSettings?.gridSize ?? 50
        }
      } catch (e) {
        // Fallback to defaults
        console.warn('Could not read canvas state:', e)
      }

      return { zoom, panX, panY, gridSize }
    })

    this._cachedViewport = state
    return state
  }

  /**
   * Get cached viewport or fetch fresh state
   */
  async getViewport(refresh = false): Promise<CanvasViewportState> {
    if (!this._cachedViewport || refresh) {
      return this.getViewportState()
    }
    return this._cachedViewport
  }

  /**
   * Invalidate the cached viewport state
   */
  invalidateViewportCache(): void {
    this._cachedViewport = null
  }

  /**
   * Get the bounding box of the canvas element
   */
  async getCanvasBounds(): Promise<{ x: number; y: number; width: number; height: number }> {
    const bounds = await this.canvas.boundingBox()
    if (!bounds) {
      throw new Error('Canvas not found or not visible')
    }
    return bounds
  }

  /**
   * Convert grid coordinates to screen coordinates
   * @param gridX - Grid cell X position
   * @param gridY - Grid cell Y position
   * @param gridSize - Size of each grid cell in pixels (default 50)
   * @param zoom - Current zoom level (default 1)
   * @param panX - Current pan X offset (default 0)
   * @param panY - Current pan Y offset (default 0)
   */
  async gridToScreen(
    gridX: number,
    gridY: number,
    gridSize: number = 50,
    zoom: number = 1,
    panX: number = 0,
    panY: number = 0
  ): Promise<{ x: number; y: number }> {
    const bounds = await this.getCanvasBounds()

    // Canvas position in screen coordinates
    const canvasX = (gridX * gridSize + gridSize / 2) * zoom + panX
    const canvasY = (gridY * gridSize + gridSize / 2) * zoom + panY

    return {
      x: bounds.x + canvasX,
      y: bounds.y + canvasY
    }
  }

  /**
   * Convert grid coordinates to screen coordinates using current viewport state.
   * This is more accurate than the manual parameter version as it reads
   * the actual zoom/pan/grid values from the application.
   */
  async gridToScreenAuto(gridX: number, gridY: number): Promise<{ x: number; y: number }> {
    const viewport = await this.getViewport()
    return this.gridToScreen(
      gridX,
      gridY,
      viewport.gridSize,
      viewport.zoom,
      viewport.panX,
      viewport.panY
    )
  }

  /**
   * Click at a grid position using current viewport state
   */
  async clickGridAuto(gridX: number, gridY: number): Promise<void> {
    const { x, y } = await this.gridToScreenAuto(gridX, gridY)
    await this.page.mouse.click(x, y)
  }

  /**
   * Drag between grid positions using current viewport state
   */
  async dragGridAuto(
    fromGridX: number,
    fromGridY: number,
    toGridX: number,
    toGridY: number
  ): Promise<void> {
    const from = await this.gridToScreenAuto(fromGridX, fromGridY)
    const to = await this.gridToScreenAuto(toGridX, toGridY)

    await this.page.mouse.move(from.x, from.y)
    await this.page.mouse.down()
    await this.page.mouse.move(to.x, to.y, { steps: 10 })
    await this.page.mouse.up()

    // Invalidate cache after drag as pan might change
    this.invalidateViewportCache()
  }

  /**
   * Click at a specific grid position
   */
  async clickGrid(gridX: number, gridY: number, gridSize: number = 50): Promise<void> {
    const { x, y } = await this.gridToScreen(gridX, gridY, gridSize)
    await this.page.mouse.click(x, y)
  }

  /**
   * Double-click at a specific grid position
   */
  async dblClickGrid(gridX: number, gridY: number, gridSize: number = 50): Promise<void> {
    const { x, y } = await this.gridToScreen(gridX, gridY, gridSize)
    await this.page.mouse.dblclick(x, y)
  }

  /**
   * Drag from one grid position to another
   */
  async dragGrid(
    fromGridX: number,
    fromGridY: number,
    toGridX: number,
    toGridY: number,
    gridSize: number = 50
  ): Promise<void> {
    const from = await this.gridToScreen(fromGridX, fromGridY, gridSize)
    const to = await this.gridToScreen(toGridX, toGridY, gridSize)

    await this.page.mouse.move(from.x, from.y)
    await this.page.mouse.down()
    await this.page.mouse.move(to.x, to.y, { steps: 10 }) // Smooth drag
    await this.page.mouse.up()
  }

  /**
   * Click at the center of the canvas
   */
  async clickCenter(): Promise<void> {
    const bounds = await this.getCanvasBounds()
    await this.page.mouse.click(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2
    )
  }

  /**
   * Zoom in/out using mouse wheel
   * @param delta - Positive to zoom in, negative to zoom out
   */
  async zoom(delta: number): Promise<void> {
    const bounds = await this.getCanvasBounds()
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2

    await this.page.mouse.move(centerX, centerY)
    await this.page.mouse.wheel(0, delta)

    // Invalidate cache after zoom
    this.invalidateViewportCache()
  }

  /**
   * Pan the canvas by dragging with space held
   */
  async panCanvas(deltaX: number, deltaY: number): Promise<void> {
    const bounds = await this.getCanvasBounds()
    const startX = bounds.x + bounds.width / 2
    const startY = bounds.y + bounds.height / 2

    // Hold space and drag
    await this.page.keyboard.down('Space')
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(startX + deltaX, startY + deltaY, { steps: 5 })
    await this.page.mouse.up()
    await this.page.keyboard.up('Space')

    // Invalidate cache after pan
    this.invalidateViewportCache()
  }

  /**
   * Use the fog reveal brush at a position
   */
  async revealFogAt(gridX: number, gridY: number, gridSize: number = 50): Promise<void> {
    const { x, y } = await this.gridToScreen(gridX, gridY, gridSize)
    await this.page.mouse.click(x, y)
  }

  /**
   * Draw a fog reveal rectangle from one corner to another
   */
  async revealFogRect(
    fromGridX: number,
    fromGridY: number,
    toGridX: number,
    toGridY: number,
    gridSize: number = 50
  ): Promise<void> {
    const from = await this.gridToScreen(fromGridX, fromGridY, gridSize)
    const to = await this.gridToScreen(toGridX, toGridY, gridSize)

    await this.page.mouse.move(from.x, from.y)
    await this.page.mouse.down()
    await this.page.mouse.move(to.x, to.y, { steps: 5 })
    await this.page.mouse.up()
  }

  /**
   * Paint with fog brush by dragging
   */
  async paintFog(
    positions: Array<{ gridX: number; gridY: number }>,
    gridSize: number = 50
  ): Promise<void> {
    if (positions.length === 0) return

    const first = await this.gridToScreen(positions[0].gridX, positions[0].gridY, gridSize)
    await this.page.mouse.move(first.x, first.y)
    await this.page.mouse.down()

    for (const pos of positions.slice(1)) {
      const screen = await this.gridToScreen(pos.gridX, pos.gridY, gridSize)
      await this.page.mouse.move(screen.x, screen.y, { steps: 3 })
      await this.page.waitForTimeout(60) // Match brush interval
    }

    await this.page.mouse.up()
  }

  /**
   * Take a screenshot of just the canvas area
   */
  async screenshotCanvas(name: string): Promise<Buffer> {
    const bounds = await this.getCanvasBounds()
    return await this.page.screenshot({
      clip: bounds,
      path: `test-results/canvas-${name}.png`
    })
  }

  /**
   * Wait for canvas to be interactive (loaded and ready)
   */
  async waitForReady(): Promise<void> {
    await this.canvas.waitFor({ state: 'visible', timeout: 10000 })
    // Give Konva time to render
    await this.page.waitForTimeout(500)
  }
}

/**
 * Toolbar interaction utilities
 */
export class ToolbarUtils {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async selectTool(tool: 'select' | 'pan' | 'fog-reveal' | 'fog-hide'): Promise<void> {
    const shortcuts: Record<string, string> = {
      'select': 'v',
      'pan': 'h',
      'fog-reveal': 'r',
      'fog-hide': 'f'
    }

    await this.page.keyboard.press(shortcuts[tool])
  }

  async clickSelectTool(): Promise<void> {
    await this.page.getByRole('button', { name: /select/i }).first().click()
  }

  async clickPanTool(): Promise<void> {
    await this.page.getByRole('button', { name: /pan/i }).first().click()
  }

  async clickFogRevealTool(): Promise<void> {
    await this.page.getByRole('button', { name: /reveal/i }).first().click()
  }

  async clickFogHideTool(): Promise<void> {
    await this.page.getByRole('button', { name: /hide/i }).first().click()
  }

  async toggleFogOfWar(enabled: boolean): Promise<void> {
    if (enabled) {
      // To enable fog, click the reveal tool which will prompt to enable fog
      const revealButton = this.page.getByRole('button', { name: /reveal tool/i })
      if (await revealButton.isVisible()) {
        await revealButton.click({ force: true })
        // Handle the fog enable dialog that appears
        await this.handleFogEnableDialog(true)
      }
    }
    // Note: Disabling fog of war is typically done through encounter settings, not toolbar
  }

  /**
   * Handle the "Enable Fog of War" dialog that appears when clicking fog tools
   * while fog is disabled. Optionally enable fog or cancel.
   */
  async handleFogEnableDialog(enable: boolean = true): Promise<boolean> {
    // The dialog uses role="alertdialog"
    const dialog = this.page.locator('[role="alertdialog"]').filter({ hasText: /enable fog of war/i })

    if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (enable) {
        await dialog.getByRole('button', { name: /enable fog of war/i }).click({ force: true })
      } else {
        await dialog.getByRole('button', { name: /cancel/i }).click({ force: true })
      }
      await this.page.waitForTimeout(300)
      return true
    }
    return false
  }

  /**
   * Dismiss any open dialogs that might be blocking tests
   */
  async dismissAnyDialogs(): Promise<void> {
    const dialog = this.page.locator('[role="dialog"]')

    if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
      // Try to find a cancel/close button
      const closeButton = dialog.getByRole('button', { name: /cancel|close|no/i }).first()
      if (await closeButton.isVisible()) {
        await closeButton.click()
        await this.page.waitForTimeout(200)
      }
    }
  }
}
