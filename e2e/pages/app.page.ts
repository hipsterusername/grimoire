import type { Page, Locator } from '@playwright/test'

/**
 * Page object for the main Grimoire application
 */
export class AppPage {
  readonly page: Page

  // Welcome screen elements
  readonly welcomeScreen: Locator
  readonly newEncounterButton: Locator
  readonly recentEncountersList: Locator

  // Main layout elements
  readonly toolbar: Locator
  readonly sidebar: Locator
  readonly canvas: Locator
  readonly statusBar: Locator

  // Toolbar tools
  readonly selectTool: Locator
  readonly panTool: Locator
  readonly fogRevealTool: Locator
  readonly fogHideTool: Locator

  // Sidebar panels
  readonly mapPanel: Locator
  readonly tokenPanel: Locator
  readonly initiativePanel: Locator
  readonly libraryPanel: Locator

  constructor(page: Page) {
    this.page = page

    // Welcome screen
    this.welcomeScreen = page.locator('[data-testid="welcome-screen"], .welcome-screen')
    this.newEncounterButton = page.getByRole('button', { name: /new encounter/i })
    this.recentEncountersList = page.locator('[data-testid="recent-encounters"]')

    // Main layout
    this.toolbar = page.locator('[role="toolbar"], [data-testid="toolbar"], .toolbar')
    this.sidebar = page.locator('[data-testid="sidebar"], .sidebar, aside')
    this.canvas = page.locator('[data-testid="canvas"], .konva-container, canvas').first()
    this.statusBar = page.locator('[data-testid="status-bar"], .status-bar')

    // Toolbar tools
    this.selectTool = page.getByRole('button', { name: /select/i }).first()
    this.panTool = page.getByRole('button', { name: /pan/i }).first()
    this.fogRevealTool = page.getByRole('button', { name: /reveal/i }).first()
    this.fogHideTool = page.getByRole('button', { name: /hide/i }).first()

    // Sidebar panels
    this.mapPanel = page.locator('[data-testid="map-panel"]')
    this.tokenPanel = page.locator('[data-testid="token-panel"]')
    this.initiativePanel = page.locator('[data-testid="initiative-panel"]')
    this.libraryPanel = page.locator('[data-testid="library-panel"]')
  }

  // Navigation helpers
  async waitForWelcomeScreen(): Promise<void> {
    await this.welcomeScreen.waitFor({ state: 'visible', timeout: 10000 })
  }

  async waitForMainLayout(): Promise<void> {
    await this.toolbar.waitFor({ state: 'visible', timeout: 10000 })
  }

  // Encounter actions
  async createNewEncounter(name: string): Promise<void> {
    // Wait for the button to be visible and click it
    // Use force: true to bypass stability checks (needed for headless Electron)
    await this.newEncounterButton.waitFor({ state: 'visible', timeout: 10000 })
    await this.newEncounterButton.click({ force: true })

    // Wait for modal
    const modal = this.page.locator('[role="dialog"]')
    await modal.waitFor({ state: 'visible', timeout: 10000 })

    // Fill in name
    const nameInput = modal.locator('input[type="text"]').first()
    await nameInput.waitFor({ state: 'visible' })
    await nameInput.fill(name)

    // Small delay for React to update button state
    await this.page.waitForTimeout(50)

    // Submit - use force click to bypass stability issues
    const createButton = modal.getByRole('button', { name: /create/i })
    await createButton.waitFor({ state: 'visible' })
    await createButton.click({ force: true })

    // Wait for main layout to appear
    await this.waitForMainLayout()
  }

  async openRecentEncounter(name: string): Promise<void> {
    await this.page.getByText(name).click()
    await this.waitForMainLayout()
  }

  // Tool selection
  async selectSelectTool(): Promise<void> {
    await this.selectTool.click()
  }

  async selectPanTool(): Promise<void> {
    await this.panTool.click()
  }

  // Keyboard shortcuts
  async pressShortcut(key: string): Promise<void> {
    await this.page.keyboard.press(key)
  }

  async save(): Promise<void> {
    await this.page.keyboard.press('Control+s')
  }

  async undo(): Promise<void> {
    await this.page.keyboard.press('Control+z')
  }

  async redo(): Promise<void> {
    await this.page.keyboard.press('Control+y')
  }
}

/**
 * Page object for token operations
 */
