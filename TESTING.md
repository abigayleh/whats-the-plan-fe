# Testing

Vitest + React Testing Library — **544 tests** covering the frontend.

## Commands

| Command | Does |
|---|---|
| `npm test` | Watch mode |
| `npm run test:run` | Run once (the gate) |
| `npm run coverage` | Coverage report (v8) |

## Structure

Tests are co-located next to the code they cover: `foo.js` → `foo.test.js`,
`Foo.jsx` → `Foo.test.jsx`. Shared helpers live in `src/test/`.

## What's covered

- **Unit** — every `src/utils/*` (date math, overlap layout, page-tree, task
  helpers), the `src/api` adapters, and `src/api/client.js` (token store,
  `apiFetch`, and the 401 → refresh → retry flow), plus all 19 hooks with mocked
  API and socket.
- **Component** — calendar, lists, itineraries, pages (rich-text), polls, chat,
  groups, auth, and shared UI, via React Testing Library: accessible queries
  (role/label/text), `userEvent`, and mocked data hooks + socket.

## Writing new tests

- Component tests: render with `renderWithRouter` from `src/test/utils`; query by
  role/label/text, never by test-id; use `userEvent` (await it).
- Mock collaborators with `vi.mock`: `../hooks/useAppData`, `../hooks/useAuth`,
  `../socket/socketClient`, and the relevant `../api/*` module.
- JSX in a test needs a `.test.jsx` extension — `.test.js` files aren't run
  through the JSX transform.
- Import `describe`/`it`/`expect`/`vi` from `vitest` to keep the linter clean.
- Test behaviour, not implementation.