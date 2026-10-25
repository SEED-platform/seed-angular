import { test as base, expect, type Page } from '@playwright/test'

export interface Problems {
  console: string[]
  pageErrors: string[]
  http: string[]
}

const IGNORED_CONSOLE = [/Download the Angular DevTools/, /\[webpack-dev-server\]/, /favicon/]

export const test = base.extend<{ problems: Problems }>({
  problems: async ({ page }, use) => {
    const problems: Problems = { console: [], pageErrors: [], http: [] }
    page.on('console', (m) => {
      if (m.type() === 'error' && !IGNORED_CONSOLE.some((r) => r.test(m.text()))) problems.console.push(m.text().slice(0, 300))
    })
    page.on('pageerror', (e) => problems.pageErrors.push(String(e).slice(0, 300)))
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().includes('/api/')) {
        problems.http.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 160)}`)
      }
    })
    await use(problems)
  },
})

export { expect }

export async function gotoSettled(page: Page, path: string) {
  await page.goto(`/ng-app${path}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => undefined)
  // Let route resolvers and grids render before inspecting.
  await page.waitForTimeout(1000)
}

export function formatProblems(p: Problems) {
  return [...p.pageErrors.map((e) => `PAGEERROR ${e}`), ...p.console.map((e) => `CONSOLE ${e}`), ...p.http.map((e) => `HTTP ${e}`)]
}
