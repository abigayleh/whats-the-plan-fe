# Testing

Two suites, and they answer different questions.

| Suite | Command | Size | Proves |
|---|---|---|---|
| Vitest + Testing Library | `npm run test:run` | 761 tests | Components and units behave, against a mocked API and socket |
| Playwright E2E | `npm run e2e` | 122 tests | The real app works against the real backend, database and socket |

## Commands

| Command | Does |
|---|---|
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest once (the gate) |
| `npm run coverage` | Coverage report (v8) |
| `npm run e2e` | Playwright, booting the whole stack |
| `npm run e2e:ui` | Playwright's interactive UI mode |

---

## Unit and component tests

Co-located next to the code they cover: `foo.js` → `foo.test.js`, `Foo.jsx` →
`Foo.test.jsx`. Shared helpers live in `src/test/`.

**Covered** — every `src/utils/*` (date math, overlap layout, page-tree, task
helpers), the `src/api` adapters, `src/api/client.js` (token store, `apiFetch`,
the 401 → refresh → retry flow), all hooks with mocked API and socket, and the
calendar, lists, itineraries, pages, polls, chat, groups, auth and shared-UI
components.

**Writing them**
- Render with `renderWithRouter` from `src/test/utils`; query by role/label/text,
  never by test-id; use `userEvent` (await it).
- Mock collaborators with `vi.mock`: `../hooks/useAppData`, `../hooks/useAuth`,
  `../socket/socketClient`, and the relevant `../api/*` module.
- JSX in a test needs a `.test.jsx` extension — `.test.js` files aren't run
  through the JSX transform.
- Import `describe`/`it`/`expect`/`vi` from `vitest` to keep the linter clean.
- Test behaviour, not implementation.

---

## End-to-end tests

Everything lives in `e2e/`. A run brings up a throwaway Postgres in Docker,
applies migrations, boots the backend and the Vite dev server, and drives real
Chromium.

**Prerequisites** — a Docker daemon (Docker Desktop, OrbStack, colima) and a
checkout of `whats-the-plan-be` as a sibling directory.

| Variable | Effect |
|---|---|
| `WTP_BE_PATH` | Backend checkout (default: `../whats-the-plan-be`) |
| `WTP_DB_URL` | Use an existing Postgres and skip Docker entirely — this is what CI does |
| `WTP_KEEP_DB` | `1` leaves the container up after a run, to inspect a failure |
| `WTP_ALLOW_REMOTE_DB` | Required to point the suite at a non-local database |

The suite **drops and re-migrates its database on every run**, so it refuses to
start against a non-local `WTP_DB_URL` unless `WTP_ALLOW_REMOTE_DB=1`. The
backend enforces the same rule independently: it will not boot with
`E2E_EXPOSE_VERIFY_TOKEN=1` against a non-local database.

Ports are deliberately unusual (backend 4801, frontend 5199) so a normal dev
stack can run at the same time.

**Layout**
- `e2e/config.js` — ports, database URL, the backend's environment
- `e2e/global-setup.js` — Docker, migrations
- `e2e/fixtures/api.js` — seeds users, groups, lists, tasks, polls, itineraries over HTTP
- `e2e/fixtures/index.js` — the `user`, `secondUser`, `anonPage` fixtures
- `e2e/helpers/pages.js` — page-tree and editor locators shared by the page specs
- `e2e/specs/*.spec.js` — one file per feature area

**Writing them**
- Seed prerequisites through the `api` fixture and *click only the thing under
  test*. A test that clicks through six screens to reach its subject is slow and
  fails for unrelated reasons.
- The `user` fixture registers, verifies and signs in; the page starts
  authenticated. `secondUser` gets its own browser context, for invites, live
  poll votes and other two-person flows.
- `*.mobile.spec.js` runs only in the mobile project, at a phone viewport. That's
  the only way to reach the TabBar and its drawer.
- Two recurring traps: **month view renders items as unlabelled dots**, so assert
  item titles in day or week view; and Playwright matches accessible names as
  *substrings* by default, so `'Join'` also matches `'Join Group'` — pass
  `exact: true` or anchor a regex.
- Every account is created with a "My to dos" list, and each list renders its name
  into four buttons. Scope to a `.list-section` rather than matching a bare name.
- Map tiles and OSRM routing are blocked for every test, so nothing depends on
  third-party uptime.
- **Asserting an image renders needs `naturalWidth`, not visibility.** A broken
  image and a working one have identical DOM, so `toBeVisible()` passes either
  way. See `images.spec.js`, which also shows how to drop a real file onto the
  editor — ProseMirror resolves the drop from the event's coordinates and never
  calls `handleDrop` if they default to 0,0.

**Not covered** — drag-and-drop reordering is exercised only where dnd-kit's
`KeyboardSensor` makes it deterministic. The page tree is pointer-only and the
calendar chips use native HTML5 drag, so those paths are covered through their
click-based equivalents (Reschedule, Push to tomorrow) instead.
