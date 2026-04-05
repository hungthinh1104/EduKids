# UI Test Plan (Frontend)

## Tooling note
- Current repo already has `Playwright` wired (`test:e2e`).
- Selenium is possible and now scaffolded with `test:ui:selenium` for smoke checks.

## How many UI tests are needed?

Recommended baseline by phase:

1. **Phase A — Smoke (start now): 8 tests**
   - Landing renders and auth CTA links
   - Login form renders
   - Register form renders
   - Forgot password page renders
   - Parent dashboard access/redirect check
   - Child play page access/redirect check
   - Admin home access/redirect check
   - Global error page renders

2. **Phase B — Critical flows: 18 tests**
   - Auth success/failure/lockout scenarios
   - Register validation rules
   - Reset password flow
   - Parent: add child, recommendations, reports
   - Child: topic > flashcard > quiz > result screen
   - Admin: topics/media basic CRUD navigation

3. **Phase C — Full regression: 35–45 tests**
   - Cross-role route guards
   - Mobile viewport checks
   - Core visual assertions for key pages
   - API error-state handling across top pages

## Minimum gate for CI right now
- Run all unit tests
- Run Selenium smoke suite (3 tests currently scaffolded)
- Run Playwright critical suite when available

## Selenium suite currently scaffolded
- [tests/selenium/smoke.ui.test.mjs](tests/selenium/smoke.ui.test.mjs)
  - Landing smoke
  - Login smoke
  - Register smoke

## Run commands
- Frontend dev server (separate terminal):
  - `npm run dev`
- Selenium smoke tests:
  - `npm run test:ui:selenium`

## Notes
- Set `UI_BASE_URL` for non-local URL:
  - `UI_BASE_URL=http://localhost:3000 npm run test:ui:selenium`
- For stable selectors long-term, add `data-testid` to critical UI controls.
