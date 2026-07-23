# SEED Angular — Copilot Instructions

Angular frontend for the SEED Platform™ (Standard Energy Efficiency Data), paired with a Django
backend (in the parent `seed` repo). Built with Angular (standalone components, no NgModules),
Angular Material, TailwindCSS, RxJS, and Transloco for i18n.

## Setup & commands

Package manager is **pnpm** (enforced by a `preinstall` script that fails under npm/yarn). Node
>=24, pnpm >=10.

- Install: `pnpm i`
- Dev server (Angular hot reload, proxies `/api/` and `/media/` to Django): `pnpm start`
  - Proxy target is `SEED_HOST` env var (default `http://127.0.0.1:8000`), configured in
    `proxy.conf.mjs`. Set it in a `.env` file (see `.env.example`).
- Dev server through Django: `pnpm watch` — rebuilds on save, output goes to
  `../../collected_static/ng-app`; Django serves it at `/ng-app/`. Use `pnpm build` for a one-shot
  build instead of a watcher.
- Build: `pnpm build`
- Lint everything: `pnpm lint` (runs eslint + prettier check + stylelint in parallel)
  - `pnpm eslint` / `pnpm eslint:fix` — `ng lint` (TypeScript + Angular templates)
  - `pnpm prettier` / `pnpm prettier:fix` — checks/formats `src/**/*.html` only
  - `pnpm stylelint` / `pnpm stylelint:fix` — checks `src/**/*.scss`
  - `pnpm lint:fix` runs all three `:fix` variants
- Spell check: `pnpm cspell "**/*"`. Spelling is *also* checked per-file as part of `pnpm eslint`
  (via `@cspell/eslint-plugin`), so lint failures can be spelling issues. Add legitimate
  domain-specific words to `.spelling.dic`, not inline ignore comments.
- Tests: `pnpm test` (`ng test`, Karma + Jasmine). **No `*.spec.ts` files currently exist in
  `src/`** — the test runner and config are wired up but unused. To run a single spec once one
  exists: `ng test --include='**/some.component.spec.ts'`.
- Update translations from Lokalise: `pnpm update-translations` (needs `.env` with
  `LOKALISE_TOKEN`; see `transloco.config.ts` for the `public/i18n/` translations path). **Lokalise
  is the source of truth** — this command only *pulls*, it never pushes new keys.
- CI (`.github/workflows/ci.yml`) runs `pnpm install`, `pnpm lint`, `pnpm build` on push/PR to
  `main`. There is no test step in CI today.

## Architecture

- `src/@seed/` is a self-contained framework layer (derived from the Fuse Angular admin
  template): `animations`, `components` (UI kit), `directives`, `guards`, `materials` (barrel
  re-exporting Angular Material modules as `MaterialImports`), `pipes`, `routing`, `services`,
  `styles`/`tailwind` (theming), `validators`, and its own mock-api interceptor framework. All
  backend HTTP access lives in `src/@seed/api/<resource>/` (e.g. `organization`, `property`,
  `cycle`, `column`, `dataset`, `salesforce`...), one folder per REST resource with
  `<resource>.service.ts` + `<resource>.types.ts`.
- **Backend API versions:** the Django backend (main `seed` repo) exposes both `/api/v3/` and
  `/api/v4/` (`seed/api/v3/`, `seed/api/v4/`, wired in `seed/api/base/urls.py`). The overwhelming
  majority of endpoints this app calls are v3 — reuse the existing v3 endpoint for a resource
  whenever one already exists (the legacy AngularJS app at `seed/static/seed/` is calling the same
  v3 endpoints and is a good reference for the request/response shape). Only call/introduce a
  `/api/v4/` endpoint when the feature genuinely needs a new backend endpoint that has no v3
  equivalent (see the handful of existing `/api/v4/` calls in `organization.service.ts`,
  `analysis.service.ts`, `groups.service.ts`, `inventory.service.ts` for precedent) — don't default
  to v4 just because it's newer, and never add a new v3 endpoint.
- `src/app/` is the actual application: `core/` (auth, icons, navigation, snack-bar, transloco
  wiring), `layout/`, `modules/` (feature areas — `inventory`, `inventory-list`,
  `inventory-detail`, `organizations`, `datasets`, `data-quality`, `analyses`, `insights`,
  `profile`, `auth`, `main`, `api`, `column-list-profile`, `data`), and an app-specific
  `mock-api/`.
