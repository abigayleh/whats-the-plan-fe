---
name: project-planitem-unification
description: Phase-1 frontend unification of calendar events and to-do tasks into one PlanItem shape/modal — what shipped and the design decisions behind it.
metadata:
  type: project
---

Phase 1 (pure frontend, zero backend changes) of unifying events + to-dos into one
"PlanItem" concept shipped on branch `refactor/unify-plan-items` (commit
`refactor: unify events and to-dos into one PlanItem interface`). Events still persist
via `/api/events`, to-dos via `/api/lists/:id/tasks` — only the FE presentation layer
was unified.

**Why:** later Calendar and Lists work is meant to build on a single PlanItem interface
instead of parallel Task/Event code paths. Correctness of the recurrence occurrence/series
split and the drag-move event/todo asymmetry mattered more than speed for this change.

**How to apply:** when touching calendar or lists code, expect ONE data shape and ONE
write path now, not two:

- `src/api/adapters.js` — `adaptItem(raw, origin)` is the core; `adaptTask`/`adaptEvent`/
  `adaptCalendarTask` are thin wrappers. `origin: 'event'|'task'` replaced the old `isEvent`
  boolean and is persistence-routing-only, never a UI identity check. Every PlanItem carries
  both `id` (React-key/occurrence identity) and `sourceId` (real DB row id — always use this
  for writes). `toBeItem(patch, origin)` is the shared write-mapper; `toBeTask` is now just
  `toBeItem(patch, 'task')`.
- `src/hooks/usePlanItems.js` — the ONLY place `origin === 'event' ? eventsApi : (AppProvider
  task methods)` branching is allowed to live. Exposes `saveItem(item, payload)`,
  `deleteItem(item)`, `toggleStatus(item)`, `moveItem(item, {day,hour,minute,timed})`.
  `item` is `null` on create (payload must include `origin`); on edit it's the real
  row-level task (for to-dos) or the calendar occurrence (for events).
- `src/components/items/PlanItemModal.jsx` — replaced `calendar/EventModal.jsx` and
  `lists/TaskModal.jsx` (both deleted). Whether it's rendering as a to-do or a bare
  calendar event is decided by `isCalendarItem = isEdit ? item.origin==='event' : !listId`
  — i.e. during creation, picking "No list (calendar event)" in the List dropdown switches
  the whole form live (reveals Calendar/group select, hides subtasks/attachments/assignee/
  done-checkbox). Scope stays immutable on edit for both kinds, matching pre-refactor behavior.
- `CalendarPage.jsx` / `ListsPage.jsx` both call `usePlanItems` now; no page does its own
  `origin==='event'` branching for persistence, only for UI lookups (e.g. resolving the
  real row-level task via `tasks.find(t => t.id === item.sourceId)` before opening the
  edit modal, since calendar-occurrence to-dos are lighter payloads missing
  subtasks/attachments).
- Calendar content filter ('Events'/'To-Dos'/'Both' in `CalendarContentToggle`) now keys
  off `item.origin === 'event'` instead of the removed `isEvent` flag.

**Known follow-up (flagged for review, not fixed):** `PlanItemModal`'s List dropdown
always includes "No list (calendar event)" during creation regardless of which page opened
it, so it's technically possible to create a bare calendar event from the Lists page's
"Add task" flow (a minor UX quirk, not a data-integrity issue — `usePlanItems.saveItem`
routes correctly either way since it reads `payload.origin`).

See also [[css-naming]] if touched, and note the pre-existing inconsistency where the
modal literally says "New Task"/"Edit Task" while other UI (FAB labels, content toggle)
says "to-do" — left as-is since it predates this refactor and wasn't in scope.
