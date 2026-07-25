---
name: project-appprovider-tasks
description: How AppProvider manages tasks/lists state, refreshLists reconciliation, and where task color/icon come from — needed before touching task CRUD in src/store/AppProvider.jsx.
metadata:
  type: project
---

`src/store/AppProvider.jsx` is the single write surface for lists/tasks (via `addTask`,
`updateTask`, `deleteTask`, `toggleTaskStatus`). `src/hooks/usePlanItems.js` wraps it plus
`src/api/events.js` behind one `saveItem`/`deleteItem`/`moveItem` API so pages never see the
event-vs-task split (see the file's own header comment).

**`refreshLists()` does a full replace, not a merge**: `setTasks(perList.flat().map(adaptTask))`
overwrites the whole `tasks` array from server truth. This means any optimistic/local edit to
`tasks` gets naturally reconciled (dropped/replaced) the next time `refreshLists()` resolves —
no manual de-dupe needed as long as the optimistic entry doesn't share special-cased IDs with
the constants in `SYSTEM_LISTS`. `refreshLists()` is guarded by a ticket ref (`latestRefresh`)
so an older in-flight refresh can't clobber a newer one; it's called both after each mutation
and on `LIST_EVENTS` socket messages (`task:*`, `list:*`), so it fires more than once per
mutation by design.

**Task color/icon are NOT stored on the task** — `TaskRow` reads `task.colorKey`, which only
exists because `src/pages/ListsPage.jsx` (and likely `CalendarPage.jsx`) maps over tasks and
attaches it via `getTaskColorKey(task, lists, groups, personalSpace)` in `src/utils/tasks.js`
(looks up the task's list by `task.listId`, falls back to the list's group color). Any task
object built client-side (e.g. an optimistic row) must have a correct `listId` for this lookup
to work, or the row renders with no color class.

**`adaptTask`/`adaptItem`** (`src/api/adapters.js`) is the canonical shape for a task in FE
state: `{origin, id, sourceId, title, description, createdById, groupId, listId, status,
dueDate, scheduledStart, scheduledEnd, recurrenceRule, subtasks, assignedToId, assignedTo,
attachments, itineraryId}`. It can be called on a raw client-built object (not just server
JSON) to get sane defaults for a synthetic/optimistic row — see `addTask`'s temp-id row.

**Error surfacing convention**: no toast system exists. The established pattern is
`window.alert(...)` with a `// eslint-disable-next-line no-alert` comment directly above it
(see `ListsPage.jsx`, `CalendarPage.jsx`, and now `ListSection.jsx`'s quick-add failure path).
