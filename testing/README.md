# Testing Folder

This folder keeps testing artifacts separate from app code.

## What is included

- `api/auth-and-internship.test.cjs`: API-level automated test using Node built-in test runner.
- `load/basic-load.cjs`: lightweight load/performance script (LoadRunner-style objective, local script form).
- `control-flow/internship-auth-flow.mmd`: control flow graph for the automated test flow.

## Run

1. Fully automated local run (API + load):
   - `npm run test:all`
   - This auto-starts backend when needed, runs API tests, then load tests.
2. Browser step-by-step UI automation (opens page and tests in browser):
   - `npm run test:ui`
   - Default mode is headed (`UI_HEADLESS=false`), so you can watch each step live.
3. Full local automation including UI:
   - `npm run test:all:with-ui`
4. Manual mode (optional):
   - Start backend: `npm run dev`
   - API tests: `npm run test:api`
   - Load tests: `npm run test:load`

### Optional UI flags

- Headless mode: `set UI_HEADLESS=true && npm run test:ui`
- Custom frontend URL: `set UI_BASE_URL=http://localhost:5500 && npm run test:ui`

## CI automation

- GitHub Actions workflow is added at `.github/workflows/tests.yml`.
- It runs on every push to `main`/`master` and on pull requests.
- MongoDB is started as a service container, then `test:api` and `test:load` run automatically.

## Tool mapping to your list

- Selenium: intentionally not used (as requested).
- JUnit: Java unit test tool; this project is Node.js, so Node test runner is used as the closest practical fit.
- QTP/UFT: commercial functional automation suite; not added here.
- Jira: bug/task tracking tool (outside source code).
- LoadRunner: performance testing category represented here by `load/basic-load.cjs`.
- Scrum: methodology, not a tool.
