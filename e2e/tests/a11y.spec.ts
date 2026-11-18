import AxeBuilder from '@axe-core/playwright'
import { expect, gotoSettled, test } from './fixtures'
import { KNOWN_AXE_RULES } from './known-issues'
import { ROUTES } from './routes'

// Core pages run on every build; the full route list runs when SEED_E2E_A11Y_ALL=1 (nightly).
const CORE = ['/dashboard', '/data', '/properties', '/organizations/settings', '/organizations/labels', '/organizations/members', '/profile/info']
const pages = process.env.SEED_E2E_A11Y_ALL ? ROUTES : CORE

for (const route of pages) {
  test(`axe: ${route}`, async ({ page }) => {
    await gotoSettled(page, route)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    const serious = results.violations.filter((v) => (v.impact === 'critical' || v.impact === 'serious') && !(v.id in KNOWN_AXE_RULES))
    expect(
      serious.map((v) => `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} nodes] e.g. ${v.nodes[0]?.target.join(' ')}`),
    ).toEqual([])
  })
}