export class TokenPage {
  readonly page: Page
  readonly appPage: AppPage

  readonly addTokenButton: Locator
  readonly tokenList: Locator

  constructor(page: Page) {
    this.page = page
    this.appPage = new AppPage(page)

    this.addTokenButton = page.getByRole('button', { name: /add token/i })
    this.tokenList = page.locator('[data-testid="token-list"]')
  }

  async addToken(options: {
    name: string
    type?: 'pc' | 'npc' | 'monster' | 'object'
    hp?: number
    ac?: number
  }): Promise<void> {
    await this.addTokenButton.click()

    const modal = this.page.locator('[role="dialog"]')
    await modal.waitFor({ state: 'visible' })

    // Fill in name
    await modal.locator('input').first().fill(options.name)

    // Select type if specified
    if (options.type) {
      const typeSelect = modal.locator('select').first()
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption(options.type)
      }
    }

    // Fill HP if specified
    if (options.hp !== undefined) {
      const hpInput = modal.locator('input[type="text"]').nth(1)
      if (await hpInput.isVisible()) {
        await hpInput.fill(options.hp.toString())
      }
    }

    // Create the token
    await modal.getByRole('button', { name: /create|add|save/i }).click()

    // Wait for modal to close
    await modal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  async selectToken(name: string): Promise<void> {
    await this.page.getByText(name).click()
  }

  async deleteToken(name: string): Promise<void> {
    // Find and click the token's delete button
    const tokenRow = this.page.locator(`[data-testid="token-item"]:has-text("${name}")`)
    await tokenRow.hover()
    await tokenRow.getByRole('button', { name: /delete|remove/i }).click()

    // Confirm deletion
    const confirmDialog = this.page.locator('[role="alertdialog"]')
    if (await confirmDialog.isVisible()) {
      await confirmDialog.getByRole('button', { name: /delete|confirm|yes/i }).click()
    }
  }

  async getTokenCount(): Promise<number> {
    const tokens = this.page.locator('[data-testid="token-item"]')
    return await tokens.count()
  }
}

/**
 * Page object for combat/initiative operations
 */
export class CombatPage {
  readonly page: Page

  readonly startCombatButton: Locator
  readonly endCombatButton: Locator
  readonly nextTurnButton: Locator
  readonly previousTurnButton: Locator
  readonly rollInitiativeButton: Locator
  readonly sortInitiativeButton: Locator
  readonly roundNumber: Locator
  readonly currentTurnIndicator: Locator

  constructor(page: Page) {
    this.page = page

    this.startCombatButton = page.getByRole('button', { name: /start combat/i })
    this.endCombatButton = page.getByRole('button', { name: /end combat/i })
    this.nextTurnButton = page.getByRole('button', { name: /next|advance/i })
    this.previousTurnButton = page.getByRole('button', { name: /previous|back/i })
    this.rollInitiativeButton = page.getByRole('button', { name: /roll.*initiative/i })
    this.sortInitiativeButton = page.getByRole('button', { name: /sort/i })
    this.roundNumber = page.locator('[data-testid="round-number"]')
    this.currentTurnIndicator = page.locator('[data-testid="current-turn"]')
  }

  async startCombat(): Promise<void> {
    await this.startCombatButton.click()
  }

  async endCombat(): Promise<void> {
    await this.endCombatButton.click()

    // Confirm if dialog appears
    const confirmDialog = this.page.locator('[role="alertdialog"]')
    if (await confirmDialog.isVisible()) {
      await confirmDialog.getByRole('button', { name: /end|confirm|yes/i }).click()
    }
  }

  async nextTurn(): Promise<void> {
    await this.nextTurnButton.click()
  }

  async previousTurn(): Promise<void> {
    await this.previousTurnButton.click()
  }

  async setInitiative(tokenName: string, value: number): Promise<void> {
    const tokenRow = this.page.locator(`[data-testid="initiative-item"]:has-text("${tokenName}")`)
    const initiativeInput = tokenRow.locator('input')
    await initiativeInput.fill(value.toString())
    await initiativeInput.press('Enter')
  }

  async sortInitiative(): Promise<void> {
    await this.sortInitiativeButton.click()
  }

  async getRoundNumber(): Promise<number> {
    const text = await this.roundNumber.textContent()
    const match = text?.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }
}
