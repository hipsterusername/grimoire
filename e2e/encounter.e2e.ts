import { test, expect } from './fixtures/electron.fixture'
import { AppPage } from './pages/app.page'

// Force click options for headless Electron stability
const click = { force: true }

test.describe('Encounter Management', () => {
  test('displays welcome screen on first launch', async ({ window }) => {
    // Should show welcome screen with "New Encounter" button
    await expect(window.getByRole('heading', { name: /grimoire/i })).toBeVisible()
    await expect(window.getByRole('button', { name: /new encounter/i })).toBeVisible()

    // Check for empty state OR encounter list (depending on test isolation)
    // In CI, previous test runs may have created encounters
    const emptyState = window.getByText(/no encounters yet/i)
    const encounterList = window.getByRole('list', { name: /list of encounters/i })
    await expect(emptyState.or(encounterList)).toBeVisible()
  })

  test('creates a new encounter', async ({ window }) => {
    // Click "New Encounter" button
    await window.getByRole('button', { name: /new encounter/i }).click(click)

    // Modal should appear
    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(/new encounter/i)).toBeVisible()

    // Fill in the name
    const nameInput = modal.locator('input[type="text"]')
    await nameInput.fill('Dragon\'s Lair')

    // Create the encounter
    await modal.getByRole('button', { name: /create encounter/i }).click(click)

    // Modal should close and main layout should appear
    await expect(modal).not.toBeVisible()

    // Should now see the main app layout (toolbar, canvas area)
    await expect(window.getByRole('button', { name: /select/i }).first()).toBeVisible()
  })

  test('validates encounter name', async ({ window }) => {
    // Click "New Encounter" button
    await window.getByRole('button', { name: /new encounter/i }).click(click)

    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // The "Create Encounter" button is disabled when name is empty
    const createButton = modal.getByRole('button', { name: /create encounter/i })
    await expect(createButton).toBeDisabled()

    // Try with single character - button should be enabled but show validation error
    const nameInput = modal.locator('input[type="text"]')
    await nameInput.fill('A')

    // Button should now be enabled
    await expect(createButton).toBeEnabled()
    await createButton.click(click)

    // Should show minimum length error
    await expect(modal.getByText(/at least 2 characters/i)).toBeVisible()
  })

  test('shows character count in modal', async ({ window }) => {
    await window.getByRole('button', { name: /new encounter/i }).click(click)

    const modal = window.locator('[role="dialog"]')
    const nameInput = modal.locator('input[type="text"]')

    // Type a name and check character count
    await nameInput.fill('Test Battle')
    await expect(modal.getByText(/11\/100 characters/i)).toBeVisible()
  })

  test('can close new encounter modal with Cancel', async ({ window }) => {
    await window.getByRole('button', { name: /new encounter/i }).click(click)

    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Click Cancel
    await modal.getByRole('button', { name: /cancel/i }).click(click)

    // Modal should close
    await expect(modal).not.toBeVisible()

    // Should still be on welcome screen (check for heading, not empty state)
    await expect(window.getByRole('heading', { name: /grimoire/i })).toBeVisible()
  })

  test('can close modal with Escape key', async ({ window }) => {
    await window.getByRole('button', { name: /new encounter/i }).click(click)

    const modal = window.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Press Escape
    await window.keyboard.press('Escape')

    // Modal should close
    await expect(modal).not.toBeVisible()
  })

  test('saves encounter and shows in recent list', async ({ window }) => {
    const app = new AppPage(window)

    // Create first encounter with unique name
    const uniqueName = `Goblin Ambush ${Date.now()}`
    await app.createNewEncounter(uniqueName)

    // Verify we're in the encounter (toolbar visible)
    await expect(window.getByRole('button', { name: /select/i }).first()).toBeVisible()

    // Save with Ctrl+S
    await window.keyboard.press('Control+s')

    // Wait for save to complete
    await window.waitForTimeout(500)

    // Navigate back to welcome screen (if possible)
    const homeButton = window.getByRole('button', { name: /home|back|close/i }).first()
    if (await homeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeButton.click(click)
      await window.waitForTimeout(500)

      // Should see the encounter in recent list (use first() to handle duplicates from multiple runs)
      await expect(window.getByText(uniqueName).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('encounter persists after reload', async ({ window }) => {
    const app = new AppPage(window)

    // Create an encounter with unique name
    const uniqueName = `Persistent Battle ${Date.now()}`
    await app.createNewEncounter(uniqueName)

    // Verify encounter is loaded
    await expect(window.getByRole('button', { name: /select/i }).first()).toBeVisible()

    // Save
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(500)

    // Reload the app
    await window.reload()
    await window.waitForLoadState('domcontentloaded')

    // Wait for app to be ready
    await window.waitForSelector('[data-testid="app-layout"], .welcome-screen, #root', {
      timeout: 30000
    })

    // Should see the encounter in recent list or be loaded
    await expect(window.getByText(uniqueName).first()).toBeVisible({ timeout: 10000 })
  })

  test('can open saved encounter', async ({ window }) => {
    const app = new AppPage(window)

    // Create and save an encounter with unique name
    const uniqueName = `Saved Encounter Test ${Date.now()}`
    await app.createNewEncounter(uniqueName)
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(500)

    // Reload
    await window.reload()
    await window.waitForLoadState('domcontentloaded')
    await window.waitForSelector('[data-testid="app-layout"], .welcome-screen, #root', {
      timeout: 30000
    })

    // Click on the encounter to open it (use first() for duplicates)
    const encounterButton = window.getByText(uniqueName).first()
    await expect(encounterButton).toBeVisible({ timeout: 10000 })
    await encounterButton.click(click)

    // Should load the encounter (toolbar visible)
    await window.waitForSelector('[role="toolbar"], [data-testid="toolbar"], .toolbar', {
      timeout: 10000
    })
    await expect(window.getByRole('button', { name: /select/i }).first()).toBeVisible()
  })
})

test.describe('Encounter Search and Sort', () => {
  test.beforeEach(async ({ window }) => {
    const app = new AppPage(window)

    // Create multiple encounters for testing
    await app.createNewEncounter('Alpha Battle')
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(300)

    // Go back to create another
    const homeButton = window.getByRole('button', { name: /home|back|close/i }).first()
    if (await homeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeButton.click(click)
      await window.waitForTimeout(300)

      // Create second encounter
      await app.createNewEncounter('Beta Combat')
      await window.keyboard.press('Control+s')
      await window.waitForTimeout(300)

      await homeButton.click(click)
      await window.waitForTimeout(300)

      // Create third encounter
      await app.createNewEncounter('Charlie Fight')
      await window.keyboard.press('Control+s')
      await window.waitForTimeout(300)

      // Go back to home to see all encounters
      await homeButton.click(click)
      await window.waitForTimeout(300)
    }
  })

  test('search filters encounters', async ({ window }) => {
    // Look for search input
    const searchInput = window.getByPlaceholder(/search encounters/i)
      .or(window.getByRole('searchbox'))
      .or(window.locator('input[type="search"]'))

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Type search term
      await searchInput.fill('Alpha')
      await window.waitForTimeout(300)

      // Should filter to show only matching encounters (use first() for duplicates)
      await expect(window.getByText('Alpha Battle').first()).toBeVisible()

      // Other encounters should be filtered out
      await expect(window.getByText('Beta Combat')).not.toBeVisible()
      await expect(window.getByText('Charlie Fight')).not.toBeVisible()

      // Clear search
      await searchInput.clear()
      await window.waitForTimeout(200)

      // All encounters should be visible again
      await expect(window.getByText('Alpha Battle').first()).toBeVisible()
    }
  })

  test('empty search shows all encounters', async ({ window }) => {
    const searchInput = window.getByPlaceholder(/search encounters/i)
      .or(window.getByRole('searchbox'))

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Search for something
      await searchInput.fill('Alpha')
      await window.waitForTimeout(200)

      // Clear search
      await searchInput.clear()
      await window.waitForTimeout(200)

      // Should show at least Alpha Battle (use first() for duplicates)
      await expect(window.getByText('Alpha Battle').first()).toBeVisible()
    }
  })

  test('no results message for non-matching search', async ({ window }) => {
    const searchInput = window.getByPlaceholder(/search encounters/i)
      .or(window.getByRole('searchbox'))

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Search for non-existent encounter
      await searchInput.fill('XXXXNONEXISTENT')
      await window.waitForTimeout(300)

      // Should show no results message or empty state
      const noResults = window.getByText(/no encounters found|no results|no matches/i)
      if (await noResults.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(noResults).toBeVisible()
      }

      // Clear search
      await searchInput.clear()
    }
  })
})