- No TS path aliases are configured — `tsconfig.json` just sets `baseUrl: "./src"`, so
  `@seed/...` and `app/...` imports resolve because those directories are literally named `@seed`
  and `app` under `src/`. Avoid deep relative (`../../..`) imports across that boundary.
- Routing is fully lazy: each feature exports a default `Routes` array
  (`<feature>.routes.ts`, e.g. `organizations.routes.ts`) loaded via
  `loadChildren: () => import('app/modules/<feature>/<feature>.routes')` (see `app.routes.ts`).
  Polymorphic paths (e.g. inventory `properties`/`taxlots`, org `data-quality`/`derived-columns`
  sub-types) use custom `UrlSegment` matcher functions instead of static path strings. Place new
  sibling routes **before** dynamic `:id` routes so they aren't swallowed by the id matcher, and
  add a matching entry to `src/app/core/navigation/navigation.service.ts`.
- `app.config.ts` wires: Transloco, a custom `TitleStrategy` (appends "- SEED Platform™"), a
  Luxon-based Material `DateAdapter`, `provideAuth()`, `provideIcons()`, and `provideSEED(...)`
  (defined in `src/@seed/seed.provider.ts`), which registers SEED-wide providers (confirmation
  dialogs, loading/media/platform/splash-screen services, HTTP interceptors) and optionally the
  mock-API HTTP interceptor for local dev without a live Django backend.

## Migrating legacy pages and forms

This app is actively replacing a legacy AngularJS 1.x frontend (`seed/static/seed/` in the main
`seed` repo, of which this repo is a git submodule), often by several agents in parallel. Do
**not** re-derive conventions from scratch each time — follow the docs below and copy the
canonical examples they reference.

- **[`MIGRATION.md`](../MIGRATION.md)** — the page/route-level playbook (finding the legacy route,
  converting the template, reusing translations) and the tracked checklist of what's left to port.
- **[`docs/porting-forms.md`](../docs/porting-forms.md)** — the form-specific recipe once you're
  inside a page: canonical full-page/modal form components to copy, the reusable service
  integration points (`CycleService`, `ColumnService`, `SnackBarService`, `ErrorService`, ...),
  the validation/confirm/save flow, and the Transloco + Lokalise workflow. Not every legacy page
  is a reactive-form CRUD screen, though — it also covers non-form interactive workspaces (e.g.
  the dual-grid drag-and-drop `datasets/pairing` page), so check its canonical examples table for
  the closest match before assuming a `FormGroup`/save-flow shape.
- **[`docs/local-testing.md`](../docs/local-testing.md)** — how to actually run and click through
  what you built: standing up a throwaway backend + seeded test data and driving it with the
  Playwright MCP tools. Required before calling a migration done — see "Definition of done" below.

Both docs assume the conventions below and in `DEVELOPER.md`; don't reimplement backend logic —
the API usually already exists in `SEED-platform/seed`. When a legacy page's own settings/config
mechanism (e.g. a bespoke `localStorage`-backed column picker) duplicates something this app
already provides (e.g. the List View Profile selector), prefer reusing the existing mechanism
over porting the legacy one 1:1 — record that decision in `MIGRATION.md`'s "Won't migrate" list
with a one-line rationale (see the "Pairing settings" entry for precedent).

## Key conventions

Full guidelines are in `DEVELOPER.md` — highlights that are easy to miss:

- Standalone components only. `@Component({ imports: [...] })`, separate `.html`/`.scss` files,
  kebab-case selectors prefixed with `seed`, `auth`, or `layout` (enforced by eslint).
- Use `type`, never `interface`, for shapes; never use `any`.
- Inject dependencies with `inject()` at the field level, not constructor params. Private fields
  are prefixed `_` (e.g. `private _cycleService = inject(CycleService)`) — enforced by eslint
  naming-convention rule.
- Services hold state in a private `ReplaySubject`/`BehaviorSubject` and expose a public
  `<name>$` `Observable` property. Any observable-holding variable gets a `$` suffix.
