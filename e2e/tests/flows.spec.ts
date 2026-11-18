import { expect, formatProblems, gotoSettled, test } from './fixtures'

const unique = () => `e2e-${Date.now()}`

test.describe('sign-in (logged out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('wrong password shows an error and stays on sign-in', async ({ page }) => {
    await page.goto('/ng-app/sign-in')
    await page.fill('input[type=email]', 'user@seed-platform.org')
    await page.fill('input[type=password]', 'definitely-wrong')
    await page.locator('mat-checkbox label').first().click()
    await page.locator('button:has-text("Sign in")').first().click()
    await expect(page.getByText(/incorrect email or password/i)).toBeVisible()
    await expect(page).toHaveURL(/sign-in/)
  })

  test('protected route redirects to sign-in', async ({ page }) => {
    await page.goto('/ng-app/organizations/labels')
    await expect(page).toHaveURL(/sign-in/)
  })
})

test('create a dataset', async ({ page, problems }) => {
  const name = unique()
  await gotoSettled(page, '/data')
  await page.getByRole('button', { name: /create dataset/i }).click()
  await page.locator('mat-dialog-container input').first().fill(name)
  await page.locator('mat-dialog-container').getByRole('button', { name: /submit|create|save/i }).click()
  await expect(page.getByText(name).first()).toBeVisible()
  expect(formatProblems(problems)).toEqual([])
})

test('inventory list loads rows', async ({ page, problems }) => {
  await gotoSettled(page, '/properties')
  await expect(page.locator('.ag-row').first()).toBeVisible({ timeout: 30_000 })
  expect(formatProblems(problems)).toEqual([])
})
