// Routes with a known, tracked bug. The smoke test for these is marked test.fail():
// CI stays green while the bug exists and turns red as soon as it is fixed, which is the
// reminder to delete the entry here. Reference the punchlist ID or GitHub issue.
export const KNOWN_BROKEN_ROUTES: Record<string, string> = {
  '/organizations': 'Punchlist #41: route matcher crash leaves a blank app',
  '/organizations/columns': 'Punchlist #42: no default child, TypeError in ColumnsComponent.setPageInfo',
  '/insights': 'Punchlist #59: blank page, no default child',
}

// axe rule ids currently failing app-wide; remove entries as they are fixed.
export const KNOWN_AXE_RULES: Record<string, string> = {
  'button-name': 'Punchlist #30: icon-only buttons without accessible names',
  'color-contrast': 'baseline: nav items and secondary text; not yet in punchlist',
  'aria-allowed-attr': 'baseline: mat-button menu trigger on /properties; not yet in punchlist',
  'aria-input-field-name': 'baseline: unlabeled mat-select on /properties; not yet in punchlist',
}
