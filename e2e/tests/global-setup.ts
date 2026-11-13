import { chromium, type FullConfig } from '@playwright/test'
import fs from 'node:fs'

// Signs in once and saves the session so specs start authenticated.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL
  const email = process.env.SEED_E2E_USER ?? 'user@seed-platform.org'
  const password = process.env.SEED_E2E_PASSWORD ?? 'super-secret-password'

  fs.mkdirSync('.auth', { recursive: true })
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined })
  const page = await browser.newPage()
  await page.goto(`${baseURL}/ng-app/sign-in`)
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.locator('mat-checkbox label').first().click()
  await page.locator('button:has-text("Sign in")').first().click()
  await page.waitForURL(/\/ng-app\/(dashboard|home)?$/, { timeout: 30_000 })
  await page.context().storageState({ path: '.auth/user.json' })
  await browser.close()
}