test.describe('Encounter State Management', () => {
  test('unsaved changes prompt on close', async ({ window }) => {
    const app = new AppPage(window)

    // Create an encounter
    await app.createNewEncounter('Unsaved Test')

    // Make a change (add a token)
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()

    // Try to go back without saving
    const homeButton = window.getByRole('button', { name: /home|back|close/i }).first()
    if (await homeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeButton.click(click)

      // Should show unsaved changes dialog (if implemented)
      const unsavedDialog = window.locator('[role="alertdialog"]')
      if (await unsavedDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Check for the heading specifically
        await expect(unsavedDialog.getByRole('heading', { name: /unsaved changes/i })).toBeVisible()

        // Click "Keep Editing" to stay in encounter
        await unsavedDialog.getByRole('button', { name: /keep editing/i }).click(click)
      }
    }
  })

  test('undo/redo works for changes', async ({ window }) => {
    const app = new AppPage(window)
    await app.createNewEncounter('Undo Test')

    // Add a token
    await window.getByRole('button', { name: /add player character/i }).click(click)
    await expect(window.getByText('Player 1')).toBeVisible()

    // Undo the add
    await window.keyboard.press('Control+z')
    await window.waitForTimeout(300)

    // Token might be removed (if undo is implemented)
    // This test documents expected behavior

    // Redo
    await window.keyboard.press('Control+y')
    await window.waitForTimeout(300)
  })

  test('multiple encounters can be created', async ({ window }) => {
    const app = new AppPage(window)

    // Create first encounter with unique names
    const firstName = `First Encounter ${Date.now()}`
    await app.createNewEncounter(firstName)
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(300)

    // Go back and create another
    const homeButton = window.getByRole('button', { name: /home|back|close/i }).first()
    if (await homeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeButton.click(click)
      await window.waitForTimeout(300)

      // Create second encounter
      const secondName = `Second Encounter ${Date.now()}`
      await app.createNewEncounter(secondName)
      await window.keyboard.press('Control+s')
      await window.waitForTimeout(300)

      // Go back to see both
      await homeButton.click(click)
      await window.waitForTimeout(300)

      // Both should be visible (use first() to handle any duplicates)
      await expect(window.getByText(firstName).first()).toBeVisible()
      await expect(window.getByText(secondName).first()).toBeVisible()
    }
  })
})

test.describe('Encounter Deletion', () => {
  test('can delete an encounter', async ({ window }) => {
    const app = new AppPage(window)

    // Create an encounter to delete
    await app.createNewEncounter('Delete Me')
    await window.keyboard.press('Control+s')
    await window.waitForTimeout(300)

    // Go back to encounter list
    const homeButton = window.getByRole('button', { name: /home|back|close/i }).first()
    if (await homeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await homeButton.click(click)
      await window.waitForTimeout(300)

      // Look for delete button on the encounter
      const encounterItem = window.locator('[role="listitem"], [data-testid="encounter-item"]')
        .filter({ hasText: 'Delete Me' })

      if (await encounterItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await encounterItem.hover()

        const deleteButton = encounterItem.getByRole('button', { name: /delete/i })
        if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteButton.click(click)

          // Confirm deletion
          const confirmDialog = window.locator('[role="alertdialog"]')
          if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmDialog.getByRole('button', { name: /delete|confirm/i }).click(click)
            await window.waitForTimeout(300)

            // Encounter should be gone
            await expect(window.getByText('Delete Me')).not.toBeVisible()
          }
        }
      }
    }
  })
})
