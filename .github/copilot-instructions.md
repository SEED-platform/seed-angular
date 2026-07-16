# Copilot / AI Agent Instructions — SEED Angular

This repo is the **Angular v19** rewrite of the legacy AngularJS SEED UI (which lives in
[`SEED-platform/seed`](https://github.com/SEED-platform/seed)). Much of the ongoing work is
**porting legacy AngularJS screens/forms into this app**, often by several agents in parallel.
To keep that work consistent, read the guidance below before writing code.

## Start here (always)

1. **[`DEVELOPER.md`](../DEVELOPER.md)** — the authoritative coding standards (standalone
   components, `type` over `interface`, `_`-prefixed privates, `$`-suffixed observables,
   unsubscribe in `ngOnDestroy`, no `any`, Tailwind + light/dark, translate all UI text).
2. **[`docs/porting-forms.md`](../docs/porting-forms.md)** — the step-by-step recipe for
   porting a legacy form/screen, including the reusable integration points and validation.

Do **not** re-derive conventions from scratch each time — follow the docs above and copy the
canonical examples.

## Canonical examples to copy from

- **Full-page form (route + reactive form + services + confirm dialog):**
  `src/app/modules/inventory/create/inventory-create.component.ts` (+ `.html`)
- **Modal form (dialog + reactive form + service call):**
  `src/app/modules/inventory-detail/notes/modal/form-modal.component.ts`
- **Confirm / delete dialog + modal header:**
  `src/@seed/components/delete-modal/` and `src/@seed/components/modal/modal-header.component.ts`
- **Page shell:** `seed-page` from `@seed/components` (`PageComponent`)
- **Inline validation alerts:** `AlertComponent` from `@seed/components`

## Non-negotiables for ported forms

- **Standalone components only.** Import `MaterialImports` from `@seed/materials` (not individual
  Material modules). Keep `.ts` / `.html` / `.scss` in separate files.
- **Reactive forms** (`FormGroup` / `FormControl` with typed values + `Validators`).
- **Services:** call existing `@seed/api` services (private `BehaviorSubject` → public `$`
  Observable pattern). Add new HTTP methods with `catchError((e) => this._errorService.handleError(...))`.
  Pass typed objects, not long argument lists.
- **User feedback:** `SnackBarService` (`app/core/snack-bar/snack-bar.service`) — `success` /
  `info` / `warning` / `alert`. Confirmations via `MatDialog` + a modal using `ModalHeaderComponent`.
- **Translations (Transloco + Lokalise):** wrap templates in `*transloco="let t"` and use
  `t('English string')`; for code-built strings inject `TranslocoService` and call `translate()`.
  Never hardcode user-facing strings. **Lokalise is the source of truth** — `pnpm
  update-translations` only *pulls*, so register new keys there (see `docs/porting-forms.md` §9).
- **Routing:** feature routes are lazy-loaded; place new sibling routes **before** dynamic
  `:id` routes. Add a matching entry to `src/app/core/navigation/navigation.service.ts`.
- **Do not** reimplement backend logic — the API usually already exists in `SEED-platform/seed`.

## Definition of done (run before you finish)

```bash
pnpm lint      # eslint + prettier + stylelint (use pnpm lint:fix to auto-fix)
pnpm build     # AoT build + template typecheck
```

Both must pass for the files you touched. Use **pnpm** (there is a `pnpm-lock.yaml`).
