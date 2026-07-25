---
name: pages-feature
description: Notion-style Pages feature (BE routes/pageAccess + FE PageEditor/PageDocument/TipTap) — architecture, verified-sound patterns, and one real bug found in the echo-suppression heuristic
metadata:
  type: project
---

Reviewed 2026-07-19 (BE commit `81edca5` on `whats-the-plan-be` master — no `feat/pages`
branch exists there, it was merged straight to master; FE branch `feat/pages` in
`whats-the-plan-fe`, 3 commits, not yet merged).

**Architecture**: BE `src/routes/pages.js` + `src/lib/pageAccess.js` mirror the
Lists/Tasks scope model (`groupId` null = private/owner-only, else member-to-view,
owner-or-ADMIN-to-manage via `canManage`). FE mirrors the same rule client-side in
`PagesPage.jsx`'s `canManagePage` purely for UI gating — backend is the real
enforcement point, correctly re-checked on every route.

**Verified sound (don't re-flag)**:
- `loadPageAccess`/`resolveParent`/`wouldCycle` in `pageAccess.js` — no scope leak,
  groupId immutable on PATCH, parent-must-be-same-scope enforced, self/descendant
  cycle detection on move is correct.
- DELETE handler reparents direct children inside a `$transaction` before deleting —
  correctly avoids the `Page_parentId_fkey ON DELETE NO ACTION` constraint violation,
  and grandchildren are never touched/orphaned (their `parentId` FK still points at
  the reparented child, which keeps its own id).
- `useDebouncedCallback` (`src/hooks/useDebouncedCallback.js`) passes save args
  (`id`, `content`) as call-time arguments, not closed-over state — switching pages
  fast does NOT misdirect a save to the wrong pageId, because the pending debounce
  always fires with the args captured when `persist(pageId, content)` was called.
- `suggestionRender.js` (TipTap `/` and `@` popups) — confirmed via
  `node_modules/@tiptap/suggestion` source that the plugin calls `onExit` (which
  triggers `cleanup()`) both on normal suggestion-exit and on plugin/editor destroy —
  no DOM/ReactRenderer leak when switching pages while a popup is open.
- Dependencies: `@tiptap/extension-list` (imported directly by `PageDocument.jsx`
  but not in `package.json`) IS correctly present in `package-lock.json` as part of
  `@tiptap/starter-kit`'s tree — verified with `npm ci` + `npm run build` + `npm run
  lint` against an actual checkout of `feat/pages` (not just `git diff`), all green.
  **Gotcha for future reviews**: this repo uses shared worktrees under
  `.claude/worktrees/*` with a symlinked `node_modules`; running `npm ci`/`npm run
  build` from a worktree checked out to a *different* branch than the one under
  review silently validates the wrong tree. Always confirm `git branch
  --show-current` matches the branch being reviewed, or check out the target branch
  into a scratch worktree first.

**Real bug found (reported, not yet fixed as of this review)**: in
`src/components/pages/PageEditor.jsx`, the content-autosave path sets
`lastSave.current = Date.now()` *after* `await saveContent(id, content)` resolves,
whereas the title-save and move paths set it *before* the request. Since the backend
emits the `page:updated` socket event before sending the HTTP response, the echo can
arrive and be checked against a stale `lastSave.current` before it's updated —
risking a false "this page changed elsewhere" banner on the user's own content
autosave. Fix: set `lastSave.current = Date.now()` before calling `saveContent`,
matching the other two call sites.

See [[architecture]] for the unrelated PlanItem (events/to-dos) system — Pages is a
separate, independent feature/data model, no overlap.
