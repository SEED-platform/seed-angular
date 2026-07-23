# SEED Angular — Copilot Instructions

## Project Context
Frontend for the [SEED Platform](https://github.com/SEED-platform/seed) — an Angular app replacing the legacy AngularJS UI. Focused on building energy data management with key workflows around inventory, insights/reporting, data quality, and analyses.

**Backend:** Django API at `../seed` locally (sibling repo) or at https://github.com/SEED-platform/seed. It exposes versioned REST endpoints:
- `/api/v3/` — existing views. **Do not modify these.**
- `/api/v4/` — new views. Create here only when a v3 endpoint is genuinely too awkward or anti-pattern to use from the new Angular frontend.

**Stack:** Angular 21 · TypeScript · RxJS · TailwindCSS · Angular Material · Chart.js · Ag-Grid · Transloco (i18n) · pnpm

---

## Commands

```bash
pnpm start          # dev server at localhost:4200
pnpm build          # production build
pnpm lint           # runs eslint + prettier + stylelint in parallel
pnpm lint:fix       # auto-fix lint issues
pnpm test           # run Karma/Jasmine tests (no spec files currently exist)
pnpm update-translations  # pull translations from Lokalise (requires .env)
```

> There is no `ng test` shortcut for a single file — use `ng test --include='**/path/to/file.spec.ts'` if specs exist.

---

## Architecture

### Directory layout
```
src/
  @seed/           # Shared library (components, services, API clients, utilities)
    api/           # One service per domain (inventory, user, organization, cycle, …)
    components/    # Reusable UI: ag-grid, alert, card, drawer, label, modal, page, …
    services/      # App-wide services (config, confirmation, loading, error, …)
    guards/        # Route guards
    pipes/         # Shared Angular pipes
  app/
    core/          # App-level concerns: auth, icons, navigation, snack-bar, transloco
    layout/        # Shell layout component + layouts/
    modules/       # Feature modules (lazy-loaded): inventory, insights, datasets,
                   #   organizations, analyses, auth, profile, api, main
```

### API layer (`src/@seed/api/`)
Each domain folder exports a single `@Injectable({ providedIn: 'root' })` service. Services follow this pattern:
- Private `BehaviorSubject` or `ReplaySubject` for internal state
- Public `Observable` (`.asObservable()`) exposed for consumers
- HTTP calls use `HttpClient` with `catchError` → `ErrorService.handleError()`

**API versioning:** Use existing `/api/v3/` endpoints where possible. Create `/api/v4/` endpoints in the backend only when v3 usage is impractical or an anti-pattern.

### Routing
All authenticated routes live under the `AuthGuard`-protected block in `app.routes.ts`. Feature routes are lazy-loaded via `loadChildren`. Inventory uses a custom `inventoryTypeMatcher` to handle `/properties` and `/taxlots` via the same route subtree.

### State management
No NgRx/store — state lives in services via `BehaviorSubject`/`ReplaySubject` streams. Components inject services and subscribe via `async` pipe or `takeUntil` unsubscription.

### Organization context
`UserService.currentOrganizationId$` is the source of truth for the active org. Most API services subscribe to this to set their local `orgId` in the constructor.

---

## Linting & Code Style

Three linters run in parallel via `pnpm lint` (or `pnpm lint:fix` to auto-fix):

| Tool | Scope | Config |
|------|-------|--------|
| ESLint + `angular-eslint` | `**/*.ts`, `**/*.html` | `eslint.config.mjs` |
| Prettier | `src/**/*.html` (template formatting) | `.prettierrc` |
| Stylelint | `src/**/*.scss` | `.stylelintrc.js` |

**Key ESLint rules:**
- `@typescript-eslint/consistent-type-definitions` → `type` only (never `interface`)
- `@typescript-eslint/consistent-type-imports` → always `import type` for type-only imports
- `@typescript-eslint/naming-convention` → unused variables and private members prefixed `_`
- `@typescript-eslint/member-ordering` → class order: signature → field → constructor → accessor → static-method → decorated-method → public-method → private-method → method
- `unused-imports/no-unused-imports` → no dead imports
- `@angular-eslint/component-selector` → element selectors, kebab-case, prefixed `seed` / `auth` / `layout`
- `@angular-eslint/template/prefer-control-flow` → use `@if` / `@for` / `@switch`, not `*ngIf` / `*ngFor`

**Prettier (`.prettierrc`):** single quotes, no semicolons, 140-char print width, trailing commas, 2-space indent. Plugins auto-sort Tailwind classes and HTML attributes on fix.

**Stylelint:** SCSS standard. Class/id selectors must be kebab-case. Use `rgb(var(--seed-*-rgb) / alpha)` for theme color tokens (not the comma form).

**EditorConfig:** 2-space indent, UTF-8, final newline, trim trailing whitespace.

**No pre-commit hooks** — run `pnpm lint` manually before committing.

---

## Key Conventions

### TypeScript
- **Never use `any`** — use explicit types or generics.
- Use `type` (not `interface`) for consistency.
- Prefix private class members with `_` (e.g., `_myService`, `_items$`).
- Append `$` to Observable variable names (e.g., `items$`).
- Pass typed objects to methods rather than multiple positional parameters.

### RxJS
- Always unsubscribe in `ngOnDestroy()` or use `takeUntil` / `AsyncPipe`. Exception: `HttpClient` observables auto-complete and do not need manual unsubscription.
- Prefer Observables over Promises throughout.

### Styling
- Use Tailwind utility classes; avoid global SCSS unless necessary.
- All new UI must support both **light and dark mode** via Tailwind's `dark:` variants or CSS custom properties.
- Main action buttons: dark blue background + white text. Icon buttons (add/save/edit/delete): reuse the existing shared icon-button styles and icons.

### Translations (Transloco)

**Pattern:** Keys are the English strings themselves (identity translation — key = value in `en_US.json`). The file is a flat `Record<string, string>` — no nesting.

**In templates** — use the structural directive (preferred):
```html
<div *transloco="let t">
  <h2>{{ t('My Heading') }}</h2>
  <p>{{ t('Some description text') }}</p>
</div>
```

**In components** — import `TranslocoDirective` (not `TranslocoModule`):
```ts
import { TranslocoDirective } from '@jsverse/transloco'
@Component({ imports: [TranslocoDirective, ...] })
```

**For programmatic use** (snackbars, titles, etc.) inject `TranslocoService`:
```ts
private _transloco = inject(TranslocoService)
this._transloco.translate('My string')
```

**Workflow:**
1. Add new keys to `public/i18n/en_US.json` (key = English string, value = same English string)
2. Run `pnpm update-translations` to sync to Lokalise (requires `.env` with Lokalise token)
3. Other locale files (`es.json`, `fr_CA.json`) are managed via Lokalise — do not edit manually

**Rules:**
- All new user-facing strings must have a key in `en_US.json`. Flag any missing keys rather than silently leaving strings untranslated.
- Many existing modals in the codebase have hardcoded English strings without `t()` — this is tech debt, not the intended pattern. New modals should use `*transloco`.
- `pnpm lint` does **not** catch missing translation keys — manual audit required.

### Empty & Loading States
- Show the "No Programs Found" empty state when no program is selected/available. Do **not** render chart containers, tables, or loading spinners in this state.
- Loading indicators appear only when a valid program is present and a fetch is in progress.

### Accessibility
- Follow Section 508 rules. Flag any accessibility concerns in your response.

### Angular Material form fields
- Default appearance is `fill` (set globally in `seed.provider.ts`).

### Images/media
- Prefer `webp` or `svg` formats.

---

## Change Discipline
- Make minimal, targeted edits — do not reformat unrelated code or templates.
- Preserve existing component `@Input()`/`@Output()` contracts and routing behavior.
- Do not add dependencies without a clear need.
- Do not modify API payload shapes without explicit approval.

## After Every Change
1. Lint all touched files (`pnpm lint`).
2. Run relevant tests if specs exist.
3. Summarize: what changed, why, files touched, validation run, remaining risks.
4. PR messages: one-line title + itemized list of changes (no lengthy prose).

---

## Migration Status: Legacy UI → New Angular UI

This app is a page-for-page replacement of the old AngularJS UI in `../seed`. Use this section to orient yourself on what's done, what's missing, and where to focus next.

### ✅ Completed sections (substantial parity achieved)

| Area | Notes |
|------|-------|
| Auth (sign-in, sign-up, forgot/reset password) | |
| Dashboard / Home | |
| Profile (info, security, developer, admin) | |
| Inventory List — Properties & Tax Lots | List, map, summary, cross-cycles, column profiles, filter groups, groups |
| Inventory Detail | Detail, edit, notes, meters, sensors, UBIDs, analyses, timeline, cross-cycles, column profiles, map, documents |
| Inventory Groups | List, detail (dashboard, properties, meters, systems/services, map) |
| Data / Datasets | Dataset list, dataset detail, data upload, meter upload, data mapping (steps 1–4) |
| Analyses | List, detail, analysis-view/run |
| Insights | Portfolio summary, program overview, property insights, program config, default reports, custom reports |
| Organizations — Settings | Options, display fields/units, API keys, Salesforce, audit template, email, maintenance, two-factor, UBID |
| Organizations — People & Access | Members, access-level tree |
| Organizations — Columns | List, data types, geocoding, import settings, matching criteria, column mappings, column settings, mapping profiles |
| Organizations — Rules | Data quality (inventory + goal rules), derived columns, labels, cycles, email templates |
| API Documentation (Swagger) | |
| About, Contact, Documentation pages | |

### ❌ Missing pages (not yet built)

| Feature | Old route | Priority notes |
|---------|-----------|----------------|
| **Data Pairing** | `/data/pairing/{importfile_id}/{type}` | Property↔taxlot pairing step after import; drag-and-drop UI |
| **Pairing Settings** | `/data/pairing/{importfile_id}/{type}/settings` | Column config for pairing |
| **Organization Sharing** | `/accounts/{org_id}/sharing` | Select which property columns are publicly exposed in the org's data feed; also sets the query threshold. Unrelated to sub-orgs. |
| **Facilities Plan (Goals)** | `/insights/facilities_plan` | Complex compliance/benchmarking goal-tracking feature; largest missing piece |

### Where to focus next (suggested order)
1. **Facilities Plan** — largest missing feature with the most backend surface area (`facilities_plan_service`, plan runs, access level integration).
2. **Organization Sharing** — small surface area; completes the Org settings section.
3. **Data Pairing + Pairing Settings** — needed to complete the full data-import workflow.

### 🚫 Intentionally not implementing

| Feature | Old route | Reason |
|---------|-----------|--------|
| **Inventory Plots** | `/{type}/plots` | Was unlinked in the old UI and effectively unused; a fixed 2×2 grid of hardcoded scatter plots (Year Built vs ECI, CO₂ vs GFA, BETTER Savings vs ECI, CO₂/sqft vs Year Built). Superseded by the Insights module. |
| **Sub-organization management** | `/accounts/{org_id}/sub_org` | Project is moving toward access levels instead of sub-orgs. |
