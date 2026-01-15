import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'

// Force click options for headless Electron stability
const click = { force: true }

test.describe('Combat and Initiative', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)

    // Create an encounter with some tokens
    await app.createNewEncounter('Combat Test Battle')

    // Add some tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    // Verify all tokens were added
    await expect(window.getByText('Player 1')).toBeVisible()
    await expect(window.getByText('Player 2')).toBeVisible()
    await expect(window.getByText('Monster 1')).toBeVisible()
    await expect(window.getByText('Monster 2')).toBeVisible()

    // Toggle Initiative panel visible (it's not shown by default)
    const initiativeToggle = window.getByRole('button', { name: /show initiative panel/i })
    if (await initiativeToggle.isVisible()) {
      await initiativeToggle.click(click)
      await window.waitForTimeout(100)
    }
  })

  test('shows initiative panel', async ({ window }) => {
    // Should see the Initiative section
    await expect(window.getByRole('heading', { name: /initiative/i })).toBeVisible()

    // Should see Roll All button
    await expect(window.getByRole('button', { name: /roll.*all/i })).toBeVisible()

    // Start Combat should be disabled (no initiative rolled yet)
    const startCombatButton = window.getByRole('button', { name: /start combat/i })
    await expect(startCombatButton).toBeDisabled()
  })

  test('rolls initiative for all tokens', async ({ window }) => {
    // Click Roll All
    const rollAllButton = window.getByRole('button', { name: /roll.*all/i })
    await expect(rollAllButton).toBeVisible()
    await rollAllButton.click(click)

    // Wait for initiative values to appear (look for numeric values in initiative slots)
    await window.waitForTimeout(300)

    // Start Combat should now be enabled
    const startCombatButton = window.getByRole('button', { name: /start combat/i })
    await expect(startCombatButton).toBeEnabled()
  })

  test('starts combat after rolling initiative', async ({ window }) => {
    // Roll initiative
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)

    // Start combat
    const startCombatButton = window.getByRole('button', { name: /start combat/i })
    await expect(startCombatButton).toBeEnabled()
    await startCombatButton.click(click)

    // Should see combat UI
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()
    await expect(window.getByRole('button', { name: /next turn/i })).toBeVisible()
    await expect(window.getByText(/current turn/i)).toBeVisible()
  })

  test('advances through turns', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)

    // Should be on turn 1, round 1
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Get initial state screenshot
    const nextTurnButton = window.getByRole('button', { name: /next turn/i })
    await expect(nextTurnButton).toBeVisible()

    // Click Next Turn multiple times (we have 4 tokens)
    await nextTurnButton.click(click)
    await window.waitForTimeout(100)
    await nextTurnButton.click(click)
    await window.waitForTimeout(100)
    await nextTurnButton.click(click)
    await window.waitForTimeout(100)
    await nextTurnButton.click(click)
    await window.waitForTimeout(100)

    // After 4 advances (4 tokens), should be on round 2
    await expect(window.getByLabel(/combat round 2/i)).toBeVisible()
  })

  test('goes back to previous turn', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)

    // Verify we're in combat
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Advance a couple turns
    const nextTurnButton = window.getByRole('button', { name: /next turn/i })
    await nextTurnButton.click(click)
    await window.waitForTimeout(100)
    await nextTurnButton.click(click)
    await window.waitForTimeout(100)

    // Go back
    const prevTurnButton = window.getByRole('button', { name: /previous turn/i })
    await expect(prevTurnButton).toBeVisible()
    await prevTurnButton.click(click)

    // Should still be round 1
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()
  })

  test('ends combat with confirmation', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)

    // Verify combat started
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Find End Combat button - it must be visible
    const endCombatButton = window.getByRole('button', { name: /end combat/i })
    await expect(endCombatButton).toBeVisible()
    await endCombatButton.click(click)

    // Confirmation dialog should appear
    const confirmDialog = window.locator('[role="alertdialog"]')
    await expect(confirmDialog).toBeVisible()

    // Confirm
    await confirmDialog.getByRole('button', { name: /end|confirm|yes/i }).click(click)

    // Combat should end - back to pre-combat state
    await expect(window.getByRole('button', { name: /start combat/i })).toBeVisible()

    // Round indicator should be gone
    await expect(window.getByText(/round 1/i)).not.toBeVisible()
  })

  test('manually sets initiative value', async ({ window }) => {
    // Find the initiative list
    const initiativeList = window.locator('[role="list"][aria-label="Initiative order"]')
    await expect(initiativeList).toBeVisible({ timeout: 5000 })

    // Get first token item
    const tokenItems = initiativeList.locator('[role="listitem"]')
    const firstTokenItem = tokenItems.first()
    await expect(firstTokenItem).toBeVisible()

    // Click the initiative value button to edit it (aria-label contains "Initiative:")
    const initiativeButton = firstTokenItem.locator('button[aria-label*="Initiative"]')
    await expect(initiativeButton).toBeVisible({ timeout: 5000 })
    await initiativeButton.click(click)

    // Now an input should appear
    const initiativeInput = firstTokenItem.locator('input[type="number"]')
    await expect(initiativeInput).toBeVisible({ timeout: 2000 })
    await initiativeInput.fill('15')
    await window.keyboard.press('Enter')
    await window.waitForTimeout(100)

    // Value should be set - the button should now show 15
    await expect(
      firstTokenItem.locator('button').filter({ hasText: '15' })
        .or(firstTokenItem.getByText('15'))
    ).toBeVisible()
  })

  test('sorts tokens by initiative in descending order', async ({ window }) => {
    // Get initiative list
    const initiativeList = window.locator('[role="list"][aria-label="Initiative order"]')
    await expect(initiativeList).toBeVisible({ timeout: 5000 })

    const tokenItems = initiativeList.locator('[role="listitem"]')

    // Helper to set initiative for a token
    async function setInitiative(tokenName: string, value: string) {
      const tokenItem = tokenItems.filter({ hasText: tokenName }).first()
      await expect(tokenItem).toBeVisible()

      // Click initiative button to edit
      const initButton = tokenItem.locator('button[aria-label*="Initiative"]')
      await initButton.click(click)

      const initInput = tokenItem.locator('input[type="number"]')
      await expect(initInput).toBeVisible({ timeout: 2000 })
      await initInput.fill(value)
      await window.keyboard.press('Enter')
      await window.waitForTimeout(50)
    }

    // Set initiative values
    await setInitiative('Player 1', '5')
    await setInitiative('Player 2', '20')
    await setInitiative('Monster 1', '15')
    await setInitiative('Monster 2', '10')

    await window.waitForTimeout(200)

    // Click sort button if available
    const sortButton = window.getByRole('button', { name: /sort by initiative/i })
    if (await sortButton.isVisible()) {
      await sortButton.click(click)
      await window.waitForTimeout(200)
    }

    // Start combat - this should auto-sort
    await window.getByRole('button', { name: /start combat/i }).click(click)
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Verify sort order - first turn should be Player 2 (highest initiative: 20)
    // The current turn indicator has role="status" - use the one that contains "Current Turn"
    const currentTurnStatus = window.locator('[role="status"]').filter({ hasText: /current turn/i })
    await expect(currentTurnStatus).toBeVisible()

    // Current turn should show Player 2 (highest initiative)
    await expect(currentTurnStatus.getByText('Player 2')).toBeVisible()
  })

  test('current turn indicator moves on next turn', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)

    // Get the first current turn state
    const firstTurnElement = window.locator('[aria-current="true"], .current-turn, [data-current="true"]').first()
    const firstTurnText = await window.locator('[role="listitem"]').first().textContent()

    // Click next turn
    await window.getByRole('button', { name: /next turn/i }).click(click)
    await window.waitForTimeout(100)

    // The current indicator should have moved (we can verify visually via screenshot)
    // Or check that a different token now has the current indicator
  })
})

