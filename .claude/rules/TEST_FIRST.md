## HARD RULE: TEST-FIRST (NON-NEGOTIABLE)

- Any new or modified **domain or application logic MUST include unit tests**
- If logic is added without tests, CI WILL FAIL
- If behavior changes, tests MUST be updated first or alongside the change
- Do NOT proceed with implementation if you cannot describe the test

If tests are missing:
- STOP
- Generate tests
- Then continue

## E2E TESTS (NON-NEGOTIABLE)

- Any new or modified **user-facing feature MUST include E2E test coverage** in `e2e/`
- E2E tests use Playwright (`@playwright/test`)
- When adding a new view, page, or interactive flow: add or update E2E tests
- When modifying existing UI behavior: update affected E2E assertions
- E2E tests MUST assert observable user behavior (visible text, navigation, interactions)
- Mock external API calls with `page.route()` to keep tests deterministic
- Do NOT skip E2E tests because unit tests exist — they test different things
