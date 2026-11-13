# ng-app Tier 1 browser tests

Deterministic Playwright tests (no AI) for the new Angular frontend:

- `smoke.spec.ts` – crawls every route; fails on uncaught errors, console errors, failing `/api/` calls, blank pages, horizontal overflow (also at 390px for `@mobile` tests).
- `a11y.spec.ts` – axe-core (WCAG 2.x A/AA) on core pages; fails on new critical/serious violations. `SEED_E2E_A11Y_ALL=1` scans every route.
- `flows.spec.ts` – sign-in failure, auth redirect, create dataset, inventory grid loads.
- `known-issues.ts` – tracked bugs. Known-broken routes use `test.fail()`, so the suite goes red when one is fixed: remove the entry.

## Run locally

Backend: `docker compose -f e2e/docker-compose.yml up -d` (published `seedplatform/seed:develop`; override with
`SEED_IMAGE`). Then, via `docker compose -f e2e/docker-compose.yml exec web ./manage.py`: `migrate`,
`create_default_user --username=user@seed-platform.org --password=super-secret-password --organization=default`, and
`shell < e2e/seed-data.py` (minimal inventory; the stock `create_and_load_sample_data` command is currently broken).
Frontend: `SEED_HOST=http://127.0.0.1:8000 pnpm start`.

```bash
cd e2e
npm install
npx playwright install chromium   # or set PW_CHANNEL=chrome to use installed Google Chrome
npm test
npm run test:smoke
npm run report
```

Env: `SEED_NG_URL` (default `http://127.0.0.1:4200`), `SEED_E2E_USER` / `SEED_E2E_PASSWORD`
(default `user@seed-platform.org` / `super-secret-password`), `PW_CHANNEL`.

Assumes organization id 1 with sample data. Update `tests/routes.ts` when routes change.
CI: `.github/workflows/e2e.yml` (every PR, pushes to `main`, nightly against `seedplatform/seed:develop`).