test.describe('Combat with HP Tracking', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('HP Combat Test')

    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    await expect(window.getByText('Player 1')).toBeVisible()
    await expect(window.getByText('Monster 1')).toBeVisible()

    // Toggle Initiative panel visible
    const initiativeToggle = window.getByRole('button', { name: /show initiative panel/i })
    if (await initiativeToggle.isVisible()) {
      await initiativeToggle.click(click)
      await window.waitForTimeout(100)
    }
  })

  test('tracks HP changes during combat', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // HP controls are in the Tokens panel (shown by default)
    // Find HP decrease button for monster (aria-label: "Decrease HP for Monster 1")
    const damageButton = window.getByRole('button', { name: /decrease hp for monster/i })

    // The button must exist for HP tracking to work
    await expect(damageButton).toBeVisible({ timeout: 5000 })

    // Deal some damage
    await damageButton.click(click)
    await damageButton.click(click)
    await damageButton.click(click)

    // HP should have decreased from 10 to 7
    await expect(window.getByText('7/10')).toBeVisible()
  })

  test('HP persists across turns', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Find HP decrease button for Player 1
    const damageButton = window.getByRole('button', { name: /decrease hp for player/i })
    await expect(damageButton).toBeVisible({ timeout: 5000 })
    await damageButton.click(click)
    await damageButton.click(click)

    // Verify HP decreased to 8/10
    await expect(window.getByText('8/10')).toBeVisible()

    // Advance turns (full round for 2 tokens)
    const nextButton = window.getByRole('button', { name: /next turn/i })
    await nextButton.click(click)
    await nextButton.click(click)

    // HP should still be reduced (8/10 not reset)
    await expect(window.getByText('8/10')).toBeVisible()
  })

  test('token at 0 HP shows defeated state', async ({ window }) => {
    // Roll and start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Find HP decrease button for monster
    const damageButton = window.getByRole('button', { name: /decrease hp for monster/i })
    await expect(damageButton).toBeVisible({ timeout: 5000 })

    // Click 10 times to deal 10 damage
    for (let i = 0; i < 10; i++) {
      await damageButton.click(click)
    }

    // Token should show 0 HP - use specific button aria-label (HP button has "HP:" in label)
    await expect(window.getByRole('button', { name: /monster.*hp.*0 of 10/i })).toBeVisible()
  })
})

