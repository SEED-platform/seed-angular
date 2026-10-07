import type { Page } from '@playwright/test'
import { expect, formatProblems, gotoSettled, test, type Problems } from './fixtures'
import { KNOWN_BROKEN_ROUTES } from './known-issues'
import { PROPERTY_TABS, ROUTES } from './routes'

// Crawl every static route: no uncaught errors, no console errors, no failing API calls, and
// something must render (catches blank pages / crashed routers).
async function assertRendered(page: Page, problems: Problems, label: string) {
  const bodyText = (await page.locator('body').innerText()).trim()
  expect(bodyText.length, `${label}: page is blank`).toBeGreaterThan(20)
  // The routed component renders after the deepest <router-outlet>; an empty outlet means a dead route.
  const routedText = await page.evaluate(() => {
    const outlet = [...document.querySelectorAll('router-outlet')].pop()
    let n = 0
    for (let e = outlet?.nextElementSibling; e; e = e.nextElementSibling) n += (e as HTMLElement).innerText.trim().length
    return n
  })
  expect(routedText, `${label}: routed content area is empty`).toBeGreaterThan(0)
  expect(formatProblems(problems), `${label}: runtime problems`).toEqual([])
}

for (const route of ROUTES) {
  test(`route ${route} renders without errors @mobile`, async ({ page, problems }) => {
    const known = KNOWN_BROKEN_ROUTES[route]
    test.fail(!!known, known)
    await gotoSettled(page, route)
    await assertRendered(page, problems, route)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, `${route}: horizontal page overflow`).toBeLessThanOrEqual(1)
  })
}

test.describe('property detail tabs', () => {
  for (const tab of PROPERTY_TABS) {
    test(`/properties/:id${tab || ' (detail)'} renders without errors`, async ({ page, problems, request }) => {
      const res = await request.get('/api/v3/properties/?organization_id=1&per_page=1').catch(() => null)
      const id = (await res?.json().catch(() => null))?.results?.[0]?.id ?? 1
      await gotoSettled(page, `/properties/${id}${tab}`)
      await assertRendered(page, problems, `/properties/${id}${tab}`)
    })
  }
})

test('unknown route falls back to dashboard', async ({ page }) => {
  await gotoSettled(page, '/this-route-does-not-exist')
  await expect(page).toHaveURL(/\/ng-app\/dashboard/)
})
