import type { Locator } from '@playwright/test'

/**
 * Force click a locator - bypasses Playwright's stability checks
 * which can timeout in headless Electron environments
 */
export async function forceClick(locator: Locator): Promise<void> {
  await locator.click({ force: true })
}

/**
 * Force click multiple times
 */
export async function forceClickTimes(locator: Locator, times: number): Promise<void> {
  for (let i = 0; i < times; i++) {
    await locator.click({ force: true })
  }
}