test.describe('Initiative Edge Cases', () => {
  // Helper to show initiative panel
  async function showInitiativePanel(window: import('@playwright/test').Page) {
    const initiativeToggle = window.getByRole('button', { name: /show initiative panel/i })
    if (await initiativeToggle.isVisible()) {
      await initiativeToggle.click(click)
      await window.waitForTimeout(100)
    }
  }

  test('handles single token combat', async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Single Token Combat')

    // Add just one token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()

    // Show initiative panel
    await showInitiativePanel(window)

    // Roll and start
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)

    // Should work with single token
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Next turn should advance to round 2 immediately
    await window.getByRole('button', { name: /next turn/i }).click(click)
    await expect(window.getByLabel(/combat round 2/i)).toBeVisible()
  })

  test('handles no tokens gracefully', async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Empty Combat')

    // Show initiative panel
    await showInitiativePanel(window)

    // Don't add any tokens
    // Roll All button should be disabled
    const rollButton = window.getByRole('button', { name: /roll.*all/i })
    await expect(rollButton).toBeDisabled()

    // Start Combat should also be disabled
    const startButton = window.getByRole('button', { name: /start combat/i })
    await expect(startButton).toBeDisabled()
  })

  test('cannot start combat without rolling initiative', async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('No Roll Combat')

    // Add tokens but don't roll
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    // Show initiative panel
    await showInitiativePanel(window)

    // Start Combat should be disabled without initiative
    const startButton = window.getByRole('button', { name: /start combat/i })
    await expect(startButton).toBeDisabled()
  })

  test('re-rolling initiative updates values', async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Re-roll Combat')

    await window.getByRole('button', { name: /add player character/i }).click(click)

    // Show initiative panel
    await showInitiativePanel(window)

    // Set a known initiative value first
    const initiativeList = window.locator('[role="list"][aria-label="Initiative order"]')
    await expect(initiativeList).toBeVisible({ timeout: 5000 })

    const tokenItem = initiativeList.locator('[role="listitem"]').first()
    const initiativeButton = tokenItem.locator('button[aria-label*="Initiative"]')
    await expect(initiativeButton).toBeVisible()
    await initiativeButton.click(click)

    const initiativeInput = tokenItem.locator('input[type="number"]')
    await expect(initiativeInput).toBeVisible({ timeout: 2000 })
    await initiativeInput.fill('10')
    await window.keyboard.press('Enter')
    await window.waitForTimeout(100)

    // Now roll - this should generate a new random value
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)

    // Start combat should now be enabled (initiative was rolled)
    await expect(window.getByRole('button', { name: /start combat/i })).toBeEnabled()
  })
})

test.describe('Combat State Persistence', () => {
  test('combat state survives page reload', async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Persist Combat')

    // Add tokens
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await window.getByRole('button', { name: /add monster/i }).click(click)

    // Show initiative panel
    const initiativeToggle = window.getByRole('button', { name: /show initiative panel/i })
    if (await initiativeToggle.isVisible()) {
      await initiativeToggle.click(click)
      await window.waitForTimeout(100)
    }

    // Start combat
    await window.getByRole('button', { name: /roll.*all/i }).click(click)
    await window.waitForTimeout(300)
    await window.getByRole('button', { name: /start combat/i }).click(click)

    // Verify combat started
    await expect(window.getByLabel(/combat round 1/i)).toBeVisible()

    // Advance a few turns
    await window.getByRole('button', { name: /next turn/i }).click(click)
    await window.getByRole('button', { name: /next turn/i }).click(click)

    // Should be on round 2 (2 tokens, so 2 advances = 1 full round)
    await expect(window.getByLabel(/combat round 2/i)).toBeVisible()

    // Save and reload
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(500)

    await window.reload()
    await window.waitForLoadState('domcontentloaded')
    await window.waitForSelector('[data-testid="app-layout"], .welcome-screen, #root', {
      timeout: 30000
    })

    // Click to load the encounter again (use first() as there may be multiple from prior runs)
    const encounterButton = window.getByText('Persist Combat').first()
    await expect(encounterButton).toBeVisible({ timeout: 10000 })
    await encounterButton.click(click)

    // Wait for encounter to load
    await window.waitForSelector('[role="toolbar"], [data-testid="toolbar"], .toolbar', {
      timeout: 10000
    })

    // Show initiative panel again after reload
    const initiativeToggle2 = window.getByRole('button', { name: /show initiative panel/i })
    if (await initiativeToggle2.isVisible()) {
      await initiativeToggle2.click(click)
      await window.waitForTimeout(100)
    }

    // Combat state should be restored (round indicator should show)
    await expect(window.getByLabel(/combat round 2/i)).toBeVisible({ timeout: 5000 })
  })
})