- Unsubscribe pattern: `private readonly _unsubscribeAll$ = new Subject<void>()`, pipe with
  `takeUntil(this._unsubscribeAll$)`, call `.next()`/`.complete()` in `ngOnDestroy`. `HttpClient`
  requests complete on their own and don't need this.
- Consume Angular Material via the `MaterialImports` barrel from `@seed/materials` rather than
  importing individual Material modules directly.
- Every user-facing string needs a Transloco translation key (see `public/i18n/`).
- Import order/sorting and single-quote/no-semicolon style are eslint/prettier-enforced — run
  `pnpm lint:fix` rather than hand-formatting.
- **Prefer readability over clever code.** Favor small, single-purpose methods/getters and early
  returns over dense one-liners, deep ternary chains, or clever RxJS chaining. Move non-trivial
  logic out of templates and into the component class rather than inlining it in the HTML. This is
  also why the app avoids `lodash`/large utility libs (see `DEVELOPER.md`) — plain, explicit code
  is preferred over "clever" abstractions.

### CSS & UI (TailwindCSS + Angular Material)

- TailwindCSS utility-first, mobile-first; components must support both light and dark themes.
  Avoid broad/global SCSS — scope styles to the component.
- **Colors:** never hardcode hex/rgb colors in templates or SCSS. Use the semantic utilities the
  theme plugin generates from `tailwind.config.ts` (`text-primary-{50-900}`, `bg-card`,
  `text-secondary`, etc. — see `src/@seed/tailwind/plugins/theming.ts`), which already adapt
  between light/dark; add a `dark:` variant only for a one-off value the theme doesn't cover. On
  Angular Material components, express intent with `color="primary"`/`"accent"`/`"warn"` instead
  of custom background/text colors. If you must reference a `--seed-*` CSS variable directly in
  SCSS, use the `rgb(var(--seed-*-rgb) / <alpha>)` form — the comma `rgba(var(...), a)` form is
  blocked by stylelint.
- **Buttons:** pick the Material button variant that matches intent — `mat-flat-button` for a
  primary action, `mat-stroked-button` for secondary/cancel, `mat-icon-button` for icon-only,
  `mat-raised-button` for a destructive/`warn` action (see any `modal/*.component.html` for the
  pattern) — and let Material's own padding stand; don't add custom `padding`/`px-*`/`py-*` to
  resize a button. For a page's primary (and optional secondary) action button, don't hand-roll
  one at all — pass `action`/`actionIcon`/`actionText` (and `action2*`) into
  `<seed-page [config]="...">`, which renders it consistently (see
  `organizations/cycles/cycles.component.html`).
- **Icon sizing:** size `mat-icon` with the custom `icon-size-*` scale (e.g. `icon-size-4`,
  `icon-size-5` — defined in `src/@seed/tailwind/plugins/icon-size.ts`), not raw `w-*`/`h-*`
  classes.
- **Spacing:** prefer flex/grid `gap-*` utilities for space between sibling elements over
  `space-x-*`/`space-y-*` or manual `mr-*`/`ml-*` on individual children — `gap-*` is the dominant
  pattern in this codebase by a wide margin. Reach for the extended spacing scale in
  `tailwind.config.ts` (`theme.extend.spacing`) instead of arbitrary-value classes like `p-[13px]`.

## Definition of done

```bash
pnpm lint      # eslint + prettier + stylelint (use pnpm lint:fix to auto-fix)
pnpm build     # AoT build + template typecheck
```

Both must pass for the files you touched. For anything interactive or backend-driven (a new page,
form, grid, drag-and-drop, filter, etc.) that isn't a pure refactor/style change, lint + build are
necessary but **not sufficient** — neither one runs the code, so neither can catch a missing
ag-grid module registration, a wrong assumption about an API response's field names/shape, a
route-param reactivity bug, or a layout that only breaks with real data. Actually load the page in
a browser against a live backend with real seeded data and click through it with Playwright before
calling the work done — see **[`docs/local-testing.md`](../docs/local-testing.md)** for how to
stand up a throwaway backend + seed data in this environment and drive it with the Playwright MCP
tools, including gotchas already discovered (docker-compose bind-mount conflicts, missing `faker`
dependency, etc.) so you don't have to rediscover them.
