---
name: plan-item-gotchas
description: Specific correctness traps in the PlanItem/usePlanItems/PlanItemModal conversion flow — check these on any future touch of that code
metadata:
  type: project
---

Found while reviewing the `feat/event-conversion-overdue` branch (2026-07-17). Some are fixed by
the time you read this, some may still be open — verify against current code before citing.

- **`usePlanItems.saveItem(item, payload)` requires `payload.origin` to be set.** It computes
  `target = payload.origin` directly (no fallback to `item.origin`). Any caller that omits
  `origin` on an update-only payload (e.g. a "push to tomorrow" helper that just patches
  `dueDate`) will make `item.origin === target` false even though nothing is actually converting,
  and misroute into the create-then-delete conversion path with an incomplete payload (missing
  `listId`/`title`), which throws inside `addTask`/`eventsApi.create`. When reviewing any new
  caller of `saveItem`, grep for the payload literal and confirm `origin` is present — this is an
  easy regression to reintroduce.
- **Only event → task conversion is reachable through the UI.** `canBeCalendarEvent = !isEdit ||
  item.origin === 'event'` means an existing *task* never gets the "No list (calendar event)"
  option rendered, so `listId` can never be cleared back to `''` for a pre-existing task. Don't
  flag "task → event conversion loses groupId" as reachable — it's blocked by this gate. If that
  gate is ever loosened, re-check whether `buildPayload`'s `if (!savedItemRef.current)
  payload.groupId = ...` guard (which assumes "no saved item yet" ⇔ "actually creating") still
  holds — for a conversion, `savedItemRef.current` is non-null (the pre-conversion item) even
  though a brand-new entity is being created, so `groupId` would silently never be sent.
- **Partial-failure orphan on conversion:** `saveItem` does `create` then `if (item) await
  deleteItem(item)`. If the delete throws (create succeeded), the function throws before
  returning `{ item }`, so `savedItemRef.current` never updates to the new entity — leaving a
  live orphan on the backend that the modal has no reference to and can never clean up, while the
  user just sees a generic "could not save" error implying nothing happened.
- **`isTaskOverdue` (utils/tasks.js) ignores recurrence** — it only looks at `getTaskDay` (the
  task's *original* occurrence date), so a daily/weekly recurring task whose original start date
  is in the past is permanently "overdue" even on days it also recurs. This was a pre-existing
  quirk (used for a badge on `TaskRow`), but the overdue-lists feature (`ListsPage`'s `l-overdue`,
  `CalendarPage`'s `overdueTasks`) surfaces it more prominently and can cause the *same* recurring
  task to double-list in both "Overdue" and "Today"/"Due Today" simultaneously. Worth a product
  decision, not necessarily a blocking fix.
